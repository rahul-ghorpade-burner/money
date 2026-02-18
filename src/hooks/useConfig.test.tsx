import { renderHook, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useConfig } from './useConfig'
import { apiClient } from '../lib/apiClient'
import React from 'react'

vi.mock('../lib/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
  },
  isApiError: vi.fn((err: any, status: number) => err.status === status),
}))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)

describe('useConfig', () => {
  beforeEach(() => {
    queryClient.clear()
    vi.clearAllMocks()
  })

  it('returns null when GET /api/config returns 404', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce({ status: 404 })

    const { result } = renderHook(() => useConfig(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.config).toBeNull()
  })

  it('returns config object when GET /api/config returns 200', async () => {
    const mockConfig = { monthly_income: '80000.00', savings_percentage: '20.00' }
    vi.mocked(apiClient.get).mockResolvedValueOnce(mockConfig)

    const { result } = renderHook(() => useConfig(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.config).toEqual(mockConfig)
  })

  it('updateConfig calls PUT /api/config with correct body', async () => {
    const body = { monthly_income: '90000.00', savings_percentage: '25.00' }
    vi.mocked(apiClient.put).mockResolvedValueOnce({ ...body, updated_at: '2026-02-18T00:00:00Z' })

    const { result } = renderHook(() => useConfig(), { wrapper })

    result.current.updateConfig(body)

    await waitFor(() => expect(apiClient.put).toHaveBeenCalledWith('/api/config', body))
  })
})
