/**
 * PDF Processing Service - Client-side implementation
 * Handles PDF text extraction using pdfjs-dist for browser compatibility
 */

import * as pdfjsLib from 'pdfjs-dist';
import type { TextExtractionResult, TextQualityMetrics } from '../types/document';

// Configure pdfjs-dist for browser environment
// Use Vite-compatible worker configuration
try {
  // Try to use the worker from the installed package first
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
} catch (error) {
  console.warn('Failed to configure PDF.js worker with local path, using CDN fallback:', error);
  
  // Fallback to CDN with known working version
  const fallbackWorkers = [
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.mjs',
    'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.mjs',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  ];
  
  for (const workerSrc of fallbackWorkers) {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
      console.log('PDF.js worker configured with fallback:', workerSrc);
      break;
    } catch (fallbackError) {
      console.warn('Failed to configure worker with:', workerSrc, fallbackError);
    }
  }
}

export class PDFProcessingService {
  constructor() {
    // No timeout needed for client-side processing
  }

  /**
   * Extract text from PDF file using client-side processing
   */
  async extractText(file: File): Promise<TextExtractionResult> {
    try {
      // Validate file first - let validation errors pass through
      this.validateFile(file);

      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Load PDF document with robust configuration
      const pdf = await pdfjsLib.getDocument({ 
        data: arrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
        verbosity: 0 // Reduce console output
      }).promise;
      
      let fullText = '';
      let pageCount = pdf.numPages;
      
      // Extract text from all pages
      for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine text items from the page
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        fullText += pageText + '\n';
      }

      // Clean and process text
      const cleanedText = this.cleanText(fullText);
      
      // Calculate quality metrics
      const qualityMetrics = this.calculateQualityMetrics(cleanedText, pageCount);

      // Validate extracted text
      if (cleanedText.length < 100) {
        throw new Error('Extracted text is too short for question generation. Please use a longer document.');
      }

      const result = {
        text: cleanedText,
        pageCount: pageCount,
        textLength: cleanedText.length,
        qualityMetrics,
        processingTime: Date.now(),
        metadata: {
          originalFilename: file.name,
          fileSize: file.size,
          extractionMethod: 'pdfjs-dist',
        },
      };

      return result;
    } catch (error) {
      console.error('PDF processing error:', error);
      
      // If it's already a validation error, pass it through
      if (error instanceof Error && (
        error.message.includes('File must be a PDF document') ||
        error.message.includes('File appears to be empty') ||
        error.message.includes('File size exceeds') ||
        error.message.includes('Extracted text is too short')
      )) {
        throw error;
      }
      
      // Otherwise, handle as processing error
      throw this.handleProcessingError(error);
    }
  }

  /**
   * Validate file before processing
   */
  private validateFile(file: File): void {
    if (file.type !== 'application/pdf') {
      throw new Error('File must be a PDF document');
    }

    if (file.size === 0) {
      throw new Error('File appears to be empty or corrupted');
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
    }
  }


  /**
   * Clean and normalize extracted text
   */
  private cleanText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove page numbers and headers/footers
      .replace(/^\d+\s*$/gm, '')
      .replace(/^Page \d+$/gm, '')
      // Remove common PDF artifacts
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
      // Normalize line breaks
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove multiple consecutive line breaks
      .replace(/\n{3,}/g, '\n\n')
      // Trim whitespace
      .trim();
  }

  /**
   * Calculate text quality metrics
   */
  private calculateQualityMetrics(text: string, pageCount: number): TextQualityMetrics {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
    
    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      averageWordsPerSentence: words.length / Math.max(sentences.length, 1),
      readabilityScore: this.calculateReadabilityScore(text),
      textDensity: text.length / Math.max(pageCount, 1),
      hasImages: false, // pdfjs-dist doesn't provide image detection
    };
  }

  /**
   * Calculate basic readability score (Flesch Reading Ease approximation)
   */
  private calculateReadabilityScore(text: string): number {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
    const syllables = words.reduce((total, word) => total + this.countSyllables(word), 0);

    if (words.length === 0 || sentences.length === 0) return 0;

    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;

    // Simplified Flesch Reading Ease formula
    const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Count syllables in a word (approximation)
   */
  private countSyllables(word: string): number {
    const vowels = 'aeiouyAEIOUY';
    let count = 0;
    let previousWasVowel = false;

    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i]);
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }

    // Handle silent 'e'
    if (word.endsWith('e') && count > 1) {
      count--;
    }

    return Math.max(1, count);
  }

  /**
   * Handle processing errors with user-friendly messages
   */
  private handleProcessingError(error: any): Error {
    console.error('PDF processing error details:', error);
    
    if (error.message?.includes('timeout')) {
      return new Error('PDF processing is taking longer than expected. Please try a smaller file.');
    }

    if (error.message?.includes('Invalid PDF') || error.message?.includes('Invalid PDF structure')) {
      return new Error('PDF file appears to be corrupted. Please try a different file.');
    }

    if (error.message?.includes('password') || error.message?.includes('password-protected')) {
      return new Error('This PDF is password-protected. Please provide an unprotected version.');
    }

    if (error.message?.includes('encrypted')) {
      return new Error('This PDF is encrypted and cannot be processed. Please provide an unencrypted version.');
    }

    if (error.message?.includes('too large')) {
      return new Error('File is too large to process. Please try a smaller file.');
    }

    if (error.message?.includes('worker') || error.message?.includes('Failed to fetch')) {
      return new Error('PDF processing service is temporarily unavailable. Please try again.');
    }

    if (error.message?.includes('Setting up fake worker failed')) {
      return new Error('PDF processing is not available in this environment. Please try a different browser or contact support.');
    }

    return new Error('Unable to process PDF. Please ensure the file is not corrupted and try again.');
  }
}

// Lazy initialization to avoid constructor running at module load time
let _pdfProcessingService: PDFProcessingService | null = null;

export const pdfProcessingService = {
  get instance() {
    if (!_pdfProcessingService) {
      _pdfProcessingService = new PDFProcessingService();
    }
    return _pdfProcessingService;
  }
};
