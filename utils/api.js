const { getRuntimeConfig } = require('./config');

function getAppToken() {
  try {
    return wx.getStorageSync('authToken') || '';
  } catch (e) {
    return '';
  }
}

function getBaseUrl() {
  try {
    const app = getApp();
    if (app && app.globalData && app.globalData.apiBaseUrl) {
      return app.globalData.apiBaseUrl;
    }
  } catch (e) {
    // ignore
  }
  return getRuntimeConfig().apiBaseUrl;
}

function request(options) {
  const baseUrl = getBaseUrl();
  const header = Object.assign({
    'content-type': 'application/json'
  }, options.header || {});

  const token = options.token || getAppToken();
  if (token) {
    header.Authorization = header.Authorization || `Bearer ${token}`;
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${baseUrl}${options.path}`,
      method: options.method || 'GET',
      data: options.data || {},
      header,
      timeout: options.timeout || 10000,
      success(res) {
        const payload = res.data;
        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (payload && typeof payload.code === 'number') {
            if (payload.code === 0) {
              resolve(payload);
              return;
            }
            reject(new Error(payload.message || '请求失败'));
            return;
          }
          resolve(payload);
          return;
        }
        reject(new Error((payload && payload.message) || `HTTP ${res.statusCode}`));
      },
      fail(err) {
        reject(err);
      }
    });
  });
}

function get(path, data, options) {
  return request(Object.assign({}, options, { path, data, method: 'GET' }));
}

function post(path, data, options) {
  return request(Object.assign({}, options, { path, data, method: 'POST' }));
}

function put(path, data, options) {
  return request(Object.assign({}, options, { path, data, method: 'PUT' }));
}

function authLogin(payload) {
  return post('/auth/wechat/login', payload);
}

function logout() {
  return post('/auth/logout', {});
}

function getDashboard() {
  return get('/dashboard');
}

function getCommunityCurrent() {
  return get('/community/current');
}

function getNotices() {
  return get('/notices');
}

function getBills(status) {
  return get('/bills', status ? { status: status } : {});
}

function getBillDetail(id) {
  return get(`/bills/${id}`);
}

function payBill(id, payload) {
  return post(`/bills/${id}/pay`, payload || {});
}

function getRepairs(status) {
  return get('/repairs', status ? { status: status } : {});
}

function getRepairDetail(id) {
  return get(`/repairs/${id}`);
}

function createRepair(payload) {
  return post('/repairs', payload);
}

function createRepairComment(id, payload) {
  return post(`/repairs/${id}/comments`, payload || {});
}

function getVisitors() {
  return get('/visitors');
}

function createVisitor(payload) {
  return post('/visitors', payload);
}

function invalidateVisitor(id) {
  return post(`/visitors/${id}/invalidate`, {});
}

function getDecorations() {
  return get('/decorations');
}

function createDecoration(payload) {
  return post('/decorations', payload);
}

function getFeedbacks(type) {
  return get('/feedbacks', type ? { type: type } : {});
}

function createFeedback(payload) {
  return post('/feedbacks', payload);
}

function getExpress() {
  return get('/express');
}

function pickupExpress(id, payload) {
  return post(`/express/${id}/pickup`, payload || {});
}

function getVegetableProducts() {
  return get('/vegetables/products');
}

function getVegetableOrders() {
  return get('/vegetables/orders');
}

function createVegetableOrder(payload) {
  return post('/vegetables/orders', payload);
}

function createAssistantSession(payload) {
  return post('/assistant/sessions', payload);
}

function getAssistantSession(id) {
  return get(`/assistant/sessions/${id}`);
}

function callbackOpenclaw(payload) {
  return post('/assistant/callback/openclaw', payload);
}

function draftRepair(payload) {
  return post('/assistant/draft-repair', payload);
}

function draftFeedback(payload) {
  return post('/assistant/draft-feedback', payload);
}

function classifyIntent(payload) {
  return post('/assistant/classify-intent', payload);
}

module.exports = {
  getBaseUrl,
  request,
  get,
  post,
  put,
  authLogin,
  logout,
  getDashboard,
  getCommunityCurrent,
  getNotices,
  getBills,
  getBillDetail,
  payBill,
  getRepairs,
  getRepairDetail,
  createRepair,
  createRepairComment,
  getVisitors,
  createVisitor,
  invalidateVisitor,
  getDecorations,
  createDecoration,
  getFeedbacks,
  createFeedback,
  getExpress,
  pickupExpress,
  getVegetableProducts,
  getVegetableOrders,
  createVegetableOrder,
  createAssistantSession,
  getAssistantSession,
  callbackOpenclaw,
  draftRepair,
  draftFeedback,
  classifyIntent
};
