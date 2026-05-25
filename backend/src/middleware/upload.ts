import { mkdirSync } from "node:fs";
import { join } from "node:path";
import multer from "multer";
import { BadRequest } from "./error.js";

/**
 * Disk-backed multer configuration for assignment material uploads.
 *
 * Files land in `uploads/<assignment-temp>` first; the route handler renames
 * them under the freshly created assignment id once Mongo assigns one.
 * We accept jpeg/png/pdf/text up to 10 MB — matching the front-end hint
 * and the brief.
 */
const UPLOAD_ROOT = join(process.cwd(), "uploads");
mkdirSync(UPLOAD_ROOT, { recursive: true });

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
  "text/plain",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_ROOT),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  },
});

export const uploadMaterial = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(BadRequest(`Unsupported file type: ${file.mimetype}`));
      return;
    }
    cb(null, true);
  },
});
