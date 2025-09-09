import { StrictMode } from 'react'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from '@/routes/AppRoutes'
import { ErrorBoundary } from '@/components/ErrorBoundary'

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
