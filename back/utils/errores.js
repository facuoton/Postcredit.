export function errorCon(status, mensaje) {
  const error = new Error(mensaje);
  error.status = status;
  return error;
}

export function responderError(error, req, res, next) {
  if (error.type === 'entity.too.large') return res.status(413).json({ mensaje: 'Las fotos superan el tamaño permitido.' });
  if (error.code === 11000) return res.status(409).json({ mensaje: 'El registro ya existe.' });
  if (error.name === 'ValidationError' || error.name === 'CastError' || error.type === 'entity.parse.failed') {
    return res.status(400).json({ mensaje: 'Los datos enviados no son válidos.' });
  }
  if (!error.status) console.error(error);
  return res.status(error.status || 500).json({ mensaje: error.status ? error.message : 'Ocurrió un error en el servidor.' });
}
