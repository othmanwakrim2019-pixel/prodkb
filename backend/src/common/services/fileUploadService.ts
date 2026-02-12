import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import crypto from 'crypto';
import { logger } from '../utils/logger';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);

export interface FileValidationResult {
    valid: boolean;
    error?: string;
}

export interface UploadedFile {
    filePath: string; // Relative path from uploads folder
    fileName: string; // Original filename
    fileSize: number; // Size in bytes
    mimeType: string; // MIME type
}

export class FileUploadService {
    private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private readonly ALLOWED_EXTENSIONS = ['.log', '.txt', '.png', '.jpg', '.jpeg', '.pdf'];
    private readonly ALLOWED_MIME_TYPES = [
        'text/plain',
        'text/x-log',
        'image/png',
        'image/jpeg',
        'application/pdf',
    ];
    private readonly UPLOAD_BASE_DIR = path.join(process.cwd(), 'uploads');

    constructor() {
        this.ensureUploadDirExists();
    }

    private async ensureUploadDirExists() {
        try {
            if (!fs.existsSync(this.UPLOAD_BASE_DIR)) {
                await mkdir(this.UPLOAD_BASE_DIR, { recursive: true });
            }
        } catch (error) {
            logger.error('Failed to create upload directory:', error);
        }
    }

    validateFile(fileName: string, fileSize: number, mimeType: string): FileValidationResult {
        // Check file size
        if (fileSize > this.MAX_FILE_SIZE) {
            return {
                valid: false,
                error: `File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`,
            };
        }

        // Check file extension
        const ext = path.extname(fileName).toLowerCase();
        if (!this.ALLOWED_EXTENSIONS.includes(ext)) {
            return {
                valid: false,
                error: `File extension ${ext} is not allowed. Allowed: ${this.ALLOWED_EXTENSIONS.join(', ')}`,
            };
        }

        // Check MIME type
        if (!this.ALLOWED_MIME_TYPES.includes(mimeType)) {
            return {
                valid: false,
                error: `MIME type ${mimeType} is not allowed`,
            };
        }

        return { valid: true };
    }

    sanitizeFilename(filename: string): string {
        // Remove any directory traversal attempts
        let sanitized = path.basename(filename);

        // Remove potentially dangerous characters
        sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');

        // Prevent hidden files
        if (sanitized.startsWith('.')) {
            sanitized = '_' + sanitized;
        }

        return sanitized;
    }

    async saveFile(
        incidentId: string,
        fileBuffer: Buffer,
        originalFilename: string,
        mimeType: string
    ): Promise<UploadedFile> {
        // Validate file
        const validation = this.validateFile(originalFilename, fileBuffer.length, mimeType);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        // Create incident-specific directory
        const incidentDir = path.join(this.UPLOAD_BASE_DIR, incidentId);
        if (!fs.existsSync(incidentDir)) {
            await mkdir(incidentDir, { recursive: true });
        }

        // Generate unique filename
        const sanitizedOriginal = this.sanitizeFilename(originalFilename);
        const ext = path.extname(sanitizedOriginal);
        const uniqueId = crypto.randomBytes(8).toString('hex');
        const uniqueFilename = `${uniqueId}${ext}`;

        const absolutePath = path.join(incidentDir, uniqueFilename);
        const relativePath = path.join(incidentId, uniqueFilename);

        // Save file
        await writeFile(absolutePath, fileBuffer);

        return {
            filePath: relativePath,
            fileName: sanitizedOriginal,
            fileSize: fileBuffer.length,
            mimeType,
        };
    }

    async deleteFile(relativePath: string): Promise<void> {
        try {
            const absolutePath = path.join(this.UPLOAD_BASE_DIR, relativePath);
            if (fs.existsSync(absolutePath)) {
                await unlink(absolutePath);
            }
        } catch (error) {
            logger.error('Failed to delete file:', error);
            throw error;
        }
    }

    getAbsolutePath(relativePath: string): string {
        return path.join(this.UPLOAD_BASE_DIR, relativePath);
    }

    fileExists(relativePath: string): boolean {
        const absolutePath = path.join(this.UPLOAD_BASE_DIR, relativePath);
        return fs.existsSync(absolutePath);
    }
}

export const fileUploadService = new FileUploadService();
