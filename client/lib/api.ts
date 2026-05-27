const base = process.env.NEXT_PUBLIC_API_BASE_URL;
const tokenKey = 'cloudlog_token';
const legacyTokenKey = 'token';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(tokenKey) || sessionStorage.getItem(tokenKey) || localStorage.getItem(legacyTokenKey);
};

export const setToken = (token: string, remember: boolean) => {
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(tokenKey, token);
  localStorage.removeItem(legacyTokenKey);
  if (remember) {
    sessionStorage.removeItem(tokenKey);
  } else {
    localStorage.removeItem(tokenKey);
  }
};

export const clearToken = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(tokenKey);
  sessionStorage.removeItem(tokenKey);
  localStorage.removeItem(legacyTokenKey);
};

export const api = async <T = any>(path: string, init?: RequestInit): Promise<T> => {
  const token = getToken();
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    let message = res.statusText || 'Request failed';
    try {
      const body = await res.json();
      message = body.detail || message;
    } catch {
      message = await res.text();
    }
    throw new ApiError(message, res.status);
  }

  return res.json();
};
