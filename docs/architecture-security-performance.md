# AI Question Generator - Security, Performance & Testing

## Security Requirements

### Frontend Security

**Content Security Policy (CSP):**
```typescript
// vite.config.ts
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      connect-src 'self' https://*.supabase.co https://api.openai.com;
      font-src 'self';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
    `.replace(/\s{2,}/g, ' ').trim()
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];

export default defineConfig({
  plugins: [react()],
  server: {
    headers: securityHeaders,
  },
});
```

**XSS Prevention:**
- React's built-in XSS protection
- Input sanitization for user-generated content
- Content Security Policy headers
- Proper HTML escaping in templates

**Secure Storage:**
```typescript
// Secure token storage
export const secureStorage = {
  setToken: (token: string) => {
    // Store in httpOnly cookie
    document.cookie = `auth-token=${token}; HttpOnly; Secure; SameSite=Strict`;
  },
  
  getToken: () => {
    // Read from httpOnly cookie
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('auth-token='))
      ?.split('=')[1];
  },
  
  removeToken: () => {
    document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
};
```

### Backend Security

**Input Validation:**
```typescript
// Comprehensive validation using Zod schemas
export const DocumentUploadSchema = z.object({
  file: z.instanceof(File),
  filename: z.string().min(1).max(255),
  fileSize: z.number().min(1).max(10485760), // 10MB
  fileType: z.string().regex(/^application\/pdf$/),
});

export const QuestionGenerationSchema = z.object({
  documentId: z.string().uuid(),
  title: z.string().min(1).max(255),
  questionCount: z.number().min(1).max(50),
  questionTypes: z.array(z.enum(['multiple_choice', 'short_answer', 'true_false'])),
});
```

**Rate Limiting:**
```typescript
// Rate limiting middleware
const rateLimit = new Map();

export function rateLimitMiddleware(
  req: VercelRequest,
  res: VercelResponse,
  next: () => void
) {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100;

  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
    next();
    return;
  }

  const userLimit = rateLimit.get(ip);
  
  if (now > userLimit.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
    next();
    return;
  }

  if (userLimit.count >= maxRequests) {
    res.status(429).json({ error: 'Too many requests' });
    return;
  }

  userLimit.count++;
  next();
}
```

**CORS Policy:**
```typescript
// CORS configuration
const corsOptions = {
  origin: [
    'https://ai-question-generator.vercel.app',
    'http://localhost:5173',
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
```

### Authentication Security

**JWT Token Management:**
```typescript
// Secure JWT handling
export class AuthSecurity {
  static createToken(user: User): string {
    return jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET!,
      { 
        expiresIn: '24h',
        issuer: 'ai-question-generator',
        audience: 'teachers'
      }
    );
  }

  static verifyToken(token: string): User {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      return {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        created_at: new Date(),
        last_login: new Date(),
      };
    } catch (error) {
      throw new AuthError('Invalid token');
    }
  }
}
```

**Password Policy:**
```typescript
// Password validation
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');
```

## Performance Optimization

### Frontend Performance

**Bundle Size Targets:**
- Initial bundle: < 500KB
- Total with lazy loading: < 1MB
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s

**Code Splitting Strategy:**
```typescript
// Route-based code splitting
const ProcessingPage = lazy(() => import('../pages/processing/[id]'));
const QuestionsPage = lazy(() => import('../pages/questions/[id]'));
const ExportPage = lazy(() => import('../pages/export/[id]'));

// Component-based code splitting
const QuestionEditor = lazy(() => import('../features/questions/QuestionEditor'));
const ExportOptions = lazy(() => import('../features/export/ExportOptions'));
```

**Caching Strategy:**
```typescript
// React Query for API data caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// Service Worker for static assets
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

**Image Optimization:**
```typescript
// Optimized image component for React
const OptimizedImage = ({ src, alt, ...props }) => (
  <img
    src={src}
    alt={alt}
    loading="lazy"
    style={{ maxWidth: '100%', height: 'auto' }}
    {...props}
  />
);
```

### Backend Performance

**Response Time Targets:**
- API responses: < 200ms
- AI generation: < 30s
- File processing: < 10s
- Export generation: < 5s

**Database Optimization:**
```sql
-- Query optimization
EXPLAIN ANALYZE SELECT * FROM questions 
WHERE question_set_id = $1 
ORDER BY order_index;

-- Index usage monitoring
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;
```

**Caching Strategy:**
```typescript
// Redis caching for session data
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

export class CacheService {
  static async get(key: string): Promise<any> {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  static async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await redis.setex(key, ttl, JSON.stringify(value));
  }

  static async del(key: string): Promise<void> {
    await redis.del(key);
  }
}
```

**Connection Pooling:**
```typescript
// Database connection pooling
export const dbConfig = {
  host: process.env.SUPABASE_HOST,
  port: 5432,
  database: process.env.SUPABASE_DB,
  user: process.env.SUPABASE_USER,
  password: process.env.SUPABASE_PASSWORD,
  ssl: { rejectUnauthorized: false },
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};
```

## Testing Strategy

### Testing Pyramid

```
E2E Tests (Playwright)
/        \
Integration Tests (Vitest + Testing Library)
/            \
Frontend Unit  Backend Unit (Vitest + Supertest)
```

### Frontend Testing

