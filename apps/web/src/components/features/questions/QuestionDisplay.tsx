/**
 * Question Display Component
 * Shows generated questions in a readable format
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Collapse,
  Divider,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Edit,
  Delete,
  Quiz,
  CheckCircle,
  RadioButtonUnchecked,
  ShortText,
  ToggleOn,
  ToggleOff,
} from '@mui/icons-material';
import type { Question } from '../../../types/question';

interface QuestionDisplayProps {
  questions: Question[];
  onEditQuestion?: (questionId: string) => void;
  onDeleteQuestion?: (questionId: string) => void;
  showAnswers?: boolean;
  editable?: boolean;
}

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  questions,
  onEditQuestion,
  onDeleteQuestion,
  showAnswers = true,
  editable = false,
}) => {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  const toggleExpanded = (questionId: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const getQuestionTypeIcon = (questionType: string) => {
    switch (questionType) {
      case 'multiple_choice':
        return <RadioButtonUnchecked />;
      case 'short_answer':
        return <ShortText />;
      case 'true_false':
        return <ToggleOn />;
      default:
        return <Quiz />;
    }
  };

  const getQuestionTypeLabel = (questionType: string) => {
    switch (questionType) {
      case 'multiple_choice':
        return 'Multiple Choice';
      case 'short_answer':
        return 'Short Answer';
      case 'true_false':
        return 'True/False';
      default:
        return 'Question';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'success';
      case 'medium':
        return 'warning';
      case 'hard':
        return 'error';
      default:
        return 'default';
    }
  };

  const renderMultipleChoiceOptions = (question: Question) => {
    if (question.question_type !== 'multiple_choice' || !question.options.length) {
      return null;
    }

    return (
      <List dense>
        {question.options.map((option, index) => (
          <ListItem key={index} sx={{ py: 0.5 }}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              {showAnswers && option === question.correct_answer ? (
                <CheckCircle color="success" fontSize="small" />
              ) : (
                <RadioButtonUnchecked fontSize="small" />
              )}
            </ListItemIcon>
            <ListItemText
              primary={option}
              sx={{
                '& .MuiListItemText-primary': {
                  fontWeight: showAnswers && option === question.correct_answer ? 'bold' : 'normal',
                  color: showAnswers && option === question.correct_answer ? 'success.main' : 'text.primary',
                },
              }}
            />
          </ListItem>
        ))}
      </List>
    );
  };

  const renderTrueFalseOptions = (question: Question) => {
    if (question.question_type !== 'true_false') {
      return null;
    }

    const isTrue = question.correct_answer.toLowerCase() === 'true';
    
    return (
      <Box display="flex" gap={2} mt={1}>
        <Chip
          icon={<ToggleOn />}
          label="True"
          variant={isTrue ? 'filled' : 'outlined'}
          color={isTrue ? 'success' : 'default'}
          sx={{ fontWeight: isTrue ? 'bold' : 'normal' }}
        />
        <Chip
          icon={<ToggleOff />}
          label="False"
          variant={!isTrue ? 'filled' : 'outlined'}
          color={!isTrue ? 'error' : 'default'}
          sx={{ fontWeight: !isTrue ? 'bold' : 'normal' }}
        />
      </Box>
    );
  };

  const renderShortAnswer = (question: Question) => {
    if (question.question_type !== 'short_answer') {
      return null;
    }

    return (
      <Box mt={1}>
        <Typography variant="body2" color="text.secondary">
          <strong>Expected Answer:</strong> {question.correct_answer}
        </Typography>
      </Box>
    );
  };

  if (questions.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No questions generated yet. Use the form above to generate questions from your document.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Generated Questions ({questions.length})
      </Typography>
      
      {questions.map((question, index) => {
        const isExpanded = expandedQuestions.has(question.id);
        
        return (
          <Card key={question.id} sx={{ mb: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              {/* Question Header */}
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="h6" component="span">
                    Q{index + 1}.
                  </Typography>
                  <Chip
                    icon={getQuestionTypeIcon(question.question_type)}
                    label={getQuestionTypeLabel(question.question_type)}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={question.difficulty}
                    size="small"
                    color={getDifficultyColor(question.difficulty) as any}
                  />
                </Box>
                
                <Box display="flex" gap={1}>
                  {editable && onEditQuestion && (
                    <IconButton
                      size="small"
                      onClick={() => onEditQuestion(question.id)}
                      color="primary"
                    >
                      <Edit />
                    </IconButton>
                  )}
                  
                  {editable && onDeleteQuestion && (
                    <IconButton
                      size="small"
                      onClick={() => onDeleteQuestion(question.id)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  )}
                  
                  <IconButton
                    size="small"
                    onClick={() => toggleExpanded(question.id)}
                  >
                    {isExpanded ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </Box>
              </Box>

              {/* Question Text */}
              <Typography variant="body1" paragraph>
                {question.question_text}
              </Typography>

              {/* Question Options/Answer */}
              <Collapse in={isExpanded}>
                <Box>
                  <Divider sx={{ mb: 2 }} />
                  
                  {/* Multiple Choice Options */}
                  {renderMultipleChoiceOptions(question)}
                  
                  {/* True/False Options */}
                  {renderTrueFalseOptions(question)}
                  
                  {/* Short Answer */}
                  {renderShortAnswer(question)}
                  
                  {/* Explanation */}
                  {question.explanation && (
                    <Box mt={2}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Explanation:
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <Typography variant="body2">
                          {question.explanation}
                        </Typography>
                      </Paper>
                    </Box>
                  )}
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
};
