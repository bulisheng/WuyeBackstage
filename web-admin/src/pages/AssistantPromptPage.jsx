import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { activateCommunity, getAssistantSettings, listCommunities, listStaffs, saveAssistantSettings } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const DEFAULT_SCENES = ['query_bill', 'query_repair', 'create_repair', 'create_feedback', 'query_notice', 'handoff'];
const STORAGE_PROMPT_SNAPSHOT_PREFIX = 'assistant-prompt-snapshot-';
const DEFAULT_OPENCLAW_LOCAL_BASE_URL = import.meta.env.VITE_OPENCLAW_LOCAL_BASE_URL || 'http://127.0.0.1:18789/chat?session=agent%3Amain%3Amain';
const DEFAULT_OPENCLAW_REMOTE_BASE_URL = import.meta.env.VITE_OPENCLAW_REMOTE_BASE_URL || 'https://openclaw.example.com';

function communityName(community) {
  if (!community) return '未选择项目';
  return community.projectName || community.name || '未命名项目';
}

function joinList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join('、');
  return String(value || '');
}

function parseList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value || '')
    .split(/[、,;|\n]/g)
    .map((item) => item.trim())
    .filter(Boolean);
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

function defaultSettings(community) {
  const localBaseUrl = DEFAULT_OPENCLAW_LOCAL_BASE_URL;
  const remoteBaseUrl = DEFAULT_OPENCLAW_REMOTE_BASE_URL;
  return {
    enabled: true,
    assistantName: '物业智能助手',
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
    promptTemplate: '你是物业智能助手，只回答当前小区和当前房屋的问题。先判断意图，再输出最短可用回复或结构化 JSON。不要闲聊，不要重复上下文。',
    enabledScenes: DEFAULT_SCENES,
    handoffKeywords: ['人工', '客服', '投诉升级', '找主管'],
    defaultSupervisor: community?.defaultSupervisor || '卜立胜',
    communityId: community?.id || '',
    community: communityName(community)
  };
}

function promptSnapshotKey(communityId) {
  return `${STORAGE_PROMPT_SNAPSHOT_PREFIX}${communityId || 'default'}`;
}

