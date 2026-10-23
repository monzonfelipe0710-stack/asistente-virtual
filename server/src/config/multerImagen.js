import multer from 'multer';

const TIPOS_IMAGEN_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];

export const uploadImagen = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (TIPOS_IMAGEN_PERMITIDOS.includes(file.mimetype)) {
      return callback(null, true);
    }

    const error = new Error('El formato de imagen no es compatible. Usá JPEG, PNG o WebP.');
    error.statusCode = 415;
    return callback(error);
  },
});
