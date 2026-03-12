/**
 * File Upload Service — S3/MinIO with local disk fallback
 * Uses S3 when S3_BUCKET is configured, otherwise writes to local `uploads/` directory.
 * @module common/services/fileUploadService
 */

import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import crypto from 'crypto';
import { Readable } from 'stream';
import { logger } from '../utils/logger';
import { env } from '../../config/env';
import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);

export interface FileValidationResult {
    valid: boolean;
    error?: string;
}

export interface UploadedFile {
    filePath: string; // S3 key or relative path from uploads folder
    fileName: string; // Original filename
    fileSize: number; // Size in bytes
    mimeType: string; // MIME type
}

// ── S3 client (lazy-initialized only when S3_BUCKET is set) ──
let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
    if (!s3Client) {
        s3Client = new S3Client({
            region: env.S3_REGION,
            ...(env.S3_ENDPOINT && { endpoint: env.S3_ENDPOINT }),
            ...(env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY && {
                credentials: {
                    accessKeyId: env.S3_ACCESS_KEY_ID,
                    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
                },
            }),
            forcePathStyle: env.S3_FORCE_PATH_STYLE, // Required for MinIO
        });
    }
    return s3Client;
}

const useS3 = !!env.S3_BUCKET;

export class FileUploadService {
    private readonly MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB (aligned with multer)
    private readonly ALLOWED_EXTENSIONS = [
        '.log', '.txt', '.csv', '.html', '.json', '.xml',
        '.png', '.jpg', '.jpeg', '.gif', '.webp',
        '.pdf', '.zip', '.gz',
        '.xlsx', '.docx',
    ];
    private readonly ALLOWED_MIME_TYPES = [
        'text/plain', 'text/csv', 'text/html', 'text/x-log',
        'application/json', 'application/xml',
        'application/pdf',
        'image/png', 'image/jpeg', 'image/gif', 'image/webp',
        'application/zip', 'application/gzip',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    private readonly UPLOAD_BASE_DIR = path.join(process.cwd(), 'uploads');

    constructor() {
        if (!useS3) {
            this.ensureUploadDirExists();
        }
        logger.info(`File upload backend: ${useS3 ? `S3 (bucket: ${env.S3_BUCKET})` : 'local disk'}`);
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
        if (fileSize > this.MAX_FILE_SIZE) {
            return {
                valid: false,
                error: `File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`,
            };
        }

        const ext = path.extname(fileName).toLowerCase();
        if (!this.ALLOWED_EXTENSIONS.includes(ext)) {
            return {
                valid: false,
                error: `File extension ${ext} is not allowed. Allowed: ${this.ALLOWED_EXTENSIONS.join(', ')}`,
            };
        }

        if (!this.ALLOWED_MIME_TYPES.includes(mimeType)) {
            return {
                valid: false,
                error: `MIME type ${mimeType} is not allowed`,
            };
        }

        return { valid: true };
    }

    /**
     * Validate file content by checking magic bytes (binary signature).
     * Catches spoofed Content-Type headers — e.g., executable uploaded as image/png.
     */
    async validateMagicBytes(buffer: Buffer, claimedMimeType: string): Promise<FileValidationResult> {
        // file-type v16 – dynamic import in CJS wraps exports under .default
        const fileType = await import('file-type');
        const detected = await fileType.default.fromBuffer(buffer);

        // Text files don't have magic bytes — skip check for text types
        const textTypes = ['text/plain', 'text/csv', 'text/html', 'text/x-log', 'application/json', 'application/xml'];
        if (textTypes.includes(claimedMimeType)) {
            return { valid: true };
        }

        if (!detected) {
            // file-type couldn't detect — could be text or unknown binary
            logger.warn('Magic byte detection returned no result', { claimedMimeType });
            return { valid: true }; // Allow — extension/MIME already validated
        }

        // Check that detected MIME matches the claimed MIME
        if (detected.mime !== claimedMimeType) {
            // Allow close matches (e.g., image/jpeg vs image/jpg)
            const isCloseMatch =
                (detected.mime === 'application/x-cfb' && claimedMimeType.includes('officedocument')) || // Office files
                (detected.mime === 'application/zip' && claimedMimeType.includes('officedocument')); // .xlsx/.docx are zip
            if (!isCloseMatch) {
                return {
                    valid: false,
                    error: `File content does not match claimed type. Claimed: ${claimedMimeType}, Detected: ${detected.mime}`,
                };
            }
        }

        return { valid: true };
    }

    sanitizeFilename(filename: string): string {
        let sanitized = path.basename(filename);
        sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');
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
        const validation = this.validateFile(originalFilename, fileBuffer.length, mimeType);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        // Validate magic bytes — catch spoofed Content-Type headers
        const magicValidation = await this.validateMagicBytes(fileBuffer, mimeType);
        if (!magicValidation.valid) {
            throw new Error(magicValidation.error);
        }

        const sanitizedOriginal = this.sanitizeFilename(originalFilename);
        const ext = path.extname(sanitizedOriginal);
        const uniqueId = crypto.randomBytes(8).toString('hex');
        const uniqueFilename = `${uniqueId}${ext}`;
        const key = `${incidentId}/${uniqueFilename}`;

        if (useS3) {
            await getS3Client().send(new PutObjectCommand({
                Bucket: env.S3_BUCKET,
                Key: key,
                Body: fileBuffer,
                ContentType: mimeType,
                Metadata: {
                    'original-filename': sanitizedOriginal,
                },
            }));

            logger.debug('File uploaded to S3', { key, bucket: env.S3_BUCKET });
        } else {
            // Local disk fallback
            const incidentDir = path.join(this.UPLOAD_BASE_DIR, incidentId);
            if (!fs.existsSync(incidentDir)) {
                await mkdir(incidentDir, { recursive: true });
            }
            const absolutePath = path.join(incidentDir, uniqueFilename);
            await writeFile(absolutePath, fileBuffer);
        }

        return {
            filePath: key,
            fileName: sanitizedOriginal,
            fileSize: fileBuffer.length,
            mimeType,
        };
    }

    async deleteFile(relativePath: string): Promise<void> {
        try {
            if (useS3) {
                await getS3Client().send(new DeleteObjectCommand({
                    Bucket: env.S3_BUCKET,
                    Key: relativePath,
                }));
            } else {
                const absolutePath = path.join(this.UPLOAD_BASE_DIR, relativePath);
                if (fs.existsSync(absolutePath)) {
                    await unlink(absolutePath);
                }
            }
        } catch (error) {
            logger.error('Failed to delete file:', error);
            throw error;
        }
    }

    /**
     * Get a readable stream for the file (works for both S3 and local disk).
     */
    async getFileStream(relativePath: string): Promise<Readable> {
        if (useS3) {
            const response = await getS3Client().send(new GetObjectCommand({
                Bucket: env.S3_BUCKET,
                Key: relativePath,
            }));
            return response.Body as Readable;
        } else {
            const absolutePath = path.join(this.UPLOAD_BASE_DIR, relativePath);
            return fs.createReadStream(absolutePath);
        }
    }

    /**
     * Generate a pre-signed download URL (S3 only). Falls back to null for local disk.
     */
    async getPresignedUrl(relativePath: string, expiresIn = 3600): Promise<string | null> {
        if (!useS3) return null;
        const command = new GetObjectCommand({
            Bucket: env.S3_BUCKET,
            Key: relativePath,
        });
        return getSignedUrl(getS3Client(), command, { expiresIn });
    }

    /**
     * @deprecated Use getFileStream() instead for downloads.
     * Kept for backward compatibility — returns absolute path for local disk only.
     */
    getAbsolutePath(relativePath: string): string {
        return path.join(this.UPLOAD_BASE_DIR, relativePath);
    }

    async fileExists(relativePath: string): Promise<boolean> {
        if (useS3) {
            try {
                await getS3Client().send(new HeadObjectCommand({
                    Bucket: env.S3_BUCKET,
                    Key: relativePath,
                }));
                return true;
            } catch {
                return false;
            }
        } else {
            const absolutePath = path.join(this.UPLOAD_BASE_DIR, relativePath);
            return fs.existsSync(absolutePath);
        }
    }
}

export const fileUploadService = new FileUploadService();
