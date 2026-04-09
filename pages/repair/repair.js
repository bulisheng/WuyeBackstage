const app = getApp();

Page({
  data: {
    repairTypes: [
      { value: 'water', name: '水管维修', icon: '💧' },
      { value: 'electric', name: '电路维修', icon: '💡' },
      { value: 'lock', name: '门锁服务', icon: '🔐' },
      { value: 'gas', name: '燃气维修', icon: '🔥' },
      { value: 'other', name: '其他报修', icon: '🔧' }
    ],
    timeSlots: [
      { value: 'morning', name: '上午 9:00-12:00' },
      { value: 'afternoon', name: '下午 14:00-18:00' },
      { value: 'evening', name: '晚上 18:00-20:00' }
    ],
    availableDates: [],
    selectedType: '',
    selectedDate: '',
    selectedSlot: '',
    description: '',
    phone: '',
    canSubmit: false,
    repairs: []
  },

  onLoad() {
    this.initData();
  },

  onShow() {
    this.loadRepairs();
  },

  initData() {
    // 从全局数据获取手机号
    const userInfo = app.globalData.userInfo;
    if (userInfo && userInfo.phone) {
      this.setData({ phone: userInfo.phone });
    }

    // 生成未来7天的可选日期
    this.generateDates();
  },

  // 生成可选日期
  generateDates() {
    const dates = [];
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const weekDay = weekDays[date.getDay()];
      
      dates.push({
        date: `${date.getFullYear()}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`,
        dateStr: `${month}/${day}`,
        day: i === 0 ? '今天' : i === 1 ? '明天' : weekDay
      });
    }
    
    this.setData({ 
      availableDates: dates,
      selectedDate: dates[0].date // 默认今天
    });
    this.updateCanSubmit();
  },

  // 加载报修记录
  loadRepairs() {
    const repairs = app.globalData.repairs || app.globalData.repairList || [];
    this.setData({ repairs });
  },

  // 选择报修类型
  selectType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ selectedType: type });
    this.updateCanSubmit();
  },

  // 输入描述
  inputDescription(e) {
    this.setData({ description: e.detail.value });
    this.updateCanSubmit();
  },

  // 选择日期
  selectDate(e) {
    const date = e.currentTarget.dataset.date;
    this.setData({ selectedDate: date });
    this.updateCanSubmit();
  },

  // 选择时段
  selectSlot(e) {
    const slot = e.currentTarget.dataset.slot;
    this.setData({ selectedSlot: slot });
    this.updateCanSubmit();
  },

  // 更新提交按钮状态
  updateCanSubmit() {
    const { selectedType, description, selectedDate, selectedSlot } = this.data;
    const canSubmit = Boolean(
      selectedType &&
      description.trim().length > 0 &&
      selectedDate &&
      selectedSlot
    );
    this.setData({ canSubmit });
  },

  // 提交报修
  async submitRepair() {
    this.updateCanSubmit();
    if (!this.data.canSubmit) {
      wx.showToast({ title: '请完善报修信息', icon: 'none' });
      return;
    }

    const { selectedType, description, selectedDate, selectedSlot, phone, repairTypes, timeSlots } = this.data;
    
    // 获取类型名称和图标
    const typeInfo = repairTypes.find(t => t.value === selectedType) || {};
    const slotInfo = timeSlots.find(s => s.value === selectedSlot) || {};
    
    // 格式化预约时间
    const dateInfo = this.data.availableDates.find(d => d.date === selectedDate) || {};
    const appointmentTime = `${dateInfo.day || ''} ${slotInfo.name || ''}`;

    wx.showLoading({ title: '提交中...', mask: true });

    try {
      const newRepair = await app.services.createRepair({
        type: selectedType,
        description: description,
        appointmentDate: selectedDate,
        appointmentSlot: slotInfo.name || '',
        phone: phone
      });

      if (!newRepair.categoryName) {
        newRepair.categoryName = typeInfo.name;
      }
      if (!newRepair.icon) {
        newRepair.icon = typeInfo.icon;
      }
      if (!newRepair.appointmentTime) {
        newRepair.appointmentTime = appointmentTime;
      }

      app.globalData.repairs = [newRepair].concat(this.data.repairs || []);
      app.globalData.repairList = app.globalData.repairs;

      wx.hideLoading();
      wx.showToast({
        title: '提交成功',
        icon: 'success',
        duration: 2000
      });

      this.setData({
        selectedType: '',
        description: '',
        selectedDate: this.data.availableDates.length > 0 ? this.data.availableDates[0].date : '',
        selectedSlot: '',
        canSubmit: false
      });
      this.updateCanSubmit();
      this.loadRepairs();
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: error.message || '提交失败',
        icon: 'none'
      });
    }
  },

  // 格式化时间
  formatTime(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },

  // 跳转到详情
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/repair/repairDetail/repairDetail?id=' + id
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  }
});
