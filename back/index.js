import 'dotenv/config';
import mongoose from 'mongoose';
import { app } from './app.js';

if (!process.env.MONGODB_URI || !process.env.JWT_SECRET || process.env.JWT_SECRET === 'CAMBIAR_POR_UN_SECRETO_LARGO_Y_ALEATORIO') {
  console.error('Configurá MONGODB_URI y JWT_SECRET en el archivo .env.');
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGODB_URI);
  // Esperar índices únicos evita aceptar duplicados antes de que estén listos.
  await Promise.all(Object.values(mongoose.models).map((modelo) => modelo.init()));
  const puerto = process.env.PORT || 3000;
  app.listen(puerto, '0.0.0.0', () => console.log('Postcredit escucha en el puerto ' + puerto));
} catch (error) {
  console.error('No se pudo iniciar Postcredit:', error.message);
  process.exit(1);
}
