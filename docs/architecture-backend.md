# AI Question Generator - Backend Architecture

## Backend Architecture Overview

The backend is built using Vercel Functions with serverless functions deployed on Vercel. The architecture follows a service-oriented approach with clear separation of concerns, proper error handling, and integration with external services.

## Service Architecture

### Serverless Architecture (Vercel Functions)

**Function Organization:**
```
apps/web/src/api/
├── auth/
│   ├── login.ts
│   └── logout.ts
├── documents/
│   ├── index.ts          # GET, POST /api/documents
│   ├── [id].ts          # GET, DELETE /api/documents/[id]
│   └── [id]/process.ts  # POST /api/documents/[id]/process
├── question-sets/
│   ├── index.ts         # GET, POST /api/question-sets
│   ├── [id].ts         # GET, DELETE /api/question-sets/[id]
│   └── [id]/export.ts  # POST /api/question-sets/[id]/export
└── health.ts
```

## Backend Components

### Authentication Service

**Responsibility:** Handle teacher authentication and session management
**Technology Stack:** Vercel Functions, Supabase Auth SDK, TypeScript

```typescript
// services/authService.ts
export class AuthService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new AuthError(error.message);
    
    return {
      user: data.user,
      session: data.session,
    };
  }

  async logout(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw new AuthError(error.message);
  }

  async verifyToken(token: string): Promise<User> {
    const { data: { user }, error } = await this.supabase.auth.getUser(token);
    if (error) throw new AuthError('Invalid token');
    return user;
  }
}
```

### File Processing Service

**Responsibility:** Handle PDF upload, text extraction, and file storage management
**Technology Stack:** Node.js, pdf-parse, Vercel Blob SDK

```typescript
// services/fileProcessingService.ts
export class FileProcessingService {
  private blobStorage: BlobStorage;
  private pdfParser: PDFParser;

  constructor() {
    this.blobStorage = new BlobStorage();
    this.pdfParser = new PDFParser();
  }

  async uploadFile(file: File, userId: string): Promise<Document> {
    // Validate file type and size
    this.validateFile(file);
    
    // Upload to Vercel Blob Storage
    const blob = await this.blobStorage.upload(file);
    
    // Create document record
    const document = await this.createDocumentRecord({
      userId,
      filename: file.name,
      filePath: blob.url,
      fileSize: file.size,
      uploadStatus: 'uploading',
    });

    return document;
  }

  async extractText(documentId: string): Promise<string> {
    const document = await this.getDocument(documentId);
    const fileBuffer = await this.blobStorage.download(document.filePath);
    
    const extractedText = await this.pdfParser.extractText(fileBuffer);
    
    // Update document with extracted text
    await this.updateDocument(documentId, {
      extractedText,
      uploadStatus: 'completed',
      processedAt: new Date(),
    });

    return extractedText;
  }

  private validateFile(file: File): void {
    if (file.type !== 'application/pdf') {
      throw new ValidationError('Only PDF files are allowed');
    }
    
    if (file.size > MAX_FILE_SIZE) {
      throw new ValidationError('File size exceeds maximum limit');
    }
  }
}
```

### AI Question Generation Service

**Responsibility:** Integrate with OpenAI API to generate questions from extracted text
**Technology Stack:** OpenAI SDK, TypeScript, prompt engineering

```typescript
// services/aiService.ts
export class AIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });
  }

  async generateQuestions(
    text: string, 
    config: GenerationConfig
  ): Promise<Question[]> {
    const prompt = this.buildPrompt(text, config);
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: QUESTION_GENERATION_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new AIServiceError('No response from OpenAI');
    }

    return this.parseQuestions(content);
  }

  private buildPrompt(text: string, config: GenerationConfig): string {
    return `
Generate ${config.questionCount} high-quality assessment questions based on the following curriculum content:

Content: ${text}

Requirements:
- Question types: ${config.questionTypes.join(', ')}
- Difficulty distribution: 30% easy, 50% medium, 20% hard
- Clear, unambiguous questions
- Educational value and relevance
- Proper formatting for each question type

