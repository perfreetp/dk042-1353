export const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Request failed');
  }
  return data.data;
}

interface FilterParams {
  aircraftType: string | null;
  base: string | null;
  ataChapter: string | null;
  season: string | null;
  faultCode: string | null;
  dateStart?: string;
  dateEnd?: string;
}

function buildQs(params: FilterParams & Record<string, any>): string {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== '') {
      qs.set(k, String(v));
    }
  });
  return qs.toString() ? `?${qs.toString()}` : '';
}

export const api = {
  getFaults: (params: FilterParams) => request<any[]>(`/faults${buildQs(params)}`),
  getFaultStatistics: (params: FilterParams) => request<any>(`/faults/statistics${buildQs(params)}`),
  getHeatmapData: (params: FilterParams) => request<any[]>(`/faults/heatmap${buildQs(params)}`),
  getTopFaults: (params: FilterParams, limit = 10) =>
    request<any[]>(`/faults/top${buildQs({ ...params, limit })}`),
  getRepeatAircraft: (params: FilterParams) =>
    request<any[]>(`/faults/repeat-aircraft${buildQs(params)}`),
  getCommonActions: (params: FilterParams) =>
    request<any[]>(`/faults/common-actions${buildQs(params)}`),
  getFaultDrillDown: (params: FilterParams, faultCode: string) =>
    request<any>(`/faults/drill-down${buildQs({ ...params, faultCode })}`),

  getKnowledgeEntries: () => request<any[]>('/knowledge/entries'),
  getLowSuccessRateEntries: () => request<any[]>('/knowledge/low-success-rate'),
  getQualitySummaries: () => request<any[]>('/knowledge/quality-summaries'),

  getReviewTasks: () => request<any[]>('/review/tasks'),
  getCandidateTasks: (params: FilterParams, repeatThreshold: number, timeoutThreshold: number) =>
    request<any[]>(
      `/review/candidate-tasks${buildQs({
        ...params,
        repeatThreshold,
        timeoutThreshold,
      })}`
    ),
  addCandidates: (candidates: any[]) =>
    request<any[]>('/review/add-candidates', {
      method: 'POST',
      body: JSON.stringify({ candidates }),
    }),
  assignTask: (id: string, assignee: string, dueDate: string) =>
    request<any>(`/review/tasks/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ assignee, dueDate }),
    }),
  updateTask: (id: string, updates: any) =>
    request<any>(`/review/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  getAircraftTypes: () => request<any[]>('/options/aircraft-types'),
  getBases: () => request<any[]>('/options/bases'),
  getAtaChapters: () => request<any[]>('/options/ata-chapters'),
  getSeasons: () => request<any[]>('/options/seasons'),
  getFaultCodes: () => request<any[]>('/options/fault-codes'),
  getEngineers: () => request<any[]>('/options/engineers'),
};
