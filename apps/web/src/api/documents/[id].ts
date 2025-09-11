/**
 * API endpoint for individual document operations
 * Handles GET and DELETE operations for specific documents
 */

import type { DocumentResponse, ApiResponse } from '../../types/document';
import type { ApiError } from '../../types/api';

/**
 * GET /api/documents/[id] - Get document details
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    const documentId = params.id;

    if (!documentId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'MISSING_DOCUMENT_ID',
            message: 'Document ID is required',
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

    // Mock implementation - return a sample document
    const document: DocumentResponse = {
      id: documentId,
      filename: 'sample-document.pdf',
      file_path: 'https://example.com/sample-document.pdf',
      file_size: 1024000,
      upload_status: 'completed',
      processing_progress: 100,
      text_length: 5000,
      created_at: new Date().toISOString(),
      processed_at: new Date().toISOString(),
    };

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
    console.error('Get document error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'GET_DOCUMENT_FAILED',
          message: error instanceof Error ? error.message : 'Failed to get document',
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
 * DELETE /api/documents/[id] - Delete document
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    const documentId = params.id;

    if (!documentId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'MISSING_DOCUMENT_ID',
            message: 'Document ID is required',
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

    // Mock implementation - simulate successful deletion
    console.log(`Deleting document: ${documentId}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: { id: documentId, deleted: true },
      } as ApiResponse<{ id: string; deleted: boolean }>),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Delete document error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'DELETE_DOCUMENT_FAILED',
          message: error instanceof Error ? error.message : 'Failed to delete document',
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