const app = getApp();

Page({
  data: {
    user: {},
    unpaidList: [],
    paidList: [],
    unpaidAmount: 0,
    selectedAmount: 0,
    selectedCount: 0
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    const globalData = app.globalData;
    const user = globalData.user || globalData.userInfo || {};
    
    // 分离待缴费和已缴费
    const allFeesSource = (globalData.propertyFee && globalData.propertyFee.details) || globalData.bills || [];
    const allFees = typeof app.getVisibleBills === 'function'
      ? app.getVisibleBills(allFeesSource, globalData.userInfo, globalData.communityInfo)
      : allFeesSource;
    const unpaidList = allFees.filter(item => item.status === 'unpaid').map(item => ({
      ...item,
      selected: false
    }));
    const paidList = allFees.filter(item => item.status === 'paid');
    
    // 计算欠费总额
    const unpaidAmount = unpaidList.reduce((sum, item) => sum + item.amount, 0);

    this.setData({
      user,
      unpaidList,
      paidList,
      unpaidAmount: unpaidAmount.toFixed(2),
      selectedAmount: '0.00',
      selectedCount: 0,
      repairCount: (globalData.repairList || globalData.repairs || []).length,
      complaintCount: (globalData.complaintList || globalData.complaints || []).length
    });
  },

  toggleSelect(e) {
    const id = e.currentTarget.dataset.id;
    const unpaidList = this.data.unpaidList;
    const item = unpaidList.find(item => item.id === id);
    
    if (item) {
      item.selected = !item.selected;
      
      // 计算选中总额
      const selectedItems = unpaidList.filter(item => item.selected);
      const selectedAmount = selectedItems.reduce((sum, item) => sum + item.amount, 0);
      
      this.setData({
        unpaidList,
        selectedAmount: selectedAmount.toFixed(2),
        selectedCount: selectedItems.length
      });
    }
  },

  viewDetail(e) {
    const item = e.currentTarget.dataset.item;
    wx.navigateTo({
      url: `/pages/fee-detail/fee-detail?item=${encodeURIComponent(JSON.stringify(item))}`
    });
  },

  async goToPay() {
    const selectedItems = this.data.unpaidList.filter(item => item.selected);
    
    if (selectedItems.length === 0) {
      wx.showToast({
        title: '请选择要缴纳的费用',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '确认支付',
      content: `确认支付 ${selectedItems.length} 笔费用，共计 ¥${this.data.selectedAmount}？`,
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '支付中...' });
          try {
            for (const item of selectedItems) {
              await app.services.payBill(item.id, {
                paymentMethod: 'wechat'
              });
            }
            wx.hideLoading();
            wx.showToast({
              title: '支付成功',
              icon: 'success'
            });
            this.loadData();
          } catch (error) {
            wx.hideLoading();
            wx.showToast({
              title: error.message || '支付失败',
              icon: 'none'
            });
          }
        }
      }
    });
  }
});