function readPromptSnapshot(communityId) {
  try {
    const raw = localStorage.getItem(promptSnapshotKey(communityId));
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function writePromptSnapshot(communityId, settings) {
  try {
    localStorage.setItem(promptSnapshotKey(communityId), JSON.stringify(settings || {}));
  } catch (error) {
    // ignore storage errors
  }
}

export default function AssistantPromptPage() {
  const navigate = useNavigate();
  const { apiBase, token, logout } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [staffs, setStaffs] = useState([]);
  const [activeCommunityId, setActiveCommunityId] = useState('');
  const [settings, setSettings] = useState(defaultSettings(null));

  const activeCommunity = useMemo(
    () => communities.find((item) => String(item.id || '') === String(activeCommunityId || '')) || communities.find((item) => Boolean(item.active)) || communities[0] || null,
    [activeCommunityId, communities]
  );

  const currentStaffOptions = useMemo(() => {
    const currentCommunityId = String(activeCommunity?.id || '').trim();
    const community = communityName(activeCommunity);
    return staffs.filter((staff) => {
      const staffCommunityId = String(staff.communityId || '').trim();
      const staffCommunity = String(staff.community || '').trim();
      if (currentCommunityId && staffCommunityId) {
        return staffCommunityId === currentCommunityId;
      }
      return !staffCommunity || staffCommunity === community;
    });
  }, [activeCommunity, staffs]);

  useEffect(() => {
    const load = async () => {
      try {
        const [communityList, staffList] = await Promise.all([
          listCommunities(apiBase, token),
          listStaffs(apiBase, token)
        ]);
        setCommunities(communityList || []);
        setStaffs(staffList || []);
        const active = (communityList || []).find((item) => Boolean(item.active)) || (communityList || [])[0] || null;
        const communityId = String(active?.id || '');
        setActiveCommunityId(communityId);
        const remote = communityId ? await getAssistantSettings(apiBase, token, communityId) : null;
        const merged = { ...defaultSettings(active), ...(remote || {}) };
        setSettings(merged);
        writePromptSnapshot(communityId, merged);
      } catch (error) {
        if (error.status === 401) {
          await logout();
          navigate('/login', { replace: true });
        }
      }
    };
    load();
  }, [apiBase, token, logout, navigate]);

  const save = async () => {
    try {
      const payload = {
        ...settings,
        communityId: activeCommunity?.id || settings.communityId || '',
        community: communityName(activeCommunity),
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
        enabledScenes: parseList(settings.enabledScenes),
        handoffKeywords: parseList(settings.handoffKeywords)
      };
      const saved = await saveAssistantSettings(apiBase, token, payload);
      const merged = { ...defaultSettings(activeCommunity), ...saved };
      setSettings(merged);
      writePromptSnapshot(payload.communityId, merged);
      window.alert('提示词已保存到后端');
    } catch (error) {
      window.alert(error.message || '保存失败');
    }
  };

  const switchCommunity = async (id) => {
    setActiveCommunityId(id);
    try {
      await activateCommunity(apiBase, token, id);
      const community = communities.find((item) => String(item.id || '') === String(id)) || null;
      const remote = await getAssistantSettings(apiBase, token, id);
      const merged = { ...defaultSettings(community), ...(remote || {}) };
      setSettings(merged);
      writePromptSnapshot(id, merged);
    } catch (error) {
      window.alert(error.message || '切换项目失败');
    }
  };

  const previewPrompt = useMemo(() => [
    `你是 ${settings.assistantName || '物业智能助手'}。`,
    `当前项目：${communityName(activeCommunity)}`,
    `当前主负责人：${settings.defaultSupervisor || '卜立胜'}`,
    `连接模式：${normalizeOpenclawMode(settings.openclawMode, settings.openclawBaseUrl) === 'remote' ? '远程' : '本地'}`,
    `可用场景：${parseList(settings.enabledScenes).join('、') || '未配置'}`,
    `转人工关键词：${parseList(settings.handoffKeywords).join('、') || '无'}`,
    '请严格输出 JSON，不要输出多余解释。'
  ].join('\n'), [settings, activeCommunity]);

  const setField = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));

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

  const copyPromptTemplate = async () => {
    try {
      await navigator.clipboard.writeText(settings.promptTemplate || '');
      window.alert('已复制提示词模板');
    } catch (error) {
      window.alert(error.message || '复制失败');
    }
  };

  const resetToDefault = () => {
    if (!window.confirm('确定恢复当前项目的默认提示词配置吗？')) {
      return;
    }
    setSettings(defaultSettings(activeCommunity));
  };

  const restoreLastSaved = () => {
    const snapshot = readPromptSnapshot(activeCommunityId || activeCommunity?.id || '');
    if (!snapshot) {
      window.alert('当前项目还没有可恢复的保存记录');
      return;
    }
    if (!window.confirm('确定恢复到上一次保存的配置吗？')) {
      return;
    }
    setSettings({ ...defaultSettings(activeCommunity), ...snapshot });
  };

  const toggleScene = (scene) => {
    setSettings((prev) => {
      const current = new Set(parseList(prev.enabledScenes));
      if (current.has(scene)) current.delete(scene);
      else current.add(scene);
      return { ...prev, enabledScenes: Array.from(current) };
    });
  };

  return (
    <div className="assistant-center-page">
      <header className="assistant-center-hero card">
        <div>
          <div className="eyebrow">智能中台</div>
          <h1>提示词配置</h1>
          <p>这里专门维护智能引擎提示词和场景开关，方便调整智能助手的回答风格和动作边界。</p>
        </div>
        <div className="assistant-center-actions">
          <button type="button" className="btn btn-primary" onClick={save}>保存配置</button>
          <button type="button" className="btn btn-ghost" onClick={copyPromptTemplate}>一键复制模板</button>
          <button type="button" className="btn btn-ghost" onClick={restoreLastSaved}>恢复上一次保存</button>
          <button type="button" className="btn btn-ghost" onClick={resetToDefault}>重置默认模板</button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/assistant-faq')}>常见问题</button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/assistant-sessions')}>会话日志</button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/')}>返回控制台</button>
        </div>
      </header>

      <section className="card assistant-center-toolbar">
        <div className="toolbar-group">
          <div className="toolbar-title">当前项目</div>
          <select className="field" value={activeCommunityId} onChange={(e) => switchCommunity(e.target.value)}>
            <option value="">请选择项目</option>
            {communities.map((community) => (
              <option key={community.id} value={community.id}>
                {communityName(community)}{community.active ? ' / 当前' : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="toolbar-group">
          <div className="toolbar-title">当前可选物业人员</div>
          <div className="chip-row compact">
            {currentStaffOptions.length ? currentStaffOptions.slice(0, 6).map((staff) => (
              <span key={staff.id} className="chip active">{staff.name}</span>
            )) : <span className="hint">当前项目暂无物业人员</span>}
          </div>
        </div>
      </section>

      <div className="assistant-center-layout">
        <section className="card assistant-center-list">
          <div className="assistant-list-head">
            <div>提示词主配置</div>
            <div className="hint">这些字段会直接保存到后端</div>
          </div>
          <div className="assistant-form">
            <label className="field-group">
              <span className="field-label">助手名称</span>
              <input className="field" value={settings.assistantName || ''} onChange={(e) => setField('assistantName', e.target.value)} />
            </label>
            <label className="field-group">
              <span className="field-label">提示词模板</span>
              <textarea className="field textarea prompt" rows={12} value={settings.promptTemplate || ''} onChange={(e) => setField('promptTemplate', e.target.value)} />
            </label>
            <div className="form-grid two">
              <label className="field-group">
                <span className="field-label">提示词版本</span>
                <input className="field" value={settings.promptVersion || ''} onChange={(e) => setField('promptVersion', e.target.value)} />
              </label>
              <label className="field-group">
                <span className="field-label">超时时间（ms）</span>
                <input className="field" type="number" value={settings.analysisTimeoutMs || 5000} onChange={(e) => setField('analysisTimeoutMs', e.target.value)} />
              </label>
            </div>
            <label className="field-group">
              <span className="field-label">转人工关键词</span>
              <textarea className="field textarea" rows={3} value={joinList(settings.handoffKeywords)} onChange={(e) => setField('handoffKeywords', e.target.value)} />
            </label>
            <label className="field-group">
              <span className="field-label">默认主负责人</span>
              <select className="field" value={settings.defaultSupervisor || ''} onChange={(e) => setField('defaultSupervisor', e.target.value)}>
                <option value="">请选择主负责人</option>
                {currentStaffOptions.map((staff) => <option key={staff.id} value={staff.name}>{staff.name}</option>)}
              </select>
            </label>
            <div className="section-title">可用场景</div>
            <div className="chip-row compact">
              {DEFAULT_SCENES.map((scene) => (
                <button key={scene} type="button" className={`chip ${parseList(settings.enabledScenes).includes(scene) ? 'active' : ''}`} onClick={() => toggleScene(scene)}>
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
        </section>

        <aside className="card assistant-center-drawer">
          <div className="section-header">
            <div>
              <div className="section-title">提示词预览</div>
              <div className="hint">保存前先确认这段内容是否符合预期。</div>
            </div>
          </div>
          <pre className="json-preview">{previewPrompt}</pre>
          <div className="section-header">
            <div>
              <div className="section-title">JSON 预览</div>
              <div className="hint">建议智能引擎返回这类结构化内容。</div>
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
        </aside>
      </div>
    </div>
  );
}
