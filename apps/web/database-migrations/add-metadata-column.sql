-- Migration: Add metadata column to documents table
-- Date: 2025-09-10
-- Description: Adds a JSONB metadata column to store PDF processing metadata

-- Add metadata column to documents table
ALTER TABLE documents 
ADD COLUMN metadata JSONB DEFAULT NULL;

-- Add comment to document the column purpose
COMMENT ON COLUMN documents.metadata IS 'JSON metadata containing PDF processing information (page_count, text_quality_score, processing_duration)';

-- Create an index on the metadata column for better query performance
CREATE INDEX idx_documents_metadata ON documents USING GIN (metadata);

-- Update existing records to have empty metadata object
UPDATE documents 
SET metadata = '{}'::jsonb 
WHERE metadata IS NULL;
