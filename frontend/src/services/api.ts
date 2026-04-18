import axios, { type AxiosError } from 'axios';
import type { Task, AuditLog, User } from '../types';

// ─── Base URL ─────────────────────────────────────────────────────────────────
// In production (Netlify) VITE_API_URL must be set to the Render backend URL.
// In development the Vite proxy rewrites /api → localhost:8080, so '/api' works.
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

// ─── Axios Instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ─── Request Interceptor — attach JWT ─────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response Interceptor — handle 401 globally ───────────────────────────────
const AUTH_PATHS = ['/login', '/signup', '/oauth-success', '/select-org', '/org-setup'];

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

// ─── Google OAuth URL ────────────────────────────────────────────────────────
// Must be absolute in production — Netlify cannot proxy browser OAuth redirects.
export const GOOGLE_AUTH_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/auth/google`
  : '/api/auth/google';

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
    api.put<{ user: User; token?: string }>('/auth/me/organization', { organization_id }),
};

// ─── Org API ──────────────────────────────────────────────────────────────────
export const orgAPI = {
  select: (organization_id: number) =>
    api.post<{ message: string; organization: { id: number; name: string }; token?: string }>('/org/select', { organization_id }),

  create: (name: string) =>
    api.post<{ message: string; organization: { id: number; name: string }; token?: string }>('/org/create', { name }),
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
export interface AuditLogsResponse {
  logs: AuditLog[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export const auditAPI = {
  getAll: (params?: { page?: number; limit?: number; action?: string }) =>
    api.get<AuditLogsResponse>('/audit-logs', { params }),
};

export default api;
