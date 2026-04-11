const app = getApp();

const STORAGE_FEEDBACK_DRAFT = 'assistantPendingFeedbackDraft';

function normalizeText(value) {
  return String(value || '').trim();
}

Page({
  data: {
    currentTab: 'complaint',
    complaintType: '投诉',
    complaintList: [],
    praiseList: [],
    showComplaintModal: false,
    showPraiseModal: false,
    complaintForm: {
      location: '',
      content: ''
    },
    praiseForm: {
      staffName: '',
      staffPosition: '',
      content: ''
    },
    canSubmitComplaint: false,
    canSubmitPraise: false
  },

  onLoad() {
    this.loadData();
    this.applyAssistantDraft();
  },

  onShow() {
    this.loadData();
    this.applyAssistantDraft();
  },

  // 加载数据
  loadData() {
    const complaints = app.globalData.complaints || app.globalData.complaintList || [];
    const praises = app.globalData.praises || app.globalData.praiseList || [];
    this.setData({
      complaintList: complaints,
      praiseList: praises
    });
  },

  applyAssistantDraft() {
    try {
      const draft = wx.getStorageSync(STORAGE_FEEDBACK_DRAFT);
      if (!draft || typeof draft !== 'object') {
        return;
      }
      const feedbackType = normalizeText(draft.feedbackType || draft.type || '投诉');
      if (feedbackType === '表扬') {
        this.setData({
          currentTab: 'praise',
          showPraiseModal: true,
          praiseForm: {
            staffName: draft.staffName || '',
            staffPosition: draft.staffPosition || '',
            content: draft.content || draft.title || ''
          },
          canSubmitPraise: Boolean(normalizeText(draft.staffName || '').length && normalizeText(draft.content || draft.title || '').length)
        });
      } else {
        this.setData({
          currentTab: 'complaint',
          complaintType: draft.category || '投诉',
          showComplaintModal: true,
          complaintForm: {
            location: draft.location || '',
            content: draft.content || draft.title || ''
          },
          canSubmitComplaint: Boolean(normalizeText(draft.content || draft.title || '').length)
        });
      }
      wx.removeStorageSync(STORAGE_FEEDBACK_DRAFT);
      wx.showToast({ title: '已填入AI草稿', icon: 'none' });
    } catch (error) {
      // ignore draft apply errors
    }
  },

  // 切换Tab
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab });
  },

  // 快速投诉
  quickComplaint(e) {
    const type = e.currentTarget.dataset.type;
    const typeIcons = {
      '环境卫生': '🧹',
      '噪音扰民': '🔊',
      '安全隐患': '⚠️',
      '设施损坏': '🔧',
      '停车问题': '🚗',
      '其他': '📝'
    };
    
    this.setData({
      complaintType: type,
      showComplaintModal: true,
      complaintForm: {
        location: '',
        content: ''
      },
      canSubmitComplaint: false
    });
  },

  // 隐藏投诉弹窗
  hideComplaintModal() {
    this.setData({ showComplaintModal: false });
  },

  // 隐藏表扬弹窗
  hidePraiseModal() {
    this.setData({ showPraiseModal: false });
  },

  // 阻止冒泡
  preventBubble() {},

  // 投诉表单输入
  onFormInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`complaintForm.${field}`]: value
    });
    this.updateComplaintSubmit();
  },

  onFormTextarea(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`complaintForm.${field}`]: value
    });
    this.updateComplaintSubmit();
  },

  // 更新投诉提交状态
  updateComplaintSubmit() {
    const content = this.data.complaintForm.content;
    const canSubmit = content && content.trim().length > 0;
    this.setData({ canSubmitComplaint: canSubmit });
  },

  // 提交投诉
  async submitComplaint() {
    if (!this.data.canSubmitComplaint) {
      wx.showToast({ title: '请描述问题详情', icon: 'none' });
      return;
    }

    const { complaintType, complaintForm } = this.data;
    
    const typeIcons = {
      '环境卫生': '🧹',
      '噪音扰民': '🔊',
      '安全隐患': '⚠️',
      '设施损坏': '🔧',
      '停车问题': '🚗',
      '其他': '📝'
    };

    wx.showLoading({ title: '提交中...', mask: true });

    try {
      const created = await app.services.createFeedback({
        type: '投诉',
        category: complaintType,
        content: complaintForm.content,
        location: complaintForm.location,
        phone: app.globalData.userInfo && app.globalData.userInfo.phone
      });
      wx.hideLoading();
      wx.showToast({
        title: created && created.syncStatus === 'pending' ? '已本地保存' : '提交成功',
        icon: created && created.syncStatus === 'pending' ? 'none' : 'success',
        duration: 2000
      });
      this.setData({ showComplaintModal: false });
      this.loadData();
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: error.message || '提交失败',
        icon: 'none'
      });
    }
  },

  // 显示表扬弹窗
  showPraiseModal() {
    this.setData({
      showPraiseModal: true,
      praiseForm: {
        staffName: '',
        staffPosition: '',
        content: ''
      },
      canSubmitPraise: false
    });
  },

  // 表扬表单输入
  onPraiseInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`praiseForm.${field}`]: value
    });
    this.updatePraiseSubmit();
  },

  onPraiseTextarea(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`praiseForm.${field}`]: value
    });
    this.updatePraiseSubmit();
  },

  // 更新表扬提交状态
  updatePraiseSubmit() {
    const { staffName, content } = this.data.praiseForm;
    const canSubmit = staffName.trim().length > 0 && content && content.trim().length > 0;
    this.setData({ canSubmitPraise: canSubmit });
  },

  // 提交表扬
  async submitPraise() {
    if (!this.data.canSubmitPraise) {
      wx.showToast({ title: '请完善表扬信息', icon: 'none' });
      return;
    }

    const { praiseForm } = this.data;
    const userInfo = app.globalData.userInfo || {};

    wx.showLoading({ title: '提交中...', mask: true });

    try {
      await app.services.createFeedback({
        type: '表扬',
        category: praiseForm.staffPosition || '物业员工',
        content: praiseForm.content,
        staffName: praiseForm.staffName,
        staffPosition: praiseForm.staffPosition,
        phone: app.globalData.userInfo && app.globalData.userInfo.phone
      });
      wx.hideLoading();
      wx.showToast({
        title: '感谢您的表扬',
        icon: 'success',
        duration: 2000
      });
      this.setData({ showPraiseModal: false });
      this.loadData();
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: error.message || '提交失败',
        icon: 'none'
      });
    }
  },

  // 格式化时间
  formatTime(date) {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    return `${month}-${day} ${hour}:${minute}`;
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  }
});
