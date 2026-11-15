import { Usuario } from '../models/usuario.js';

export const buscarPorEmail = (email) => Usuario.findOne({ email }).select('+passwordHash');
export const buscarPorId = (id) => Usuario.findById(id).select('nombre email');
export const guardar = (datos) => Usuario.create(datos);
