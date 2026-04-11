import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  deleteDecoration,
  deleteExpress,
  deleteFeedback,
  deleteBill,
  deleteCommunity,
  deleteNotice,
  deleteRepair,
  deleteHouse,
  deleteVegetableOrder,
  deleteVegetableProduct,
  deleteStaff,
  deleteUser,
  deleteVisitor,
  invalidateVisitor,
  listDecorations,
  listComplaintQueue,
  listComplaintRules,
  listExpress,
  listFeedbacks,
  listBills,
  listCommunities,
  listHouses,
  listNotices,
  listRepairs,
  listVegetableOrders,
  listVegetableProducts,
  listStaffs,
  listUsers,
  listVisitors,
  pickupExpress,
  analyzeComplaintQueue,
  replyFeedback,
  pushComplaintQueueToFeishu,
  reviewDecoration,
  saveBill,
  saveCommunityById,
  activateCommunity,
  saveDecoration,
  saveExpress,
  saveFeedback,
  saveComplaintRule,
  saveHouse,
  saveNotice,
  saveRepair,
  saveVegetableOrder,
  saveVegetableProduct,
  saveStaff,
  saveUser,
  saveVisitor,
  deleteComplaintRule
} from '../lib/api';
import { useAuth } from '../context/AuthContext';

const TABS = {
  notice: { label: '公告', title: '公告管理', subtitle: '搜索、筛选、排序、分页和编辑都在这里完成。' },
  bill: { label: '账单', title: '账单管理', subtitle: '账单查询、筛选、排序、编辑和批量状态变更都在这里。' },
  repair: { label: '报修', title: '报修管理', subtitle: '报修记录、审批流转、详情编辑和批量处理都能直接完成。' },
  community: { label: '小区', title: '小区管理', subtitle: '多小区配置、默认主管、主管列表和启用状态都能统一维护。' },
  resident: { label: '住户', title: '住户账号管理', subtitle: '住户账号、绑定信息、入住状态和备注都能直接维护。' },
  house: { label: '房屋', title: '房屋档案管理', subtitle: '房屋档案、产权人、入住状态和房间信息都能维护。' },
  staff: { label: '人员', title: '物业人员管理', subtitle: '物业人员和维修人员的角色、岗位和在岗状态都能管理。' },
  feedback: { label: '反馈', title: '投诉表扬管理', subtitle: '投诉、表扬都能查看、回复和编辑。' },
  complaintQueue: { label: '投诉队列', title: '投诉队列', subtitle: '这里看待处理投诉，先做 AI 分析，再一键推飞书并 @主管。' },
  complaintRule: { label: '投诉规则', title: '投诉规则配置', subtitle: '这里配置关键词、严重级别、主管和 @ 规则。' },
  visitor: { label: '访客', title: '访客管理', subtitle: '访客记录、通行码、有效期和失效处理都能管理。' },
  decoration: { label: '装修', title: '装修登记管理', subtitle: '装修申请、审核和批量处理都能直接操作。' },
  express: { label: '快递', title: '快递代寄管理', subtitle: '快递到件、取件和记录维护都能在这里完成。' },
  product: { label: '商品', title: '蔬菜商品管理', subtitle: '蔬菜商品上下架、价格和库存都能维护。' },
  order: { label: '订单', title: '蔬菜订单管理', subtitle: '蔬菜订单查询、状态和明细维护都能处理。' }
};

const NAV_GROUPS = [
  { key: 'core', title: '基础业务', tabs: ['notice', 'bill', 'repair'] },
  { key: 'communityConfig', title: '小区管理', tabs: ['community'] },
  { key: 'asset', title: '住户资产', tabs: ['resident', 'house'] },
  { key: 'organization', title: '物业人员', tabs: ['staff'] },
  { key: 'service', title: '运营服务', tabs: ['feedback', 'complaintQueue', 'complaintRule', 'visitor', 'decoration', 'express'] },
  { key: 'mall', title: '商品商城', tabs: ['product', 'order'] }
];

const COMMUNITY_FEATURES = [
  { field: 'enableNotice', tab: 'notice', label: '公告' },
  { field: 'enableBill', tab: 'bill', label: '账单' },
  { field: 'enableRepair', tab: 'repair', label: '报修' },
  { field: 'enableResident', tab: 'resident', label: '住户' },
  { field: 'enableHouse', tab: 'house', label: '房屋' },
  { field: 'enableStaff', tab: 'staff', label: '人员' },
  { field: 'enableFeedback', tab: 'feedback', label: '投诉表扬' },
  { field: 'enableComplaintQueue', tab: 'complaintQueue', label: '投诉队列' },
  { field: 'enableComplaintRule', tab: 'complaintRule', label: '投诉规则' },
  { field: 'enableVisitor', tab: 'visitor', label: '访客' },
  { field: 'enableDecoration', tab: 'decoration', label: '装修' },
  { field: 'enableExpress', tab: 'express', label: '快递' },
  { field: 'enableProduct', tab: 'product', label: '商品' },
  { field: 'enableOrder', tab: 'order', label: '订单' }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function communityDisplayName(community) {
  if (!community) return '未命名项目';
  return String(community.projectName || community.name || '未命名项目').trim() || '未命名项目';
}

function communityFeatureEnabled(community, tab) {
  if (tab === 'community') {
    return true;
  }
  const feature = COMMUNITY_FEATURES.find((item) => item.tab === tab);
  if (!feature) {
    return true;
  }
  if (!community) {
    return true;
  }
  const raw = community[feature.field];
  return !(raw === false || raw === 'false' || raw === 0 || raw === '0');
}

function communityVisibleGroups(community) {
  return NAV_GROUPS.map((group) => ({
    ...group,
    tabs: group.tabs.filter((tab) => communityFeatureEnabled(community, tab))
  })).filter((group) => group.tabs.length > 0);
}

function defaultDraftFor(type) {
  if (type === 'resident') {
    return { id: '', openid: '', name: '', avatar: '', phone: '', community: '', building: '', unit: '', room: '', houseId: '', houseNo: '', relationship: '业主', role: 'resident', status: 'active', remark: '', createTime: '' };
  }
  if (type === 'house') {
    return { id: '', community: '', houseNo: '', building: '', unit: '', room: '', area: '', ownerName: '', ownerPhone: '', occupantName: '', occupantPhone: '', boundUserId: '', boundUserName: '', boundUserPhone: '', ownershipStatus: 'self_owned', occupancyStatus: 'occupied', status: 'occupied', statusText: '已入住', remark: '', createTime: '' };
  }
  if (type === 'staff') {
    return { id: '', community: '', name: '', feishuDisplayName: '', feishuUserId: '', feishuOpenId: '', feishuUnionId: '', role: '物业人员', position: '', department: '', phone: '', status: 'active', statusText: '在岗', skill: '', shift: '白班', scope: '', remark: '', createTime: '' };
  }
  if (type === 'bill') {
    return { id: '', type: 'property', title: '', amount: '', period: '', dueDate: '', status: 'unpaid', paidDate: '', room: '', openid: '' };
  }
  if (type === 'repair') {
    return { id: '', title: '', category: 'other', categoryName: '', description: '', status: 'pending', statusName: '待处理', handler: '', handlerPhone: '', phone: '', houseId: '', houseNo: '', building: '', unit: '', room: '', dispatchTime: '', dispatchRemark: '', dispatchShift: '', dispatchBuilding: '', appointmentTime: '', completionTime: '', openid: '' };
  }
  if (type === 'community') {
    return {
      id: '',
      name: '',
      projectName: '',
      address: '',
      propertyCompany: '',
      propertyPhone: '',
      totalHouse: '',
      totalPark: '',
      availablePark: '',
      defaultSupervisor: '卜立胜',
      supervisors: '卜立胜',
      active: true,
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
      enableOrder: true,
      remark: '',
      updateTime: ''
    };
  }
  if (type === 'feedback') {
    return { id: '', community: '', type: '投诉', category: '', title: '', description: '', content: '', staffName: '', staffPosition: '', location: '', phone: '', status: 'pending', statusText: '待处理', reply: '' };
  }
  if (type === 'complaintQueue') {
    return { id: '', title: '', content: '', location: '', severity: 'medium', summary: '', analysisStatus: 'pending', pushStatus: 'pending', ruleName: '', supervisorName: '', mentionTargets: '', suggestedAction: '', createTime: '' };
  }
  if (type === 'complaintRule') {
    return { id: '', name: '', enabled: true, priority: 80, severity: 'medium', matchKeywords: '', matchCategories: '', matchBuildings: '', supervisorName: '', mentionTargets: [], onlyCurrentCommunityStaff: true, autoPush: false, autoAnalyze: true, remark: '', createTime: '' };
  }
  if (type === 'visitor') {
    return { id: '', visitorName: '', visitorPhone: '', visitPurpose: '走亲访友', passCode: '', status: 'active', statusText: '有效', visitTime: '', expireTime: '', expireHours: 24 };
  }
  if (type === 'decoration') {
    return { id: '', decorationType: '局部装修', area: '', description: '', startDate: '', endDate: '', company: '', phone: '', status: 'pending', statusText: '待审核', applyDate: '', reviewRemark: '' };
  }
  if (type === 'express') {
    return { id: '', company: '', arriveTime: '', code: '', status: 'pending', statusText: '待取件', createTime: '', pickupTime: '' };
  }
  if (type === 'product') {
    return { id: '', name: '', spec: '', price: '', stock: '', cover: '', description: '', status: 'active', statusText: '上架' };
  }
  if (type === 'order') {
    return { id: '', orderNo: '', items: '[]', totalAmount: '', status: 'pending', statusText: '待处理', createTime: '', pickupTime: '' };
  }
  return { id: '', title: '', content: '', time: new Date().toISOString().slice(0, 10), important: true };
}

function stripUiFields(item) {
  const copy = clone(item);
  delete copy.selected;
  return copy;
}

function filterOptions(tab) {
  if (tab === 'community') {
    return [
      { value: 'all', label: '全部' },
      { value: 'active', label: '当前小区' },
      { value: 'inactive', label: '未启用' }
    ];
  }
  if (tab === 'resident') {
    return [
      { value: 'all', label: '全部' },
      { value: 'active', label: '在用' },
      { value: 'inactive', label: '停用' }
    ];
  }
  if (tab === 'house') {
    return [
      { value: 'all', label: '全部' },
      { value: 'occupied', label: '已入住' },
      { value: 'vacant', label: '空置' }
    ];
  }
  if (tab === 'staff') {
    return [
      { value: 'all', label: '全部' },
      { value: 'active', label: '在岗' },
      { value: 'inactive', label: '离岗' }
    ];
  }
  if (tab === 'bill') {
    return [
      { value: 'all', label: '全部' },
      { value: 'unpaid', label: '未缴' },
      { value: 'paid', label: '已缴' }
    ];
  }
  if (tab === 'repair') {
    return [
      { value: 'all', label: '全部' },
      { value: 'pending', label: '待处理' },
      { value: 'processing', label: '处理中' },
      { value: 'completed', label: '已完成' }
    ];
  }
  if (tab === 'feedback') {
    return [
      { value: 'all', label: '全部' },
      { value: '投诉', label: '投诉' },
      { value: '表扬', label: '表扬' },
      { value: 'pending', label: '待处理' },
      { value: 'replied', label: '已回复' }
    ];
  }
  if (tab === 'complaintQueue') {
    return [
      { value: 'all', label: '全部' },
      { value: 'pending', label: '待处理' },
      { value: 'done', label: '已分析' },
      { value: 'sent', label: '已推送' },
      { value: 'failed', label: '推送失败' }
    ];
  }
  if (tab === 'complaintRule') {
    return [
      { value: 'all', label: '全部' },
      { value: 'enabled', label: '启用' },
      { value: 'disabled', label: '停用' }
    ];
  }
  if (tab === 'visitor') {
    return [
      { value: 'all', label: '全部' },
      { value: 'active', label: '有效' },
      { value: 'invalid', label: '失效' }
    ];
  }
  if (tab === 'decoration') {
    return [
      { value: 'all', label: '全部' },
      { value: 'pending', label: '待审核' },
      { value: 'approved', label: '已通过' },
      { value: 'rejected', label: '已驳回' }
    ];
  }
  if (tab === 'express') {
    return [
      { value: 'all', label: '全部' },
      { value: 'pending', label: '待取件' },
      { value: 'completed', label: '已取件' }
    ];
  }
  if (tab === 'product') {
    return [
      { value: 'all', label: '全部' },
      { value: 'active', label: '上架' },
      { value: 'inactive', label: '下架' }
    ];
  }
  if (tab === 'order') {
    return [
      { value: 'all', label: '全部' },
      { value: 'pending', label: '待处理' },
      { value: 'completed', label: '已完成' }
    ];
  }
  return [
    { value: 'all', label: '全部' },
    { value: 'important', label: '重要' },
    { value: 'normal', label: '普通' }
  ];
}

function sortOptions(tab) {
  if (tab === 'community') {
    return [
      { field: 'name', label: '小区名称' },
      { field: 'propertyPhone', label: '电话' },
      { field: 'updateTime', label: '更新时间' }
    ];
  }
  if (tab === 'resident') {
    return [
      { field: 'room', label: '房号' },
      { field: 'relationship', label: '关系' },
      { field: 'name', label: '姓名' },
      { field: 'createTime', label: '创建时间' }
    ];
  }
  if (tab === 'house') {
    return [
      { field: 'houseNo', label: '房号' },
      { field: 'area', label: '面积' },
      { field: 'ownershipStatus', label: '产权' },
      { field: 'occupancyStatus', label: '入住' }
    ];
  }
  if (tab === 'staff') {
    return [
      { field: 'name', label: '姓名' },
      { field: 'role', label: '角色' },
      { field: 'shift', label: '班次' },
      { field: 'scope', label: '区域' },
      { field: 'createTime', label: '创建时间' }
    ];
  }
  if (tab === 'bill') {
    return [
      { field: 'dueDate', label: '到期日' },
      { field: 'amount', label: '金额' },
      { field: 'status', label: '状态' }
    ];
  }
  if (tab === 'repair') {
    return [
      { field: 'createTime', label: '时间' },
      { field: 'status', label: '状态' },
      { field: 'handler', label: '处理人' }
    ];
  }
  if (tab === 'feedback') {
    return [
      { field: 'createTime', label: '时间' },
      { field: 'type', label: '类型' },
      { field: 'status', label: '状态' }
    ];
  }
  if (tab === 'complaintQueue') {
    return [
      { field: 'createTime', label: '时间' },
      { field: 'severity', label: '等级' },
      { field: 'pushStatus', label: '推送' }
    ];
  }
  if (tab === 'complaintRule') {
    return [
      { field: 'priority', label: '优先级' },
      { field: 'severity', label: '等级' },
      { field: 'createTime', label: '创建时间' }
    ];
  }
  if (tab === 'visitor') {
    return [
      { field: 'visitTime', label: '访问时间' },
      { field: 'expireTime', label: '到期时间' },
      { field: 'status', label: '状态' }
    ];
  }
  if (tab === 'decoration') {
    return [
      { field: 'applyDate', label: '申请时间' },
      { field: 'startDate', label: '开始时间' },
      { field: 'status', label: '状态' }
    ];
  }
  if (tab === 'express') {
    return [
      { field: 'createTime', label: '创建时间' },
      { field: 'arriveTime', label: '到件时间' },
      { field: 'status', label: '状态' }
    ];
  }
  if (tab === 'product') {
    return [
      { field: 'price', label: '价格' },
      { field: 'stock', label: '库存' },
      { field: 'name', label: '名称' }
    ];
  }
  if (tab === 'order') {
    return [
      { field: 'createTime', label: '时间' },
      { field: 'totalAmount', label: '金额' },
      { field: 'status', label: '状态' }
    ];
  }
  return [
    { field: 'time', label: '时间' },
    { field: 'title', label: '标题' },
    { field: 'important', label: '重要性' }
  ];
}

function batchOptions(tab) {
  if (tab === 'community') {
    return [];
  }
  if (tab === 'resident') {
    return [
      ['active', '批量在用'],
      ['inactive', '批量停用'],
      ['delete', '批量删除']
    ];
  }
  if (tab === 'house') {
    return [
      ['occupied', '批量已入住'],
      ['vacant', '批量空置'],
      ['delete', '批量删除']
    ];
  }
  if (tab === 'staff') {
    return [
      ['active', '批量在岗'],
      ['inactive', '批量离岗'],
      ['delete', '批量删除']
    ];
  }
  if (tab === 'complaintQueue') {
    return [
      ['analyze', '批量分析'],
      ['push', '批量推送']
    ];
  }
  if (tab === 'complaintRule') {
    return [
      ['enable', '批量启用'],
      ['disable', '批量停用'],
      ['delete', '批量删除']
    ];
  }
  if (tab === 'bill') {
    return [
      ['paid', '批量已缴'],
      ['unpaid', '批量未缴'],
      ['delete', '批量删除']
    ];
  }
  if (tab === 'repair') {
    return [
      ['approve', '批量审批'],
      ['process', '批量处理中'],
      ['complete', '批量完成'],
      ['delete', '批量删除']
    ];
  }
  if (tab === 'feedback') {
    return [
      ['reply', '批量已回复'],
      ['pending', '批量待处理'],
      ['delete', '批量删除']
    ];
  }
  if (tab === 'visitor') {
    return [
      ['active', '批量有效'],
      ['invalid', '批量失效'],
      ['delete', '批量删除']
    ];
  }
  if (tab === 'decoration') {
    return [
      ['approve', '批量通过'],
      ['reject', '批量驳回'],
      ['delete', '批量删除']
    ];
  }
  if (tab === 'express') {
    return [
      ['pickup', '批量取件'],
      ['delete', '批量删除']
    ];
  }
  if (tab === 'product') {
    return [
      ['active', '批量上架'],
      ['inactive', '批量下架'],
      ['delete', '批量删除']
    ];
  }
  if (tab === 'order') {
    return [
      ['complete', '批量完成'],
      ['pending', '批量待处理'],
      ['delete', '批量删除']
    ];
  }
  return [
    ['important', '设为重要'],
    ['normal', '设为普通'],
    ['delete', '批量删除']
  ];
}

function advancedFilterOptions(tab, rows = []) {
  if (tab === 'community') {
    return [
      { value: 'all', label: '全部主管' },
      ...Array.from(new Set(rows.flatMap((row) => splitTextList(row.supervisors || row.defaultSupervisor))))
        .map((value) => ({ value, label: value }))
    ];
  }
  const uniqueValues = (getter, normalize = (value) => value) => Array.from(
    new Map(
      rows
        .map((row) => {
          const raw = getter(row);
          const value = raw == null ? '' : String(raw).trim();
          if (!value) return null;
          return [value, normalize(value, row)];
        })
        .filter(Boolean)
    ).entries()
  ).map(([value, label]) => ({ value, label }));

  if (tab === 'resident') {
    return [
      { value: 'all', label: '全部关系' },
      ...uniqueValues((item) => item.relationship, (value) => value)
    ];
  }
  if (tab === 'house') {
    return [
      { value: 'all', label: '全部产权' },
      ...uniqueValues((item) => item.ownershipStatus, (value) => houseOwnershipLabel(value))
    ];
  }
  if (tab === 'staff') {
    return [
      { value: 'all', label: '全部角色' },
      ...uniqueValues((item) => item.role, (value) => value)
    ];
  }
  if (tab === 'repair') {
    return [
      { value: 'all', label: '全部派工' },
      { value: 'unassigned', label: '未分派' },
      { value: 'assigned', label: '已分派' },
      { value: 'history', label: '有历史' }
    ];
  }
  if (tab === 'feedback') {
    return [
      { value: 'all', label: '全部类型' },
      { value: '投诉', label: '投诉' },
      { value: '表扬', label: '表扬' }
    ];
  }
  if (tab === 'complaintQueue') {
    return [
      { value: 'all', label: '全部严重度' },
      { value: 'high', label: '高' },
      { value: 'medium', label: '中' },
      { value: 'low', label: '低' }
    ];
  }
  if (tab === 'complaintRule') {
    return [
      { value: 'all', label: '全部主管' },
      { value: '卜立胜', label: '卜立胜' },
      { value: '客服主管', label: '客服主管' },
      { value: '维修主管', label: '维修主管' }
    ];
  }
  return [];
}

function communityFilterOptions(rows = []) {
  return [
    { value: 'all', label: '全部小区' },
    ...Array.from(new Set(rows.map((row) => String(row.community || '').trim()).filter(Boolean)))
      .map((value) => ({ value, label: value }))
  ];
}

function statusClass(status) {
  if (status === 'paid' || status === 'completed' || status === 'important' || status === 'active' || status === 'approved' || status === 'occupied') {
    return 'success';
  }
  if (status === 'processing' || status === 'unpaid' || status === 'pending' || status === 'vacant') {
    return 'warn';
  }
  if (status === 'invalid' || status === 'rejected' || status === 'inactive') {
    return 'danger';
  }
  return '';
}

function fieldLabel(field) {
  const labels = {
    id: 'ID',
    openid: '用户标识',
    name: '姓名',
    projectName: '项目名称',
    avatar: '头像',
    phone: '电话',
    community: '小区',
    building: '楼栋',
    unit: '单元',
    room: '房号',
    houseId: '房屋ID',
    houseNo: '房屋',
    propertyCompany: '物业公司',
    propertyPhone: '物业电话',
    totalHouse: '总房源',
    totalPark: '总车位',
    availablePark: '可用车位',
    defaultSupervisor: '默认主管',
    supervisors: '主管列表',
    active: '启用',
    relationship: '关系',
    role: '角色',
    status: '状态',
    statusText: '状态文案',
    statusName: '状态名称',
    important: '重要公告',
    time: '时间',
    type: '类型',
    period: '周期',
    dueDate: '到期日',
    paidDate: '缴费时间',
    amount: '金额',
    price: '价格',
    stock: '库存',
    spec: '规格',
    cover: '封面',
    orderNo: '订单号',
    items: '商品明细',
    company: '公司',
    arriveTime: '到件时间',
    code: '取件码',
    visitPurpose: '访问目的',
    passCode: '通行码',
    visitTime: '访问时间',
    expireTime: '到期时间',
    decorationType: '装修类型',
    startDate: '开始时间',
    endDate: '结束时间',
    location: '位置',
    reply: '回复',
    remark: '备注',
    area: '面积',
    ownerName: '产权人',
    ownerPhone: '产权电话',
    occupantName: '入住人',
    occupantPhone: '入住电话',
    boundUserId: '绑定住户ID',
    boundUserName: '绑定住户',
    boundUserPhone: '绑定电话',
    ownershipStatus: '产权状态',
    occupancyStatus: '入住状态',
    position: '岗位',
    department: '部门',
    skill: '工种',
    shift: '班次',
    scope: '负责区域',
    responsibleBuildings: '负责楼栋',
    feishuDisplayName: '飞书成员名',
    feishuUserId: '飞书成员标识',
    feishuOpenId: '飞书开放标识',
    feishuUnionId: '飞书统一标识',
    dispatchTime: '分派时间',
    dispatchRemark: '分派备注',
    dispatchShift: '目标班次',
    dispatchBuilding: '分派楼栋',
    appointmentTime: '预约时间',
    completionTime: '完成时间',
    title: '标题',
    content: '内容',
    description: '描述',
    category: '分类',
    categoryName: '分类名称',
    reviewRemark: '审核备注',
    severity: '严重等级',
    analysisStatus: '分析状态',
    analysisTime: '分析时间',
    pushStatus: '推送状态',
    pushTime: '推送时间',
    pushError: '推送错误',
    ruleId: '规则ID',
    ruleName: '规则名称',
    supervisorName: '负责人',
    mentionTargets: '飞书通知人',
    onlyCurrentCommunityStaff: '只看当前小区人员',
    suggestedAction: '建议动作',
    autoPush: '自动推送',
    autoAnalyze: '自动分析',
    priority: '优先级',
    enabled: '启用',
    matchKeywords: '匹配关键词',
    matchCategories: '匹配分类',
    matchBuildings: '匹配楼栋',
    applyDate: '申请时间',
    createTime: '创建时间',
    updateTime: '更新时间'
  };
  return labels[field] || field;
}

function houseOwnershipLabel(value) {
  if (value === 'self_owned') return '自有';
  if (value === 'rental') return '租赁';
  if (value === 'leased') return '承租';
  if (value === 'vacant') return '空置';
  return value || '-';
}

function occupancyLabel(value) {
  if (value === 'occupied') return '已入住';
  if (value === 'vacant') return '空置';
  if (value === 'renovating') return '装修中';
  return value || '-';
}

function staffStatusLabel(value) {
  if (value === 'active') return '在岗';
  if (value === 'inactive') return '离岗';
  return value || '-';
}

function severityLabel(value) {
  if (value === 'high') return '高';
  if (value === 'medium') return '中';
  if (value === 'low') return '低';
  return value || '-';
}

function priorityLabel(value) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return value || '-';
  }
  if (numeric >= 100) return '100 最高';
  if (numeric >= 80) return '80 很高';
  if (numeric >= 60) return '60 较高';
  if (numeric >= 40) return '40 中';
  if (numeric >= 20) return '20 较低';
  return `${numeric} 低`;
}

