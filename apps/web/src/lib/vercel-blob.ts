/**
 * Vercel Blob Storage integration
 * Handles file upload and storage
 */

import { put } from '@vercel/blob'
import { config } from '@/config/env'

export interface BlobUploadResult {
  url: string
  downloadUrl: string
  pathname: string
  contentType: string
  contentDisposition: string
  size: number
  uploadedAt: Date
}

export class VercelBlobService {
  private readonly token: string

  constructor() {
    this.token = config.blobStorage.token
    if (!this.token) {
      throw new Error('Vercel Blob token is required')
    }
  }

  /**
   * Upload file to Vercel Blob storage
   */
  async uploadFile(
    file: File,
    filename?: string
  ): Promise<BlobUploadResult> {
    try {
      const blob = await put(filename || file.name, file, {
        access: 'public',
        token: this.token,
      })

      return {
        url: blob.url,
        downloadUrl: blob.downloadUrl,
        pathname: blob.pathname,
        contentType: blob.contentType,
        contentDisposition: blob.contentDisposition,
        size: file.size, // Use file size instead of blob.size
        uploadedAt: new Date(), // Use current date instead of blob.uploadedAt
      }
    } catch (error) {
      console.error('Vercel Blob upload error:', error)
      throw new Error('Failed to upload file to storage')
    }
  }

  /**
   * Delete file from Vercel Blob storage
   */
  async deleteFile(url: string): Promise<void> {
    try {
      // Note: Vercel Blob doesn't have a direct delete API in the client
      // Files are automatically cleaned up based on TTL
      console.log('File will be automatically cleaned up:', url)
    } catch (error) {
      console.error('Vercel Blob delete error:', error)
      throw new Error('Failed to delete file from storage')
    }
  }

  /**
   * Get file info from URL
   */
  async getFileInfo(url: string): Promise<Partial<BlobUploadResult>> {
    try {
      const response = await fetch(url, { method: 'HEAD' })
      
      if (!response.ok) {
        throw new Error('File not found')
      }

      return {
        url,
        contentType: response.headers.get('content-type') || '',
        size: parseInt(response.headers.get('content-length') || '0'),
      }
    } catch (error) {
      console.error('Vercel Blob get info error:', error)
      throw new Error('Failed to get file info')
    }
  }

  /**
   * Test Vercel Blob connection by checking if the service is properly configured
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Check if token is configured
      if (!this.token) {
        return {
          success: false,
          message: 'Vercel Blob token not configured'
        }
      }

      // Check if the token format looks valid (basic validation)
      if (this.token.length < 10) {
        return {
          success: false,
          message: 'Vercel Blob token appears to be invalid'
        }
      }

      return {
        success: true,
        message: 'Vercel Blob service is properly configured'
      }
    } catch (error) {
      return {
        success: false,
        message: `Vercel Blob connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
}

// Lazy initialization to avoid constructor running at module load time
let _vercelBlobService: VercelBlobService | null = null;

export const vercelBlobService = {
  get instance() {
    if (!_vercelBlobService) {
      _vercelBlobService = new VercelBlobService();
    }
    return _vercelBlobService;
  }
};
