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

export const api = {
  getFaults: (params: Record<string, string | null>) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v); });
    return request<any[]>(`/faults${qs.toString() ? `?${qs.toString()}` : ''}`);
  },
  getFaultStatistics: (params: Record<string, string | null>) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v); });
    return request<any>(`/faults/statistics${qs.toString() ? `?${qs.toString()}` : ''}`);
  },
  getHeatmapData: (params: Record<string, string | null>) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v); });
    return request<any[]>(`/faults/heatmap${qs.toString() ? `?${qs.toString()}` : ''}`);
  },
  getTopFaults: (params: Record<string, string | null>) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v); });
    return request<any[]>(`/faults/top${qs.toString() ? `?${qs.toString()}` : ''}`);
  },
  getRepeatAircraft: (params: Record<string, string | null>) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v); });
    return request<any[]>(`/faults/repeat-aircraft${qs.toString() ? `?${qs.toString()}` : ''}`);
  },
  getCommonActions: (params: Record<string, string | null>) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v); });
    return request<any[]>(`/faults/common-actions${qs.toString() ? `?${qs.toString()}` : ''}`);
  },
  getKnowledgeEntries: () => request<any[]>('/knowledge/entries'),
  getLowSuccessRateEntries: () => request<any[]>('/knowledge/low-success-rate'),
  getQualityIssues: () => request<any[]>('/knowledge/quality-issues'),
  getReviewTasks: () => request<any[]>('/review/tasks'),
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
