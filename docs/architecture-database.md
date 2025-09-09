# AI Question Generator - Database Schema

## Database Schema Overview

The database uses PostgreSQL via Supabase with a normalized schema designed for scalability and data integrity. The schema includes proper indexing, constraints, and Row Level Security (RLS) policies for data isolation.

## PostgreSQL Schema

### Core Tables

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (simplified for POC - teachers only)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) DEFAULT 'teacher' CHECK (role = 'teacher'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    upload_status VARCHAR(20) NOT NULL DEFAULT 'uploading' 
        CHECK (upload_status IN ('uploading', 'processing', 'completed', 'failed')),
    extracted_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Question sets table
CREATE TABLE question_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    question_count INTEGER NOT NULL DEFAULT 0,
    generation_status VARCHAR(20) NOT NULL DEFAULT 'generating'
        CHECK (generation_status IN ('generating', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    exported_at TIMESTAMP WITH TIME ZONE
);

-- Questions table
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_set_id UUID NOT NULL REFERENCES question_sets(id) ON DELETE CASCADE,
    question_type VARCHAR(20) NOT NULL 
        CHECK (question_type IN ('multiple_choice', 'short_answer', 'true_false')),
    question_text TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    options TEXT[] DEFAULT '{}', -- Array for multiple choice options
    difficulty VARCHAR(10) NOT NULL DEFAULT 'medium'
        CHECK (difficulty IN ('easy', 'medium', 'hard')),
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Indexes for Performance

```sql
-- Indexes for performance
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_upload_status ON documents(upload_status);
CREATE INDEX idx_documents_created_at ON documents(created_at);

CREATE INDEX idx_question_sets_user_id ON question_sets(user_id);
CREATE INDEX idx_question_sets_document_id ON question_sets(document_id);
CREATE INDEX idx_question_sets_generation_status ON question_sets(generation_status);
CREATE INDEX idx_question_sets_created_at ON question_sets(created_at);

CREATE INDEX idx_questions_question_set_id ON questions(question_set_id);
CREATE INDEX idx_questions_order_index ON questions(question_set_id, order_index);
CREATE INDEX idx_questions_question_type ON questions(question_type);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Documents policies
CREATE POLICY "Users can view own documents" ON documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents" ON documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" ON documents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" ON documents
    FOR DELETE USING (auth.uid() = user_id);

-- Question sets policies
CREATE POLICY "Users can view own question sets" ON question_sets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own question sets" ON question_sets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own question sets" ON question_sets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own question sets" ON question_sets
    FOR DELETE USING (auth.uid() = user_id);

-- Questions policies (inherited through question_sets)
CREATE POLICY "Users can view questions from own question sets" ON questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM question_sets 
            WHERE question_sets.id = questions.question_set_id 
            AND question_sets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert questions to own question sets" ON questions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM question_sets 
            WHERE question_sets.id = questions.question_set_id 
            AND question_sets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update questions in own question sets" ON questions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM question_sets 
            WHERE question_sets.id = questions.question_set_id 
            AND question_sets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete questions from own question sets" ON questions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM question_sets 
            WHERE question_sets.id = questions.question_set_id 
            AND question_sets.user_id = auth.uid()
        )
    );
```

## Database Functions and Triggers

### Update Question Count Trigger

```sql
-- Function to update question count
CREATE OR REPLACE FUNCTION update_question_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE question_sets 
        SET question_count = question_count + 1 
        WHERE id = NEW.question_set_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE question_sets 
        SET question_count = question_count - 1 
        WHERE id = OLD.question_set_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update question count
CREATE TRIGGER trigger_update_question_count
    AFTER INSERT OR DELETE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_question_count();
```

### Cleanup Old Files Function

```sql
-- Function to clean up old documents and files
CREATE OR REPLACE FUNCTION cleanup_old_documents()
RETURNS void AS $$
BEGIN
    -- Delete documents older than 30 days that haven't been processed
    DELETE FROM documents 
    WHERE created_at < NOW() - INTERVAL '30 days'
    AND upload_status = 'failed';
    
    -- Delete question sets older than 30 days
    DELETE FROM question_sets 
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup function (run daily)
-- This would be set up as a cron job or scheduled function
```

## Data Validation and Constraints

### Table Constraints

```sql
-- Additional constraints for data integrity
ALTER TABLE documents 
ADD CONSTRAINT check_file_size 
CHECK (file_size > 0 AND file_size <= 10485760); -- 10MB max

ALTER TABLE documents 
ADD CONSTRAINT check_filename_length 
CHECK (LENGTH(filename) > 0 AND LENGTH(filename) <= 255);

ALTER TABLE question_sets 
ADD CONSTRAINT check_question_count 
CHECK (question_count >= 0 AND question_count <= 50);

ALTER TABLE questions 
ADD CONSTRAINT check_question_text_length 
CHECK (LENGTH(question_text) > 0 AND LENGTH(question_text) <= 2000);

ALTER TABLE questions 
ADD CONSTRAINT check_correct_answer_length 
CHECK (LENGTH(correct_answer) > 0 AND LENGTH(correct_answer) <= 1000);

ALTER TABLE questions 
ADD CONSTRAINT check_options_array_length 
CHECK (ARRAY_LENGTH(options, 1) IS NULL OR ARRAY_LENGTH(options, 1) BETWEEN 2 AND 6);
```

### Application-Level Validation

```typescript
// Database validation schemas
export const DocumentSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  filename: z.string().min(1).max(255),
  filePath: z.string().url(),
  fileSize: z.number().min(1).max(10485760), // 10MB
  uploadStatus: z.enum(['uploading', 'processing', 'completed', 'failed']),
  extractedText: z.string().optional(),
  createdAt: z.date(),
  processedAt: z.date().optional(),
});

export const QuestionSetSchema = z.object({
  id: z.string().uuid(),
  documentId: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string().min(1).max(255),
  questionCount: z.number().min(0).max(50),
  generationStatus: z.enum(['generating', 'completed', 'failed']),
  createdAt: z.date(),
  exportedAt: z.date().optional(),
});

export const QuestionSchema = z.object({
  id: z.string().uuid(),
  questionSetId: z.string().uuid(),
  questionType: z.enum(['multiple_choice', 'short_answer', 'true_false']),
  questionText: z.string().min(1).max(2000),
  correctAnswer: z.string().min(1).max(1000),
  options: z.array(z.string()).max(6).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  orderIndex: z.number().min(0),
  createdAt: z.date(),
});
```

## Database Migrations

### Initial Migration

```sql
-- Migration: 001_initial_schema.sql
-- Create initial tables and indexes

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) DEFAULT 'teacher' CHECK (role = 'teacher'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    upload_status VARCHAR(20) NOT NULL DEFAULT 'uploading' 
        CHECK (upload_status IN ('uploading', 'processing', 'completed', 'failed')),
    extracted_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Question sets table
CREATE TABLE question_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    question_count INTEGER NOT NULL DEFAULT 0,
    generation_status VARCHAR(20) NOT NULL DEFAULT 'generating'
        CHECK (generation_status IN ('generating', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    exported_at TIMESTAMP WITH TIME ZONE
);

-- Questions table
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_set_id UUID NOT NULL REFERENCES question_sets(id) ON DELETE CASCADE,
    question_type VARCHAR(20) NOT NULL 
        CHECK (question_type IN ('multiple_choice', 'short_answer', 'true_false')),
    question_text TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    options TEXT[] DEFAULT '{}',
    difficulty VARCHAR(10) NOT NULL DEFAULT 'medium'
        CHECK (difficulty IN ('easy', 'medium', 'hard')),
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_upload_status ON documents(upload_status);
CREATE INDEX idx_question_sets_user_id ON question_sets(user_id);
CREATE INDEX idx_question_sets_document_id ON question_sets(document_id);
CREATE INDEX idx_questions_question_set_id ON questions(question_set_id);
CREATE INDEX idx_questions_order_index ON questions(question_set_id, order_index);
```

### RLS Migration

```sql
-- Migration: 002_enable_rls.sql
-- Enable Row Level Security and create policies

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (as shown in the main schema section)
-- ... (policies code from above)
```

## Database Connection and Configuration

### Supabase Client Configuration

```typescript
// config/database.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Client for user operations (with RLS)
export const supabaseClient = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);
```

### Connection Pooling

```typescript
// config/connectionPool.ts
export const dbConfig = {
  host: process.env.SUPABASE_HOST,
  port: 5432,
  database: process.env.SUPABASE_DB,
  user: process.env.SUPABASE_USER,
  password: process.env.SUPABASE_PASSWORD,
  ssl: { rejectUnauthorized: false },
  max: 20, // Maximum number of connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};
```

## Backup and Recovery

### Backup Strategy

```sql
-- Daily backup script
-- pg_dump -h host -U user -d database -f backup_$(date +%Y%m%d).sql

-- Automated backup with Supabase
-- Supabase provides automatic daily backups
-- Point-in-time recovery available for Pro plans
```

### Data Retention Policy

```sql
-- Data retention policies
-- Documents: Keep for 30 days after last access
-- Question sets: Keep for 90 days after creation
-- Questions: Keep for 90 days after creation
-- Users: Keep indefinitely (for POC)

-- Cleanup function for old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Delete old documents
    DELETE FROM documents 
    WHERE created_at < NOW() - INTERVAL '30 days'
    AND upload_status = 'failed';
    
    -- Delete old question sets and questions
    DELETE FROM question_sets 
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;
```

## Performance Monitoring

### Query Performance

```sql
-- Enable query performance monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Monitor slow queries
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
WHERE mean_time > 1000  -- Queries taking more than 1 second
ORDER BY mean_time DESC;
```

### Index Usage

```sql
-- Monitor index usage
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
