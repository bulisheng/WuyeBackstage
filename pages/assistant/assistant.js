const app = getApp();

const STORAGE_REPAIR_DRAFT = 'assistantPendingRepairDraft';
const STORAGE_FEEDBACK_DRAFT = 'assistantPendingFeedbackDraft';

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function nowText() {
  return new Date().toLocaleString('zh-CN', { hour12: false });
}

function stripMarkdownFence(text) {
  const value = String(text || '').trim();
  if (!value.startsWith('```')) {
    return value;
  }
  return value
    .split(/\r?\n/)
    .filter((line, index) => index === 0 ? !line.trim().startsWith('```') : !line.trim().startsWith('```'))
    .join('\n')
    .trim();
}

function extractJsonCandidate(text) {
  const value = String(text || '').trim();
  const start = value.indexOf('{');
  const end = value.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return value.slice(start, end + 1).trim();
  }
  const arrayStart = value.indexOf('[');
  const arrayEnd = value.lastIndexOf(']');
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    return value.slice(arrayStart, arrayEnd + 1).trim();
  }
  return '';
}

function normalizeAssistantReply(response) {
  const rawText = String((response && (response.replyText || response.answer || response.content || response.message || response.text)) || '').trim();
  const stripped = stripMarkdownFence(rawText);
  const candidate = extractJsonCandidate(stripped);
  if (!candidate) {
    return {
      text: stripped || '我已经收到你的问题。',
      parsed: null
    };
  }
  try {
    const parsed = JSON.parse(candidate);
    const text = String(parsed.replyText || parsed.reply || parsed.answer || parsed.content || parsed.message || parsed.text || '').trim();
    return {
      text: text || stripped || '我已经收到你的问题。',
      parsed
    };
  } catch (error) {
    return {
      text: stripped || '我已经收到你的问题。',
      parsed: null
    };
  }
}

function roleLabel(role) {
  if (role === 'user') {
    return '我';
  }
  if (role === 'assistant') {
    return '智能助手';
  }
  return '系统';
}

function normalizeMessage(message) {
  const item = Object.assign({}, message || {});
  item.roleLabel = roleLabel(item.role);
  item.messageClass = item.role === 'user' ? 'message user' : item.role === 'assistant' ? 'message assistant' : 'message system';
  item.showUser = item.role === 'user';
  item.showAssistant = item.role === 'assistant';
  item.showSystem = !item.showUser && !item.showAssistant;
  item.showCard = Boolean(item.card);
  item.showMeta = Boolean(item.meta);
  item.showAmount = Boolean(item.card && item.card.amount);
  item.showPeriod = Boolean(item.card && item.card.period);
  item.showStatus = Boolean(item.card && item.card.status);
  item.showStatusName = Boolean(item.card && item.card.statusName);
  item.showHandler = Boolean(item.card && item.card.handler);
  item.showSuggestion = Boolean(item.card && item.card.suggestion);
  item.intentText = item.meta && item.meta.intent ? String(item.meta.intent) : '';
  item.confidenceText = item.meta && item.meta.confidence !== undefined ? String(item.meta.confidence) : '';
  item.buttonText = item.buttonText || '确认并跳转';
  return item;
}

