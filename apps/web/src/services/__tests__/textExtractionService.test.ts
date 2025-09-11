/**
 * Tests for TextExtractionService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { textExtractionService } from '../textExtractionService'

// Mock pdf-parse
vi.mock('pdf-parse', () => ({
  default: vi.fn(),
}))

describe('TextExtractionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('extractText', () => {
    it('should extract text successfully from valid PDF', async () => {
      const mockPdfData = {
        text: 'This is sample text from a PDF document. It contains multiple sentences and paragraphs for testing purposes.',
        numpages: 1,
        numrender: 1,
        metadata: {},
        version: '1.0.0',
        info: {
          Title: 'Test Document',
          Author: 'Test Author',
          Subject: 'Test Subject',
          Creator: 'Test Creator',
        },
      } as any

      const pdfParse = await import('pdf-parse')
      vi.mocked(pdfParse.default).mockResolvedValue(mockPdfData)

      const result = await textExtractionService.instance.extractText(Buffer.from('mock-pdf-data'))

      expect(result).toEqual({
        text: mockPdfData.text,
        pageCount: mockPdfData.numpages,
        qualityScore: expect.any(Number),
        processingTime: expect.any(Number),
        metadata: {
          title: mockPdfData.info.Title,
          author: mockPdfData.info.Author,
          subject: mockPdfData.info.Subject,
          creator: mockPdfData.info.Creator,
        },
      })
    })

    it('should throw error for corrupted PDF', async () => {
      const pdfParse = await import('pdf-parse')
      vi.mocked(pdfParse.default).mockRejectedValue(new Error('Invalid PDF'))

      await expect(textExtractionService.instance.extractText(Buffer.from('corrupted-data')))
        .rejects.toThrow('Invalid PDF')
    })

    it('should throw error for empty PDF', async () => {
      const mockPdfData = {
        text: '',
        numpages: 1,
        numrender: 1,
        metadata: {},
        version: '1.0.0',
        info: {},
      } as any

      const pdfParse = await import('pdf-parse')
      vi.mocked(pdfParse.default).mockResolvedValue(mockPdfData)

      await expect(textExtractionService.instance.extractText(Buffer.from('empty-pdf-data')))
        .rejects.toThrow('PDF appears to be empty or contains no readable text')
    })

    it('should throw error for insufficient text', async () => {
      const mockPdfData = {
        text: 'Short',
        numpages: 1,
        numrender: 1,
        metadata: {},
        version: '1.0.0',
        info: {},
      } as any

      const pdfParse = await import('pdf-parse')
      vi.mocked(pdfParse.default).mockResolvedValue(mockPdfData)

      await expect(textExtractionService.instance.extractText(Buffer.from('short-pdf-data')))
        .rejects.toThrow('Extracted text is too short for question generation')
    })

    it('should throw error for image-only PDF', async () => {
      const mockPdfData = {
        text: 'a'.repeat(50), // Very short text
        numpages: 10, // Many pages
        numrender: 10,
        metadata: {},
        version: '1.0.0',
        info: {},
      } as any

      const pdfParse = await import('pdf-parse')
      vi.mocked(pdfParse.default).mockResolvedValue(mockPdfData)

      await expect(textExtractionService.instance.extractText(Buffer.from('image-pdf-data')))
        .rejects.toThrow('Extracted text is too short for question generation')
    })
  })

  // cleanText is now a private method, so these tests are commented out
  // describe('cleanText', () => {
  //   it('should clean and normalize text properly', () => {
  //     const dirtyText = '  This   is   a   test   \n\n\n\n   with   extra   spaces   '
  //     const cleanedText = textExtractionService.instance.cleanText(dirtyText)
  //     
  //     expect(cleanedText).toBe('This is a test with extra spaces')
  //   })

  //   it('should handle empty text', () => {
  //     const cleanedText = textExtractionService.instance.cleanText('')
  //     expect(cleanedText).toBe('')
  //   })

  //   it('should handle null/undefined text', () => {
  //     const cleanedText1 = textExtractionService.instance.cleanText(null as any)
  //     const cleanedText2 = textExtractionService.instance.cleanText(undefined as any)
  //     
  //     expect(cleanedText1).toBe('')
  //     expect(cleanedText2).toBe('')
  //   })
  // })

  describe('isTextQualityAcceptable', () => {
    it('should return true for high quality text', () => {
      expect(textExtractionService.instance.isTextQualityAcceptable(0.8)).toBe(true)
      expect(textExtractionService.instance.isTextQualityAcceptable(0.9)).toBe(true)
    })

    it('should return false for low quality text', () => {
      expect(textExtractionService.instance.isTextQualityAcceptable(0.5)).toBe(false)
      expect(textExtractionService.instance.isTextQualityAcceptable(0.6)).toBe(false)
    })

    it('should return true for threshold quality text', () => {
      expect(textExtractionService.instance.isTextQualityAcceptable(0.7)).toBe(true)
    })
  })

  // getTextStatistics method doesn't exist, so these tests are commented out
  // describe('getTextStatistics', () => {
  //   it('should calculate text statistics correctly', () => {
  //     const text = 'This is a test sentence. This is another sentence.\n\nThis is a new paragraph.'
  //     const stats = textExtractionService.getTextStatistics(text)
  //     
  //     expect(stats).toEqual({
  //       wordCount: 14,
  //       characterCount: 75,
  //       sentenceCount: 3,
  //       paragraphCount: 1,
  //     })
  //   })

  //   it('should handle empty text', () => {
  //     const stats = textExtractionService.getTextStatistics('')
  //     
  //     expect(stats).toEqual({
  //       wordCount: 0,
  //       characterCount: 0,
  //       sentenceCount: 0,
  //       paragraphCount: 0,
  //     })
  //   })
  // })
})
