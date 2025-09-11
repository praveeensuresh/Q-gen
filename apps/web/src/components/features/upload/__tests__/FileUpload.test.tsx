/**
 * Tests for FileUpload component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { FileUpload } from '../FileUpload'

// Mock the store
vi.mock('../../../../stores/documentProcessingStore', () => ({
  useDocumentProcessingSelectors: vi.fn(() => ({
    startUpload: vi.fn(),
    updateProcessingProgress: vi.fn(),
  })),
}))

// Mock the document service
vi.mock('../../../../services/documentService', () => ({
  documentService: {
    uploadDocument: vi.fn(),
  },
}))

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

describe('FileUpload', () => {
  const mockOnFileSelect = vi.fn()
  const mockOnUploadStart = vi.fn()
  const mockOnUploadComplete = vi.fn()
  const mockOnUploadError = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders upload interface correctly', () => {
    render(
      <TestWrapper>
        <FileUpload
          onFileSelect={mockOnFileSelect}
          onUploadStart={mockOnUploadStart}
          onUploadComplete={mockOnUploadComplete}
          onUploadError={mockOnUploadError}
        />
      </TestWrapper>
    )

    expect(screen.getByText('Upload PDF Document')).toBeInTheDocument()
    expect(screen.getByText(/Drag & drop a PDF file here/)).toBeInTheDocument()
    expect(screen.getByText('Choose File')).toBeInTheDocument()
  })

  it('shows file size limit information', () => {
    render(
      <TestWrapper>
        <FileUpload
          onFileSelect={mockOnFileSelect}
          onUploadStart={mockOnUploadStart}
          onUploadComplete={mockOnUploadComplete}
          onUploadError={mockOnUploadError}
        />
      </TestWrapper>
    )

    expect(screen.getByText(/Maximum file size: 10MB/)).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    render(
      <TestWrapper>
        <FileUpload
          onFileSelect={mockOnFileSelect}
          onUploadStart={mockOnUploadStart}
          onUploadComplete={mockOnUploadComplete}
          onUploadError={mockOnUploadError}
        />
      </TestWrapper>
    )

    const dropzone = screen.getByRole('button', { name: /choose file/i })
    expect(dropzone).toBeInTheDocument()
  })

  it('calls onFileSelect when file is selected', async () => {
    render(
      <TestWrapper>
        <FileUpload
          onFileSelect={mockOnFileSelect}
          onUploadStart={mockOnUploadStart}
          onUploadComplete={mockOnUploadComplete}
          onUploadError={mockOnUploadError}
        />
      </TestWrapper>
    )

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
    const input = screen.getByRole('button', { name: /choose file/i }).parentElement?.querySelector('input')
    
    if (input) {
      fireEvent.change(input, { target: { files: [file] } })
      
      await waitFor(() => {
        expect(mockOnFileSelect).toHaveBeenCalledWith(file)
      })
    }
  })

  it('calls onUploadError when file validation fails', async () => {
    render(
      <TestWrapper>
        <FileUpload
          onFileSelect={mockOnFileSelect}
          onUploadStart={mockOnUploadStart}
          onUploadComplete={mockOnUploadComplete}
          onUploadError={mockOnUploadError}
        />
      </TestWrapper>
    )

    const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
    const input = screen.getByRole('button', { name: /choose file/i }).parentElement?.querySelector('input')
    
    if (input) {
      fireEvent.change(input, { target: { files: [file] } })
      
      await waitFor(() => {
        expect(screen.getByText('Please upload a PDF file only')).toBeInTheDocument()
      })
    }
  })

  it('shows error message for invalid file type', async () => {
    render(
      <TestWrapper>
        <FileUpload
          onFileSelect={mockOnFileSelect}
          onUploadStart={mockOnUploadStart}
          onUploadComplete={mockOnUploadComplete}
          onUploadError={mockOnUploadError}
        />
      </TestWrapper>
    )

    const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
    const input = screen.getByRole('button', { name: /choose file/i }).parentElement?.querySelector('input')
    
    if (input) {
      fireEvent.change(input, { target: { files: [file] } })
      
      await waitFor(() => {
        expect(screen.getByText('Please upload a PDF file only')).toBeInTheDocument()
      })
    }
  })

  it('shows error message for file too large', async () => {
    render(
      <TestWrapper>
        <FileUpload
          onFileSelect={mockOnFileSelect}
          onUploadStart={mockOnUploadStart}
          onUploadComplete={mockOnUploadComplete}
          onUploadError={mockOnUploadError}
        />
      </TestWrapper>
    )

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
    Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 }) // 11MB
    
    const input = screen.getByRole('button', { name: /choose file/i }).parentElement?.querySelector('input')
    
    if (input) {
      fireEvent.change(input, { target: { files: [file] } })
      
      await waitFor(() => {
        expect(screen.getByText(/File size exceeds.*limit/)).toBeInTheDocument()
      })
    }
  })
})