Format the response as JSON with the following structure:
{
  "questions": [
    {
      "type": "multiple_choice",
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "difficulty": "medium"
    }
  ]
}
    `;
  }

  private parseQuestions(content: string): Question[] {
    try {
      const parsed = JSON.parse(content);
      return parsed.questions.map((q: any, index: number) => ({
        id: generateId(),
        questionType: q.type,
        questionText: q.question,
        correctAnswer: q.correct_answer,
        options: q.options || [],
        difficulty: q.difficulty,
        orderIndex: index,
        createdAt: new Date(),
      }));
    } catch (error) {
      throw new AIServiceError('Failed to parse AI response');
    }
  }
}
```

### Template Engine Service

**Responsibility:** Process predefined templates with placeholders and generate formatted output
**Technology Stack:** Markdown-it, docx library, PDF generation

```typescript
// services/templateService.ts
export class TemplateService {
  private markdown: MarkdownIt;
  private docxGenerator: DocxGenerator;
  private pdfGenerator: PDFGenerator;

  constructor() {
    this.markdown = new MarkdownIt();
    this.docxGenerator = new DocxGenerator();
    this.pdfGenerator = new PDFGenerator();
  }

  async generateDocument(
    questions: Question[],
    format: 'pdf' | 'docx',
    templateId?: string
  ): Promise<Buffer> {
    const template = await this.getTemplate(templateId);
    const processedContent = this.processTemplate(template, questions);
    
    switch (format) {
      case 'pdf':
        return this.pdfGenerator.generate(processedContent);
      case 'docx':
        return this.docxGenerator.generate(processedContent);
      default:
        throw new ValidationError('Unsupported format');
    }
  }

  private processTemplate(template: Template, questions: Question[]): ProcessedContent {
    const placeholders = {
      title: template.title,
      date: new Date().toLocaleDateString(),
      questionCount: questions.length,
      questions: this.formatQuestions(questions),
    };

    return {
      content: this.replacePlaceholders(template.content, placeholders),
      metadata: {
        title: template.title,
        generatedAt: new Date(),
        questionCount: questions.length,
      },
    };
  }

  private formatQuestions(questions: Question[]): string {
    return questions.map((q, index) => {
      switch (q.questionType) {
        case 'multiple_choice':
          return this.formatMultipleChoice(q, index + 1);
        case 'short_answer':
          return this.formatShortAnswer(q, index + 1);
        case 'true_false':
          return this.formatTrueFalse(q, index + 1);
        default:
          return '';
      }
    }).join('\n\n');
  }
}
```

### Database Service

**Responsibility:** Handle all database operations with type safety and connection management
**Technology Stack:** Supabase client, TypeScript, SQL

```typescript
// services/databaseService.ts
export class DatabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  // Document operations
  async createDocument(data: CreateDocumentData): Promise<Document> {
    const { data: document, error } = await this.supabase
      .from('documents')
      .insert(data)
      .select()
      .single();

    if (error) throw new DatabaseError(error.message);
    return document;
  }

  async getDocument(id: string): Promise<Document> {
    const { data: document, error } = await this.supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new DatabaseError(error.message);
    return document;
  }

  async updateDocument(id: string, updates: Partial<Document>): Promise<Document> {
    const { data: document, error } = await this.supabase
      .from('documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new DatabaseError(error.message);
    return document;
  }

  // Question operations
  async createQuestions(questions: CreateQuestionData[]): Promise<Question[]> {
    const { data, error } = await this.supabase
      .from('questions')
      .insert(questions)
      .select();

    if (error) throw new DatabaseError(error.message);
    return data;
  }

  async getQuestionsBySetId(questionSetId: string): Promise<Question[]> {
    const { data: questions, error } = await this.supabase
      .from('questions')
      .select('*')
      .eq('question_set_id', questionSetId)
      .order('order_index');

    if (error) throw new DatabaseError(error.message);
    return questions;
  }
}
```

### Export Service

**Responsibility:** Generate downloadable files in various formats with proper formatting
**Technology Stack:** jsPDF, docx library, Vercel Blob Storage