Page({
  data: {
    loading: false,
    inputText: '',
    messages: [],
    serviceCards: [],
    quickReplies: ['查物业费', '查报修', '提交报修', '提交投诉', '访客通行', '转人工'],
    session: null,
    draftCard: null,
    contextCard: {},
    contextTags: [],
    openclawUrl: '',
    sceneSummary: '问答、办事、转人工',
    canSend: false
  },

  onLoad() {
    this.bootstrap();
  },

  onShow() {
    this.syncContext();
  },

  bootstrap() {
    this.syncContext();
    this.ensureSession();
    if (!this.data.messages.length) {
      this.setData({
        messages: [
          {
            role: 'system',
            type: 'system',
            time: nowText(),
            text: '你好，我是智能助手。你可以查物业费、查报修、提交报修、提交投诉，或者直接让我转人工。'
          }
        ]
      });
    }
  },

  syncContext() {
    const community = app.globalData.communityInfo || {};
    const user = app.globalData.userInfo || {};
    const bills = safeArray(app.globalData.visibleBills || app.globalData.bills);
    const repairs = safeArray(app.globalData.repairs);
    const complaints = safeArray(app.globalData.feedbacks || app.globalData.complaints);
    const notices = safeArray(app.globalData.notices);
    const activeBills = bills.filter((bill) => bill.status === 'unpaid').slice(0, 3);
    const activeRepairs = repairs.filter((repair) => repair.status === 'processing' || repair.status === 'pending').slice(0, 3);
    this.setData({
      serviceCards: this.buildServiceCards(community),
      contextCard: {
        communityName: community.name || community.projectName || '未绑定小区',
        communityAddress: community.address || '未填写地址',
        userName: user.name || '未登录用户',
        houseNo: user.houseNo || `${user.building || ''}${user.unit || ''}${user.room || ''}` || '未绑定房屋',
        billCount: activeBills.length,
        repairCount: activeRepairs.length
      },
      contextTags: []
    });
  },

  buildServiceCards(community) {
    const enabled = {
      bill: Boolean((community || {}).enableBill !== false),
      repair: Boolean((community || {}).enableRepair !== false),
      feedback: Boolean((community || {}).enableFeedback !== false),
      visitor: Boolean((community || {}).enableVisitor !== false),
      decoration: Boolean((community || {}).enableDecoration !== false)
    };
    return [
      enabled.bill && { id: 'bill', title: '查物业费', subtitle: '查看待缴账单和缴费入口', text: '查物业费', tone: 'blue' },
      enabled.repair && { id: 'repair', title: '查报修', subtitle: '查看工单进度和处理人', text: '查报修', tone: 'cyan' },
      enabled.repair && { id: 'create_repair', title: '提交报修', subtitle: '快速生成报修草稿', text: '提交报修', tone: 'green' },
      enabled.feedback && { id: 'feedback', title: '提交投诉', subtitle: '快速生成投诉草稿', text: '提交投诉', tone: 'orange' },
      enabled.visitor && { id: 'visitor', title: '访客通行', subtitle: '访客记录和通行码查询', text: '访客通行', tone: 'violet' },
      enabled.decoration && { id: 'decoration', title: '装修申请', subtitle: '查看装修流程和提交入口', text: '装修申请', tone: 'amber' },
      { id: 'handoff', title: '联系人工', subtitle: '一键转接客服/主管', text: '转人工', tone: 'rose' }
    ].filter(Boolean);
  },

  async ensureSession() {
    if (this.data.session) {
      return;
    }
    try {
      const user = app.globalData.userInfo || {};
      const community = app.globalData.communityInfo || {};
      const session = await app.services.createAssistantSession({
        scene: 'general',
        subjectId: user.openid || user.id || '',
        prompt: '你是物业智能助手。只回答当前小区和当前房屋的问题。先判断意图，尽量短答，不闲聊，不重复上下文，必要时输出结构化 JSON。',
        inputText: '',
        communityId: community.id || '',
        houseId: user.houseId || '',
        userName: user.name || '',
        room: user.room || '',
        phone: user.phone || ''
      });
      this.setData({
        session,
        openclawUrl: session.openclawUrl || ''
      });
      this.pushSystemMessage(`已创建会话 ${session.id || ''}`.trim());
    } catch (error) {
      this.pushSystemMessage(error.message || '会话初始化失败，当前使用本地草稿模式。');
    }
  },

  pushMessage(message) {
    const messages = this.data.messages.concat(normalizeMessage({
      time: nowText(),
      ...message
    }));
    this.setData({ messages });
  },

  pushSystemMessage(text) {
    this.pushMessage({ role: 'system', type: 'system', text });
  },

  saveDraftStorage(key, value) {
    try {
      wx.setStorageSync(key, value);
    } catch (error) {
      // ignore storage errors
    }
  },

  clearDraftStorage() {
    try {
      wx.removeStorageSync(STORAGE_REPAIR_DRAFT);
      wx.removeStorageSync(STORAGE_FEEDBACK_DRAFT);
    } catch (error) {
      // ignore storage errors
    }
  },

  onInput(e) {
    const inputText = e.detail.value;
    this.setData({ inputText, canSend: Boolean(String(inputText || '').trim()) });
  },

  useQuickReply(e) {
    const text = e.currentTarget.dataset.text || '';
    this.setData({ inputText: text, canSend: true }, () => {
      this.sendMessage();
    });
  },

  tapServiceCard(e) {
    const text = e.currentTarget.dataset.text || '';
    if (!text) {
      return;
    }
    this.setData({ inputText: text, canSend: true }, () => {
      this.sendMessage();
    });
  },

  async sendMessage() {
    const text = String(this.data.inputText || '').trim();
    if (!text) {
      wx.showToast({ title: '先输入问题吧', icon: 'none' });
      return;
    }

    const community = app.globalData.communityInfo || {};
    const user = app.globalData.userInfo || {};
    const bills = safeArray(app.globalData.visibleBills || app.globalData.bills);
    const repairs = safeArray(app.globalData.repairs);

    this.pushMessage({ role: 'user', type: 'text', text });
    this.setData({ loading: true, inputText: '', canSend: false, draftCard: null });

    try {
      const response = await app.services.assistantMessage({
        sessionId: this.data.session?.id || '',
        scene: 'general',
        role: 'user',
        content: text,
        contentType: 'text',
        communityId: community.id || '',
        houseId: user.houseId || '',
        userId: user.openid || user.id || '',
        userName: user.name || '',
        room: user.room || '',
        phone: user.phone || '',
        context: {
          communityName: community.name || community.projectName || '',
          communityAddress: community.address || '',
          userName: user.name || '',
          houseNo: user.houseNo || `${user.building || ''}${user.unit || ''}${user.room || ''}`,
          billCount: bills.length,
          repairCount: repairs.length,
          featureBill: Boolean((app.globalData.communityInfo || {}).enableBill !== false),
          featureRepair: Boolean((app.globalData.communityInfo || {}).enableRepair !== false),
          featureFeedback: Boolean((app.globalData.communityInfo || {}).enableFeedback !== false),
          featureVisitor: Boolean((app.globalData.communityInfo || {}).enableVisitor !== false),
          featureDecoration: Boolean((app.globalData.communityInfo || {}).enableDecoration !== false)
        }
      });

      const normalizedReply = normalizeAssistantReply(response);
      const payload = Object.assign({}, response, normalizedReply.parsed || {});
      const intentName = String(payload.intent || payload.action?.type || 'general');
      const confidence = Number(payload.confidence || 0);
      const summary = String(payload.reason || text);
      const quickReplies = safeArray(payload.quickReplies).length ? payload.quickReplies : ['查物业费', '查报修', '提交报修', '提交投诉', '转人工'];
      const assistantText = normalizedReply.text || payload.replyText || payload.answer || '我已经收到你的问题。';
      const message = {
        role: 'assistant',
        type: payload.needConfirm || payload.handoff ? 'card' : 'text',
        text: assistantText,
        meta: {
          intent: intentName,
          confidence,
          summary
        }
      };

      if (payload.action) {
        message.action = payload.action;
      }

      if (payload.action && payload.action.type === 'query_bill') {
        const unpaid = bills.filter((bill) => bill.status === 'unpaid');
        const firstBill = unpaid[0] || bills[0] || null;
        message.title = '账单查询结果';
        message.card = firstBill ? {
          type: firstBill.type || 'property',
          title: firstBill.title || '物业费',
          amount: firstBill.amount || '',
          period: firstBill.period || '',
          status: firstBill.status || 'unpaid'
        } : null;
      }

      if (payload.action && payload.action.type === 'query_repair') {
        const active = repairs.filter((repair) => repair.status === 'processing' || repair.status === 'pending').slice(0, 3);
        message.title = '报修进度';
        message.card = active[0] ? {
          title: active[0].title || '报修',
          statusName: active[0].statusName || '处理中',
          handler: active[0].handler || '暂未分派',
          appointmentTime: active[0].appointmentTime || ''
        } : null;
      }

      if (payload.needConfirm && payload.action && (payload.action.type === 'create_repair' || payload.action.type === 'create_feedback')) {
        const params = payload.action.params || {};
        const actionType = payload.action.type;
        this.setData({
          draftCard: {
            title: params.title || assistantText || text,
            category: params.category || 'other',
            suggestion: params.suggestion || payload.replyText || '请补充更多信息后再确认。',
            actionType,
            payload: params,
            buttonText: actionType === 'create_repair' ? '确认并去报修' : '确认并去投诉',
            targetPage: actionType === 'create_repair' ? '/pages/repair/repair' : '/pages/feedback/feedback'
          }
        });
        message.type = 'card';
        message.title = actionType === 'create_repair' ? '报修草稿已生成' : '反馈草稿已生成';
        message.card = {
          title: params.title || assistantText || text,
          category: params.category || '',
          suggestion: params.suggestion || payload.replyText || ''
        };
      }

      if (payload.handoff) {
        message.type = 'card';
        message.title = '转人工中';
        message.text = assistantText || '已记录你的问题，稍后会由人工客服继续跟进。';
      }

      this.pushMessage(message);

      if (payload.handoff) {
        try {
          const handoff = await app.services.assistantHandoff({
            sessionId: this.data.session?.id || payload.sessionId || '',
            reason: payload.reason || text,
            communityId: community.id || '',
            houseId: user.houseId || '',
            userId: user.openid || user.id || '',
            userName: user.name || '',
            phone: user.phone || ''
          });
          this.pushSystemMessage(`已转人工：${handoff.ticketId || ''}`.trim());
        } catch (handoffError) {
          this.pushSystemMessage(handoffError.message || '转人工记录失败');
        }
      }

      if (payload.openclawUrl && payload.openclawUrl !== this.data.openclawUrl) {
        this.setData({ openclawUrl: payload.openclawUrl });
      }
      this.setData({
        loading: false,
        quickReplies
      });
    } catch (error) {
      this.pushMessage({
        role: 'assistant',
        type: 'text',
        text: error.message || '智能助手暂时不可用，你可以先使用快捷入口。',
        meta: { intent: 'general', confidence: 0 }
      });
      this.setData({
        loading: false,
        quickReplies: ['查物业费', '查报修', '提交报修', '提交投诉', '转人工']
      });
    }
  },

  confirmDraft() {
    const draft = this.data.draftCard || {};
    if (!draft.title) {
      wx.showToast({ title: '没有可确认的草稿', icon: 'none' });
      return;
    }
    const user = app.globalData.userInfo || {};
    const community = app.globalData.communityInfo || {};
    const payload = draft.payload || {};
    if (draft.actionType === 'create_repair') {
      this.saveDraftStorage(STORAGE_REPAIR_DRAFT, {
        source: 'assistant',
        title: draft.title,
        category: payload.category || payload.type || draft.category || '',
        categoryName: payload.categoryName || '',
        description: payload.description || draft.title,
        appointmentDate: payload.appointmentDate || '',
        appointmentSlot: payload.appointmentSlot || '',
        phone: payload.phone || user.phone || '',
        communityId: community.id || '',
        community: community.name || community.projectName || '',
        createdAt: nowText()
      });
      this.setData({ draftCard: null });
      this.pushSystemMessage('已将报修草稿带到报修页。');
      wx.navigateTo({ url: '/pages/repair/repair' });
      return;
    }
    if (draft.actionType === 'create_feedback') {
      this.saveDraftStorage(STORAGE_FEEDBACK_DRAFT, {
        source: 'assistant',
        feedbackType: payload.type || '投诉',
        category: payload.category || draft.category || '其他',
        location: payload.location || '',
        content: payload.content || draft.title,
        staffName: payload.staffName || '',
        staffPosition: payload.staffPosition || '',
        phone: payload.phone || user.phone || '',
        communityId: community.id || '',
        community: community.name || community.projectName || '',
        createdAt: nowText()
      });
      this.setData({ draftCard: null });
      this.pushSystemMessage('已将投诉草稿带到反馈页。');
      wx.navigateTo({ url: '/pages/feedback/feedback' });
      return;
    }
    wx.showToast({ title: '当前草稿暂不支持跳转', icon: 'none' });
  },

  cancelDraft() {
    this.clearDraftStorage();
    this.setData({ draftCard: null });
    this.pushSystemMessage('已取消当前草稿。');
  },

  copySessionUrl() {
    if (!this.data.openclawUrl) {
      wx.showToast({ title: '暂无会话链接', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: this.data.openclawUrl,
      success: () => wx.showToast({ title: '已复制会话链接', icon: 'success' })
    });
  }
});
