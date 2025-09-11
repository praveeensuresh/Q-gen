import { StrictMode } from 'react'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from '@/routes/AppRoutes'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { validateEnvironment } from '@/config/env'

// Validate environment variables on app startup
try {
  validateEnvironment()
} catch (error) {
  console.error('Environment validation failed:', error)
  // You might want to show an error page here
}

function App() {
  return (
    <StrictMode>
      <ErrorBoundary>
        <ThemeProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ThemeProvider>
      </ErrorBoundary>
    </StrictMode>
  )
}

export default App
