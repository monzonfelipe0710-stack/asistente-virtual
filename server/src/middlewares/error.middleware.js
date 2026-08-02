export const errorHandler = (err, req, res, next) => {
  if (err.name === 'ZodError') {
    return res.status(400).json({ error: err.issues[0].message });
  }

  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  console.error('Error inesperado:', err);
  res.status(500).json({ error: 'Error del servidor.'});
};