/**
 * API endpoint for document operations
 * Handles document upload, listing, and basic CRUD operations
 */

import { fileStorageService } from '../../services/fileStorageService';
import { textExtractionService } from '../../services/textExtractionService';
import type { DocumentResponse, ApiResponse } from '../../types/document';
import type { ApiError } from '../../types/api';

// Mock user ID for now (will be replaced with actual auth)
const MOCK_USER_ID = 'user-123';

/**
 * POST /api/documents - Upload PDF document
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    // const metadata = formData.get('metadata') ? JSON.parse(formData.get('metadata') as string) : {};

    if (!file) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'MISSING_FILE',
            message: 'No file provided',
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
        } as ApiError),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate file
    const validation = fileStorageService.instance.validateFile(file);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'FILE_VALIDATION_FAILED',
            message: validation.error || 'File validation failed',
            details: {
              fileSize: validation.fileSize,
              fileType: validation.fileType,
            },
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID(),
          },
        } as ApiError),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate unique filename
    const filename = fileStorageService.instance.generateFilename(file.name, MOCK_USER_ID);

    // Upload file to blob storage
    const uploadResult = await fileStorageService.instance.uploadFile(file, filename);

    // Create document record (mock for now)
    const documentId = crypto.randomUUID();
    const document: DocumentResponse = {
      id: documentId,
      filename: file.name,
      file_path: uploadResult.url,
      file_size: file.size,
      upload_status: 'uploading',
      processing_progress: 0,
      created_at: new Date().toISOString(),
    };

    // Start processing in background
    processDocument(documentId, uploadResult.url, file.name, file.size)
      .catch(error => {
        console.error('Background processing failed:', error);
      });

    return new Response(
      JSON.stringify({
        success: true,
        data: document,
      } as ApiResponse<DocumentResponse>),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Document upload error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: error instanceof Error ? error.message : 'Upload failed',
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      } as ApiError),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * GET /api/documents - Get user's documents
 */
export async function GET(_request: Request): Promise<Response> {
  try {
    // Mock implementation - return empty array for now
    const documents: DocumentResponse[] = [];

    return new Response(
      JSON.stringify({
        success: true,
        data: documents,
      } as ApiResponse<DocumentResponse[]>),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Get documents error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'GET_DOCUMENTS_FAILED',
          message: error instanceof Error ? error.message : 'Failed to get documents',
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
        },
      } as ApiError),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Process document in background
 */
async function processDocument(
  documentId: string,
  fileUrl: string,
  _filename: string,
  _fileSize: number
): Promise<void> {
  try {
    console.log(`Starting processing for document ${documentId}`);

    // Fetch file from blob storage
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch file from storage');
    }

    const fileBuffer = Buffer.from(await response.arrayBuffer());

    // Extract text
    const extractionResult = await textExtractionService.instance.extractText(fileBuffer);

    // Clean text with memory optimization
    const cleanedText = extractionResult.text; // Text is already cleaned in extraction

    // Validate text quality
    if (!textExtractionService.instance.isTextQualityAcceptable(extractionResult.qualityMetrics.readabilityScore)) {
      throw new Error('Extracted text quality is too low for question generation');
    }

    console.log(`Processing completed for document ${documentId}:`, {
      textLength: cleanedText.length,
      pageCount: extractionResult.pageCount,
      qualityScore: extractionResult.qualityMetrics.readabilityScore,
      processingTime: extractionResult.processingTime,
    });

    // TODO: Store results in database
    // For now, just log the success

  } catch (error) {
    console.error(`Processing failed for document ${documentId}:`, error);
    
    // TODO: Update document status to failed in database
    // For now, just log the error
  }
}
