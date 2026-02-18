import { useState } from 'react'
import { useConfig } from '../hooks/useConfig'

export function OnboardingScreen() {
  const [income, setIncome] = useState('')
  const [savings, setSavings] = useState('')
  const [saveError, setSaveError] = useState(false)
  const { updateConfig, isUpdating } = useConfig()

  const incomeNum = parseFloat(income)
  const savingsNum = parseFloat(savings)
  const isValid =
    income !== '' && savings !== '' && !isNaN(incomeNum) && !isNaN(savingsNum) &&
    incomeNum > 0 && savingsNum >= 0 && savingsNum <= 100

  const spendBudget = isValid ? incomeNum - (incomeNum * savingsNum / 100) : null
  const savingAmount = isValid ? incomeNum * savingsNum / 100 : null

  const handleConfirm = () => {
    if (!isValid) return  // silent prevention

    updateConfig(
      {
        monthly_income: incomeNum.toFixed(2),
        savings_percentage: savingsNum.toFixed(2),
      },
      {
        onError: () => setSaveError(true),
        onSuccess: () => setSaveError(false),
      }
    )
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-bg text-text font-mono">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <h1 className="text-2xl lowercase font-bold tracking-tight">money</h1>

        <div className="flex flex-col gap-6">
          {/* Monthly income */}
          <div className="flex flex-col gap-2">
            <label htmlFor="income" className="text-body lowercase">monthly income</label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-text-muted">₹</span>
              <input
                id="income"
                type="number"
                inputMode="decimal"
                value={income}
                onChange={(e) => { setIncome(e.target.value); setSaveError(false) }}
                onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                className="w-full bg-surface p-3 pl-8 text-large outline-none"
              />
            </div>
          </div>

          {/* Savings percentage */}
          <div className="flex flex-col gap-2">
            <label htmlFor="savings" className="text-body lowercase">save</label>
            <div className="relative flex items-center">
              <input
                id="savings"
                type="number"
                inputMode="decimal"
                value={savings}
                onChange={(e) => { setSavings(e.target.value); setSaveError(false) }}
                onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                className="w-full bg-surface p-3 pr-8 text-large outline-none"
              />
              <span className="absolute right-3 text-text-muted">%</span>
            </div>
          </div>

          {/* Live preview */}
          <div className="min-h-[2.5rem]">
            {isValid && spendBudget !== null && (
              <p aria-live="polite" className="text-small text-text-muted lowercase">
                spend budget: ₹{spendBudget.toLocaleString('en-IN')}/month
                {' · '}saving ₹{savingAmount?.toLocaleString('en-IN')}/month
              </p>
            )}
          </div>

          {/* Confirm */}
          <div className="flex flex-col gap-4">
            <button
              onClick={handleConfirm}
              disabled={isUpdating}
              aria-label="confirm budget setup"
              className="w-full bg-text text-bg p-3 text-lg lowercase active:opacity-80 disabled:opacity-50 transition-opacity"
            >
              {isUpdating ? 'saving...' : 'confirm'}
            </button>

            {/* Error */}
            {saveError && (
              <p aria-live="assertive" className="text-center text-small text-error lowercase">
                couldn't save, try again
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
