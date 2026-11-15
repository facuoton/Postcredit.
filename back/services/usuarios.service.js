import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as usuarios from '../repositories/usuarios.repository.js';
import { errorCon } from '../utils/errores.js';

function datosPublicos(usuario) {
  return { id: usuario._id, nombre: usuario.nombre, email: usuario.email };
}

export async function registrar(datos) {
  const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : '';
  const email = typeof datos.email === 'string' ? datos.email.trim().toLowerCase() : '';
  const password = datos.password;
  if (!nombre || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    throw errorCon(400, 'Completá nombre, correo válido y contraseña de al menos 8 caracteres (máximo 72 bytes).');
  }
  if (await usuarios.buscarPorEmail(email)) throw errorCon(409, 'Ya existe una cuenta con ese correo.');
  const passwordHash = await bcrypt.hash(password, 10);
  const usuario = await usuarios.guardar({ nombre, email, passwordHash });
  return iniciarSesion(usuario);
}

function iniciarSesion(usuario) {
  const token = jwt.sign({ id: usuario._id.toString() }, process.env.JWT_SECRET, { expiresIn: '2h' });
  return { token, usuario: datosPublicos(usuario) };
}

export async function login(datos) {
  const email = typeof datos.email === 'string' ? datos.email.trim().toLowerCase() : '';
  const password = typeof datos.password === 'string' ? datos.password : '';
  if (!email || !password) throw errorCon(400, 'Completá correo y contraseña.');
  if (Buffer.byteLength(password, 'utf8') > 72) throw errorCon(401, 'Correo o contraseña incorrectos.');
  const usuario = await usuarios.buscarPorEmail(email);
  if (!usuario || !(await bcrypt.compare(password, usuario.passwordHash))) throw errorCon(401, 'Correo o contraseña incorrectos.');
  return iniciarSesion(usuario);
}

export async function obtener(id) {
  const usuario = await usuarios.buscarPorId(id);
  if (!usuario) throw errorCon(404, 'No encontramos esa cuenta.');
  return datosPublicos(usuario);
}
