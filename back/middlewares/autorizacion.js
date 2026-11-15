import jwt from 'jsonwebtoken';

export function pedirToken(req, res, next) {
  const partes = (req.headers.authorization || '').split(' ');
  if (partes.length !== 2 || partes[0] !== 'Bearer' || !partes[1]) {
    return res.status(401).json({ mensaje: 'Ingresá con tu cuenta para continuar.' });
  }
  try {
    const datos = jwt.verify(partes[1], process.env.JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof datos.id !== 'string') throw new Error('Token inválido');
    req.usuario = { id: datos.id };
    return next();
  } catch {
    return res.status(401).json({ mensaje: 'La sesión no es válida o venció.' });
  }
}
