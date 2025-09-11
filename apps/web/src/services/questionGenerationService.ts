/**
 * Question generation service
 * Handles question generation workflow and state management
 */

import { openaiService } from './openaiService';
import { documentService } from './documentService';
import type { 
  QuestionGenerationRequest, 
  QuestionGenerationResult,
  QuestionGenerationStatus 
} from '../types/question';

export class QuestionGenerationService {
  private generationStatus: Map<string, QuestionGenerationStatus> = new Map();

  /**
   * Generate questions from document
   */
  async generateQuestions(request: QuestionGenerationRequest): Promise<QuestionGenerationResult> {
    const generationId = `${request.documentId}-${Date.now()}`;
    
    try {
      // Update status
      this.updateGenerationStatus(generationId, {
        status: 'generating',
        progress: 10,
        message: 'Preparing question generation...',
      });

      // Get document text
      const document = await documentService.instance.getDocument(request.documentId);
      
      if (!document.text_length || document.text_length < 100) {
        throw new Error('Document text is too short for question generation. Please use a longer document.');
      }

      // Update status
      this.updateGenerationStatus(generationId, {
        status: 'generating',
        progress: 30,
        message: 'Generating questions with AI...',
      });

      // Generate questions using OpenAI with retry mechanism
      const result = await this.generateWithRetry({
        ...request,
        text: document.extracted_text || '',
      });

      // Update status
      this.updateGenerationStatus(generationId, {
        status: 'generating',
        progress: 80,
        message: 'Finalizing questions...',
      });

      // Update question set with document ID
      result.questionSet.document_id = request.documentId;
      result.questions.forEach((q: any) => {
        q.question_set_id = result.questionSet.id;
      });

      // Update status to completed
      this.updateGenerationStatus(generationId, {
        status: 'completed',
        progress: 100,
        message: 'Questions generated successfully!',
      });

      return result;
    } catch (error) {
      console.error('Question generation error:', error);
      
      // Update status to failed
      this.updateGenerationStatus(generationId, {
        status: 'failed',
        progress: 0,
        message: 'Failed to generate questions',
        error: {
          code: 'GENERATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        },
      });

      throw error;
    }
  }

  /**
   * Get generation status
   */
  getGenerationStatus(generationId: string): QuestionGenerationStatus | null {
    return this.generationStatus.get(generationId) || null;
  }

  /**
   * Generate questions with retry mechanism for rate limit errors
   */
  private async generateWithRetry(request: QuestionGenerationRequest, maxRetries: number = 3): Promise<any> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await openaiService.instance.generateQuestions(request);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Check if it's a rate limit error and we have retries left
        if (this.isRetryableError(lastError) && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
          console.log(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
          await this.delay(delay);
          continue;
        }
        
        // If it's not retryable or we've exhausted retries, throw the error
        throw lastError;
      }
    }
    
    throw lastError || new Error('Failed to generate questions after retries');
  }

  /**
   * Check if error is retryable (rate limit, temporary issues)
   */
  private isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('rate limit') ||
      message.includes('busy') ||
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('temporarily unavailable')
    );
  }

  /**
   * Delay utility for retry mechanism
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Update generation status
   */
  private updateGenerationStatus(generationId: string, status: QuestionGenerationStatus): void {
    this.generationStatus.set(generationId, status);
  }

  /**
   * Clear generation status
   */
  clearGenerationStatus(generationId: string): void {
    this.generationStatus.delete(generationId);
  }

  /**
   * Validate question generation request
   */
  validateRequest(request: QuestionGenerationRequest): { valid: boolean; error?: string } {
    if (!request.documentId) {
      return { valid: false, error: 'Document ID is required' };
    }


    if (!request.text || request.text.length < 100) {
      return { valid: false, error: 'Text content is too short for question generation' };
    }

    if (request.questionCount < 1 || request.questionCount > 50) {
      return { valid: false, error: 'Question count must be between 1 and 50' };
    }

    if (!request.questionTypes || request.questionTypes.length === 0) {
      return { valid: false, error: 'At least one question type must be selected' };
    }

    return { valid: true };
  }

  /**
   * Get default question generation settings
   */
  getDefaultSettings(): Partial<QuestionGenerationRequest> {
    return {
      questionCount: 10,
      difficulty: 'medium',
      questionTypes: ['multiple_choice', 'short_answer'],
      subject: 'General',
      title: 'Generated Questions',
    };
  }

  /**
   * Estimate generation time based on request
   */
  estimateGenerationTime(request: QuestionGenerationRequest): number {
    const baseTime = 5000; // 5 seconds base
    const timePerQuestion = 1000; // 1 second per question
    const textLengthFactor = Math.min(request.text.length / 1000, 10); // Max 10 seconds for text length
    
    return baseTime + (request.questionCount * timePerQuestion) + (textLengthFactor * 1000);
  }

  /**
   * Get supported question types
   */
  getSupportedQuestionTypes(): Array<{ value: string; label: string; description: string }> {
    return [
      {
        value: 'multiple_choice',
        label: 'Multiple Choice',
        description: 'Questions with multiple answer options',
      },
      {
        value: 'short_answer',
        label: 'Short Answer',
        description: 'Open-ended questions requiring brief answers',
      },
      {
        value: 'true_false',
        label: 'True/False',
        description: 'Binary choice questions',
      },
    ];
  }

  /**
   * Get difficulty level descriptions
   */
  getDifficultyLevels(): Array<{ value: string; label: string; description: string }> {
    return [
      {
        value: 'easy',
        label: 'Easy',
        description: 'Basic comprehension and recall questions',
      },
      {
        value: 'medium',
        label: 'Medium',
        description: 'Application and analysis questions',
      },
      {
        value: 'hard',
        label: 'Hard',
        description: 'Synthesis and evaluation questions',
      },
    ];
  }
}

// Lazy initialization to avoid constructor running at module load time
let _questionGenerationService: QuestionGenerationService | null = null;

export const questionGenerationService = {
  get instance() {
    if (!_questionGenerationService) {
      _questionGenerationService = new QuestionGenerationService();
    }
    return _questionGenerationService;
  }
};
