/**
 * Text extraction service for PDF processing
 * Handles real PDF text extraction using pdf-parse library
 */

import pdf from 'pdf-parse';
import type { TextExtractionResult, TextQualityMetrics } from '../types/document';

export class TextExtractionService {
  private readonly maxFileSize: number;
  private readonly timeout: number;

  constructor() {
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.timeout = 30000; // 30 seconds
  }

  /**
   * Extract text from PDF file or buffer
   */
  async extractText(input: File | Buffer): Promise<TextExtractionResult> {
    try {
      let buffer: Buffer;
      let originalFilename = 'document.pdf';
      let fileSize = 0;

      if (input instanceof File) {
        // Validate file
        this.validateFile(input);
        
        // Convert File to Buffer
        const arrayBuffer = await input.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
        originalFilename = input.name;
        fileSize = input.size;
      } else {
        // Input is already a Buffer
        buffer = input;
        fileSize = buffer.length;
      }

      // Extract text with timeout
      const pdfData = await this.extractWithTimeout(buffer);

      // Process and clean text
      const cleanedText = this.cleanText(pdfData.text);

      // Calculate quality metrics
      const qualityMetrics = this.calculateQualityMetrics(cleanedText, pdfData);

      // Validate extracted text
      this.validateExtractedText(cleanedText);

      return {
        text: cleanedText,
        pageCount: pdfData.numpages,
        textLength: cleanedText.length,
        qualityMetrics,
        processingTime: Date.now(),
        metadata: {
          originalFilename,
          fileSize,
          extractionMethod: 'pdf-parse',
        },
      };
    } catch (error) {
      console.error('Text extraction error:', error);
      throw this.handleExtractionError(error);
    }
  }

  /**
   * Extract text with timeout handling
   */
  private async extractWithTimeout(buffer: Buffer): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('PDF processing timeout. Please try a smaller file.'));
      }, this.timeout);

      pdf(buffer, {
        // pdf-parse options
        max: 0, // No page limit
        version: 'v1.10.100', // Use specific version for stability
      })
        .then((data) => {
          clearTimeout(timeoutId);
          resolve(data);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
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
  private calculateQualityMetrics(text: string, pdfData: any): TextQualityMetrics {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
    
      return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      averageWordsPerSentence: words.length / Math.max(sentences.length, 1),
      readabilityScore: this.calculateReadabilityScore(text),
      textDensity: text.length / Math.max(pdfData.numpages, 1),
      hasImages: pdfData.info?.Creator?.includes('Image') || false,
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
   * Validate file before processing
   */
  private validateFile(file: File): void {
    if (file.type !== 'application/pdf') {
      throw new Error('File must be a PDF document');
    }

    if (file.size === 0) {
      throw new Error('File appears to be empty or corrupted');
    }

    if (file.size > this.maxFileSize) {
      const maxSizeMB = Math.round(this.maxFileSize / (1024 * 1024));
      throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
    }
  }

  /**
   * Validate extracted text quality
   */
  private validateExtractedText(text: string): void {
    if (text.length < 100) {
      throw new Error('Extracted text is too short for question generation. Please use a longer document.');
    }

    if (text.length < 500) {
      console.warn('Extracted text is quite short. Question generation may be limited.');
    }

    // Check for common PDF issues
    if (text.includes('') || text.includes('□')) {
      console.warn('PDF may contain special characters that could affect text quality.');
    }
  }

  /**
   * Handle extraction errors with user-friendly messages
   */
  private handleExtractionError(error: any): Error {
    if (error.message.includes('timeout')) {
      return new Error('PDF processing is taking longer than expected. Please try a smaller file.');
    }

    if (error.message.includes('Invalid PDF')) {
      return new Error('PDF file appears to be corrupted. Please try a different file.');
    }

    if (error.message.includes('password')) {
      return new Error('This PDF is password-protected. Please provide an unprotected version.');
    }

    if (error.message.includes('encrypted')) {
      return new Error('This PDF is encrypted and cannot be processed. Please provide an unencrypted version.');
    }

    if (error.message.includes('too large')) {
      return new Error('File is too large to process. Please try a smaller file.');
    }

    return new Error('Unable to extract text from PDF. Please ensure the file is not corrupted and try again.');
  }


  /**
   * Check if text quality is acceptable for question generation
   */
  isTextQualityAcceptable(qualityScore: number): boolean {
    // Minimum quality score threshold
    const minQualityScore = 30;
    return qualityScore >= minQualityScore;
  }
}

// Lazy initialization to avoid constructor running at module load time
let _textExtractionService: TextExtractionService | null = null;

export const textExtractionService = {
  get instance() {
    if (!_textExtractionService) {
      _textExtractionService = new TextExtractionService();
    }
    return _textExtractionService;
  }
};