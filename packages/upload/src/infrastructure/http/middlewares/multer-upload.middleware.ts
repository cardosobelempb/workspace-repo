import multer from "multer";

const MAX_FILE_SIZE_IN_BYTES = 5 * 1024 * 1024;
const MAX_FILES = 5;

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export const multerUpload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: MAX_FILE_SIZE_IN_BYTES,
    files: MAX_FILES,
  },

  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return callback(new Error(`Tipo de arquivo não permitido: ${file.mimetype}`));
    }

    return callback(null, true);
  },
});
