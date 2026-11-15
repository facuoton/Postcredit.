import { Invitacion } from '../models/invitacion.js';

export const buscarPareja = (pareja) => Invitacion.findOne({ pareja });
export const buscar = (id) => Invitacion.findById(id);
export const guardar = (datos) => Invitacion.create(datos);
export const listar = (id) => Invitacion.find({ $or: [{ remitente: id }, { destinatario: id }] }).populate('remitente destinatario', 'nombre');
export const aceptar = (id, destinatario) => Invitacion.findOneAndUpdate({ _id: id, destinatario, estado: 'pendiente' }, { estado: 'aceptada' }, { returnDocument: 'after' });
export const eliminar = (id, usuario) => Invitacion.findOneAndDelete({ _id: id, $or: [{ remitente: usuario }, { destinatario: usuario }] });
