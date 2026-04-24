import { Demanda, Desenvolvedor, DevWorkload, Observacao, SistemaInfo } from './types';
import { Platform } from 'react-native';

function resolveApiBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  }

  return '';
}

export const API_BASE_URL = resolveApiBaseUrl();

type ErrorPayload = {
  error?: {
    code?: string;
    message?: string;
    details?: string[];
    traceId?: string;
  };
};

function buildFriendlyError(status: number, rawDetail: string): string {
  try {
    const parsed = JSON.parse(rawDetail) as ErrorPayload;
    const message = parsed.error?.message || 'Não foi possível concluir a solicitação.';
    const details = parsed.error?.details?.length ? ` ${parsed.error.details.join(' ')}` : '';
    return `${message}${details}`.trim();
  } catch {
    if (!rawDetail) return `Erro ${status}. Tente novamente.`;
    return rawDetail;
  }
}

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error('API não configurada no app. Defina EXPO_PUBLIC_API_URL com o IP da sua máquina (ex.: http://192.168.1.73:3001).');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, init);
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(buildFriendlyError(response.status, detail));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function fetchVoid(path: string, init?: RequestInit): Promise<void> {
  if (!API_BASE_URL) {
    throw new Error('API não configurada no app. Defina EXPO_PUBLIC_API_URL com o IP da sua máquina (ex.: http://192.168.1.73:3001).');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, init);
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(buildFriendlyError(response.status, detail));
  }
}

export const api = {
  getDemandas: (query = '') => fetchJson<Demanda[]>(`/demandas${query}`),
  getDevs: () => fetchJson<Desenvolvedor[]>('/desenvolvedores'),
  getSistemas: () => fetchJson<SistemaInfo[]>('/sistemas'),
  getWorkload: () => fetchJson<DevWorkload[]>('/dashboard/dev-workload'),
  createDemanda: (body: object) =>
    fetchJson<Demanda>('/demandas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  updateDemanda: (id: number, body: object) =>
    fetchJson<Demanda>(`/demandas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  deleteDemanda: (id: number) => fetchVoid(`/demandas/${id}`, { method: 'DELETE' }),
  getObservacoes: (demandaId: number) => fetchJson<Observacao[]>(`/demandas/${demandaId}/observacoes`),
  addObservacao: (demandaId: number, body: object) =>
    fetchJson<Observacao>(`/demandas/${demandaId}/observacoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  updateObservacao: (id: number, body: object) =>
    fetchJson<Observacao>(`/observacoes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  deleteObservacao: (id: number) => fetchVoid(`/observacoes/${id}`, { method: 'DELETE' }),
};
