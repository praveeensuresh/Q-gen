/**
 * Memory-optimized text processing service
 * Handles large text processing with memory management and streaming
 */

import { performanceService } from './performanceService';

export interface TextChunk {
  content: string;
  startIndex: number;
  endIndex: number;
  size: number;
}

export interface ProcessingOptions {
  chunkSize: number;
  maxMemoryUsage: number;
  enableStreaming: boolean;
  qualityThreshold: number;
}

export class MemoryOptimizedTextService {
  private static readonly DEFAULT_CHUNK_SIZE = 10000; // 10KB chunks
  private static readonly MAX_MEMORY_USAGE = 50; // 50MB

  /**
   * Process large text in chunks to manage memory usage
   */
  static async processTextInChunks(
    text: string,
    processor: (chunk: string) => Promise<string>,
    options: Partial<ProcessingOptions> = {}
  ): Promise<string> {
    const config: ProcessingOptions = {
      chunkSize: options.chunkSize || this.DEFAULT_CHUNK_SIZE,
      maxMemoryUsage: options.maxMemoryUsage || this.MAX_MEMORY_USAGE,
      enableStreaming: options.enableStreaming ?? true,
      qualityThreshold: options.qualityThreshold || 0.7,
    };

    const startTime = Date.now();
    const operationId = `text-processing-${Date.now()}`;

    try {
      performanceService.startProcessing(operationId);

      // Check if we can start processing
      const canStart = performanceService.canStartProcessing();
      if (!canStart.allowed) {
        throw new Error(`Cannot start processing: ${canStart.reason}`);
      }

      const chunks = this.createTextChunks(text, config.chunkSize);
      const processedChunks: string[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        // Check memory usage before processing each chunk
        const currentMemory = performanceService.getCurrentMemoryUsage();
        if (currentMemory > config.maxMemoryUsage) {
          console.warn('Memory usage high, optimizing...');
          performanceService.optimizeMemory();
        }

        // Process chunk
        const processedChunk = await processor(chunk.content);
        processedChunks.push(processedChunk);

        // Clean up processed chunk from memory
        if (config.enableStreaming) {
          chunks[i] = null as any; // Help GC
        }

        // Yield control to prevent blocking
        if (i % 10 === 0) {
          await this.yieldControl();
        }
      }

      const result = processedChunks.join('');
      const processingTime = Date.now() - startTime;

      // Track performance metrics
      performanceService.trackMetrics({
        memoryUsage: performanceService.getCurrentMemoryUsage(),
        processingTime,
        fileSize: text.length,
        textLength: result.length,
        qualityScore: 1.0, // Assume good quality for now
      });

      return result;

    } finally {
      performanceService.stopProcessing(operationId);
    }
  }

  /**
   * Clean text with memory optimization
   */
  static async cleanTextOptimized(text: string): Promise<string> {
    return this.processTextInChunks(text, async (chunk) => {
      return chunk
        .replace(/\s+/g, ' ')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    });
  }

  /**
   * Extract text statistics with memory optimization
   */
  static async getTextStatisticsOptimized(text: string): Promise<{
    wordCount: number;
    characterCount: number;
    sentenceCount: number;
    paragraphCount: number;
  }> {
    let wordCount = 0;
    let characterCount = 0;
    let sentenceCount = 0;
    let paragraphCount = 0;

    const chunks = this.createTextChunks(text, this.DEFAULT_CHUNK_SIZE);

    for (const chunk of chunks) {
      const cleanedChunk = chunk.content.trim();
      
      if (cleanedChunk.length > 0) {
        characterCount += cleanedChunk.length;
        wordCount += cleanedChunk.split(/\s+/).filter(word => word.length > 0).length;
        sentenceCount += (cleanedChunk.match(/[.!?]+/g) || []).length;
        paragraphCount += (cleanedChunk.match(/\n\s*\n/g) || []).length + 1;
      }

      // Yield control periodically
      await this.yieldControl();
    }

    return {
      wordCount,
      characterCount,
      sentenceCount,
      paragraphCount,
    };
  }

  /**
   * Create text chunks for processing
   */
  private static createTextChunks(text: string, chunkSize: number): TextChunk[] {
    const chunks: TextChunk[] = [];
    let startIndex = 0;

    while (startIndex < text.length) {
      let endIndex = Math.min(startIndex + chunkSize, text.length);
      
      // Try to break at word boundary
      if (endIndex < text.length) {
        const lastSpaceIndex = text.lastIndexOf(' ', endIndex);
        if (lastSpaceIndex > startIndex) {
          endIndex = lastSpaceIndex;
        }
      }

      const content = text.substring(startIndex, endIndex);
      chunks.push({
        content,
        startIndex,
        endIndex,
        size: content.length,
      });

      startIndex = endIndex;
    }

    return chunks;
  }

  /**
   * Yield control to prevent blocking the main thread
   */
  private static async yieldControl(): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, 0);
    });
  }

  /**
   * Estimate memory usage for text processing
   */
  static estimateMemoryUsage(textLength: number, chunkSize: number = this.DEFAULT_CHUNK_SIZE): number {
    const chunks = Math.ceil(textLength / chunkSize);
    const memoryPerChunk = chunkSize * 2; // Rough estimate (2 bytes per char)
    return (chunks * memoryPerChunk) / (1024 * 1024); // Convert to MB
  }

  /**
   * Get optimal chunk size based on available memory
   */
  static getOptimalChunkSize(textLength: number, maxMemoryMB: number = this.MAX_MEMORY_USAGE): number {
    const availableMemory = maxMemoryMB * 1024 * 1024; // Convert to bytes
    const optimalChunkSize = Math.floor(availableMemory / 4); // Use 1/4 of available memory
    return Math.min(optimalChunkSize, textLength);
  }

  /**
   * Check if text processing should use memory optimization
   */
  static shouldUseMemoryOptimization(textLength: number): boolean {
    const estimatedMemory = this.estimateMemoryUsage(textLength);
    return estimatedMemory > 10; // Use optimization for texts > 10MB estimated memory
  }
}
