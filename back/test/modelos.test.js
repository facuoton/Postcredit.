import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { Usuario } from '../models/usuario.js';
import { Resena } from '../models/resena.js';
import { Invitacion } from '../models/invitacion.js';
import { IDS_CATEGORIAS } from '../categorias.mjs';

const usuarioId = new mongoose.Types.ObjectId();
const datosValidos = {
  titulo: 'Una película para recordar',
  tituloNormalizado: 'una película para recordar',
  categoria: 'peliculas',
  puntuacion: 7,
  texto: 'Me gustó y quiero volver a verla.',
  usuario: usuarioId
};

test('acepta todas las categorías acordadas', async () => {
  for (const categoria of IDS_CATEGORIAS) {
    await new Resena({ ...datosValidos, categoria }).validate();
  }
});

test('rechaza categorías ajenas a la lista y puntuaciones fuera de 1 a 10 o con pasos distintos de medio punto', async () => {
  for (const cambios of [
    { categoria: 'podcasts' },
    { puntuacion: 0 },
    { puntuacion: 11 },
    { puntuacion: 7.3 }
  ]) {
    await assert.rejects(new Resena({ ...datosValidos, ...cambios }).validate());
  }
});

test('exige título, reseña y dueño', async () => {
  for (const campo of ['titulo', 'texto', 'usuario']) {
    await assert.rejects(new Resena({ ...datosValidos, [campo]: undefined }).validate());
  }
  await assert.rejects(new Resena({ ...datosValidos, titulo: '   ' }).validate());
});

test('normaliza el correo y requiere datos del usuario', async () => {
  const usuario = new Usuario({ nombre: ' Facundo ', email: ' FACU@EJEMPLO.COM ', passwordHash: 'hash-de-prueba' });
  await usuario.validate();
  assert.equal(usuario.nombre, 'Facundo');
  assert.equal(usuario.email, 'facu@ejemplo.com');
  await assert.rejects(new Usuario({ nombre: 'Facundo' }).validate());
});

test('una reseña es privada por defecto y solo admite visibilidades previstas', async () => {
  const resena = new Resena(datosValidos);
  assert.equal(resena.visibilidad, 'privada');
  resena.visibilidad = 'circulo';
  await resena.validate();
  resena.visibilidad = 'publica';
  await assert.rejects(resena.validate());
  resena.visibilidad = 'privada';
  await resena.validate();
});

test('una invitación empieza pendiente y no puede dirigirse al mismo usuario', async () => {
  const invitacion = new Invitacion({ pareja: 'par-de-prueba', remitente: usuarioId, destinatario: new mongoose.Types.ObjectId() });
  assert.equal(invitacion.estado, 'pendiente');
  await invitacion.validate();
  invitacion.estado = 'aceptada';
  await invitacion.validate();
  invitacion.destinatario = usuarioId;
  await assert.rejects(invitacion.validate());
});
