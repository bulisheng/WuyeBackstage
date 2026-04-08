const app = getApp();

Page({
  data: {
    userInfo: {},
    communityInfo: {},
    notices: [],
    unpaidBills: [],
    processingRepairs: []
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    const appData = app.globalData;
    this.setData({
      userInfo: appData.userInfo,
      communityInfo: appData.communityInfo,
      notices: appData.notices,
      unpaidBills: appData.bills.filter(bill => bill.status === 'unpaid').slice(0, 2),
      processingRepairs: appData.repairs.filter(repair => repair.status === 'processing')
    });
  },

  // 跳转到缴费页面
  goToPayment() {
    wx.navigateTo({
      url: '/pages/payment/payment'
    });
  },

  // 跳转到缴费详情
  goToPaymentDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/payment/paymentDetail/paymentDetail?id=' + id
    });
  },

  // 跳转到报修页面
  goToRepair() {
    wx.navigateTo({
      url: '/pages/repair/repair'
    });
  },

  // 跳转到报修详情
  goToRepairDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/repair/repairDetail/repairDetail?id=' + id
    });
  },

  // 跳转到访客通行
  goToVisitor() {
    wx.navigateTo({
      url: '/pages/visitor/visitor'
    });
  },

  // 跳转到装修登记
  goToDecoration() {
    wx.navigateTo({
      url: '/pages/decoration/decoration'
    });
  },

  // 跳转到快递代寄
  goToExpress() {
    wx.navigateTo({
      url: '/pages/express/express'
    });
  },

  // 跳转到蔬菜代买
  goToVegetable() {
    wx.navigateTo({
      url: '/pages/vegetable/vegetable'
    });
  },

  // 跳转到投诉表扬
  goToFeedback() {
    wx.navigateTo({
      url: '/pages/feedback/feedback'
    });
  },

  // 跳转到公告页面
  goToNotice() {
    wx.navigateTo({
      url: '/pages/notice/notice'
    });
  },

  // 跳转到我的页面
  goToMine() {
    wx.navigateTo({
      url: '/pages/mine/mine'
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
  }
});
