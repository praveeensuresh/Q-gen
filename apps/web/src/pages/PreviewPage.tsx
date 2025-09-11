import React, { useState, useEffect } from 'react'
import { Box, Typography, Container, Alert, CircularProgress } from '@mui/material'
import { useParams } from 'react-router-dom'
import { QuestionGenerationForm } from '../components/features/questions/QuestionGenerationForm'
import { QuestionDisplay } from '../components/features/questions/QuestionDisplay'
import { questionGenerationService } from '../services/questionGenerationService'
import { documentService } from '../services/documentService'
import type { Question, QuestionFormData } from '../types/question'

const PreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [questions, setQuestions] = useState<Question[]>([])
  // const [questionSet, setQuestionSet] = useState<QuestionSet | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showFallbackNotification, setShowFallbackNotification] = useState(false)
  const [documentReady, setDocumentReady] = useState(false)

  // Check if document is ready for question generation
  useEffect(() => {
    const checkDocumentStatus = async () => {
      if (!id) {
        setError('Document ID is required')
        return
      }

      try {
        const document = await documentService.instance.getDocument(id)
        
        if (document.upload_status === 'completed' && document.text_length && document.text_length > 100) {
          setDocumentReady(true)
        } else if (document.upload_status === 'failed') {
          setError('Document processing failed. Please try uploading again.')
        } else {
          setError('Document is not ready for question generation. Please wait for processing to complete.')
        }
      } catch (err) {
        setError('Failed to load document. Please try again.')
      }
    }

    checkDocumentStatus()
  }, [id])

  const handleGenerateQuestions = async (formData: QuestionFormData) => {
    if (!id) {
      setError('Document ID is required')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const result = await questionGenerationService.instance.generateQuestions({
        documentId: id,
        text: '', // Will be filled by the service
        ...formData,
      })

      setQuestions(result.questions)
      // setQuestionSet(result.questionSet)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate questions'
      
      // Check if it's a quota/rate limit error
      if (errorMessage.includes('quota') || errorMessage.includes('rate limit') || errorMessage.includes('busy')) {
        setError(`⚠️ ${errorMessage}\n\nDon't worry! We've generated basic questions using our fallback system. You can still use these questions or try again later when the AI service is available.`)
        setShowFallbackNotification(true)
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleEditQuestion = (questionId: string) => {
    // TODO: Implement question editing
    console.log('Edit question:', questionId)
  }

  const handleDeleteQuestion = (questionId: string) => {
    setQuestions(prev => prev.filter(q => q.id !== questionId))
  }

  // const handleGenerateMore = () => {
  //   // TODO: Implement generate more questions
  //   console.log('Generate more questions')
  // }

  // const handleExport = () => {
  //   // TODO: Implement export functionality
  //   console.log('Export questions')
  // }

  if (!id) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
          <Alert severity="error">
            Document ID is required. Please go back to the upload page.
          </Alert>
        </Box>
      </Container>
    )
  }

  if (error && !documentReady) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
          <Alert severity="error">
            {error}
          </Alert>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Generate Questions
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Generate AI-powered questions from your document content.
        </Typography>

        {!documentReady ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Question Generation Form */}
            <QuestionGenerationForm
              documentId={id}
              onGenerateQuestions={handleGenerateQuestions}
              isGenerating={isGenerating}
              error={error || undefined}
            />

            {/* Generated Questions Display */}
            {questions.length > 0 && (
              <QuestionDisplay
                questions={questions}
                onEditQuestion={handleEditQuestion}
                onDeleteQuestion={handleDeleteQuestion}
                showAnswers={true}
                editable={true}
              />
            )}
          </Box>
        )}
      </Box>

      {/* Fallback notification */}
      {showFallbackNotification && (
        <Alert 
          severity="info" 
          onClose={() => setShowFallbackNotification(false)}
          sx={{ 
            position: 'fixed', 
            bottom: 20, 
            right: 20, 
            maxWidth: 400,
            zIndex: 1000 
          }}
        >
          <Typography variant="body2">
            <strong>Fallback Mode Active</strong><br/>
            AI service is temporarily unavailable. We've generated basic questions using our fallback system. 
            You can still use these questions or try again later.
          </Typography>
        </Alert>
      )}
    </Container>
  )
}

export default PreviewPage
