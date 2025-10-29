import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { env } from "./env";


const uploadRoot = env.uploadDir;


const storage = multer.diskStorage({
destination: (_req, _file, cb) => {
fs.mkdirSync(uploadRoot, { recursive: true });
cb(null, uploadRoot);
},
filename: (_req, file, cb) => {
  const ext = path.extname(file.originalname || "");
  cb(null, `${randomUUID()}${ext}`);
}
});


export const upload = multer({
storage,
limits: { fileSize: 10 * 1024 * 1024 },
fileFilter: (_req, file, cb) => {
const allowed = [
"application/pdf",
"image/png",
"image/jpeg",
"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
"application/vnd.ms-excel",
"text/csv"
];
if (!allowed.includes(file.mimetype)) return cb(new Error("Tipo de archivo no permitido"));
cb(null, true);
}
});


export const resolveUploadPath = (p: string) => path.resolve(uploadRoot, p);