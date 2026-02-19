import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { SettingsScreen } from './SettingsScreen'
import { useConfig } from '../hooks/useConfig'

// Mock react-router
const mockNavigate = vi.fn()
vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}))

// Mock useConfig
vi.mock('../hooks/useConfig', () => ({
  useConfig: vi.fn(),
}))

// Mock radix-ui Switch
vi.mock('radix-ui', () => ({
  Switch: {
    Root: ({ checked, onCheckedChange, children, id, 'aria-label': ariaLabel }: any) => (
      <button
        role="switch"
        id={id}
        aria-label={ariaLabel}
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        data-state={checked ? 'checked' : 'unchecked'}
      >
        {children}
      </button>
    ),
    Thumb: () => <span />,
  },
}))

// localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('SettingsScreen', () => {
  const mockUpdateConfig = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    vi.mocked(useConfig).mockReturnValue({
      config: { monthly_income: '80000.00', savings_percentage: '20.00' },
      isLoading: false,
      isError: false,
      updateConfig: mockUpdateConfig,
      isUpdating: false,
      updateError: false,
    } as any)
  })

  it('renders income and savings fields pre-populated from config values', () => {
    render(<SettingsScreen />)
    const incomeField = screen.getByLabelText(/monthly income/i) as HTMLInputElement
    const savingsField = screen.getByLabelText(/savings/i) as HTMLInputElement
    expect(incomeField.value).toBe('80000')
    expect(savingsField.value).toBe('20')
  })

  it('renders spend budget read-only field with correct initial calculation', () => {
    render(<SettingsScreen />)
    // income 80000, savings 20% → spend budget = 80000 - 16000 = 64000
    expect(screen.getByText(/spend budget/i)).toBeDefined()
    expect(screen.getByText(/₹64,000\/month/i)).toBeDefined()
  })

  it('updates spend budget live when income changes without making API call', () => {
    render(<SettingsScreen />)
    const incomeField = screen.getByLabelText(/monthly income/i)
    fireEvent.change(incomeField, { target: { value: '100000' } })
    // 100000 - (100000 * 20 / 100) = 80000
    expect(screen.getByText(/₹80,000\/month/i)).toBeDefined()
    expect(mockUpdateConfig).not.toHaveBeenCalled()
  })

  it('updates spend budget live when savings changes without making API call', () => {
    render(<SettingsScreen />)
    const savingsField = screen.getByLabelText(/savings/i)
    fireEvent.change(savingsField, { target: { value: '10' } })
    // 80000 - (80000 * 10 / 100) = 72000
    expect(screen.getByText(/₹72,000\/month/i)).toBeDefined()
    expect(mockUpdateConfig).not.toHaveBeenCalled()
  })

  it('does NOT call PUT /api/config when navigating back with unchanged values', () => {
    render(<SettingsScreen />)
    const backButton = screen.getByRole('button', { name: /back to money/i })
    fireEvent.click(backButton)
    expect(mockUpdateConfig).not.toHaveBeenCalled()
  })

  it('calls PUT /api/config with updated values when navigating back after change', () => {
    render(<SettingsScreen />)
    const incomeField = screen.getByLabelText(/monthly income/i)
    fireEvent.change(incomeField, { target: { value: '90000' } })
    const backButton = screen.getByRole('button', { name: /back to money/i })
    fireEvent.click(backButton)
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      { monthly_income: '90000.00', savings_percentage: '20.00' },
      expect.any(Object)
    )
  })

  it('calls PUT /api/config with two-decimal numeric strings (income.toFixed(2))', () => {
    render(<SettingsScreen />)
    const incomeField = screen.getByLabelText(/monthly income/i)
    const savingsField = screen.getByLabelText(/savings/i)
    fireEvent.change(incomeField, { target: { value: '75000' } })
    fireEvent.change(savingsField, { target: { value: '15' } })
    const backButton = screen.getByRole('button', { name: /back to money/i })
    fireEvent.click(backButton)
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      { monthly_income: '75000.00', savings_percentage: '15.00' },
      expect.any(Object)
    )
  })

  it('navigates to "/" immediately on back when no changes made', () => {
    render(<SettingsScreen />)
    const backButton = screen.getByRole('button', { name: /back to money/i })
    fireEvent.click(backButton)
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('navigates to "/" after successful PUT /api/config save', () => {
    mockUpdateConfig.mockImplementation((_data: any, options: any) => {
      options.onSuccess()
    })
    render(<SettingsScreen />)
    const incomeField = screen.getByLabelText(/monthly income/i)
    fireEvent.change(incomeField, { target: { value: '90000' } })
    const backButton = screen.getByRole('button', { name: /back to money/i })
    fireEvent.click(backButton)
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('navigates to "/" even when PUT /api/config returns an error', () => {
    mockUpdateConfig.mockImplementation((_data: any, options: any) => {
      options.onError()
    })
    render(<SettingsScreen />)
    const incomeField = screen.getByLabelText(/monthly income/i)
    fireEvent.change(incomeField, { target: { value: '90000' } })
    const backButton = screen.getByRole('button', { name: /back to money/i })
    fireEvent.click(backButton)
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('entry mode toggle writes "advanced" to localStorage when turned ON', () => {
    render(<SettingsScreen />)
    const toggle = screen.getByRole('switch', { name: /enable date and time fields for entry/i })
    fireEvent.click(toggle)
    expect(localStorageMock.getItem('entryMode')).toBe('advanced')
  })

  it('entry mode toggle writes "simple" to localStorage when turned OFF', () => {
    localStorageMock.setItem('entryMode', 'advanced')
    render(<SettingsScreen />)
    const toggle = screen.getByRole('switch', { name: /enable date and time fields for entry/i })
    fireEvent.click(toggle) // turns OFF (was advanced → simple)
    expect(localStorageMock.getItem('entryMode')).toBe('simple')
  })

  it('reads initial entry mode state from localStorage on mount (advanced)', () => {
    localStorageMock.setItem('entryMode', 'advanced')
    render(<SettingsScreen />)
    const toggle = screen.getByRole('switch', { name: /enable date and time fields for entry/i })
    expect(toggle.getAttribute('aria-checked')).toBe('true')
  })

  it('reads initial entry mode state from localStorage on mount (simple/default)', () => {
    localStorageMock.setItem('entryMode', 'simple')
    render(<SettingsScreen />)
    const toggle = screen.getByRole('switch', { name: /enable date and time fields for entry/i })
    expect(toggle.getAttribute('aria-checked')).toBe('false')
  })

  it('toggle is unchecked by default when no localStorage value present', () => {
    render(<SettingsScreen />)
    const toggle = screen.getByRole('switch', { name: /enable date and time fields for entry/i })
    expect(toggle.getAttribute('aria-checked')).toBe('false')
  })
})
