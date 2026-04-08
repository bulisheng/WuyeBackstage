const app = getApp();

Page({
  data: {
    records: [],
    decorationTypes: ['局部装修', '整体翻新', '水电改造', '墙面刷新', '其他'],
    areas: ['客厅', '卧室', '厨房', '卫生间', '阳台', '全屋'],
    showModal: false,
    formData: {
      decorationType: '',
      area: '',
      description: '',
      startDate: '',
      endDate: '',
      company: '',
      phone: ''
    },
    phone: '',
    agreed: false,
    canSubmit: false,
    minDate: ''
  },

  onLoad() {
    this.initData();
  },

  onShow() {
    this.loadRecords();
  },

  initData() {
    // 设置最小日期（今天）
    const today = new Date();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    this.setData({
      minDate: `${today.getFullYear()}-${month}-${day}`,
      phone: app.globalData.userInfo?.phone || ''
    });

    // 默认选择3天后的日期
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() + 3);
    this.setData({
      'formData.startDate': this.formatDate(startDate)
    });
  },

  // 加载记录
  loadRecords() {
    const records = app.globalData.decorations || [];
    this.setData({ records });
  },

  // 显示申请弹窗
  showApplyModal() {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() + 3);
    
    this.setData({
      showModal: true,
      formData: {
        decorationType: '',
        area: '',
        description: '',
        startDate: this.formatDate(startDate),
        endDate: '',
        company: '',
        phone: this.data.phone
      },
      agreed: false,
      canSubmit: false
    });
  },

  // 隐藏弹窗
  hideModal() {
    this.setData({ showModal: false });
  },

  // 阻止冒泡
  preventBubble() {},

  // 选择装修类型
  selectType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ 'formData.decorationType': type });
    this.updateCanSubmit();
  },

  // 选择施工区域
  selectArea(e) {
    const area = e.currentTarget.dataset.area;
    this.setData({ 'formData.area': area });
    this.updateCanSubmit();
  },

  // 输入处理
  onInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`formData.${field}`]: value
    });
    this.updateCanSubmit();
  },

  // 选择开始日期
  onStartDateChange(e) {
    const date = e.detail.value;
    this.setData({
      'formData.startDate': date,
      'formData.endDate': '' // 清空结束日期，重新选择
    });
    this.updateCanSubmit();
  },

  // 选择结束日期
  onEndDateChange(e) {
    const date = e.detail.value;
    this.setData({ 'formData.endDate': date });
    this.updateCanSubmit();
  },

  // 切换协议
  toggleAgreement() {
    const agreed = !this.data.agreed;
    this.setData({ agreed });
    this.updateCanSubmit();
  },

  // 更新提交按钮状态
  updateCanSubmit() {
    const { decorationType, area, description, startDate, endDate, phone } = this.data.formData;
    const { agreed } = this.data;
    
    const canSubmit = decorationType && area && startDate && endDate && phone && agreed;
    this.setData({ canSubmit });
  },

  // 格式化日期
  formatDate(date) {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  },

  // 提交申请
  submitApply() {
    if (!this.data.canSubmit) {
      wx.showToast({ title: '请完善申请信息', icon: 'none' });
      return;
    }

    const { decorationType, area, description, startDate, endDate, company, phone } = this.data.formData;
    
    const typeIcons = {
      '局部装修': '🔧',
      '整体翻新': '🏠',
      '水电改造': '⚡',
      '墙面刷新': '🎨',
      '其他': '📝'
    };

    const newRecord = {
      id: Date.now().toString(),
      decorationType,
      icon: typeIcons[decorationType] || '📝',
      area,
      description: description || `${area}装修`,
      startDate,
      endDate,
      company: company || '个人装修',
      phone,
      status: 'pending',
      statusText: '待审核',
      applyDate: this.formatTime(new Date())
    };

    app.globalData.decorations = [newRecord, ...(app.globalData.decorations || [])];

    wx.showLoading({ title: '提交中...', mask: true });
    
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '提交成功',
        icon: 'success',
        duration: 2000
      });
      
      this.setData({ showModal: false });
      this.loadRecords();
    }, 800);
  },

  // 格式化时间
  formatTime(date) {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}-${day}`;
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  }
});
