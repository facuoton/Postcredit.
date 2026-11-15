import mongoose from 'mongoose';
import { IDS_CATEGORIAS } from '../categorias.mjs';
import * as resenas from '../repositories/resenas.repository.js';
import { sonAmigos } from './invitaciones.service.js';
import { errorCon } from '../utils/errores.js';

export function validar(datos) {
  const titulo = typeof datos.titulo === 'string' ? datos.titulo.trim() : '';
  const texto = typeof datos.texto === 'string' ? datos.texto.trim() : '';
  const categoria = datos.categoria;
  const puntuacion = datos.puntuacion;
  const visibilidad = datos.visibilidad ?? 'privada';
  if (!titulo || !texto) throw errorCon(400, 'Completá título y reseña.');
  if (!IDS_CATEGORIAS.includes(categoria)) throw errorCon(400, 'Elegí una categoría válida.');
  if (typeof puntuacion !== 'number' || !Number.isInteger(puntuacion * 2) || puntuacion < 1 || puntuacion > 10) throw errorCon(400, 'La puntuación debe estar entre 1 y 10, en pasos de 0,5.');
  if (!['privada', 'circulo'].includes(visibilidad)) throw errorCon(400, 'Elegí una visibilidad válida.');
  const fotos = datos.fotos ?? [];
  if (!Array.isArray(fotos) || fotos.length > 5) throw errorCon(400, 'Podés agregar hasta 5 fotos.');
  for (const foto of fotos) {
    if (typeof foto !== 'string' || foto.length > 1400000 || !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(foto)) throw errorCon(400, 'Una foto no es válida o supera el tamaño permitido.');
    const bytes = Buffer.from(foto.slice('data:image/jpeg;base64,'.length), 'base64');
    if (bytes.length > 1024 * 1024 || bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) throw errorCon(400, 'Una foto no es válida o supera el tamaño permitido.');
  }
  const limpios = { titulo, tituloNormalizado: titulo.normalize('NFC').toLocaleLowerCase('es'), categoria, puntuacion, texto, visibilidad, fotos };
  if (datos.fechaExperiencia === null || datos.fechaExperiencia === '') limpios.fechaExperiencia = null;
  else if (datos.fechaExperiencia) {
    const fecha = new Date(datos.fechaExperiencia);
    if (Number.isNaN(fecha.getTime())) throw errorCon(400, 'La fecha no es válida.');
    limpios.fechaExperiencia = fecha;
  }
  return limpios;
}

async function buscar(id) {
  if (!mongoose.isValidObjectId(id)) throw errorCon(404, 'Reseña no encontrada.');
  const resena = await resenas.buscar(id);
  if (!resena) throw errorCon(404, 'Reseña no encontrada.');
  return resena;
}
export const listarPropias = (usuario) => resenas.listarPropias(usuario);
export async function listarDeAmigo(usuario, amigo) {
  if (!mongoose.isValidObjectId(amigo) || usuario === amigo || !(await sonAmigos(usuario, amigo))) throw errorCon(403, 'Solo podés ver reseñas de conexiones aceptadas.');
  return resenas.listarCompartidas(amigo);
}
export async function obtener(id, usuario) {
  const resena = await buscar(id);
  if (String(resena.usuario) !== usuario && (resena.visibilidad !== 'circulo' || !(await sonAmigos(usuario, resena.usuario)))) throw errorCon(403, 'No tenés acceso a esta reseña.');
  return resena;
}
export async function crear(datos, usuario) {
  // La primera versión siempre es privada; compartir requiere una edición posterior.
  return resenas.guardar({ ...validar({ ...datos, visibilidad: 'privada' }), usuario });
}
export async function editar(id, datos, usuario) {
  const original = await buscar(id);
  if (String(original.usuario) !== usuario) throw errorCon(403, 'Solo el dueño puede editar esta reseña.');
  // No perder visibilidad ni fecha cuando solo se cambian algunos campos.
  const actualizados = validar({ ...original.toObject(), ...datos });
  const actualizada = await resenas.actualizar(id, usuario, actualizados);
  if (!actualizada) throw errorCon(404, 'Reseña no encontrada.');
  return actualizada;
}
export async function eliminar(id, usuario) {
  const original = await buscar(id);
  if (String(original.usuario) !== usuario) throw errorCon(403, 'Solo el dueño puede eliminar esta reseña.');
  const eliminada = await resenas.eliminar(id, usuario);
  if (!eliminada) throw errorCon(404, 'Reseña no encontrada.');
}
