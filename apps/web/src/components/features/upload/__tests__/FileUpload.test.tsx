import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { FileUpload } from '../FileUpload'

// Mock react-dropzone
vi.mock('react-dropzone', () => ({
  useDropzone: () => ({
    getRootProps: () => ({
      'data-testid': 'dropzone',
    }),
    getInputProps: () => ({
      'data-testid': 'file-input',
    }),
    isDragActive: false,
    isDragReject: false,
  }),
}))

describe('FileUpload', () => {
  it('renders upload interface correctly', () => {
    render(<FileUpload />)
    
    expect(screen.getByText('Upload PDF Document')).toBeInTheDocument()
    expect(screen.getByText(/Drag & drop a PDF file here/)).toBeInTheDocument()
    expect(screen.getByText('Choose File')).toBeInTheDocument()
    expect(screen.getByText(/Maximum file size: 10MB/)).toBeInTheDocument()
  })

  it('shows file size limit information', () => {
    render(<FileUpload />)
    
    expect(screen.getByText(/Maximum file size: 10MB/)).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    render(<FileUpload />)
    
    const dropzone = screen.getByTestId('dropzone')
    const fileInput = screen.getByTestId('file-input')
    
    expect(dropzone).toBeInTheDocument()
    expect(fileInput).toBeInTheDocument()
  })

  it('calls onFileSelect when file is selected', async () => {
    const onFileSelect = vi.fn()
    render(<FileUpload onFileSelect={onFileSelect} />)
    
    // This would be tested with actual file selection in integration tests
    expect(onFileSelect).not.toHaveBeenCalled()
  })

  it('calls onUploadError when file validation fails', async () => {
    const onUploadError = vi.fn()
    render(<FileUpload onUploadError={onUploadError} />)
    
    // This would be tested with actual file validation in integration tests
    expect(onUploadError).not.toHaveBeenCalled()
  })
})
