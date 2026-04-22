import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { activateCommunity, getAssistantSettings, listCommunities, listStaffs, saveAssistantSettings, testAssistantSettings } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const STORAGE_KEY = 'property-ai-config';
const DEFAULT_SCENES = ['query_bill', 'query_repair', 'create_repair', 'create_feedback', 'query_notice', 'handoff'];
const DEFAULT_OPENCLAW_LOCAL_BASE_URL = import.meta.env.VITE_OPENCLAW_LOCAL_BASE_URL || 'http://127.0.0.1:18789/chat?session=agent%3Amain%3Amain';
const DEFAULT_OPENCLAW_REMOTE_BASE_URL = import.meta.env.VITE_OPENCLAW_REMOTE_BASE_URL || 'https://openclaw.example.com';
const COMMUNITY_FEATURES = [
  { field: 'enableNotice', tab: 'notice', label: '公告' },
  { field: 'enableBill', tab: 'bill', label: '账单' },
  { field: 'enableRepair', tab: 'repair', label: '报修' },
  { field: 'enableResident', tab: 'resident', label: '住户' },
  { field: 'enableHouse', tab: 'house', label: '房屋' },
  { field: 'enableStaff', tab: 'staff', label: '物业人员' },
  { field: 'enableFeedback', tab: 'feedback', label: '反馈' },
  { field: 'enableComplaintQueue', tab: 'complaintQueue', label: '投诉队列' },
  { field: 'enableComplaintRule', tab: 'complaintRule', label: '投诉规则' },
  { field: 'enableVisitor', tab: 'visitor', label: '访客' },
  { field: 'enableDecoration', tab: 'decoration', label: '装修' },
  { field: 'enableExpress', tab: 'express', label: '快递' },
  { field: 'enableProduct', tab: 'product', label: '商品' },
  { field: 'enableOrder', tab: 'order', label: '订单' }
];

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function sanitizeAssistantSettingsForForm(settings) {
  const next = { ...(settings || {}) };
  next.deepseekApiKeySet = Boolean(next.deepseekApiKeySet || next.deepseekApiKey);
  next.deepseekApiKey = '';
  return next;
}

