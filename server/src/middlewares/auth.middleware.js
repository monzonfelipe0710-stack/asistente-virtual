import jwt from 'jsonwebtoken';

export const authent = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const error= new Error('No autorizado: falta el token.');
    error.statusCode = 401;
    throw error;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload;
    next();
  } catch {
    const error = new Error('No autorizado: token inválido o expirado.');
    error.statusCode = 401;
    throw error;
  }
};