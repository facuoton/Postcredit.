import mongoose from 'mongoose';
import { IDS_CATEGORIAS } from '../categorias.mjs';

// El usuario es obligatorio: cada experiencia pertenece a una cuenta.
const resenaSchema = new mongoose.Schema({
  titulo: { type: String, required: true, trim: true },
  tituloNormalizado: { type: String, required: true, select: false },
  categoria: { type: String, required: true, enum: IDS_CATEGORIAS },
  puntuacion: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    validate: {
      validator: value => Number.isInteger(value * 2),
      message: 'La puntuación debe avanzar de medio en medio.'
    }
  },
  texto: { type: String, required: true, trim: true },
  fotos: { type: [String], default: [], validate: { validator: fotos => fotos.length <= 5, message: 'Podés agregar hasta 5 fotos.' } },
  // El autor podrá cambiarla después; nunca implica acceso público en internet.
  visibilidad: { type: String, enum: ['privada', 'circulo'], default: 'privada', required: true },
  fechaExperiencia: { type: Date },
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  fechaDeCreacion: { type: Date, default: Date.now }
});

resenaSchema.index({ usuario: 1, categoria: 1, tituloNormalizado: 1 }, { unique: true });

export const Resena = mongoose.model('Resena', resenaSchema);
