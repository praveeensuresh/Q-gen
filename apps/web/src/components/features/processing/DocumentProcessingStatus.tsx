/**
 * Document Processing Status Component
 * Displays real-time processing status with progress indicators and error handling
 */

import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  LinearProgress,
  Box,
  Alert,
  Button,
  Chip,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useDocumentProcessingSelectors } from '../../../stores/documentProcessingStore';
// import type { ProcessingError } from '../../../types/document';

interface DocumentProcessingStatusProps {
  documentId?: string;
  onRetry?: () => void;
  onComplete?: () => void;
}

export const DocumentProcessingStatus: React.FC<DocumentProcessingStatusProps> = ({
  documentId: _documentId,
  onRetry,
  onComplete,
}) => {
  const {
    currentDocument,
    processingStatus,
    uploadProgress: _uploadProgress,
    error,
    isUploading,
    isProcessing,
    isCompleted,
    isFailed,
    canRetry,
  } = useDocumentProcessingSelectors();

  const [showDetails, setShowDetails] = useState(false);

  // Handle completion
  useEffect(() => {
    if (isCompleted && onComplete) {
      onComplete();
    }
  }, [isCompleted, onComplete]);

  // Get status color and icon
  const getStatusColor = () => {
    if (isFailed) return 'error';
    if (isCompleted) return 'success';
    if (isProcessing || isUploading) return 'primary';
    return 'default';
  };

  const getStatusIcon = () => {
    if (isFailed) return <ErrorIcon />;
    if (isCompleted) return <CheckCircleIcon />;
    if (isProcessing || isUploading) return <CircularProgress size={20} />;
    return <UploadIcon />;
  };

  const getStepLabel = (step: string) => {
    const stepLabels: Record<string, string> = {
      uploading: 'Uploading File',
      extracting: 'Extracting Text',
      cleaning: 'Cleaning Text',
      validating: 'Validating Content',
      completed: 'Processing Complete',
    };
    return stepLabels[step] || step;
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  const handleShowDetails = () => {
    setShowDetails(!showDetails);
  };

  if (!currentDocument && !processingStatus) {
    return null;
  }

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto' }}>
      <CardHeader
        title="Document Processing"
        subheader={currentDocument?.filename || 'Processing...'}
        action={
          <Chip
            icon={getStatusIcon()}
            label={processingStatus?.status || 'Unknown'}
            color={getStatusColor()}
            variant={isCompleted ? 'filled' : 'outlined'}
          />
        }
      />
      <CardContent>
        {/* Progress Section */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
              {getStepLabel(processingStatus?.current_step || 'uploading')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {processingStatus?.progress || 0}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={processingStatus?.progress || 0}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* Status Message */}
        {processingStatus?.message && (
          <Alert severity={isFailed ? 'error' : isCompleted ? 'success' : 'info'} sx={{ mb: 2 }}>
            {processingStatus.message}
          </Alert>
        )}

        {/* Error Details */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {error.message}
            </Typography>
            {error.details && (
              <Button
                size="small"
                onClick={handleShowDetails}
                sx={{ textTransform: 'none' }}
              >
                {showDetails ? 'Hide' : 'Show'} Details
              </Button>
            )}
            {showDetails && error.details && (
              <Box sx={{ mt: 1, p: 1, bgcolor: 'error.light', borderRadius: 1 }}>
                <Typography variant="caption" component="pre" sx={{ fontSize: '0.75rem' }}>
                  {JSON.stringify(error.details, null, 2)}
                </Typography>
              </Box>
            )}
          </Alert>
        )}

        {/* Document Info */}
        {currentDocument && (
          <Box sx={{ mb: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <DescriptionIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {currentDocument.filename}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Size: {(currentDocument.file_size / 1024 / 1024).toFixed(2)} MB
            </Typography>
            {currentDocument.text_length && (
              <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                Text: {currentDocument.text_length.toLocaleString()} characters
              </Typography>
            )}
          </Box>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          {isFailed && canRetry && (
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={handleRetry}
              color="primary"
            >
              Retry
            </Button>
          )}
          {isCompleted && (
            <Button
              variant="contained"
              startIcon={<CheckCircleIcon />}
              onClick={onComplete}
              color="success"
            >
              Continue
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default DocumentProcessingStatus;