function buildAssistantConfigSnapshot(settings) {
  const source = settings || {};
  return JSON.stringify({
    enabled: Boolean(source.enabled),
    assistantName: String(source.assistantName || ''),
    assistantProvider: String(source.assistantProvider || ''),
    deepseekMode: String(source.deepseekMode || ''),
    deepseekBaseUrl: String(source.deepseekBaseUrl || ''),
    deepseekLocalBaseUrl: String(source.deepseekLocalBaseUrl || ''),
    deepseekRemoteBaseUrl: String(source.deepseekRemoteBaseUrl || ''),
    deepseekChatPath: String(source.deepseekChatPath || ''),
    deepseekModel: String(source.deepseekModel || ''),
    deepseekTemperature: Number(source.deepseekTemperature || 0),
    deepseekMaxTokens: Number(source.deepseekMaxTokens || 0),
    openclawMode: String(source.openclawMode || ''),
    openclawBaseUrl: String(source.openclawBaseUrl || ''),
    openclawLocalBaseUrl: String(source.openclawLocalBaseUrl || ''),
    openclawRemoteBaseUrl: String(source.openclawRemoteBaseUrl || ''),
    openclawModel: String(source.openclawModel || ''),
    openclawMessagePath: String(source.openclawMessagePath || ''),
    promptVersion: String(source.promptVersion || ''),
    analysisTimeoutMs: Number(source.analysisTimeoutMs || 0),
    fallbackToHeuristic: Boolean(source.fallbackToHeuristic),
    autoCreateSession: Boolean(source.autoCreateSession),
    autoSaveHistory: Boolean(source.autoSaveHistory),
    autoHandoff: Boolean(source.autoHandoff),
    promptTemplate: String(source.promptTemplate || ''),
    enabledScenes: normalizeList(source.enabledScenes).sort(),
    handoffKeywords: normalizeList(source.handoffKeywords).sort(),
    defaultSupervisor: String(source.defaultSupervisor || ''),
    communityId: String(source.communityId || ''),
    community: String(source.community || '')
  });
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(/[、,;|\n]/g)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function displayCommunity(community) {
  if (!community) return '未选择项目';
  return community.projectName || community.name || '未命名项目';
}

function communityFeatureEnabled(community, tab) {
  const feature = COMMUNITY_FEATURES.find((item) => item.tab === tab);
  if (!feature) {
    return true;
  }
  return community ? community[feature.field] !== false : true;
}

function normalizeOpenclawMode(mode, baseUrl) {
  const text = String(mode || '').trim().toLowerCase();
  if (text === 'remote' || text === '远程') return 'remote';
  if (text === 'local' || text === '本地') return 'local';
  const normalizedBase = String(baseUrl || '').trim().toLowerCase();
  if (normalizedBase.includes('127.0.0.1') || normalizedBase.includes('localhost') || normalizedBase.includes(':18789')) {
    return 'local';
  }
  if (normalizedBase) {
    return 'remote';
  }
  return 'local';
}

function normalizeAssistantProvider(provider, baseUrl) {
  const text = String(provider || '').trim().toLowerCase();
  if (text.includes('deepseek') || text.includes('深度求索') || text.includes('深度')) {
    return 'deepseek';
  }
  if (text.includes('openclaw') || text.includes('兼容') || text.includes('智能引擎')) {
    return 'openclaw';
  }
  const normalizedBase = String(baseUrl || '').trim().toLowerCase();
  if (normalizedBase.includes('deepseek')) {
    return 'deepseek';
  }
  return 'deepseek';
}

function resolveDeepseekPresetUrl(mode, localBaseUrl, remoteBaseUrl, baseUrl) {
  const normalizedMode = normalizeOpenclawMode(mode, baseUrl);
  const normalize = (value) => {
    const text = String(value || '').trim();
    if (!text) return '';
    if (text.endsWith('/v1')) return text.slice(0, -3);
    if (text.endsWith('/v1/')) return text.slice(0, -4);
    return text;
  };
  if (normalizedMode === 'remote') {
    return normalize(remoteBaseUrl || baseUrl || 'https://api.deepseek.com');
  }
  return normalize(localBaseUrl || baseUrl || 'https://api.deepseek.com');
}

function resolveOpenclawPresetUrl(mode, localBaseUrl, remoteBaseUrl, baseUrl) {
  const normalizedMode = normalizeOpenclawMode(mode, baseUrl);
  if (normalizedMode === 'remote') {
    return remoteBaseUrl || baseUrl || DEFAULT_OPENCLAW_REMOTE_BASE_URL;
  }
  return localBaseUrl || baseUrl || DEFAULT_OPENCLAW_LOCAL_BASE_URL;
}

function staffDisplayName(staff) {
  if (!staff) return '';
  return String(staff.feishuDisplayName || staff.name || staff.realName || staff.displayName || '').trim();
}

function staffSearchText(staff) {
  return [
    staff?.name,
    staff?.feishuDisplayName,
    staff?.role,
    staff?.position,
    staff?.skill,
    staff?.department,
    staff?.community
  ]
    .map((item) => String(item || '').trim().toLowerCase())
    .filter(Boolean)
    .join(' ');
}

function findStaffByName(staffs, names) {
  const targetNames = Array.isArray(names) ? names : [names];
  const normalizedTargets = targetNames.map((name) => String(name || '').trim()).filter(Boolean);
  if (!normalizedTargets.length) return null;
  return staffs.find((staff) => {
    const displayName = staffDisplayName(staff);
    return normalizedTargets.some((name) => name === displayName || name === String(staff?.name || '').trim() || name === String(staff?.feishuDisplayName || '').trim());
  }) || null;
}

function findStaffByKeywords(staffs, keywords, excludeNames = []) {
  const normalizedKeywords = normalizeList(keywords).map((item) => String(item || '').trim().toLowerCase()).filter(Boolean);
  const excluded = new Set(normalizeList(excludeNames).map((item) => String(item || '').trim()));
  if (!normalizedKeywords.length) return null;
  return staffs.find((staff) => {
    const displayName = staffDisplayName(staff);
    if (!displayName || excluded.has(displayName)) {
      return false;
    }
    const text = staffSearchText(staff);
    return normalizedKeywords.some((keyword) => text.includes(keyword));
  }) || null;
}

function pickBackupStaff(staffs, primaryName, keywords = []) {
  const normalizedPrimary = String(primaryName || '').trim();
  const keywordMatch = findStaffByKeywords(staffs, keywords, normalizedPrimary ? [normalizedPrimary] : []);
  if (keywordMatch && staffDisplayName(keywordMatch) !== normalizedPrimary) {
    return keywordMatch;
  }
  return staffs.find((staff) => {
    const displayName = staffDisplayName(staff);
    return displayName && displayName !== normalizedPrimary;
  }) || null;
}

function buildNotificationRoutes(staffs, settings) {
  const defaultSupervisorName = String(settings?.defaultSupervisor || '卜立胜').trim() || '卜立胜';
  const routes = [
    {
      key: 'customer',
      title: '客服通知机器人',
      robotLabel: '当前绑定飞书机器人：客服通知机器人',
      events: ['投诉', '客诉', '智能助手转人工'],
      keywords: ['客服', '前台', '物业服务', '客服前台']
    },
    {
      key: 'repair',
      title: '维修通知机器人',
      robotLabel: '当前绑定飞书机器人：维修通知机器人',
      events: ['报修', '报修派单', '报修处理'],
      keywords: ['维修', '工程', '水电', '维修工', '师傅']
    },
    {
      key: 'life',
      title: '生活服务机器人',
      robotLabel: '当前绑定飞书机器人：生活服务机器人',
      events: ['快递代寄', '蔬菜代买', '生活服务'],
      keywords: ['客服', '前台', '生活服务', '管家', '物业服务']
    }
  ];
  return routes.map((route) => {
    const preferredNames = route.key === 'customer' ? [defaultSupervisorName] : [];
    const primary = findStaffByName(staffs, preferredNames)
      || findStaffByKeywords(staffs, route.keywords)
      || findStaffByName(staffs, defaultSupervisorName)
      || staffs[0]
      || null;
    const primaryName = staffDisplayName(primary) || defaultSupervisorName;
    const backup = pickBackupStaff(staffs, primaryName, route.keywords);
    const backupName = staffDisplayName(backup);
    return {
      ...route,
      primaryStaffId: primary?.id || '',
      backupStaffId: backup?.id || '',
      primaryName,
      backupName: backupName && backupName !== primaryName ? backupName : '暂无'
    };
  });
}

function buildDefaultSettings(community) {
  const localBaseUrl = DEFAULT_OPENCLAW_LOCAL_BASE_URL;
  const remoteBaseUrl = DEFAULT_OPENCLAW_REMOTE_BASE_URL;
  const deepseekBaseUrl = import.meta.env.VITE_DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
  return {
    enabled: true,
    assistantName: '物业智能助手',
    assistantProvider: 'deepseek',
    deepseekMode: 'remote',
    deepseekBaseUrl,
    deepseekLocalBaseUrl: deepseekBaseUrl,
    deepseekRemoteBaseUrl: deepseekBaseUrl,
    deepseekChatPath: '/chat/completions',
    deepseekModel: 'deepseek-chat',
    deepseekApiKey: '',
    deepseekTemperature: 0.2,
    deepseekMaxTokens: 512,
    deepseekApiKeySet: false,
    promptVersion: 'v1',
    analysisTimeoutMs: 5000,
    fallbackToHeuristic: true,
    autoCreateSession: true,
    autoSaveHistory: true,
    autoHandoff: true,
    promptTemplate: '你是物业智能助手，只回答当前小区和当前房屋的问题。先判断需求，再输出最短可用回复或结构化结果。不要闲聊，不要重复上下文。',
    enabledScenes: DEFAULT_SCENES,
    handoffKeywords: ['人工', '客服', '投诉升级', '找主管'],
    defaultSupervisor: community?.defaultSupervisor || '卜立胜',
    communityId: community?.id || '',
    community: displayCommunity(community)
  };
}

export default function AssistantConfigPage() {
  const navigate = useNavigate();
  const { apiBase, token, logout } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [activeCommunityId, setActiveCommunityId] = useState('');
  const [settings, setSettings] = useState(() => readStorage(STORAGE_KEY, buildDefaultSettings(null)));
  const [savedSettings, setSavedSettings] = useState(() => readStorage(`${STORAGE_KEY}-saved`, buildDefaultSettings(null)));

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [communityList, staffList] = await Promise.all([
          listCommunities(apiBase, token),
          listStaffs(apiBase, token)
        ]);
        setCommunities(communityList || []);
        setStaffs(staffList || []);
        const active = (communityList || []).find((item) => Boolean(item.active)) || (communityList || [])[0] || null;
        setActiveCommunityId(String(active?.id || ''));
        const remoteSettings = active?.id ? await getAssistantSettings(apiBase, token, active.id) : null;
        const mergedSettings = { ...buildDefaultSettings(active), ...(remoteSettings && typeof remoteSettings === 'object' ? remoteSettings : readStorage(STORAGE_KEY, {})) };
        const formSettings = sanitizeAssistantSettingsForForm(mergedSettings);
        setSettings(formSettings);
        setSavedSettings(formSettings);
        writeStorage(STORAGE_KEY, formSettings);
      } catch (error) {
        if (error.status === 401) {
          await logout();
          navigate('/login', { replace: true });
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [apiBase, token, logout, navigate]);

  const activeCommunity = useMemo(
    () => communities.find((item) => String(item.id || '') === String(activeCommunityId || '')) || communities.find((item) => Boolean(item.active)) || communities[0] || null,
    [activeCommunityId, communities]
  );

  const currentStaffOptions = useMemo(() => {
    const communityName = displayCommunity(activeCommunity);
    const currentCommunityId = String(activeCommunity?.id || '').trim();
    return staffs.filter((staff) => {
      const staffCommunityId = String(staff.communityId || '').trim();
      const staffCommunity = String(staff.community || '').trim();
      if (currentCommunityId && staffCommunityId) {
        return staffCommunityId === currentCommunityId;
      }
      return !staffCommunity || staffCommunity === communityName;
    });
  }, [activeCommunity, staffs]);

  const notificationRoutes = useMemo(() => buildNotificationRoutes(currentStaffOptions, settings), [currentStaffOptions, settings]);
  const currentAssistantProvider = 'deepseek';

  const routeCopyText = useMemo(() => {
    return notificationRoutes.map((route) => [
      route.title,
      `绑定机器人：${route.title}`,
      `推送事项：${route.events.join('、')}`,
    `负责人：${route.primaryName}`,
    `备选负责人：${route.backupName}`
    ].join('\n')).join('\n\n');
  }, [notificationRoutes]);

  const activeProviderLabel = '深度求索';
  const activeProviderMode = normalizeOpenclawMode(settings.deepseekMode, settings.deepseekBaseUrl);
  const deepseekKeySaved = Boolean(settings.deepseekApiKeySet || savedSettings.deepseekApiKeySet);
  const savedConfigSnapshot = useMemo(() => buildAssistantConfigSnapshot(savedSettings), [savedSettings]);
  const editingConfigSnapshot = useMemo(() => buildAssistantConfigSnapshot(settings), [settings]);
  const configDirty = editingConfigSnapshot !== savedConfigSnapshot;
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/');
  };

  const effectiveConfigPreview = useMemo(() => ({
    当前项目: displayCommunity(activeCommunity),
    当前负责人: settings.defaultSupervisor || '卜立胜',
    当前智能引擎: activeProviderLabel,
    当前连接模式: activeProviderMode === 'remote' ? '远程' : '本地',
    智能引擎地址: settings.deepseekBaseUrl,
    模型名称: settings.deepseekModel,
    自动创建会话: settings.autoCreateSession ? '开启' : '关闭',
    自动保存会话: settings.autoSaveHistory ? '开启' : '关闭',
    自动转人工: settings.autoHandoff ? '开启' : '关闭',
    失败回退: settings.fallbackToHeuristic ? '开启' : '关闭',
    可用场景: normalizeList(settings.enabledScenes),
    转人工关键词: normalizeList(settings.handoffKeywords)
  }), [settings, activeCommunity, activeProviderLabel, activeProviderMode, currentAssistantProvider]);

  const effectiveConfigJson = useMemo(() => JSON.stringify(effectiveConfigPreview, null, 2), [effectiveConfigPreview]);

  const promptPreview = useMemo(() => [
    `你是 ${settings.assistantName || '物业智能助手'}。`,
    `当前项目：${displayCommunity(activeCommunity)}`,
    `默认负责人：${settings.defaultSupervisor || '卜立胜'}`,
    '智能引擎：深度求索',
    `连接模式：${normalizeOpenclawMode(settings.deepseekMode, settings.deepseekBaseUrl) === 'remote' ? '远程' : '本地'}`,
    `可用场景：${normalizeList(settings.enabledScenes).join('、') || '未配置'}`,
    `转人工关键词：${normalizeList(settings.handoffKeywords).join('、') || '无'}`,
    '先判断需求，再给最短可用回复。总字数尽量不超过 120 字。'
  ].join('\n'), [settings, activeCommunity, currentAssistantProvider]);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateOpenclawBaseUrl = (value) => {
    const nextValue = String(value || '').trim();
    setSettings((prev) => {
      const mode = normalizeOpenclawMode(prev.openclawMode, nextValue);
      return {
        ...prev,
        openclawMode: mode,
        openclawBaseUrl: nextValue,
        openclawLocalBaseUrl: mode === 'local' ? nextValue : (prev.openclawLocalBaseUrl || DEFAULT_OPENCLAW_LOCAL_BASE_URL),
        openclawRemoteBaseUrl: mode === 'remote' ? nextValue : (prev.openclawRemoteBaseUrl || DEFAULT_OPENCLAW_REMOTE_BASE_URL)
      };
    });
  };

  const updateDeepseekBaseUrl = (value) => {
    const nextValue = String(value || '').trim();
    setSettings((prev) => {
      const mode = normalizeOpenclawMode(prev.deepseekMode, nextValue);
      return {
        ...prev,
        deepseekMode: mode,
        deepseekBaseUrl: nextValue,
        deepseekLocalBaseUrl: mode === 'local' ? nextValue : (prev.deepseekLocalBaseUrl || nextValue || 'https://api.deepseek.com/v1'),
        deepseekRemoteBaseUrl: mode === 'remote' ? nextValue : (prev.deepseekRemoteBaseUrl || nextValue || 'https://api.deepseek.com/v1')
      };
    });
  };

  const switchOpenclawMode = (mode) => {
    setSettings((prev) => {
      const nextMode = mode === 'remote' ? 'remote' : 'local';
      const nextBase = resolveOpenclawPresetUrl(
        nextMode,
        prev.openclawLocalBaseUrl,
        prev.openclawRemoteBaseUrl,
        prev.openclawBaseUrl
      );
      return {
        ...prev,
        openclawMode: nextMode,
        openclawBaseUrl: nextBase,
        openclawLocalBaseUrl: nextMode === 'local' ? nextBase : (prev.openclawLocalBaseUrl || DEFAULT_OPENCLAW_LOCAL_BASE_URL),
        openclawRemoteBaseUrl: nextMode === 'remote' ? nextBase : (prev.openclawRemoteBaseUrl || DEFAULT_OPENCLAW_REMOTE_BASE_URL)
      };
    });
  };

  const switchDeepseekMode = (mode) => {
    setSettings((prev) => {
      const nextMode = mode === 'remote' ? 'remote' : 'local';
      const nextBase = resolveDeepseekPresetUrl(
        nextMode,
        prev.deepseekLocalBaseUrl,
        prev.deepseekRemoteBaseUrl,
        prev.deepseekBaseUrl
      );
      return {
        ...prev,
        deepseekMode: nextMode,
        deepseekBaseUrl: nextBase,
        deepseekLocalBaseUrl: nextMode === 'local' ? nextBase : (prev.deepseekLocalBaseUrl || nextBase),
        deepseekRemoteBaseUrl: nextMode === 'remote' ? nextBase : (prev.deepseekRemoteBaseUrl || nextBase)
      };
    });
  };

  const switchAssistantProvider = (provider) => {
    setSettings((prev) => {
      const nextProvider = provider === 'openclaw' ? 'openclaw' : 'deepseek';
      return {
        ...prev,
        assistantProvider: nextProvider,
        deepseekBaseUrl: resolveDeepseekPresetUrl(prev.deepseekMode, prev.deepseekLocalBaseUrl, prev.deepseekRemoteBaseUrl, prev.deepseekBaseUrl),
        openclawBaseUrl: resolveOpenclawPresetUrl(prev.openclawMode, prev.openclawLocalBaseUrl, prev.openclawRemoteBaseUrl, prev.openclawBaseUrl)
      };
    });
  };

  const toggleScene = (scene) => {
    setSettings((prev) => {
      const current = new Set(prev.enabledScenes || []);
      if (current.has(scene)) {
        current.delete(scene);
      } else {
        current.add(scene);
      }
      return { ...prev, enabledScenes: Array.from(current) };
    });
  };

  const saveSettings = async () => {
    const next = {
      ...settings,
      communityId: activeCommunity?.id || settings.communityId || '',
      community: displayCommunity(activeCommunity),
      assistantProvider: currentAssistantProvider,
      deepseekMode: normalizeOpenclawMode(settings.deepseekMode, settings.deepseekBaseUrl),
      deepseekBaseUrl: resolveDeepseekPresetUrl(
        settings.deepseekMode,
        settings.deepseekLocalBaseUrl,
        settings.deepseekRemoteBaseUrl,
        settings.deepseekBaseUrl
      ),
      deepseekLocalBaseUrl: settings.deepseekLocalBaseUrl || 'https://api.deepseek.com',
      deepseekRemoteBaseUrl: settings.deepseekRemoteBaseUrl || 'https://api.deepseek.com',
      deepseekChatPath: settings.deepseekChatPath || '/chat/completions',
      deepseekModel: settings.deepseekModel || 'deepseek-chat',
      deepseekApiKey: String(settings.deepseekApiKey || '').trim(),
      deepseekTemperature: Number(settings.deepseekTemperature || 0.2),
      deepseekMaxTokens: Number(settings.deepseekMaxTokens || 512),
      openclawMode: normalizeOpenclawMode(settings.openclawMode, settings.openclawBaseUrl),
      openclawBaseUrl: resolveOpenclawPresetUrl(
        settings.openclawMode,
        settings.openclawLocalBaseUrl,
        settings.openclawRemoteBaseUrl,
        settings.openclawBaseUrl
      ),
      openclawLocalBaseUrl: settings.openclawLocalBaseUrl || DEFAULT_OPENCLAW_LOCAL_BASE_URL,
      openclawRemoteBaseUrl: settings.openclawRemoteBaseUrl || DEFAULT_OPENCLAW_REMOTE_BASE_URL,
      analysisTimeoutMs: Number(settings.analysisTimeoutMs || 5000),
      handoffKeywords: normalizeList(settings.handoffKeywords),
      enabledScenes: normalizeList(settings.enabledScenes)
    };
    setSaving(true);
    setTestResult(null);
    try {
      const saved = await saveAssistantSettings(apiBase, token, next);
      const merged = {
        ...next,
        ...(saved || {}),
        deepseekApiKeySet: Boolean(
          (saved && typeof saved.deepseekApiKeySet !== 'undefined' ? saved.deepseekApiKeySet : null)
          ?? next.deepseekApiKeySet
          ?? next.deepseekApiKey
        ) || Boolean(next.deepseekApiKey)
      };
      writeStorage(STORAGE_KEY, merged);
      writeStorage(`${STORAGE_KEY}-saved`, merged);
      setSettings(merged);
      setSavedSettings(merged);
      window.alert('AI 配置已保存到后端。');
      await testConnection(merged.communityId || activeCommunity?.id || '');
    } catch (error) {
      window.alert(error.message || '保存失败');
      setTestResult({
        success: false,
        message: error.message || '保存失败'
      });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async (communityId = activeCommunity?.id || settings.communityId || '') => {
    const targetCommunityId = String(communityId || '').trim();
    if (!targetCommunityId) {
      window.alert('请先选择项目后再测试连接');
      return null;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testAssistantSettings(apiBase, token, {
        communityId: targetCommunityId
      });
      setTestResult({
        success: true,
        title: result?.['测试结果'] || '成功',
        message: result?.['提示'] || result?.['回复内容'] || '连接正常',
        detail: result
      });
      return result;
    } catch (error) {
      setTestResult({
        success: false,
        title: '失败',
        message: error.message || '测试失败',
        detail: error?.data || null
      });
      return null;
    } finally {
      setTesting(false);
    }
  };

  const resetSettings = () => {
    const next = sanitizeAssistantSettingsForForm(buildDefaultSettings(activeCommunity));
    setSettings(next);
    setSavedSettings(next);
    writeStorage(STORAGE_KEY, next);
    writeStorage(`${STORAGE_KEY}-saved`, next);
  };

  const copyEffectiveConfig = async () => {
    try {
      await navigator.clipboard.writeText(effectiveConfigJson);
      window.alert('已复制当前生效配置');
    } catch (error) {
      window.alert('复制失败');
    }
  };

  const copyTestResult = async () => {
    if (!testResult) {
      window.alert('暂无测试结果');
      return;
    }
    const text = JSON.stringify({
      连接状态: testResult.success ? '成功' : '失败',
      标题: testResult.title || '',
      信息: testResult.message || '',
      详情: testResult.detail || null
    }, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      window.alert('已复制测试结果');
    } catch (error) {
      window.alert('复制失败');
    }
  };

  const copyRouteSummary = async () => {
    try {
      await navigator.clipboard.writeText(routeCopyText);
      window.alert('已复制当前路由配置');
    } catch (error) {
      window.alert('复制失败');
    }
  };

  const openStaffDetail = (staffId) => {
    if (!staffId) {
      return;
    }
    navigate(`/?tab=staff&focusStaffId=${encodeURIComponent(staffId)}`);
  };

  const switchCommunity = async (id) => {
    setActiveCommunityId(id);
    if (!id) {
      return;
    }
    try {
      await activateCommunity(apiBase, token, id);
      const community = communities.find((item) => String(item.id || '') === String(id)) || null;
      const remoteSettings = await getAssistantSettings(apiBase, token, id);
      const mergedSettings = { ...buildDefaultSettings(community), ...(remoteSettings && typeof remoteSettings === 'object' ? remoteSettings : {}) };
      const formSettings = sanitizeAssistantSettingsForForm(mergedSettings);
      setSettings(formSettings);
      setSavedSettings(formSettings);
      writeStorage(STORAGE_KEY, formSettings);
    } catch (error) {
      window.alert(error.message || '切换项目失败');
    }
  };

  return (
    <div className="assistant-config-page">
      <div className="assistant-config-backbar">
        <button type="button" className="btn btn-ghost tiny" onClick={handleBack}>← 返回控制台</button>
      </div>
      <header className="assistant-config-hero card">
        <div className="assistant-config-hero-main">
          <div className="eyebrow">智能中台配置</div>
          <h1>智能助手配置页</h1>
          <p>这里先做成原型，后续可以直接对接智能引擎、常见问题、转人工和业务动作。</p>
        </div>
        <div className="assistant-config-hero-side">
          <div className="hero-chip">当前项目：{displayCommunity(activeCommunity)}</div>
          <div className="hero-chip">当前负责人：{settings.defaultSupervisor || '卜立胜'}</div>
          <div className="hero-chip">智能引擎：{activeProviderLabel}</div>
          <div className="hero-chip">连接模式：{activeProviderMode === 'remote' ? '远程' : '本地'}</div>
          <div className="hero-chip">可选人员：{currentStaffOptions.length} 人</div>
        </div>
      </header>

      <section className="card assistant-config-routing">
        <div className="section-header">
          <div>
            <div className="section-title">通知路由</div>
            <div className="hint">这里直接看：绑定机器人、推送事项、负责人、备选负责人。</div>
          </div>
          <div className="routing-status">
            <span className="hero-chip subtle">当前小区生效中</span>
            <span className="hero-chip subtle">当前负责人：{settings.defaultSupervisor || '卜立胜'}</span>
            <button type="button" className="btn btn-ghost tiny" onClick={copyRouteSummary}>复制当前路由配置</button>
          </div>
        </div>
        <div className="routing-grid">
          {notificationRoutes.map((route) => (
            <article key={route.key} className="routing-card">
              <div className="routing-card-head">
                <div className="routing-title">{route.title}</div>
                <div className="routing-pill">{route.robotLabel}</div>
              </div>
              <div className="routing-row">
                <span className="routing-label">负责人</span>
                {route.primaryStaffId ? (
                  <button type="button" className="routing-link" onClick={() => openStaffDetail(route.primaryStaffId)}>
                    {route.primaryName}
                  </button>
                ) : (
                  <strong>{route.primaryName}</strong>
                )}
              </div>
              <div className="routing-row">
                <span className="routing-label">推送事项</span>
                <span>{route.events.join('、')}</span>
              </div>
              <div className="routing-row">
                <span className="routing-label">备选负责人</span>
                {route.backupStaffId ? (
                  <button type="button" className="routing-link muted" onClick={() => openStaffDetail(route.backupStaffId)}>
                    {route.backupName}
                  </button>
                ) : (
                  <span>{route.backupName}</span>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="assistant-config-toolbar card">
        <div className="toolbar-group">
          <div className="toolbar-title">当前小区</div>
          <select
            className="field"
            value={activeCommunityId}
            onChange={(e) => switchCommunity(e.target.value)}
          >
            <option value="">请选择项目</option>
            {communities.map((community) => (
              <option key={community.id} value={community.id}>
                {displayCommunity(community)}{community.active ? ' / 当前' : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="toolbar-group">
          <div className="toolbar-title">功能概览</div>
          <div className="chip-row compact">
            {COMMUNITY_FEATURES
              .filter((feature) => communityFeatureEnabled(activeCommunity, feature.tab))
              .map((feature) => (
                <span key={feature.field} className="chip active">{feature.label}</span>
              ))}
          </div>
        </div>
      </div>

      <section className="card assistant-config-compare">
        <div className="section-header">
          <div>
            <div className="section-title">当前生效配置 vs 编辑中配置</div>
            <div className="hint">左边看当前保存并生效的值，右边看你正在编辑的值。</div>
          </div>
          <span className={`compare-badge ${configDirty ? 'dirty' : 'clean'}`}>
            {configDirty ? '有未保存修改' : '编辑与生效一致'}
          </span>
        </div>
        <div className="compare-grid">
          <div className="compare-card">
            <div className="compare-card-title">当前生效</div>
            <div className="compare-line">引擎：{activeProviderLabel}</div>
            <div className="compare-line">模式：{activeProviderMode === 'remote' ? '远程' : '本地'}</div>
            <div className="compare-line">地址：{settings.deepseekBaseUrl}</div>
            <div className="compare-line">负责人：{settings.defaultSupervisor || '卜立胜'}</div>
          </div>
          <div className="compare-card">
            <div className="compare-card-title">编辑中</div>
            <div className="compare-line">引擎：深度求索</div>
            <div className="compare-line">模式：{normalizeOpenclawMode(settings.deepseekMode, settings.deepseekBaseUrl) === 'remote' ? '远程' : '本地'}</div>
            <div className="compare-line">地址：{settings.deepseekBaseUrl}</div>
            <div className="compare-line">负责人：{settings.defaultSupervisor || '卜立胜'}</div>
          </div>
        </div>
      </section>

      <div className="assistant-config-grid">
        <section className="card assistant-config-form">
          <div className="section-header">
            <div>
              <div className="section-title">基础配置</div>
              <div className="hint">这些值会直接保存到后端，并在当前小区生效。</div>
            </div>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/')}>返回控制台</button>
          </div>

          <details className="config-fold" open>
            <summary className="config-fold-summary">基础配置</summary>
            <div className="config-fold-body">
              <div className="form-grid">
                <label className="field-group">
                  <span className="field-label">启用智能助手</span>
                  <button type="button" className={`chip ${settings.enabled ? 'active' : ''}`} onClick={() => updateSetting('enabled', !settings.enabled)}>
                    {settings.enabled ? '已启用' : '已关闭'}
                  </button>
                </label>
                <label className="field-group">
                  <span className="field-label">助手名称</span>
                  <input className="field" value={settings.assistantName} onChange={(e) => updateSetting('assistantName', e.target.value)} />
                </label>
                <label className="field-group">
                  <span className="field-label">当前项目</span>
                  <input className="field" value={displayCommunity(activeCommunity)} readOnly />
                </label>
                <label className="field-group">
                  <span className="field-label">当前负责人</span>
                  <input className="field" value={settings.defaultSupervisor || '卜立胜'} readOnly />
                </label>
              </div>
            </div>
          </details>

          <details className="config-fold" open>
            <summary className="config-fold-summary">引擎配置</summary>
            <div className="config-fold-body">
              <div className="form-grid">
                <label className="field-group">
                  <span className="field-label">智能引擎类型</span>
                  <div className="provider-switch">
                    <button type="button" className="provider-option active" disabled>
                      <span className="provider-name">深度求索</span>
                      <span className="provider-desc">当前唯一生效引擎</span>
                    </button>
                  </div>
                  <div className="hint">当前生效：{activeProviderLabel} / {activeProviderMode === 'remote' ? '远程' : '本地'}</div>
                </label>
                <label className="field-group">
                  <span className="field-label">连接模式</span>
                  <div className="chip-row compact">
                    <button
                      type="button"
                      className={`chip ${activeProviderMode === 'local' ? 'active' : ''}`}
                      onClick={() => switchDeepseekMode('local')}
                    >
                      本地
                    </button>
                    <button
                      type="button"
                      className={`chip ${activeProviderMode === 'remote' ? 'active' : ''}`}
                      onClick={() => switchDeepseekMode('remote')}
                    >
                      远程
                    </button>
                  </div>
                </label>
                <label className="field-group">
                  <span className="field-label">接口地址</span>
                  <input className="field" value={settings.deepseekBaseUrl} onChange={(e) => updateDeepseekBaseUrl(e.target.value)} />
                  <div className="hint">默认地址：{settings.deepseekMode === 'remote' ? 'https://api.deepseek.com/v1' : '本地地址'}</div>
                </label>
                <label className="field-group">
                  <span className="field-label">模型名称</span>
                  <input
                    className="field"
                    value={settings.deepseekModel}
                    onChange={(e) => updateSetting('deepseekModel', e.target.value)}
                  />
                </label>
                <label className="field-group">
                  <span className="field-label">请求路径</span>
                  <input
                    className="field"
                    value={settings.deepseekChatPath}
                    onChange={(e) => updateSetting('deepseekChatPath', e.target.value)}
                  />
                </label>
                <label className="field-group">
                  <span className="field-label">输出温度</span>
                  <input
                    className="field"
                    type="number"
                    step="0.1"
                    value={settings.deepseekTemperature}
                    onChange={(e) => updateSetting('deepseekTemperature', e.target.value)}
                  />
                </label>
                <label className="field-group">
                  <span className="field-label">最大输出</span>
                  <input
                    className="field"
                    type="number"
                    value={settings.deepseekMaxTokens}
                    onChange={(e) => updateSetting('deepseekMaxTokens', e.target.value)}
                  />
                </label>
                <label className="field-group field-group-wide">
                  <span className="field-label">接口密钥</span>
                  <input
                    className="field"
                    type="password"
                    value={settings.deepseekApiKey || ''}
                    placeholder={settings.deepseekApiKeySet ? '已保存，留空表示不修改' : '请输入接口密钥'}
                    onChange={(e) => updateSetting('deepseekApiKey', e.target.value)}
                  />
                  <div className={`key-status ${deepseekKeySaved ? 'success' : 'warning'}`}>
                    <span className="key-status-dot" />
                    <span>{deepseekKeySaved ? '密钥已保存到后端，重启后仍会保留' : '尚未保存密钥，请填写后点“保存后立即测试连接”'}</span>
                  </div>
                </label>
              </div>
            </div>
          </details>

          <details className="config-fold" open>
            <summary className="config-fold-summary">通知配置</summary>
            <div className="config-fold-body">
              <div className="toggle-row">
                <label className="toggle-item">
                  <span>失败回退到规则分析</span>
                  <button type="button" className={`chip ${settings.fallbackToHeuristic ? 'active' : ''}`} onClick={() => updateSetting('fallbackToHeuristic', !settings.fallbackToHeuristic)}>
                    {settings.fallbackToHeuristic ? '是' : '否'}
                  </button>
                </label>
                <label className="toggle-item">
                  <span>自动创建会话</span>
                  <button type="button" className={`chip ${settings.autoCreateSession ? 'active' : ''}`} onClick={() => updateSetting('autoCreateSession', !settings.autoCreateSession)}>
                    {settings.autoCreateSession ? '是' : '否'}
                  </button>
                </label>
                <label className="toggle-item">
                  <span>自动保存会话</span>
                  <button type="button" className={`chip ${settings.autoSaveHistory ? 'active' : ''}`} onClick={() => updateSetting('autoSaveHistory', !settings.autoSaveHistory)}>
                    {settings.autoSaveHistory ? '是' : '否'}
                  </button>
                </label>
                <label className="toggle-item">
                  <span>自动转人工</span>
                  <button type="button" className={`chip ${settings.autoHandoff ? 'active' : ''}`} onClick={() => updateSetting('autoHandoff', !settings.autoHandoff)}>
                    {settings.autoHandoff ? '是' : '否'}
                  </button>
                </label>
              </div>
              <div className="section-block">
                <div className="section-title">转人工关键词</div>
                <textarea className="field textarea" rows={3} value={normalizeList(settings.handoffKeywords).join('、')} onChange={(e) => updateSetting('handoffKeywords', e.target.value)} />
              </div>
            </div>
          </details>

          <details className="config-fold" open>
            <summary className="config-fold-summary">提示词配置</summary>
            <div className="config-fold-body">
              <div className="form-grid">
                <label className="field-group">
                  <span className="field-label">提示词版本</span>
                  <input className="field" value={settings.promptVersion} onChange={(e) => updateSetting('promptVersion', e.target.value)} />
                </label>
                <label className="field-group">
                  <span className="field-label">超时时间（毫秒）</span>
                  <input className="field" type="number" value={settings.analysisTimeoutMs} onChange={(e) => updateSetting('analysisTimeoutMs', e.target.value)} />
                </label>
              </div>
              <div className="section-block">
                <div className="section-title">可用场景</div>
                <div className="chip-row compact">
                  {DEFAULT_SCENES.map((scene) => (
                    <button key={scene} type="button" className={`chip ${(settings.enabledScenes || []).includes(scene) ? 'active' : ''}`} onClick={() => toggleScene(scene)}>
                      {scene === 'query_bill' ? '查物业费'
                        : scene === 'query_repair' ? '查报修'
                        : scene === 'create_repair' ? '提交报修'
                        : scene === 'create_feedback' ? '提交反馈'
                        : scene === 'query_notice' ? '查公告'
                        : scene === 'handoff' ? '转人工'
                        : scene}
                    </button>
                  ))}
                </div>
              </div>
              <div className="section-block">
                <div className="section-title">提示词模板</div>
                <textarea className="field textarea prompt" rows={10} value={settings.promptTemplate} onChange={(e) => updateSetting('promptTemplate', e.target.value)} />
              </div>
            </div>
          </details>

          <div className="footer-actions">
            <button type="button" className="btn btn-primary" onClick={saveSettings} disabled={loading || saving || testing}>
              {saving ? '保存中...' : testing ? '保存后测试中...' : '保存后立即测试连接'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => testConnection()} disabled={loading || saving || testing}>
              {testing ? '测试中...' : '仅测试连接'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={resetSettings} disabled={saving || testing}>恢复默认</button>
          </div>
          {testResult ? (
            <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
              <div className="test-result-banner">
                <span className={`test-result-badge ${testResult.success ? 'success' : 'error'}`}>{testResult.success ? '连接正常' : '连接失败'}</span>
                <span className="test-result-title">{testResult.success ? '保存后测试通过' : '测试未通过'}</span>
                <button type="button" className="btn btn-ghost tiny" onClick={copyTestResult}>复制结果</button>
              </div>
              <div className="test-result-text">{testResult.message || testResult.title || '无结果'}</div>
              <div className="test-result-grid">
                <div className="test-result-item">
                  <span>智能引擎</span>
                  <strong>{testResult.detail?.['智能引擎'] || activeProviderLabel}</strong>
                </div>
                <div className="test-result-item">
                  <span>接口地址</span>
                  <strong>{testResult.detail?.['接口地址'] || settings.deepseekBaseUrl}</strong>
                </div>
                <div className="test-result-item">
                  <span>项目名称</span>
                  <strong>{testResult.detail?.['项目名称'] || displayCommunity(activeCommunity)}</strong>
                </div>
                <div className="test-result-item">
                  <span>耗时</span>
                  <strong>{testResult.detail?.['耗时毫秒'] ? `${testResult.detail['耗时毫秒']} 毫秒` : '—'}</strong>
                </div>
              </div>
              {testResult.detail ? (
                <details className="test-result-detail">
                  <summary>查看返回详情</summary>
                  <pre>{JSON.stringify(testResult.detail, null, 2)}</pre>
                </details>
              ) : null}
            </div>
          ) : null}
        </section>

        <aside className="assistant-config-preview">
          <details className="card preview-card preview-fold" open>
            <summary className="config-fold-summary preview-fold-summary">查看当前生效配置</summary>
            <div className="config-fold-body preview-fold-body">
              <div className="section-header">
                <div>
                  <div className="section-title">当前生效配置</div>
                  <div className="hint">这里显示的是当前小区真正会生效的配置，方便你确认保存后有没有切到正确的引擎。</div>
                </div>
                <button type="button" className="btn btn-ghost tiny" onClick={copyEffectiveConfig}>复制当前配置</button>
              </div>
              <pre className="json-preview">{effectiveConfigJson}</pre>
            </div>
          </details>

          <section className="card preview-card">
            <div className="section-header">
              <div>
                <div className="section-title">提示词预览</div>
                <div className="hint">把这段直接交给智能引擎就能先跑原型。</div>
              </div>
            </div>
            <pre className="json-preview">{promptPreview}</pre>
          </section>

          <section className="card preview-card">
            <div className="section-header">
              <div>
          <div className="section-title">返回示例</div>
                <div className="hint">建议智能引擎直接返回这类结构化内容。</div>
              </div>
            </div>
            <pre className="json-preview small">{JSON.stringify({
              回复内容: '我可以帮你查本月物业费。',
              场景: '查物业费',
              是否需要确认: '否',
              是否转人工: '否',
              动作: { 类型: '查物业费', 参数: { 项目ID: activeCommunity?.id || '', 房屋ID: '' } },
              上下文: { 项目ID: activeCommunity?.id || '', 房屋ID: '', 房号: '' },
              快捷回复: ['查物业费', '提交报修', '转人工'],
              原因: '用户询问物业费'
            }, null, 2)}</pre>
          </section>

          <section className="card preview-card">
            <div className="section-header">
              <div>
                <div className="section-title">当前可选物业人员</div>
                <div className="hint">这些人会用于“负责人 / 通知对象”配置。</div>
              </div>
            </div>
            <div className="staff-list">
              {currentStaffOptions.length ? currentStaffOptions.map((staff) => (
                <button key={staff.id} type="button" className="staff-chip" onClick={() => openStaffDetail(staff.id)}>
                  <div className="staff-name">{staff.name}</div>
                  <div className="staff-meta">{staff.role || '物业人员'} / {staff.position || '未填写岗位'}</div>
                </button>
              )) : <div className="hint">当前小区暂未配置物业人员。</div>}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
