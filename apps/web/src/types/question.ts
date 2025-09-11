/**
 * Question-related type definitions for AI question generation
 */

export type QuestionType = 'multiple_choice' | 'short_answer' | 'true_false';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type GenerationStatus = 'generating' | 'completed' | 'failed';

export interface Question {
  id: string;
  question_set_id: string;
  question_type: QuestionType;
  question_text: string;
  correct_answer: string;
  options: string[]; // For multiple choice questions
  difficulty: DifficultyLevel;
  order_index: number;
  created_at: Date;
  explanation?: string; // Optional explanation for the answer
}

export interface QuestionSet {
  id: string;
  document_id: string;
  title: string;
  question_count: number;
  generation_status: GenerationStatus;
  created_at: Date;
  exported_at: Date;
}

export interface QuestionGenerationRequest {
  documentId: string;
  text: string;
  questionCount: number;
  difficulty: DifficultyLevel;
  questionTypes: QuestionType[];
  subject?: string;
  title?: string;
}

export interface QuestionGenerationResult {
  questions: Question[];
  questionSet: QuestionSet;
  metadata: {
    model: string;
    temperature: number;
    tokensUsed: number;
    generationTime: number;
    fallback?: boolean;
  };
}

export interface QuestionGenerationStatus {
  status: GenerationStatus;
  progress: number;
  message: string;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

export interface QuestionPreviewProps {
  questions: Question[];
  onEditQuestion: (questionId: string, updatedQuestion: Partial<Question>) => void;
  onDeleteQuestion: (questionId: string) => void;
  onReorderQuestions: (questionIds: string[]) => void;
  onGenerateMore: () => void;
  onExport: () => void;
}

export interface QuestionFormData {
  questionCount: number;
  difficulty: DifficultyLevel;
  questionTypes: QuestionType[];
  subject: string;
  title: string;
}
