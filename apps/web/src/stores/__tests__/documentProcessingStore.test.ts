/**
 * Tests for DocumentProcessingStore
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useDocumentProcessingStore } from '../documentProcessingStore'
import type { Document, ProcessingError } from '../../types/document'

describe('DocumentProcessingStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useDocumentProcessingStore.getState().reset()
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useDocumentProcessingStore.getState()
      
      expect(state.currentDocument).toBeNull()
      expect(state.processingStatus).toBeNull()
      expect(state.uploadProgress).toBe(0)
      expect(state.error).toBeNull()
      expect(state.isUploading).toBe(false)
      expect(state.isProcessing).toBe(false)
      expect(state.isCompleted).toBe(false)
      expect(state.isFailed).toBe(false)
      expect(state.canRetry).toBe(false)
    })
  })

  describe('startUpload', () => {
    it('should set upload state correctly', () => {
      const document: Document = {
        id: 'test-id',
        filename: 'test.pdf',
        file_path: '/test.pdf',
        file_size: 1024,
        upload_status: 'uploading',
        extracted_text: '',
        text_length: 0,
        processing_progress: 0,
        created_at: new Date(),
      }

      useDocumentProcessingStore.getState().startUpload(document)

      const state = useDocumentProcessingStore.getState()
      expect(state.currentDocument).toEqual(document)
      expect(state.isUploading).toBe(true)
      expect(state.uploadProgress).toBe(0)
      expect(state.error).toBeNull()
      expect(state.processingStatus).toEqual({
        status: 'uploading',
        progress: 0,
        current_step: 'uploading',
        message: 'Uploading file...',
      })
    })
  })

  describe('updateProcessingProgress', () => {
    it('should update progress correctly', () => {
      const document: Document = {
        id: 'test-id',
        filename: 'test.pdf',
        file_path: '/test.pdf',
        file_size: 1024,
        upload_status: 'processing',
        extracted_text: '',
        text_length: 0,
        processing_progress: 0,
        created_at: new Date(),
      }

      useDocumentProcessingStore.getState().startUpload(document)
      useDocumentProcessingStore.getState().updateProcessingProgress(50, 'extracting', 'Extracting text...')

      const state = useDocumentProcessingStore.getState()
      expect(state.processingStatus?.progress).toBe(50)
      expect(state.processingStatus?.current_step).toBe('extracting')
      expect(state.processingStatus?.message).toBe('Extracting text...')
      expect(state.uploadProgress).toBe(100) // Should be 100 for non-uploading steps
    })
  })

  describe('completeProcessing', () => {
    it('should complete processing successfully', () => {
      const document: Document = {
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
      }

      useDocumentProcessingStore.getState().completeProcessing(document)

      const state = useDocumentProcessingStore.getState()
      expect(state.currentDocument).toEqual(document)
      expect(state.isUploading).toBe(false)
      expect(state.isProcessing).toBe(false)
      expect(state.uploadProgress).toBe(100)
      expect(state.processingStatus?.status).toBe('completed')
      expect(state.error).toBeNull()
      expect(state.isCompleted).toBe(true)
    })
  })

  describe('failProcessing', () => {
    it('should handle processing failure correctly', () => {
      const error: ProcessingError = {
        code: 'PROCESSING_FAILED',
        message: 'Processing failed',
        recoverable: true,
        retryable: true,
      }

      useDocumentProcessingStore.getState().failProcessing(error)

      const state = useDocumentProcessingStore.getState()
      expect(state.isUploading).toBe(false)
      expect(state.isProcessing).toBe(false)
      expect(state.processingStatus?.status).toBe('failed')
      expect(state.processingStatus?.error).toEqual(error)
      expect(state.error).toEqual(error)
      expect(state.isFailed).toBe(true)
      expect(state.canRetry).toBe(true)
    })
  })

  describe('reset', () => {
    it('should reset state to initial values', () => {
      const document: Document = {
        id: 'test-id',
        filename: 'test.pdf',
        file_path: '/test.pdf',
        file_size: 1024,
        upload_status: 'processing',
        extracted_text: '',
        text_length: 0,
        processing_progress: 50,
        created_at: new Date(),
      }

      useDocumentProcessingStore.getState().startUpload(document)
      useDocumentProcessingStore.getState().reset()

      const state = useDocumentProcessingStore.getState()
      expect(state.currentDocument).toBeNull()
      expect(state.processingStatus).toBeNull()
      expect(state.uploadProgress).toBe(0)
      expect(state.error).toBeNull()
      expect(state.isUploading).toBe(false)
      expect(state.isProcessing).toBe(false)
    })
  })

  describe('computed values', () => {
    it('should compute isCompleted correctly', () => {
      const state = useDocumentProcessingStore.getState()
      expect(state.isCompleted).toBe(false)

      state.completeProcessing({
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
      })

      expect(state.isCompleted).toBe(true)
    })

    it('should compute isFailed correctly', () => {
      const state = useDocumentProcessingStore.getState()
      expect(state.isFailed).toBe(false)

      state.failProcessing({
        code: 'TEST_ERROR',
        message: 'Test error',
        recoverable: true,
        retryable: true,
      })

      expect(state.isFailed).toBe(true)
    })

    it('should compute canRetry correctly', () => {
      const state = useDocumentProcessingStore.getState()
      expect(state.canRetry).toBe(false)

      state.failProcessing({
        code: 'TEST_ERROR',
        message: 'Test error',
        recoverable: true,
        retryable: true,
      })

      expect(state.canRetry).toBe(true)
    })
  })
})
