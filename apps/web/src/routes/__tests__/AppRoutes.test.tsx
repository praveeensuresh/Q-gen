// No React import needed for this test
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import { AppRoutes } from '../AppRoutes'

// Mock the pages to avoid loading them
vi.mock('@/pages/UploadPage', () => ({
  default: () => <div>Upload Page</div>,
}))

vi.mock('@/pages/ProcessingPage', () => ({
  default: () => <div>Processing Page</div>,
}))

vi.mock('@/pages/PreviewPage', () => ({
  default: () => <div>Preview Page</div>,
}))

vi.mock('@/pages/ExportPage', () => ({
  default: () => <div>Export Page</div>,
}))

vi.mock('@/pages/NotFoundPage', () => ({
  default: () => <div>Not Found Page</div>,
}))

vi.mock('@/components/layout/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div data-testid="layout">{children}</div>,
}))

const renderWithRouter = (initialRoute = '/') => {
  window.history.pushState({}, 'Test page', initialRoute)
  return render(
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

describe('AppRoutes', () => {
  it('renders layout component', () => {
    renderWithRouter()
    expect(screen.getByTestId('layout')).toBeInTheDocument()
  })

  it('renders upload page for root route', async () => {
    renderWithRouter('/')
    await waitFor(() => {
      expect(screen.getByText('Upload Page')).toBeInTheDocument()
    })
  })

  it('renders upload page for /upload route', async () => {
    renderWithRouter('/upload')
    await waitFor(() => {
      expect(screen.getByText('Upload Page')).toBeInTheDocument()
    })
  })

  it('renders processing page for /processing route', async () => {
    renderWithRouter('/processing')
    await waitFor(() => {
      expect(screen.getByText('Processing Page')).toBeInTheDocument()
    })
  })

  it('renders preview page for /preview route', async () => {
    renderWithRouter('/preview')
    await waitFor(() => {
      expect(screen.getByText('Preview Page')).toBeInTheDocument()
    })
  })

  it('renders export page for /export route', async () => {
    renderWithRouter('/export')
    await waitFor(() => {
      expect(screen.getByText('Export Page')).toBeInTheDocument()
    })
  })

  it('renders not found page for unknown route', () => {
    renderWithRouter('/unknown-route')
    expect(screen.getByText('Not Found Page')).toBeInTheDocument()
  })
})
