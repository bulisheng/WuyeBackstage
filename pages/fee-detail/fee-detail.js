Page({
  data: {
    feeItem: {},
    orderNo: ''
  },

  onLoad(options) {
    if (options.item) {
      const feeItem = JSON.parse(decodeURIComponent(options.item));
      this.setData({
        feeItem,
        orderNo: `WX${Date.now()}${Math.floor(Math.random() * 1000)}`
      });
      return;
    }

    if (options.id) {
      const app = getApp();
      const allFees = (app.globalData.propertyFee && app.globalData.propertyFee.details) || app.globalData.bills || [];
      const feeItem = allFees.find(item => item.id === options.id);
      if (feeItem) {
        this.setData({
          feeItem,
          orderNo: `WX${Date.now()}${Math.floor(Math.random() * 1000)}`
        });
      }
    }
  }
});
