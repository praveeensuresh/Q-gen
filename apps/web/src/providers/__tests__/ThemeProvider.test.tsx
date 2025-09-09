// No React import needed for this test
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ThemeProvider, useTheme } from '../ThemeProvider'

// Test component that uses the theme context
const TestComponent = () => {
  const { mode, toggleMode, setMode } = useTheme()
  
  return (
    <div>
      <div data-testid="current-mode">{mode}</div>
      <button data-testid="toggle-mode" onClick={toggleMode}>
        Toggle Mode
      </button>
      <button data-testid="set-light" onClick={() => setMode('light')}>
        Set Light
      </button>
      <button data-testid="set-dark" onClick={() => setMode('dark')}>
        Set Dark
      </button>
    </div>
  )
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  it('provides light theme by default', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )
    
    expect(screen.getByTestId('current-mode')).toHaveTextContent('light')
  })

  it('toggles theme mode', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )
    
    expect(screen.getByTestId('current-mode')).toHaveTextContent('light')
    
    fireEvent.click(screen.getByTestId('toggle-mode'))
    
    expect(screen.getByTestId('current-mode')).toHaveTextContent('dark')
  })

  it('sets specific theme mode', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )
    
    fireEvent.click(screen.getByTestId('set-dark'))
    expect(screen.getByTestId('current-mode')).toHaveTextContent('dark')
    
    fireEvent.click(screen.getByTestId('set-light'))
    expect(screen.getByTestId('current-mode')).toHaveTextContent('light')
  })

  it('persists theme mode in localStorage', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )
    
    fireEvent.click(screen.getByTestId('set-dark'))
    expect(localStorage.getItem('theme-mode')).toBe('dark')
    
    fireEvent.click(screen.getByTestId('set-light'))
    expect(localStorage.getItem('theme-mode')).toBe('light')
  })

  it('loads theme mode from localStorage on mount', () => {
    localStorage.setItem('theme-mode', 'dark')
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )
    
    expect(screen.getByTestId('current-mode')).toHaveTextContent('dark')
  })

  it('throws error when useTheme is used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useTheme must be used within a ThemeProvider')
    
    consoleSpy.mockRestore()
  })
})
