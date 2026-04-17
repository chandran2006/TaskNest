import axios, { type AxiosError } from 'axios';
import type { Task, AuditLog, User } from '../types';

// ─── Axios Instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// ─── Request Interceptor — attach JWT ─────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response Interceptor — handle 401 globally ───────────────────────────────
const AUTH_PATHS = ['/login', '/signup', '/oauth-success'];

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      const onAuthPage = AUTH_PATHS.some((p) => window.location.pathname.startsWith(p));
      if (!onAuthPage) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ─── Error message extractor ──────────────────────────────────────────────────
export function getErrorMessage(err: unknown, fallback = 'Something went wrong.'): string {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as { message?: string })?.message ?? fallback;
  }
  return fallback;
}

// ─── Auth API ─────────────────────────────────────────────────────────────────
export interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

export const authAPI = {
  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),

  signup: (data: {
    name: string;
    email: string;
    password: string;
    role: string;
    adminKey?: string;
    organization_id: string;
  }) => api.post<AuthResponse>('/auth/signup', data),

  setOrganization: (organization_id: string) =>
    api.put<{ user: User }>('/auth/me/organization', { organization_id }),
};

// ─── Tasks API ────────────────────────────────────────────────────────────────
export interface TasksResponse  { tasks: Task[] }
export interface TaskResponse   { task: Task; message: string }

export const tasksAPI = {
  getAll: () =>
    api.get<TasksResponse>('/tasks'),

  create: (data: { title: string; description: string; status: string }) =>
    api.post<TaskResponse>('/tasks', data),

  update: (id: string, data: { title?: string; description?: string; status?: string }) =>
    api.put<TaskResponse>(`/tasks/${id}`, data),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/tasks/${id}`),
};

// ─── Audit Logs API ───────────────────────────────────────────────────────────
export interface AuditLogsResponse { logs: AuditLog[] }

export const auditAPI = {
  getAll: () => api.get<AuditLogsResponse>('/audit-logs'),
};

export default api;
