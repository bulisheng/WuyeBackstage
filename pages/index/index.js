const app = getApp();

function getFeatureFlags(communityInfo = {}) {
  const defaults = {
    enableNotice: true,
    enableBill: true,
    enableRepair: true,
    enableResident: true,
    enableHouse: true,
    enableStaff: true,
    enableFeedback: true,
    enableComplaintQueue: true,
    enableComplaintRule: true,
    enableVisitor: true,
    enableDecoration: true,
    enableExpress: true,
    enableProduct: true,
    enableOrder: true
  };
  return Object.keys(defaults).reduce((acc, key) => {
    const raw = communityInfo ? communityInfo[key] : undefined;
    acc[key] = raw === false || raw === 'false' || raw === 0 || raw === '0' ? false : defaults[key];
    return acc;
  }, {});
}

Page({
  data: {
    userInfo: {},
    communityInfo: {},
    notices: [],
    unpaidBills: [],
    processingRepairs: [],
    quickEntries: [],
    serviceEntries: [],
    featureFlags: {},
    debugInfo: {
      visible: false,
      runtimeEnv: '',
      apiBaseUrl: '',
      connectionHint: ''
    }
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
    const featureFlags = getFeatureFlags(appData.communityInfo || {});
    const runtimeEnv = (appData.runtimeEnv && appData.runtimeEnv.name) || wx.getStorageSync('runtimeEnv') || 'dev';
    const apiBaseUrl = appData.apiBaseUrl || '';
    const isLocalApi = apiBaseUrl.indexOf('192.168.5.4:8080') !== -1 || apiBaseUrl.indexOf('127.0.0.1:8080') !== -1;
    const quickEntries = [
      featureFlags.enableBill ? { label: '物业缴费', icon: 'icon-payment', className: 'bg-blue', url: '/pages/payment/payment' } : null,
      featureFlags.enableRepair ? { label: '在线报修', icon: 'icon-repair', className: 'bg-green', url: '/pages/repair/repair' } : null,
      featureFlags.enableVisitor ? { label: '访客通行', icon: 'icon-visitor', className: 'bg-purple', url: '/pages/visitor/visitor' } : null,
      featureFlags.enableDecoration ? { label: '装修登记', icon: 'icon-decoration', className: 'bg-orange-dark', url: '/pages/decoration/decoration' } : null,
      featureFlags.enableExpress ? { label: '快递代寄', icon: 'icon-express', className: 'bg-blue-dark', url: '/pages/express/express' } : null,
      featureFlags.enableProduct ? { label: '蔬菜代买', icon: 'icon-vegetable', className: 'bg-green-light', url: '/pages/vegetable/vegetable' } : null
    ].filter(Boolean);
    const serviceEntries = [
      featureFlags.enableNotice ? { label: '小区公告', icon: 'icon-notice', className: 'bg-orange', url: '/pages/notice/notice' } : null,
      featureFlags.enableFeedback ? { label: '投诉表扬', icon: 'icon-feedback', className: 'bg-red', url: '/pages/feedback/feedback' } : null,
      { label: '联系物业', icon: 'icon-phone', className: 'bg-blue-dark', call: true },
      { label: '个人中心', icon: 'icon-person2', className: 'bg-gray', url: '/pages/mine/mine' }
    ].filter(Boolean);
    this.setData({
      userInfo: appData.userInfo || {},
      communityInfo: appData.communityInfo || {},
      notices: appData.notices || [],
      unpaidBills: visibleBills.filter(bill => bill.status === 'unpaid').slice(0, 2),
      processingRepairs: (appData.repairs || []).filter(repair => repair.status === 'processing'),
      quickEntries,
      serviceEntries,
      featureFlags,
      debugInfo: {
        visible: runtimeEnv === 'dev',
        runtimeEnv: runtimeEnv,
        apiBaseUrl: apiBaseUrl,
        connectionHint: isLocalApi ? '本机/局域网联调' : '非本机地址'
      }
    });
  },

  // 跳转到缴费页面
  navigateByUrl(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) {
      return;
    }
    wx.navigateTo({ url });
  },

  goToPaymentDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/payment/paymentDetail/paymentDetail?id=' + id
    });
  },

  goToRepairDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/repair/repairDetail/repairDetail?id=' + id
    });
  },

  copyDebugApiBaseUrl() {
    const apiBaseUrl = this.data.debugInfo && this.data.debugInfo.apiBaseUrl;
    if (!apiBaseUrl) {
      wx.showToast({
        title: '没有可复制的地址',
        icon: 'none'
      });
      return;
    }
    wx.setClipboardData({
      data: apiBaseUrl,
      success: () => {
        wx.showToast({
          title: '已复制接口地址',
          icon: 'success'
        });
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        });
      }
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
