// 物业管理系统全局数据
const defaultUserInfo = {
  name: '张三',
  phone: '138****8888',
  room: 'A栋 1001室',
  avatar: '/assets/images/avatar.png'
};

// 获取用户信息
function getUserInfo() {
  const userInfo = wx.getStorageSync('userInfo');
  return userInfo || defaultUserInfo;
}

// 物业账单模拟数据
const mockBills = [
  {
    id: '1',
    type: 'property',
    title: '物业费',
    amount: 350.00,
    period: '2026年3月',
    dueDate: '2026-04-15',
    status: 'unpaid',
    room: 'A栋 1001室'
  },
  {
    id: '2',
    type: 'water',
    title: '水费',
    amount: 86.50,
    period: '2026年3月',
    dueDate: '2026-04-15',
    status: 'unpaid',
    room: 'A栋 1001室'
  },
  {
    id: '3',
    type: 'electricity',
    title: '电费',
    amount: 156.80,
    period: '2026年3月',
    dueDate: '2026-04-15',
    status: 'unpaid',
    room: 'A栋 1001室'
  },
  {
    id: '4',
    type: 'property',
    title: '物业费',
    amount: 350.00,
    period: '2026年2月',
    dueDate: '2026-03-15',
    status: 'paid',
    paidDate: '2026-03-10',
    room: 'A栋 1001室'
  }
];

// 报修记录模拟数据
const mockRepairs = [
  {
    id: '1',
    title: '厨房水龙头漏水',
    category: 'water',
    categoryName: '水管维修',
    description: '厨房水龙头滴水，无法拧紧',
    status: 'processing',
    statusName: '处理中',
    createTime: '2026-04-05 14:30',
    appointmentTime: '2026-04-08 10:00',
    handler: '李师傅',
    phone: '13800138000'
  },
  {
    id: '2',
    title: '客厅灯不亮',
    category: 'electric',
    categoryName: '电路维修',
    description: '客厅主灯无法点亮',
    status: 'completed',
    statusName: '已完成',
    createTime: '2026-03-20 09:00',
    completionTime: '2026-03-20 15:30',
    handler: '王师傅',
    phone: '13900139000'
  }
];

// 通知公告模拟数据
const mockNotices = [
  {
    id: '1',
    title: '关于清明节假期小区管理安排的通知',
    content: '清明节期间，小区将正常提供物业服务...',
    time: '2026-04-03',
    important: true
  },
  {
    id: '2',
    title: '4月份物业费缴纳通知',
    content: '请各位业主于4月15日前完成4月份物业费缴纳...',
    time: '2026-04-01',
    important: true
  },
  {
    id: '3',
    title: '小区绿化改造施工通知',
    content: '本周将对小区花园进行绿化改造...',
    time: '2026-03-28',
    important: false
  }
];

// 小区信息
const communityInfo = {
  name: '阳光花园小区',
  address: '北京市朝阳区阳光路88号',
  propertyCompany: '阳光物业服务公司',
  propertyPhone: '010-88888888',
  totalHouse: 500,
  totalPark: 300,
  availablePark: 45
};

// 云开发环境ID（请替换为您的环境ID）
const CLOUD_ENV = 'your-cloud-env-id'; // TODO: 替换为云开发环境ID

App({
  globalData: {
    isLoggedIn: false,
    userInfo: null,
    communityInfo: null,
    bills: mockBills,
    repairs: mockRepairs,
    notices: mockNotices,
    communityInfo: communityInfo,
    cloudEnv: CLOUD_ENV,
    openid: null,
    hasCloud: false
  },
  
  onLaunch() {
    // 初始化云开发
    this.initCloud();
    
    // 检查登录状态
    const isLoggedIn = wx.getStorageSync('isLoggedIn');
    const savedUserInfo = wx.getStorageSync('userInfo');
    const savedCommunityInfo = wx.getStorageSync('communityInfo');
    
    if (isLoggedIn && savedUserInfo) {
      this.globalData.isLoggedIn = true;
      this.globalData.userInfo = savedUserInfo;
      this.globalData.communityInfo = savedCommunityInfo;
    }
  },
  
  // 初始化云开发
  initCloud() {
    if (!wx.cloud) {
      console.log('当前微信版本不支持云开发');
      return;
    }
    
    wx.cloud.init({
      env: CLOUD_ENV,
      traceUser: true,
      timeout: 10000
    });
    
    this.globalData.hasCloud = true;
    console.log('云开发初始化成功');
  },
  
  // 获取云数据库实例
  getDB() {
    if (!wx.cloud) return null;
    return wx.cloud.database();
  },
  
  // 调用云函数
  async callFunction(name, data = {}) {
    if (!wx.cloud) {
      return { success: false, error: '云开发未初始化' };
    }
    
    try {
      const res = await wx.cloud.callFunction({
        name,
        data
      });
      return res.result;
    } catch (e) {
      console.error(`云函数${name}调用失败:`, e);
      return { success: false, error: e.message };
    }
  },
  
  // 获取用户openid
  async getOpenid() {
    if (this.globalData.openid) {
      return this.globalData.openid;
    }
    
    try {
      const res = await wx.cloud.callFunction({
        name: 'login'
      });
      this.globalData.openid = res.openid;
      return res.openid;
    } catch (e) {
      console.error('获取openid失败:', e);
      return null;
    }
  }
});
