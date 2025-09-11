/**
 * Tests for PDFProcessingService
 * Note: These tests focus on validation logic since pdfjs-dist requires browser environment
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PDFProcessingService } from '../pdfProcessingService';

// Mock pdfjs-dist completely since it requires browser environment
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {
    workerSrc: '',
  },
  getDocument: vi.fn(),
  version: '3.11.174',
}));

describe('PDFProcessingService', () => {
  let service: PDFProcessingService;

  beforeEach(() => {
    service = new PDFProcessingService();
  });

  it('should throw error for non-PDF files', async () => {
    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    await expect(service.extractText(mockFile)).rejects.toThrow('File must be a PDF document');
  });

  it('should throw error for empty files', async () => {
    const mockFile = new File([], 'test.pdf', { type: 'application/pdf' });
    
    await expect(service.extractText(mockFile)).rejects.toThrow('File appears to be empty or corrupted');
  });

  it('should throw error for files that are too large', async () => {
    const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
    const mockFile = new File([largeContent], 'test.pdf', { type: 'application/pdf' });
    
    await expect(service.extractText(mockFile)).rejects.toThrow('File size exceeds 10MB limit');
  });

  it('should create service instance correctly', () => {
    expect(service).toBeInstanceOf(PDFProcessingService);
  });
});
