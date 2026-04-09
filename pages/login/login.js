const app = getApp();

Page({
  data: {
    phone: '',
    code: '',
    phoneError: '',
    codeError: '',
    community: '',
    building: '',
    unit: '',
    room: '',
    codeText: '获取验证码',
    codeDisabled: false,
    codeTime: 60,
    agreed: false,
    canLogin: false,
    showModal: false,
    modalTitle: '',
    modalContent: '',
    showPicker: false,
    pickerTitle: '',
    pickerOptions: [],
    pickerIndex: [0],
    pickerType: '',
    tempSelected: ''
  },

  onLoad() {
    this.restoreSavedProfile();
  },

  restoreSavedProfile() {
    try {
      const userInfo = wx.getStorageSync('userInfo') || {};
      const communityInfo = wx.getStorageSync('communityInfo') || {};
      if (!userInfo && !communityInfo) {
        return;
      }
      const room = String(userInfo.room || '').replace(/室$/, '');
      this.setData({
        phone: userInfo.phone || this.data.phone,
        community: userInfo.community || communityInfo.name || this.data.community,
        building: userInfo.building || this.data.building,
        unit: userInfo.unit || this.data.unit,
        room: room || this.data.room,
        agreed: true
      });
      this.updateCanLogin(
        userInfo.phone || this.data.phone,
        this.data.code,
        userInfo.community || communityInfo.name || this.data.community,
        userInfo.building || this.data.building,
        userInfo.unit || this.data.unit,
        room || this.data.room,
        true
      );
    } catch (error) {
      // ignore storage errors
    }
  },

  // 手机号输入
  onPhoneInput(e) {
    const phone = e.detail.value;
    this.setData({ 
      phone,
      phoneError: this.validatePhone(phone)
    });
    this.updateCanLogin(phone, this.data.code, this.data.community, this.data.building, this.data.unit, this.data.room, this.data.agreed);
  },

  // 清除手机号
  clearPhone() {
    this.setData({ phone: '', phoneError: '' });
    this.updateCanLogin('', this.data.code, this.data.community, this.data.building, this.data.unit, this.data.room, this.data.agreed);
  },

  // 验证码输入
  onCodeInput(e) {
    const code = e.detail.value;
    this.setData({ 
      code,
      codeError: code.length === 6 ? '' : this.data.codeError
    });
    this.updateCanLogin(this.data.phone, code, this.data.community, this.data.building, this.data.unit, this.data.room, this.data.agreed);
  },

  // 发送验证码
  sendCode() {
    if (this.data.codeDisabled) return;
    
    const phone = this.data.phone;
    const phoneError = this.validatePhone(phone);
    
    if (phoneError) {
      this.setData({ phoneError });
      return;
    }

    // 模拟发送验证码
    wx.showLoading({ title: '发送中...', mask: true });
    
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '验证码已发送',
        icon: 'success'
      });
      
      // 开始倒计时
      this.setData({ codeDisabled: true });
      this.countdown();
    }, 1000);
  },

  // 倒计时
  countdown() {
    let time = 60;
    const timer = setInterval(() => {
      time--;
      if (time <= 0) {
        clearInterval(timer);
        this.setData({
          codeText: '获取验证码',
          codeDisabled: false,
          codeTime: 60
        });
      } else {
        this.setData({
          codeText: `${time}s后重试`,
          codeTime: time
        });
      }
    }, 1000);
    
    this.countdownTimer = timer;
  },

  // 验证手机号
  validatePhone(phone) {
    if (!phone) return '请输入手机号';
    if (!/^1[3-9]\d{9}$/.test(phone)) return '手机号格式不正确';
    return '';
  },

  // 选择小区
  selectCommunity() {
    const communities = ['阳光花园小区', '锦绣华城', '碧水蓝天', '金地花园', '绿城百合'];
    this.showPickerModal('小区', communities, 'community');
  },

  // 选择楼栋
  selectBuilding() {
    if (!this.data.community) {
      wx.showToast({ title: '请先选择小区', icon: 'none' });
      return;
    }
    const buildings = ['1栋', '2栋', '3栋', '4栋', '5栋', '6栋', '7栋', '8栋', '9栋', '10栋'];
    this.showPickerModal('楼栋', buildings, 'building');
  },

  // 选择单元
  selectUnit() {
    if (!this.data.building) {
      wx.showToast({ title: '请先选择楼栋', icon: 'none' });
      return;
    }
    const units = ['1单元', '2单元', '3单元', '4单元', '5单元'];
    this.showPickerModal('单元', units, 'unit');
  },

  // 显示选择器弹窗
  showPickerModal(title, options, type) {
    this.setData({
      showPicker: true,
      pickerTitle: `选择${title}`,
      pickerOptions: options,
      pickerType: type,
      pickerIndex: [0],
      tempSelected: options[0]
    });
  },

  // 选择器变化
  onPickerChange(e) {
    const index = e.detail.value[0];
    const options = this.data.pickerOptions;
    this.setData({
      pickerIndex: [index],
      tempSelected: options[index]
    });
  },

  // 确认选择
  confirmPicker() {
    const { pickerType, tempSelected } = this.data;
    
    if (pickerType === 'community') {
      // 选择小区后，清空楼栋、单元
      this.setData({ 
        community: tempSelected,
        building: '',
        unit: ''
      });
      this.updateCanLogin(this.data.phone, this.data.code, tempSelected, '', '', this.data.room, this.data.agreed);
    } else if (pickerType === 'building') {
      // 选择楼栋后，清空单元
      this.setData({ 
        building: tempSelected,
        unit: ''
      });
      this.updateCanLogin(this.data.phone, this.data.code, this.data.community, tempSelected, '', this.data.room, this.data.agreed);
    } else if (pickerType === 'unit') {
      this.setData({ unit: tempSelected });
      this.updateCanLogin(this.data.phone, this.data.code, this.data.community, this.data.building, tempSelected, this.data.room, this.data.agreed);
    }
    
    this.hidePicker();
  },

  // 隐藏选择器
  hidePicker() {
    this.setData({ showPicker: false });
  },

  // 房间号输入
  onRoomInput(e) {
    const room = e.detail.value;
    this.setData({ room });
    this.updateCanLogin(this.data.phone, this.data.code, this.data.community, this.data.building, this.data.unit, room, this.data.agreed);
  },

  // 切换协议勾选
  toggleAgreement() {
    const agreed = !this.data.agreed;
    this.setData({ agreed });
    this.updateCanLogin(this.data.phone, this.data.code, this.data.community, this.data.building, this.data.unit, this.data.room, agreed);
  },

  // 更新登录按钮状态
  updateCanLogin(phone, code, community, building, unit, room, agreed) {
    const canLogin = (
      /^1[3-9]\d{9}$/.test(phone) &&
      code.length === 6 &&
      community &&
      building &&
      unit &&
      room &&
      agreed
    );
    this.setData({ canLogin });
  },

  // 显示用户协议
  showAgreement() {
    this.setData({
      showModal: true,
      modalTitle: '用户服务协议',
      modalContent: `
一、服务条款的确认和接纳
本应用所有权和运营权归阳光物业有限公司所有。用户在使用本应用提供的服务时，应遵守以下条款。

二、服务内容
1. 物业缴费：支持在线缴纳水费、电费、物业费等费用
2. 报修服务：提供在线报修、进度查询等功能
3. 访客通行：管理访客进出记录
4. 社区公告：发布物业通知、活动信息

三、用户责任
1. 用户需提供真实、准确的个人信息
2. 用户应妥善保管账户信息，因个人原因导致的损失由用户自行承担
3. 用户不得利用本应用从事违法活动

四、隐私保护
我们尊重并保护用户的个人隐私，具体详见《隐私政策》。

五、服务变更
本应用保留随时修改或中断服务而不需通知用户的权利。

六、争议解决
本协议的解释权归阳光物业有限公司所有，如发生争议，双方应友好协商解决。
      `
    });
  },

  // 显示隐私政策
  showPrivacy() {
    this.setData({
      showModal: true,
      modalTitle: '隐私政策',
      modalContent: `
一、信息收集
1. 我们收集您提供的个人信息，包括手机号码、房屋信息等
2. 我们会记录您使用本应用时的操作日志

二、信息使用
1. 用于为您提供个性化的物业服务
2. 用于向您推送物业通知、账单信息等
3. 用于改进我们的服务质量

三、信息共享
未经您的同意，我们不会与任何第三方共享您的个人信息，但以下情况除外：
1. 法律法规要求
2. 保护我们的合法权益
3. 您明确授权的情况

四、信息安全
我们采用行业标准的安全措施来保护您的个人信息，防止数据被未授权访问、使用或泄露。

五、用户权利
您有权查询、更正、删除您的个人信息，如需帮助请联系物业服务中心。

六、联系我们
如您对本隐私政策有任何疑问，请联系：400-888-8888
      `
    });
  },

  // 隐藏弹窗
  hideModal() {
    this.setData({ showModal: false });
  },

  // 阻止事件冒泡
  stopPropagation() {},

  // 执行登录
  async doLogin() {
    // 验证手机号
    const phoneError = this.validatePhone(this.data.phone);
    if (phoneError) {
      this.setData({ phoneError });
      return;
    }

    // 验证验证码
    if (!this.data.code || this.data.code.length !== 6) {
      this.setData({ codeError: '请输入6位验证码' });
      return;
    }

    // 验证房屋信息
    if (!this.data.community) {
      wx.showToast({ title: '请选择小区', icon: 'none' });
      return;
    }
    if (!this.data.building) {
      wx.showToast({ title: '请选择楼栋', icon: 'none' });
      return;
    }
    if (!this.data.unit) {
      wx.showToast({ title: '请选择单元', icon: 'none' });
      return;
    }
    if (!this.data.room) {
      wx.showToast({ title: '请输入房间号', icon: 'none' });
      return;
    }

    // 验证协议
    if (!this.data.agreed) {
      wx.showToast({ title: '请阅读并同意用户协议', icon: 'none' });
      return;
    }

    // 执行登录
    wx.showLoading({ title: '登录中...', mask: true });

    try {
      const result = await app.services.login({
        phone: this.data.phone,
        code: this.data.code,
        community: this.data.community,
        building: this.data.building,
        unit: this.data.unit,
        room: this.data.room,
        userInfo: {
          nickName: '业主'
        }
      });

      const userInfo = result.user || {
        phone: this.data.phone,
        name: '业主',
        avatar: '/assets/images/default-avatar.png'
      };
      const communityInfo = result.community || {
        name: this.data.community,
        building: this.data.building,
        unit: this.data.unit,
        room: this.data.room + '室',
        fullAddress: `${this.data.community}${this.data.building}${this.data.unit}${this.data.room}室`
      };

      app.globalData.userInfo = userInfo;
      app.globalData.communityInfo = communityInfo;
      app.globalData.isLoggedIn = true;
      if (result.token) {
        app.globalData.token = result.token;
        wx.setStorageSync('authToken', result.token);
      }
      wx.setStorageSync('isLoggedIn', true);
      wx.setStorageSync('userInfo', userInfo);
      wx.setStorageSync('communityInfo', communityInfo);

      if (app.bootstrap) {
        try {
          await app.bootstrap();
        } catch (bootstrapError) {
          // ignore bootstrap errors during login, keep the login flow moving
        }
      }

      wx.hideLoading();
      wx.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1500,
        success: () => {
          setTimeout(() => {
            wx.reLaunch({ url: '/pages/index/index' });
          }, 1500);
        }
      });
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none'
      });
    }
  },

  onUnload() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
    }
  }
});
