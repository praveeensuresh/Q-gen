/**
 * Extracted Text Preview Component
 * Shows preview of extracted text with quality metrics
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  Button,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Alert,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  TextFields as TextIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import type { Document } from '../../../types/document';

interface ExtractedTextPreviewProps {
  document: Document;
  onTextEdit?: (text: string) => void;
  onDownload?: () => void;
  showQualityMetrics?: boolean;
  maxPreviewLength?: number;
}

export const ExtractedTextPreview: React.FC<ExtractedTextPreviewProps> = ({
  document,
  onTextEdit,
  onDownload,
  showQualityMetrics = true,
  maxPreviewLength = 1000,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(document.extracted_text);

  const text = document.extracted_text || '';
  const previewText = text.length > maxPreviewLength 
    ? text.substring(0, maxPreviewLength) + '...'
    : text;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(text);
      // TODO: Show success toast
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const handleEditSave = () => {
    if (onTextEdit) {
      onTextEdit(editedText);
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditedText(document.extracted_text);
    setIsEditing(false);
  };

  const getQualityColor = (score: number) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'error';
  };

  const getQualityLabel = (score: number) => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    if (score >= 0.4) return 'Fair';
    return 'Poor';
  };

  const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
  const characterCount = text.length;
  const paragraphCount = text.split(/\n\s*\n/).filter(paragraph => paragraph.trim().length > 0).length;

  return (
    <Card>
      <CardHeader
        title="Extracted Text Preview"
        subheader={`${document.filename} - ${characterCount.toLocaleString()} characters`}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              startIcon={<CopyIcon />}
              onClick={handleCopyText}
              variant="outlined"
            >
              Copy
            </Button>
            {onDownload && (
              <Button
                size="small"
                startIcon={<DownloadIcon />}
                onClick={onDownload}
                variant="outlined"
              >
                Download
              </Button>
            )}
          </Box>
        }
      />
      <CardContent>
        {/* Quality Metrics */}
        {showQualityMetrics && document.metadata && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <AssessmentIcon sx={{ mr: 1 }} />
              Quality Metrics
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
              <Chip
                label={`Quality: ${getQualityLabel(document.metadata.text_quality_score || 0)}`}
                color={getQualityColor(document.metadata.text_quality_score || 0)}
                variant="outlined"
              />
              <Chip
                label={`Pages: ${document.metadata.page_count || 0}`}
                color="default"
                variant="outlined"
              />
              <Chip
                label={`Words: ${wordCount.toLocaleString()}`}
                color="default"
                variant="outlined"
              />
              <Chip
                label={`Paragraphs: ${paragraphCount}`}
                color="default"
                variant="outlined"
              />
            </Box>
            {document.metadata.processing_duration && (
              <Typography variant="caption" color="text.secondary">
                Processing time: {(document.metadata.processing_duration / 1000).toFixed(2)}s
              </Typography>
            )}
          </Box>
        )}

        <Divider sx={{ mb: 2 }} />

        {/* Text Content */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <TextIcon sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="h6">
              Text Content
            </Typography>
            {onTextEdit && (
              <Button
                size="small"
                onClick={() => setIsEditing(!isEditing)}
                sx={{ ml: 'auto' }}
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            )}
          </Box>

          {isEditing ? (
            <Box>
              <TextField
                multiline
                fullWidth
                rows={10}
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                variant="outlined"
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button onClick={handleEditCancel} variant="outlined">
                  Cancel
                </Button>
                <Button onClick={handleEditSave} variant="contained">
                  Save
                </Button>
              </Box>
            </Box>
          ) : (
            <Box>
              <Typography
                variant="body2"
                sx={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  lineHeight: 1.6,
                  p: 2,
                  bgcolor: 'grey.50',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'grey.200',
                }}
              >
                {previewText}
              </Typography>
              
              {text.length > maxPreviewLength && (
                <Accordion expanded={isExpanded} onChange={() => setIsExpanded(!isExpanded)}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="body2" color="primary">
                      Show full text ({characterCount.toLocaleString()} characters)
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography
                      variant="body2"
                      sx={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        lineHeight: 1.6,
                      }}
                    >
                      {text}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>
          )}
        </Box>

        {/* Quality Warning */}
        {document.metadata && document.metadata.text_quality_score && document.metadata.text_quality_score < 0.6 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              The extracted text quality is below recommended standards. 
              This may affect question generation quality. Consider using a different PDF or 
              manually editing the text.
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default ExtractedTextPreview;
