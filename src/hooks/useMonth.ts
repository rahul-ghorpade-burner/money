import { createContext, useContext, useState } from 'react'

function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

type MonthContextValue = { month: string; setMonth: (m: string) => void }

export const MonthContext = createContext<MonthContextValue>({
  month: getCurrentMonth(),
  setMonth: () => {},
})

export function useMonthProvider(): MonthContextValue {
  const [month, setMonth] = useState(getCurrentMonth)
  return { month, setMonth }
}

export function useMonth(): MonthContextValue {
  return useContext(MonthContext)
}
