import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { Resena } from '../models/resena.js';
import { Invitacion } from '../models/invitacion.js';
import { obtener, crear, editar, eliminar, validar } from '../services/resenas.service.js';
import { parejaDe, aceptar } from '../services/invitaciones.service.js';

const dueno = new mongoose.Types.ObjectId().toString();
const amigo = new mongoose.Types.ObjectId().toString();
const resenaId = new mongoose.Types.ObjectId().toString();
const invitacionId = new mongoose.Types.ObjectId().toString();

test('la clave de conexión es igual independientemente de quién invitó', () => {
  assert.equal(parejaDe(dueno, amigo), parejaDe(amigo, dueno));
});

test('valida en el service categorías y puntuación y normaliza el título', () => {
  const datos = { titulo: '  Mi Película  ', categoria: 'peliculas', puntuacion: 7, texto: 'Me gustó' };
  assert.equal(validar(datos).tituloNormalizado, 'mi película');
  assert.equal(validar({ ...datos, puntuacion: 7.5 }).puntuacion, 7.5);
  for (const cambio of [{ categoria: 'inexistente' }, { puntuacion: 0 }, { puntuacion: 11 }, { puntuacion: 7.3 }]) {
    assert.throws(() => validar({ ...datos, ...cambio }), { status: 400 });
  }
});

test('solo una conexión aceptada puede leer una reseña compartida, nunca una privada', async (t) => {
  let visibilidad = 'privada';
  let estado = 'aceptada';
  t.mock.method(Resena, 'findById', async () => ({ usuario: dueno, visibilidad }));
  t.mock.method(Invitacion, 'findOne', async () => estado ? { estado } : null);
  await assert.rejects(obtener(resenaId, amigo), { status: 403 });
  visibilidad = 'circulo';
  estado = 'pendiente';
  await assert.rejects(obtener(resenaId, amigo), { status: 403 });
  estado = null;
  await assert.rejects(obtener(resenaId, amigo), { status: 403 });
  estado = 'aceptada';
  assert.equal((await obtener(resenaId, amigo)).visibilidad, 'circulo');
  visibilidad = 'privada';
  assert.equal((await obtener(resenaId, dueno)).visibilidad, 'privada');
});

test('una conexión no puede editar ni eliminar la reseña ajena', async (t) => {
  t.mock.method(Resena, 'findById', async () => ({ usuario: dueno, visibilidad: 'circulo' }));
  await assert.rejects(editar(resenaId, { visibilidad: 'circulo' }, amigo), { status: 403 });
  await assert.rejects(eliminar(resenaId, amigo), { status: 403 });
});

test('una nueva reseña es privada y su dueño proviene del usuario autenticado', async (t) => {
  t.mock.method(Resena, 'create', async (datos) => datos);
  const creada = await crear({ titulo: 'Libro', categoria: 'libros', puntuacion: 8, texto: 'Me gustó', usuario: amigo, visibilidad: 'circulo' }, dueno);
  assert.equal(creada.usuario, dueno);
  assert.equal(creada.visibilidad, 'privada');
});

test('solo la persona invitada puede aceptar', async (t) => {
  t.mock.method(Invitacion, 'findById', async () => ({ remitente: dueno, destinatario: amigo, estado: 'pendiente' }));
  t.mock.method(Invitacion, 'findOneAndUpdate', async () => ({ estado: 'aceptada' }));
  await assert.rejects(aceptar(invitacionId, dueno), { status: 403 });
  assert.equal((await aceptar(invitacionId, amigo)).estado, 'aceptada');
});

test('acepta hasta cinco fotos y rechaza formatos o tamaños inválidos', () => {
  const datos = { titulo: 'Recuerdo', categoria: 'viajes', puntuacion: 8, texto: 'Un lugar especial' };
  const foto = 'data:image/jpeg;base64,/9j/2Q==';
  assert.deepEqual(validar({ ...datos, fotos: Array(5).fill(foto) }).fotos, Array(5).fill(foto));
  for (const fotos of [Array(6).fill(foto), ['data:image/png;base64,/9j/2Q=='], ['data:image/jpeg;base64,AAAA'], 'incorrecto']) {
    assert.throws(() => validar({ ...datos, fotos }), { status: 400 });
  }
});
