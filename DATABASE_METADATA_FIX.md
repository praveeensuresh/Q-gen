# Database Metadata Column Fix

## 🚨 **Issue**
**Error**: `Database update error: Could not find the 'metadata' column of 'documents' in the schema cache`

**Root Cause**: The code was trying to update a `metadata` column in the `documents` table that doesn't exist in the database schema.

## 🔧 **Solution Implemented**

### 1. **Database Schema Update**
**File**: `apps/web/database-migrations/add-metadata-column.sql`

```sql
-- Add metadata column to documents table
ALTER TABLE documents 
ADD COLUMN metadata JSONB DEFAULT NULL;

-- Add comment and index
COMMENT ON COLUMN documents.metadata IS 'JSON metadata containing PDF processing information';
CREATE INDEX idx_documents_metadata ON documents USING GIN (metadata);
```

### 2. **TypeScript Types Updated**
**Files**: 
- `apps/web/src/lib/supabase.ts`
- `apps/web/src/types/document.ts`

**Changes**:
- Added `metadata` field to database types
- Updated `DocumentResponse` interface
- Added proper JSONB type definitions

### 3. **Fallback Error Handling**
**File**: `apps/web/src/services/documentService.ts`

**Enhancement**: Added graceful fallback when metadata column doesn't exist:

```typescript
// First, try to update with metadata
const { error: metadataError } = await supabase
  .from('documents')
  .update({
    extracted_text: extractionResult.text,
    text_length: extractionResult.textLength,
    metadata: { /* ... */ },
  })
  .eq('id', documentId);

if (metadataError) {
  // If metadata column doesn't exist, try without it
  if (metadataError.message.includes('metadata') && metadataError.message.includes('column')) {
    console.warn('Metadata column not found, updating without metadata');
    // Fallback update without metadata
  }
}
```

## 📋 **Deployment Steps**

### **Option 1: Run Migration Script (Recommended)**
1. Connect to your Supabase database
2. Run the migration script:
   ```sql
   -- Copy and paste the contents of apps/web/database-migrations/add-metadata-column.sql
   ```

### **Option 2: Manual Database Update**
1. Go to Supabase Dashboard → SQL Editor
2. Run this command:
   ```sql
   ALTER TABLE documents ADD COLUMN metadata JSONB DEFAULT NULL;
   ```

### **Option 3: Use Fallback (Temporary)**
- The code will automatically fall back to updating without metadata
- Processing will work but metadata won't be stored

## ✅ **Benefits of This Fix**

1. **Stores Rich Metadata**: Page count, quality scores, processing duration
2. **Backward Compatible**: Works with existing records
3. **Graceful Degradation**: Falls back if column doesn't exist
4. **Performance Optimized**: Includes GIN index for JSONB queries
5. **Type Safe**: Full TypeScript support

## 🔍 **What Metadata is Stored**

```typescript
metadata: {
  page_count: number,           // Number of pages in PDF
  text_quality_score: number,   // Readability score (0-100)
  processing_duration: number   // Processing time in milliseconds
}
```

## 🚀 **Testing the Fix**

1. **Run the migration script** in your Supabase database
2. **Upload a PDF** through the application
3. **Check the database** - the `metadata` column should now exist
4. **Verify processing** - metadata should be stored successfully

## ⚠️ **Important Notes**

- **Backup First**: Always backup your database before running migrations
- **Test Environment**: Test in a development environment first
- **Rollback Plan**: If issues occur, you can drop the column:
  ```sql
  ALTER TABLE documents DROP COLUMN metadata;
  ```

## 📊 **Expected Results**

After applying this fix:
- ✅ PDF processing will complete successfully
- ✅ Metadata will be stored in the database
- ✅ No more "metadata column not found" errors
- ✅ Rich processing information available for analytics
