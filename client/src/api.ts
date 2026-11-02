import type { Container, Dashboard, Destination, LoadPlan, Locomotive, Railcar, User } from './types';

const KEY = 'tlo-token';
export const token = { get: () => sessionStorage.getItem(KEY), set: (t: string) => sessionStorage.setItem(KEY, t), clear: () => sessionStorage.removeItem(KEY) };

async function call<T>(url: string, method = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token.get() ? { Authorization: `Bearer ${token.get()}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && token.get()) window.dispatchEvent(new Event('tlo:signed-out'));
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data as T;
}

export interface PlanInput { destId: string; railcarCount: number; locoId?: string }
export type Entity = 'locomotives' | 'railcars' | 'containers';

export const api = {
  login: (username: string, password: string) => call<{ token: string; user: User }>('/api/auth/login', 'POST', { username, password }),
  me: () => call<User>('/api/auth/me'),
  logout: () => call<{ ok: boolean }>('/api/auth/logout', 'POST'),
  destinations: () => call<Destination[]>('/api/destinations'),
  locomotives: () => call<Locomotive[]>('/api/locomotives'),
  railcars: () => call<Railcar[]>('/api/railcars'),
  containers: () => call<Container[]>('/api/containers'),
  optimize: (input: PlanInput) => call<LoadPlan>('/api/plans/optimize', 'POST', input),
  save: (input: PlanInput) => call<LoadPlan>('/api/plans', 'POST', input),
  dashboard: () => call<Dashboard>('/api/dashboard'),
  create: (e: Entity, body: unknown) => call<unknown>(`/api/${e}`, 'POST', body),
  update: (e: Entity, id: string, body: unknown) => call<unknown>(`/api/${e}/${encodeURIComponent(id)}`, 'PUT', body),
  remove: (e: Entity, id: string) => call<unknown>(`/api/${e}/${encodeURIComponent(id)}`, 'DELETE'),
  reset: () => call<{ ok: boolean }>('/api/reset', 'POST'),
};
