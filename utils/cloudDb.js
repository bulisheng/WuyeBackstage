// 云开发工具类
class CloudDB {
  constructor() {
    this.db = null;
    this.init();
  }

  // 初始化云开发
  init() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      return;
    }
    wx.cloud.init({
      env: '您的云开发环境ID', // 替换为您的环境ID
      traceUser: true,
    });
    this.db = wx.cloud.database();
  }

  // 设置环境
  setEnv(envId) {
    if (!wx.cloud) return;
    wx.cloud.init({
      env: envId,
      traceUser: true,
    });
    this.db = wx.cloud.database();
  }

  // 查询集合
  async collection(name) {
    if (!this.db) {
      this.init();
    }
    return this.db.collection(name);
  }

  // 获取单条记录
  async getOne(collectionName, id) {
    try {
      const res = await this.db.collection(collectionName).doc(id).get();
      return res.data;
    } catch (e) {
      console.error(`获取${collectionName}失败:`, e);
      return null;
    }
  }

  // 查询列表
  async getList(collectionName, where = {}, skip = 0, limit = 20) {
    try {
      const res = await this.db.collection(collectionName)
        .where(where)
        .skip(skip)
        .limit(limit)
        .orderBy('createTime', 'desc')
        .get();
      return res.data;
    } catch (e) {
      console.error(`查询${collectionName}列表失败:`, e);
      return [];
    }
  }

  // 添加记录
  async add(collectionName, data) {
    try {
      data.createTime = new Date().toISOString();
      const res = await this.db.collection(collectionName).add({ data });
      return { success: true, id: res._id };
    } catch (e) {
      console.error(`添加${collectionName}失败:`, e);
      return { success: false, error: e.message };
    }
  }

  // 更新记录
  async update(collectionName, id, data) {
    try {
      data.updateTime = new Date().toISOString();
      await this.db.collection(collectionName).doc(id).update({ data });
      return { success: true };
    } catch (e) {
      console.error(`更新${collectionName}失败:`, e);
      return { success: false, error: e.message };
    }
  }

  // 删除记录
  async delete(collectionName, id) {
    try {
      await this.db.collection(collectionName).doc(id).remove();
      return { success: true };
    } catch (e) {
      console.error(`删除${collectionName}失败:`, e);
      return { success: false, error: e.message };
    }
  }

  // 统计数量
  async count(collectionName, where = {}) {
    try {
      const res = await this.db.collection(collectionName)
        .where(where)
        .count();
      return res.total;
    } catch (e) {
      console.error(`统计${collectionName}失败:`, e);
      return 0;
    }
  }
}

// 用户相关操作
class UserService {
  constructor(db) {
    this.db = db;
    this.collectionName = 'users';
  }

  // 获取或创建用户
  async getOrCreateUser(openid, userInfo) {
    try {
      // 先查询用户是否存在
      const res = await this.db.collection(this.collectionName)
        .where({ openid })
        .get();
      
      if (res.data && res.data.length > 0) {
        // 用户已存在，返回现有用户
        return res.data[0];
      }
      
      // 创建新用户
      const newUser = {
        openid,
        name: userInfo?.nickName || '业主',
        avatar: userInfo?.avatarUrl || '/assets/images/default-avatar.png',
        phone: '',
        community: '',
        building: '',
        unit: '',
        room: '',
        createTime: new Date().toISOString(),
        status: 'active'
      };
      
      const result = await this.db.collection(this.collectionName).add({ data: newUser });
      newUser._id = result._id;
      return newUser;
    } catch (e) {
      console.error('获取/创建用户失败:', e);
      return null;
    }
  }

  // 更新用户信息
  async updateUser(openid, data) {
    try {
      // 先查询用户的_id
      const res = await this.db.collection(this.collectionName)
        .where({ openid })
        .get();
      
      if (res.data && res.data.length > 0) {
        const userId = res.data[0]._id;
        await this.db.collection(this.collectionName).doc(userId).update({
          data: {
            ...data,
            updateTime: new Date().toISOString()
          }
        });
        return { success: true };
      }
      return { success: false, error: '用户不存在' };
    } catch (e) {
      console.error('更新用户失败:', e);
      return { success: false, error: e.message };
    }
  }
}

// 报修服务
class RepairService {
  constructor(db) {
    this.db = db;
    this.collectionName = 'repairs';
  }

  // 提交报修
  async submitRepair(data) {
    try {
      const result = await this.db.collection(this.collectionName).add({
        data: {
          ...data,
          status: 'pending',
          statusName: '待处理',
          createTime: new Date().toISOString(),
          handler: '',
          handlerPhone: '',
          comments: []
        }
      });
      return { success: true, id: result._id };
    } catch (e) {
      console.error('提交报修失败:', e);
      return { success: false, error: e.message };
    }
  }

  // 获取报修列表
  async getRepairList(openid, status = null) {
    try {
      let query = this.db.collection(this.collectionName)
        .where({ openid })
        .orderBy('createTime', 'desc');
      
      if (status) {
        query = this.db.collection(this.collectionName)
          .where({ openid, status })
          .orderBy('createTime', 'desc');
      }
      
      const res = await query.get();
      return res.data;
    } catch (e) {
      console.error('获取报修列表失败:', e);
      return [];
    }
  }

  // 获取报修详情
  async getRepairDetail(id) {
    try {
      const res = await this.db.collection(this.collectionName).doc(id).get();
      return res.data;
    } catch (e) {
      console.error('获取报修详情失败:', e);
      return null;
    }
  }
}

// 账单服务
class BillService {
  constructor(db) {
    this.db = db;
    this.collectionName = 'bills';
  }

  // 获取账单列表
  async getBillList(openid, status = null) {
    try {
      let query = this.db.collection(this.collectionName)
        .where({ openid })
        .orderBy('createTime', 'desc');
      
      if (status) {
        query = this.db.collection(this.collectionName)
          .where({ openid, status })
          .orderBy('createTime', 'desc');
      }
      
      const res = await query.get();
      return res.data;
    } catch (e) {
      console.error('获取账单列表失败:', e);
      return [];
    }
  }

  // 支付账单
  async payBill(id) {
    try {
      await this.db.collection(this.collectionName).doc(id).update({
        data: {
          status: 'paid',
          paidDate: new Date().toISOString().split('T')[0],
          updateTime: new Date().toISOString()
        }
      });
      return { success: true };
    } catch (e) {
      console.error('支付账单失败:', e);
      return { success: false, error: e.message };
    }
  }
}

// 导出
module.exports = {
  CloudDB,
  UserService,
  RepairService,
  BillService
};
