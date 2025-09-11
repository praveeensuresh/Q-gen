# Environment Variables Setup

To run the application with real PDF processing and AI question generation, you need to set up the following environment variables:

## Required Environment Variables

Create a `.env` file in the `apps/web` directory with the following variables:

```bash
# OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_OPENAI_MODEL=gpt-4
VITE_OPENAI_TEMPERATURE=0.7
VITE_OPENAI_MAX_TOKENS=2000

# Vercel Blob Storage
VITE_VERCEL_BLOB_READ_WRITE_TOKEN=your_vercel_blob_token_here
VITE_VERCEL_BLOB_URL=https://your-blob-url.vercel-storage.com

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# File Upload Configuration
VITE_MAX_FILE_SIZE=10485760
VITE_ALLOWED_FILE_TYPES=application/pdf

# PDF Processing Configuration
VITE_PDF_PROCESSING_TIMEOUT=30000
VITE_TEXT_MIN_LENGTH=100
VITE_TEXT_QUALITY_THRESHOLD=0.7
```

## How to Get These Values

### 1. OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Go to API Keys section
4. Create a new API key
5. Copy the key and paste it as `VITE_OPENAI_API_KEY`

### 2. Vercel Blob Storage
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Create a new project or use existing one
3. Go to Storage tab
4. Create a new Blob store
5. Copy the read/write token and URL

### 3. Supabase Configuration
1. Go to [Supabase](https://supabase.com/)
2. Create a new project
3. Go to Settings > API
4. Copy the Project URL and anon public key

## Database Schema

You'll also need to create the following table in your Supabase database:

```sql
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  upload_status TEXT NOT NULL CHECK (upload_status IN ('uploading', 'processing', 'completed', 'failed')),
  extracted_text TEXT,
  text_length INTEGER,
  processing_progress INTEGER DEFAULT 0 CHECK (processing_progress >= 0 AND processing_progress <= 100),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_upload_status ON documents(upload_status);
CREATE INDEX idx_documents_created_at ON documents(created_at);
```

## Testing the Setup

1. Start the development server: `npm run dev`
2. Upload a PDF file
3. Check the browser console for any errors
4. Verify that the file uploads to Vercel Blob Storage
5. Check that text extraction works
6. Test AI question generation

## Troubleshooting

### Common Issues

1. **OpenAI API Key Error**: Make sure the API key is valid and has sufficient credits
2. **Vercel Blob Error**: Check that the token has the correct permissions
3. **Supabase Error**: Verify the URL and anon key are correct
4. **PDF Processing Error**: Ensure the PDF is not password-protected or corrupted

### Debug Mode

To enable debug logging, add this to your `.env` file:
```bash
VITE_DEBUG=true
```

This will show detailed logs in the browser console.
