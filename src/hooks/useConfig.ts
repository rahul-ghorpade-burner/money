import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, isApiError } from '../lib/apiClient'
import type { UserConfig } from '../types'

export function useConfig() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['config'],
    queryFn: async () => {
      try {
        return await apiClient.get<UserConfig>('/config')
      } catch (err: unknown) {
        // 404 = no config yet; return null to signal first-time setup
        if (isApiError(err, 404)) return null
        throw err
      }
    },
  })

  const updateMutation = useMutation({
    mutationFn: (body: { monthly_income: string; savings_percentage: string }) =>
      apiClient.put<UserConfig>('/config', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config'] })
    },
  })

  return {
    config: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    updateConfig: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.isError,
  }
}
