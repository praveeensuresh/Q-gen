/**
 * Tests for FileStorageService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fileStorageService } from '../fileStorageService'

// Mock @vercel/blob
vi.mock('@vercel/blob', () => ({
  put: vi.fn(),
  del: vi.fn(),
  list: vi.fn(),
}))

describe('FileStorageService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('validateFile', () => {
    it('should validate valid PDF file', async () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      Object.defineProperty(file, 'size', { value: 1024 })

      const result = fileStorageService.instance.validateFile(file)

      expect(result).toEqual({
        valid: true,
        fileSize: 1024,
        fileType: 'application/pdf',
      })
    })

    it('should reject file that is too large', async () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 }) // 11MB

      const result = fileStorageService.instance.validateFile(file)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('File size exceeds')
    })

    it('should reject non-PDF file', async () => {
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
      Object.defineProperty(file, 'size', { value: 1024 })

      const result = fileStorageService.instance.validateFile(file)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('Please upload a PDF file only')
    })

    it('should reject empty file', async () => {
      const file = new File([], 'test.pdf', { type: 'application/pdf' })
      Object.defineProperty(file, 'size', { value: 0 })

      const result = fileStorageService.instance.validateFile(file)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('File appears to be empty')
    })
  })

  describe('uploadFile', () => {
    it('should upload file successfully', async () => {
      const { put } = await import('@vercel/blob')
      const mockBlob = {
        url: 'https://example.com/blob/test.pdf',
        pathname: '/test.pdf',
        downloadUrl: 'https://example.com/blob/test.pdf',
        contentType: 'application/pdf',
        contentDisposition: 'attachment; filename="test.pdf"',
      }
      vi.mocked(put).mockResolvedValue(mockBlob)

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      const result = await fileStorageService.instance.uploadFile(file, 'test.pdf')

      expect(result).toEqual({
        url: mockBlob.url,
        pathname: mockBlob.pathname,
        size: file.size,
        uploadedAt: expect.any(Date),
      })
    })

    it('should throw error on upload failure', async () => {
      const { put } = await import('@vercel/blob')
      vi.mocked(put).mockRejectedValue(new Error('Upload failed'))

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      
      await expect(fileStorageService.instance.uploadFile(file, 'test.pdf'))
        .rejects.toThrow('Failed to upload file: Upload failed')
    })
  })

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      const { del } = await import('@vercel/blob')
      vi.mocked(del).mockResolvedValue(undefined)

      await expect(fileStorageService.instance.deleteFile('https://example.com/blob/test.pdf'))
        .resolves.toBeUndefined()
    })

    it('should not throw error on delete failure', async () => {
      const { del } = await import('@vercel/blob')
      vi.mocked(del).mockRejectedValue(new Error('Delete failed'))

      await expect(fileStorageService.instance.deleteFile('https://example.com/blob/test.pdf'))
        .resolves.toBeUndefined()
    })
  })

  describe('generateFilename', () => {
    it('should generate unique filename with timestamp', () => {
      const filename = fileStorageService.instance.generateFilename('test document.pdf', 'user-123')
      
      expect(filename).toMatch(/^user-123\/test_document_\d+\.pdf$/)
    })

    it('should sanitize filename properly', () => {
      const filename = fileStorageService.instance.generateFilename('test@#$%document.pdf', 'user-123')
      
      expect(filename).toMatch(/^user-123\/test____document_\d+\.pdf$/)
    })
  })
})
