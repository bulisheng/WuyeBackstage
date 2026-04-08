# 微信云开发 - 数据库集合说明

## 需要创建的集合

在微信开发者工具中打开 **云开发控制台** → **数据库**，创建以下集合：

### 1. users（用户表）
| 字段名 | 类型 | 说明 |
|--------|------|------|
| openid | string | 微信用户唯一标识 |
| name | string | 用户姓名 |
| avatar | string | 头像URL |
| phone | string | 手机号 |
| community | string | 小区名称 |
| building | string | 楼栋 |
| unit | string | 单元 |
| room | string | 房间号 |
| createTime | string | 创建时间 |
| status | string | 状态 |

### 2. repairs（报修表）
| 字段名 | 类型 | 说明 |
|--------|------|------|
| openid | string | 用户标识 |
| type | string | 报修类型 |
| typeName | string | 类型名称 |
| description | string | 问题描述 |
| appointmentDate | string | 预约日期 |
| appointmentSlot | string | 预约时段 |
| phone | string | 联系电话 |
| status | string | 状态 |
| statusName | string | 状态名称 |
| createTime | string | 创建时间 |
| handler | string | 处理人 |
| comments | array | 处理进度 |

### 3. bills（账单表）
| 字段名 | 类型 | 说明 |
|--------|------|------|
| openid | string | 用户标识 |
| type | string | 账单类型 |
| title | string | 标题 |
| amount | number | 金额 |
| period | string | 账期 |
| dueDate | string | 截止日期 |
| status | string | 状态 |
| paidDate | string | 支付日期 |
| createTime | string | 创建时间 |

### 4. notices（公告表）
| 字段名 | 类型 | 说明 |
|--------|------|------|
| title | string | 标题 |
| content | string | 内容 |
| important | boolean | 是否重要 |
| createTime | string | 发布时间 |

### 5. visitors（访客表）
| 字段名 | 类型 | 说明 |
|--------|------|------|
| openid | string | 用户标识 |
| visitorName | string | 访客姓名 |
| visitorPhone | string | 访客电话 |
| visitPurpose | string | 访问目的 |
| expireTime | string | 过期时间 |
| passCode | string | 通行码 |
| status | string | 状态 |
| createTime | string | 创建时间 |

### 6. decorations（装修表）
| 字段名 | 类型 | 说明 |
|--------|------|------|
| openid | string | 用户标识 |
| type | string | 装修类型 |
| area | string | 施工区域 |
| description | string | 说明 |
| startDate | string | 开始日期 |
| endDate | string | 结束日期 |
| company | string | 装修公司 |
| phone | string | 电话 |
| status | string | 状态 |
| createTime | string | 申请时间 |

### 7. feedbacks（投诉表扬表）
| 字段名 | 类型 | 说明 |
|--------|------|------|
| openid | string | 用户标识 |
| type | string | 类型(投诉/表扬) |
| category | string | 类别 |
| content | string | 内容 |
| staffName | string | 员工姓名 |
| staffPosition | string | 员工岗位 |
| status | string | 状态 |
| reply | string | 回复 |
| createTime | string | 创建时间 |

### 8. express（快递表）
| 字段名 | 类型 | 说明 |
|--------|------|------|
| openid | string | 用户标识 |
| company | string | 快递公司 |
| code | string | 取件码 |
| status | string | 状态 |
| arriveTime | string | 到件时间 |
| createTime | string | 创建时间 |

---

## 权限设置

每个集合需要设置权限：

**users 集合**：
- 当前用户可见：`openid == db.op  .user_openid`
- 仅创建者可写：✓

**repairs、bills、visitors、decorations、feedbacks、express 集合**：
- 当前用户可见：`openid == db.op.user_openid`
- 仅创建者可写：✓

**notices 集合**：
- 所有用户可读
- 仅管理员可写
