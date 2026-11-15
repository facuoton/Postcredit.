# Postcredit

**Un archivo personal para lo que queda después.**

Postcredit es una aplicación para guardar y reseñar películas, libros, música, videojuegos, museos, restaurantes, viajes y otras experiencias. Cada recuerdo tiene su propia puntuación, sus palabras y, si querés, sus fotos.

## Funcionalidades

- Crear una cuenta e iniciar sesión.
- Guardar, editar, buscar y eliminar reseñas personales.
- Puntuar cada experiencia del 1 al 10, con medios puntos e íconos propios de cada categoría.
- Agregar una fecha y hasta cinco fotos a cada reseña.
- Invitar personas a **Mi círculo** y elegir qué reseñas compartir con las conexiones aceptadas.

Las reseñas son privadas al crearse. Su autor puede compartirlas con su círculo o volver a hacerlas privadas cuando quiera.

## Tecnologías

- **Frontend:** HTML, CSS y JavaScript.
- **Backend:** Node.js y Express, organizado por capas.
- **Base de datos:** MongoDB Atlas y Mongoose.
- **Autenticación:** JSON Web Tokens y bcryptjs.

## Ejecutar localmente

Se necesita Node.js 22 y una base de datos MongoDB accesible.

1. Instalá las dependencias:

   ```bash
   npm --prefix back install
   ```

2. Copiá `back/.env.example` a `back/.env` y configurá `MONGODB_URI` y `JWT_SECRET` con tus propios valores.
3. Iniciá la aplicación:

   ```bash
   npm --prefix back run dev
   ```

4. Abrí `http://localhost:3000` o el puerto que hayas configurado en `.env`.

El servidor sirve la interfaz y la API desde el mismo origen. Para ejecutar las pruebas:

```bash
npm --prefix back test
```

## Estructura

```text
postcredit/
├── back/       API, modelos, servicios, rutas y pruebas
├── front/      Interfaz y recursos visuales
└── render.yaml Configuración de despliegue en Render
```

Postcredit es un proyecto académico desarrollado para Programación 2.
