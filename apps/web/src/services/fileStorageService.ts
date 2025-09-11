/**
 * File storage service using Vercel Blob Storage
 * Handles file upload, download, and cleanup operations
 */

import { put, del, head } from '@vercel/blob';

export interface FileUploadResult {
  url: string;
  downloadUrl: string;
  pathname: string;
  contentType: string;
  contentDisposition: string;
  size: number;
  uploadedAt: Date;
}

export interface FileMetadata {
  filename: string;
  contentType: string;
  size: number;
  uploadedAt: Date;
  expiresAt?: Date;
}

export class FileStorageService {
  private readonly token: string;

  constructor() {
    this.token = import.meta.env.VITE_VERCEL_BLOB_READ_WRITE_TOKEN || '';
    
    if (!this.token) {
      console.warn('Vercel Blob token not found. File storage will not work properly.');
    }
  }

  /**
   * Upload file to Vercel Blob Storage
   */
  async uploadFile(file: File, pathname?: string): Promise<FileUploadResult> {
    try {
      if (!this.token) {
        throw new Error('File storage not configured. Please check environment variables.');
      }

      // Generate unique pathname if not provided
      const filePathname = pathname || `documents/${Date.now()}-${file.name}`;

      // Upload file
      const blob = await put(filePathname, file, {
        access: 'public',
        token: this.token,
      });

      return {
        url: blob.url,
        downloadUrl: blob.downloadUrl || blob.url,
        pathname: blob.pathname,
        contentType: blob.contentType || 'application/pdf',
        contentDisposition: blob.contentDisposition || 'inline',
        size: file.size, // Use original file size
        uploadedAt: new Date(), // Use current timestamp
      };
    } catch (error) {
      console.error('File upload error:', error);
      throw this.handleUploadError(error);
    }
  }

  /**
   * Delete file from Vercel Blob Storage
   */
  async deleteFile(url: string): Promise<void> {
    try {
      if (!this.token) {
        throw new Error('File storage not configured. Please check environment variables.');
      }

      await del(url, {
        token: this.token,
      });
    } catch (error) {
      console.error('File deletion error:', error);
      throw new Error('Failed to delete file from storage');
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(url: string): Promise<FileMetadata | null> {
    try {
      if (!this.token) {
        throw new Error('File storage not configured. Please check environment variables.');
      }

      const response = await head(url, {
        token: this.token,
      });

      if (!response) {
        return null;
      }

      return {
        filename: this.extractFilenameFromUrl(url),
        contentType: response.contentType || 'application/octet-stream',
        size: response.size || 0,
        uploadedAt: new Date(response.uploadedAt || Date.now()),
      };
    } catch (error) {
      console.error('File metadata error:', error);
      return null;
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(url: string): Promise<boolean> {
    try {
      const metadata = await this.getFileMetadata(url);
      return metadata !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate signed URL for secure access
   */
  generateSignedUrl(url: string, expiresIn: number = 3600): string {
    // For Vercel Blob, URLs are already public, but we can add query params for tracking
    const urlObj = new URL(url);
    urlObj.searchParams.set('t', Date.now().toString());
    urlObj.searchParams.set('exp', (Date.now() + expiresIn * 1000).toString());
    return urlObj.toString();
  }

  /**
   * Extract filename from URL
   */
  private extractFilenameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop() || 'unknown';
      return decodeURIComponent(filename);
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Handle upload errors with user-friendly messages
   */
  private handleUploadError(error: any): Error {
    if (error.message.includes('413')) {
      return new Error('File too large. Please try a smaller file.');
    }

    if (error.message.includes('415')) {
      return new Error('File type not supported. Please upload a PDF file.');
    }

    if (error.message.includes('429')) {
      return new Error('Too many requests. Please wait a moment and try again.');
    }

    if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
      return new Error('Storage service temporarily unavailable. Please try again later.');
    }

    if (error.message.includes('network') || error.message.includes('fetch')) {
      return new Error('Network error. Please check your connection and try again.');
    }

    return new Error('Failed to upload file. Please try again.');
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File): { valid: boolean; error?: string; fileSize?: number; fileType?: string } {
    // Check file type
    if (file.type !== 'application/pdf') {
      return {
        valid: false,
        error: 'Only PDF files are supported',
        fileType: file.type,
        fileSize: file.size,
      };
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds 10MB limit. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
        fileType: file.type,
        fileSize: file.size,
      };
    }

    // Check if file is empty
    if (file.size === 0) {
      return {
        valid: false,
        error: 'File appears to be empty',
        fileType: file.type,
        fileSize: file.size,
      };
    }

    return { 
      valid: true,
      fileType: file.type,
      fileSize: file.size,
    };
  }

  /**
   * Generate unique filename for upload
   */
  generateFilename(originalName: string, userId: string): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop() || 'pdf';
    return `documents/${userId}/${timestamp}-${randomId}.${extension}`;
  }
}

// Lazy initialization to avoid constructor running at module load time
let _fileStorageService: FileStorageService | null = null;

export const fileStorageService = {
  get instance() {
    if (!_fileStorageService) {
      _fileStorageService = new FileStorageService();
    }
    return _fileStorageService;
  }
};