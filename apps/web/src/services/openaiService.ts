/**
 * OpenAI service for AI question generation
 * Handles communication with OpenAI API for generating questions from text
 */

import OpenAI from 'openai';
import type { Question, QuestionGenerationRequest, QuestionGenerationResult } from '../types/question';

export class OpenAIService {
  private client: OpenAI;
  private readonly model: string;
  private readonly temperature: number;
  private readonly maxTokens: number;

  constructor() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key not found. Please set VITE_OPENAI_API_KEY environment variable.');
    }

    this.client = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true, // Only for development - should be server-side in production
    });

    // Use more reliable model with fallback options
    this.model = this.getAvailableModel();
    this.temperature = parseFloat(import.meta.env.VITE_OPENAI_TEMPERATURE || '0.7');
    this.maxTokens = parseInt(import.meta.env.VITE_OPENAI_MAX_TOKENS || '2000');
  }

  /**
   * Get available OpenAI model with fallback options
   */
  private getAvailableModel(): string {
    const requestedModel = import.meta.env.VITE_OPENAI_MODEL;
    
    // List of models in order of preference (most reliable first)
    const availableModels = [
      'gpt-3.5-turbo',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-4o',
      'gpt-4'
    ];

    // If a specific model is requested, use it if it's in our available list
    if (requestedModel && availableModels.includes(requestedModel)) {
      return requestedModel;
    }

    // Default to the most reliable model
    return availableModels[0];
  }

  /**
   * Generate questions from text content
   */
  async generateQuestions(request: QuestionGenerationRequest): Promise<QuestionGenerationResult> {
    try {
      const prompt = this.buildPrompt(request);
      
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational content creator specializing in generating high-quality questions from academic texts. Generate questions that are clear, relevant, and appropriate for the educational level specified.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response generated from OpenAI');
      }

      const questions = this.parseQuestions(content, request.questionCount);
      
      return {
        questions,
        questionSet: {
          id: crypto.randomUUID(),
          document_id: request.documentId,
          title: request.title || 'Generated Questions',
          question_count: questions.length,
          generation_status: 'completed',
          created_at: new Date(),
          exported_at: new Date(),
        },
        metadata: {
          model: this.model,
          temperature: this.temperature,
          tokensUsed: response.usage?.total_tokens || 0,
          generationTime: Date.now(),
        },
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      
      // Check if it's a quota/rate limit error and try fallback
      if (this.isQuotaError(error)) {
        console.log('OpenAI quota exceeded, using fallback question generator');
        return this.generateFallbackQuestions(request);
      }
      
      throw this.handleAPIError(error);
    }
  }

  /**
   * Build prompt for question generation
   */
  private buildPrompt(request: QuestionGenerationRequest): string {
    const { text, questionCount, difficulty, questionTypes, subject } = request;
    
    let prompt = `Generate ${questionCount} high-quality questions based on the following text content:\n\n`;
    prompt += `Subject: ${subject || 'General'}\n`;
    prompt += `Difficulty: ${difficulty}\n`;
    prompt += `Question Types: ${questionTypes.join(', ')}\n\n`;
    prompt += `Text Content:\n${text}\n\n`;
    
    prompt += `Please generate questions that:\n`;
    prompt += `1. Are directly related to the content provided\n`;
    prompt += `2. Test understanding and comprehension\n`;
    prompt += `3. Are appropriate for ${difficulty} level\n`;
    prompt += `4. Include a mix of question types: ${questionTypes.join(', ')}\n`;
    prompt += `5. Have clear, unambiguous answers\n\n`;
    
    prompt += `Format your response as a JSON array with the following structure:\n`;
    prompt += `[\n`;
    prompt += `  {\n`;
    prompt += `    "question_type": "multiple_choice" | "short_answer" | "true_false",\n`;
    prompt += `    "question_text": "The question text here",\n`;
    prompt += `    "correct_answer": "The correct answer",\n`;
    prompt += `    "options": ["Option A", "Option B", "Option C", "Option D"] (only for multiple_choice),\n`;
    prompt += `    "difficulty": "easy" | "medium" | "hard",\n`;
    prompt += `    "explanation": "Brief explanation of the answer (optional)"\n`;
    prompt += `  }\n`;
    prompt += `]\n\n`;
    
    prompt += `Ensure the JSON is valid and properly formatted.`;

    return prompt;
  }

  /**
   * Parse questions from OpenAI response
   */
  private parseQuestions(content: string, _expectedCount: number): Question[] {
    try {
      // Extract JSON from response (handle cases where there might be extra text)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      const jsonString = jsonMatch ? jsonMatch[0] : content;
      
      const parsedQuestions = JSON.parse(jsonString);
      
      if (!Array.isArray(parsedQuestions)) {
        throw new Error('Response is not an array');
      }

      return parsedQuestions.map((q, index) => ({
        id: crypto.randomUUID(),
        question_set_id: '', // Will be set by the caller
        question_type: q.question_type || 'short_answer',
        question_text: q.question_text || '',
        correct_answer: q.correct_answer || '',
        options: q.options || [],
        difficulty: q.difficulty || 'medium',
        order_index: index + 1,
        created_at: new Date(),
        explanation: q.explanation || '',
      }));
    } catch (error) {
      console.error('Error parsing questions:', error);
      throw new Error('Failed to parse questions from AI response. Please try again.');
    }
  }

  /**
   * Check if error is related to quota/rate limiting
   */
  private isQuotaError(error: any): boolean {
    return (
      error.status === 429 ||
      error.code === 'rate_limit_exceeded' ||
      error.code === 'insufficient_quota' ||
      error.message?.includes('quota') ||
      error.message?.includes('rate limit')
    );
  }

  /**
   * Generate fallback questions when OpenAI quota is exceeded
   */
  private generateFallbackQuestions(request: QuestionGenerationRequest): QuestionGenerationResult {
    const { text, questionCount, difficulty, questionTypes, subject } = request;
    
    // Extract key sentences from the text for question generation
    const sentences = this.extractKeySentences(text, questionCount * 2);
    const questions = this.createBasicQuestions(sentences, questionCount, difficulty, questionTypes);
    
    return {
      questions,
      questionSet: {
        id: crypto.randomUUID(),
        document_id: request.documentId,
        title: request.title || `Questions for ${subject || 'Document'} (Fallback)`,
        question_count: questions.length,
        generation_status: 'completed',
        created_at: new Date(),
        exported_at: new Date(),
      },
      metadata: {
        model: 'fallback-generator',
        temperature: 0,
        tokensUsed: 0,
        generationTime: Date.now(),
        fallback: true,
      },
    };
  }

  /**
   * Extract key sentences from text for question generation
   */
  private extractKeySentences(text: string, maxSentences: number): string[] {
    const sentences = text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20 && s.length < 200)
      .slice(0, maxSentences);
    
    return sentences;
  }

  /**
   * Create basic questions from sentences
   */
  private createBasicQuestions(sentences: string[], count: number, difficulty: string, types: string[]): Question[] {
    const questions: Question[] = [];
    const questionTemplates = this.getQuestionTemplates(difficulty, types);
    
    for (let i = 0; i < Math.min(count, sentences.length); i++) {
      const sentence = sentences[i];
      const template = questionTemplates[i % questionTemplates.length];
      
      const question = this.createQuestionFromTemplate(sentence, template, i + 1);
      questions.push(question);
    }
    
    return questions;
  }

  /**
   * Get question templates based on difficulty and types
   */
  private getQuestionTemplates(_difficulty: string, types: string[]): string[] {
    const templates: Record<string, string[]> = {
      'What is': ['What is the main idea of this statement?', 'What does this text describe?'],
      'How': ['How does this work?', 'How can this be explained?'],
      'Why': ['Why is this important?', 'Why does this happen?'],
      'Explain': ['Explain this concept.', 'Explain what this means.'],
      'Describe': ['Describe the key points.', 'Describe what happens here.'],
    };
    
    const selectedTemplates: string[] = [];
    types.forEach(type => {
      if (templates[type]) {
        selectedTemplates.push(...templates[type]);
      }
    });
    
    // Add default templates if none selected
    if (selectedTemplates.length === 0) {
      selectedTemplates.push(...templates['What is'], ...templates['Explain']);
    }
    
    return selectedTemplates;
  }

  /**
   * Create a question from a template and sentence
   */
  private createQuestionFromTemplate(sentence: string, template: string, order: number): Question {
    // Extract key terms from the sentence
    const words = sentence.split(' ').filter(word => word.length > 4);
    const keyTerms = words.slice(0, 3);
    
    return {
      id: crypto.randomUUID(),
      question_set_id: '', // Will be set by the caller
      question_type: 'multiple_choice',
      question_text: template.replace('this', `"${sentence.substring(0, 100)}..."`),
      correct_answer: this.extractAnswer(sentence, keyTerms),
      options: this.generateOptions(sentence, keyTerms),
      difficulty: 'medium',
      order_index: order,
      created_at: new Date(),
      explanation: `This question tests understanding of the key concept: ${keyTerms.join(', ')}`,
    };
  }

  /**
   * Generate multiple choice options
   */
  private generateOptions(_sentence: string, keyTerms: string[]): string[] {
    const options = [keyTerms[0] || 'Option A'];
    
    // Add variations
    if (keyTerms[1]) options.push(keyTerms[1]);
    if (keyTerms[2]) options.push(keyTerms[2]);
    
    // Add generic options to fill up to 4
    const genericOptions = ['All of the above', 'None of the above', 'Cannot be determined'];
    while (options.length < 4) {
      const generic = genericOptions[options.length - 1] || `Option ${String.fromCharCode(65 + options.length)}`;
      options.push(generic);
    }
    
    return options.slice(0, 4);
  }

  /**
   * Extract answer from sentence
   */
  private extractAnswer(_sentence: string, keyTerms: string[]): string {
    return keyTerms[0] || 'The main concept';
  }

  /**
   * Handle OpenAI API errors
   */
  private handleAPIError(error: any): Error {
    console.error('OpenAI API error details:', error);

    // Handle 429 errors (rate limit exceeded)
    if (error.status === 429 || error.code === 'rate_limit_exceeded') {
      const retryAfter = error.headers?.['retry-after'] || error.retryAfter;
      const message = retryAfter 
        ? `AI service is busy. Please wait ${retryAfter} seconds and try again.`
        : 'AI service is busy. Please wait a moment and try again.';
      return new Error(message);
    }

    if (error.code === 'insufficient_quota') {
      return new Error('AI service quota exceeded. Please check your OpenAI account billing and try again later.');
    }

    if (error.code === 'invalid_api_key') {
      return new Error('AI service configuration error. Please contact support.');
    }

    if (error.code === 'context_length_exceeded') {
      return new Error('Text content is too long. Please use a shorter document.');
    }

    // Handle model not found or access denied errors
    if (error.message?.includes('does not exist') || error.message?.includes('not have access')) {
      return new Error(`Model '${this.model}' is not available. Please check your OpenAI account access or try a different model.`);
    }

    if (error.message?.includes('timeout')) {
      return new Error('AI processing is taking longer than expected. Please try again.');
    }

    if (error.message?.includes('network')) {
      return new Error('Network error. Please check your connection and try again.');
    }

    // Log the full error for debugging
    console.error('Unhandled OpenAI error:', error);
    return new Error('AI service temporarily unavailable. Please try again later.');
  }

  /**
   * Validate API key
   */
  async validateAPIKey(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }

  /**
   * Get available models
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await this.client.models.list();
      return response.data
        .filter(model => model.id.includes('gpt'))
        .map(model => model.id);
    } catch (error) {
      console.error('Error fetching models:', error);
      return [];
    }
  }
}

// Lazy initialization to avoid constructor running at module load time
let _openaiService: OpenAIService | null = null;

export const openaiService = {
  get instance() {
    if (!_openaiService) {
      _openaiService = new OpenAIService();
    }
    return _openaiService;
  }
};