```typescript
// services/exportService.ts
export class ExportService {
  private templateService: TemplateService;
  private blobStorage: BlobStorage;

  constructor() {
    this.templateService = new TemplateService();
    this.blobStorage = new BlobStorage();
  }

  async exportQuestions(
    questionSetId: string,
    format: 'pdf' | 'docx'
  ): Promise<ExportResult> {
    const questions = await this.getQuestions(questionSetId);
    const documentBuffer = await this.templateService.generateDocument(
      questions,
      format
    );

    const filename = this.generateFilename(questionSetId, format);
    const blob = await this.blobStorage.uploadBuffer(documentBuffer, filename);

    return {
      downloadUrl: blob.url,
      filename,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };
  }

  private generateFilename(questionSetId: string, format: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return `questions-${questionSetId}-${timestamp}.${format}`;
  }
}
```

## API Route Implementation

### Document Upload Route

```typescript
// api/documents/index.ts
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    try {
      const authService = new AuthService();
      const fileService = new FileProcessingService();
      
      // Verify authentication
      const user = await authService.verifyToken(req.headers.authorization);
      
      // Handle file upload
      const form = new FormData();
      const file = req.body.file;
      
      const document = await fileService.uploadFile(file, user.id);
      
      res.status(201).json(document);
    } catch (error) {
      handleApiError(res, error);
    }
  } else if (req.method === 'GET') {
    try {
      const authService = new AuthService();
      const dbService = new DatabaseService();
      
      const user = await authService.verifyToken(req.headers.authorization);
      const documents = await dbService.getUserDocuments(user.id);
      
      res.status(200).json(documents);
    } catch (error) {
      handleApiError(res, error);
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end('Method Not Allowed');
  }
}
```

### Question Generation Route

```typescript
// api/question-sets/index.ts
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    try {
      const authService = new AuthService();
      const aiService = new AIService();
      const dbService = new DatabaseService();
      
      const user = await authService.verifyToken(req.headers.authorization);
      const { documentId, title, questionCount, questionTypes } = req.body;
      
      // Get document and extracted text
      const document = await dbService.getDocument(documentId);
      if (!document.extractedText) {
        throw new ValidationError('Document not processed yet');
      }
      
      // Generate questions
      const questions = await aiService.generateQuestions(
        document.extractedText,
        { questionCount, questionTypes }
      );
      
      // Create question set
      const questionSet = await dbService.createQuestionSet({
        documentId,
        userId: user.id,
        title,
        questionCount: questions.length,
        generationStatus: 'completed',
      });
      
      // Save questions
      const questionsWithSetId = questions.map(q => ({
        ...q,
        questionSetId: questionSet.id,
      }));
      
      await dbService.createQuestions(questionsWithSetId);
      
      res.status(201).json(questionSet);
    } catch (error) {
      handleApiError(res, error);
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end('Method Not Allowed');
  }
}
```

## Error Handling

### Custom Error Classes

```typescript
// errors/index.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class AuthError extends ApiError {
  constructor(message: string) {
    super(message, 401, 'AUTH_ERROR');
  }
}

export class DatabaseError extends ApiError {
  constructor(message: string) {
    super(message, 500, 'DATABASE_ERROR');
  }
}

export class AIServiceError extends ApiError {
  constructor(message: string) {
    super(message, 502, 'AI_SERVICE_ERROR');
  }
}
```

### Error Handler

```typescript
// utils/errorHandler.ts
export function handleApiError(res: VercelResponse, error: unknown) {
  console.error('API Error:', error);
  
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(),
      },
    });
  } else {
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        requestId: generateRequestId(),
      },
    });
  }
}
```

## Authentication and Authorization

### Auth Flow
1. User logs in via Supabase Auth
2. JWT token stored in httpOnly cookie
3. Token validated on each API request
4. User context extracted from token

### Middleware for Auth

```typescript
// middleware/auth.ts
export async function authenticateRequest(req: VercelRequest): Promise<User> {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    throw new AuthError('No authentication token provided');
  }
  
  const authService = new AuthService();
  return authService.verifyToken(token);
}
```

## Performance Optimization

### Response Time Targets
- **API Responses:** < 200ms for standard operations
- **AI Generation:** < 30s for question generation
- **File Processing:** < 10s for PDF text extraction
- **Export Generation:** < 5s for document generation

### Caching Strategy
- **Database Queries:** Connection pooling and query optimization
- **AI Responses:** Cache similar prompts to reduce API calls
- **File Processing:** Cache extracted text to avoid re-processing
- **Export Files:** Cache generated documents for 24 hours
