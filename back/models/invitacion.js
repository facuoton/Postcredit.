import mongoose from 'mongoose';

// Una conexión nace como invitación; aceptarla será una acción del destinatario.
const invitacionSchema = new mongoose.Schema({
  pareja: { type: String, required: true, unique: true, select: false },
  remitente: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  destinatario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
    validate: {
      validator: function (destinatario) {
        return !this.remitente || !destinatario || !this.remitente.equals(destinatario);
      },
      message: 'No podés invitarte a vos mismo.'
    }
  },
  estado: { type: String, enum: ['pendiente', 'aceptada'], default: 'pendiente', required: true },
  fechaDeCreacion: { type: Date, default: Date.now }
});

export const Invitacion = mongoose.model('Invitacion', invitacionSchema);
