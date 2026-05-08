import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname in ES module context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Absolute path to the uploads folder: Backend/src/uploads/
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

/** Multer disk-storage configuration */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    // e.g. 1715000000000-my-photo.jpg
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, uniqueName);
  },
});

/** Accept only common image MIME types */
const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new multer.MulterError(
        'LIMIT_UNEXPECTED_FILE',
        'Only JPEG, JPG, PNG and WebP images are allowed.',
      ),
      false,
    );
  }
};

const multerConfig = {
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
};

const uploader = multer(multerConfig);

/** Upload a single image under the field name 'image' */
export const uploadSingle = uploader.single('image');

/** Upload up to 10 images under the field name 'images' */
export const uploadMultiple = uploader.array('images', 10);

export default uploader;
