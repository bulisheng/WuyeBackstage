const app = getApp();

Page({
  data: {
    user: {},
    unpaidAmount: 0,
    paidAmount: 0,
    repairCount: 0,
    complaintCount: 0
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    const globalData = app.globalData;
    const user = globalData.user;
    
    // 计算费用统计
    const allFees = globalData.propertyFee.details;
    const unpaidAmount = allFees.filter(item => item.status === 'unpaid')
      .reduce((sum, item) => sum + item.amount, 0);
    const paidAmount = allFees.filter(item => item.status === 'paid')
      .reduce((sum, item) => sum + item.amount, 0);
    
    this.setData({
      user,
      unpaidAmount: unpaidAmount.toFixed(2),
      paidAmount: paidAmount.toFixed(2),
      repairCount: globalData.repairList.length,
      complaintCount: globalData.complaintList.length
    });
  },

  goToRepair() {
    wx.switchTab({ url: '/pages/repair/repair' });
  },

  goToComplaint() {
    wx.navigateTo({ url: '/pages/complaint/complaint' });
  },

  goToFee() {
    wx.switchTab({ url: '/pages/property-fee/property-fee' });
  },

  callService() {
    wx.makePhoneCall({
      phoneNumber: '400-888-8888',
      fail: () => {
        wx.showToast({
          title: '拨打失败',
          icon: 'none'
        });
      }
    });
  },

  showAbout() {
    wx.showModal({
      title: '关于我们',
      content: '盛兴物业管理系统 v1.0\n为您提供优质的物业管理服务',
      showCancel: false
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  }
});
