import React, { useEffect, useState } from 'react'
import { Box, Typography, Container } from '@mui/material'
import { useParams, useNavigate } from 'react-router-dom'
import DocumentProcessingStatus from '../components/features/processing/DocumentProcessingStatus'
import TextExtractionProgress from '../components/features/processing/TextExtractionProgress'
import ExtractedTextPreview from '../components/features/processing/ExtractedTextPreview'
import ProcessingErrorDisplay from '../components/features/processing/ProcessingErrorDisplay'
import PerformanceMonitor from '../components/features/processing/PerformanceMonitor'
import { useDocumentProcessingSelectors } from '../stores/documentProcessingStore'
import { documentService } from '../services/documentService'
import type { Document, ProcessingError } from '../types/document'

const ProcessingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [document, setDocument] = useState<Document | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ProcessingError | null>(null)

  const {
    currentDocument,
    processingStatus,
    isCompleted,
    isFailed,
    canRetry,
    updateProcessingProgress,
    completeProcessing,
    failProcessing,
    reset,
  } = useDocumentProcessingSelectors()

  // Load document on mount
  useEffect(() => {
    const loadDocument = async () => {
      if (!id) {
        setError({
          code: 'MISSING_DOCUMENT_ID',
          message: 'Document ID is required',
          recoverable: false,
          retryable: false,
        })
        setIsLoading(false)
        return
      }

      try {
        const docResponse = await documentService.instance.getDocument(id)
        
        // Convert DocumentResponse to Document format
        const doc: Document = {
          id: docResponse.id,
          filename: docResponse.filename,
          file_path: docResponse.file_path || '',
          file_size: docResponse.file_size,
          upload_status: docResponse.upload_status,
          extracted_text: docResponse.extracted_text || '',
          text_length: docResponse.text_length || 0,
          processing_progress: docResponse.processing_progress,
          error_message: docResponse.error_message,
          created_at: new Date(docResponse.created_at),
          processed_at: docResponse.processed_at ? new Date(docResponse.processed_at) : undefined,
          metadata: docResponse.metadata ? (typeof docResponse.metadata === 'string' ? JSON.parse(docResponse.metadata) : docResponse.metadata) : undefined,
        }
        
        setDocument(doc)
        
        // Start processing if not already started
        if (doc.upload_status === 'uploading' || doc.upload_status === 'processing') {
          startProcessing(doc)
        } else if (doc.upload_status === 'completed') {
          completeProcessing(doc)
        } else if (doc.upload_status === 'failed') {
          failProcessing({
            code: 'PROCESSING_FAILED',
            message: 'Document processing failed',
            recoverable: true,
            retryable: true,
          })
        }
      } catch (err) {
        setError({
          code: 'LOAD_DOCUMENT_FAILED',
          message: err instanceof Error ? err.message : 'Failed to load document',
          recoverable: true,
          retryable: true,
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadDocument()
  }, [id])

  // Poll processing status
  useEffect(() => {
    if (!document) return

    // Only poll if document is still processing
    if (document.upload_status !== 'processing' && document.upload_status !== 'uploading') {
      return
    }

    const pollStatus = async () => {
      try {
        const status = await documentService.instance.getProcessingStatus(document.id)
        
        updateProcessingProgress(
          status.progress,
          status.current_step as any,
          status.message
        )

        if (status.status === 'completed') {
          const updatedDocResponse = await documentService.instance.getDocument(document.id)
          
          // Convert DocumentResponse to Document format
          const updatedDoc: Document = {
            id: updatedDocResponse.id,
            filename: updatedDocResponse.filename,
            file_path: updatedDocResponse.file_path || '',
            file_size: updatedDocResponse.file_size,
            upload_status: updatedDocResponse.upload_status,
            extracted_text: updatedDocResponse.extracted_text || '',
            text_length: updatedDocResponse.text_length || 0,
            processing_progress: updatedDocResponse.processing_progress,
            error_message: updatedDocResponse.error_message,
            created_at: new Date(updatedDocResponse.created_at),
            processed_at: updatedDocResponse.processed_at ? new Date(updatedDocResponse.processed_at) : undefined,
            metadata: updatedDocResponse.metadata ? (typeof updatedDocResponse.metadata === 'string' ? JSON.parse(updatedDocResponse.metadata) : updatedDocResponse.metadata) : undefined,
          }
          
          completeProcessing(updatedDoc)
        } else if (status.status === 'failed') {
          failProcessing({
            code: 'PROCESSING_FAILED',
            message: status.error?.message || 'Processing failed',
            recoverable: true,
            retryable: true,
            details: status.error?.details,
          })
        }
      } catch (err) {
        console.error('Error polling status:', err)
      }
    }

    const interval = setInterval(pollStatus, 1000)
    return () => clearInterval(interval)
  }, [document])

  const startProcessing = async (doc: Document) => {
    try {
      await documentService.instance.startProcessing(doc.id)
    } catch (err) {
      failProcessing({
        code: 'START_PROCESSING_FAILED',
        message: err instanceof Error ? err.message : 'Failed to start processing',
        recoverable: true,
        retryable: true,
      })
    }
  }

  const handleRetry = async () => {
    if (!document) return
    
    reset()
    setError(null)
    await startProcessing(document)
  }

  const handleComplete = () => {
    navigate(`/preview/${id}`)
  }

  const handleContactSupport = () => {
    // TODO: Implement contact support
    console.log('Contact support clicked')
  }

  if (isLoading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" gutterBottom>
            Loading Document...
          </Typography>
        </Box>
      </Container>
    )
  }

  if (error && !canRetry) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" gutterBottom>
            Error Loading Document
          </Typography>
          <ProcessingErrorDisplay
            error={error}
            onContactSupport={handleContactSupport}
          />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Document Processing
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Your document is being processed. This may take a few moments...
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Main Processing Status */}
          <Box sx={{ width: '100%' }}>
            <DocumentProcessingStatus
              documentId={id}
              onRetry={handleRetry}
              onComplete={handleComplete}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {/* Processing Steps */}
            <Box sx={{ flex: 1, minWidth: 300 }}>
              <TextExtractionProgress
                status={processingStatus}
                showSteps={true}
              />
            </Box>

            {/* Performance Monitor */}
            <Box sx={{ flex: 1, minWidth: 300 }}>
              <PerformanceMonitor
                showDetails={false}
                refreshInterval={5000}
              />
            </Box>
          </Box>

          {/* Error Display */}
          {isFailed && currentDocument && (
            <Box sx={{ width: '100%' }}>
              <ProcessingErrorDisplay
                error={processingStatus?.error ? {
                  ...processingStatus.error,
                  recoverable: (processingStatus.error as any).recoverable ?? true,
                  retryable: (processingStatus.error as any).retryable ?? true,
                } : {
                  code: 'UNKNOWN_ERROR',
                  message: 'An unknown error occurred',
                  recoverable: true,
                  retryable: true,
                }}
                onRetry={handleRetry}
                onContactSupport={handleContactSupport}
              />
            </Box>
          )}

          {/* Text Preview */}
          {isCompleted && currentDocument && (
            <Box sx={{ width: '100%' }}>
              <ExtractedTextPreview
                document={currentDocument}
                onTextEdit={(text) => {
                  // TODO: Implement text editing
                  console.log('Text edited:', text)
                }}
                onDownload={() => {
                  // TODO: Implement text download
                  console.log('Download text')
                }}
              />
            </Box>
          )}
        </Box>
      </Box>
    </Container>
  )
}

export default ProcessingPage
