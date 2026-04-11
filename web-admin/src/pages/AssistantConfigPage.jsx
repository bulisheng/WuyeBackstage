import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { activateCommunity, getAssistantSettings, listCommunities, listStaffs, saveAssistantSettings } from '../lib/api';
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

function resolveOpenclawPresetUrl(mode, localBaseUrl, remoteBaseUrl, baseUrl) {
  const normalizedMode = normalizeOpenclawMode(mode, baseUrl);
  if (normalizedMode === 'remote') {
    return remoteBaseUrl || baseUrl || DEFAULT_OPENCLAW_REMOTE_BASE_URL;
  }
  return localBaseUrl || baseUrl || DEFAULT_OPENCLAW_LOCAL_BASE_URL;
}

function buildDefaultSettings(community) {
  const localBaseUrl = DEFAULT_OPENCLAW_LOCAL_BASE_URL;
  const remoteBaseUrl = DEFAULT_OPENCLAW_REMOTE_BASE_URL;
  return {
    enabled: true,
    assistantName: '物业AI客服',
    openclawMode: 'local',
    openclawBaseUrl: localBaseUrl,
    openclawLocalBaseUrl: localBaseUrl,
    openclawRemoteBaseUrl: remoteBaseUrl,
    openclawModel: 'openclaw-assistant',
    openclawSessionPath: '/session/{sessionId}',
    openclawMessagePath: '/api/v1/assistant/messages',
    openclawHandoffPath: '/api/v1/assistant/handoff',
    promptVersion: 'v1',
    analysisTimeoutMs: 5000,
    fallbackToHeuristic: true,
    autoCreateSession: true,
    autoSaveHistory: true,
    autoHandoff: true,
    promptTemplate: '你是物业AI客服，只回答当前小区和当前房屋的问题。输出严格 JSON。',
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
  const [activeCommunityId, setActiveCommunityId] = useState('');
  const [settings, setSettings] = useState(() => readStorage(STORAGE_KEY, buildDefaultSettings(null)));

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
        setSettings(mergedSettings);
        writeStorage(STORAGE_KEY, mergedSettings);
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

  const previewJson = useMemo(() => JSON.stringify({
    enabled: settings.enabled,
    assistantName: settings.assistantName,
    openclawMode: settings.openclawMode,
    openclawBaseUrl: settings.openclawBaseUrl,
    openclawLocalBaseUrl: settings.openclawLocalBaseUrl,
    openclawRemoteBaseUrl: settings.openclawRemoteBaseUrl,
    openclawModel: settings.openclawModel,
    promptVersion: settings.promptVersion,
    analysisTimeoutMs: settings.analysisTimeoutMs,
    fallbackToHeuristic: settings.fallbackToHeuristic,
    autoCreateSession: settings.autoCreateSession,
    autoSaveHistory: settings.autoSaveHistory,
    autoHandoff: settings.autoHandoff,
    enabledScenes: normalizeList(settings.enabledScenes),
    handoffKeywords: normalizeList(settings.handoffKeywords),
    defaultSupervisor: settings.defaultSupervisor,
    currentCommunity: displayCommunity(activeCommunity)
  }, null, 2), [settings, activeCommunity]);

  const promptPreview = useMemo(() => [
    `你是 ${settings.assistantName || '物业AI客服'}。`,
    `当前项目：${displayCommunity(activeCommunity)}`,
    `默认负责人：${settings.defaultSupervisor || '卜立胜'}`,
    `连接模式：${normalizeOpenclawMode(settings.openclawMode, settings.openclawBaseUrl) === 'remote' ? '远程' : '本地'}`,
    `可用场景：${normalizeList(settings.enabledScenes).join('、') || '未配置'}`,
    `转人工关键词：${normalizeList(settings.handoffKeywords).join('、') || '无'}`,
    '请严格输出 JSON，不要输出多余解释。'
  ].join('\n'), [settings, activeCommunity]);

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

  const saveSettings = () => {
    const next = {
      ...settings,
      communityId: activeCommunity?.id || settings.communityId || '',
      community: displayCommunity(activeCommunity),
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
    saveAssistantSettings(apiBase, token, next)
      .then((saved) => {
        const merged = { ...next, ...(saved || {}) };
        writeStorage(STORAGE_KEY, merged);
        setSettings(merged);
        window.alert('AI 配置已保存到后端。');
      })
      .catch((error) => {
        window.alert(error.message || '保存失败');
      });
  };

  const resetSettings = () => {
    const next = buildDefaultSettings(activeCommunity);
    setSettings(next);
    writeStorage(STORAGE_KEY, next);
  };

  const copyPreview = async () => {
    try {
      await navigator.clipboard.writeText(previewJson);
      window.alert('已复制 JSON 预览');
    } catch (error) {
      window.alert('复制失败');
    }
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
      setSettings(mergedSettings);
      writeStorage(STORAGE_KEY, mergedSettings);
    } catch (error) {
      window.alert(error.message || '切换项目失败');
    }
  };

  return (
    <div className="assistant-config-page">
      <header className="assistant-config-hero card">
        <div className="assistant-config-hero-main">
          <div className="eyebrow">AI 中台配置</div>
          <h1>物业 AI 客服配置页</h1>
          <p>这里先做成原型，后续可以直接对接 openclaw、FAQ、转人工和业务动作。</p>
        </div>
        <div className="assistant-config-hero-side">
          <div className="hero-chip">当前项目：{displayCommunity(activeCommunity)}</div>
          <div className="hero-chip">当前负责人：{settings.defaultSupervisor || '卜立胜'}</div>
          <div className="hero-chip">连接模式：{normalizeOpenclawMode(settings.openclawMode, settings.openclawBaseUrl) === 'remote' ? '远程' : '本地'}</div>
          <div className="hero-chip">可选人员：{currentStaffOptions.length} 人</div>
        </div>
      </header>

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

      <div className="assistant-config-grid">
        <section className="card assistant-config-form">
          <div className="section-header">
            <div>
              <div className="section-title">基础配置</div>
              <div className="hint">这些值会直接保存到后端，并在当前小区生效。</div>
            </div>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/')}>返回控制台</button>
          </div>

          <div className="form-grid">
            <label className="field-group">
              <span className="field-label">启用 AI 客服</span>
              <button type="button" className={`chip ${settings.enabled ? 'active' : ''}`} onClick={() => updateSetting('enabled', !settings.enabled)}>
                {settings.enabled ? '已启用' : '已关闭'}
              </button>
            </label>
            <label className="field-group">
              <span className="field-label">连接模式</span>
              <div className="chip-row compact">
                <button
                  type="button"
                  className={`chip ${normalizeOpenclawMode(settings.openclawMode, settings.openclawBaseUrl) === 'local' ? 'active' : ''}`}
                  onClick={() => switchOpenclawMode('local')}
                >
                  本地
                </button>
                <button
                  type="button"
                  className={`chip ${normalizeOpenclawMode(settings.openclawMode, settings.openclawBaseUrl) === 'remote' ? 'active' : ''}`}
                  onClick={() => switchOpenclawMode('remote')}
                >
                  远程
                </button>
              </div>
            </label>
            <label className="field-group">
              <span className="field-label">客服名称</span>
              <input className="field" value={settings.assistantName} onChange={(e) => updateSetting('assistantName', e.target.value)} />
            </label>
            <label className="field-group">
              <span className="field-label">openclaw 地址</span>
              <input className="field" value={settings.openclawBaseUrl} onChange={(e) => updateOpenclawBaseUrl(e.target.value)} />
              <div className="hint">当前模式：{normalizeOpenclawMode(settings.openclawMode, settings.openclawBaseUrl) === 'remote' ? '远程（Mac mini / 云端）' : '本地（127.0.0.1）'}</div>
            </label>
            <label className="field-group">
              <span className="field-label">模型名称</span>
              <input className="field" value={settings.openclawModel} onChange={(e) => updateSetting('openclawModel', e.target.value)} />
            </label>
            <label className="field-group">
              <span className="field-label">会话路径</span>
              <input className="field" value={settings.openclawSessionPath || ''} onChange={(e) => updateSetting('openclawSessionPath', e.target.value)} />
            </label>
            <label className="field-group">
              <span className="field-label">消息路径</span>
              <input className="field" value={settings.openclawMessagePath || ''} onChange={(e) => updateSetting('openclawMessagePath', e.target.value)} />
            </label>
            <label className="field-group">
              <span className="field-label">转人工路径</span>
              <input className="field" value={settings.openclawHandoffPath || ''} onChange={(e) => updateSetting('openclawHandoffPath', e.target.value)} />
            </label>
            <label className="field-group">
              <span className="field-label">提示词版本</span>
              <input className="field" value={settings.promptVersion} onChange={(e) => updateSetting('promptVersion', e.target.value)} />
            </label>
            <label className="field-group">
              <span className="field-label">超时时间（ms）</span>
              <input className="field" type="number" value={settings.analysisTimeoutMs} onChange={(e) => updateSetting('analysisTimeoutMs', e.target.value)} />
            </label>
          </div>

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
            <div className="section-title">转人工关键词</div>
            <textarea className="field textarea" rows={3} value={normalizeList(settings.handoffKeywords).join('、')} onChange={(e) => updateSetting('handoffKeywords', e.target.value)} />
          </div>

          <div className="section-block">
            <div className="section-title">Prompt 模板</div>
            <textarea className="field textarea prompt" rows={10} value={settings.promptTemplate} onChange={(e) => updateSetting('promptTemplate', e.target.value)} />
          </div>

          <div className="footer-actions">
            <button type="button" className="btn btn-primary" onClick={saveSettings} disabled={loading}>保存配置</button>
            <button type="button" className="btn btn-ghost" onClick={resetSettings}>恢复默认</button>
          </div>
        </section>

        <aside className="assistant-config-preview">
          <section className="card preview-card">
            <div className="section-header">
              <div>
                <div className="section-title">Prompt 预览</div>
                <div className="hint">把这段直接喂给 openclaw 就能先跑原型。</div>
              </div>
              <button type="button" className="btn btn-ghost tiny" onClick={copyPreview}>复制 JSON</button>
            </div>
            <pre className="json-preview">{promptPreview}</pre>
          </section>

          <section className="card preview-card">
            <div className="section-header">
              <div>
                <div className="section-title">响应结构</div>
                <div className="hint">建议 openclaw 直接返回这类 JSON。</div>
              </div>
            </div>
            <pre className="json-preview small">{JSON.stringify({
              replyText: '我可以帮你查本月物业费。',
              intent: 'query_bill',
              confidence: 0.96,
              needConfirm: false,
              handoff: false,
              action: { type: 'query_bill', params: { communityId: activeCommunity?.id || '', houseId: '' } },
              slots: { communityId: activeCommunity?.id || '', houseId: '', room: '' },
              quickReplies: ['查物业费', '提交报修', '转人工'],
              reason: '用户询问物业费'
            }, null, 2)}</pre>
          </section>

          <section className="card preview-card">
            <div className="section-header">
              <div>
                <div className="section-title">当前可选物业人员</div>
                <div className="hint">这些人会用于“通知人 / 负责人”配置。</div>
              </div>
            </div>
            <div className="staff-list">
              {currentStaffOptions.length ? currentStaffOptions.map((staff) => (
                <div key={staff.id} className="staff-chip">
                  <div className="staff-name">{staff.name}</div>
                  <div className="staff-meta">{staff.role || '物业人员'} / {staff.position || '未填写岗位'}</div>
                </div>
              )) : <div className="hint">当前小区暂未配置物业人员。</div>}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
