const { getRuntimeConfig } = require('./utils/config');
const {
  buildMockState,
  normalizeRemoteState,
  clone,
  mockBills,
  mockRepairs,
  mockNotices,
  mockVisitors,
  mockDecorations,
  mockComplaints,
  mockPraises,
  mockExpress,
  mockVegetableProducts
} = require('./utils/mock-data');
const api = require('./utils/api');

App({
  globalData: buildMockState(),

  onLaunch() {
    const runtimeConfig = getRuntimeConfig();
    this.globalData.apiBaseUrl = runtimeConfig.apiBaseUrl;
    this.globalData.openclawBaseUrl = runtimeConfig.openclawBaseUrl;
    this.globalData.openclawMode = runtimeConfig.openclawMode || 'local';
    this.globalData.openclawLocalBaseUrl = runtimeConfig.openclawLocalBaseUrl || runtimeConfig.openclawBaseUrl;
    this.globalData.openclawRemoteBaseUrl = runtimeConfig.openclawRemoteBaseUrl || '';
    this.globalData.runtimeEnv = runtimeConfig;
    this.globalData.mockBills = clone(mockBills);
    this.globalData.mockRepairs = clone(mockRepairs);
    this.globalData.mockNotices = clone(mockNotices);
    this.globalData.mockVisitors = clone(mockVisitors);
    this.globalData.mockDecorations = clone(mockDecorations);
    this.globalData.mockComplaints = clone(mockComplaints);
    this.globalData.mockPraises = clone(mockPraises);
    this.globalData.mockExpress = clone(mockExpress);
    this.globalData.mockVegetableProducts = clone(mockVegetableProducts);
    this.globalData.pendingFeedbackQueue = [];

    this.restoreSession();
    this.syncLegacyState();
    this.bootstrap();
    this.initServices();
    this.loadPendingFeedbackQueue();
  },

  initServices() {
    const app = this;
    this.services = {
      async login(payload) {
        try {
          const res = await api.authLogin(payload);
          const data = res.data || {};
          app.setAuthState(data.token, data.user, data.community);
          return data;
        } catch (error) {
          const message = String(error && error.message ? error.message : '');
          const shouldFallback =
            /request:fail|HTTP|timeout|网络|connect|ECONN|ENOTFOUND/i.test(message) ||
            /fail/i.test(message) && !/未绑定房屋|房屋|验证码|手机号|登录/.test(message);
          if (!shouldFallback) {
            throw error;
          }
          const userInfo = payload.userInfo || {};
          const fallbackCommunity = app.globalData.communityInfo || {};
          const user = {
            openid: `local-${payload.phone}`,
            name: userInfo.nickName || '业主',
            avatar: userInfo.avatarUrl || '/assets/images/default-avatar.png',
            phone: payload.phone,
            community: fallbackCommunity.name || '',
            building: fallbackCommunity.building || '',
            unit: fallbackCommunity.unit || '',
            room: fallbackCommunity.room || '',
            createTime: new Date().toISOString(),
            status: 'active'
          };
          const community = {
            name: fallbackCommunity.name || '',
            building: fallbackCommunity.building || '',
            unit: fallbackCommunity.unit || '',
            room: fallbackCommunity.room || '',
            fullAddress: fallbackCommunity.fullAddress || '',
            address: fallbackCommunity.address || '',
            propertyPhone: fallbackCommunity.propertyPhone || ''
          };
          app.setAuthState(`local-token-${payload.phone}`, user, community);
          return { token: app.globalData.token, user, community };
        }
      },

      async createRepair(payload) {
        try {
          const res = await api.createRepair(payload);
          const repair = res.data;
          app.addRepair(repair);
          return repair;
        } catch (error) {
          const repair = app.createLocalRepair(payload);
          app.addRepair(repair);
          return repair;
        }
      },

      async payBill(id, payload) {
        try {
          const res = await api.payBill(id, payload);
          app.updateBill(res.data);
          return res.data;
        } catch (error) {
          const bill = app.payBillLocally(id, payload);
          return bill;
        }
      },

      async createFeedback(payload) {
        const requestPayload = clone(payload || {});
        const localRequestId = `feedback-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        try {
          const res = await api.createFeedback(requestPayload);
          const feedback = res.data;
          app.addFeedback(feedback);
          return feedback;
        } catch (error) {
          const feedback = app.createLocalFeedback(requestPayload, localRequestId);
          app.addFeedback(feedback);
          app.enqueuePendingFeedback({
            requestId: localRequestId,
            payload: requestPayload,
            createdAt: new Date().toISOString()
          });
          app.savePendingFeedbackQueue();
          return feedback;
        }
      },

      async createVisitor(payload) {
        try {
          const res = await api.createVisitor(payload);
          const visitor = res.data;
          app.addVisitor(visitor);
          return visitor;
        } catch (error) {
          const visitor = app.createLocalVisitor(payload);
          app.addVisitor(visitor);
          return visitor;
        }
      },

      async createDecoration(payload) {
        try {
          const res = await api.createDecoration(payload);
          const decoration = res.data;
          app.addDecoration(decoration);
          return decoration;
        } catch (error) {
          const decoration = app.createLocalDecoration(payload);
          app.addDecoration(decoration);
          return decoration;
        }
      },

      async createVegetableOrder(payload) {
        try {
          const res = await api.createVegetableOrder(payload);
          const order = res.data;
          app.addVegetableOrder(order);
          return order;
        } catch (error) {
          const order = app.createLocalVegetableOrder(payload);
          app.addVegetableOrder(order);
          return order;
        }
      },

      async createAssistantSession(payload) {
        const res = await api.createAssistantSession(payload);
        return res.data;
      },

      async assistantMessage(payload) {
        const res = await api.assistantMessage(payload);
        return res.data;
      },

      async assistantHandoff(payload) {
        const res = await api.assistantHandoff(payload);
        return res.data;
      },

      async getAssistantSettings(communityId) {
        const res = await api.getAssistantSettings(communityId);
        return res.data;
      },

      async saveAssistantSettings(payload) {
        const res = await api.saveAssistantSettings(payload);
        return res.data;
      },

      async draftRepair(payload) {
        const res = await api.draftRepair(payload);
        return res.data;
      },

      async draftFeedback(payload) {
        const res = await api.draftFeedback(payload);
        return res.data;
      },

      async classifyIntent(payload) {
        const res = await api.classifyIntent(payload);
        return res.data;
      }
    };
  },

  restoreSession() {
    try {
      const isLoggedIn = wx.getStorageSync('isLoggedIn');
      const token = wx.getStorageSync('authToken');
      const userInfo = wx.getStorageSync('userInfo');
      const communityInfo = wx.getStorageSync('communityInfo');

      if (isLoggedIn) {
        this.globalData.isLoggedIn = true;
      }
      if (token) {
        this.globalData.token = token;
      }
      if (userInfo) {
        this.globalData.userInfo = userInfo;
        this.globalData.user = userInfo;
      }
      if (communityInfo) {
        this.globalData.communityInfo = communityInfo;
        this.globalData.community = communityInfo;
      }
    } catch (error) {
      // ignore storage errors
    }
  },

  syncLegacyState() {
    this.globalData.user = this.globalData.userInfo;
    this.globalData.community = this.globalData.communityInfo;
    this.globalData.visibleBills = this.getVisibleBills(this.globalData.bills || [], this.globalData.userInfo, this.globalData.communityInfo);
    this.globalData.propertyFee = { details: this.globalData.visibleBills };
    this.globalData.repairList = this.globalData.repairs;
    this.globalData.complaintList = this.globalData.complaints;
    this.globalData.praiseList = this.globalData.praises;
    this.globalData.feedbackList = [].concat(this.globalData.complaints || [], this.globalData.praises || []);
    this.globalData.expressList = this.globalData.express;
    this.globalData.vegetable = {
      products: this.globalData.vegetableProducts,
      orders: this.globalData.vegetableOrders
    };
  },

  applyState(partialState) {
    this.globalData = Object.assign({}, this.globalData, partialState);
    this.syncLegacyState();
  },

  loadPendingFeedbackQueue() {
    try {
      const queue = wx.getStorageSync('pendingFeedbackQueue');
      if (Array.isArray(queue)) {
        this.globalData.pendingFeedbackQueue = queue;
      }
    } catch (error) {
      this.globalData.pendingFeedbackQueue = [];
    }
  },

  savePendingFeedbackQueue() {
    try {
      wx.setStorageSync('pendingFeedbackQueue', this.globalData.pendingFeedbackQueue || []);
    } catch (error) {
      // ignore storage errors
    }
  },

  enqueuePendingFeedback(item) {
    if (!item || !item.requestId) {
      return;
    }
    const current = Array.isArray(this.globalData.pendingFeedbackQueue) ? this.globalData.pendingFeedbackQueue : [];
    const next = current.filter(function (entry) {
      return entry.requestId !== item.requestId;
    });
    next.unshift(item);
    this.globalData.pendingFeedbackQueue = next;
  },

  replaceLocalFeedback(requestId, feedback) {
    if (!feedback) {
      return;
    }
    const replaceItem = function (list) {
      return (list || []).map(function (item) {
        return item && item.localRequestId === requestId ? feedback : item;
      });
    };
    if (feedback.type === '表扬') {
      this.globalData.praises = replaceItem(this.globalData.praises);
    } else {
      this.globalData.complaints = replaceItem(this.globalData.complaints);
    }
    this.syncLegacyState();
  },

  async syncPendingFeedbackQueue() {
    const queue = Array.isArray(this.globalData.pendingFeedbackQueue) ? this.globalData.pendingFeedbackQueue.slice() : [];
    if (!queue.length) {
      return;
    }
    const remaining = [];
    for (const item of queue) {
      try {
        const res = await api.createFeedback(item.payload || {});
        const feedback = res.data;
        this.replaceLocalFeedback(item.requestId, feedback);
      } catch (error) {
        remaining.push(item);
      }
    }
    this.globalData.pendingFeedbackQueue = remaining;
    this.savePendingFeedbackQueue();
  },

  async flushPendingFeedbackQueue() {
    try {
      await this.syncPendingFeedbackQueue();
    } catch (error) {
      // ignore sync errors
    }
  },

  async bootstrap() {
    const fallback = buildMockState();
    const requests = [
      api.getDashboard(),
      api.getCommunityCurrent(),
      api.getNotices(),
      api.getBills(),
      api.getRepairs(),
      api.getVisitors(),
      api.getDecorations(),
      api.getFeedbacks(),
      api.getExpress(),
      api.getVegetableProducts(),
      api.getVegetableOrders()
    ];

    const settled = await Promise.allSettled(requests);
    const remote = {};
    const remoteAvailable = settled.some(function (item) {
      return item.status === 'fulfilled' && item.value;
    });

    if (settled[0].status === 'fulfilled' && settled[0].value && settled[0].value.data) {
      const dashboard = settled[0].value.data;
      remote.userInfo = dashboard.userInfo || fallback.userInfo;
      remote.communityInfo = dashboard.communityInfo || fallback.communityInfo;
      remote.notices = dashboard.notices || fallback.notices;
    }

    if (settled[1].status === 'fulfilled' && settled[1].value && settled[1].value.data) {
      remote.communityInfo = settled[1].value.data;
    }
    if (settled[2].status === 'fulfilled' && settled[2].value && settled[2].value.data) {
      remote.notices = settled[2].value.data;
    }
    if (settled[3].status === 'fulfilled' && settled[3].value && settled[3].value.data) {
      remote.bills = settled[3].value.data;
    }
    if (settled[4].status === 'fulfilled' && settled[4].value && settled[4].value.data) {
      remote.repairs = settled[4].value.data;
    }
    if (settled[5].status === 'fulfilled' && settled[5].value && settled[5].value.data) {
      remote.visitors = settled[5].value.data;
    }
    if (settled[6].status === 'fulfilled' && settled[6].value && settled[6].value.data) {
      remote.decorations = settled[6].value.data;
    }
    if (settled[7].status === 'fulfilled' && settled[7].value && settled[7].value.data) {
      const feedbacks = settled[7].value.data;
      remote.complaints = feedbacks.filter(function (item) {
        return item.type === '投诉';
      });
      remote.praises = feedbacks.filter(function (item) {
        return item.type === '表扬';
      });
    }
    if (settled[8].status === 'fulfilled' && settled[8].value && settled[8].value.data) {
      remote.express = settled[8].value.data;
    }
    if (settled[9].status === 'fulfilled' && settled[9].value && settled[9].value.data) {
      remote.vegetableProducts = settled[9].value.data;
    }
    if (settled[10].status === 'fulfilled' && settled[10].value && settled[10].value.data) {
      remote.vegetableOrders = settled[10].value.data;
    }

    const merged = normalizeRemoteState(remote, this.globalData);
    merged.hasRemoteApi = remoteAvailable;
    merged.apiBaseUrl = this.globalData.apiBaseUrl;
    merged.openclawBaseUrl = this.globalData.openclawBaseUrl;
    merged.openclawMode = this.globalData.openclawMode;
    merged.openclawLocalBaseUrl = this.globalData.openclawLocalBaseUrl;
    merged.openclawRemoteBaseUrl = this.globalData.openclawRemoteBaseUrl;
    merged.runtimeEnv = this.globalData.runtimeEnv;
    this.applyState(merged);
    this.flushPendingFeedbackQueue();
  },

  setAuthState(token, userInfo, communityInfo) {
    this.globalData.token = token || '';
    this.globalData.userInfo = userInfo || this.globalData.userInfo;
    this.globalData.communityInfo = communityInfo || this.globalData.communityInfo;
    this.globalData.isLoggedIn = true;
    this.syncLegacyState();
    wx.setStorageSync('isLoggedIn', true);
    wx.setStorageSync('authToken', this.globalData.token);
    wx.setStorageSync('userInfo', this.globalData.userInfo);
    wx.setStorageSync('communityInfo', this.globalData.communityInfo);
  },

  normalizeHouseLabel(value) {
    return String(value || '')
      .replace(/\s+/g, '')
      .replace(/[室号楼栋单元-]/g, '')
      .replace(/[^\dA-Za-z\u4e00-\u9fa5]+/g, '')
      .trim();
  },

  sameHouseLabel(left, right) {
    const leftText = this.normalizeHouseLabel(left);
    const rightText = this.normalizeHouseLabel(right);
    if (!leftText || !rightText) {
      return false;
    }
    if (leftText === rightText) {
      return true;
    }
    const leftDigits = leftText.replace(/\D+/g, '');
    const rightDigits = rightText.replace(/\D+/g, '');
    return !!leftDigits && leftDigits === rightDigits;
  },

  toTextArray(value) {
    if (Array.isArray(value)) {
      return value.map((item) => String(item || '').trim()).filter(Boolean);
    }
    if (value == null) {
      return [];
    }
    return String(value)
      .split(/[、,;|\n]/g)
      .map((item) => item.trim())
      .filter(Boolean);
  },

  getVisibleBills(bills, userInfo, communityInfo) {
    const list = Array.isArray(bills) ? bills : [];
    const user = userInfo || this.globalData.userInfo || {};
    const community = communityInfo || this.globalData.communityInfo || {};
    const userHouseId = String(user.houseId || '').trim();
    const userHouseNo = String(user.houseNo || user.room || '').trim();
    const userHouseIds = this.toTextArray(user.houseIds || user.houseId);
    const userHouseNos = this.toTextArray(user.houseNos || user.houseNo || user.room);
    const userCommunity = String(user.community || community.name || '').trim();
    const hasHouseBinding = !!(userHouseId || userHouseIds.length || userHouseNo || userHouseNos.length || String(user.building || '').trim() || String(user.unit || '').trim() || String(user.room || '').trim());
    if (!userHouseId && !userHouseIds.length && !userHouseNo && !userHouseNos.length && !userCommunity) {
      return list.slice();
    }
    return list.filter((bill) => {
      if (!bill) {
        return false;
      }
      const billHouseId = String(bill.houseId || '').trim();
      const billHouseNo = String(bill.houseNo || bill.room || '').trim();
      const billCommunity = String(bill.community || '').trim();
      if (userHouseId && billHouseId && userHouseId === billHouseId) {
        return true;
      }
      if (userHouseIds.length && billHouseId && userHouseIds.includes(billHouseId)) {
        return true;
      }
      if (userHouseNo && billHouseNo && this.sameHouseLabel(userHouseNo, billHouseNo)) {
        return true;
      }
      if (userHouseNo && billHouseNo && this.sameHouseLabel(user.room || userHouseNo, billHouseNo)) {
        return true;
      }
      if (userHouseNos.length && billHouseNo && userHouseNos.some((item) => this.sameHouseLabel(item, billHouseNo))) {
        return true;
      }
      if (hasHouseBinding) {
        return false;
      }
      if (userCommunity && billCommunity && userCommunity === billCommunity) {
        return true;
      }
      return false;
    });
  },

  addRepair(repair) {
    if (!repair) {
      return;
    }
    this.globalData.repairs = [repair].concat(this.globalData.repairs || []);
    this.syncLegacyState();
  },

  createLocalRepair(payload) {
    const titleMap = {
      water: '水管维修',
      electric: '电路维修',
      lock: '门锁服务',
      gas: '燃气维修'
    };
    const title = titleMap[payload.type] || '其他报修';
    return {
      id: String(Date.now()),
      title: title,
      category: payload.type,
      categoryName: title,
      icon: payload.type === 'water' ? '💧' : payload.type === 'electric' ? '💡' : payload.type === 'lock' ? '🔐' : payload.type === 'gas' ? '🔥' : '🔧',
      description: payload.description,
      status: 'pending',
      statusName: '待处理',
      createTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
      appointmentTime: payload.appointmentDate ? `${payload.appointmentDate} ${payload.appointmentSlot || ''}` : '',
      appointmentDate: payload.appointmentDate,
      appointmentSlot: payload.appointmentSlot,
      phone: payload.phone || (this.globalData.userInfo && this.globalData.userInfo.phone) || '',
      handler: '',
      handlerPhone: '',
      comments: []
    };
  },

  updateBill(updatedBill) {
    if (!updatedBill || !updatedBill.id) {
      return;
    }
    const bills = this.globalData.bills || [];
    const index = bills.findIndex(function (item) {
      return item.id === updatedBill.id;
    });
    if (index !== -1) {
      bills[index] = Object.assign({}, bills[index], updatedBill);
      this.globalData.bills = bills;
      this.syncLegacyState();
    }
  },

  payBillLocally(id, payload) {
    const bills = this.globalData.bills || [];
    const bill = bills.find(function (item) {
      return item.id === id;
    });
    if (bill) {
      bill.status = 'paid';
      bill.paidDate = new Date().toISOString().slice(0, 10);
      bill.paymentMethod = payload && payload.paymentMethod ? payload.paymentMethod : 'wechat';
    }
    this.globalData.bills = bills;
    this.syncLegacyState();
    return bill;
  },

  addFeedback(feedback) {
    if (!feedback) {
      return;
    }
    if (feedback.type === '表扬') {
      this.globalData.praises = [feedback].concat(this.globalData.praises || []);
    } else {
      this.globalData.complaints = [feedback].concat(this.globalData.complaints || []);
    }
    this.syncLegacyState();
  },

  createLocalFeedback(payload, localRequestId) {
    return {
      id: String(Date.now()),
      localRequestId: localRequestId || '',
      syncStatus: 'pending',
      type: payload.type,
      category: payload.category || payload.type,
      content: payload.content,
      staffName: payload.staffName || '',
      staffPosition: payload.staffPosition || '',
      location: payload.location || '',
      phone: payload.phone || '',
      status: 'pending',
      statusText: '待处理',
      reply: '',
      createTime: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };
  },

  addVisitor(visitor) {
    if (!visitor) {
      return;
    }
    this.globalData.visitors = [visitor].concat(this.globalData.visitors || []);
    this.syncLegacyState();
  },

  createLocalVisitor(payload) {
    const hours = payload.expireHours || 24;
    const expireDate = new Date();
    expireDate.setHours(expireDate.getHours() + hours);
    return {
      id: String(Date.now()),
      visitorName: payload.visitorName,
      visitorPhone: payload.visitorPhone,
      visitPurpose: payload.visitPurpose || '走亲访友',
      passCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      status: 'active',
      statusText: '有效',
      visitTime: new Date().toISOString().slice(0, 16).replace('T', ' '),
      expireTime: expireDate.toISOString().slice(0, 16).replace('T', ' ')
    };
  },

  addDecoration(decoration) {
    if (!decoration) {
      return;
    }
    this.globalData.decorations = [decoration].concat(this.globalData.decorations || []);
    this.syncLegacyState();
  },

  createLocalDecoration(payload) {
    return {
      id: String(Date.now()),
      decorationType: payload.decorationType,
      icon: payload.decorationType === '局部装修' ? '🔧' : payload.decorationType === '整体翻新' ? '🏠' : payload.decorationType === '水电改造' ? '⚡' : payload.decorationType === '墙面刷新' ? '🎨' : '📝',
      area: payload.area,
      description: payload.description || `${payload.area}装修`,
      startDate: payload.startDate,
      endDate: payload.endDate,
      company: payload.company || '个人装修',
      phone: payload.phone || '',
      status: 'pending',
      statusText: '待审核',
      applyDate: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };
  },

  addVegetableOrder(order) {
    if (!order) {
      return;
    }
    this.globalData.vegetableOrders = [order].concat(this.globalData.vegetableOrders || []);
    this.syncLegacyState();
  },

  createLocalVegetableOrder(payload) {
    const items = payload.items || [];
    let totalAmount = 0;
    items.forEach(function (item) {
      totalAmount += Number(item.price || 0) * Number(item.count || 1);
    });
    return {
      id: String(Date.now()),
      orderNo: `VEG${Date.now()}`,
      items: items,
      totalAmount: totalAmount,
      status: 'pending',
      statusText: '待处理',
      createTime: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };
  }
});