function complaintAnalysisLabel(value) {
  if (value === 'pending') return '待分析';
  if (value === 'done') return '已分析';
  if (value === 'failed') return '分析失败';
  return value || '-';
}

function complaintPushLabel(value) {
  if (value === 'pending') return '待推送';
  if (value === 'prepared') return '待发送';
  if (value === 'sent') return '已推送';
  if (value === 'failed') return '推送失败';
  return value || '-';
}

function splitBuildings(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map((item) => String(item).trim()).filter(Boolean);
  }
  return String(value || '')
    .split(/\s*,\s*/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitTextList(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map((item) => String(item).trim()).filter(Boolean);
  }
  return String(value || '')
    .split(/[、,;|\n]/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatHouseNo(house = {}) {
  return house.houseNo || [house.building, house.unit, house.room].filter(Boolean).join(' ') || '';
}

function normalizeShift(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (/夜|晚/.test(text)) return '夜班';
  if (/早/.test(text)) return '早班';
  if (/白|日/.test(text)) return '白班';
  return text;
}

function inferShiftFromTime(value) {
  if (!value) return '白班';
  const date = new Date(String(value).replace(/-/g, '/'));
  if (Number.isNaN(date.getTime())) return '白班';
  const hour = date.getHours();
  if (hour >= 19 || hour < 8) return '夜班';
  if (hour >= 12) return '晚班';
  return '白班';
}

function extractRepairBuilding(repair = {}, houses = []) {
  if (repair.building) return repair.building;
  if (repair.houseId) {
    const linkedHouse = houses.find((house) => String(house.id) === String(repair.houseId));
    if (linkedHouse?.building) {
      return linkedHouse.building;
    }
  }
  const haystack = [repair.houseNo, repair.room, repair.title, repair.description, repair.categoryName, repair.category]
    .filter(Boolean)
    .join(' ');
  const matched = houses.find((house) => house.building && haystack.includes(house.building));
  return matched?.building || '';
}

function buildRepairRecommendationSet(repair = {}, houses = [], staffs = []) {
  const building = extractRepairBuilding(repair, houses);
  const keywords = [repair.categoryName, repair.category, repair.title, repair.description].filter(Boolean).join(' ');
  const targetShift = inferShiftFromTime(repair.appointmentTime || repair.createTime || new Date().toISOString());
  const scored = staffs
    .map((staff) => {
      const responsibleBuildings = splitBuildings(staff.responsibleBuildings);
      const text = [staff.role, staff.position, staff.department, staff.skill, staff.scope, staff.shift].filter(Boolean).join(' ');
      const shiftName = normalizeShift(staff.shift);
      const reason = [];
      let score = 0;
      if (staff.status === 'active') score += 20;
      if (building && responsibleBuildings.includes(building)) {
        score += 70;
        reason.push('同楼栋');
      }
      if (building && text.includes(building)) {
        score += 18;
        reason.push('负责区域包含楼栋');
      }
      if (shiftName && targetShift && shiftName === targetShift) {
        score += 24;
        reason.push('同班次');
      }
      if (/维修|工程|水电/.test(text)) {
        score += 20;
        reason.push('维修技能');
      }
      if (/报修|维修|抢修|水电/.test(keywords) && /维修|工程|水电/.test(text)) {
        score += 14;
      }
      if (/客服|物业/.test(text)) score += 6;
      if (String(staff.scope || '').includes('楼')) score += 4;
      if (staff.status === 'active') {
        reason.push('在岗');
      }
      return { ...staff, score, reason: Array.from(new Set(reason)).slice(0, 3), shiftName, responsibleBuildings };
    })
    .filter((staff) => staff.score > 0)
    .sort((a, b) => b.score - a.score || String(a.name || '').localeCompare(String(b.name || '')));
  const main = scored
    .filter((staff) => staff.responsibleBuildings.includes(building) || staff.reason.includes('同班次'))
    .slice(0, 3);
  const backup = scored
    .filter((staff) => !main.some((item) => item.id === staff.id))
    .slice(0, 3);
  const normalizedBackup = main.length ? backup : scored.slice(0, 3);
  return { building, targetShift, main, backup: normalizedBackup, all: scored.slice(0, 6) };
}

function rowsFor(type, item) {
  if (type === 'community') {
    return [
      ['项目名称', communityDisplayName(item)],
      ['地址', item.address],
      ['物业公司', item.propertyCompany],
      ['物业电话', item.propertyPhone],
      ['总房源', item.totalHouse],
      ['总车位', item.totalPark],
      ['可用车位', item.availablePark],
      ['默认主管', item.defaultSupervisor],
      ['主管列表', Array.isArray(item.supervisors) ? item.supervisors.join('、') : item.supervisors],
      ['状态', item.active ? '当前小区' : '未启用'],
      ['当前启用功能', COMMUNITY_FEATURES.filter((feature) => item[feature.field] !== false).map((feature) => feature.label).join('、')],
      ['更新时间', item.updateTime],
      ['备注', item.remark]
    ];
  }
  if (type === 'resident') {
    return [
      ['姓名', item.name],
      ['电话', item.phone],
      ['小区', item.community],
      ['房屋', item.houseNo || `${item.building || ''}${item.unit || ''}${item.room || ''}`],
      ['绑定房屋ID', item.houseId],
      ['绑定关系', item.relationship],
      ['状态', staffStatusLabel(item.status)],
      ['角色', item.role],
      ['房屋号', item.houseNo],
      ['创建时间', item.createTime],
      ['备注', item.remark]
    ];
  }
  if (type === 'house') {
    return [
      ['小区', item.community],
      ['房号', item.houseNo],
      ['楼栋', item.building],
      ['单元', item.unit],
      ['房间', item.room],
      ['面积', item.area],
      ['产权状态', houseOwnershipLabel(item.ownershipStatus)],
      ['入住状态', occupancyLabel(item.occupancyStatus || item.status)],
      ['业主', item.ownerName],
      ['电话', item.ownerPhone],
      ['绑定住户', item.boundUserName],
      ['绑定电话', item.boundUserPhone],
      ['状态', item.statusText || staffStatusLabel(item.status)],
      ['备注', item.remark]
    ];
  }
  if (type === 'staff') {
    return [
      ['小区', item.community],
      ['姓名', item.name],
      ['飞书成员名', item.feishuDisplayName || item.name],
      ['飞书绑定', item.feishuUserId || item.feishuOpenId || item.feishuUnionId ? '已绑定' : '未绑定'],
      ['飞书 user_id', item.feishuUserId],
      ['飞书 open_id', item.feishuOpenId],
      ['飞书 union_id', item.feishuUnionId],
      ['角色', item.role],
      ['岗位', item.position],
      ['部门', item.department],
      ['电话', item.phone],
      ['班次', item.shift],
      ['负责区域', item.scope],
      ['负责楼栋', Array.isArray(item.responsibleBuildings) ? item.responsibleBuildings.join('、') : item.responsibleBuildings],
      ['状态', item.statusText || staffStatusLabel(item.status)],
      ['技能', item.skill],
      ['备注', item.remark]
    ];
  }
  if (type === 'bill') {
    return [
      ['标题', item.title],
      ['类型', item.type],
      ['金额', item.amount == null ? '' : `¥${item.amount}`],
      ['周期', item.period],
      ['到期', item.dueDate],
      ['状态', item.status],
      ['房号', item.room],
      ['缴费时间', item.paidDate]
    ];
  }
  if (type === 'repair') {
    return [
      ['标题', item.title],
      ['类别', item.categoryName || item.category],
      ['状态', item.statusName || item.status],
      ['楼栋', item.building || '-'],
      ['房屋', item.houseNo || '-'],
      ['目标班次', item.dispatchShift || '-'],
      ['分派时间', item.dispatchTime || '-'],
      ['分派楼栋', item.dispatchBuilding || '-'],
      ['分派备注', item.dispatchRemark || '-'],
      ['描述', item.description],
      ['处理人', item.handler],
      ['电话', item.handlerPhone || item.phone],
      ['预约时间', item.appointmentTime],
      ['创建时间', item.createTime],
      ['完成时间', item.completionTime]
    ];
  }
  if (type === 'feedback') {
    return [
      ['小区', item.community],
      ['类型', item.type],
      ['分类', item.category],
      ['状态', item.statusText || item.status],
      ['内容', item.content],
      ['回复', item.reply],
      ['地点', item.location],
      ['时间', item.createTime]
    ];
  }
  if (type === 'complaintQueue') {
    return [
      ['小区', item.community],
      ['标题', item.title],
      ['内容', item.content],
      ['位置', item.location],
      ['严重等级', severityLabel(item.severity)],
      ['分析状态', complaintAnalysisLabel(item.analysisStatus)],
      ['分析时间', item.analysisTime],
      ['推送状态', complaintPushLabel(item.pushStatus)],
      ['推送时间', item.pushTime],
      ['规则', item.ruleName],
      ['负责人', item.supervisorName],
      ['飞书通知人', Array.isArray(item.mentionTargets) ? item.mentionTargets.join('、') : item.mentionTargets],
      ['建议动作', item.suggestedAction],
      ['摘要', item.summary],
      ['推送错误', item.pushError]
    ];
  }
  if (type === 'complaintRule') {
    return [
      ['名称', item.name],
      ['启用', item.enabled ? '是' : '否'],
      ['优先级', priorityLabel(item.priority)],
      ['严重等级', severityLabel(item.severity)],
      ['人员范围', item.onlyCurrentCommunityStaff === false ? '全部物业人员' : '当前小区人员'],
      ['关键词', Array.isArray(item.matchKeywords) ? item.matchKeywords.join('、') : item.matchKeywords],
      ['分类', Array.isArray(item.matchCategories) ? item.matchCategories.join('、') : item.matchCategories],
      ['楼栋', Array.isArray(item.matchBuildings) ? item.matchBuildings.join('、') : item.matchBuildings],
      ['负责人', item.supervisorName],
      ['飞书通知人', Array.isArray(item.mentionTargets) ? item.mentionTargets.join('、') : item.mentionTargets],
      ['自动分析', item.autoAnalyze ? '是' : '否'],
      ['自动推送', item.autoPush ? '是' : '否'],
      ['备注', item.remark]
    ];
  }
  if (type === 'visitor') {
    return [
      ['姓名', item.visitorName],
      ['电话', item.visitorPhone],
      ['用途', item.visitPurpose],
      ['通行码', item.passCode],
      ['状态', item.statusText || item.status],
      ['访问时间', item.visitTime],
      ['到期时间', item.expireTime]
    ];
  }
  if (type === 'decoration') {
    return [
      ['装修类型', item.decorationType],
      ['区域', item.area],
      ['状态', item.statusText || item.status],
      ['说明', item.description],
      ['施工时间', `${item.startDate || ''} 至 ${item.endDate || ''}`],
      ['公司', item.company],
      ['电话', item.phone],
      ['审核备注', item.reviewRemark]
    ];
  }
  if (type === 'express') {
    return [
      ['快递公司', item.company],
      ['到件时间', item.arriveTime],
      ['取件码', item.code],
      ['状态', item.statusText || item.status],
      ['创建时间', item.createTime],
      ['取件时间', item.pickupTime]
    ];
  }
  if (type === 'product') {
    return [
      ['名称', item.name],
      ['规格', item.spec],
      ['价格', item.price],
      ['库存', item.stock],
      ['状态', item.statusText || item.status],
      ['描述', item.description]
    ];
  }
  if (type === 'order') {
    return [
      ['订单号', item.orderNo],
      ['状态', item.statusText || item.status],
      ['金额', item.totalAmount],
      ['创建时间', item.createTime],
      ['取件时间', item.pickupTime],
      ['商品明细', JSON.stringify(item.items || [])]
    ];
  }
  return [
    ['标题', item.title],
    ['时间', item.time],
    ['重要', item.important ? '是' : '否'],
    ['内容', item.content]
  ];
}

function renderField(item, field, type, onChange, onToggle) {
  const value = item[field] == null ? '' : item[field];
  if (type === 'textarea') {
    const textValue = typeof value === 'string' ? value : JSON.stringify(value ?? '', null, 2);
    return (
      <label className="form-field">
        <span className="field-label">{fieldLabel(field)}</span>
        <textarea className="field textarea" value={textValue} onChange={onChange(field)} />
      </label>
    );
  }
  if (type === 'select') {
    return (
      <label className="form-field">
        <span className="field-label">{fieldLabel(field)}</span>
        <select className="field" value={value} onChange={onChange(field)}>
          <option value="">请选择</option>
        </select>
      </label>
    );
  }
  if (type === 'switch') {
    return (
      <label className="form-field">
        <span className="field-label">{fieldLabel(field)}</span>
        <button type="button" className={`chip ${value ? 'active' : ''}`} onClick={() => onToggle(field)}>
          {value ? '是' : '否'}
        </button>
      </label>
    );
  }
  return (
    <label className="form-field">
      <span className="field-label">{fieldLabel(field)}</span>
      <input className="field" type={type === 'number' ? 'number' : 'text'} value={value} onChange={onChange(field)} />
    </label>
  );
}

function MultiSelectField({ label, options, value, onToggleValue, onSelectAll, onClear, showActions = false }) {
  const selected = Array.isArray(value) ? value : splitTextList(value);
  return (
    <div className="form-field">
      <span className="field-label">{label}</span>
      {showActions ? (
        <div className="multi-select-actions">
          <button type="button" className="chip tiny" onClick={onSelectAll}>全选</button>
          <button type="button" className="chip tiny" onClick={onClear}>清空</button>
        </div>
      ) : null}
      <div className="multi-select">
        {options.length ? options.map((option) => {
          const active = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              className={`chip ${active ? 'active' : ''}`}
              onClick={() => onToggleValue(option.value)}
            >
              {option.label}
            </button>
          );
        }) : <div className="hint">暂无可选楼栋</div>}
      </div>
    </div>
  );
}

function SearchSelectField({ label, value, options, onChange, placeholder = '输入后搜索选择' }) {
  const listId = `${String(label || 'field').replace(/\s+/g, '-')}-options`;
  return (
    <label className="form-field">
      <span className="field-label">{label}</span>
      <input
        className="field"
        list={listId}
        value={value || ''}
        placeholder={placeholder}
        onChange={onChange}
      />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </datalist>
    </label>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="form-field">
      <span className="field-label">{label}</span>
      <select className="field" value={value == null ? '' : value} onChange={onChange}>
        <option value="">请选择</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function FormFields({
  type,
  item,
  onChange,
  onToggle,
  communityOptions = [],
  residentOptions = [],
  houseOptions = [],
  buildingOptions = [],
  staffMentionOptions = [],
  currentCommunityStaffOptions = [],
  currentCommunityStaffSummary = '',
  staffSupervisorOptions = [],
  currentDefaultSupervisor = '',
  onResidentHouseChange,
  onHouseResidentChange,
  onRepairHouseChange,
  onStaffBuildingsChange,
  onComplaintRuleMentionsChange,
  onComplaintRuleFillDefault,
  onComplaintRuleFillCommunity
}) {
  if (type === 'community') {
    return (
      <div className="form-grid two">
        <label className="form-field">
          <span className="field-label">项目名称</span>
          <input className="field" type="text" value={item.projectName || item.name || ''} onChange={onChange('projectName')} placeholder="输入项目名称" />
        </label>
        {renderField(item, 'address', 'text', onChange, onToggle)}
        {renderField(item, 'propertyCompany', 'text', onChange, onToggle)}
        {renderField(item, 'propertyPhone', 'text', onChange, onToggle)}
        {renderField(item, 'totalHouse', 'number', onChange, onToggle)}
        {renderField(item, 'totalPark', 'number', onChange, onToggle)}
        {renderField(item, 'availablePark', 'number', onChange, onToggle)}
        <SearchSelectField
          label={fieldLabel('defaultSupervisor')}
          value={item.defaultSupervisor || ''}
          options={staffSupervisorOptions}
          onChange={onChange('defaultSupervisor')}
          placeholder="输入姓名搜索主管"
        />
        {renderField(item, 'supervisors', 'textarea', onChange, onToggle)}
        {renderField(item, 'active', 'switch', onChange, onToggle)}
        <div className="form-field feature-switches-field">
          <span className="field-label">功能开关</span>
          <div className="chip-row feature-switches">
            {COMMUNITY_FEATURES.map((feature) => (
              <button
                key={feature.field}
                type="button"
                className={`chip ${item[feature.field] === false ? '' : 'active'}`}
                onClick={() => onToggle(feature.field)}
              >
                {feature.label}
                <span className="chip-state">{item[feature.field] === false ? '关' : '开'}</span>
              </button>
            ))}
          </div>
          <div className="hint">关闭后，前端页面和后台菜单会同步隐藏对应功能。</div>
        </div>
        <div className="form-field form-field-span">
          <span className="field-label">当前启用功能</span>
          <div className="chip-row feature-switches">
            {COMMUNITY_FEATURES.filter((feature) => item[feature.field] !== false).length ? (
              COMMUNITY_FEATURES.filter((feature) => item[feature.field] !== false).map((feature) => (
                <span key={feature.field} className="chip active">
                  {feature.label}
                </span>
              ))
            ) : (
              <div className="hint">当前未启用任何功能</div>
            )}
          </div>
        </div>
        {renderField(item, 'remark', 'textarea', onChange, onToggle)}
      </div>
    );
  }
  if (type === 'resident') {
    return (
      <div className="form-grid two">
        {renderField(item, 'name', 'text', onChange, onToggle)}
        {renderField(item, 'phone', 'text', onChange, onToggle)}
        <SearchSelectField
          label={fieldLabel('community')}
          value={item.community || ''}
          options={communityOptions}
          onChange={onChange('community')}
          placeholder="输入小区名称搜索"
        />
        {renderField(item, 'building', 'text', onChange, onToggle)}
        {renderField(item, 'unit', 'text', onChange, onToggle)}
        {renderField(item, 'room', 'text', onChange, onToggle)}
        <label className="form-field">
          <span className="field-label">{fieldLabel('houseId')}</span>
          <select className="field" value={item.houseId || ''} onChange={(event) => onResidentHouseChange(event.target.value)}>
            <option value="">请选择房屋</option>
            {houseOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        {renderField(item, 'houseNo', 'text', onChange, onToggle)}
        {renderField(item, 'relationship', 'text', onChange, onToggle)}
        {renderField(item, 'role', 'text', onChange, onToggle)}
        {renderField(item, 'status', 'text', onChange, onToggle)}
        {renderField(item, 'avatar', 'text', onChange, onToggle)}
        {renderField(item, 'remark', 'textarea', onChange, onToggle)}
      </div>
    );
  }
  if (type === 'house') {
    return (
      <div className="form-grid two">
        <SearchSelectField
          label={fieldLabel('community')}
          value={item.community || ''}
          options={communityOptions}
          onChange={onChange('community')}
          placeholder="输入小区名称搜索"
        />
        {renderField(item, 'houseNo', 'text', onChange, onToggle)}
        {renderField(item, 'building', 'text', onChange, onToggle)}
        {renderField(item, 'unit', 'text', onChange, onToggle)}
        {renderField(item, 'room', 'text', onChange, onToggle)}
        {renderField(item, 'area', 'number', onChange, onToggle)}
        {renderField(item, 'ownerName', 'text', onChange, onToggle)}
        {renderField(item, 'ownerPhone', 'text', onChange, onToggle)}
        {renderField(item, 'occupantName', 'text', onChange, onToggle)}
        {renderField(item, 'occupantPhone', 'text', onChange, onToggle)}
        <label className="form-field">
          <span className="field-label">{fieldLabel('boundUserId')}</span>
          <select className="field" value={item.boundUserId || ''} onChange={(event) => onHouseResidentChange(event.target.value)}>
            <option value="">请选择住户</option>
            {residentOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        {renderField(item, 'boundUserName', 'text', onChange, onToggle)}
        {renderField(item, 'boundUserPhone', 'text', onChange, onToggle)}
        {renderField(item, 'ownershipStatus', 'text', onChange, onToggle)}
        {renderField(item, 'occupancyStatus', 'text', onChange, onToggle)}
        {renderField(item, 'status', 'text', onChange, onToggle)}
        {renderField(item, 'statusText', 'text', onChange, onToggle)}
        {renderField(item, 'remark', 'textarea', onChange, onToggle)}
      </div>
    );
  }
  if (type === 'staff') {
    return (
      <div className="form-grid two">
        <SearchSelectField
          label={fieldLabel('community')}
          value={item.community || ''}
          options={communityOptions}
          onChange={onChange('community')}
          placeholder="输入小区名称搜索"
        />
        {renderField(item, 'name', 'text', onChange, onToggle)}
        {renderField(item, 'feishuDisplayName', 'text', onChange, onToggle)}
        {renderField(item, 'feishuUserId', 'text', onChange, onToggle)}
        {renderField(item, 'feishuOpenId', 'text', onChange, onToggle)}
        {renderField(item, 'feishuUnionId', 'text', onChange, onToggle)}
        {renderField(item, 'role', 'text', onChange, onToggle)}
        {renderField(item, 'position', 'text', onChange, onToggle)}
        {renderField(item, 'department', 'text', onChange, onToggle)}
        {renderField(item, 'phone', 'text', onChange, onToggle)}
        {renderField(item, 'status', 'text', onChange, onToggle)}
        {renderField(item, 'statusText', 'text', onChange, onToggle)}
        {renderField(item, 'skill', 'text', onChange, onToggle)}
        {renderField(item, 'shift', 'text', onChange, onToggle)}
        {renderField(item, 'scope', 'text', onChange, onToggle)}
        <MultiSelectField
          label={fieldLabel('responsibleBuildings')}
          options={buildingOptions}
          value={item.responsibleBuildings}
          onToggleValue={(building) => onStaffBuildingsChange(building)}
        />
        {renderField(item, 'remark', 'textarea', onChange, onToggle)}
      </div>
    );
  }
  if (type === 'bill') {
    return (
      <div className="form-grid two">
        {renderField(item, 'title', 'text', onChange, onToggle)}
        {renderField(item, 'type', 'text', onChange, onToggle)}
        {renderField(item, 'amount', 'number', onChange, onToggle)}
        {renderField(item, 'period', 'text', onChange, onToggle)}
        {renderField(item, 'dueDate', 'text', onChange, onToggle)}
        {renderField(item, 'status', 'text', onChange, onToggle)}
        {renderField(item, 'room', 'text', onChange, onToggle)}
        {renderField(item, 'paidDate', 'text', onChange, onToggle)}
      </div>
    );
  }
  if (type === 'repair') {
    return (
      <div className="form-grid two">
        <label className="form-field">
          <span className="field-label">{fieldLabel('houseId')}</span>
          <select className="field" value={item.houseId || ''} onChange={(event) => onRepairHouseChange(event.target.value)}>
            <option value="">请选择房屋</option>
            {houseOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        {renderField(item, 'title', 'text', onChange, onToggle)}
        {renderField(item, 'category', 'text', onChange, onToggle)}
        {renderField(item, 'categoryName', 'text', onChange, onToggle)}
        {renderField(item, 'houseNo', 'text', onChange, onToggle)}
        {renderField(item, 'building', 'text', onChange, onToggle)}
        {renderField(item, 'appointmentTime', 'text', onChange, onToggle)}
        {renderField(item, 'dispatchTime', 'text', onChange, onToggle)}
        {renderField(item, 'dispatchShift', 'text', onChange, onToggle)}
        {renderField(item, 'dispatchBuilding', 'text', onChange, onToggle)}
        {renderField(item, 'dispatchRemark', 'textarea', onChange, onToggle)}
        {renderField(item, 'status', 'text', onChange, onToggle)}
        {renderField(item, 'statusName', 'text', onChange, onToggle)}
        {renderField(item, 'handler', 'text', onChange, onToggle)}
        {renderField(item, 'handlerPhone', 'text', onChange, onToggle)}
        {renderField(item, 'description', 'textarea', onChange, onToggle)}
      </div>
    );
  }
  if (type === 'feedback') {
    return (
      <div className="form-grid two">
        <SearchSelectField
          label={fieldLabel('community')}
          value={item.community || ''}
          options={communityOptions}
          onChange={onChange('community')}
          placeholder="输入小区名称搜索"
        />
        <SelectField
          label={fieldLabel('type')}
          value={item.type || ''}
          options={[
            { value: '投诉', label: '投诉' },
            { value: '表扬', label: '表扬' }
          ]}
          onChange={onChange('type')}
        />
        {renderField(item, 'category', 'text', onChange, onToggle)}
        {renderField(item, 'title', 'text', onChange, onToggle)}
        <SelectField
          label={fieldLabel('status')}
          value={item.status || ''}
          options={[
            { value: 'pending', label: '待处理' },
            { value: 'replied', label: '已回复' }
          ]}
          onChange={onChange('status')}
        />
        {renderField(item, 'statusText', 'text', onChange, onToggle)}
        {renderField(item, 'location', 'text', onChange, onToggle)}
        {renderField(item, 'staffName', 'text', onChange, onToggle)}
        {renderField(item, 'staffPosition', 'text', onChange, onToggle)}
        {renderField(item, 'content', 'textarea', onChange, onToggle)}
        {renderField(item, 'reply', 'textarea', onChange, onToggle)}
      </div>
    );
  }
  if (type === 'complaintQueue') {
    return (
      <div className="form-grid two">
        {renderField(item, 'title', 'text', onChange, onToggle)}
        {renderField(item, 'location', 'text', onChange, onToggle)}
        <SelectField
          label={fieldLabel('severity')}
          value={item.severity || ''}
          options={[
            { value: 'high', label: '高 - 紧急' },
            { value: 'medium', label: '中 - 一般' },
            { value: 'low', label: '低 - 普通' }
          ]} 
          onChange={onChange('severity')}
        />
        <SelectField
          label={fieldLabel('analysisStatus')}
          value={item.analysisStatus || ''}
          options={[
            { value: 'pending', label: '待分析' },
            { value: 'done', label: '已分析' },
            { value: 'failed', label: '分析失败' }
          ]}
          onChange={onChange('analysisStatus')}
        />
        <SelectField
          label={fieldLabel('pushStatus')}
          value={item.pushStatus || ''}
          options={[
            { value: 'pending', label: '待推送' },
            { value: 'prepared', label: '待发送' },
            { value: 'sent', label: '已推送' },
            { value: 'failed', label: '推送失败' }
          ]}
          onChange={onChange('pushStatus')}
        />
        {renderField(item, 'ruleName', 'text', onChange, onToggle)}
        {renderField(item, 'supervisorName', 'text', onChange, onToggle)}
        {renderField(item, 'mentionTargets', 'textarea', onChange, onToggle)}
        {renderField(item, 'summary', 'textarea', onChange, onToggle)}
        {renderField(item, 'suggestedAction', 'text', onChange, onToggle)}
        {renderField(item, 'pushError', 'textarea', onChange, onToggle)}
        {renderField(item, 'createTime', 'text', onChange, onToggle)}
        {renderField(item, 'analysisTime', 'text', onChange, onToggle)}
        {renderField(item, 'pushTime', 'text', onChange, onToggle)}
        {renderField(item, 'content', 'textarea', onChange, onToggle)}
      </div>
    );
  }
  if (type === 'complaintRule') {
    return (
      <div className="form-grid two">
        <div className="form-field form-field-span">
          <span className="field-label">当前默认负责人</span>
          <div className="hint">{currentDefaultSupervisor || '未配置'}</div>
        </div>
        <div className="form-field form-field-span">
          <span className="field-label">当前小区可选物业人员</span>
          <div className="hint">{currentCommunityStaffSummary}</div>
        </div>
        <div className="form-field form-field-span">
          <span className="field-label">推送说明</span>
          <div className="hint">“负责人”是这条规则的负责人，“飞书通知人”才是实际会收到飞书推送的人。</div>
        </div>
        {renderField(item, 'name', 'text', onChange, onToggle)}
        {renderField(item, 'enabled', 'switch', onChange, onToggle)}
        <SelectField
          label={fieldLabel('priority')}
          value={String(item.priority || '')}
          options={[
            { value: '100', label: '100 - 最高' },
            { value: '80', label: '80 - 很高' },
            { value: '60', label: '60 - 较高' },
            { value: '40', label: '40 - 中' },
            { value: '20', label: '20 - 较低' },
            { value: '0', label: '0 - 最低' }
          ]}
          onChange={onChange('priority')}
        />
        <SelectField
          label={fieldLabel('severity')}
          value={item.severity || ''}
          options={[
            { value: 'high', label: '高 - 紧急' },
            { value: 'medium', label: '中 - 一般' },
            { value: 'low', label: '低 - 普通' }
          ]}
          onChange={onChange('severity')}
        />
        <label className="form-field">
          <span className="field-label">{fieldLabel('onlyCurrentCommunityStaff')}</span>
          <button
            type="button"
            className={`chip ${(item.onlyCurrentCommunityStaff !== false) ? 'active' : ''}`}
            onClick={() => onToggle('onlyCurrentCommunityStaff')}
          >
            {(item.onlyCurrentCommunityStaff !== false) ? '是' : '否'}
          </button>
        </label>
        <SearchSelectField
          label={fieldLabel('supervisorName')}
          value={item.supervisorName || ''}
          options={staffSupervisorOptions}
          onChange={onChange('supervisorName')}
          placeholder="输入姓名搜索，留空则跟随默认主管"
        />
        <MultiSelectField
          label={fieldLabel('mentionTargets')}
          options={item.onlyCurrentCommunityStaff ? currentCommunityStaffOptions : staffMentionOptions}
          value={item.mentionTargets}
          showActions
          onSelectAll={() => onComplaintRuleMentionsChange('__select_all__')}
          onClear={() => onComplaintRuleMentionsChange('__clear__')}
          onToggleValue={(name) => onComplaintRuleMentionsChange(name)}
        />
        <div className="button-row form-field-span">
          <button type="button" className="btn btn-ghost tiny" onClick={onComplaintRuleFillDefault}>填充当前主管</button>
          <button type="button" className="btn btn-ghost tiny" onClick={onComplaintRuleFillCommunity}>填充当前小区人员</button>
        </div>
        {renderField(item, 'matchKeywords', 'textarea', onChange, onToggle)}
        {renderField(item, 'matchCategories', 'textarea', onChange, onToggle)}
        {renderField(item, 'matchBuildings', 'textarea', onChange, onToggle)}
        {renderField(item, 'autoAnalyze', 'switch', onChange, onToggle)}
        {renderField(item, 'autoPush', 'switch', onChange, onToggle)}
        {renderField(item, 'remark', 'textarea', onChange, onToggle)}
        {renderField(item, 'createTime', 'text', onChange, onToggle)}
        {renderField(item, 'updateTime', 'text', onChange, onToggle)}
      </div>
    );
  }
  if (type === 'visitor') {
    return (
      <div className="form-grid two">
        {renderField(item, 'visitorName', 'text', onChange, onToggle)}
        {renderField(item, 'visitorPhone', 'text', onChange, onToggle)}
        {renderField(item, 'visitPurpose', 'text', onChange, onToggle)}
        {renderField(item, 'passCode', 'text', onChange, onToggle)}
        {renderField(item, 'status', 'text', onChange, onToggle)}
        {renderField(item, 'statusText', 'text', onChange, onToggle)}
        {renderField(item, 'visitTime', 'text', onChange, onToggle)}
        {renderField(item, 'expireTime', 'text', onChange, onToggle)}
      </div>
    );
  }
  if (type === 'decoration') {
    return (
      <div className="form-grid two">
        {renderField(item, 'decorationType', 'text', onChange, onToggle)}
        {renderField(item, 'area', 'text', onChange, onToggle)}
        {renderField(item, 'description', 'textarea', onChange, onToggle)}
        {renderField(item, 'status', 'text', onChange, onToggle)}
        {renderField(item, 'statusText', 'text', onChange, onToggle)}
        {renderField(item, 'startDate', 'text', onChange, onToggle)}
        {renderField(item, 'endDate', 'text', onChange, onToggle)}
        {renderField(item, 'company', 'text', onChange, onToggle)}
        {renderField(item, 'phone', 'text', onChange, onToggle)}
        {renderField(item, 'reviewRemark', 'textarea', onChange, onToggle)}
      </div>
    );
  }
  if (type === 'express') {
    return (
      <div className="form-grid two">
        {renderField(item, 'company', 'text', onChange, onToggle)}
        {renderField(item, 'arriveTime', 'text', onChange, onToggle)}
        {renderField(item, 'code', 'text', onChange, onToggle)}
        {renderField(item, 'status', 'text', onChange, onToggle)}
        {renderField(item, 'statusText', 'text', onChange, onToggle)}
        {renderField(item, 'createTime', 'text', onChange, onToggle)}
        {renderField(item, 'pickupTime', 'text', onChange, onToggle)}
      </div>
    );
  }
  if (type === 'product') {
    return (
      <div className="form-grid two">
        {renderField(item, 'name', 'text', onChange, onToggle)}
        {renderField(item, 'spec', 'text', onChange, onToggle)}
        {renderField(item, 'price', 'number', onChange, onToggle)}
        {renderField(item, 'stock', 'number', onChange, onToggle)}
        {renderField(item, 'status', 'text', onChange, onToggle)}
        {renderField(item, 'statusText', 'text', onChange, onToggle)}
        {renderField(item, 'cover', 'text', onChange, onToggle)}
        {renderField(item, 'description', 'textarea', onChange, onToggle)}
      </div>
    );
  }
  if (type === 'order') {
    return (
      <div className="form-grid two">
        {renderField(item, 'orderNo', 'text', onChange, onToggle)}
        {renderField(item, 'status', 'text', onChange, onToggle)}
        {renderField(item, 'statusText', 'text', onChange, onToggle)}
        {renderField(item, 'totalAmount', 'number', onChange, onToggle)}
        {renderField(item, 'createTime', 'text', onChange, onToggle)}
        {renderField(item, 'pickupTime', 'text', onChange, onToggle)}
        {renderField(item, 'items', 'textarea', onChange, onToggle)}
      </div>
    );
  }
  return (
    <div className="form-grid">
      {renderField(item, 'title', 'text', onChange, onToggle)}
      {renderField(item, 'time', 'text', onChange, onToggle)}
      {renderField(item, 'important', 'switch', onChange, onToggle)}
      {renderField(item, 'content', 'textarea', onChange, onToggle)}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { apiBase, token, logout, profile } = useAuth();

  const [activeTab, setActiveTab] = useState('notice');
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({ notice: 'all', bill: 'all', repair: 'all', community: 'all', resident: 'all', house: 'all', staff: 'all' });
  const [extraFilters, setExtraFilters] = useState({ notice: 'all', bill: 'all', repair: 'all', community: 'all', resident: 'all', house: 'all', staff: 'all', feedback: 'all' });
  const [communityFilters, setCommunityFilters] = useState({ resident: 'all', house: 'all', feedback: 'all', complaintQueue: 'all' });
  const [sortField, setSortField] = useState('time');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(8);
  const [notices, setNotices] = useState([]);
  const [bills, setBills] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [users, setUsers] = useState([]);
  const [houses, setHouses] = useState([]);
  const [staffs, setStaffs] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [complaintQueue, setComplaintQueue] = useState([]);
  const [complaintRules, setComplaintRules] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [decorations, setDecorations] = useState([]);
  const [expressItems, setExpressItems] = useState([]);
  const [vegetableProducts, setVegetableProducts] = useState([]);
  const [vegetableOrders, setVegetableOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('等待连接');
  const [drawer, setDrawer] = useState(null);
  const [drawerMode, setDrawerMode] = useState('view');
  const [drawerDraft, setDrawerDraft] = useState(null);
  const [modal, setModal] = useState(null);
  const [modalDraft, setModalDraft] = useState(null);
  const [feishuBindModal, setFeishuBindModal] = useState(null);
  const [collapsedGroups, setCollapsedGroups] = useState({ core: false, communityConfig: false, asset: false, organization: false, service: false, mall: false });
  const [projectsCollapsed, setProjectsCollapsed] = useState(true);

  const currentList =
    activeTab === 'bill' ? bills :
    activeTab === 'repair' ? repairs :
    activeTab === 'community' ? communities :
    activeTab === 'resident' ? users :
    activeTab === 'house' ? houses :
    activeTab === 'staff' ? staffs :
    activeTab === 'feedback' ? feedbacks :
    activeTab === 'complaintQueue' ? complaintQueue :
    activeTab === 'complaintRule' ? complaintRules :
    activeTab === 'visitor' ? visitors :
    activeTab === 'decoration' ? decorations :
    activeTab === 'express' ? expressItems :
    activeTab === 'product' ? vegetableProducts :
    activeTab === 'order' ? vegetableOrders :
    notices;
  const activeCommunity = useMemo(() => communities.find((item) => Boolean(item.active)) || communities[0] || null, [communities]);
  const activeCommunityName = useMemo(() => communityDisplayName(activeCommunity), [activeCommunity]);
  const activeCommunityId = useMemo(() => String(activeCommunity?.id || '').trim(), [activeCommunity]);
  const scopeRows = (list, tab = activeTab) => {
    if (tab === 'community') {
      return list;
    }
    if (!activeCommunityId && !activeCommunityName) {
      return list;
    }
    return list.filter((item) => {
      const itemCommunityId = String(item.communityId || '').trim();
      const itemCommunityName = String(item.community || '').trim();
      if (activeCommunityId && itemCommunityId) {
        return itemCommunityId === activeCommunityId;
      }
      if (activeCommunityId && !itemCommunityId) {
        return itemCommunityName === activeCommunityName;
      }
      return itemCommunityName === activeCommunityName;
    });
  };
  const currentRows = useMemo(() => {
    return scopeRows(currentList, activeTab);
  }, [activeTab, currentList, activeCommunityId, activeCommunityName]);
  const residentOptions = useMemo(() => users.map((user) => ({
    value: user.id,
    label: `${user.name || '未命名'}${user.phone ? ` / ${user.phone}` : ''}${user.houseNo ? ` / ${user.houseNo}` : ''}`
  })), [users]);
  const houseOptions = useMemo(() => houses.map((house) => ({
    value: house.id,
    label: `${house.houseNo || `${house.building || ''}${house.unit || ''}${house.room || ''}` || '未命名'}${house.statusText ? ` / ${house.statusText}` : ''}`
  })), [houses]);
  const buildingOptions = useMemo(() => {
    const names = Array.from(new Set(houses.map((house) => house.building).filter(Boolean)));
    return names.map((name) => ({ value: name, label: name }));
  }, [houses]);
  const visibleNavGroups = useMemo(() => communityVisibleGroups(activeCommunity), [activeCommunity]);
  const visibleTabs = useMemo(() => visibleNavGroups.flatMap((group) => group.tabs), [visibleNavGroups]);
  const communityOptions = useMemo(() => {
    const seen = new Set();
    return communities
      .map((community) => {
        const value = communityDisplayName(community);
        if (!value || seen.has(value)) {
          return null;
        }
        seen.add(value);
        const label = [
          value,
          community.active ? '当前' : '',
          community.defaultSupervisor ? community.defaultSupervisor : ''
        ].filter(Boolean).join(' / ');
        return { value, label };
      })
      .filter(Boolean);
  }, [communities]);
  const staffMentionOptions = useMemo(() => {
    const seen = new Set();
    return staffs
      .map((staff) => {
        const value = String(staff.name || '').trim();
        if (!value || seen.has(value)) {
          return null;
        }
        seen.add(value);
        const label = [
          value,
          staff.role || '',
          staff.position || '',
          staff.phone || ''
        ].filter(Boolean).join(' / ');
        return { value, label };
      })
      .filter(Boolean);
  }, [staffs]);
  const currentCommunityStaffOptions = useMemo(() => {
    const source = activeCommunityName
      ? staffs.filter((staff) => {
        const staffCommunityId = String(staff.communityId || '').trim();
        const staffCommunity = String(staff.community || '').trim();
        if (activeCommunityId && staffCommunityId) {
          return staffCommunityId === activeCommunityId;
        }
        return !staffCommunity || staffCommunity === activeCommunityName;
      })
      : staffs;
    const seen = new Set();
    return source
      .map((staff) => {
        const value = String(staff.name || '').trim();
        if (!value || seen.has(value)) {
          return null;
        }
        seen.add(value);
        const label = [
          value,
          staff.role || '',
          staff.position || '',
          staff.phone || ''
        ].filter(Boolean).join(' / ');
        return { value, label };
      })
      .filter(Boolean);
  }, [activeCommunityId, activeCommunityName, staffs]);
  const currentCommunityStaffSummary = useMemo(() => {
    const names = currentCommunityStaffOptions.map((item) => item.value);
    const head = names.slice(0, 6).join('、');
    const more = names.length > 6 ? ` 等${names.length}人` : ` 共${names.length}人`;
    return names.length ? `${head}${more}` : '未配置可选物业人员';
  }, [currentCommunityStaffOptions]);
  const communitySwitchOptions = useMemo(() => communities.map((community) => ({
    value: community.id,
    label: `${communityDisplayName(community)}${community.active ? ' / 当前' : ''}${community.defaultSupervisor ? ` / ${community.defaultSupervisor}` : ''}`
  })), [communities]);
  const communityNamePreview = useMemo(() => {
    if (!communitySwitchOptions.length) {
      return '暂无小区';
    }
    const names = communitySwitchOptions.map((option) => option.label.split(' / ')[0]);
    const head = names.slice(0, 5).join('、');
    const more = names.length > 5 ? ` 等${names.length}个项目` : ` 共${names.length}个项目`;
    return `${head}${more}`;
  }, [communitySwitchOptions]);
  const staffSupervisorOptions = useMemo(() => {
    const communitySupervisors = communities.flatMap((community) => splitTextList(community.supervisors || community.defaultSupervisor));
    const defaults = activeCommunity?.defaultSupervisor ? [activeCommunity.defaultSupervisor] : [];
    const names = Array.from(new Set([
      ...defaults,
      ...communitySupervisors,
      ...staffs.map((staff) => staff.name).filter(Boolean),
      '卜立胜',
      '客服主管',
      '维修主管'
    ]));
    return names.map((name) => ({ value: name, label: name }));
  }, [activeCommunity, staffs]);
  const defaultSupervisorName = useMemo(() => {
    const configured = String(activeCommunity?.defaultSupervisor || '').trim();
    return configured || '卜立胜';
  }, [activeCommunity]);
  const userById = useMemo(() => Object.fromEntries(users.map((user) => [user.id, user])), [users]);
  const houseById = useMemo(() => Object.fromEntries(houses.map((house) => [house.id, house])), [houses]);
  const staffById = useMemo(() => Object.fromEntries(staffs.map((staff) => [staff.id, staff])), [staffs]);
  const operatorLabel = profile?.adminKeyHint ? 'Web管理员' : '管理员';
  const repairRecommendationSet = useMemo(() => {
    if (!drawer || drawer.type !== 'repair') {
      return { building: '', targetShift: '', main: [], backup: [], all: [] };
    }
    const source = drawerMode === 'edit' && drawerDraft ? drawerDraft : drawer.item;
    return buildRepairRecommendationSet(source, houses, staffs);
  }, [drawer, drawerMode, drawerDraft, houses, staffs]);
  const repairBuildingLabel = useMemo(() => {
    if (!drawer || drawer.type !== 'repair') {
      return '';
    }
    const source = drawerMode === 'edit' && drawerDraft ? drawerDraft : drawer.item;
    return extractRepairBuilding(source, houses);
  }, [drawer, drawerMode, drawerDraft, houses]);
  const repairShiftLabel = repairRecommendationSet.targetShift || '';
  const extraFilterItems = useMemo(() => advancedFilterOptions(activeTab, currentRows), [activeTab, currentRows]);
  const currentCommunityFilter = communityFilters[activeTab] || 'all';
  const communityFilterItems = useMemo(() => {
    if (!['resident', 'house', 'feedback', 'complaintQueue'].includes(activeTab)) {
      return [];
    }
    return communityFilterOptions(currentRows);
  }, [activeTab, currentRows]);
  const currentBatchOptions = useMemo(() => batchOptions(activeTab), [activeTab]);

  const buildRepairAuditEntry = (baseRepair, patch, action, reason) => {
    const stamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    return {
      action,
      actor: operatorLabel,
      actorHint: profile?.adminKeyHint || '',
      time: stamp,
      fromStatus: baseRepair?.status || '',
      toStatus: patch?.status ?? baseRepair?.status ?? '',
      handler: patch?.handler ?? baseRepair?.handler ?? '',
      handlerPhone: patch?.handlerPhone ?? baseRepair?.handlerPhone ?? '',
      building: patch?.dispatchBuilding ?? baseRepair?.dispatchBuilding ?? extractRepairBuilding(baseRepair || {}, houses),
      shift: patch?.dispatchShift ?? baseRepair?.dispatchShift ?? inferShiftFromTime(baseRepair?.appointmentTime || baseRepair?.createTime || stamp),
      remark: reason || patch?.dispatchRemark || baseRepair?.dispatchRemark || ''
    };
  };

  const buildRepairVersion = (baseRepair, patch, action, reason) => {
    const nextRepair = {
      ...(baseRepair || {}),
      ...(patch || {})
    };
    const history = Array.isArray(baseRepair?.dispatchHistory) ? [...baseRepair.dispatchHistory] : [];
    const entry = buildRepairAuditEntry(baseRepair, patch, action, reason);
    nextRepair.dispatchHistory = [...history, entry];
    nextRepair.lastModifiedBy = operatorLabel;
    nextRepair.lastModifiedAt = entry.time;
    nextRepair.updateTime = entry.time;
    return nextRepair;
  };

  const refreshLists = async () => {
    const [noticeList, billList, repairList, communityList, userList, houseList, staffList, feedbackList, complaintQueueList, complaintRuleList, visitorList, decorationList, expressList, productList, orderList] = await Promise.all([
      listNotices(apiBase, token),
      listBills(apiBase, token),
      listRepairs(apiBase, token),
      listCommunities(apiBase, token),
      listUsers(apiBase, token),
      listHouses(apiBase, token),
      listStaffs(apiBase, token),
      listFeedbacks(apiBase, token),
      listComplaintQueue(apiBase, token),
      listComplaintRules(apiBase, token),
      listVisitors(apiBase, token),
      listDecorations(apiBase, token),
      listExpress(apiBase, token),
      listVegetableProducts(apiBase, token),
      listVegetableOrders(apiBase, token)
    ]);
    setNotices(noticeList || []);
    setBills(billList || []);
    setRepairs(repairList || []);
    setCommunities(communityList || []);
    setUsers(userList || []);
    setHouses(houseList || []);
    setStaffs(staffList || []);
    setFeedbacks(feedbackList || []);
    setComplaintQueue(complaintQueueList || []);
    setComplaintRules(complaintRuleList || []);
    setVisitors(visitorList || []);
    setDecorations(decorationList || []);
    setExpressItems(expressList || []);
    setVegetableProducts(productList || []);
    setVegetableOrders(orderList || []);
  };

  const filteredItems = useMemo(() => {
    const filter = filters[activeTab];
    const extraFilter = extraFilters[activeTab] || 'all';
    const communityFilter = communityFilters[activeTab] || 'all';
    const query = searchText.trim().toLowerCase();
    const list = currentRows.filter((item) => {
      const passCommunity =
        communityFilter === 'all' ||
        String(item.community || '').trim() === communityFilter;
      const passFilter =
        filter === 'all' ||
        (activeTab === 'notice' ? (filter === 'important' ? item.important : !item.important) :
         activeTab === 'community' ? (filter === 'active' ? Boolean(item.active) : filter === 'inactive' ? !item.active : true) :
         activeTab === 'resident' ? item.status === filter :
         activeTab === 'house' ? item.status === filter :
         activeTab === 'staff' ? item.status === filter :
         activeTab === 'bill' ? item.status === filter :
         activeTab === 'repair' ? item.status === filter :
         activeTab === 'feedback' ? (item.type === filter || item.status === filter) :
         activeTab === 'complaintQueue' ? (filter === 'pending' ? item.analysisStatus === 'pending' : filter === 'done' ? item.analysisStatus === 'done' : filter === 'sent' ? item.pushStatus === 'sent' : filter === 'failed' ? item.pushStatus === 'failed' : true) :
         activeTab === 'complaintRule' ? (filter === 'enabled' ? Boolean(item.enabled) : filter === 'disabled' ? !item.enabled : true) :
         activeTab === 'visitor' ? item.status === filter :
         activeTab === 'decoration' ? item.status === filter :
         activeTab === 'express' ? item.status === filter :
         activeTab === 'product' ? item.status === filter :
         activeTab === 'order' ? item.status === filter :
         item.status === filter);
      const passExtra =
        extraFilter === 'all' ||
        (activeTab === 'community' ? (extraFilter === 'all' ? true : splitTextList(item.supervisors || item.defaultSupervisor).includes(extraFilter)) :
        (activeTab === 'resident' ? item.relationship === extraFilter :
         activeTab === 'house' ? item.ownershipStatus === extraFilter :
         activeTab === 'staff' ? item.role === extraFilter :
         activeTab === 'repair' ? (extraFilter === 'unassigned' ? !item.handler : extraFilter === 'assigned' ? Boolean(item.handler) : (item.dispatchHistory || []).length > 0) :
         activeTab === 'feedback' ? item.type === extraFilter :
         activeTab === 'complaintQueue' ? (extraFilter === 'all' ? true : String(item.severity || '') === extraFilter) :
         activeTab === 'complaintRule' ? (extraFilter === 'all' ? true : String(item.supervisorName || '') === extraFilter) :
         true));
      const passSearch = !query || Object.values(item).some((value) => String(value == null ? '' : value).toLowerCase().includes(query));
      return passCommunity && passFilter && passExtra && passSearch;
    });

    list.sort((a, b) => {
      if (activeTab === 'complaintQueue') {
        const communityLeft = String(a.community || '').localeCompare(String(b.community || ''));
        if (communityLeft !== 0) return communityLeft;
      }
      let left = a[sortField];
      let right = b[sortField];
      if (sortField === 'amount') {
        left = Number(left || 0);
        right = Number(right || 0);
      }
      if (sortField === 'important') {
        left = a.important ? 1 : 0;
        right = b.important ? 1 : 0;
      }
      if (left === right) return 0;
      const order = sortOrder === 'asc' ? 1 : -1;
      return left > right ? order : -order;
    });
    return list;
  }, [currentRows, activeTab, filters, extraFilters, searchText, sortField, sortOrder, communityFilters]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const pageItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((item) => ({
    ...item,
    selected: selectedIds.includes(item.id)
  }));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!visibleTabs.length) {
      return;
    }
    if (!visibleTabs.includes(activeTab)) {
      setTab(visibleTabs[0]);
    }
  }, [activeTab, setTab, visibleTabs]);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      setStatusText('加载中...');
      try {
        await refreshLists();
        setStatusText(`已连接 ${apiBase}`);
      } catch (error) {
        setStatusText(error.message || '加载失败');
        if (error.status === 401) {
          await logout();
          navigate('/login', { replace: true });
        }
      } finally {
        setLoading(false);
      }
    };
    if (token) {
      loadAll();
    }
  }, [apiBase, token, logout, navigate]);

  function setTab(tab) {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setSearchText('');
    setSelectedIds([]);
    setCurrentPage(1);
    const defaults =
      tab === 'community' ? { field: 'updateTime', order: 'desc' } :
      tab === 'resident' ? { field: 'room', order: 'asc' } :
      tab === 'house' ? { field: 'houseNo', order: 'asc' } :
      tab === 'staff' ? { field: 'name', order: 'asc' } :
      tab === 'bill' ? { field: 'dueDate', order: 'asc' } :
      tab === 'repair' ? { field: 'createTime', order: 'desc' } :
      tab === 'feedback' ? { field: 'createTime', order: 'desc' } :
      tab === 'complaintQueue' ? { field: 'createTime', order: 'desc' } :
      tab === 'complaintRule' ? { field: 'priority', order: 'desc' } :
      tab === 'visitor' ? { field: 'visitTime', order: 'desc' } :
      tab === 'decoration' ? { field: 'applyDate', order: 'desc' } :
      tab === 'express' ? { field: 'createTime', order: 'desc' } :
      tab === 'product' ? { field: 'price', order: 'desc' } :
      tab === 'order' ? { field: 'createTime', order: 'desc' } :
      { field: 'time', order: 'desc' };
    setSortField(defaults.field);
    setSortOrder(defaults.order);
    setFilters((prev) => ({ ...prev, [tab]: 'all' }));
    setExtraFilters((prev) => ({ ...prev, [tab]: 'all' }));
    setCommunityFilters((prev) => ({ ...prev, [tab]: 'all' }));
    setDrawer(null);
    setModal(null);
  }

  const updateSelected = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
  };

  const selectPage = () => {
    const ids = pageItems.map((item) => item.id);
    setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const clearSelection = () => setSelectedIds([]);

  const resetFilters = () => {
    setSearchText('');
    setFilters((prev) => ({ ...prev, [activeTab]: 'all' }));
    setExtraFilters((prev) => ({ ...prev, [activeTab]: 'all' }));
    setCommunityFilters((prev) => ({ ...prev, [activeTab]: 'all' }));
    setCurrentPage(1);
  };

  const listForTab = (tab) => {
    const raw = tab === 'notice' ? notices :
      tab === 'bill' ? bills :
      tab === 'repair' ? repairs :
      tab === 'community' ? communities :
      tab === 'resident' ? users :
      tab === 'house' ? houses :
      tab === 'staff' ? staffs :
      tab === 'feedback' ? feedbacks :
      tab === 'complaintQueue' ? complaintQueue :
      tab === 'complaintRule' ? complaintRules :
      tab === 'visitor' ? visitors :
      tab === 'decoration' ? decorations :
      tab === 'express' ? expressItems :
      tab === 'product' ? vegetableProducts :
      vegetableOrders;
    return scopeRows(raw, tab);
  };

  const tabCount = (tab) => listForTab(tab).length;

  const toggleGroup = (key) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const canCreateForTab = (tab) => !['complaintQueue'].includes(tab);

  const openDrawer = (item, mode = 'view') => {
    setDrawer({ type: activeTab, item: clone(item) });
    setDrawerMode(mode);
    setDrawerDraft(clone(item));
  };

  const openModal = () => {
    if (!canCreateForTab(activeTab)) {
      if (activeTab === 'complaintQueue') {
        window.alert('投诉队列不支持新建，请通过投诉记录自动进入队列。');
      }
      return;
    }
    setModal({ type: activeTab });
    const draft = defaultDraftFor(activeTab);
    if (activeTab === 'complaintRule') {
      draft.supervisorName = defaultSupervisorName;
      draft.mentionTargets = currentCommunityStaffOptions.some((item) => item.value === defaultSupervisorName)
        ? [defaultSupervisorName]
        : [];
    }
    if (activeTab === 'resident' || activeTab === 'house' || activeTab === 'feedback') {
      draft.community = draft.community || communityDisplayName(activeCommunity);
    }
    if (activeTab === 'staff') {
      draft.community = draft.community || communityDisplayName(activeCommunity);
    }
    if (activeTab === 'community') {
      draft.id = '';
      draft.active = communities.length === 0;
      draft.defaultSupervisor = defaultSupervisorName;
      draft.supervisors = staffSupervisorOptions.map((item) => item.value).join('、');
    }
    setModalDraft(draft);
  };

  const closeDrawer = () => {
    setDrawer(null);
    setDrawerDraft(null);
    setDrawerMode('view');
  };

  const closeModal = () => {
    setModal(null);
    setModalDraft(null);
  };

  const saveItem = async (type, draft) => {
    const payload = stripUiFields(draft);
    const originalResident = drawer?.type === 'resident' ? drawer.item : null;
    const originalHouse = drawer?.type === 'house' ? drawer.item : null;
    if (type === 'bill' && payload.amount !== '' && payload.amount != null) {
      payload.amount = Number(payload.amount);
    }
    if (type === 'product') {
      if (payload.price !== '' && payload.price != null) {
        payload.price = Number(payload.price);
      }
      if (payload.stock !== '' && payload.stock != null) {
        payload.stock = Number(payload.stock);
      }
    }
    if (type === 'community') {
      payload.name = String(payload.projectName || payload.name || '').trim();
      payload.projectName = payload.name;
      if (payload.totalHouse !== '' && payload.totalHouse != null) {
        payload.totalHouse = Number(payload.totalHouse);
      }
      if (payload.totalPark !== '' && payload.totalPark != null) {
        payload.totalPark = Number(payload.totalPark);
      }
      if (payload.availablePark !== '' && payload.availablePark != null) {
        payload.availablePark = Number(payload.availablePark);
      }
      if (typeof payload.supervisors === 'string') {
        payload.supervisors = payload.supervisors
          .split(/[、,;|\n]/g)
          .map((value) => value.trim())
          .filter(Boolean);
      }
      if (Array.isArray(payload.supervisors) && payload.supervisors.length) {
        const defaultName = String(payload.defaultSupervisor || '').trim();
        if (!defaultName) {
          payload.defaultSupervisor = payload.supervisors[0];
        } else if (!payload.supervisors.includes(defaultName)) {
          payload.supervisors = [defaultName, ...payload.supervisors];
        }
      }
      COMMUNITY_FEATURES.forEach((feature) => {
        if (payload[feature.field] === undefined || payload[feature.field] === null || payload[feature.field] === '') {
          payload[feature.field] = true;
        }
      });
    }
  if (type === 'complaintRule') {
    const useCurrentCommunityOnly = payload.onlyCurrentCommunityStaff !== false;
    payload.onlyCurrentCommunityStaff = useCurrentCommunityOnly;
    const priorityValue = Number(payload.priority);
    payload.priority = Number.isNaN(priorityValue) ? 0 : priorityValue;
    const mentionPool = useCurrentCommunityOnly ? currentCommunityStaffOptions : staffMentionOptions;
      if (!String(payload.supervisorName || '').trim()) {
        payload.supervisorName = defaultSupervisorName;
      }
      if (Array.isArray(payload.mentionTargets)) {
        payload.mentionTargets = payload.mentionTargets.filter(Boolean);
      } else if (typeof payload.mentionTargets === 'string') {
        payload.mentionTargets = payload.mentionTargets
          .split(/[、,;|\n]/g)
          .map((value) => value.trim())
          .filter(Boolean);
      }
      if (!payload.mentionTargets || !payload.mentionTargets.length) {
        payload.mentionTargets = mentionPool.some((item) => item.value === defaultSupervisorName)
          ? [defaultSupervisorName]
          : [defaultSupervisorName];
      }
    }
    if (type === 'resident' && payload.houseId && houseById[payload.houseId] && !String(payload.community || '').trim()) {
      payload.community = String(houseById[payload.houseId].community || '').trim();
    }
    if (type === 'house' && payload.boundUserId && userById[payload.boundUserId] && !String(payload.community || '').trim()) {
      payload.community = String(userById[payload.boundUserId].community || '').trim();
    }
    if ((type === 'resident' || type === 'house' || type === 'feedback') && !String(payload.community || '').trim()) {
      payload.community = communityDisplayName(activeCommunity);
    }
    if ((type === 'notice' || type === 'bill' || type === 'repair' || type === 'resident' || type === 'house' || type === 'staff' || type === 'feedback' || type === 'visitor' || type === 'decoration' || type === 'express' || type === 'product' || type === 'order') && !String(payload.communityId || '').trim()) {
      payload.communityId = String(activeCommunity?.id || '').trim();
    }
    if ((type === 'notice' || type === 'bill' || type === 'repair' || type === 'resident' || type === 'house' || type === 'staff' || type === 'feedback' || type === 'visitor' || type === 'decoration' || type === 'express' || type === 'product' || type === 'order') && !String(payload.community || '').trim()) {
      payload.community = communityDisplayName(activeCommunity);
    }
    if (type === 'order' && typeof payload.items === 'string') {
      try {
        payload.items = JSON.parse(payload.items || '[]');
      } catch (error) {
        payload.items = [];
      }
      if (payload.totalAmount !== '' && payload.totalAmount != null) {
        payload.totalAmount = Number(payload.totalAmount);
      }
    }
    if (type === 'staff' && typeof payload.responsibleBuildings === 'string') {
      payload.responsibleBuildings = payload.responsibleBuildings
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
    }
    setLoading(true);
    try {
      if (type === 'notice') {
        await saveNotice(apiBase, token, payload);
      } else if (type === 'bill') {
        await saveBill(apiBase, token, payload);
      } else if (type === 'repair') {
        const action = payload.id ? 'manual_save' : 'create';
        const note = payload.dispatchRemark || (payload.handler ? '手动保存处理人信息' : '保存报修记录');
        await saveRepair(apiBase, token, buildRepairVersion(draft, payload, action, note));
      } else if (type === 'community') {
        await saveCommunityById(apiBase, token, payload);
      } else if (type === 'resident') {
        const savedUser = await saveUser(apiBase, token, payload);
        const residentId = savedUser?.id || payload.id;
        if (payload.houseId && houseById[payload.houseId]) {
          const linkedHouse = houseById[payload.houseId];
          const relatedCommunity = String(payload.community || linkedHouse.community || communityDisplayName(activeCommunity) || '').trim();
          const relatedCommunityId = String(payload.communityId || linkedHouse.communityId || activeCommunity?.id || '').trim();
          await saveHouse(apiBase, token, stripUiFields({
            ...linkedHouse,
            community: relatedCommunity || linkedHouse.community || '',
            communityId: relatedCommunityId || linkedHouse.communityId || '',
            houseNo: payload.houseNo || formatHouseNo(linkedHouse),
            building: payload.building || linkedHouse.building || '',
            unit: payload.unit || linkedHouse.unit || '',
            room: payload.room || linkedHouse.room || '',
            boundUserId: residentId || linkedHouse.boundUserId || '',
            boundUserName: payload.name || linkedHouse.boundUserName || '',
            boundUserPhone: payload.phone || linkedHouse.boundUserPhone || '',
            occupantName: payload.name || linkedHouse.occupantName || '',
            occupantPhone: payload.phone || linkedHouse.occupantPhone || '',
            ownershipStatus: linkedHouse.ownershipStatus || 'self_owned',
            occupancyStatus: payload.status === 'inactive' ? 'vacant' : 'occupied',
            status: payload.status === 'inactive' ? 'vacant' : 'occupied',
            statusText: payload.status === 'inactive' ? '空置' : '已入住'
          }));
        }
        if (originalResident?.houseId && String(originalResident.houseId) !== String(payload.houseId || '')) {
          const previousHouse = houseById[originalResident.houseId];
          if (previousHouse) {
            await saveHouse(apiBase, token, stripUiFields({
              ...previousHouse,
              boundUserId: '',
              boundUserName: '',
              boundUserPhone: '',
              occupantName: '',
              occupantPhone: '',
              occupancyStatus: 'vacant',
              status: 'vacant',
              statusText: '空置'
            }));
          }
        }
      } else if (type === 'house') {
        const savedHouse = await saveHouse(apiBase, token, payload);
        const houseId = savedHouse?.id || payload.id;
        if (payload.boundUserId && userById[payload.boundUserId]) {
          const linkedUser = userById[payload.boundUserId];
          const relatedCommunity = String(payload.community || linkedUser.community || communityDisplayName(activeCommunity) || '').trim();
          const relatedCommunityId = String(payload.communityId || linkedUser.communityId || activeCommunity?.id || '').trim();
          await saveUser(apiBase, token, stripUiFields({
            ...linkedUser,
            community: relatedCommunity || linkedUser.community || '',
            communityId: relatedCommunityId || linkedUser.communityId || '',
            houseId: houseId || linkedUser.houseId || '',
            houseNo: payload.houseNo || formatHouseNo(payload),
            building: payload.building || linkedUser.building || '',
            unit: payload.unit || linkedUser.unit || '',
            room: payload.room || linkedUser.room || '',
            relationship: payload.relationship || linkedUser.relationship || '业主',
            status: linkedUser.status || 'active',
            role: linkedUser.role || 'resident'
          }));
        }
        if (originalHouse?.boundUserId && String(originalHouse.boundUserId) !== String(payload.boundUserId || '')) {
          const previousUser = userById[originalHouse.boundUserId];
          if (previousUser) {
            await saveUser(apiBase, token, stripUiFields({
              ...previousUser,
              houseId: '',
              houseNo: '',
              building: '',
              unit: '',
              room: ''
            }));
          }
        }
      } else if (type === 'staff') {
        await saveStaff(apiBase, token, payload);
      } else if (type === 'feedback') {
        await saveFeedback(apiBase, token, stripUiFields({
          ...payload,
          community: String(payload.community || communityDisplayName(activeCommunity) || '').trim()
        }));
      } else if (type === 'complaintRule') {
        await saveComplaintRule(apiBase, token, payload);
      } else if (type === 'complaintQueue') {
        window.alert('投诉队列不支持直接编辑，请使用“AI 分析”或“一键推飞书”。');
        return;
      } else if (type === 'visitor') {
        await saveVisitor(apiBase, token, payload);
      } else if (type === 'decoration') {
        await saveDecoration(apiBase, token, payload);
      } else if (type === 'express') {
        await saveExpress(apiBase, token, payload);
      } else if (type === 'product') {
        await saveVegetableProduct(apiBase, token, payload);
      } else if (type === 'order') {
        await saveVegetableOrder(apiBase, token, payload);
      }
      setStatusText('已保存');
      closeDrawer();
      closeModal();
      await refreshLists();
    } catch (error) {
      window.alert(error.message || '保存失败');
      if (error.status === 401) {
        await logout();
        navigate('/login', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (type, id, confirmDelete = true) => {
    if (confirmDelete && !window.confirm('删除后无法恢复，是否继续？')) return;
    setLoading(true);
    try {
      if (type === 'notice') {
        await deleteNotice(apiBase, token, id);
      } else if (type === 'bill') {
        await deleteBill(apiBase, token, id);
      } else if (type === 'repair') {
        await deleteRepair(apiBase, token, id);
      } else if (type === 'community') {
        await deleteCommunity(apiBase, token, id);
      } else if (type === 'resident') {
        await deleteUser(apiBase, token, id);
      } else if (type === 'house') {
        await deleteHouse(apiBase, token, id);
      } else if (type === 'staff') {
        await deleteStaff(apiBase, token, id);
      } else if (type === 'feedback') {
        await deleteFeedback(apiBase, token, id);
      } else if (type === 'complaintRule') {
        await deleteComplaintRule(apiBase, token, id);
      } else if (type === 'visitor') {
        await deleteVisitor(apiBase, token, id);
      } else if (type === 'decoration') {
        await deleteDecoration(apiBase, token, id);
      } else if (type === 'express') {
        await deleteExpress(apiBase, token, id);
      } else if (type === 'product') {
        await deleteVegetableProduct(apiBase, token, id);
      } else if (type === 'order') {
        await deleteVegetableOrder(apiBase, token, id);
      }
      closeDrawer();
      await refreshLists();
    } catch (error) {
      window.alert(error.message || '删除失败');
      if (error.status === 401) {
        await logout();
        navigate('/login', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const batchRun = async (action, directItems = null) => {
    const items = Array.isArray(directItems) && directItems.length ? directItems : currentRows.filter((item) => selectedIds.includes(item.id));
    if (!items.length) {
      window.alert('请先勾选记录');
      return;
    }
    if (!window.confirm('确定执行批量操作吗？')) {
      return;
    }
    setLoading(true);
    try {
      await Promise.all(
        items.map((item) => {
          if (action === 'delete') {
            if (activeTab === 'notice') {
              return deleteNotice(apiBase, token, item.id);
            }
            if (activeTab === 'bill') {
              return deleteBill(apiBase, token, item.id);
            }
            if (activeTab === 'repair') {
              return deleteRepair(apiBase, token, item.id);
            }
            if (activeTab === 'community') {
              return deleteCommunity(apiBase, token, item.id);
            }
            if (activeTab === 'resident') {
              return deleteUser(apiBase, token, item.id);
            }
            if (activeTab === 'house') {
              return deleteHouse(apiBase, token, item.id);
            }
            if (activeTab === 'staff') {
              return deleteStaff(apiBase, token, item.id);
            }
            if (activeTab === 'feedback') {
              return deleteFeedback(apiBase, token, item.id);
            }
            if (activeTab === 'complaintRule') {
              return deleteComplaintRule(apiBase, token, item.id);
            }
            if (activeTab === 'visitor') {
              return deleteVisitor(apiBase, token, item.id);
            }
            if (activeTab === 'decoration') {
              return deleteDecoration(apiBase, token, item.id);
            }
            if (activeTab === 'express') {
              return deleteExpress(apiBase, token, item.id);
            }
            if (activeTab === 'product') {
              return deleteVegetableProduct(apiBase, token, item.id);
            }
            return deleteVegetableOrder(apiBase, token, item.id);
          }
          if (activeTab === 'notice') {
            return saveNotice(apiBase, token, stripUiFields({ ...item, important: action === 'important' }));
          }
          if (activeTab === 'bill') {
            return saveBill(apiBase, token, stripUiFields({
              ...item,
              status: action === 'paid' ? 'paid' : 'unpaid',
              paidDate: action === 'paid' ? (item.paidDate || new Date().toISOString().slice(0, 10)) : ''
            }));
          }
          if (activeTab === 'repair') {
            const nextStatus = action === 'approve' || action === 'process' ? 'processing' : 'completed';
            return saveRepair(apiBase, token, stripUiFields({ ...item, status: nextStatus, statusName: nextStatus === 'processing' ? '处理中' : '已完成' }));
          }
          if (activeTab === 'resident') {
            return saveUser(apiBase, token, stripUiFields({
              ...item,
              status: action === 'inactive' ? 'inactive' : 'active'
            }));
          }
          if (activeTab === 'house') {
            return saveHouse(apiBase, token, stripUiFields({
              ...item,
              status: action === 'vacant' ? 'vacant' : 'occupied',
              statusText: action === 'vacant' ? '空置' : '已入住'
            }));
          }
          if (activeTab === 'staff') {
            return saveStaff(apiBase, token, stripUiFields({
              ...item,
              status: action === 'inactive' ? 'inactive' : 'active',
              statusText: action === 'inactive' ? '离岗' : '在岗'
            }));
          }
          if (activeTab === 'feedback') {
            if (action === 'reply') {
              return replyFeedback(apiBase, token, item.id, { reply: item.reply || '已处理', status: 'replied', statusText: '已回复' });
            }
            return saveFeedback(apiBase, token, stripUiFields({ ...item, status: action === 'pending' ? 'pending' : 'replied', statusText: action === 'pending' ? '待处理' : '已回复' }));
          }
          if (activeTab === 'complaintQueue') {
            if (action === 'analyze') {
              return analyzeComplaintQueue(apiBase, token, item.id, {});
            }
            return pushComplaintQueueToFeishu(apiBase, token, item.id, {});
          }
          if (activeTab === 'complaintRule') {
            if (action === 'enable' || action === 'disable') {
              return saveComplaintRule(apiBase, token, stripUiFields({
                ...item,
                enabled: action === 'enable'
              }));
            }
            return deleteComplaintRule(apiBase, token, item.id);
          }
          if (activeTab === 'visitor') {
            if (action === 'invalid') {
              return invalidateVisitor(apiBase, token, item.id);
            }
            return saveVisitor(apiBase, token, stripUiFields({ ...item, status: 'active', statusText: '有效' }));
          }
          if (activeTab === 'decoration') {
            return reviewDecoration(apiBase, token, item.id, {
              status: action === 'reject' ? 'rejected' : 'approved',
              statusText: action === 'reject' ? '已驳回' : '已通过'
            });
          }
          if (activeTab === 'express') {
            return action === 'pickup'
              ? pickupExpress(apiBase, token, item.id, {})
              : saveExpress(apiBase, token, stripUiFields({ ...item, status: 'pending', statusText: '待取件' }));
          }
          if (activeTab === 'product') {
            return saveVegetableProduct(apiBase, token, stripUiFields({ ...item, status: action === 'inactive' ? 'inactive' : 'active', statusText: action === 'inactive' ? '下架' : '上架' }));
          }
          return saveVegetableOrder(apiBase, token, stripUiFields({ ...item, status: action === 'complete' ? 'completed' : 'pending', statusText: action === 'complete' ? '已完成' : '待处理' }));
        })
      );
      setSelectedIds([]);
      await refreshLists();
    } catch (error) {
      window.alert(error.message || '批量操作失败');
      if (error.status === 401) {
        await logout();
        navigate('/login', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const quickRepair = async (item, flow) => {
    const nextStatus = flow === 'approve' || flow === 'process' ? 'processing' : 'completed';
    try {
      const nextRepair = buildRepairVersion(
        item,
        {
          status: nextStatus,
          statusName: nextStatus === 'processing' ? '处理中' : '已完成',
          dispatchRemark: flow === 'complete' ? '报修已完成' : '报修状态流转'
        },
        flow === 'approve' ? 'approve' : flow === 'process' ? 'process' : 'complete',
        flow === 'approve' ? '审批通过' : flow === 'process' ? '进入处理' : '标记完成'
      );
      await saveRepair(apiBase, token, stripUiFields(nextRepair));
      closeDrawer();
      await refreshLists();
    } catch (error) {
      window.alert(error.message || '更新失败');
      if (error.status === 401) {
        await logout();
        navigate('/login', { replace: true });
      }
    }
  };

  const quickFeedback = async (item) => {
    await replyFeedback(apiBase, token, item.id, {
      reply: item.reply || '已收到，我们会尽快处理。',
      status: 'replied',
      statusText: '已回复'
    });
    closeDrawer();
    await refreshLists();
  };

  const onFieldChange = (setDraft) => (field) => (event) => {
    const value = event.target.value;
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const onToggleSwitch = (setDraft) => (field) => {
    setDraft((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const openFeishuBindModal = (staff) => {
    if (!staff) {
      return;
    }
    setFeishuBindModal({
      id: staff.id,
      draft: {
        feishuDisplayName: staff.feishuDisplayName || staff.name || '',
        feishuUserId: staff.feishuUserId || '',
        feishuOpenId: staff.feishuOpenId || '',
        feishuUnionId: staff.feishuUnionId || ''
      }
    });
  };

  const closeFeishuBindModal = () => {
    setFeishuBindModal(null);
  };

  const onFeishuBindChange = (field) => (event) => {
    const value = event.target.value;
    setFeishuBindModal((prev) => prev ? ({
      ...prev,
      draft: {
        ...prev.draft,
        [field]: value
      }
    }) : prev);
  };

  const saveFeishuBinding = async () => {
    if (!feishuBindModal) {
      return;
    }
    const target = staffById[feishuBindModal.id];
    if (!target) {
      return;
    }
    try {
      setLoading(true);
      const saved = await saveStaff(apiBase, token, stripUiFields({
        ...target,
        ...feishuBindModal.draft
      }));
      setFeishuBindModal(null);
      setDrawer((current) => current && current.type === 'staff' && current.item.id === saved.id
        ? { ...current, item: saved }
        : current);
      await refreshLists();
    } catch (error) {
      window.alert(error.message || '绑定失败');
      if (error.status === 401) {
        await logout();
        navigate('/login', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const linkResidentHouse = (setDraft) => (houseId) => {
    const house = houseById[houseId];
    setDraft((prev) => ({
      ...prev,
      houseId,
      houseNo: house?.houseNo || '',
      building: house?.building || prev.building || '',
      unit: house?.unit || prev.unit || '',
      room: house?.room || prev.room || '',
      community: house?.community || prev.community || '',
      relationship: prev.relationship || '业主'
    }));
  };

  const linkHouseResident = (setDraft) => (userId) => {
    const user = userById[userId];
    const houseNo = user?.houseNo || '';
    setDraft((prev) => ({
      ...prev,
      boundUserId: userId,
      boundUserName: user?.name || '',
      boundUserPhone: user?.phone || '',
      occupantName: user?.name || '',
      occupantPhone: user?.phone || '',
      community: user?.community || prev.community || '',
      building: user?.building || prev.building || '',
      unit: user?.unit || prev.unit || '',
      room: user?.room || prev.room || '',
      houseNo: houseNo || prev.houseNo || `${user?.building || prev.building || ''}${user?.unit || prev.unit || ''}${user?.room || prev.room || ''}`,
      occupancyStatus: userId ? 'occupied' : prev.occupancyStatus || 'occupied',
      status: userId ? 'occupied' : prev.status,
      statusText: userId ? '已入住' : prev.statusText || '已入住',
      relationship: user?.relationship || prev.relationship || '业主'
    }));
  };

  const linkRepairHouse = (setDraft) => (houseId) => {
    const house = houseById[houseId];
    setDraft((prev) => ({
      ...prev,
      houseId,
      houseNo: house?.houseNo || formatHouseNo(house || {}),
      community: house?.community || prev.community || '',
      building: house?.building || prev.building || '',
      unit: house?.unit || prev.unit || '',
      room: house?.room || prev.room || '',
      phone: house?.boundUserPhone || prev.phone || ''
    }));
  };

  const toggleStaffBuilding = (setDraft) => (building) => {
    setDraft((prev) => {
      const current = Array.isArray(prev.responsibleBuildings) ? prev.responsibleBuildings : [];
      return {
        ...prev,
        responsibleBuildings: current.includes(building)
          ? current.filter((value) => value !== building)
          : [...current, building]
      };
    });
  };

  const toggleComplaintRuleMention = (setDraft) => (name) => {
    setDraft((prev) => {
      const current = Array.isArray(prev.mentionTargets) ? prev.mentionTargets : splitTextList(prev.mentionTargets);
      if (name === '__select_all__') {
        return {
          ...prev,
          mentionTargets: currentCommunityStaffOptions.map((item) => item.value)
        };
      }
      if (name === '__clear__') {
        return {
          ...prev,
          mentionTargets: []
        };
      }
      return {
        ...prev,
        mentionTargets: current.includes(name)
          ? current.filter((value) => value !== name)
          : [...current, name]
      };
    });
  };

  const fillComplaintRuleMentions = (setDraft, mode = 'default') => {
    setDraft((prev) => {
      if (mode === 'community') {
        return {
          ...prev,
          mentionTargets: currentCommunityStaffOptions.map((item) => item.value)
        };
      }
      return {
        ...prev,
        mentionTargets: defaultSupervisorName ? [defaultSupervisorName] : []
      };
    });
  };

  const applyRepairRecommendation = async (staff, saveImmediately = true) => {
    const baseDraft = drawerMode === 'edit' && drawerDraft ? drawerDraft : drawer?.item;
    if (!baseDraft || drawer?.type !== 'repair' || !staff) {
      return;
    }
    const building = extractRepairBuilding(baseDraft, houses);
    const targetShift = repairRecommendationSet.targetShift || inferShiftFromTime(baseDraft.appointmentTime || baseDraft.createTime || new Date().toISOString());
    const dispatchTime = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const nextDraft = buildRepairVersion(
      baseDraft,
      {
        handler: staff.name || '',
        handlerPhone: staff.phone || '',
        status: 'processing',
        statusName: '处理中',
        dispatchTime,
        dispatchBuilding: building,
        dispatchShift: targetShift,
        dispatchRemark: `自动分派到${staff.name || '处理人'}，优先匹配${building || '当前报修'}，目标班次${targetShift || '未识别'}。`
      },
      'dispatch',
      `自动推荐：${(staff.reason || []).join('、') || '智能匹配'}`
    );
    setDrawerMode('edit');
    setDrawerDraft(nextDraft);
    if (saveImmediately) {
      await saveRepair(apiBase, token, stripUiFields(nextDraft));
      closeDrawer();
      await refreshLists();
    }
  };

  const drawerRows = drawer ? rowsFor(drawer.type, drawer.item) : [];
  const repairHistory = drawer && drawer.type === 'repair' && Array.isArray(drawer.item.dispatchHistory)
    ? drawer.item.dispatchHistory.slice().reverse()
    : [];

  return (
    <div className="page-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-badge">P</div>
          <div>
            <div className="brand-title">物业后台</div>
            <div className="brand-subtitle">Web 管理控制台</div>
          </div>
        </div>

        <div className="nav-group">
          {visibleNavGroups.map((group) => (
            <section key={group.key} className="nav-section">
              <button type="button" className="nav-section-head" onClick={() => toggleGroup(group.key)}>
                <span>{group.title}</span>
                <b>{group.tabs.reduce((sum, tab) => sum + tabCount(tab), 0)}</b>
              </button>
              {!collapsedGroups[group.key] ? (
                <div className="nav-section-body">
                  {group.tabs.map((key) => (
                    <button key={key} type="button" className={`nav-item ${activeTab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
                      <span>{TABS[key].label}</span>
                      <b>{tabCount(key)}</b>
                    </button>
                  ))}
                </div>
              ) : null}
            </section>
          ))}
        </div>

        <div className="panel sidebar-batch">
          <div className="panel-title">批量操作</div>
          {currentBatchOptions.length ? (
            <>
              <div className="button-row">
                <button type="button" className="btn btn-ghost block-btn" onClick={selectPage}>选中当前页</button>
                <button type="button" className="btn btn-ghost block-btn" onClick={clearSelection}>清空选择</button>
              </div>
              <div className="batch-stack">
                {currentBatchOptions.map(([action, label]) => (
                  <button key={action} type="button" className={`btn ${action === 'delete' ? 'danger' : 'btn-primary'} block-btn tiny`} onClick={() => batchRun(action)}>
                    {label}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="hint">当前分类无需批量操作</div>
          )}
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar card">
          <div className="topbar-main">
            <div className="eyebrow">物业管理控制台</div>
            <h1>{TABS[activeTab].title}</h1>
            <p>{TABS[activeTab].subtitle}</p>
            {activeTab === 'complaintRule' ? (
              <div className="topbar-note">
                <span className="badge">当前小区：{communityDisplayName(activeCommunity) || '未选择'}</span>
                <span className="badge">当前默认负责人：{defaultSupervisorName}</span>
              </div>
            ) : null}
            <div className="topbar-summary">
              <span className="badge">状态：{statusText}</span>
              <span className="badge">API：{apiBase}</span>
              <span className="badge">登录：{token ? '已登录' : '未登录'}</span>
              <span className="badge">当前小区：{communityDisplayName(activeCommunity) || '未选择'}</span>
              <span className="badge">项目数：{communitySwitchOptions.length}</span>
              <span className="badge">当前结果：{filteredItems.length}</span>
              <span className="badge">分页：{currentPage} / {totalPages}</span>
              <span className="badge">已选中：{selectedIds.length}</span>
            </div>
            <div className="topbar-projects">
              <button type="button" className="topbar-projects-head" onClick={() => setProjectsCollapsed((prev) => !prev)}>
                <span className="toolbar-title">当前项目列表</span>
                <span className="badge">{communitySwitchOptions.length} 个项目</span>
                <span className="chip-state">{projectsCollapsed ? '展开' : '收起'}</span>
              </button>
              {!projectsCollapsed ? (
                <>
                  <div className="chip-row compact">
                    {communitySwitchOptions.length ? communitySwitchOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`chip ${activeCommunity?.id === option.value ? 'active' : ''}`}
                        onClick={() => {
                          if (option.value && option.value !== activeCommunity?.id) {
                            activateCommunity(apiBase, token, option.value)
                              .then(refreshLists)
                              .catch((error) => window.alert(error.message || '切换失败'));
                          }
                        }}
                      >
                        {option.label.split(' / ')[0]}
                      </button>
                    )) : <div className="hint">暂无项目</div>}
                  </div>
                  <div className="hint">{communityNamePreview}</div>
                </>
              ) : null}
            </div>
          </div>
          <div className="topbar-side">
            <div className="topbar-actions">
            <input className="search" placeholder="搜索标题、内容、房号、处理人..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
            {activeTab === 'complaintQueue' ? (
              <button type="button" className="btn btn-primary" onClick={refreshLists}>刷新投诉队列</button>
            ) : activeTab === 'community' ? (
              <button type="button" className="btn btn-primary" onClick={openModal}>新增小区</button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={openModal}>新增{TABS[activeTab].label}</button>
            )}
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/assistant-config')}>AI 配置</button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/assistant-faq')}>FAQ</button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/assistant-prompt')}>Prompt</button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/assistant-sessions')}>会话日志</button>
            <button type="button" className="btn btn-ghost" onClick={logout}>退出登录</button>
            </div>
          </div>
          {communitySwitchOptions.length ? (
            <div className="topbar-switch">
              <div className="toolbar-title">当前小区快捷切换</div>
              <div className="switch-row">
                <select
                  className="field switch-select"
                  value={activeCommunity?.id || ''}
                  onChange={(event) => {
                    const next = communitySwitchOptions.find((option) => option.value === event.target.value);
                    if (next?.value) {
                      activateCommunity(apiBase, token, next.value)
                        .then(refreshLists)
                        .catch((error) => window.alert(error.message || '切换失败'));
                    }
                  }}
                >
                  <option value="">请选择小区</option>
                  {communitySwitchOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}
        </header>

        <section className="card toolbar">
          <div className="toolbar-group">
            <div className="toolbar-title">筛选</div>
            <div className="chip-row">
              {filterOptions(activeTab).map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={`chip ${filters[activeTab] === item.value ? 'active' : ''}`}
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, [activeTab]: item.value }));
                    setCurrentPage(1);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="toolbar-group">
            <div className="toolbar-title">排序</div>
            <div className="chip-row">
              {sortOptions(activeTab).map((item) => (
                <button
                  key={item.field}
                  type="button"
                  className={`chip ${sortField === item.field ? 'active' : ''}`}
                  onClick={() => {
                    setSortOrder(sortField === item.field && sortOrder === 'desc' ? 'asc' : 'desc');
                    setSortField(item.field);
                    setCurrentPage(1);
                  }}
                >
                  {item.label}
                  {sortField === item.field ? (sortOrder === 'asc' ? ' ↑' : ' ↓') : ''}
                </button>
              ))}
            </div>
          </div>
          {communityFilterItems.length ? (
            <div className="toolbar-group">
              <div className="toolbar-title">小区筛选</div>
              <div className="chip-row">
                {communityFilterItems.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={`chip ${currentCommunityFilter === item.value ? 'active' : ''}`}
                    onClick={() => {
                      setCommunityFilters((prev) => ({ ...prev, [activeTab]: item.value }));
                      setCurrentPage(1);
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <div className="toolbar-group toolbar-group-wide">
            <div className="toolbar-head-row">
              <div className="toolbar-title">高级筛选</div>
              <button type="button" className="btn btn-ghost tiny" onClick={resetFilters}>重置</button>
            </div>
            <div className="chip-row">
              {extraFilterItems.length ? extraFilterItems.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={`chip ${(extraFilters[activeTab] || 'all') === item.value ? 'active' : ''}`}
                  onClick={() => {
                    setExtraFilters((prev) => ({ ...prev, [activeTab]: item.value }));
                    setCurrentPage(1);
                  }}
                >
                  {item.label}
                </button>
              )) : <div className="hint">当前分类暂无额外筛选条件</div>}
            </div>
          </div>
        </section>

        <section className="card table-card">
          <div className="table-head">
            <div className="table-col check"></div>
            <div className="table-col title">{activeTab === 'community' ? '项目名称' : '标题'}</div>
            <div className="table-col meta">{activeTab === 'community' ? '当前 / 主管' : '状态 / 分类'}</div>
            <div className="table-col meta">{activeTab === 'community' ? '更新时间 / 电话' : '时间 / 金额'}</div>
            <div className="table-col actions">操作</div>
          </div>
          {pageItems.length ? (
            pageItems.map((item, index) => {
              const showQueueHeader = activeTab === 'complaintQueue' && (
                index === 0 ||
                String(pageItems[index - 1]?.community || '未归属小区').trim() !== String(item.community || '未归属小区').trim()
              );
              return (
                <React.Fragment key={item.id}>
                  {showQueueHeader ? (
                    <div className="queue-group-header">
                      <span className="queue-group-title">{item.community || '未归属小区'}</span>
                      <span className="queue-group-count">
                        {pageItems.filter((row) => String(row.community || '未归属小区').trim() === String(item.community || '未归属小区').trim()).length} 条
                      </span>
                    </div>
                  ) : null}
                  <div className={`table-row ${item.selected ? 'selected' : ''}`} onClick={() => openDrawer(item, 'view')}>
                <div className="table-col check">
                  <button
                    type="button"
                    className={`chip tiny ${item.selected ? 'active' : ''}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      updateSelected(item.id);
                    }}
                  >
                    {item.selected ? '已选' : '选中'}
                  </button>
                </div>
                <div className="table-col title">
                  <div className="row-main">
                    <div className="row-title">
                    {activeTab === 'community' ? (communityDisplayName(item) || '未命名项目') : (item.title || '未命名')}
                    </div>
                    <div className="row-sub">
                      {activeTab === 'community' ? `${item.propertyCompany || '物业公司'} · ${item.address || '地址未填写'}` :
                       activeTab === 'resident' ? `${item.community || '未归属小区'} · ${item.houseNo || `${item.building || ''}${item.unit || ''}${item.room || ''}`} · ${item.relationship || '住户'}` :
                       activeTab === 'house' ? `${item.community || '未归属小区'} · ${houseOwnershipLabel(item.ownershipStatus)} / ${occupancyLabel(item.occupancyStatus || item.status)}` :
                       activeTab === 'staff' ? `${item.community || '未归属小区'} · ${item.shift || ''} · ${item.scope || ''}` :
                       activeTab === 'repair' ? (item.categoryName || item.category || '') :
                       activeTab === 'bill' ? (item.room || '') :
                       activeTab === 'feedback' ? `${item.community || '未归属小区'} · ${item.category || item.type || ''}` :
                       activeTab === 'complaintQueue' ? `${item.community || '未归属小区'} · ${severityLabel(item.severity)}` :
                       activeTab === 'visitor' ? (item.visitPurpose || '') :
                       activeTab === 'decoration' ? (item.area || '') :
                       activeTab === 'express' ? (item.company || '') :
                       activeTab === 'product' ? (item.spec || '') :
                       activeTab === 'order' ? (JSON.stringify(item.items || []).slice(0, 40)) :
                       String(item.content || '').slice(0, 40)}
                    </div>
                  </div>
                </div>
                <div className="table-col meta">
                  <span className={`status-pill ${statusClass(activeTab === 'notice' ? (item.important ? 'important' : '') : item.status)}`}>
                    {activeTab === 'community' ? (item.active ? '当前小区' : '未启用') :
                     activeTab === 'notice' ? (item.important ? '重要' : '普通') :
                     activeTab === 'bill' ? (item.status === 'paid' ? '已缴' : '未缴') :
                     activeTab === 'repair' ? (item.statusName || item.status || '-') :
                     activeTab === 'feedback' ? (item.statusText || item.status || '-') :
                     activeTab === 'visitor' ? (item.statusText || item.status || '-') :
                     activeTab === 'decoration' ? (item.statusText || item.status || '-') :
                     activeTab === 'express' ? (item.statusText || item.status || '-') :
                     activeTab === 'product' ? (item.statusText || item.status || '-') :
                     (item.statusText || item.status || '-')}
                  </span>
                </div>
                <div className="table-col meta">
                  {activeTab === 'community'
                    ? `${item.updateTime || '-'} / ${item.propertyPhone || '-'}`
                    : activeTab === 'bill'
                    ? `${item.dueDate || '-'} / ${item.amount == null ? '-' : item.amount}`
                    : activeTab === 'repair'
                      ? `${item.createTime || '-'} / ${item.handler || '-'}`
                      : activeTab === 'feedback'
                        ? `${item.createTime || '-'} / ${item.phone || '-'}`
                        : activeTab === 'visitor'
                          ? `${item.visitTime || '-'} / ${item.expireTime || '-'}`
                          : activeTab === 'decoration'
                            ? `${item.applyDate || '-'} / ${item.startDate || '-'}`
                            : activeTab === 'express'
                              ? `${item.createTime || '-'} / ${item.arriveTime || '-'}`
                              : activeTab === 'product'
                                ? `${item.price == null ? '-' : item.price} / 库存 ${item.stock == null ? '-' : item.stock}`
                                : activeTab === 'order'
                                  ? `${item.createTime || '-'} / ${item.totalAmount == null ? '-' : item.totalAmount}`
                                  : `${item.time || '-'} / ${item.important ? '重要' : '普通'}`}
                </div>
                <div className="table-col actions">
                  <div className="mini-actions">
                    {activeTab === 'community' ? (
                      <>
                        <button
                          type="button"
                          className="btn btn-ghost tiny"
                          onClick={(event) => {
                            event.stopPropagation();
                            openDrawer(item, 'edit');
                          }}
                        >
                          编辑
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary tiny"
                          onClick={(event) => {
                            event.stopPropagation();
                            activateCommunity(apiBase, token, item.id).then(refreshLists).catch((error) => window.alert(error.message || '设为当前失败'));
                          }}
                        >
                          设当前
                        </button>
                      </>
                    ) : activeTab === 'complaintQueue' ? (
                      <>
                        <button
                          type="button"
                          className="btn btn-primary tiny"
                          onClick={(event) => {
                            event.stopPropagation();
                            batchRun('analyze', [item]);
                          }}
                        >
                          AI 分析
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost tiny"
                          onClick={(event) => {
                            event.stopPropagation();
                            batchRun('push', [item]);
                          }}
                        >
                          推飞书
                        </button>
                      </>
                    ) : null}
                    {activeTab === 'complaintRule' ? (
                      <>
                        <button
                          type="button"
                          className="btn btn-ghost tiny"
                          onClick={(event) => {
                            event.stopPropagation();
                            openDrawer(item, 'edit');
                          }}
                        >
                          编辑
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost tiny"
                          onClick={(event) => {
                            event.stopPropagation();
                            batchRun(item.enabled ? 'disable' : 'enable', [item]);
                          }}
                        >
                          {item.enabled ? '停用' : '启用'}
                        </button>
                      </>
                    ) : activeTab === 'repair' ? (
                      <>
                        <button type="button" className="btn btn-ghost tiny" onClick={(event) => { event.stopPropagation(); quickRepair(item, 'process'); }}>处理中</button>
                        <button type="button" className="btn btn-ghost tiny" onClick={(event) => { event.stopPropagation(); quickRepair(item, 'complete'); }}>完成</button>
                      </>
                    ) : null}
                    {activeTab !== 'complaintQueue' ? (
                      <button
                        type="button"
                        className="btn danger tiny"
                        onClick={(event) => {
                          event.stopPropagation();
                          removeItem(activeTab, item.id);
                        }}
                      >
                        删除
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
                </React.Fragment>
              );
            })
          ) : (
            <div className="empty-state">暂无数据</div>
          )}
        </section>

        <footer className="card pager">
          <button type="button" className="btn btn-ghost" disabled={currentPage <= 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>上一页</button>
          <div className="pager-text">第 {currentPage} / {totalPages} 页，共 {filteredItems.length} 条</div>
          <button type="button" className="btn btn-ghost" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((page) => page + 1)}>下一页</button>
        </footer>
      </main>

      {drawer ? (
        <div className="overlay" onClick={closeDrawer}>
          <aside className="drawer card" onClick={(event) => event.stopPropagation()}>
            <div className="drawer-head">
              <div>
                <div className="eyebrow">详情</div>
                <h2>{drawer.type === 'community' ? (communityDisplayName(drawer.item) || '小区配置') : (drawer.item.title || '记录详情')}</h2>
                <div className="drawer-sub">
                  {drawer.type === 'community' ? '小区配置详情' :
                   drawer.type === 'notice' ? '公告详情' :
                   drawer.type === 'bill' ? '账单详情' :
                   drawer.type === 'repair' ? '报修详情' :
                   drawer.type === 'resident' ? '住户账号详情' :
                   drawer.type === 'house' ? '房屋档案详情' :
                   drawer.type === 'staff' ? '物业人员详情' :
                   drawer.type === 'feedback' ? '反馈详情' :
                   drawer.type === 'visitor' ? '访客详情' :
                   drawer.type === 'decoration' ? '装修详情' :
                   drawer.type === 'express' ? '快递详情' :
                   drawer.type === 'product' ? '商品详情' :
                   '订单详情'}
                </div>
                {drawer.type === 'complaintRule' ? (
                  <div className="topbar-note">
                    <span className="badge">当前小区：{communityDisplayName(activeCommunity) || '未选择'}</span>
                    <span className="badge">可选物业人员：{currentCommunityStaffOptions.length}</span>
                    <span className="badge">范围：{drawerMode === 'edit' ? (drawerDraft?.onlyCurrentCommunityStaff === false ? '全部物业人员' : '当前小区人员') : (drawer.item.onlyCurrentCommunityStaff === false ? '全部物业人员' : '当前小区人员')}</span>
                  </div>
                ) : null}
              </div>
              <div className="drawer-actions">
                {drawerMode === 'view' ? (
                  drawer.type === 'community' ? (
                    <button type="button" className="btn btn-primary" onClick={() => setDrawerMode('edit')}>编辑</button>
                  ) : drawer.type === 'complaintQueue' ? (
                    <>
                      <button type="button" className="btn btn-primary" onClick={() => batchRun('analyze', [drawer.item])}>AI 分析</button>
                      <button type="button" className="btn btn-ghost" onClick={() => batchRun('push', [drawer.item])}>推飞书</button>
                    </>
                  ) : (
                    <button type="button" className="btn btn-primary" onClick={() => setDrawerMode('edit')}>编辑</button>
                  )
                ) : (
                  <button type="button" className="btn btn-primary" onClick={() => saveItem(drawer.type, drawerDraft)}>保存</button>
                )}
                <button type="button" className="btn btn-ghost" onClick={closeDrawer}>关闭</button>
              </div>
            </div>

            {drawerMode === 'view' ? (
              <>
                <div className="detail-grid">
                  {drawerRows.map(([label, value]) => (
                    <div key={label} className="detail-row">
                      <span className="detail-label">{label}</span>
                      <div className="detail-value">{value == null || value === '' ? '-' : value}</div>
                    </div>
                  ))}
                </div>
                {drawer.type === 'repair' ? (
                  <div className="recommendation-card">
                    <div className="recommendation-head">
                      <div>
                        <div className="panel-title">智能分派</div>
                        <div className="recommendation-title">按楼栋与班次自动推荐</div>
                      </div>
                      <div className="recommendation-badges">
                        <span className="badge">楼栋：{repairBuildingLabel || '未识别'}</span>
                        <span className="badge">班次：{repairShiftLabel || '未识别'}</span>
                      </div>
                    </div>
                    <div className="recommendation-columns">
                      <div className="recommendation-block">
                        <div className="recommendation-block-title">主推</div>
                        <div className="recommendation-list">
                          {repairRecommendationSet.main.length ? repairRecommendationSet.main.map((staff) => (
                            <button
                              key={staff.id}
                              type="button"
                              className="recommendation-item primary"
                              onClick={() => applyRepairRecommendation(staff)}
                            >
                              <div className="recommendation-name">
                                {staff.name}
                                <span className="recommendation-score"> {staff.score}</span>
                              </div>
                              <div className="recommendation-desc">
                                {staff.position || staff.role || '人员'}
                                {staff.phone ? ` · ${staff.phone}` : ''}
                              </div>
                              <div className="recommendation-tags">
                                {(staff.reason || []).map((tag) => <span key={tag} className="mini-tag">{tag}</span>)}
                              </div>
                            </button>
                          )) : <div className="hint">暂无主推人员</div>}
                        </div>
                      </div>
                      <div className="recommendation-block">
                        <div className="recommendation-block-title">备选</div>
                        <div className="recommendation-list">
                          {repairRecommendationSet.backup.length ? repairRecommendationSet.backup.map((staff) => (
                            <button
                              key={staff.id}
                              type="button"
                              className="recommendation-item"
                              onClick={() => applyRepairRecommendation(staff)}
                            >
                              <div className="recommendation-name">
                                {staff.name}
                                <span className="recommendation-score"> {staff.score}</span>
                              </div>
                              <div className="recommendation-desc">
                                {staff.position || staff.role || '人员'}
                                {staff.phone ? ` · ${staff.phone}` : ''}
                              </div>
                              <div className="recommendation-tags">
                                {(staff.reason || []).map((tag) => <span key={tag} className="mini-tag">{tag}</span>)}
                              </div>
                            </button>
                          )) : <div className="hint">暂无备选人员</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
                {drawer.type === 'repair' ? (
                  <div className="history-card">
                    <div className="panel-title">改派记录</div>
                    {repairHistory.length ? (
                      <div className="history-list">
                        {repairHistory.map((entry, index) => (
                          <div key={`${entry.time || index}-${entry.action || 'entry'}`} className="history-item">
                            <div className="history-head">
                              <strong>{entry.action || '更新'}</strong>
                              <span>{entry.time || '-'}</span>
                            </div>
                            <div className="history-body">
                              <span>{entry.actor || '管理员'}</span>
                              <span>{entry.handler ? `处理人：${entry.handler}` : '未指定处理人'}</span>
                              <span>{entry.building ? `楼栋：${entry.building}` : '楼栋未识别'}</span>
                              <span>{entry.shift ? `班次：${entry.shift}` : '班次未识别'}</span>
                              <span>{entry.remark || '无备注'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="hint">暂无历史记录</div>
                    )}
                  </div>
                ) : null}
                {drawer.type === 'repair' ? (
                  <div className="mini-actions">
                    {drawer.item.status === 'pending' ? (
                      <>
                        <button type="button" className="btn btn-primary tiny" onClick={() => quickRepair(drawer.item, 'approve')}>审批通过</button>
                        <button type="button" className="btn btn-ghost tiny" onClick={() => quickRepair(drawer.item, 'process')}>进入处理</button>
                      </>
                    ) : null}
                    {drawer.item.status !== 'completed' ? (
                      <button type="button" className="btn btn-ghost tiny" onClick={() => quickRepair(drawer.item, 'complete')}>标记完成</button>
                    ) : null}
                  </div>
                ) : null}
                {drawer.type === 'feedback' ? (
                  <div className="mini-actions">
                    <button type="button" className="btn btn-primary tiny" onClick={() => quickFeedback(drawer.item)}>一键回复</button>
                  </div>
                ) : null}
                {drawer.type === 'visitor' ? (
                  <div className="mini-actions">
                    <button type="button" className="btn btn-primary tiny" onClick={() => saveItem('visitor', { ...drawer.item, status: 'invalid', statusText: '已失效' })}>失效</button>
                  </div>
                ) : null}
                {drawer.type === 'decoration' ? (
                  <div className="mini-actions">
                    <button type="button" className="btn btn-primary tiny" onClick={() => reviewDecoration(apiBase, token, drawer.item.id, { status: 'approved', statusText: '已通过' })}>通过</button>
                    <button type="button" className="btn btn-ghost tiny" onClick={() => reviewDecoration(apiBase, token, drawer.item.id, { status: 'rejected', statusText: '已驳回' })}>驳回</button>
                  </div>
                ) : null}
                {drawer.type === 'express' ? (
                  <div className="mini-actions">
                    <button type="button" className="btn btn-primary tiny" onClick={() => pickupExpress(apiBase, token, drawer.item.id, {})}>已取件</button>
                  </div>
                ) : null}
                {drawer.type === 'order' ? (
                  <div className="mini-actions">
                    <button type="button" className="btn btn-primary tiny" onClick={() => saveVegetableOrder(apiBase, token, { ...drawer.item, status: 'completed', statusText: '已完成' })}>完成订单</button>
                  </div>
                ) : null}
                {drawer.type === 'complaintQueue' ? (
                  <div className="mini-actions">
                    <button type="button" className="btn btn-primary tiny" onClick={() => batchRun('analyze', [drawer.item])}>AI 分析</button>
                    <button type="button" className="btn btn-ghost tiny" onClick={() => batchRun('push', [drawer.item])}>一键推飞书</button>
                  </div>
                ) : null}
                {drawer.type === 'complaintRule' ? (
                  <div className="mini-actions">
                    <button
                      type="button"
                      className="btn btn-primary tiny"
                      onClick={() => batchRun(drawer.item.enabled ? 'disable' : 'enable', [drawer.item])}
                    >
                      {drawer.item.enabled ? '停用规则' : '启用规则'}
                    </button>
                  </div>
                ) : null}
                {drawer.type === 'staff' ? (
                  <div className="mini-actions">
                    <button type="button" className="btn btn-primary tiny" onClick={() => openFeishuBindModal(drawer.item)}>绑定飞书</button>
                  </div>
                ) : null}
                <div className="drawer-footer">
                  {drawer.type === 'complaintQueue' ? (
                    <div className="hint">投诉队列为只读视图，先分析或推送，再到规则页调整 @ 主管 规则。</div>
                  ) : (
                    <>
                      <button type="button" className="btn btn-ghost" onClick={() => setDrawerMode('edit')}>编辑模式</button>
                      <button type="button" className="btn danger" onClick={() => removeItem(drawer.type, drawer.item.id)}>删除</button>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <FormFields
                  type={drawer.type}
                  item={drawerDraft}
                  onChange={onFieldChange(setDrawerDraft)}
                  onToggle={onToggleSwitch(setDrawerDraft)}
                  communityOptions={communityOptions}
                  residentOptions={residentOptions}
                  houseOptions={houseOptions}
                  buildingOptions={buildingOptions}
                  staffMentionOptions={staffMentionOptions}
                  currentCommunityStaffOptions={currentCommunityStaffOptions}
              currentCommunityStaffSummary={currentCommunityStaffSummary}
              staffSupervisorOptions={staffSupervisorOptions}
              currentDefaultSupervisor={defaultSupervisorName}
              onResidentHouseChange={linkResidentHouse(setDrawerDraft)}
              onHouseResidentChange={linkHouseResident(setDrawerDraft)}
              onRepairHouseChange={linkRepairHouse(setDrawerDraft)}
              onStaffBuildingsChange={toggleStaffBuilding(setDrawerDraft)}
              onComplaintRuleMentionsChange={toggleComplaintRuleMention(setDrawerDraft)}
              onComplaintRuleFillDefault={() => fillComplaintRuleMentions(setDrawerDraft, 'default')}
              onComplaintRuleFillCommunity={() => fillComplaintRuleMentions(setDrawerDraft, 'community')}
            />
                <div className="drawer-footer">
                  <button type="button" className="btn btn-ghost" onClick={() => setDrawerMode('view')}>取消</button>
                </div>
              </>
            )}
          </aside>
        </div>
      ) : null}

      {modal ? (
        <div className="overlay" onClick={closeModal}>
          <div className="modal card" onClick={(event) => event.stopPropagation()}>
            <div className="drawer-head">
              <div>
                <div className="eyebrow">{modal.type === 'community' ? '小区管理' : '新增记录'}</div>
                <h2>{modal.type === 'community' ? (modalDraft?.id ? '编辑小区配置' : '新增小区') : `新增${TABS[modal.type].label}`}</h2>
              </div>
              <div className="drawer-actions">
                <button type="button" className="btn btn-primary" onClick={() => saveItem(modal.type, modalDraft)}>保存</button>
                <button type="button" className="btn btn-ghost" onClick={closeModal}>关闭</button>
              </div>
            </div>
            <FormFields
              type={modal.type}
              item={modalDraft}
              onChange={onFieldChange(setModalDraft)}
              onToggle={onToggleSwitch(setModalDraft)}
              communityOptions={communityOptions}
              residentOptions={residentOptions}
              houseOptions={houseOptions}
              buildingOptions={buildingOptions}
              staffMentionOptions={staffMentionOptions}
              currentCommunityStaffOptions={currentCommunityStaffOptions}
              currentCommunityStaffSummary={currentCommunityStaffSummary}
              staffSupervisorOptions={staffSupervisorOptions}
              currentDefaultSupervisor={defaultSupervisorName}
              onResidentHouseChange={linkResidentHouse(setModalDraft)}
              onHouseResidentChange={linkHouseResident(setModalDraft)}
              onRepairHouseChange={linkRepairHouse(setModalDraft)}
              onStaffBuildingsChange={toggleStaffBuilding(setModalDraft)}
              onComplaintRuleMentionsChange={toggleComplaintRuleMention(setModalDraft)}
              onComplaintRuleFillDefault={() => fillComplaintRuleMentions(setModalDraft, 'default')}
              onComplaintRuleFillCommunity={() => fillComplaintRuleMentions(setModalDraft, 'community')}
            />
          </div>
        </div>
      ) : null}

      {feishuBindModal ? (
        <div className="overlay" onClick={closeFeishuBindModal}>
          <div className="modal card" onClick={(event) => event.stopPropagation()}>
            <div className="drawer-head">
              <div>
                <div className="eyebrow">飞书成员绑定</div>
                <h2>{staffById[feishuBindModal.id]?.name || '未命名人员'}</h2>
                <div className="hint">至少填入 `feishuUserId`，投诉推送才会真正 @ 到该成员。</div>
              </div>
              <div className="drawer-actions">
                <button type="button" className="btn btn-primary" onClick={saveFeishuBinding}>保存绑定</button>
                <button type="button" className="btn btn-ghost" onClick={closeFeishuBindModal}>关闭</button>
              </div>
            </div>
            <div className="form-grid two">
              {renderField(feishuBindModal.draft, 'feishuDisplayName', 'text', onFeishuBindChange, onToggleSwitch(() => () => {}))}
              {renderField(feishuBindModal.draft, 'feishuUserId', 'text', onFeishuBindChange, onToggleSwitch(() => () => {}))}
              {renderField(feishuBindModal.draft, 'feishuOpenId', 'text', onFeishuBindChange, onToggleSwitch(() => () => {}))}
              {renderField(feishuBindModal.draft, 'feishuUnionId', 'text', onFeishuBindChange, onToggleSwitch(() => () => {}))}
            </div>
          </div>
        </div>
      ) : null}

      {loading ? <div className="loading-cover">处理中...</div> : null}
    </div>
  );
}
