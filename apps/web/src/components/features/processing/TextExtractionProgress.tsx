/**
 * Text Extraction Progress Component
 * Shows detailed progress for text extraction process
 */

import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  Upload as UploadIcon,
  TextFields as TextIcon,
  Clear as CleanIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import type { ProcessingStatus } from '../../../types/document';

interface TextExtractionProgressProps {
  status: ProcessingStatus | null;
  showSteps?: boolean;
}

const steps = [
  {
    id: 'uploading',
    label: 'Uploading File',
    icon: <UploadIcon />,
    description: 'Uploading PDF file to secure storage',
  },
  {
    id: 'extracting',
    label: 'Extracting Text',
    icon: <TextIcon />,
    description: 'Extracting text content from PDF',
  },
  {
    id: 'cleaning',
    label: 'Cleaning Text',
    icon: <CleanIcon />,
    description: 'Cleaning and normalizing extracted text',
  },
  {
    id: 'validating',
    label: 'Validating Content',
    icon: <CheckIcon />,
    description: 'Validating text quality and length',
  },
  {
    id: 'completed',
    label: 'Processing Complete',
    icon: <CheckIcon />,
    description: 'Text extraction completed successfully',
  },
];

export const TextExtractionProgress: React.FC<TextExtractionProgressProps> = ({
  status,
  showSteps = true,
}) => {
  if (!status) {
    return null;
  }

  const currentStepIndex = steps.findIndex(step => step.id === status.current_step);
  const isCompleted = status.status === 'completed';
  const isFailed = status.status === 'failed';

  return (
    <Card>
      <CardContent>
        {/* Overall Progress */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Text Extraction Progress
            </Typography>
            <Chip
              label={`${status.progress}%`}
              color={isCompleted ? 'success' : isFailed ? 'error' : 'primary'}
              variant="outlined"
            />
          </Box>
          <LinearProgress
            variant="determinate"
            value={status.progress}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* Status Message */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {status.message}
        </Typography>

        {/* Step-by-step Progress */}
        {showSteps && (
          <Stepper activeStep={currentStepIndex} orientation="vertical">
            {steps.map((step, index) => {
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex || status.status === 'completed';
              const isFailed = isActive && status.status === 'failed';

              return (
                <Step key={step.id} completed={isCompleted}>
                  <StepLabel
                    icon={step.icon}
                    error={isFailed}
                    sx={{
                      '& .MuiStepLabel-label': {
                        color: isFailed ? 'error.main' : isActive ? 'primary.main' : 'text.secondary',
                      },
                    }}
                  >
                    {step.label}
                  </StepLabel>
                  <StepContent>
                    <Typography variant="body2" color="text.secondary">
                      {step.description}
                    </Typography>
                    {isActive && !isFailed && (
                      <Box sx={{ mt: 1 }}>
                        <LinearProgress
                          variant="indeterminate"
                          sx={{ height: 4, borderRadius: 2 }}
                        />
                      </Box>
                    )}
                  </StepContent>
                </Step>
              );
            })}
          </Stepper>
        )}

        {/* Error Information */}
        {status.error && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
            <Typography variant="body2" color="error.main" sx={{ fontWeight: 'bold' }}>
              Error: {status.error.message}
            </Typography>
            {status.error.details && (
              <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 1 }}>
                Code: {status.error.code}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TextExtractionProgress;