**Unit Tests:**
```typescript
// components/__tests__/FileUpload.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { FileUpload } from '../FileUpload';

describe('FileUpload', () => {
  it('should accept PDF files', () => {
    const mockOnFileSelect = jest.fn();
    render(<FileUpload onFileSelect={mockOnFileSelect} />);
    
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/upload file/i);
    
    fireEvent.change(input, { target: { files: [file] } });
    
    expect(mockOnFileSelect).toHaveBeenCalledWith(file);
  });

  it('should reject non-PDF files', () => {
    const mockOnFileSelect = jest.fn();
    render(<FileUpload onFileSelect={mockOnFileSelect} />);
    
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByLabelText(/upload file/i);
    
    fireEvent.change(input, { target: { files: [file] } });
    
    expect(mockOnFileSelect).not.toHaveBeenCalled();
    expect(screen.getByText(/only pdf files are allowed/i)).toBeInTheDocument();
  });
});
```

**Integration Tests:**
```typescript
// __tests__/integration/question-generation.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QuestionGeneration } from '../features/questions/QuestionGeneration';

describe('Question Generation Integration', () => {
  it('should generate questions from document', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <QuestionGeneration documentId="test-doc-id" />
      </QueryClientProvider>
    );

    fireEvent.click(screen.getByText(/generate questions/i));
    
    await waitFor(() => {
      expect(screen.getByText(/generating questions/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/questions generated successfully/i)).toBeInTheDocument();
    });
  });
});
```

### Backend Testing

**Unit Tests:**
```typescript
// services/__tests__/aiService.test.ts
import { AIService } from '../aiService';
import { OpenAI } from 'openai';

jest.mock('openai');

describe('AIService', () => {
  let aiService: AIService;
  let mockOpenAI: jest.Mocked<OpenAI>;

  beforeEach(() => {
    mockOpenAI = new OpenAI() as jest.Mocked<OpenAI>;
    aiService = new AIService();
  });

  it('should generate questions from text', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify({
            questions: [{
              type: 'multiple_choice',
              question: 'What is the capital of France?',
              options: ['London', 'Paris', 'Berlin', 'Madrid'],
              correct_answer: 'Paris',
              difficulty: 'easy'
            }]
          })
        }
      }]
    };

    mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

    const questions = await aiService.generateQuestions(
      'France is a country in Europe. Its capital is Paris.',
      { questionCount: 1, questionTypes: ['multiple_choice'] }
    );

    expect(questions).toHaveLength(1);
    expect(questions[0].questionText).toBe('What is the capital of France?');
    expect(questions[0].correctAnswer).toBe('Paris');
  });
});
```

**API Tests:**
```typescript
// __tests__/api/documents.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '../../api/documents';

describe('/api/documents', () => {
  it('should create document on POST', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        filename: 'test.pdf',
        fileSize: 1024,
      },
      headers: {
        authorization: 'Bearer valid-token',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(201);
    expect(JSON.parse(res._getData())).toMatchObject({
      filename: 'test.pdf',
      fileSize: 1024,
    });
  });

  it('should return 401 for invalid token', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { filename: 'test.pdf' },
      headers: { authorization: 'Bearer invalid-token' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
  });
});
```

### E2E Testing

**Playwright Tests:**
```typescript
// tests/e2e/upload-to-export.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Complete User Workflow', () => {
  test('should upload PDF, generate questions, and export', async ({ page }) => {
    await page.goto('/');

    // Upload PDF
    await page.setInputFiles('input[type="file"]', 'test-files/sample.pdf');
    await expect(page.locator('text=Processing...')).toBeVisible();

    // Wait for processing to complete
    await expect(page.locator('text=Processing complete')).toBeVisible({ timeout: 30000 });

    // Generate questions
    await page.click('button:has-text("Generate Questions")');
    await expect(page.locator('text=Generating questions...')).toBeVisible();

    // Wait for questions to be generated
    await expect(page.locator('text=Questions generated successfully')).toBeVisible({ timeout: 60000 });

    // Preview questions
    await expect(page.locator('[data-testid="question-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="question-item"]')).toHaveCount(10);

    // Export questions
    await page.click('button:has-text("Export")');
    await page.selectOption('select[name="format"]', 'pdf');
    await page.click('button:has-text("Download")');

    // Verify download
    const downloadPromise = page.waitForEvent('download');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/questions-.*\.pdf/);
  });
});
```

## Monitoring and Observability

### Key Metrics

**Frontend Metrics:**
- Core Web Vitals (LCP, FID, CLS)
- JavaScript errors and stack traces
- API response times and error rates
- User interactions and page views
- File upload success/failure rates
- Question generation completion rates

**Backend Metrics:**
- Request rate and response times
- Error rate by endpoint and error type
- Database query performance
- AI API call success/failure rates
- File processing times and success rates
- Memory usage and function duration

### Error Tracking

```typescript
// Error tracking service
export class ErrorTracker {
  static trackError(error: Error, context?: Record<string, any>) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.error('Error tracked:', errorData);

    // Send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData),
      });
    }
  }
}
```

### Performance Monitoring

```typescript
// Performance monitoring
export class PerformanceMonitor {
  static trackPageLoad() {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      const metrics = {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
      };

      console.log('Performance metrics:', metrics);
    }
  }
}
```
