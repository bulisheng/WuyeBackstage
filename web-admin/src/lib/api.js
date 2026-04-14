const STORAGE_API_BASE = 'property-admin-api-base';

function defaultApiBase() {
  return import.meta.env.VITE_API_BASE || '/api/v1';
}

function resolveApiBase(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) {
    return defaultApiBase();
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith('/')) {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      const port = window.location.port || '';
      const isSameOriginProxyPort = port === '' || port === '80' || port === '443' || port === '3000';
      if (!isSameOriginProxyPort) {
        return `${window.location.protocol}//${window.location.hostname}:8080${trimmed}`;
      }
    }
    if (import.meta.env.DEV && typeof window !== 'undefined' && window.location?.hostname) {
      return `${window.location.protocol}//${window.location.hostname}:8080${trimmed}`;
    }
    return trimmed;
  }
  return trimmed;
}

export function getApiBase() {
  return resolveApiBase(localStorage.getItem(STORAGE_API_BASE) || defaultApiBase());
}

export function setApiBase(value) {
  const normalized = resolveApiBase(value);
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

export function getCommunity(apiBase, token) {
  return request('/admin/community', { apiBase, token });
}

export function saveCommunity(apiBase, token, payload) {
  return request('/admin/community', {
    method: 'PUT',
    apiBase,
    token,
    body: payload || {}
  });
}

export function listCommunities(apiBase, token) {
  return request('/admin/communities', { apiBase, token });
}

export function saveCommunityById(apiBase, token, payload) {
  const data = payload || {};
  return request(data.id ? `/admin/communities/${data.id}` : '/admin/communities', {
    method: data.id ? 'PUT' : 'POST',
    apiBase,
    token,
    body: data
  });
}

export function deleteCommunity(apiBase, token, id) {
  return request(`/admin/communities/${id}`, { method: 'DELETE', apiBase, token });
}

export function activateCommunity(apiBase, token, id) {
  return request(`/admin/communities/${id}/activate`, { method: 'POST', apiBase, token });
}

export function listUsers(apiBase, token) {
  return request('/admin/users', { apiBase, token });
}

export function saveUser(apiBase, token, payload) {
  const data = payload || {};
  return request(data.id ? `/admin/users/${data.id}` : '/admin/users', {
    method: data.id ? 'PUT' : 'POST',
    apiBase,
    token,
    body: data
  });
}

export function deleteUser(apiBase, token, id) {
  return request(`/admin/users/${id}`, { method: 'DELETE', apiBase, token });
}

export function listHouses(apiBase, token) {
  return request('/admin/houses', { apiBase, token });
}

export function saveHouse(apiBase, token, payload) {
  const data = payload || {};
  return request(data.id ? `/admin/houses/${data.id}` : '/admin/houses', {
    method: data.id ? 'PUT' : 'POST',
    apiBase,
    token,
    body: data
  });
}

export function deleteHouse(apiBase, token, id) {
  return request(`/admin/houses/${id}`, { method: 'DELETE', apiBase, token });
}

export function listStaffs(apiBase, token) {
  return request('/admin/staffs', { apiBase, token });
}

export function saveStaff(apiBase, token, payload) {
  const data = payload || {};
  return request(data.id ? `/admin/staffs/${data.id}` : '/admin/staffs', {
    method: data.id ? 'PUT' : 'POST',
    apiBase,
    token,
    body: data
  });
}

export function deleteStaff(apiBase, token, id) {
  return request(`/admin/staffs/${id}`, { method: 'DELETE', apiBase, token });
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

export function listFeedbacks(apiBase, token) {
  return request('/admin/feedbacks', { apiBase, token });
}

export function saveFeedback(apiBase, token, payload) {
  const data = payload || {};
  return request(data.id ? `/admin/feedbacks/${data.id}` : '/admin/feedbacks', {
    method: data.id ? 'PUT' : 'POST',
    apiBase,
    token,
    body: data
  });
}

export function deleteFeedback(apiBase, token, id) {
  return request(`/admin/feedbacks/${id}`, { method: 'DELETE', apiBase, token });
}

export function replyFeedback(apiBase, token, id, payload) {
  return request(`/admin/feedbacks/${id}/reply`, {
    method: 'POST',
    apiBase,
    token,
    body: payload || {}
  });
}

export function listComplaintQueue(apiBase, token) {
  return request('/admin/complaint-queue', { apiBase, token });
}

export function getComplaintQueue(apiBase, token, id) {
  return request(`/admin/complaint-queue/${id}`, { apiBase, token });
}

export function analyzeComplaintQueue(apiBase, token, id, payload) {
  return request(`/admin/complaint-queue/${id}/analyze`, {
    method: 'POST',
    apiBase,
    token,
    body: payload || {}
  });
}

export function pushComplaintQueueToFeishu(apiBase, token, id, payload) {
  return request(`/admin/complaint-queue/${id}/push-feishu`, {
    method: 'POST',
    apiBase,
    token,
    body: payload || {}
  });
}

export function listComplaintRules(apiBase, token) {
  return request('/admin/complaint-rules', { apiBase, token });
}

export function saveComplaintRule(apiBase, token, payload) {
  const data = payload || {};
  return request(data.id ? `/admin/complaint-rules/${data.id}` : '/admin/complaint-rules', {
    method: data.id ? 'PUT' : 'POST',
    apiBase,
    token,
    body: data
  });
}

export function deleteComplaintRule(apiBase, token, id) {
  return request(`/admin/complaint-rules/${id}`, { method: 'DELETE', apiBase, token });
}

export function listVisitors(apiBase, token) {
  return request('/admin/visitors', { apiBase, token });
}

export function saveVisitor(apiBase, token, payload) {
  const data = payload || {};
  return request(data.id ? `/admin/visitors/${data.id}` : '/admin/visitors', {
    method: data.id ? 'PUT' : 'POST',
    apiBase,
    token,
    body: data
  });
}

export function deleteVisitor(apiBase, token, id) {
  return request(`/admin/visitors/${id}`, { method: 'DELETE', apiBase, token });
}

export function invalidateVisitor(apiBase, token, id) {
  return request(`/admin/visitors/${id}/invalidate`, { method: 'POST', apiBase, token });
}

export function listDecorations(apiBase, token) {
  return request('/admin/decorations', { apiBase, token });
}

export function saveDecoration(apiBase, token, payload) {
  const data = payload || {};
  return request(data.id ? `/admin/decorations/${data.id}` : '/admin/decorations', {
    method: data.id ? 'PUT' : 'POST',
    apiBase,
    token,
    body: data
  });
}

export function deleteDecoration(apiBase, token, id) {
  return request(`/admin/decorations/${id}`, { method: 'DELETE', apiBase, token });
}

export function reviewDecoration(apiBase, token, id, payload) {
  return request(`/admin/decorations/${id}/review`, {
    method: 'POST',
    apiBase,
    token,
    body: payload || {}
  });
}

export function listExpress(apiBase, token) {
  return request('/admin/express', { apiBase, token });
}

export function saveExpress(apiBase, token, payload) {
  const data = payload || {};
  return request(data.id ? `/admin/express/${data.id}` : '/admin/express', {
    method: data.id ? 'PUT' : 'POST',
    apiBase,
    token,
    body: data
  });
}

export function deleteExpress(apiBase, token, id) {
  return request(`/admin/express/${id}`, { method: 'DELETE', apiBase, token });
}

export function pickupExpress(apiBase, token, id, payload) {
  return request(`/admin/express/${id}/pickup`, {
    method: 'POST',
    apiBase,
    token,
    body: payload || {}
  });
}

export function listVegetableProducts(apiBase, token) {
  return request('/admin/vegetables/products', { apiBase, token });
}

export function saveVegetableProduct(apiBase, token, payload) {
  const data = payload || {};
  return request(data.id ? `/admin/vegetables/products/${data.id}` : '/admin/vegetables/products', {
    method: data.id ? 'PUT' : 'POST',
    apiBase,
    token,
    body: data
  });
}

export function deleteVegetableProduct(apiBase, token, id) {
  return request(`/admin/vegetables/products/${id}`, { method: 'DELETE', apiBase, token });
}

export function listVegetableOrders(apiBase, token) {
  return request('/admin/vegetables/orders', { apiBase, token });
}

export function saveVegetableOrder(apiBase, token, payload) {
  const data = payload || {};
  return request(data.id ? `/admin/vegetables/orders/${data.id}` : '/admin/vegetables/orders', {
    method: data.id ? 'PUT' : 'POST',
    apiBase,
    token,
    body: data
  });
}

export function deleteVegetableOrder(apiBase, token, id) {
  return request(`/admin/vegetables/orders/${id}`, { method: 'DELETE', apiBase, token });
}

export function getAssistantSettings(apiBase, token, communityId) {
  const path = communityId ? `/assistant/settings?communityId=${encodeURIComponent(communityId)}` : '/assistant/settings';
  return request(path, { apiBase, token });
}

export function saveAssistantSettings(apiBase, token, payload) {
  return request('/assistant/settings', {
    method: 'PUT',
    apiBase,
    token,
    body: payload || {}
  });
}

export function testAssistantSettings(apiBase, token, payload) {
  return request('/assistant/settings/test', {
    method: 'POST',
    apiBase,
    token,
    body: payload || {}
  });
}

export function createAssistantSession(apiBase, token, payload) {
  return request('/assistant/sessions', {
    method: 'POST',
    apiBase,
    token,
    body: payload || {}
  });
}

export function listAssistantSessions(apiBase, token, communityId) {
  const path = communityId ? `/assistant/sessions?communityId=${encodeURIComponent(communityId)}` : '/assistant/sessions';
  return request(path, { apiBase, token });
}

export function getAssistantSession(apiBase, token, id) {
  return request(`/assistant/sessions/${id}`, { apiBase, token });
}

export function assistantMessage(apiBase, token, payload) {
  return request('/assistant/messages', {
    method: 'POST',
    apiBase,
    token,
    body: payload || {}
  });
}

export function assistantHandoff(apiBase, token, payload) {
  return request('/assistant/handoff', {
    method: 'POST',
    apiBase,
    token,
    body: payload || {}
  });
}

export function listAssistantFaqs(apiBase, token, communityId) {
  const path = communityId ? `/assistant/faq?communityId=${encodeURIComponent(communityId)}` : '/assistant/faq';
  return request(path, { apiBase, token });
}

export function saveAssistantFaq(apiBase, token, payload) {
  const data = payload || {};
  return request(data.id ? `/assistant/faq/${data.id}` : '/assistant/faq', {
    method: data.id ? 'PUT' : 'POST',
    apiBase,
    token,
    body: data
  });
}

export function deleteAssistantFaq(apiBase, token, id) {
  return request(`/assistant/faq/${id}`, { method: 'DELETE', apiBase, token });
}
