/**
 * Environment configuration for the application
 * All environment variables should be defined here with proper types
 */

export const config = {
  // Supabase Configuration
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },

  // File Upload Configuration
  upload: {
    maxFileSize: Number(import.meta.env.VITE_MAX_FILE_SIZE) || 10485760, // 10MB
    allowedFileTypes: import.meta.env.VITE_ALLOWED_FILE_TYPES || 'application/pdf',
  },

  // Application Configuration
  app: {
    name: import.meta.env.VITE_APP_NAME || 'AI Question Generator',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  },

  // Development Configuration
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
} as const

// Validate required environment variables
export const validateEnvironment = (): void => {
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ]

  const missingVars = requiredVars.filter(
    (varName) => !import.meta.env[varName]
  )

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    )
  }
}

export default config
