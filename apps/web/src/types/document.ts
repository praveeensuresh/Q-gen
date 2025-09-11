/**
 * Document-related type definitions for PDF processing
 */

export type UploadStatus = 'uploading' | 'processing' | 'completed' | 'failed';

export interface Document {
  id: string;
  filename: string;
  file_path: string;
  file_size: number;
  upload_status: UploadStatus;
  extracted_text: string;
  text_length: number;
  processing_progress: number; // 0-100
  error_message?: string;
  created_at: Date;
  processed_at?: Date;
  metadata?: {
    page_count?: number;
    text_quality_score?: number;
    processing_duration?: number;
  };
}

export interface ProcessingStatus {
  status: UploadStatus;
  progress: number;
  current_step: 'uploading' | 'extracting' | 'cleaning' | 'validating' | 'completed';
  message: string;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

export interface UploadRequest {
  file: File;
  metadata?: {
    title?: string;
    description?: string;
  };
}

export interface DocumentResponse {
  id: string;
  filename: string;
  file_path: string;
  file_size: number;
  upload_status: UploadStatus;
  processing_progress: number;
  extracted_text?: string;
  text_length?: number;
  metadata?: string | {
    page_count?: number;
    text_quality_score?: number;
    processing_duration?: number;
  }; // JSON string from database or parsed object
  created_at: string;
  processed_at?: string;
  error_message?: string;
}

export interface ProcessingStatusResponse {
  document_id: string;
  status: UploadStatus;
  progress: number;
  current_step: string;
  message: string;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  estimated_completion?: string;
}

export interface TextExtractionResult {
  text: string;
  pageCount: number;
  textLength: number;
  qualityMetrics: TextQualityMetrics;
  processingTime: number;
  metadata: {
    originalFilename: string;
    fileSize: number;
    extractionMethod: string;
  };
}

export interface TextQualityMetrics {
  wordCount: number;
  sentenceCount: number;
  averageWordsPerSentence: number;
  readabilityScore: number;
  textDensity: number;
  hasImages: boolean;
}

export interface ProcessingError {
  code: string;
  message: string;
  details?: Record<string, any>;
  recoverable: boolean;
  retryable: boolean;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId: string;
  };
  success: boolean;
}
