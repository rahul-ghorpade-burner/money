import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { OnboardingScreen } from './OnboardingScreen'
import { useConfig } from '../hooks/useConfig'

vi.mock('../hooks/useConfig', () => ({
  useConfig: vi.fn(),
}))

describe('OnboardingScreen', () => {
  const mockUpdateConfig = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useConfig).mockReturnValue({
      config: null,
      isLoading: false,
      isError: false,
      updateConfig: mockUpdateConfig,
      isUpdating: false,
      updateError: false,
    } as any)
  })

  it('renders income and savings fields', () => {
    render(<OnboardingScreen />)
    expect(screen.getByLabelText(/monthly income/i)).toBeDefined()
    expect(screen.getByLabelText(/save/i)).toBeDefined()
    expect(screen.getByRole('button', { name: /confirm/i })).toBeDefined()
  })

  it('shows live preview when both fields have valid values', async () => {
    render(<OnboardingScreen />)
    const incomeInput = screen.getByLabelText(/monthly income/i)
    const savingsInput = screen.getByLabelText(/save/i)

    fireEvent.change(incomeInput, { target: { value: '100000' } })
    fireEvent.change(savingsInput, { target: { value: '20' } })

    expect(screen.getByText(/spend budget: ₹80,000\/month/i)).toBeDefined()
    expect(screen.getByText(/saving ₹20,000\/month/i)).toBeDefined()
  })

  it('updates preview calculation as values change', () => {
    render(<OnboardingScreen />)
    const incomeInput = screen.getByLabelText(/monthly income/i)
    const savingsInput = screen.getByLabelText(/save/i)

    fireEvent.change(incomeInput, { target: { value: '100000' } })
    fireEvent.change(savingsInput, { target: { value: '20' } })
    expect(screen.getByText(/spend budget: ₹80,000\/month/i)).toBeDefined()

    fireEvent.change(savingsInput, { target: { value: '30' } })
    expect(screen.getByText(/spend budget: ₹70,000\/month/i)).toBeDefined()
  })

  it('does not call PUT /api/config when income field is empty', () => {
    render(<OnboardingScreen />)
    const savingsInput = screen.getByLabelText(/save/i)
    const confirmButton = screen.getByRole('button', { name: /confirm/i })

    fireEvent.change(savingsInput, { target: { value: '20' } })
    fireEvent.click(confirmButton)

    expect(mockUpdateConfig).not.toHaveBeenCalled()
  })

  it('calls updateConfig with two-decimal numeric strings when both fields are valid', () => {
    render(<OnboardingScreen />)
    const incomeInput = screen.getByLabelText(/monthly income/i)
    const savingsInput = screen.getByLabelText(/save/i)
    const confirmButton = screen.getByRole('button', { name: /confirm/i })

    fireEvent.change(incomeInput, { target: { value: '80000' } })
    fireEvent.change(savingsInput, { target: { value: '20' } })
    fireEvent.click(confirmButton)

    expect(mockUpdateConfig).toHaveBeenCalledWith(
      {
        monthly_income: '80000.00',
        savings_percentage: '20.00',
      },
      expect.any(Object)
    )
  })

  it("shows couldn't save error on API error", async () => {
    // We need to trigger the onError callback passed to updateConfig
    mockUpdateConfig.mockImplementation((_data, options) => {
      options.onError()
    })

    render(<OnboardingScreen />)
    const incomeInput = screen.getByLabelText(/monthly income/i)
    const savingsInput = screen.getByLabelText(/save/i)
    const confirmButton = screen.getByRole('button', { name: /confirm/i })

    fireEvent.change(incomeInput, { target: { value: '80000' } })
    fireEvent.change(savingsInput, { target: { value: '20' } })
    fireEvent.click(confirmButton)

    expect(screen.getByText(/couldn't save, try again/i)).toBeDefined()
  })
})
