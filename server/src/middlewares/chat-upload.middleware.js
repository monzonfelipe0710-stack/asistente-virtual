import multer from 'multer';

export const MAX_IMAGEN_BYTES = 8 * 1024 * 1024;
const MAX_PREGUNTA_BYTES = 500 * 4;
const TIPOS_IMAGEN = new Set(['image/jpeg', 'image/png', 'image/webp']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGEN_BYTES,
    files: 1,
    fields: 1,
    parts: 2,
    fieldSize: MAX_PREGUNTA_BYTES,
    fieldNameSize: 32,
  },
  fileFilter(req, file, callback) {
    if (!TIPOS_IMAGEN.has(file.mimetype)) {
      const error = new Error('La imagen debe ser JPEG, PNG o WebP.');
      error.statusCode = 415;
      callback(error);
      return;
    }
    callback(null, true);
  },
});

export const firmaImagenValida = (buffer, mimetype) => {
  if (!Buffer.isBuffer(buffer)) return false;

  if (mimetype === 'image/jpeg') {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimetype === 'image/png') {
    return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  }
  if (mimetype === 'image/webp') {
    return buffer.length >= 12 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP';
  }
  return false;
};

export const uploadImagenChat = (req, res, next) => {
  upload.single('imagen')(req, res, (error) => {
    if (error) {
      if (error instanceof multer.MulterError) {
        error.statusCode = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
        error.message = error.code === 'LIMIT_FILE_SIZE'
          ? 'La imagen no puede superar los 8 MB.'
          : 'Solo podés adjuntar una imagen.';
      } else if (!error.statusCode) {
        error.statusCode = 400;
      }
      next(error);
      return;
    }

    if (req.file && !firmaImagenValida(req.file.buffer, req.file.mimetype)) {
      const invalidImage = new Error('El contenido no corresponde a una imagen JPEG, PNG o WebP válida.');
      invalidImage.statusCode = 400;
      next(invalidImage);
      return;
    }
    next();
  });
};
