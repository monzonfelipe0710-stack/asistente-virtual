import multer from 'multer';

const TIPOS_PERMITIDOS = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (TIPOS_PERMITIDOS.incldues(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error('Solo se permiten archivos PDF o DOCX.');
      error.statusCode = 400;
      cb(error);
    }
  },
});