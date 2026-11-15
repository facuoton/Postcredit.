// Los controladores traducen la petición HTTP a llamadas a los servicios.
export const ejecutar = (fn, estado = 200) => async (req, res, next) => {
  try {
    const resultado = await fn(req);
    return res.status(estado).json(resultado ?? { mensaje: 'Operación completada.' });
  } catch (error) { return next(error); }
};
