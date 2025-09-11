/**
 * Supabase client configuration
 * Handles database connection and authentication
 */

import { createClient } from '@supabase/supabase-js'
import { config } from '@/config/env'

// Validate environment variables
// config.validateEnvironment?.()

// Create Supabase client
export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
)

// Database types for simplified demo schema
export type Database = {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string
          filename: string
          file_path: string
          file_size: number
          upload_status: string
          extracted_text: string | null
          text_length: number | null
          processing_progress: number
          error_message: string | null
          metadata: {
            page_count?: number
            text_quality_score?: number
            processing_duration?: number
          } | null
          created_at: string
          processed_at: string | null
        }
        Insert: {
          id?: string
          filename: string
          file_path: string
          file_size: number
          upload_status?: string
          extracted_text?: string | null
          text_length?: number | null
          processing_progress?: number
          error_message?: string | null
          metadata?: {
            page_count?: number
            text_quality_score?: number
            processing_duration?: number
          } | null
          created_at?: string
          processed_at?: string | null
        }
        Update: {
          id?: string
          filename?: string
          file_path?: string
          file_size?: number
          upload_status?: string
          extracted_text?: string | null
          text_length?: number | null
          processing_progress?: number
          error_message?: string | null
          metadata?: {
            page_count?: number
            text_quality_score?: number
            processing_duration?: number
          } | null
          created_at?: string
          processed_at?: string | null
        }
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
