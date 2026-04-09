const app = getApp();

Page({
  data: {
    stats: {
      activeCount: 0,
      todayCount: 0,
      totalCount: 0
    },
    records: [],
    purposes: ['走亲访友', '家政服务', '快递外卖', '朋友聚会', '其他'],
    expireOptions: [
      { value: 24, label: '当天' },
      { value: 72, label: '3天' },
      { value: 168, label: '7天' }
    ],
    showModal: false,
    showCodeModal: false,
    formData: {
      visitorName: '',
      visitorPhone: '',
      visitPurpose: '走亲访友',
      expireHours: 24
    },
    generatedCode: '',
    expireText: '',
    canSubmit: false
  },

  onLoad() {
    this.loadRecords();
  },

  onShow() {
    this.loadRecords();
  },

  // 加载通行记录
  loadRecords() {
    const records = app.globalData.visitors || [];
    const today = new Date().toDateString();
    
    // 计算统计数据
    const activeCount = records.filter(r => r.status === 'active').length;
    const todayCount = records.filter(r => r.visitTime && new Date(r.visitTime).toDateString() === today).length;
    
    this.setData({
      records: records.slice(0, 5), // 只显示最近5条
      stats: {
        activeCount,
        todayCount,
        totalCount: records.length
      }
    });
  },

  // 显示添加访客弹窗
  showAddVisitor() {
    this.setData({
      showModal: true,
      formData: {
        visitorName: '',
        visitorPhone: '',
        visitPurpose: '走亲访友',
        expireHours: 24
      },
      canSubmit: false
    });
  },

  // 隐藏弹窗
  hideModal() {
    this.setData({ showModal: false });
  },

  hideCodeModal() {
    this.setData({ showCodeModal: false });
  },

  // 阻止冒泡
  preventBubble() {},

  // 输入处理
  onInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`formData.${field}`]: value
    });
    this.updateCanSubmit();
  },

  // 选择访问目的
  selectPurpose(e) {
    const purpose = e.currentTarget.dataset.purpose;
    this.setData({
      'formData.visitPurpose': purpose
    });
    this.updateCanSubmit();
  },

  // 选择有效期
  selectExpire(e) {
    const hours = e.currentTarget.dataset.expire;
    this.setData({
      'formData.expireHours': hours
    });
  },

  // 更新提交按钮状态
  updateCanSubmit() {
    const { visitorName, visitorPhone } = this.data.formData;
    const canSubmit = visitorName.trim().length > 0 && /^1[3-9]\d{9}$/.test(visitorPhone);
    this.setData({ canSubmit });
  },

  // 生成通行码
  generateCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  },

  // 提交访客
  async submitVisitor() {
    if (!this.data.canSubmit) {
      wx.showToast({ title: '请完善信息', icon: 'none' });
      return;
    }

    const { visitorName, visitorPhone, visitPurpose, expireHours } = this.data.formData;
    const code = this.generateCode();
    
    // 计算过期时间
    const expireDate = new Date();
    expireDate.setHours(expireDate.getHours() + expireHours);
    const expireText = `${expireDate.getMonth() + 1}/${expireDate.getDate()} ${expireDate.getHours()}:${expireDate.getMinutes().toString().padStart(2, '0')}`;

    wx.showLoading({ title: '生成中...', mask: true });

    try {
      const newRecord = await app.services.createVisitor({
        visitorName: visitorName,
        visitorPhone: visitorPhone,
        visitPurpose: visitPurpose,
        expireHours: expireHours,
        passCode: code
      });
      newRecord.expireTime = newRecord.expireTime || expireText;
      newRecord.passCode = newRecord.passCode || code;

      wx.hideLoading();
      this.setData({
        showModal: false,
        showCodeModal: true,
        generatedCode: newRecord.passCode,
        expireText: newRecord.expireTime || expireText
      });
      this.loadRecords();
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: error.message || '生成失败',
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

  // 查看历史
  goToHistory() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  }
});
