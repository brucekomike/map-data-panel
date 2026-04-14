import type { Project, Map, Widget, DataEntry } from './types';

const BASE = '/api';

async function req<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + url, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

// Projects
export const getProjects = () => req<Project[]>('/projects');
export const createProject = (data: { name: string; description?: string }) =>
  req<Project>('/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const updateProject = (id: number, data: Partial<Project>) =>
  req<Project>(`/projects/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const deleteProject = (id: number) =>
  req<{ ok: boolean }>(`/projects/${id}`, { method: 'DELETE' });

// Maps
export const getMaps = (projectId: number) => req<Map[]>(`/projects/${projectId}/maps`);
export const createMap = (projectId: number, formData: FormData) =>
  fetch(`${BASE}/projects/${projectId}/maps`, { method: 'POST', body: formData }).then(r => r.json());
export const getMap = (id: number) => req<Map>(`/maps/${id}`);
export const updateMap = (id: number, data: Partial<Map>) =>
  req<Map>(`/maps/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const deleteMap = (id: number) =>
  req<{ ok: boolean }>(`/maps/${id}`, { method: 'DELETE' });

// Widgets
export const getWidgets = (mapId: number) => req<Widget[]>(`/maps/${mapId}/widgets`);
export const createWidget = (mapId: number, data: Omit<Widget, 'id' | 'map_id' | 'created_at'>) =>
  req<Widget>(`/maps/${mapId}/widgets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const updateWidget = (id: number, data: Partial<Widget>) =>
  req<Widget>(`/widgets/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const deleteWidget = (id: number) =>
  req<{ ok: boolean }>(`/widgets/${id}`, { method: 'DELETE' });

// Data
export const getWidgetData = (widgetId: number) => req<DataEntry[]>(`/widgets/${widgetId}/data`);
export const postData = (data: { widget_id: number; value: unknown }) =>
  req<DataEntry>('/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
