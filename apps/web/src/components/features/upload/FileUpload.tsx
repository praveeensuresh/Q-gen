import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Alert,
  LinearProgress,
  Paper,
  Chip,
  useTheme,
} from '@mui/material'
import {
  CloudUpload,
  InsertDriveFile,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material'
import { config } from '../../../config/env'
import { documentService } from '../../../services/documentService'
import { useDocumentProcessingSelectors } from '../../../stores/documentProcessingStore'
import type { DocumentResponse } from '../../../types/document'

interface FileUploadProps {
  onFileSelect?: (file: File) => void
  onUploadStart?: () => void
  onUploadComplete?: (file: File) => void
  onUploadError?: (error: string) => void
}

interface UploadState {
  file: File | null
  isUploading: boolean
  progress: number
  error: string | null
  success: boolean
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onUploadStart,
  onUploadComplete,
  onUploadError,
}) => {
  const navigate = useNavigate()
  const theme = useTheme()
  const { startUpload, updateProcessingProgress } = useDocumentProcessingSelectors()
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    isUploading: false,
    progress: 0,
    error: null,
    success: false,
  })

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (file.type !== 'application/pdf') {
      return 'Please upload a PDF file only'
    }

    // Check file size
    if (file.size > config.upload.maxFileSize) {
      const maxSizeMB = Math.round(config.upload.maxFileSize / (1024 * 1024))
      return `File size exceeds ${maxSizeMB}MB limit`
    }

    // Check for file corruption (basic check)
    if (file.size === 0) {
      return 'File appears to be corrupted or empty'
    }

    return null
  }, [])

  const handleFileSelect = useCallback(
    (file: File) => {
      const validationError = validateFile(file)
      
      if (validationError) {
        setUploadState(prev => ({
          ...prev,
          error: validationError,
          success: false,
        }))
        onUploadError?.(validationError)
        return
      }

      setUploadState(prev => ({
        ...prev,
        file,
        error: null,
        success: false,
      }))
      onFileSelect?.(file)
    },
    [validateFile, onFileSelect, onUploadError]
  )

  const uploadFile = useCallback(
    async (file: File) => {
      setUploadState(prev => ({ ...prev, isUploading: true, progress: 0, error: null }))
      onUploadStart?.()

      try {
        // Create document record for processing
        const document: DocumentResponse = {
          id: crypto.randomUUID(),
          filename: file.name,
          file_path: '', // Will be set after upload
          file_size: file.size,
          upload_status: 'uploading',
          processing_progress: 0,
          created_at: new Date().toISOString(),
        }

        // Start upload process
        startUpload(document as any)
        updateProcessingProgress(0, 'uploading', 'Uploading file...')

        // Upload file to server
        const result = await documentService.instance.uploadDocument({ file })

        // Update progress
        updateProcessingProgress(50, 'extracting', 'Starting text extraction...')
        setUploadState(prev => ({ ...prev, progress: 50 }))

        // Navigate to processing page
        navigate(`/processing/${result.id}`)

        // Complete upload
        setUploadState(prev => ({
          ...prev,
          isUploading: false,
          progress: 100,
          success: true,
          error: null,
        }))
        onUploadComplete?.(file)

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed'
        setUploadState(prev => ({
          ...prev,
          isUploading: false,
          progress: 0,
          success: false,
          error: errorMessage,
        }))
        onUploadError?.(errorMessage)
      }
    },
    [onUploadStart, onUploadComplete, onUploadError, startUpload, updateProcessingProgress, navigate]
  )

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return

      // Only allow single file
      const file = acceptedFiles[0]
      handleFileSelect(file)
    },
    [handleFileSelect]
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    multiple: false,
    maxSize: config.upload.maxFileSize,
  })

  const handleUpload = () => {
    if (uploadState.file && !uploadState.isUploading) {
      uploadFile(uploadState.file)
    }
  }

  const handleReset = () => {
    setUploadState({
      file: null,
      isUploading: false,
      progress: 0,
      error: null,
      success: false,
    })
  }

  const getDropzoneStyles = () => {
    let borderColor = theme.palette.divider
    let backgroundColor = theme.palette.background.paper

    if (isDragActive && !isDragReject) {
      borderColor = theme.palette.primary.main
      backgroundColor = theme.palette.primary.light + '20' // 20% opacity
    } else if (isDragReject) {
      borderColor = theme.palette.error.main
      backgroundColor = theme.palette.error.light + '20' // 20% opacity
    }

    return {
      border: `2px dashed ${borderColor}`,
      backgroundColor,
      borderRadius: 2,
      padding: 3,
      textAlign: 'center' as const,
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.action.hover,
      },
    }
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Upload PDF Document
      </Typography>
      
      <Paper
        {...getRootProps()}
        sx={getDropzoneStyles()}
        elevation={isDragActive ? 4 : 1}
      >
        <input {...getInputProps()} />
        
        <CloudUpload
          sx={{
            fontSize: 48,
            color: isDragActive ? 'primary.main' : 'text.secondary',
            mb: 2,
          }}
        />
        
        <Typography variant="h6" gutterBottom>
          {isDragActive
            ? 'Drop the PDF file here'
            : 'Drag & drop a PDF file here, or click to select'}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Maximum file size: {Math.round(config.upload.maxFileSize / (1024 * 1024))}MB
        </Typography>
        
        <Button variant="outlined" disabled={isDragActive}>
          Choose File
        </Button>
      </Paper>

      {uploadState.file && (
        <Box mt={2}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" gap={2}>
              <InsertDriveFile color="primary" />
              <Box flexGrow={1}>
                <Typography variant="body1" noWrap>
                  {uploadState.file.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {(uploadState.file.size / (1024 * 1024)).toFixed(2)} MB
                </Typography>
              </Box>
              <Chip
                icon={uploadState.success ? <CheckCircle /> : <ErrorIcon />}
                label={uploadState.success ? 'Ready' : 'Selected'}
                color={uploadState.success ? 'success' : 'default'}
                size="small"
              />
            </Box>
            
            {uploadState.isUploading && (
              <Box mt={2}>
                <LinearProgress variant="determinate" value={uploadState.progress} />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  Uploading... {uploadState.progress}%
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      )}

      {uploadState.error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {uploadState.error}
        </Alert>
      )}

      {uploadState.success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          File uploaded successfully! You can now proceed to generate questions.
        </Alert>
      )}

      <Box display="flex" gap={2} mt={2}>
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!uploadState.file || uploadState.isUploading || uploadState.success}
        >
          {uploadState.isUploading ? 'Uploading...' : 'Upload File'}
        </Button>
        
        {uploadState.file && (
          <Button
            variant="outlined"
            onClick={handleReset}
            disabled={uploadState.isUploading}
          >
            Reset
          </Button>
        )}
      </Box>
    </Box>
  )
}
