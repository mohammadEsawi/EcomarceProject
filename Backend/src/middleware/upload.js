import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only JPEG, JPG, PNG and WebP images are allowed.'), false);
  }
};

// ── Storage: Cloudinary in production, local disk in development ──────────────
const useCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

let storage;

if (useCloudinary) {
  // Dynamic import so the package is only required when env vars are present.
  // Install with: npm install cloudinary multer-storage-cloudinary
  const { v2: cloudinary } = await import('cloudinary');
  const { CloudinaryStorage } = await import('multer-storage-cloudinary');

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder:           'ecommerce-products',
      allowed_formats:  ['jpg', 'jpeg', 'png', 'webp'],
      transformation:   [{ width: 1200, crop: 'limit', quality: 'auto:good' }],
    },
  });
} else {
  storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename:    (_req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`);
    },
  });
}

const uploader = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadSingle   = uploader.single('image');
export const uploadMultiple = uploader.array('images', 10);
export default uploader;

// Helper: returns the public URL for a multer file regardless of storage engine.
// Cloudinary sets file.path to the full https URL; disk storage uses a local path.
export function getFileUrl(file) {
  if (useCloudinary) return file.path; // full Cloudinary https URL
  return `/uploads/${file.filename}`;
}
