const app = getApp();

Page({
  data: {
    complaintList: [],
    showModal: false,
    complaintTypes: ['噪音投诉', '环境问题', '服务投诉', '设施问题', '其他建议'],
    selectedType: 0,
    formData: {
      title: '',
      description: '',
      phone: ''
    }
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    const globalData = app.globalData;
    
    // 处理状态显示
    const complaintList = globalData.complaintList.map(item => ({
      ...item,
      statusText: this.getStatusText(item.status),
      replyTime: item.reply ? '2026-04-02 10:00' : ''
    }));

    this.setData({ complaintList });
  },

  getStatusText(status) {
    const statusMap = {
      pending: '待处理',
      replied: '已回复',
      processing: '处理中',
      completed: '已完成'
    };
    return statusMap[status] || status;
  },

  showNewComplaint() {
    const user = app.globalData.user;
    this.setData({
      showModal: true,
      formData: {
        title: '',
        description: '',
        phone: user.phone
      },
      selectedType: 0
    });
  },

  hideModal() {
    this.setData({ showModal: false });
  },

  preventBubble() {
    // 阻止事件冒泡
  },

  onTypeChange(e) {
    this.setData({
      selectedType: e.detail.value
    });
  },

  onTitleInput(e) {
    this.setData({
      'formData.title': e.detail.value
    });
  },

  onDescInput(e) {
    this.setData({
      'formData.description': e.detail.value
    });
  },

  onPhoneInput(e) {
    this.setData({
      'formData.phone': e.detail.value
    });
  },

  submitComplaint() {
    const { formData, selectedType } = this.data;

    if (!formData.title.trim()) {
      wx.showToast({ title: '请输入标题', icon: 'none' });
      return;
    }
    if (!formData.description.trim()) {
      wx.showToast({ title: '请输入详细内容', icon: 'none' });
      return;
    }
    if (!formData.phone.trim()) {
      wx.showToast({ title: '请输入联系电话', icon: 'none' });
      return;
    }

    const newComplaint = {
      id: Date.now(),
      title: formData.title,
      type: this.data.complaintTypes[selectedType],
      description: formData.description,
      status: 'pending',
      statusText: '待处理',
      createTime: new Date().toISOString().replace('T', ' ').substr(0, 16)
    };

    // 添加到全局数据
    app.globalData.complaintList.unshift(newComplaint);

    wx.showToast({
      title: '提交成功',
      icon: 'success'
    });

    this.hideModal();
    this.loadData();
  }
});
