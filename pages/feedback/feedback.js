const app = getApp();

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
  },

  onShow() {
    this.loadData();
  },

  // 加载数据
  loadData() {
    const complaints = app.globalData.complaints || [];
    const praises = app.globalData.praises || [];
    this.setData({
      complaintList: complaints,
      praiseList: praises
    });
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
    const canSubmit = content && content.trim().length >= 5;
    this.setData({ canSubmitComplaint: canSubmit });
  },

  // 提交投诉
  submitComplaint() {
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

    const newComplaint = {
      id: Date.now().toString(),
      type: complaintType,
      icon: typeIcons[complaintType] || '📝',
      content: complaintForm.content,
      location: complaintForm.location,
      status: 'pending',
      statusText: '待处理',
      createTime: this.formatTime(new Date()),
      reply: ''
    };

    app.globalData.complaints = [newComplaint, ...(app.globalData.complaints || [])];

    wx.showLoading({ title: '提交中...', mask: true });
    
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '提交成功',
        icon: 'success',
        duration: 2000
      });
      
      this.setData({ showComplaintModal: false });
      this.loadData();
    }, 500);
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
    const canSubmit = staffName.trim().length >= 2 && content && content.trim().length >= 5;
    this.setData({ canSubmitPraise: canSubmit });
  },

  // 提交表扬
  submitPraise() {
    if (!this.data.canSubmitPraise) {
      wx.showToast({ title: '请完善表扬信息', icon: 'none' });
      return;
    }

    const { praiseForm } = this.data;
    const userInfo = app.globalData.userInfo || {};

    const newPraise = {
      id: Date.now().toString(),
      staffName: praiseForm.staffName,
      staffPosition: praiseForm.staffPosition || '物业员工',
      content: praiseForm.content,
      fromName: userInfo.name || '业主',
      createTime: this.formatTime(new Date()),
      likes: Math.floor(Math.random() * 10) + 1
    };

    app.globalData.praises = [newPraise, ...(app.globalData.praises || [])];

    wx.showLoading({ title: '提交中...', mask: true });
    
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '感谢您的表扬',
        icon: 'success',
        duration: 2000
      });
      
      this.setData({ showPraiseModal: false });
      this.loadData();
    }, 500);
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
