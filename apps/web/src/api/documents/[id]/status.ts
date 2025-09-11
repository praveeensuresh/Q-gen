/**
 * API endpoint for document processing status
 * Handles real-time status updates for document processing
 */

import type { ProcessingStatusResponse, ApiResponse } from '../../../types/document';
import type { ApiError } from '../../../types/api';

/**
 * GET /api/documents/[id]/status - Get processing status
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

    // Mock implementation - return processing status
    const status: ProcessingStatusResponse = {
      document_id: documentId,
      status: 'processing',
      progress: 75,
      current_step: 'extracting',
      message: 'Extracting text from PDF...',
      estimated_completion: new Date(Date.now() + 30000).toISOString(),
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: status,
      } as ApiResponse<ProcessingStatusResponse>),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Get status error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'GET_STATUS_FAILED',
          message: error instanceof Error ? error.message : 'Failed to get status',
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