import mongoose from 'mongoose';
import * as invitaciones from '../repositories/invitaciones.repository.js';
import * as usuarios from '../repositories/usuarios.repository.js';
import { errorCon } from '../utils/errores.js';

export function parejaDe(a, b) { return [String(a), String(b)].sort().join(':'); }
export async function sonAmigos(a, b) {
  const invitacion = await invitaciones.buscarPareja(parejaDe(a, b));
  return invitacion?.estado === 'aceptada';
}
export async function crear(remitente, email) {
  if (typeof email !== 'string' || !email.trim()) throw errorCon(400, 'Indicá el correo de la persona.');
  const destinatario = await usuarios.buscarPorEmail(email.trim().toLowerCase());
  if (!destinatario) throw errorCon(404, 'No encontramos esa cuenta.');
  if (String(destinatario._id) === remitente) throw errorCon(400, 'No podés invitarte a vos mismo.');
  const pareja = parejaDe(remitente, destinatario._id);
  if (await invitaciones.buscarPareja(pareja)) throw errorCon(409, 'Ya existe una invitación o conexión entre estas cuentas.');
  return invitaciones.guardar({ remitente, destinatario: destinatario._id, pareja });
}
export async function aceptar(id, usuario) {
  if (!mongoose.isValidObjectId(id)) throw errorCon(404, 'Invitación no encontrada.');
  const invitacion = await invitaciones.buscar(id);
  if (!invitacion) throw errorCon(404, 'Invitación no encontrada.');
  if (String(invitacion.destinatario) !== usuario) throw errorCon(403, 'Solo la persona invitada puede aceptar.');
  const aceptada = await invitaciones.aceptar(id, usuario);
  if (!aceptada) throw errorCon(409, 'La invitación ya no está pendiente.');
  return aceptada;
}
export const listar = (usuario) => invitaciones.listar(usuario);
export async function eliminar(id, usuario) {
  if (!mongoose.isValidObjectId(id)) throw errorCon(404, 'Invitación no encontrada.');
  const resultado = await invitaciones.eliminar(id, usuario);
  if (!resultado) throw errorCon(404, 'Invitación no encontrada.');
}
