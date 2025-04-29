import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import fs from 'fs';

// Ensure upload directories exist
const createUploadDirectories = () => {
  const dirs = ['events', 'tickets', 'users', 'qrcodes'];
  const publicDir = path.join(process.cwd(), 'public');
  
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }
  
  dirs.forEach(dir => {
    const targetDir = path.join(publicDir, dir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
  });
};

createUploadDirectories();

// Define the storage configuration for multer
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const uploadType = req.query.type || 'events';
    const uploadDir = path.join(process.cwd(), 'public', uploadType.toString());
    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    cb(null, fileName);
  }
});

// File filter for allowed file types
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Define allowed file types
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type. Allowed types: ${allowedMimeTypes.join(', ')}`));
  }
};

// Multer instance for handling single file uploads
export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB file size limit
  }
}).single('file');

// Multer instance for handling multiple file uploads
export const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 10 // Maximum 10 files
  }
}).array('files', 10);

// Memory storage for processing files before saving
const memoryStorage = multer.memoryStorage();

// Multer instance for handling file uploads to memory
export const uploadToMemory = multer({
  storage: memoryStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB file size limit
  }
}).single('file');

// Create a wrapper function to handle errors in the middleware
export const upload = (req: Request, res: any, next: any) => {
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    } else if (err) {
      // An unknown error occurred
      return res.status(500).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    }
    // Everything went fine
    next();
  });
}; 