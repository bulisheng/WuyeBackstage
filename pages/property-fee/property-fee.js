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
    const user = globalData.user;
    
    // 分离待缴费和已缴费
    const allFees = globalData.propertyFee.details;
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
      selectedCount: 0
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

  goToPay() {
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
      success: (res) => {
        if (res.confirm) {
          // 模拟支付
          wx.showLoading({ title: '支付中...' });
          
          setTimeout(() => {
            wx.hideLoading();
            
            // 更新数据
            const globalData = app.globalData;
            selectedItems.forEach(item => {
              const feeItem = globalData.propertyFee.details.find(f => f.id === item.id);
              if (feeItem) {
                feeItem.status = 'paid';
                feeItem.paidDate = new Date().toISOString().split('T')[0];
              }
            });
            
            wx.showToast({
              title: '支付成功',
              icon: 'success'
            });
            
            this.loadData();
          }, 1500);
        }
      }
    });
  }
});
