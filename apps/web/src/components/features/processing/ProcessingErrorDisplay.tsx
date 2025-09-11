/**
 * Processing Error Display Component
 * Shows user-friendly error messages with recovery options
 */

import React, { useState } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Help as HelpIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import type { ProcessingError } from '../../../types/document';

interface ProcessingErrorDisplayProps {
  error: ProcessingError;
  onRetry?: () => void;
  onContactSupport?: () => void;
  showDetails?: boolean;
}

const errorMessages: Record<string, { title: string; description: string; suggestions: string[] }> = {
  CORRUPTED_PDF: {
    title: 'PDF File is Corrupted',
    description: 'The uploaded PDF file appears to be corrupted or damaged.',
    suggestions: [
      'Try downloading the PDF again from the original source',
      'Check if the file opens correctly in a PDF viewer',
      'Ensure the file was not interrupted during upload',
      'Try converting the PDF to a different format and back',
    ],
  },
  PASSWORD_PROTECTED: {
    title: 'PDF is Password Protected',
    description: 'This PDF file is password-protected and cannot be processed.',
    suggestions: [
      'Remove the password protection from the PDF',
      'Use an unprotected version of the document',
      'Contact the document owner for an unprotected copy',
    ],
  },
  IMAGE_ONLY_PDF: {
    title: 'PDF Contains Only Images',
    description: 'This PDF contains only images without extractable text.',
    suggestions: [
      'Use a text-based PDF instead of an image-only PDF',
      'Consider using OCR software to extract text from images',
      'Convert the PDF to a text document first',
    ],
  },
  INSUFFICIENT_TEXT: {
    title: 'Insufficient Text Content',
    description: 'The PDF contains too little text for question generation.',
    suggestions: [
      'Use a longer document with more text content',
      'Combine multiple documents into one PDF',
      'Ensure the document has substantial written content',
    ],
  },
  PROCESSING_TIMEOUT: {
    title: 'Processing Timeout',
    description: 'The PDF processing is taking longer than expected.',
    suggestions: [
      'Try uploading a smaller PDF file',
      'Check your internet connection and try again',
      'Split large documents into smaller sections',
    ],
  },
  STORAGE_FAILURE: {
    title: 'Storage Error',
    description: 'Unable to store the file temporarily.',
    suggestions: [
      'Check your internet connection and try again',
      'Ensure you have sufficient storage space',
      'Try uploading the file again',
    ],
  },
  TEXT_EXTRACTION_FAILED: {
    title: 'Text Extraction Failed',
    description: 'Unable to extract text from the PDF file.',
    suggestions: [
      'Ensure the PDF is not corrupted',
      'Try a different PDF file',
      'Check if the PDF contains readable text',
    ],
  },
  MEMORY_ERROR: {
    title: 'File Too Large',
    description: 'The file is too large to process with current resources.',
    suggestions: [
      'Try uploading a smaller file (under 10MB)',
      'Compress the PDF before uploading',
      'Split the document into smaller sections',
    ],
  },
  NETWORK_ERROR: {
    title: 'Network Connection Lost',
    description: 'Connection was lost during processing.',
    suggestions: [
      'Check your internet connection',
      'Try uploading the file again',
      'Ensure you have a stable connection',
    ],
  },
};

export const ProcessingErrorDisplay: React.FC<ProcessingErrorDisplayProps> = ({
  error,
  onRetry,
  onContactSupport,
  showDetails = false,
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(showDetails);

  const errorInfo = errorMessages[error.code] || {
    title: 'Processing Error',
    description: error.message,
    suggestions: [
      'Please try again',
      'Contact support if the problem persists',
    ],
  };

  const getSeverity = () => {
    if (error.code === 'PROCESSING_TIMEOUT' || error.code === 'NETWORK_ERROR') return 'warning';
    if (error.code === 'MEMORY_ERROR' || error.code === 'STORAGE_FAILURE') return 'info';
    return 'error';
  };

  const getIcon = () => {
    if (error.code === 'PROCESSING_TIMEOUT' || error.code === 'NETWORK_ERROR') return <WarningIcon />;
    if (error.code === 'MEMORY_ERROR' || error.code === 'STORAGE_FAILURE') return <InfoIcon />;
    return <ErrorIcon />;
  };

  return (
    <Card>
      <CardContent>
        <Alert
          severity={getSeverity()}
          icon={getIcon()}
          sx={{ mb: 2 }}
        >
          <AlertTitle>{errorInfo.title}</AlertTitle>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {errorInfo.description}
          </Typography>

          {/* Suggestions */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
              Suggested Solutions:
            </Typography>
            <List dense>
              {errorInfo.suggestions.map((suggestion, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 24 }}>
                    <Typography variant="body2" color="primary">
                      {index + 1}.
                    </Typography>
                  </ListItemIcon>
                  <ListItemText
                    primary={suggestion}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {error.retryable && onRetry && (
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={onRetry}
                size="small"
              >
                Try Again
              </Button>
            )}
            {onContactSupport && (
              <Button
                variant="outlined"
                startIcon={<HelpIcon />}
                onClick={onContactSupport}
                size="small"
              >
                Contact Support
              </Button>
            )}
          </Box>
        </Alert>

        {/* Technical Details */}
        {error.details && (
          <Accordion 
            expanded={showTechnicalDetails} 
            onChange={() => setShowTechnicalDetails(!showTechnicalDetails)}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="body2" color="text.secondary">
                Technical Details
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ mb: 2 }}>
                <Chip
                  label={`Error Code: ${error.code}`}
                  color="default"
                  variant="outlined"
                  size="small"
                  sx={{ mr: 1, mb: 1 }}
                />
                <Chip
                  label={`Recoverable: ${error.recoverable ? 'Yes' : 'No'}`}
                  color={error.recoverable ? 'success' : 'error'}
                  variant="outlined"
                  size="small"
                  sx={{ mr: 1, mb: 1 }}
                />
                <Chip
                  label={`Retryable: ${error.retryable ? 'Yes' : 'No'}`}
                  color={error.retryable ? 'success' : 'error'}
                  variant="outlined"
                  size="small"
                  sx={{ mb: 1 }}
                />
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Error Details:
              </Typography>
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  overflow: 'auto',
                }}
              >
                <pre>{JSON.stringify(error.details, null, 2)}</pre>
              </Box>
            </AccordionDetails>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};

export default ProcessingErrorDisplay;
