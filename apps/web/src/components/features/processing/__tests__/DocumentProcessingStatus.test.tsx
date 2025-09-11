/**
 * Tests for DocumentProcessingStatus component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { DocumentProcessingStatus } from '../DocumentProcessingStatus'
import { useDocumentProcessingSelectors } from '../../../../stores/documentProcessingStore'

// Mock the store
vi.mock('../../../../stores/documentProcessingStore', () => ({
  useDocumentProcessingSelectors: vi.fn(),
}))

const mockUseDocumentProcessingSelectors = vi.mocked(useDocumentProcessingSelectors)

describe('DocumentProcessingStatus', () => {
  const mockOnRetry = vi.fn()
  const mockOnComplete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseDocumentProcessingSelectors.mockReturnValue({
      currentDocument: null,
      processingStatus: null,
      uploadProgress: 0,
      error: null,
      isUploading: false,
      isProcessing: false,
      isCompleted: false,
      isFailed: false,
      canRetry: false,
      startUpload: vi.fn(),
      updateProcessingProgress: vi.fn(),
      completeProcessing: vi.fn(),
      failProcessing: vi.fn(),
      reset: vi.fn(),
    })
  })

  it('should render nothing when no document or status', () => {
    const { container } = render(
      <BrowserRouter>
        <DocumentProcessingStatus
          onRetry={mockOnRetry}
          onComplete={mockOnComplete}
        />
      </BrowserRouter>
    )
    
    expect(container.firstChild).toBeNull()
  })

  it('should render processing status when document is provided', () => {
    mockUseDocumentProcessingSelectors.mockReturnValue({
      currentDocument: {
        id: 'test-id',
        filename: 'test.pdf',
        file_path: '/test.pdf',
        file_size: 1024,
        upload_status: 'processing',
        extracted_text: '',
        text_length: 0,
        processing_progress: 50,
        created_at: new Date(),
      },
      processingStatus: {
        status: 'processing',
        progress: 50,
        current_step: 'extracting',
        message: 'Extracting text...',
      },
      uploadProgress: 50,
      error: null,
      isUploading: false,
      isProcessing: true,
      isCompleted: false,
      isFailed: false,
      canRetry: false,
      startUpload: vi.fn(),
      updateProcessingProgress: vi.fn(),
      completeProcessing: vi.fn(),
      failProcessing: vi.fn(),
      reset: vi.fn(),
    })

    render(
      <BrowserRouter>
        <DocumentProcessingStatus
          onRetry={mockOnRetry}
          onComplete={mockOnComplete}
        />
      </BrowserRouter>
    )

    expect(screen.getByText('Document Processing')).toBeInTheDocument()
    expect(screen.getAllByText('test.pdf')).toHaveLength(2) // Header and document info
    expect(screen.getByText('Extracting Text')).toBeInTheDocument()
    expect(screen.getByText('Extracting text...')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('should render error state when processing fails', () => {
    const error = {
      code: 'PROCESSING_FAILED',
      message: 'Processing failed',
      recoverable: true,
      retryable: true,
    }

    mockUseDocumentProcessingSelectors.mockReturnValue({
      currentDocument: {
        id: 'test-id',
        filename: 'test.pdf',
        file_path: '/test.pdf',
        file_size: 1024,
        upload_status: 'failed',
        extracted_text: '',
        text_length: 0,
        processing_progress: 0,
        created_at: new Date(),
      },
      processingStatus: {
        status: 'failed',
        progress: 0,
        current_step: 'uploading',
        message: 'Processing failed',
        error,
      },
      uploadProgress: 0,
      error,
      isUploading: false,
      isProcessing: false,
      isCompleted: false,
      isFailed: true,
      canRetry: true,
      startUpload: vi.fn(),
      updateProcessingProgress: vi.fn(),
      completeProcessing: vi.fn(),
      failProcessing: vi.fn(),
      reset: vi.fn(),
    })

    render(
      <BrowserRouter>
        <DocumentProcessingStatus
          onRetry={mockOnRetry}
          onComplete={mockOnComplete}
        />
      </BrowserRouter>
    )

    expect(screen.getAllByText('Processing failed')).toHaveLength(2) // Alert and error display
    expect(screen.getByText('Retry')).toBeInTheDocument()
  })

  it('should render completed state when processing is done', () => {
    mockUseDocumentProcessingSelectors.mockReturnValue({
      currentDocument: {
        id: 'test-id',
        filename: 'test.pdf',
        file_path: '/test.pdf',
        file_size: 1024,
        upload_status: 'completed',
        extracted_text: 'Sample text',
        text_length: 12,
        processing_progress: 100,
        created_at: new Date(),
        processed_at: new Date(),
      },
      processingStatus: {
        status: 'completed',
        progress: 100,
        current_step: 'completed',
        message: 'Processing completed successfully',
      },
      uploadProgress: 100,
      error: null,
      isUploading: false,
      isProcessing: false,
      isCompleted: true,
      isFailed: false,
      canRetry: false,
      startUpload: vi.fn(),
      updateProcessingProgress: vi.fn(),
      completeProcessing: vi.fn(),
      failProcessing: vi.fn(),
      reset: vi.fn(),
    })

    render(
      <BrowserRouter>
        <DocumentProcessingStatus
          onRetry={mockOnRetry}
          onComplete={mockOnComplete}
        />
      </BrowserRouter>
    )

    expect(screen.getByText('Processing completed successfully')).toBeInTheDocument()
    expect(screen.getByText('Continue')).toBeInTheDocument()
  })

  it('should call onRetry when retry button is clicked', () => {
    const error = {
      code: 'PROCESSING_FAILED',
      message: 'Processing failed',
      recoverable: true,
      retryable: true,
    }

    mockUseDocumentProcessingSelectors.mockReturnValue({
      currentDocument: {
        id: 'test-id',
        filename: 'test.pdf',
        file_path: '/test.pdf',
        file_size: 1024,
        upload_status: 'failed',
        extracted_text: '',
        text_length: 0,
        processing_progress: 0,
        created_at: new Date(),
      },
      processingStatus: {
        status: 'failed',
        progress: 0,
        current_step: 'uploading',
        message: 'Processing failed',
        error,
      },
      uploadProgress: 0,
      error,
      isUploading: false,
      isProcessing: false,
      isCompleted: false,
      isFailed: true,
      canRetry: true,
      startUpload: vi.fn(),
      updateProcessingProgress: vi.fn(),
      completeProcessing: vi.fn(),
      failProcessing: vi.fn(),
      reset: vi.fn(),
    })

    render(
      <BrowserRouter>
        <DocumentProcessingStatus
          onRetry={mockOnRetry}
          onComplete={mockOnComplete}
        />
      </BrowserRouter>
    )

    fireEvent.click(screen.getByText('Retry'))
    expect(mockOnRetry).toHaveBeenCalledTimes(1)
  })

  it('should call onComplete when continue button is clicked', () => {
    mockUseDocumentProcessingSelectors.mockReturnValue({
      currentDocument: {
        id: 'test-id',
        filename: 'test.pdf',
        file_path: '/test.pdf',
        file_size: 1024,
        upload_status: 'completed',
        extracted_text: 'Sample text',
        text_length: 12,
        processing_progress: 100,
        created_at: new Date(),
        processed_at: new Date(),
      },
      processingStatus: {
        status: 'completed',
        progress: 100,
        current_step: 'completed',
        message: 'Processing completed successfully',
      },
      uploadProgress: 100,
      error: null,
      isUploading: false,
      isProcessing: false,
      isCompleted: true,
      isFailed: false,
      canRetry: false,
      startUpload: vi.fn(),
      updateProcessingProgress: vi.fn(),
      completeProcessing: vi.fn(),
      failProcessing: vi.fn(),
      reset: vi.fn(),
    })

    render(
      <BrowserRouter>
        <DocumentProcessingStatus
          onRetry={mockOnRetry}
          onComplete={mockOnComplete}
        />
      </BrowserRouter>
    )

    fireEvent.click(screen.getByText('Continue'))
    expect(mockOnComplete).toHaveBeenCalledTimes(2) // Called once in useEffect and once on button click
  })
})
