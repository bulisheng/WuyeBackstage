const app = getApp();

Page({
  data: {
    userInfo: {},
    communityInfo: {},
    unpaidCount: 0,
    repairCount: 0,
    noticeCount: 0
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    const appData = app.globalData;
    const visibleBills = typeof app.getVisibleBills === 'function'
      ? app.getVisibleBills(appData.bills || [], appData.userInfo, appData.communityInfo)
      : (appData.visibleBills || appData.bills || []);
    this.setData({
      userInfo: appData.userInfo || {},
      communityInfo: appData.communityInfo || {},
      unpaidCount: visibleBills.filter(bill => bill.status === 'unpaid').length,
      repairCount: (appData.repairs || []).length,
      noticeCount: (appData.notices || []).filter(notice => notice.important).length
    });
  },

  // 跳转缴费
  goToPayment() {
    wx.navigateTo({
      url: '/pages/payment/payment'
    });
  },

  // 跳转报修
  goToRepair() {
    wx.navigateTo({
      url: '/pages/repair/repair'
    });
  },

  // 跳转公告
  goToNotice() {
    wx.navigateTo({
      url: '/pages/notice/notice'
    });
  },

  // 联系物业
  contactProperty() {
    wx.makePhoneCall({
      phoneNumber: this.data.communityInfo.propertyPhone,
      fail: () => {
        wx.showToast({
          title: '拨打失败',
          icon: 'none'
        });
      }
    });
  },

  // 编辑信息
  editInfo() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 意见反馈
  goToFeedback() {
    wx.navigateTo({
      url: '/pages/feedback/feedback'
    });
  },

  // 关于我们
  goToAbout() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  }
});
