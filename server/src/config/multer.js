import multer from 'multer';

const FIRMAS = {
  'application/pdf': Buffer.from('%PDF-'),
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': Buffer.from([0x50, 0x4b, 0x03, 0x04]),
};

export const EXTENSIONES = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

const TIPOS_PERMITIDOS = Object.keys(FIRMAS);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (TIPOS_PERMITIDOS.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error('Solo se permiten archivos PDF o DOCX.');
      error.statusCode = 400;
      cb(error);
    }
  },
});

const verificarContenido = (req, res, next) => {
  const { file } = req;
  if (file && !file.buffer.subarray(0, FIRMAS[file.mimetype].length).equals(FIRMAS[file.mimetype])) {
    const error = new Error('El contenido del archivo no corresponde a un PDF o DOCX válido.');
    error.statusCode = 400;
    return next(error);
  }
  next();
};

export const subirArchivo = (campo) => [upload.single(campo), verificarContenido];