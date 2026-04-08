const app = getApp();

Page({
  data: {
    notices: [],
    showModal: false,
    currentNotice: {}
  },

  onLoad() {
    this.loadNotices();
  },

  loadNotices() {
    const notices = app.globalData.notices;
    this.setData({
      notices: notices
    });
  },

  // 返回
  goBack() {
    wx.navigateBack();
  },

  // 显示详情
  showDetail(e) {
    const index = e.currentTarget.dataset.index;
    const notice = this.data.notices[index];
    this.setData({
      showModal: true,
      currentNotice: notice
    });
  },

  // 隐藏详情
  hideDetail() {
    this.setData({
      showModal: false
    });
  },

  // 阻止滑动
  preventTouchMove() {
    return false;
  }
});
