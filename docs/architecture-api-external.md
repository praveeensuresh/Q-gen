# AI Question Generator - API Specification & External Services

## API Specification

### REST API Endpoints

**Authentication:**
- `POST /api/auth/login` - Teacher login
- `POST /api/auth/logout` - Teacher logout

**Documents:**
- `POST /api/documents` - Upload PDF document
- `GET /api/documents` - Get user's documents
- `GET /api/documents/{id}` - Get document details
- `DELETE /api/documents/{id}` - Delete document
- `POST /api/documents/{id}/process` - Start document processing

**Question Sets:**
- `POST /api/question-sets` - Generate questions from document
- `GET /api/question-sets` - Get user's question sets
- `GET /api/question-sets/{id}` - Get question set with questions
- `DELETE /api/question-sets/{id}` - Delete question set
- `POST /api/question-sets/{id}/export` - Export question set

**Health:**
- `GET /api/health` - Health check endpoint

### API Request/Response Examples

#### Document Upload
```typescript
// POST /api/documents
interface UploadDocumentRequest {
  file: File;
  filename: string;
}

interface UploadDocumentResponse {
  id: string;
  filename: string;
  file_size: number;
  upload_status: 'uploading' | 'processing' | 'completed' | 'failed';
  created_at: string;
}
```

#### Question Generation
```typescript
// POST /api/question-sets
interface GenerateQuestionsRequest {
  document_id: string;
  title: string;
  question_count?: number;
  question_types?: ('multiple_choice' | 'short_answer' | 'true_false')[];
}

interface GenerateQuestionsResponse {
  id: string;
  title: string;
  question_count: number;
  generation_status: 'generating' | 'completed' | 'failed';
  created_at: string;
}
```

#### Question Export
```typescript
// POST /api/question-sets/{id}/export
interface ExportQuestionsRequest {
  format: 'pdf' | 'docx';
  template_id?: string;
}

interface ExportQuestionsResponse {
  download_url: string;
  filename: string;
  expires_at: string;
}
```

### API Error Handling

#### Error Response Format
```typescript
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId: string;
  };
}
```

#### Error Categories
- **Validation errors:** User input validation failures
- **Authentication errors:** Login and session issues
- **External service errors:** AI API and database failures
- **Internal errors:** Unexpected application errors

## External APIs

### OpenAI API

- **Purpose:** Generate high-quality assessment questions from curriculum content using AI
- **Documentation:** https://platform.openai.com/docs/api-reference
- **Base URL(s):** https://api.openai.com/v1
- **Authentication:** Bearer token (API key)
- **Rate Limits:** 3,500 requests per minute for GPT-4, 10,000 tokens per minute

**Key Endpoints Used:**
- `POST /chat/completions` - Generate questions using GPT-4 with structured prompts

**Request Example:**
```typescript
interface OpenAIRequest {
  model: 'gpt-4';
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature: number;
  max_tokens: number;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage: {
    total_tokens: number;
  };
}
```

**Prompt Engineering:**
```typescript
const QUESTION_GENERATION_PROMPT = `
You are an expert educational assessment creator. Generate high-quality questions based on the provided curriculum content.

Content: {extracted_text}

Requirements:
- Generate {question_count} questions
- Mix of question types: {question_types}
- Difficulty levels: easy, medium, hard
- Clear, unambiguous questions
- Educational value and relevance

Format the response as JSON with the following structure:
{
  "questions": [
    {
      "type": "multiple_choice",
      "question": "Question text here",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "A",
      "difficulty": "medium"
    }
  ]
}
`;
```

### Supabase API

- **Purpose:** Database operations, authentication, and real-time updates
- **Documentation:** https://supabase.com/docs/reference
- **Base URL(s):** https://[project-ref].supabase.co
- **Authentication:** JWT token via Supabase Auth
- **Rate Limits:** 500 requests per second for database operations

**Key Operations:**
- Database CRUD operations
- Real-time subscriptions
- Authentication and authorization
- Row Level Security (RLS) enforcement

**Client Configuration:**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);
```

### Vercel Blob Storage API

- **Purpose:** Temporary file storage for uploaded PDFs and generated exports
- **Documentation:** https://vercel.com/docs/storage/vercel-blob
- **Base URL(s):** https://blob.vercel-storage.com
- **Authentication:** Vercel API token
- **Rate Limits:** 1000 requests per minute

**Key Operations:**
- File upload and storage
- File retrieval and download
- File deletion and cleanup
- Signed URL generation

**Usage Example:**
```typescript
import { put, del } from '@vercel/blob';

// Upload file
const blob = await put(filename, file, {
  access: 'public',
  addRandomSuffix: true,
});

// Delete file
await del(blob.url);
```

## API Integration Patterns

### Authentication Flow
1. User logs in via Supabase Auth
2. JWT token stored in httpOnly cookie
3. Token validated on each API request
4. User context extracted from token

### File Processing Flow
1. PDF uploaded to Vercel Blob Storage
2. Document record created in database
3. Text extraction triggered asynchronously
4. Status updates via WebSocket/SSE
5. Extracted text stored in database

### Question Generation Flow
1. Document text retrieved from database
2. OpenAI API called with structured prompt
3. Generated questions parsed and validated
4. Questions stored in database with relationships
5. Status updated to completed

### Export Generation Flow
1. Questions retrieved from database
2. Template engine processes questions
3. Document generated (PDF/DOCX)
4. File stored in Vercel Blob Storage
5. Signed download URL returned

## Rate Limiting and Throttling

### API Rate Limits
- **File Upload:** 10 uploads per hour per user
- **Question Generation:** 5 generations per hour per user
- **Export Generation:** 20 exports per hour per user
- **General API:** 100 requests per minute per IP

### External Service Limits
- **OpenAI API:** 3,500 requests per minute
- **Supabase:** 500 requests per second
- **Vercel Blob:** 1,000 requests per minute

### Throttling Strategy
- **Exponential Backoff:** For external API failures
- **Queue Management:** For high-volume operations
- **User Quotas:** Per-user rate limiting
- **Circuit Breaker:** For external service failures
