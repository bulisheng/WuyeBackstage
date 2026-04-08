// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const db = cloud.database();
  
  try {
    const { type, description, appointmentDate, appointmentSlot, phone } = event;
    
    // 报修类型映射
    const typeMap = {
      water: { name: '水管维修', icon: '💧' },
      electric: { name: '电路维修', icon: '💡' },
      lock: { name: '门锁维修', icon: '🔐' },
      gas: { name: '燃气维修', icon: '🔥' },
      other: { name: '其他维修', icon: '🔧' }
    };
    
    const typeInfo = typeMap[type] || typeMap.other;
    
    const repairData = {
      openid: wxContext.OPENID,
      type,
      typeName: typeInfo.name,
      icon: typeInfo.icon,
      description,
      appointmentDate,
      appointmentSlot,
      phone,
      status: 'pending',
      statusName: '待处理',
      createTime: new Date().toISOString(),
      handler: '',
      handlerPhone: '',
      comments: [],
      appointmentTime: `${appointmentDate} ${appointmentSlot}`
    };
    
    const res = await db.collection('repairs').add({ data: repairData });
    
    return {
      success: true,
      id: res._id,
      message: '报修提交成功'
    };
  } catch (e) {
    return {
      success: false,
      error: e.message
    };
  }
};
