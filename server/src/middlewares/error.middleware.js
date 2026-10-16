export const errorHandler = (err, req, res, next) => {
  if (err.name === 'ZodError') {
    return res.status(400).json({ error: err.issues[0].message });
  }

  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Argumentos mal formados (por ejemplo, un id que no es numérico).
  if (err.name === 'PrismaClientValidationError') {
    return res.status(400).json({ error: 'Parámetros inválidos.' });
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    switch (err.code) {
      case 'P2002':
        return res.status(409).json({ error: 'Ya existe un registro con esos datos.' });
      case 'P2025':
        return res.status(404).json({ error: 'El registro no existe.' });
      case 'P2003':
        return req.method === 'DELETE'
          ? res.status(409).json({ error: 'No se puede eliminar: tiene registros asociados.' })
          : res.status(400).json({ error: 'La referencia indicada no existe.' });
    }
  }

  console.error('Error inesperado:', err);
  res.status(500).json({ error: 'Error del servidor.'});
};
