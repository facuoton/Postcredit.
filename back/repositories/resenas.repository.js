import { Resena } from '../models/resena.js';

export const listarPropias = (usuario) => Resena.find({ usuario }).sort({ fechaDeCreacion: -1 });
export const listarCompartidas = (usuario) => Resena.find({ usuario, visibilidad: 'circulo' }).sort({ fechaDeCreacion: -1 });
export const buscar = (id) => Resena.findById(id);
export const guardar = (datos) => Resena.create(datos);
export const actualizar = (id, usuario, datos) => Resena.findOneAndUpdate({ _id: id, usuario }, datos, { returnDocument: 'after', runValidators: true });
export const eliminar = (id, usuario) => Resena.findOneAndDelete({ _id: id, usuario });
