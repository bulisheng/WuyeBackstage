const app = getApp();

Page({
  data: {
    userInfo: {},
    bills: [],
    filteredBills: [],
    currentTab: 'all',
    totalUnpaid: '0.00',
    unpaidCount: 0,
    paidCount: 0
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    const appData = app.globalData;
    const sourceBills = appData.bills || (appData.propertyFee && appData.propertyFee.details) || [];
    const bills = typeof app.getVisibleBills === 'function'
      ? app.getVisibleBills(sourceBills, appData.userInfo, appData.communityInfo)
      : sourceBills;
    const unpaidBills = bills.filter(bill => bill.status === 'unpaid');
    const totalUnpaid = unpaidBills.reduce((sum, bill) => sum + bill.amount, 0).toFixed(2);

    this.setData({
      userInfo: appData.userInfo,
      bills: bills,
      totalUnpaid: totalUnpaid,
      unpaidCount: unpaidBills.length,
      paidCount: bills.filter(bill => bill.status === 'paid').length
    });

    this.filterBills();
  },

  // 切换标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      currentTab: tab
    });
    this.filterBills();
  },

  // 筛选账单
  filterBills() {
    const { bills, currentTab } = this.data;
    let filtered = [];

    switch (currentTab) {
      case 'unpaid':
        filtered = bills.filter(bill => bill.status === 'unpaid');
        break;
      case 'paid':
        filtered = bills.filter(bill => bill.status === 'paid');
        break;
      default:
        filtered = bills;
    }

    this.setData({
      filteredBills: filtered
    });
  },

  // 跳转到账单详情
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/payment/paymentDetail/paymentDetail?id=' + id
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  }
});
