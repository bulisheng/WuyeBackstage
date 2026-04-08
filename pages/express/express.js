const app = getApp();

Page({
  data: {
    stats: {
      pending: 2,
      today: 1,
      total: 15
    },
    expressList: [
      {
        id: 1,
        company: '顺丰速运',
        arriveTime: '2026-04-08 14:30',
        code: 'A-12-365',
        status: 'pending',
        statusText: '待取件'
      },
      {
        id: 2,
        company: '中通快递',
        arriveTime: '2026-04-08 10:15',
        code: 'B-05-128',
        status: 'pending',
        statusText: '待取件'
      }
    ],
    sendList: [
      {
        id: 1,
        company: '顺丰速运',
        from: '本小区',
        to: '北京市朝阳区',
        createTime: '2026-04-05',
        status: 'completed',
        statusText: '已完成'
      }
    ]
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    // 模拟加载数据
    const mockStats = {
      pending: 2,
      today: 1,
      total: 15
    };
    this.setData({ stats: mockStats });
  },

  // 刷新列表
  refreshList() {
    wx.showLoading({ title: '刷新中...' });
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '刷新成功',
        icon: 'success'
      });
      this.loadData();
    }, 1000);
  },

  // 确认取件
  confirmPickup(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认取件',
      content: '确定已收到快递？',
      success: (res) => {
        if (res.confirm) {
          const list = this.data.expressList.filter(item => item.id !== id);
          this.setData({
            expressList: list,
            'stats.pending': this.data.stats.pending - 1
          });
          wx.showToast({
            title: '取件成功',
            icon: 'success'
          });
        }
      }
    });
  },

  // 异常反馈
  reportAbnormal(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '异常反馈',
      content: '请选择异常类型',
      cancelText: '取消',
      confirmText: '确定',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '已提交反馈',
            icon: 'success'
          });
        }
      }
    });
  },

  // 跳转寄件
  goToSend() {
    wx.showModal({
      title: '预约寄件',
      content: '请填写寄件信息，快递员将上门取件',
      cancelText: '取消',
      confirmText: '确定',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '预约成功',
            icon: 'success'
          });
        }
      }
    });
  },

  // 查看寄件详情
  viewSendDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.showToast({
      title: '查看详情',
      icon: 'none'
    });
  }
});
