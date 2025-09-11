# Critical Errors Fix - Supabase & Vercel Blob Issues

## 🚨 **Critical Issues Identified:**

### **1. Supabase 401 Unauthorized Error**
```
POST https://tpcpnnvqpkkachgstabr.supabase.co/rest/v1/documents?select=* 401 (Unauthorized)
```

### **2. Vercel Blob CORS Error**
```
Access to fetch at 'https://vercel.com/api/blob/delete' from origin 'http://localhost:3000' has been blocked by CORS policy
```

### **3. File Cleanup Logic Issue**
The application tries to delete files that don't exist, causing unnecessary API calls.

## 🔧 **Code Fixes Applied:**

### **1. Removed Problematic File Cleanup**
**File:** `src/services/documentService.ts`
```typescript
// ❌ Before: Caused CORS errors
if (error) {
  try {
    await fileStorageService.instance.deleteFile(blobResult.url)
  } catch (cleanupError) {
    console.error('Failed to cleanup uploaded file:', cleanupError)
  }
  throw new Error(`Database error: ${error.message}`)
}

// ✅ After: Simple error handling
if (error) {
  console.error('Database insert failed:', error)
  throw new Error(`Database error: ${error.message}`)
}
```

### **2. Improved Error Handling**
- Removed CORS-problematic file deletion calls
- Simplified error handling to focus on core functionality
- Added better logging for debugging

## 🌐 **External Setup Required (Outside IDE):**

### **1. Supabase Setup (CRITICAL)**

#### **A. Create Supabase Project:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Choose your organization
4. Enter project details:
   - **Name:** `q-gen-database`
   - **Database Password:** (generate a strong password)
   - **Region:** Choose closest to your location

#### **B. Get Your Credentials:**
1. In your Supabase project dashboard
2. Go to **Settings** → **API**
3. Copy these values:
   - **Project URL** (looks like `https://tpcpnnvqpkkachgstabr.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

#### **C. Create Database Tables:**
Run this SQL in your Supabase SQL Editor:

```sql
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  upload_status TEXT DEFAULT 'pending',
  extracted_text TEXT,
  text_length INTEGER,
  processing_progress INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Create question_sets table
CREATE TABLE IF NOT EXISTS question_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  question_count INTEGER DEFAULT 0,
  generation_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  exported_at TIMESTAMP WITH TIME ZONE
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_set_id UUID REFERENCES question_sets(id) ON DELETE CASCADE,
  question_type TEXT NOT NULL,
  question_text TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  options TEXT[] DEFAULT '{}',
  difficulty TEXT DEFAULT 'medium',
  order_index INTEGER NOT NULL,
  quality_score DECIMAL(3,2),
  content_type TEXT,
  is_modified BOOLEAN DEFAULT FALSE,
  modified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for documents
CREATE POLICY "Users can view their own documents" ON documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents" ON documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" ON documents
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for question_sets
CREATE POLICY "Users can view their own question sets" ON question_sets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own question sets" ON question_sets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own question sets" ON question_sets
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for questions
CREATE POLICY "Users can view questions from their sets" ON questions
  FOR SELECT USING (
    question_set_id IN (
      SELECT id FROM question_sets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert questions to their sets" ON questions
  FOR INSERT WITH CHECK (
    question_set_id IN (
      SELECT id FROM question_sets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update questions in their sets" ON questions
  FOR UPDATE USING (
    question_set_id IN (
      SELECT id FROM question_sets WHERE user_id = auth.uid()
    )
  );
```

#### **D. Disable RLS for Development (Temporary):**
If you want to test without authentication first:

```sql
-- Temporarily disable RLS for testing
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE question_sets DISABLE ROW LEVEL SECURITY;
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
```

### **2. Vercel Blob Setup (CRITICAL)**

#### **A. Create Vercel Blob Storage:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to your project
3. Go to **Storage** tab
4. Click **Create Database** → **Blob**
5. Name it: `q-gen-storage`

#### **B. Get Your Credentials:**
1. In Vercel Blob dashboard → **Settings**
2. Copy:
   - **Read/Write Token** (starts with `vercel_blob_rw_`)
   - **Blob URL** (looks like `https://[hash].public.blob.vercel-storage.com`)

### **3. Environment Variables Setup**

Create/update your `.env` file:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Vercel Blob Storage
VITE_VERCEL_BLOB_READ_WRITE_TOKEN=vercel_blob_rw_your-token-here
VITE_VERCEL_BLOB_URL=https://your-hash.public.blob.vercel-storage.com

# OpenAI Configuration
VITE_OPENAI_API_KEY=your-openai-api-key-here
```

## 🧪 **Testing the Fixes:**

### **1. Test Supabase Connection:**
1. Set up Supabase as described above
2. Add environment variables
3. Restart development server: `npm run dev`
4. Check browser console - no more 401 errors

### **2. Test Vercel Blob:**
1. Set up Vercel Blob as described above
2. Add environment variables
3. Test file upload - should work without CORS errors

### **3. Test Complete Workflow:**
1. Upload a PDF file
2. Check processing status
3. Generate questions
4. Preview results

## 📋 **Expected Results After Setup:**

✅ **No more 401 Unauthorized errors**
✅ **No more CORS policy errors**
✅ **File upload works properly**
✅ **Database operations succeed**
✅ **Complete workflow functions**

## 🚨 **If You Still Get Errors:**

### **Supabase Issues:**
1. **Check RLS policies** - Make sure they're created correctly
2. **Verify environment variables** - Double-check URL and key
3. **Check project status** - Ensure Supabase project is active

### **Vercel Blob Issues:**
1. **Check token permissions** - Ensure read/write access
2. **Verify URL format** - Should end with `.public.blob.vercel-storage.com`
3. **Check project linking** - Ensure blob is linked to correct project

### **General Issues:**
1. **Restart development server** after setting environment variables
2. **Clear browser cache** and hard refresh
3. **Check network tab** for specific error details

The application should work perfectly once you complete the external setup! 🎉
