// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const db = cloud.database();
  
  try {
    // 获取用户信息
    const { userInfo, phone, community, building, unit, room } = event;
    
    // 查询用户是否已存在
    const userRes = await db.collection('users')
      .where({ openid: wxContext.OPENID })
      .get();
    
    let user;
    
    if (userRes.data && userRes.data.length > 0) {
      // 用户已存在，更新信息
      user = userRes.data[0];
      await db.collection('users').doc(user._id).update({
        data: {
          phone,
          community,
          building,
          unit,
          room,
          updateTime: new Date().toISOString()
        }
      });
      user.phone = phone;
      user.community = community;
      user.building = building;
      user.unit = unit;
      user.room = room;
    } else {
      // 创建新用户
      user = {
        openid: wxContext.OPENID,
        name: userInfo?.nickName || '业主',
        avatar: userInfo?.avatarUrl || '',
        phone,
        community,
        building,
        unit,
        room,
        createTime: new Date().toISOString(),
        status: 'active'
      };
      const addRes = await db.collection('users').add({ data: user });
      user._id = addRes._id;
    }
    
    return {
      success: true,
      user
    };
  } catch (e) {
    return {
      success: false,
      error: e.message
    };
  }
};
