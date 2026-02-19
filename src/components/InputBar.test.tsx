import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { InputBar } from './InputBar'

// Mock useMonth hook
const mockMonth = '2026-02'
vi.mock('../hooks/useMonth', () => ({
  useMonth: () => ({ month: mockMonth, setMonth: vi.fn() }),
  MonthContext: {},
  useMonthProvider: vi.fn(),
}))

// Mock useExpensesCreate hook
const mockMutate = vi.fn()
const mockCreateMutation = {
  mutate: mockMutate,
  isPending: false,
  isSuccess: false,
  isError: false,
  error: null,
}

vi.mock('../hooks/useExpenses', () => ({
  useExpensesCreate: () => ({ createMutation: mockCreateMutation }),
}))

describe('InputBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateMutation.isPending = false
    mockCreateMutation.isSuccess = false
    mockCreateMutation.isError = false
  })

  it('auto-focuses amount field on mount', () => {
    render(<InputBar />)
    const amountInput = screen.getByLabelText('amount')
    expect(document.activeElement).toBe(amountInput)
  })

  it('calls createMutation.mutate with correct payload when Enter pressed with valid amount', () => {
    const today = new Date()
    const expectedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    render(<InputBar />)
    const amountInput = screen.getByLabelText('amount')

    fireEvent.change(amountInput, { target: { value: '640' } })
    fireEvent.keyDown(amountInput, { key: 'Enter' })

    expect(mockMutate).toHaveBeenCalledWith({
      amount: '640.00',
      label: undefined,
      expense_date: expectedDate,
    })
  })

  it('does NOT call createMutation.mutate when amount is empty and Enter is pressed', () => {
    render(<InputBar />)
    const amountInput = screen.getByLabelText('amount')

    fireEvent.keyDown(amountInput, { key: 'Enter' })

    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('does NOT call createMutation.mutate when amount is "0"', () => {
    render(<InputBar />)
    const amountInput = screen.getByLabelText('amount')

    fireEvent.change(amountInput, { target: { value: '0' } })
    fireEvent.keyDown(amountInput, { key: 'Enter' })

    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('does NOT call createMutation.mutate when amount is negative', () => {
    render(<InputBar />)
    const amountInput = screen.getByLabelText('amount')

    fireEvent.change(amountInput, { target: { value: '-5' } })
    fireEvent.keyDown(amountInput, { key: 'Enter' })

    expect(mockMutate).not.toHaveBeenCalled()
  })

  it('includes label in payload when label field has content', () => {
    const today = new Date()
    const expectedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    render(<InputBar />)
    const amountInput = screen.getByLabelText('amount')
    const labelInput = screen.getByLabelText('label')

    fireEvent.change(amountInput, { target: { value: '640' } })
    fireEvent.change(labelInput, { target: { value: 'lunch' } })
    fireEvent.keyDown(amountInput, { key: 'Enter' })

    expect(mockMutate).toHaveBeenCalledWith({
      amount: '640.00',
      label: 'lunch',
      expense_date: expectedDate,
    })
  })

  it('Enter from label field triggers submit', () => {
    render(<InputBar />)
    const amountInput = screen.getByLabelText('amount')
    const labelInput = screen.getByLabelText('label')

    fireEvent.change(amountInput, { target: { value: '100' } })
    fireEvent.change(labelInput, { target: { value: 'test' } })
    fireEvent.keyDown(labelInput, { key: 'Enter' })

    expect(mockMutate).toHaveBeenCalled()
  })

  it('clears amount field when isSuccess transitions to true', async () => {
    const { rerender } = render(<InputBar />)
    const amountInput = screen.getByLabelText('amount') as HTMLInputElement

    fireEvent.change(amountInput, { target: { value: '100' } })
    expect(amountInput.value).toBe('100')

    // Simulate successful mutation
    mockCreateMutation.isSuccess = true
    rerender(<InputBar />)

    await waitFor(() => {
      expect(amountInput.value).toBe('')
    })
  })

  it('clears label field when isSuccess transitions to true', async () => {
    const { rerender } = render(<InputBar />)
    const labelInput = screen.getByLabelText('label') as HTMLInputElement

    fireEvent.change(labelInput, { target: { value: 'test' } })
    expect(labelInput.value).toBe('test')

    // Simulate successful mutation
    mockCreateMutation.isSuccess = true
    rerender(<InputBar />)

    await waitFor(() => {
      expect(labelInput.value).toBe('')
    })
  })

  it('shows "couldn\'t save, try again" when isError is true', async () => {
    const { rerender } = render(<InputBar />)

    expect(screen.queryByText("couldn't save, try again")).toBeNull()

    // Simulate error
    mockCreateMutation.isError = true
    rerender(<InputBar />)

    await waitFor(() => {
      expect(screen.getByText("couldn't save, try again")).toBeDefined()
    })
  })

  it('preserves amount field value on error (does not clear)', async () => {
    const { rerender } = render(<InputBar />)
    const amountInput = screen.getByLabelText('amount') as HTMLInputElement

    fireEvent.change(amountInput, { target: { value: '100' } })
    expect(amountInput.value).toBe('100')

    // Simulate error
    mockCreateMutation.isError = true
    rerender(<InputBar />)

    await waitFor(() => {
      expect(amountInput.value).toBe('100')
    })
  })

  it('amount input has aria-label="amount" and inputMode="decimal"', () => {
    render(<InputBar />)
    const amountInput = screen.getByLabelText('amount')

    expect(amountInput.getAttribute('aria-label')).toBe('amount')
    expect(amountInput.getAttribute('inputMode')).toBe('decimal')
  })

  it('form has role="form" and aria-label="log expense"', () => {
    render(<InputBar />)
    const form = screen.getByRole('form', { name: 'log expense' })

    expect(form).toBeDefined()
  })

  it('error div has aria-live="assertive"', async () => {
    const { rerender } = render(<InputBar />)

    // Simulate error
    mockCreateMutation.isError = true
    rerender(<InputBar />)

    await waitFor(() => {
      const errorDiv = screen.getByRole('alert')
      expect(errorDiv.getAttribute('aria-live')).toBe('assertive')
    })
  })

  it('both inputs are disabled when isPending is true', () => {
    mockCreateMutation.isPending = true

    render(<InputBar />)
    const amountInput = screen.getByLabelText('amount') as HTMLInputElement
    const labelInput = screen.getByLabelText('label') as HTMLInputElement

    expect(amountInput.disabled).toBe(true)
    expect(labelInput.disabled).toBe(true)
  })
})
