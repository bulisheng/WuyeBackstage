const app = getApp();

Page({
  data: {
    repairId: '',
    repair: {},
    currentStep: 0,
    progressSteps: []
  },

  onLoad(options) {
    const { id } = options;
    this.setData({
      repairId: id
    });
    this.loadRepairDetail();
  },

  loadRepairDetail() {
    const repairs = app.globalData.repairs;
    const repair = repairs.find(item => item.id === this.data.repairId);
    
    if (repair) {
      this.setData({
        repair: repair
      });
      this.generateProgress(repair);
    } else {
      wx.showToast({
        title: '报修记录不存在',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 生成进度
  generateProgress(repair) {
    let currentStep = 0;
    const steps = [
      { title: '提交报修', time: repair.createTime, icon: 'icon-submit' },
      { title: '等待分配', time: repair.status !== 'pending' ? repair.createTime : '', icon: 'icon-wait' },
      { title: '维修中', time: repair.status === 'processing' ? repair.createTime : '', icon: 'icon-processing' },
      { title: '已完成', time: repair.completionTime || '', icon: 'icon-complete' }
    ];

    switch (repair.status) {
      case 'pending':
        currentStep = 1;
        break;
      case 'processing':
        currentStep = 2;
        break;
      case 'completed':
        currentStep = 3;
        break;
      default:
        currentStep = 0;
    }

    this.setData({
      currentStep: currentStep,
      progressSteps: steps
    });
  },

  // 返回
  goBack() {
    wx.navigateBack();
  },

  // 拨打电话
  callPhone() {
    wx.makePhoneCall({
      phoneNumber: this.data.repair.phone,
      fail: () => {
        wx.showToast({
          title: '拨打失败',
          icon: 'none'
        });
      }
    });
  },

  // 联系维修人员
  callHandler() {
    if (this.data.repair.phone) {
      wx.makePhoneCall({
        phoneNumber: this.data.repair.phone,
        fail: () => {
          wx.showToast({
            title: '拨打失败',
            icon: 'none'
          });
        }
      });
    }
  }
});
