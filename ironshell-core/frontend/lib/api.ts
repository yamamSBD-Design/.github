/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    IRONSHELL API CLIENT                                      ║
 * ║                                                                              ║
 * ║  Handles all communication with the FastAPI backend.                         ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import type {
  Trade,
  IngestionResult,
  AnalysisResponse,
  CorrectionInput,
  CorrectionResponse,
  FlywheelStats,
  GuardrailConfig,
} from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'An unexpected error occurred',
    }))
    throw new Error(error.message || error.detail || 'API request failed')
  }

  return response.json()
}

// ══════════════════════════════════════════════════════════════════════════════
// HEALTH & STATUS
// ══════════════════════════════════════════════════════════════════════════════

export async function checkHealth() {
  return fetchApi<{
    status: string
    components: Record<string, any>
  }>('/health')
}

export async function getFlywheelStats(): Promise<FlywheelStats> {
  return fetchApi<FlywheelStats>('/api/v1/feedback/stats?include_recent=true')
}

// ══════════════════════════════════════════════════════════════════════════════
// FILE INGESTION
// ══════════════════════════════════════════════════════════════════════════════

export async function uploadFile(
  file: File,
  userId?: string
): Promise<IngestionResult> {
  const formData = new FormData()
  formData.append('file', file)
  if (userId) {
    formData.append('user_id', userId)
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/ingest/file`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: 'Upload failed',
    }))
    throw new Error(error.detail || 'File upload failed')
  }

  return response.json()
}

export async function uploadFileWithMapping(
  file: File,
  columnMapping: Record<string, string>,
  userId?: string
): Promise<IngestionResult> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('column_mapping', JSON.stringify(columnMapping))
  if (userId) {
    formData.append('user_id', userId)
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/ingest/file/with-mapping`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: 'Upload failed',
    }))
    throw new Error(error.detail || 'File upload failed')
  }

  return response.json()
}

export async function getSupportedFormats() {
  return fetchApi<{
    supported_file_types: Array<{
      extension: string
      description: string
      notes: string
    }>
    known_broker_formats: string[]
    required_columns: string[]
    optional_columns: string[]
  }>('/api/v1/ingest/supported-formats')
}

// ══════════════════════════════════════════════════════════════════════════════
// AI ANALYSIS
// ══════════════════════════════════════════════════════════════════════════════

export async function analyzeTrade(
  trade: Trade,
  userId?: string
): Promise<AnalysisResponse> {
  return fetchApi<AnalysisResponse>('/api/v1/analysis/trade', {
    method: 'POST',
    body: JSON.stringify({
      trade,
      user_id: userId,
      include_suggestions: true,
      check_guardrails: true,
    }),
  })
}

export async function analyzeBatch(
  trades: Trade[],
  userId?: string
): Promise<AnalysisResponse[]> {
  return fetchApi<AnalysisResponse[]>('/api/v1/analysis/batch', {
    method: 'POST',
    body: JSON.stringify({
      trades,
      user_id: userId,
    }),
  })
}

export async function getGuardrails(): Promise<{
  active_guardrails: GuardrailConfig[]
  human_approval_required: boolean
  max_ai_confidence: number
}> {
  return fetchApi('/api/v1/analysis/guardrails')
}

// ══════════════════════════════════════════════════════════════════════════════
// FEEDBACK LOOP (DATA FLYWHEEL)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Save a user correction to the Data Flywheel.
 *
 * THIS IS THE CORE OF THE IRON SHELL STRATEGY.
 * Every correction makes your AI smarter and builds your competitive moat.
 */
export async function saveCorrection(
  correction: CorrectionInput
): Promise<CorrectionResponse> {
  return fetchApi<CorrectionResponse>('/api/v1/feedback/correction', {
    method: 'POST',
    body: JSON.stringify(correction),
  })
}

export async function getRecentCorrections(
  limit: number = 10,
  userId?: string
) {
  const params = new URLSearchParams({ limit: String(limit) })
  if (userId) {
    params.append('user_id', userId)
  }
  return fetchApi<{
    corrections: any[]
    count: number
  }>(`/api/v1/feedback/recent?${params}`)
}

// ══════════════════════════════════════════════════════════════════════════════
// TRADES CRUD
// ══════════════════════════════════════════════════════════════════════════════

export async function createTrade(trade: Omit<Trade, 'id'>) {
  return fetchApi<Trade>('/api/v1/trades/', {
    method: 'POST',
    body: JSON.stringify(trade),
  })
}

export async function getTrades(params?: {
  userId?: string
  symbol?: string
  limit?: number
  offset?: number
}) {
  const searchParams = new URLSearchParams()
  if (params?.userId) searchParams.append('user_id', params.userId)
  if (params?.symbol) searchParams.append('symbol', params.symbol)
  if (params?.limit) searchParams.append('limit', String(params.limit))
  if (params?.offset) searchParams.append('offset', String(params.offset))

  return fetchApi<Trade[]>(`/api/v1/trades/?${searchParams}`)
}

export async function getTradeStats(userId?: string) {
  const params = userId ? `?user_id=${userId}` : ''
  return fetchApi<{
    total_trades: number
    total_volume: number
    symbols_traded: string[]
    avg_position_size: number
    buy_count: number
    sell_count: number
  }>(`/api/v1/trades/stats/summary${params}`)
}

export async function createBulkTrades(trades: Omit<Trade, 'id'>[]) {
  return fetchApi<Trade[]>('/api/v1/trades/bulk', {
    method: 'POST',
    body: JSON.stringify(trades),
  })
}
