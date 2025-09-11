/**
 * Document service for API communication
 * Handles document upload, processing, and status management
 */

import { supabase } from '@/lib/supabase'
import { pdfProcessingService } from './pdfProcessingService'
import { fileStorageService } from './fileStorageService'
import type { 
  DocumentResponse, 
  ProcessingStatusResponse, 
  UploadRequest,
  ApiResponse,
  TextExtractionResult
} from '../types/document';
import type { ApiError } from '../types/api';

export class DocumentService {
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor() {
    this.baseUrl = '/api/documents';
    this.timeout = 30000; // 30 seconds
  }

  /**
   * Upload PDF document
   */
  async uploadDocument(request: UploadRequest): Promise<DocumentResponse> {
    try {
      // Validate file
      const validation = fileStorageService.instance.validateFile(request.file)
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid file')
      }

      // Upload file to Vercel Blob storage
      const blobResult = await fileStorageService.instance.uploadFile(request.file)
      
      // Create document record in Supabase
      const { data: document, error } = await supabase
        .from('documents')
        .insert({
          filename: request.file.name,
          file_path: blobResult.url,
          file_size: request.file.size,
          upload_status: 'uploading',
          processing_progress: 0,
        })
        .select()
        .single()

      if (error) {
        // Log the error but don't try to cleanup file (CORS issues with Vercel Blob delete)
        console.error('Database insert failed:', error)
        throw new Error(`Database error: ${error.message}`)
      }

      return {
        id: document.id,
        filename: document.filename,
        file_path: document.file_path,
        file_size: document.file_size,
        upload_status: document.upload_status,
        processing_progress: document.processing_progress,
        created_at: document.created_at,
        processed_at: document.processed_at,
      }
    } catch (error) {
      console.error('Upload error:', error)
      throw new Error(error instanceof Error ? error.message : 'Upload failed')
    }
  }

  /**
   * Get document details
   */
  async getDocument(documentId: string): Promise<DocumentResponse> {
    try {
      const { data: document, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      if (!document) {
        throw new Error('Document not found');
      }

      return {
        id: document.id,
        filename: document.filename,
        file_path: document.file_path,
        file_size: document.file_size,
        upload_status: document.upload_status,
        processing_progress: document.processing_progress,
        extracted_text: document.extracted_text,
        text_length: document.text_length,
        metadata: document.metadata,
        created_at: document.created_at,
        processed_at: document.processed_at,
        error_message: document.error_message,
      };
    } catch (error) {
      console.error('Get document error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get document');
    }
  }

  /**
   * Get processing status
   */
  async getProcessingStatus(documentId: string): Promise<ProcessingStatusResponse> {
    try {
      const document = await this.getDocument(documentId);
      
      return {
        document_id: documentId,
        status: document.upload_status,
        progress: document.processing_progress,
        current_step: this.getCurrentStep(document.upload_status, document.processing_progress),
        message: this.getStatusMessage(document.upload_status, document.processing_progress),
        error: document.error_message ? {
          code: 'PROCESSING_ERROR',
          message: document.error_message,
        } : undefined,
        estimated_completion: document.processed_at,
      };
    } catch (error) {
      console.error('Get processing status error:', error);
      return {
        document_id: documentId,
        status: 'failed',
        progress: 0,
        current_step: 'uploading',
        message: 'Failed to get processing status',
        error: {
          code: 'STATUS_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Get current processing step based on status and progress
   */
  private getCurrentStep(status: string, progress: number): string {
    switch (status) {
      case 'uploading':
        return 'uploading';
      case 'processing':
        if (progress < 30) return 'extracting';
        if (progress < 80) return 'cleaning';
        return 'validating';
      case 'completed':
        return 'completed';
      case 'failed':
        return 'uploading';
      default:
        return 'uploading';
    }
  }

  /**
   * Get status message based on status and progress
   */
  private getStatusMessage(status: string, progress: number): string {
    switch (status) {
      case 'uploading':
        return 'Uploading file...';
      case 'processing':
        if (progress < 30) return 'Extracting text from PDF...';
        if (progress < 80) return 'Processing and cleaning text...';
        return 'Finalizing processing...';
      case 'completed':
        return 'Processing completed successfully';
      case 'failed':
        return 'Processing failed';
      default:
        return 'Unknown status';
    }
  }

  /**
   * Start document processing
   */
  async startProcessing(documentId: string): Promise<void> {
    try {
      // Get document details
      const document = await this.getDocument(documentId);
      
      // Update status to processing
      await this.updateDocumentStatus(documentId, 'processing', 10, 'Starting text extraction...');

      // Download file from storage
      const file = await this.downloadFileFromStorage(document.file_path);
      
      // Extract text from PDF
      const extractionResult = await pdfProcessingService.instance.extractText(file);
      
      // Update progress
      await this.updateDocumentStatus(documentId, 'processing', 80, 'Text extraction completed, finalizing...');

      // Update document with extracted text
      await this.updateDocumentWithExtractedText(documentId, extractionResult);

      // Mark as completed
      await this.updateDocumentStatus(documentId, 'completed', 100, 'Processing completed successfully');

    } catch (error) {
      console.error('Processing error:', error);
      await this.updateDocumentStatus(documentId, 'failed', 0, error instanceof Error ? error.message : 'Processing failed');
      throw error;
    }
  }

  /**
   * Download file from storage with CORS handling
   */
  private async downloadFileFromStorage(filePath: string): Promise<File> {
    try {
      // Try multiple approaches to handle CORS issues
      const downloadMethods = [
        // Method 1: Direct fetch with CORS headers
        () => fetch(filePath, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Accept': 'application/pdf',
            'Origin': window.location.origin,
          },
        }),
        // Method 2: Fetch without CORS mode (for same-origin requests)
        () => fetch(filePath, {
          method: 'GET',
          headers: {
            'Accept': 'application/pdf',
          },
        }),
        // Method 3: Use a proxy endpoint if available
        () => fetch(`/api/proxy-download?url=${encodeURIComponent(filePath)}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/pdf',
          },
        })
      ];

      let response: Response | null = null;
      let lastError: Error | null = null;

      for (const method of downloadMethods) {
        try {
          response = await method();
          if (response.ok) {
            break;
          }
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Unknown error');
        }
      }

      if (!response || !response.ok) {
        throw lastError || new Error(`Failed to download file from storage: ${response?.status || 'Unknown'} ${response?.statusText || 'Unknown error'}`);
      }
      
      const blob = await response.blob();
      
      // Ensure the blob is a PDF
      if (blob.type !== 'application/pdf') {
        console.warn('Blob type is not PDF:', blob.type, 'forcing to PDF');
      }
      
      return new File([blob], 'document.pdf', { type: 'application/pdf' });
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new Error(`Failed to download file for processing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update document status in database
   */
  private async updateDocumentStatus(
    documentId: string, 
    status: string, 
    progress: number, 
    message: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('documents')
        .update({
          upload_status: status,
          processing_progress: progress,
          error_message: status === 'failed' ? message : null,
          processed_at: status === 'completed' ? new Date().toISOString() : null,
        })
        .eq('id', documentId);

      if (error) {
        throw new Error(`Database update error: ${error.message}`);
      }
    } catch (error) {
      console.error('Status update error:', error);
      throw error;
    }
  }

  /**
   * Update document with extracted text
   */
  private async updateDocumentWithExtractedText(
    documentId: string, 
    extractionResult: TextExtractionResult
  ): Promise<void> {
    try {
      // First, try to update with metadata
      const { error: metadataError } = await supabase
        .from('documents')
        .update({
          extracted_text: extractionResult.text,
          text_length: extractionResult.textLength,
          metadata: {
            page_count: extractionResult.pageCount,
            text_quality_score: extractionResult.qualityMetrics.readabilityScore,
            processing_duration: Date.now() - extractionResult.processingTime,
          },
        })
        .eq('id', documentId);

      if (metadataError) {
        // If metadata column doesn't exist, try without it
        if (metadataError.message.includes('metadata') && metadataError.message.includes('column')) {
          console.warn('Metadata column not found, updating without metadata');
          
          const { error: fallbackError } = await supabase
            .from('documents')
            .update({
              extracted_text: extractionResult.text,
              text_length: extractionResult.textLength,
            })
            .eq('id', documentId);

          if (fallbackError) {
            throw new Error(`Database update error: ${fallbackError.message}`);
          }
        } else {
          throw new Error(`Database update error: ${metadataError.message}`);
        }
      }
    } catch (error) {
      console.error('Text update error:', error);
      throw error;
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId: string): Promise<void> {
    // Mock implementation
    console.log(`Mock deleteDocument called for document: ${documentId}`);
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  /**
   * Get user's documents
   */
  async getUserDocuments(): Promise<DocumentResponse[]> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}`);

      if (!response.ok) {
        const error = await response.json() as ApiError;
        throw new Error(error.error.message);
      }

      const result = await response.json() as ApiResponse<DocumentResponse[]>;
      return result.data || [];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to get documents');
    }
  }

  /**
   * Fetch with timeout and error handling
   */
  private async fetchWithTimeout(
    url: string, 
    options: RequestInit = {}
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout. Please try again.');
      }
      
      throw error;
    }
  }

  /**
   * Poll processing status until completion
   */
  async pollProcessingStatus(
    documentId: string, 
    onUpdate: (status: ProcessingStatusResponse) => void,
    interval: number = 1000
  ): Promise<ProcessingStatusResponse> {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const status = await this.getProcessingStatus(documentId);
          onUpdate(status);

          if (status.status === 'completed' || status.status === 'failed') {
            resolve(status);
            return;
          }

          setTimeout(poll, interval);
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }
}

// Lazy initialization to avoid constructor running at module load time
let _documentService: DocumentService | null = null;

export const documentService = {
  get instance() {
    if (!_documentService) {
      _documentService = new DocumentService();
    }
    return _documentService;
  }
};
