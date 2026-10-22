export const errorHandler = (err, req, res, next) => {
  if (err.name === 'ZodError') {
    return res.status(400).json({ error: err.issues[0].message });
  }

  // Errores propios de multer (tamaño excedido, campo de archivo inesperado, etc.).
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const esImagen = req.originalUrl?.startsWith('/api/chat');
      return res.status(413).json({
        error: esImagen
          ? 'La imagen no puede superar los 8 MB.'
          : 'El archivo supera el tamaño máximo de 10 MB.',
      });
    }
    return res.status(400).json({ error: 'Archivo inválido o enviado en un campo incorrecto.' });
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

  // Las FK con ON DELETE RESTRICT (trámites → sector, trámites → encargado) hacen que
  // Postgres responda 23001 en vez de 23503. Prisma no lo traduce a P2003: llega
  // como error desconocido y solo se puede reconocer por el código en el mensaje.
  if (err.name === 'PrismaClientUnknownRequestError' && err.message.includes('23001')) {
    return res.status(409).json({ error: 'No se puede eliminar: tiene registros asociados.' });
  }

  console.error('Error inesperado:', err);
  res.status(500).json({ error: 'Error del servidor.'});
};
