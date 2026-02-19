import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'
import type { Expense, ExpenseCreateBody } from '../types'

// Query — month-scoped expense list
export function useExpensesQuery(month: string) {
  return useQuery<Expense[]>({
    queryKey: ['expenses', month],
    queryFn: () => apiClient.get<Expense[]>(`/expenses?month=${month}`),
  })
}

// Create mutation — with full TanStack Query v5 optimistic update pattern
export function useExpensesCreate(month: string) {
  const queryClient = useQueryClient()

  const createMutation = useMutation<Expense, Error, ExpenseCreateBody, { snapshot: Expense[] | undefined }>({
    mutationFn: (data) => apiClient.post<Expense>('/expenses', data),

    onMutate: async (newData) => {
      // Cancel outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: ['expenses', month] })
      const snapshot = queryClient.getQueryData<Expense[]>(['expenses', month])

      const optimisticEntry: Expense = {
        id: `optimistic-${Date.now()}`,
        amount: newData.amount,
        label: newData.label ?? null,
        expense_date: newData.expense_date,
        created_at: new Date().toISOString(),
      }

      queryClient.setQueryData<Expense[]>(['expenses', month], (old = []) => [
        optimisticEntry,
        ...old,
      ])

      return { snapshot }
    },

    onError: (_err, _vars, context) => {
      // Rollback to snapshot
      if (context?.snapshot !== undefined) {
        queryClient.setQueryData(['expenses', month], context.snapshot)
      }
    },

    onSettled: () => {
      // Always sync with server truth after mutation
      queryClient.invalidateQueries({ queryKey: ['expenses', month] })
    },
  })

  return { createMutation }
}
