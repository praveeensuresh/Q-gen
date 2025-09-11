/**
 * Question Generation Form Component
 * Allows users to configure and generate questions from documents
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Divider,
} from '@mui/material';
import {
  Psychology,
  School,
  Quiz,
  Settings,
} from '@mui/icons-material';
import { questionGenerationService } from '../../../services/questionGenerationService';
import type { QuestionFormData, QuestionType, DifficultyLevel } from '../../../types/question';

interface QuestionGenerationFormProps {
  documentId: string;
  onGenerateQuestions: (formData: QuestionFormData) => void;
  isGenerating?: boolean;
  error?: string;
}

export const QuestionGenerationForm: React.FC<QuestionGenerationFormProps> = ({
  documentId,
  onGenerateQuestions,
  isGenerating = false,
  error,
}) => {
  const [formData, setFormData] = useState<QuestionFormData>({
    questionCount: 10,
    difficulty: 'medium',
    questionTypes: ['multiple_choice', 'short_answer'],
    subject: 'General',
    title: 'Generated Questions',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const supportedQuestionTypes = questionGenerationService.instance.getSupportedQuestionTypes();
  const difficultyLevels = questionGenerationService.instance.getDifficultyLevels();

  useEffect(() => {
    // Load default settings
    const defaultSettings = questionGenerationService.instance.getDefaultSettings();
    setFormData(prev => ({
      ...prev,
      ...defaultSettings,
    }));
  }, []);

  const handleInputChange = (field: keyof QuestionFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleQuestionTypeChange = (questionType: QuestionType, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      questionTypes: checked
        ? [...prev.questionTypes, questionType]
        : prev.questionTypes.filter(type => type !== questionType),
    }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (formData.questionCount < 1 || formData.questionCount > 50) {
      errors.questionCount = 'Question count must be between 1 and 50';
    }

    if (formData.questionTypes.length === 0) {
      errors.questionTypes = 'Please select at least one question type';
    }

    if (!formData.subject.trim()) {
      errors.subject = 'Subject is required';
    }

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onGenerateQuestions(formData);
    }
  };

  const estimatedTime = questionGenerationService.instance.estimateGenerationTime({
    documentId,
    text: '', // Will be filled by the service
    ...formData,
  });

  return (
    <Card elevation={2}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <Psychology color="primary" />
          <Typography variant="h6" component="h2">
            Generate Questions
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Basic Settings */}
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Settings color="action" />
                <Typography variant="subtitle1" fontWeight="medium">
                  Basic Settings
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <TextField
                    fullWidth
                    label="Question Count"
                    type="number"
                    value={formData.questionCount}
                    onChange={(e) => handleInputChange('questionCount', parseInt(e.target.value) || 0)}
                    error={!!validationErrors.questionCount}
                    helperText={validationErrors.questionCount || 'Number of questions to generate (1-50)'}
                    inputProps={{ min: 1, max: 50 }}
                    disabled={isGenerating}
                  />
                </Box>
                
                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <FormControl fullWidth error={!!validationErrors.difficulty}>
                    <InputLabel>Difficulty Level</InputLabel>
                    <Select
                      value={formData.difficulty}
                      onChange={(e) => handleInputChange('difficulty', e.target.value as DifficultyLevel)}
                      disabled={isGenerating}
                    >
                      {difficultyLevels.map((level) => (
                        <MenuItem key={level.value} value={level.value}>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {level.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {level.description}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>
              
              <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <TextField
                    fullWidth
                    label="Subject"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    error={!!validationErrors.subject}
                    helperText={validationErrors.subject || 'Subject area for the questions'}
                    disabled={isGenerating}
                  />
                </Box>
                
                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <TextField
                    fullWidth
                    label="Question Set Title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    error={!!validationErrors.title}
                    helperText={validationErrors.title || 'Title for the generated question set'}
                    disabled={isGenerating}
                  />
                </Box>
              </Box>
            </Box>

            <Divider />

            {/* Question Types */}
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Quiz color="action" />
                <Typography variant="subtitle1" fontWeight="medium">
                  Question Types
                </Typography>
              </Box>
              
              <Box display="flex" flexWrap="wrap" gap={1}>
                {supportedQuestionTypes.map((type) => (
                  <FormControlLabel
                    key={type.value}
                    control={
                      <Checkbox
                        checked={formData.questionTypes.includes(type.value as QuestionType)}
                        onChange={(e) => handleQuestionTypeChange(type.value as QuestionType, e.target.checked)}
                        disabled={isGenerating}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {type.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {type.description}
                        </Typography>
                      </Box>
                    }
                  />
                ))}
              </Box>
              {validationErrors.questionTypes && (
                <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                  {validationErrors.questionTypes}
                </Typography>
              )}
            </Box>

            <Divider />

            {/* Generation Info */}
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <School color="action" />
                <Typography variant="subtitle1" fontWeight="medium">
                  Generation Info
                </Typography>
              </Box>
              
              <Box display="flex" gap={2} flexWrap="wrap">
                <Chip
                  icon={<Psychology />}
                  label={`Estimated time: ${Math.round(estimatedTime / 1000)}s`}
                  variant="outlined"
                  color="primary"
                />
                <Chip
                  label={`${formData.questionTypes.length} question type(s)`}
                  variant="outlined"
                />
                <Chip
                  label={`${formData.difficulty} difficulty`}
                  variant="outlined"
                />
              </Box>
            </Box>

            {/* Error Display */}
            {error && (
              <Alert severity="error">
                {error}
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isGenerating || formData.questionTypes.length === 0}
              startIcon={isGenerating ? <CircularProgress size={20} /> : <Psychology />}
            >
              {isGenerating ? 'Generating Questions...' : 'Generate Questions'}
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
};
