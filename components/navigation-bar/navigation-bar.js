Component({
  properties: {
    title: {
      type: String,
      value: '首页'
    }
  },
  data: {
    statusBarHeight: 20
  },
  lifetimes: {
    attached() {
      const systemInfo = wx.getSystemInfoSync();
      this.setData({
        statusBarHeight: systemInfo.statusBarHeight || 20
      });
    }
  }
})
