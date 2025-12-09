import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger';
import * as multer from 'multer';

// Types for file upload
export interface FileUploadResult {
  fileName: string;
  filePath: string;
  fileUrl: string;
  error?: string;
}

/**
 * Save a base64 encoded image to disk
 * @param base64Data - Base64 encoded image data (with or without data URI prefix)
 * @param directory - Directory to save the image to (relative to public folder)
 * @returns Promise<FileUploadResult> - Object with file info or error
 */
export const saveBase64Image = async (
  base64Data: string,
  directory: string = 'events'
): Promise<FileUploadResult> => {
  try {
    // Extract the base64 data if it has a data URI prefix
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let cleanedBase64: string;
    let fileExtension: string;
    
    if (matches && matches.length === 3) {
      // It's a data URI
      const mimeType = matches[1];
      cleanedBase64 = matches[2];
      fileExtension = mimeType.split('/')[1] || 'jpg';
    } else {
      // It's already clean base64
      cleanedBase64 = base64Data;
      fileExtension = 'jpg'; // Default to jpg
    }
    
    // Create a unique filename
    const fileName = `${uuidv4()}.${fileExtension}`;
    
    // Ensure the directory exists
    const publicDir = path.join(process.cwd(), 'public');
    const targetDir = path.join(publicDir, directory);
    
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir);
    }
    
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // File path
    const filePath = path.join(targetDir, fileName);
    
    // Write file
    fs.writeFileSync(filePath, Buffer.from(cleanedBase64, 'base64'));
    
    // Return result
    const fileUrl = `/public/${directory}/${fileName}`;
    return {
      fileName,
      filePath,
      fileUrl
    };
  } catch (error) {
    logger.error('Error saving base64 image:', error);
    return {
      fileName: '',
      filePath: '',
      fileUrl: '',
      error: 'Failed to save image'
    };
  }
};

/**
 * Save uploaded file from a request to disk
 * @param file - Express file upload object
 * @param directory - Directory to save the file to (relative to public folder)
 * @returns Promise<FileUploadResult> - Object with file info or error
 */
export const saveUploadedFile = async (
  file: Express.Multer.File,
  directory: string = 'events'
): Promise<FileUploadResult> => {
  try {
    // Create a unique filename
    const fileExtension = path.extname(file.originalname).slice(1);
    const fileName = `${uuidv4()}.${fileExtension}`;
    
    // Ensure the directory exists
    const publicDir = path.join(process.cwd(), 'public');
    const targetDir = path.join(publicDir, directory);
    
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir);
    }
    
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // File path
    const filePath = path.join(targetDir, fileName);
    
    // Write file
    fs.writeFileSync(filePath, file.buffer);
    
    // Return result
    const fileUrl = `/public/${directory}/${fileName}`;
    return {
      fileName,
      filePath,
      fileUrl
    };
  } catch (error) {
    logger.error('Error saving uploaded file:', error);
    return {
      fileName: '',
      filePath: '',
      fileUrl: '',
      error: 'Failed to save file'
    };
  }
};

/**
 * Delete a file from disk
 * @param filePath - Absolute path to the file
 * @returns Promise<boolean> - Whether the deletion was successful
 */
export const deleteFile = async (filePath: string): Promise<boolean> => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Error deleting file:', error);
    return false;
  }
}; 