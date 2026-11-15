# Postcredit — inicio del desarrollo

El profesor aprobó la idea, revisó el prototipo de Figma y autorizó el comienzo del trabajo, según informó Facundo el 11/11/2026.

Hay una primera API en `back/` con registro, acceso, reseñas e invitaciones y un frontend inicial en `front/`. Se probaron flujos principales de la API por HTTP contra Atlas; el frontend todavía requiere verificación visual y pruebas completas de interacción. La escala es de 1 a 10; no hay ranking general mezclando categorías.

## Fotos en reseñas

Cada reseña admite hasta cinco fotos opcionales. El navegador acepta JPG, PNG y WebP, las reduce y convierte a JPEG antes de enviarlas; se guardan en MongoDB dentro de la reseña, con un máximo de 1 MB por imagen procesada. Al editar se pueden quitar o agregar fotos. Heredan la privacidad y permisos de la reseña. Al crecer el volumen de datos convendrá evaluar almacenamiento de archivos externo, consultando al docente por cualquier biblioteca adicional.

## Círculo íntimo

Cada reseña comienza privada. Su autor podrá cambiarla entre privada y compartida con el círculo cuantas veces quiera. Compartida no significa pública en internet: solo la ven las personas cuya invitación fue aceptada. Las conexiones se proponen mediante invitación y aceptación; no hay feed público, likes ni comentarios en el alcance inicial.

Las rutas y servicios verifican el token, restringen la aceptación al destinatario y la edición/eliminación al dueño, y comprueban la conexión aceptada antes de permitir leer una reseña compartida. Una reseña nueva se crea privada y después su dueño puede cambiarla. Los índices únicos buscan impedir invitaciones duplicadas o cruzadas. El 13/11 se realizaron 28 verificaciones HTTP contra Atlas con tres cuentas temporales, que luego se eliminaron: se comprobaron los flujos principales de registro, duplicados, invitaciones y privacidad, sin cubrir todas las situaciones posibles.

Para comprobar las definiciones desde este directorio:

```sh
node --input-type=module -e "import { CATEGORIAS, IDS_CATEGORIAS } from './back/categorias.mjs'; console.table(CATEGORIAS); console.log('Categorías:', IDS_CATEGORIAS.length)"
```

## Próximo orden de trabajo

1. Revisar visualmente el frontend inicial en escritorio y móvil y probar sus recorridos completos con usuarios reales de prueba.
2. Revisar visualmente los íconos de puntuación por categoría en el formulario y los archivos, completar los demás componentes del Figma y ampliar las pruebas de privacidad y errores.
3. Preparar documentación, anexo de IA, pruebas y publicación.

Rodrigo confirmó que Express, Mongoose, cors, dotenv, bcryptjs, jsonwebtoken y nodemon son parte del curso y pueden usarse. Cualquier otra biblioteca debe consultarse.

### Probar los modelos

Desde `postcredit/back`, ejecutar `npm install` y luego `npm test`. Las pruebas validan documentos en memoria y servicios con repositorios simulados: no requieren Atlas y no prueban todavía la API completa por HTTP ni la persistencia.

`Usuario` guarda nombre, correo normalizado y el hash de la contraseña. `Resena` guarda título, categoría, nota entre 1 y 10 en pasos de medio punto, texto, visibilidad y referencia al dueño, que sale del token verificado. Los índices únicos protegen el correo, la pareja de usuarios y el título normalizado dentro de la categoría y cuenta; el servidor espera su creación al iniciar. Se comprobó el rechazo de correo y reseña duplicados contra Atlas.

### Iniciar con MongoDB Atlas

Dentro de `back`, copiar `.env.example` a `.env` y completar `MONGODB_URI` con la cadena de conexión propia y `JWT_SECRET` con un secreto largo y aleatorio. No enviar estas credenciales por chat ni subir `.env` a GitHub. Ejecutar `npm install` y `npm run dev`. El servidor se conecta a Atlas antes de abrir el puerto; si falla, revisar la cadena de conexión y el acceso de red en Atlas. `GET /salud` comprueba que el servidor responde.

El cluster se llama `ClusterPostcredit` y el usuario de base de datos es `facuoton_db_user`. El `.env` local está configurado y se verificó la conexión. La contraseña y el secreto JWT permanecen en `.env`, no en este documento.

### Preparación para Render

La API está preparada para ejecutarse como **Web Service** con Node.js 22. Render proporciona `PORT`; el servidor escucha en `0.0.0.0` y expone `GET /salud`. El servicio y el repositorio todavía deben configurarse; no hay despliegue verificado.

Al crear el servicio desde el repositorio, configurar como directorio raíz la carpeta `postcredit` relativa a la raíz de ese repositorio (o dejarla vacía si el repositorio ya tiene `postcredit` como raíz). Usar `npm --prefix back ci` como comando de instalación, `npm --prefix back start` para iniciar y `/salud` como ruta de verificación. El servidor sirve `front/` y la API desde el mismo origen. Agregar `MONGODB_URI` y `JWT_SECRET` en Environment de Render, sin subir `.env`. No fijar `PORT`: Render lo proporciona.

Atlas tiene habilitado el acceso desde cualquier IP según la configuración indicada por el equipo. Render se conecta desde otras IP. Una vez creado el servicio, consultar en Render **Connect → Outbound** y agregar sus rangos a la lista de acceso de red del proyecto de Atlas; no asumir que la IP local cubre al servidor. Después comprobar los logs y `https://<servicio>.onrender.com/salud`, y probar el acceso real a la base. En el plan gratuito, el servidor se suspende tras 15 minutos sin tráfico y puede demorar al reactivarse.

Rutas principales: `POST /usuarios/registro`, `POST /usuarios/login`, `GET /usuarios/yo`; `GET/POST /resenas`, `GET/PATCH/DELETE /resenas/:id`, `GET /resenas/circulo/:usuarioId`; `GET/POST /invitaciones`, `PATCH /invitaciones/:id/aceptar`, `DELETE /invitaciones/:id`. Las rutas de reseñas e invitaciones requieren `Authorization: Bearer <token>`. El registro también devuelve token para entrar al archivo inmediatamente, como pide la letra.

## Defensa y uso de IA

Cada avance debe poder explicarse y probarse: qué problema resuelve, cómo fluye la información y qué validaciones se hicieron. Registrar herramientas, prompts y código generado con IA para el anexo exigido por la letra; el estudiante debe revisar y comprender el resultado. La entrega individual adicional solo corresponde si trabajan en equipo de dos.
