import mongoose from 'mongoose';

// El hash se guardará aquí cuando implementemos el registro real.
// Nunca se debe guardar ni devolver una contraseña en texto plano.
const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true },
  passwordHash: { type: String, required: true, select: false },
  fechaDeCreacion: { type: Date, default: Date.now }
});

export const Usuario = mongoose.model('Usuario', usuarioSchema);
