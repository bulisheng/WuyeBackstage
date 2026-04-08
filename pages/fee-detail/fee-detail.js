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
    }
  }
});
