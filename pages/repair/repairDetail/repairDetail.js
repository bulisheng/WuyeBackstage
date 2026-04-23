const app = getApp();
const api = require('../../../utils/api');

function mapRepairStatus(repair = {}) {
  const status = String(repair.status || '').trim() || 'pending';
  const statusName = String(repair.statusName || '').trim() || (status === 'completed' ? '已完成' : status === 'processing' ? '处理中' : '待处理');
  const ackTime = String(repair.ackTime || '').trim();
  const ackBy = String(repair.ackBy || '').trim();
  return Object.assign({}, repair, {
    status,
    statusName,
    ackTime,
    ackBy,
    ackLabel: ackTime ? '已签收' : '',
    statusTip: ackTime ? `师傅已签收${ackBy ? ` · ${ackBy}` : ''}` : (status === 'processing' ? '维修人员已接单，正在准备上门服务' : status === 'completed' ? '感谢您的使用，如有其他问题可再次报修' : '工作人员将尽快处理您的报修申请')
  });
}

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

  onShow() {
    if (this.data.repairId) {
      this.loadRepairDetail();
    }
  },

  async loadRepairDetail() {
    try {
      const res = await api.getRepairDetail(this.data.repairId);
      const repair = mapRepairStatus((res && res.data) || {});
      if (repair && repair.id) {
        this.setData({
          repair
        });
        this.generateProgress(repair);
        return;
      }
    } catch (error) {
      // fallback to local cache
    }
    const repairs = (app.globalData.repairs || []).map(mapRepairStatus);
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
      { title: '已签收', time: repair.ackTime || (repair.status !== 'pending' ? repair.createTime : ''), icon: 'icon-wait' },
      { title: '维修中', time: repair.status === 'processing' ? (repair.ackTime || repair.createTime) : '', icon: 'icon-processing' },
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
