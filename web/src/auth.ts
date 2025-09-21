import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT if present
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export type SessionUser = { id: string; email: string; fullName: string } | null;

export function saveSession(token: string, user: SessionUser) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function currentUser(): SessionUser {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

export async function register(data: { fullName: string; email: string; phoneNumber: string; password: string; }) {
  const r = await api.post('/auth/register', data);
  return r.data;
}

export async function login(email: string, password: string) {
  const r = await api.post('/auth/login', { email, password });
  saveSession(r.data.token, r.data.user);
  return r.data.user as SessionUser;
}

export async function me() {
  const r = await api.get('/auth/me');
  return r.data as SessionUser;
}
