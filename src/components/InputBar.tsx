import { useEffect, useRef, useState } from 'react'
import { useExpensesCreate } from '../hooks/useExpenses'
import { useMonth } from '../hooks/useMonth'

export function InputBar() {
  const { month } = useMonth()
  const { createMutation } = useExpensesCreate(month)

  const amountRef = useRef<HTMLInputElement>(null)
  const [amount, setAmount] = useState('')
  const [label, setLabel] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Auto-focus on mount — NEVER use autoFocus attribute (unreliable on PWA re-open)
  useEffect(() => {
    amountRef.current?.focus()
  }, [])

  // Clear fields and re-focus after successful submission
  useEffect(() => {
    if (createMutation.isSuccess) {
      setAmount('')
      setLabel('')
      setErrorMessage('')
      amountRef.current?.focus()
    }
  }, [createMutation.isSuccess])

  // Show inline error message on failure — amount text is preserved via local state
  useEffect(() => {
    if (createMutation.isError) {
      setErrorMessage("couldn't save, try again")
    }
  }, [createMutation.isError])

  const handleSubmit = () => {
    const trimmed = amount.trim()
    // Silent prevention — empty or non-positive amount does nothing
    if (!trimmed || parseFloat(trimmed) <= 0) return

    const today = new Date()
    const expense_date = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-')

    setErrorMessage('')
    createMutation.mutate({
      amount: parseFloat(trimmed).toFixed(2),
      label: label.trim() || undefined,
      expense_date,
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <form
      role="form"
      aria-label="log expense"
      onSubmit={(e) => { e.preventDefault(); handleSubmit() }}
      className="flex flex-col gap-2 p-4 border-t border-border bg-surface"
    >
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="text-text-muted">₹</span>
        <input
          ref={amountRef}
          type="number"
          inputMode="decimal"
          aria-label="amount"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={createMutation.isPending}
          className="w-24 bg-surface p-2 text-body outline-none border-none"
        />
        <input
          type="text"
          aria-label="label"
          placeholder="what was it?"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={createMutation.isPending}
          maxLength={200}
          className="flex-1 bg-surface p-2 text-body outline-none border-none lowercase"
        />
        <span aria-hidden="true" className="text-text-muted">↵</span>
      </div>
      {errorMessage && (
        <div aria-live="assertive" role="alert" className="text-small text-error lowercase">
          {errorMessage}
        </div>
      )}
    </form>
  )
}
