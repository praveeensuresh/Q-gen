/**
 * Zustand store for document processing state management
 * Handles upload progress, processing status, and error states
 */

import { create } from 'zustand';
import type { 
  Document, 
  ProcessingStatus, 
  ProcessingError
} from '../types/document';

interface DocumentProcessingState {
  // Current document being processed
  currentDocument: Document | null;
  
  // Processing status
  processingStatus: ProcessingStatus | null;
  
  // Upload progress
  uploadProgress: number;
  
  // Error state
  error: ProcessingError | null;
  
  // Loading states
  isUploading: boolean;
  isProcessing: boolean;
  
  // Actions
  setCurrentDocument: (document: Document | null) => void;
  setProcessingStatus: (status: ProcessingStatus | null) => void;
  setUploadProgress: (progress: number) => void;
  setError: (error: ProcessingError | null) => void;
  setIsUploading: (uploading: boolean) => void;
  setIsProcessing: (processing: boolean) => void;
  
  // Complex actions
  startUpload: (document: Document) => void;
  updateProcessingProgress: (progress: number, step: ProcessingStatus['current_step'], message: string) => void;
  completeProcessing: (document: Document) => void;
  failProcessing: (error: ProcessingError) => void;
  reset: () => void;
  
  // Computed values
  isCompleted: boolean;
  isFailed: boolean;
  canRetry: boolean;
}

export const useDocumentProcessingStore = create<DocumentProcessingState>((set, get) => ({
  // Initial state
  currentDocument: null,
  processingStatus: null,
  uploadProgress: 0,
  error: null,
  isUploading: false,
  isProcessing: false,

  // Basic setters
  setCurrentDocument: (document) => set({ currentDocument: document }),
  setProcessingStatus: (status) => set({ processingStatus: status }),
  setUploadProgress: (progress) => set({ uploadProgress: progress }),
  setError: (error) => set({ error }),
  setIsUploading: (uploading) => set({ isUploading: uploading }),
  setIsProcessing: (processing) => set({ isProcessing: processing }),

  // Complex actions
  startUpload: (document) => set({
    currentDocument: document,
    isUploading: true,
    uploadProgress: 0,
    error: null,
    processingStatus: {
      status: 'uploading',
      progress: 0,
      current_step: 'uploading',
      message: 'Uploading file...',
    },
    isCompleted: false,
    isFailed: false,
    canRetry: false,
  }),

  updateProcessingProgress: (progress, step, message) => {
    const { processingStatus } = get();
    if (!processingStatus) return;

    set({
      processingStatus: {
        ...processingStatus,
        progress,
        current_step: step,
        message,
      },
      uploadProgress: step === 'uploading' ? progress : 100,
    });
  },

  completeProcessing: (document) => set({
    currentDocument: document,
    isUploading: false,
    isProcessing: false,
    uploadProgress: 100,
    processingStatus: {
      status: 'completed',
      progress: 100,
      current_step: 'completed',
      message: 'Processing completed successfully',
    },
    error: null,
    isCompleted: true,
    isFailed: false,
    canRetry: false,
  }),

  failProcessing: (error) => set({
    isUploading: false,
    isProcessing: false,
    processingStatus: {
      status: 'failed',
      progress: 0,
      current_step: 'uploading',
      message: error.message,
      error,
    },
    error,
    isCompleted: false,
    isFailed: true,
    canRetry: error.retryable,
  }),

  reset: () => set({
    currentDocument: null,
    processingStatus: null,
    uploadProgress: 0,
    error: null,
    isUploading: false,
    isProcessing: false,
    isCompleted: false,
    isFailed: false,
    canRetry: false,
  }),

  // Computed values
  isCompleted: false,
  isFailed: false,
  canRetry: false,
}));

// Selectors for common use cases
export const useDocumentProcessingSelectors = () => {
  const store = useDocumentProcessingStore();
  
  return {
    // Current state
    currentDocument: store.currentDocument,
    processingStatus: store.processingStatus,
    uploadProgress: store.uploadProgress,
    error: store.error,
    isUploading: store.isUploading,
    isProcessing: store.isProcessing,
    
    // Computed state
    isCompleted: store.isCompleted,
    isFailed: store.isFailed,
    canRetry: store.canRetry,
    
    // Actions
    startUpload: store.startUpload,
    updateProcessingProgress: store.updateProcessingProgress,
    completeProcessing: store.completeProcessing,
    failProcessing: store.failProcessing,
    reset: store.reset,
  };
};

// Hook for processing status updates
export const useProcessingStatus = () => {
  const { processingStatus, isProcessing, isCompleted, isFailed } = useDocumentProcessingSelectors();
  
  return {
    status: processingStatus?.status || 'idle',
    progress: processingStatus?.progress || 0,
    currentStep: processingStatus?.current_step || 'uploading',
    message: processingStatus?.message || '',
    error: processingStatus?.error,
    isProcessing,
    isCompleted,
    isFailed,
  };
};
