const STORAGE_API_BASE = 'property-admin-api-base';

function defaultApiBase() {
  return import.meta.env.VITE_API_BASE || '/api/v1';
}

export function getApiBase() {
  return localStorage.getItem(STORAGE_API_BASE) || defaultApiBase();
}

export function setApiBase(value) {
  const normalized = (value || '').trim() || defaultApiBase();
  localStorage.setItem(STORAGE_API_BASE, normalized);
  return normalized;
}

function buildUrl(path, apiBase = getApiBase()) {
  const base = apiBase.replace(/\/$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
}

async function request(path, { method = 'GET', body, token, apiBase, adminKey } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (adminKey) {
    headers['X-Admin-Key'] = adminKey;
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(buildUrl(path, apiBase), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.code !== 0) {
    const error = new Error(payload.message || `请求失败 (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return payload.data;
}

export function loginAdmin(apiBase, adminKey) {
  return request('/admin/auth/login', {
    method: 'POST',
    apiBase,
    body: { adminKey }
  });
}

export function meAdmin(apiBase, token) {
  return request('/admin/auth/me', { apiBase, token });
}

export function logoutAdmin(apiBase, token) {
  return request('/admin/auth/logout', {
    method: 'POST',
    apiBase,
    token
  });
}

export function listNotices(apiBase, token) {
  return request('/admin/notices', { apiBase, token });
}

export function saveNotice(apiBase, token, payload) {
  const data = payload || {};
  return request(data.id ? `/admin/notices/${data.id}` : '/admin/notices', {
    method: data.id ? 'PUT' : 'POST',
    apiBase,
    token,
    body: data
  });
}

export function deleteNotice(apiBase, token, id) {
  return request(`/admin/notices/${id}`, { method: 'DELETE', apiBase, token });
}

export function listBills(apiBase, token) {
  return request('/admin/bills', { apiBase, token });
}

export function saveBill(apiBase, token, payload) {
  const data = payload || {};
  return request(data.id ? `/admin/bills/${data.id}` : '/admin/bills', {
    method: data.id ? 'PUT' : 'POST',
    apiBase,
    token,
    body: data
  });
}

export function deleteBill(apiBase, token, id) {
  return request(`/admin/bills/${id}`, { method: 'DELETE', apiBase, token });
}

export function listRepairs(apiBase, token) {
  return request('/admin/repairs', { apiBase, token });
}

export function saveRepair(apiBase, token, payload) {
  const data = payload || {};
  return request(data.id ? `/admin/repairs/${data.id}` : '/admin/repairs', {
    method: data.id ? 'PUT' : 'POST',
    apiBase,
    token,
    body: data
  });
}

export function deleteRepair(apiBase, token, id) {
  return request(`/admin/repairs/${id}`, { method: 'DELETE', apiBase, token });
}
