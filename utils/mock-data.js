const defaultUserInfo = {
  name: '张三',
  phone: '13800138000',
  room: 'A栋 101室',
  avatar: '/assets/images/avatar.png'
};

const defaultCommunityInfo = {
  name: '阳光花园小区',
  projectName: '阳光花园小区',
  address: '北京市朝阳区阳光路88号',
  propertyCompany: '阳光物业服务公司',
  propertyPhone: '010-88888888',
  totalHouse: 500,
  totalPark: 300,
  availablePark: 45,
  defaultSupervisor: '卜立胜',
  supervisors: ['卜立胜', '维修主管'],
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

const mockBills = [
  { id: '1', type: 'property', title: '物业费', amount: 350.00, period: '2026年3月', dueDate: '2026-04-15', status: 'unpaid', room: 'A栋 101室' },
  { id: '2', type: 'water', title: '水费', amount: 86.50, period: '2026年3月', dueDate: '2026-04-15', status: 'unpaid', room: 'A栋 102室' },
  { id: '3', type: 'electricity', title: '电费', amount: 156.80, period: '2026年3月', dueDate: '2026-04-15', status: 'unpaid', room: 'A栋 102室' },
  { id: '4', type: 'property', title: '物业费', amount: 350.00, period: '2026年2月', dueDate: '2026-03-15', status: 'paid', paidDate: '2026-03-10', room: 'A栋 101室' }
];

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

const mockNotices = [
  { id: '1', title: '关于清明节假期小区管理安排的通知', content: '清明节期间，小区将正常提供物业服务...', time: '2026-04-03', important: true },
  { id: '2', title: '4月份物业费缴纳通知', content: '请各位业主于4月15日前完成4月份物业费缴纳...', time: '2026-04-01', important: true },
  { id: '3', title: '小区绿化改造施工通知', content: '本周将对小区花园进行绿化改造...', time: '2026-03-28', important: false }
];

const mockVisitors = [
  {
    id: '1',
    visitorName: '张先生',
    visitorPhone: '13900001111',
    visitPurpose: '走亲访友',
    passCode: 'A1B2C3',
    status: 'active',
    statusText: '有效',
    visitTime: '2026-04-08 10:20',
    expireTime: '2026-04-08 22:20'
  }
];

const mockDecorations = [
  {
    id: '1',
    decorationType: '局部装修',
    icon: '🔧',
    area: '客厅',
    description: '客厅墙面修补',
    startDate: '2026-04-10',
    endDate: '2026-04-15',
    company: '个人装修',
    phone: '13800138000',
    status: 'pending',
    statusText: '待审核',
    applyDate: '2026-04-08 09:00'
  }
];

const mockComplaints = [
  {
    id: '1',
    type: '投诉',
    category: '噪音扰民',
    content: '晚上施工声音较大，希望协调处理。',
    staffName: '',
    staffPosition: '',
    location: '3号楼',
    phone: '13800138000',
    status: 'pending',
    statusText: '待处理',
    reply: '',
    createTime: '2026-04-06 10:00'
  }
];

const mockPraises = [
  {
    id: '2',
    type: '表扬',
    category: '物业服务',
    content: '安保师傅帮助搬运重物，服务很周到。',
    staffName: '李师傅',
    staffPosition: '保安',
    location: '',
    phone: '13800138000',
    status: 'pending',
    statusText: '待处理',
    reply: '',
    createTime: '2026-04-07 11:00'
  }
];

const mockExpress = [
  { id: '1', company: '顺丰速运', arriveTime: '2026-04-08 14:30', code: 'A-12-365', status: 'pending', statusText: '待取件', createTime: '2026-04-08 14:30' },
  { id: '2', company: '中通快递', arriveTime: '2026-04-08 10:15', code: 'B-05-128', status: 'pending', statusText: '待取件', createTime: '2026-04-08 10:15' }
];

const mockVegetableProducts = [
  { id: 1, name: '新鲜小白菜', spec: '约500g/份', price: 3.5 },
  { id: 2, name: '有机胡萝卜', spec: '约400g/份', price: 4.0 },
  { id: 3, name: '新鲜土豆', spec: '约500g/份', price: 2.8 },
  { id: 4, name: '嫩豆腐', spec: '约300g/盒', price: 3.0 },
  { id: 5, name: '新鲜青椒', spec: '约300g/份', price: 4.5 },
  { id: 6, name: '土鸡蛋', spec: '10枚/盒', price: 15.0 }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildMockState() {
  const bills = clone(mockBills);
  const repairs = clone(mockRepairs);
  const notices = clone(mockNotices);
  const visitors = clone(mockVisitors);
  const decorations = clone(mockDecorations);
  const complaints = clone(mockComplaints);
  const praises = clone(mockPraises);
  const express = clone(mockExpress);

  return {
    isLoggedIn: false,
    token: '',
    userInfo: clone(defaultUserInfo),
    user: clone(defaultUserInfo),
    communityInfo: clone(defaultCommunityInfo),
    community: clone(defaultCommunityInfo),
    bills,
    propertyFee: { details: bills },
    repairs,
    repairList: repairs,
    notices,
    visitors,
    decorations,
    complaints,
    complaintList: complaints,
    praises,
    feedbackList: complaints.concat(praises),
    express,
    vegetableProducts: clone(mockVegetableProducts),
    vegetableOrders: [],
    hasRemoteApi: false,
    apiBaseUrl: ''
  };
}

function normalizeRemoteState(remoteState, fallbackState) {
  const base = clone(fallbackState || buildMockState());
  if (!remoteState) {
    return base;
  }

  if (remoteState.userInfo) {
    base.userInfo = remoteState.userInfo;
    base.user = remoteState.userInfo;
  }
  if (remoteState.communityInfo) {
    base.communityInfo = remoteState.communityInfo;
    base.community = remoteState.communityInfo;
  }
  if (remoteState.notices) {
    base.notices = remoteState.notices;
  }
  if (remoteState.unpaidBills || remoteState.bills) {
    base.bills = remoteState.bills || remoteState.unpaidBills;
    base.propertyFee = { details: base.bills };
  }
  if (remoteState.processingRepairs || remoteState.repairs) {
    base.repairs = remoteState.repairs || remoteState.processingRepairs;
    base.repairList = base.repairs;
  }
  if (remoteState.visitors) {
    base.visitors = remoteState.visitors;
  }
  if (remoteState.decorations) {
    base.decorations = remoteState.decorations;
  }
  if (remoteState.feedbacks) {
    base.complaints = remoteState.feedbacks.filter(function (item) { return item.type === '投诉'; });
    base.complaintList = base.complaints;
    base.praises = remoteState.feedbacks.filter(function (item) { return item.type === '表扬'; });
    base.feedbackList = remoteState.feedbacks;
  }
  if (remoteState.complaints) {
    base.complaints = remoteState.complaints;
    base.complaintList = remoteState.complaints;
  }
  if (remoteState.praises) {
    base.praises = remoteState.praises;
  }
  if (remoteState.feedbackList) {
    base.feedbackList = remoteState.feedbackList;
  }
  if (remoteState.express) {
    base.express = remoteState.express;
  }
  if (remoteState.vegetableProducts) {
    base.vegetableProducts = remoteState.vegetableProducts;
  }
  if (remoteState.vegetableOrders) {
    base.vegetableOrders = remoteState.vegetableOrders;
  }
  if (remoteState.token) {
    base.token = remoteState.token;
    base.isLoggedIn = true;
  }
  return base;
}

module.exports = {
  defaultUserInfo,
  defaultCommunityInfo,
  mockBills,
  mockRepairs,
  mockNotices,
  mockVisitors,
  mockDecorations,
  mockComplaints,
  mockPraises,
  mockExpress,
  mockVegetableProducts,
  buildMockState,
  normalizeRemoteState,
  clone
};
