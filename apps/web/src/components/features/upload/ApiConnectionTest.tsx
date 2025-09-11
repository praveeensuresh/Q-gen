/**
 * API Connection Test Component
 * Tests connections to Supabase, Vercel Blob Storage, and OpenAI API
 * Focused on stories 1.1 and 1.2 scope
 */

import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  Divider,
} from '@mui/material'
import {
  CheckCircle,
  Error,
  Warning,
  Refresh,
} from '@mui/icons-material'
import { supabase } from '@/lib/supabase'
import { vercelBlobService } from '@/lib/vercel-blob'
import { config } from '@/config/env'

interface ConnectionStatus {
  service: string
  status: 'testing' | 'success' | 'error' | 'warning'
  message: string
  details?: string
}

export const ApiConnectionTest: React.FC = () => {
  const [connectionStatuses, setConnectionStatuses] = useState<ConnectionStatus[]>([])
  const [isTesting, setIsTesting] = useState(false)
  const [overallStatus, setOverallStatus] = useState<'idle' | 'testing' | 'success' | 'error' | 'warning'>('idle')

  const testSupabaseConnection = async (): Promise<ConnectionStatus> => {
    try {
      // Test Supabase connection by trying to access documents table
      const { error } = await supabase
        .from('documents')
        .select('id')
        .limit(1)

      if (error) {
        // Check for specific error types
        if ((error as any).message?.includes('401') || (error as any).message?.includes('Unauthorized')) {
          return {
            service: 'Supabase Database',
            status: 'error',
            message: 'Authentication failed',
            details: 'Invalid Supabase credentials or RLS policies blocking access. Check your environment variables and database setup.'
          }
        }
        
        if ((error as any).message?.includes('relation "documents" does not exist') || (error as any).code === 'PGRST116') {
          return {
            service: 'Supabase Database',
            status: 'error',
            message: 'Database schema missing',
            details: 'The documents table does not exist. Please run the SQL setup script in your Supabase dashboard.'
          }
        }
        
        return {
          service: 'Supabase Database',
          status: 'error',
          message: 'Connection failed',
          details: (error as any).message || 'Unable to connect to Supabase'
        }
      }

      return {
        service: 'Supabase Database',
        status: 'success',
        message: 'Connected successfully',
        details: 'Database connection and authentication working'
      }
    } catch (error: any) {
      return {
        service: 'Supabase Database',
        status: 'error',
        message: 'Connection failed',
        details: error?.message || 'Unknown error occurred'
      }
    }
  }

  const testVercelBlobConnection = async (): Promise<ConnectionStatus> => {
    try {
      // Test Vercel Blob connection using the proper test method
      const result = await vercelBlobService.instance.testConnection()
      
      return {
        service: 'Vercel Blob Storage',
        status: result.success ? 'success' : 'error',
        message: result.success ? 'Connected successfully' : 'Connection failed',
        details: result.message
      }
    } catch (error: any) {
      return {
        service: 'Vercel Blob Storage',
        status: 'error',
        message: 'Connection failed',
        details: error?.message || 'Unknown error occurred'
      }
    }
  }

  const testOpenAIConnection = async (): Promise<ConnectionStatus> => {
    try {
      // Test OpenAI API with a simple completion request
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.openai.apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        return {
          service: 'OpenAI API',
          status: 'success',
          message: 'Connected successfully',
          details: 'API key is valid and service is accessible'
        }
      } else if (response.status === 401) {
        return {
          service: 'OpenAI API',
          status: 'error',
          message: 'Authentication failed',
          details: 'Invalid or missing OpenAI API key'
        }
      } else {
        return {
          service: 'OpenAI API',
          status: 'warning',
          message: 'Connection issue',
          details: `HTTP ${response.status}: ${response.statusText}`
        }
      }
    } catch (error: any) {
      return {
        service: 'OpenAI API',
        status: 'error',
        message: 'Connection failed',
        details: error?.message || 'Unable to connect to OpenAI API'
      }
    }
  }

  const testAllConnections = async () => {
    setIsTesting(true)
    setOverallStatus('testing')
    setConnectionStatuses([])

    const tests = [
      testSupabaseConnection(),
      testVercelBlobConnection(),
      testOpenAIConnection(),
    ]

    try {
      const results = await Promise.all(tests)
      setConnectionStatuses(results)

      // Determine overall status
      const hasErrors = results.some(r => r.status === 'error')
      const hasWarnings = results.some(r => r.status === 'warning')
      
      if (hasErrors) {
        setOverallStatus('error')
      } else if (hasWarnings) {
        setOverallStatus('warning')
      } else {
        setOverallStatus('success')
      }
    } catch (error: any) {
      setOverallStatus('error')
      setConnectionStatuses([{
        service: 'Test Suite',
        status: 'error',
        message: 'Test execution failed',
        details: (error as any)?.message || 'Unknown error'
      }])
    } finally {
      setIsTesting(false)
    }
  }

  const getStatusIcon = (status: ConnectionStatus['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle color="success" />
      case 'error':
        return <Error color="error" />
      case 'warning':
        return <Warning color="warning" />
      case 'testing':
        return <CircularProgress size={20} />
      default:
        return null
    }
  }

  const getStatusColor = (status: ConnectionStatus['status']) => {
    switch (status) {
      case 'success':
        return 'success'
      case 'error':
        return 'error'
      case 'warning':
        return 'warning'
      case 'testing':
        return 'info'
      default:
        return 'default'
    }
  }

  const getOverallAlertSeverity = () => {
    switch (overallStatus) {
      case 'success':
        return 'success'
      case 'error':
        return 'error'
      case 'warning':
        return 'warning'
      case 'testing':
        return 'info'
      default:
        return 'info'
    }
  }

  const getOverallMessage = () => {
    switch (overallStatus) {
      case 'success':
        return 'All API connections are working correctly!'
      case 'error':
        return 'Some API connections failed. Please check your configuration.'
      case 'warning':
        return 'API connections are working with some warnings.'
      case 'testing':
        return 'Testing API connections...'
      default:
        return 'Click "Test Connections" to verify your API setup.'
    }
  }

  // Check if environment variables are configured
  const missingEnvVars = []
  if (!config.supabase.url) missingEnvVars.push('VITE_SUPABASE_URL')
  if (!config.supabase.anonKey) missingEnvVars.push('VITE_SUPABASE_ANON_KEY')
  if (!config.blobStorage.token) missingEnvVars.push('VITE_VERCEL_BLOB_READ_WRITE_TOKEN')
  if (!config.openai.apiKey) missingEnvVars.push('VITE_OPENAI_API_KEY')

  return (
    <Card sx={{ maxWidth: 800, mx: 'auto', mt: 2 }}>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          API Connection Test
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          This tool tests the connections to Supabase, Vercel Blob Storage, and OpenAI API.
          Make sure you have added your API keys to the .env.local file.
        </Typography>

        {missingEnvVars.length > 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Missing Environment Variables:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {missingEnvVars.map((varName) => (
                <Chip key={varName} label={varName} size="small" color="warning" />
              ))}
            </Stack>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Please add these variables to your .env.local file and restart the development server.
            </Typography>
          </Alert>
        )}

        <Alert severity={getOverallAlertSeverity()} sx={{ mb: 3 }}>
          {getOverallMessage()}
        </Alert>

        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            startIcon={isTesting ? <CircularProgress size={20} /> : <Refresh />}
            onClick={testAllConnections}
            disabled={isTesting || missingEnvVars.length > 0}
            fullWidth
          >
            {isTesting ? 'Testing Connections...' : 'Test All Connections'}
          </Button>
        </Box>

        {connectionStatuses.length > 0 && (
          <>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Connection Results
            </Typography>
            
            <Stack spacing={2}>
              {connectionStatuses.map((status, index) => (
                <Card key={index} variant="outlined">
                  <CardContent sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {getStatusIcon(status.status)}
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" component="div">
                          {status.service}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {status.message}
                        </Typography>
                        {status.details && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            {status.details}
                          </Typography>
                        )}
                      </Box>
                      <Chip
                        label={status.status}
                        color={getStatusColor(status.status)}
                        size="small"
                      />
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </>
        )}

        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Required Environment Variables:
          </Typography>
          <Typography variant="body2" component="div">
            <code>
              VITE_SUPABASE_URL=your_supabase_url_here<br />
              VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here<br />
              VITE_VERCEL_BLOB_READ_WRITE_TOKEN=your_vercel_blob_token_here<br />
              VITE_OPENAI_API_KEY=your_openai_api_key_here
            </code>
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

export default ApiConnectionTest
