import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Switch } from 'radix-ui'
import { useConfig } from '../hooks/useConfig'

export function SettingsScreen() {
  const navigate = useNavigate()
  const { config, isLoading, updateConfig, isUpdating } = useConfig()

  const [income, setIncome] = useState('')
  const [savings, setSavings] = useState('')
  const [entryMode, setEntryMode] = useState<'simple' | 'advanced'>('simple')

  // Initialize fields from loaded config (runs once when config resolves)
  useEffect(() => {
    if (config) {
      setIncome(String(parseFloat(config.monthly_income)))
      setSavings(String(parseFloat(config.savings_percentage)))
    }
  }, [config])

  // Initialize entry mode from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('entryMode')
    setEntryMode(stored === 'advanced' ? 'advanced' : 'simple')
  }, [])

  const incomeNum = parseFloat(income)
  const savingsNum = parseFloat(savings)
  const isValid =
    income !== '' && savings !== '' &&
    !isNaN(incomeNum) && !isNaN(savingsNum) &&
    incomeNum > 0 && savingsNum >= 0 && savingsNum <= 100

  const spendBudget = isValid ? incomeNum - (incomeNum * savingsNum / 100) : null

  // Dirty check: compare form values vs original loaded config values
  const isDirty = config !== null && isValid && (
    income !== String(parseFloat(config.monthly_income)) ||
    savings !== String(parseFloat(config.savings_percentage))
  )

  const handleBack = () => {
    if (isDirty) {
      updateConfig(
        {
          monthly_income: incomeNum.toFixed(2),
          savings_percentage: savingsNum.toFixed(2),
        },
        {
          onSuccess: () => navigate('/'),
          onError: () => navigate('/'), // Navigate back even on error
        }
      )
    } else {
      navigate('/')
    }
  }

  const handleToggleEntryMode = (checked: boolean) => {
    const mode = checked ? 'advanced' : 'simple'
    setEntryMode(mode)
    localStorage.setItem('entryMode', mode)
  }

  if (isLoading) return null

  return (
    <main className="min-h-dvh bg-bg text-text font-mono p-4 flex flex-col gap-8">
      <button
        onClick={handleBack}
        aria-label="back to money"
        disabled={isUpdating}
        className="self-start text-small text-text-muted hover:text-text lowercase disabled:opacity-50"
      >
        ← back to money
      </button>

      <section aria-labelledby="budget-heading" className="flex flex-col gap-4">
        <h2 id="budget-heading" className="text-small text-text-muted uppercase tracking-widest">BUDGET</h2>

        <div className="flex flex-col gap-2">
          <label htmlFor="income" className="text-body lowercase">monthly income</label>
          <div className="relative flex items-center">
            <span aria-hidden="true" className="absolute left-3 text-text-muted">₹</span>
            <input
              id="income"
              type="number"
              inputMode="decimal"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              className="w-full bg-surface p-3 pl-8 text-large outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="savings" className="text-body lowercase">savings</label>
          <div className="relative flex items-center">
            <input
              id="savings"
              type="number"
              inputMode="decimal"
              value={savings}
              onChange={(e) => setSavings(e.target.value)}
              className="w-full bg-surface p-3 pr-8 text-large outline-none"
            />
            <span aria-hidden="true" className="absolute right-3 text-text-muted">%</span>
          </div>
        </div>

        {isValid && spendBudget !== null && (
          <div aria-live="polite" className="flex justify-between text-body text-text-muted lowercase">
            <span>spend budget</span>
            <span>₹{spendBudget.toLocaleString('en-IN')}/month</span>
          </div>
        )}
      </section>

      <section aria-labelledby="entry-mode-heading" className="flex flex-col gap-4">
        <h2 id="entry-mode-heading" className="text-small text-text-muted uppercase tracking-widest">ENTRY MODE</h2>
        <div className="flex items-center justify-between">
          <label htmlFor="entry-mode-toggle" className="text-body lowercase">date + time fields</label>
          <Switch.Root
            id="entry-mode-toggle"
            checked={entryMode === 'advanced'}
            onCheckedChange={handleToggleEntryMode}
            aria-label="enable date and time fields for entry"
            className="relative inline-flex h-6 w-11 items-center rounded-full bg-surface data-[state=checked]:bg-text transition-colors"
          >
            <Switch.Thumb className="block h-4 w-4 rounded-full bg-bg shadow-sm transition-transform translate-x-1 data-[state=checked]:translate-x-6" />
          </Switch.Root>
        </div>
        <p className="text-small text-text-muted lowercase">When on: log entries with a specific date and time</p>
      </section>
    </main>
  )
}
