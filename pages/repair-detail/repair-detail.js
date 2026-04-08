const app = getApp();

Page({
  data: {
    repairItem: {}
  },

  onLoad(options) {
    if (options.item) {
      const repairItem = JSON.parse(decodeURIComponent(options.item));
      this.setData({ repairItem });
    }
  },

  cancelRepair() {
    wx.showModal({
      title: '确认取消',
      content: '确定要取消这个报修吗？',
      success: (res) => {
        if (res.confirm) {
          // 更新数据
          const repairList = app.globalData.repairList;
          const item = repairList.find(r => r.id === this.data.repairItem.id);
          if (item) {
            item.status = 'cancelled';
            item.statusText = '已取消';
          }
          
          wx.showToast({
            title: '已取消',
            icon: 'success'
          });
          
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        }
      }
    });
  },

  contactService() {
    wx.makePhoneCall({
      phoneNumber: '400-888-8888',
      fail: () => {
        wx.showToast({
          title: '拨打失败',
          icon: 'none'
        });
      }
    });
  }
});
