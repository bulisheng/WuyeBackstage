import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { activateCommunity, getAssistantSession, listAssistantSessions, listCommunities } from '../lib/api';
import { useAuth } from '../context/AuthContext';

function communityName(community) {
  if (!community) return '未选择项目';
  return community.projectName || community.name || '未命名项目';
}

function formatTime(value) {
  return value || '-';
}

export default function AssistantSessionsPage() {
  const navigate = useNavigate();
  const { apiBase, token, logout } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [activeCommunityId, setActiveCommunityId] = useState('');
  const [sessions, setSessions] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selected, setSelected] = useState(null);
  const [rawCollapsed, setRawCollapsed] = useState(false);
  const [rawViewMode, setRawViewMode] = useState('formatted');
  const [loading, setLoading] = useState(false);

  const activeCommunity = useMemo(
    () => communities.find((item) => String(item.id || '') === String(activeCommunityId || '')) || communities.find((item) => Boolean(item.active)) || communities[0] || null,
    [activeCommunityId, communities]
  );

  const selectedRawJson = useMemo(() => {
    if (!selected) {
      return null;
    }
    const messages = Array.isArray(selected.messages) ? [...selected.messages].reverse() : [];
    const fromAssistant = messages.find((message) => message && message.role === 'assistant' && message.raw);
    if (fromAssistant && fromAssistant.raw) {
      return fromAssistant.raw;
    }
    if (selected.result) {
      return selected.result;
    }
    if (selected.context) {
      return selected.context;
    }
    return null;
  }, [selected]);

  const selectedRawJsonText = useMemo(
    () => (selectedRawJson ? JSON.stringify(selectedRawJson, null, 2) : ''),
    [selectedRawJson]
  );

  const selectedRawJsonCompactText = useMemo(() => {
    if (selectedRawJson === null || selectedRawJson === undefined) {
      return '';
    }
    if (typeof selectedRawJson === 'string') {
      return selectedRawJson;
    }
    try {
      return JSON.stringify(selectedRawJson);
    } catch (error) {
      return selectedRawJsonText;
    }
  }, [selectedRawJson, selectedRawJsonText]);

  const selectedRawJsonDisplayText = rawViewMode === 'formatted' ? selectedRawJsonText : selectedRawJsonCompactText;

  const loadSessions = async (communityId) => {
    const list = await listAssistantSessions(apiBase, token, communityId || '');
    setSessions(Array.isArray(list) ? list : []);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const list = await listCommunities(apiBase, token);
        setCommunities(list || []);
        const active = (list || []).find((item) => Boolean(item.active)) || (list || [])[0] || null;
        const communityId = String(active?.id || '');
        setActiveCommunityId(communityId);
        await loadSessions(communityId);
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

  const filteredSessions = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    return sessions.filter((item) => {
      if (!term) return true;
      const blob = [item.userName, item.houseNo, item.room, item.phone, item.status, item.scene, item.community, item.lastMessageAt].join(' ').toLowerCase();
      return blob.includes(term);
    });
  }, [sessions, searchText]);

  const switchCommunity = async (id) => {
    setActiveCommunityId(id);
    try {
      await activateCommunity(apiBase, token, id);
      await loadSessions(id);
      setSelected(null);
    } catch (error) {
      window.alert(error.message || '切换项目失败');
    }
  };

  const openSession = async (session) => {
    setLoading(true);
    try {
      const detail = await getAssistantSession(apiBase, token, session.id);
      setSelected(detail || session);
      setRawCollapsed(false);
      setRawViewMode('formatted');
    } catch (error) {
      window.alert(error.message || '加载会话失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="assistant-center-page">
      <header className="assistant-center-hero card">
        <div>
          <div className="eyebrow">AI 中台</div>
          <h1>会话日志</h1>
          <p>这里可以查看每次智能助手会话、上下文和原始消息记录。</p>
        </div>
        <div className="assistant-center-actions">
          <button type="button" className="btn btn-primary" onClick={() => navigate('/assistant-prompt')}>提示词</button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/assistant-faq')}>常见问题</button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/assistant-config')}>AI 配置</button>
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
        <div className="toolbar-group grow">
          <div className="toolbar-title">搜索</div>
          <input className="field" placeholder="搜索住户、房号、状态、会话内容..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
        </div>
      </section>

      <div className="assistant-center-layout">
        <section className="card assistant-center-list">
          <div className="assistant-list-head">
            <div>会话列表</div>
            <div className="hint">{filteredSessions.length} 条</div>
          </div>
          <div className="assistant-list">
            {filteredSessions.map((item) => (
              <div key={item.id} className="assistant-list-item">
                <div className="assistant-list-main" onClick={() => openSession(item)} role="button" tabIndex={0}>
                  <div className="assistant-list-title">{item.userName || '匿名会话'}</div>
                  <div className="assistant-list-sub">
                    {item.community || communityName(activeCommunity)} · {item.houseNo || item.room || '未绑定房屋'} · {item.scene || 'general'}
                  </div>
                  <div className="assistant-list-meta">
                    <span className={`status-pill ${item.status === 'handoff' ? 'warn' : 'success'}`}>{item.status || '-'}</span>
                    <span className="status-pill">消息 {item.messageCount || 0}</span>
                    <span className="status-pill">{formatTime(item.lastMessageAt || item.updateTime || item.createTime)}</span>
                  </div>
                </div>
                <div className="assistant-list-actions">
                  <button type="button" className="btn btn-ghost tiny" onClick={() => openSession(item)}>查看</button>
                </div>
              </div>
            ))}
            {!filteredSessions.length ? <div className="empty-state compact">当前项目没有会话日志</div> : null}
          </div>
        </section>

        <aside className="card assistant-center-drawer">
          <div className="section-header">
            <div>
              <div className="section-title">会话详情</div>
              <div className="hint">点击左侧会话即可展开完整消息。</div>
            </div>
          </div>
          {selected ? (
            <div className="assistant-drawer-content assistant-session-detail">
              <div className="drawer-title">{selected.userName || '匿名会话'}</div>
              <div className="drawer-line">项目：{selected.community || '-'}</div>
              <div className="drawer-line">房屋：{selected.houseNo || selected.room || '-'}</div>
              <div className="drawer-line">状态：{selected.status || '-'}</div>
              <div className="drawer-line">会话链接：{selected.openclawUrl || '-'}</div>
              <div className="section-header">
                <div>
                  <div className="section-title">智能引擎原始 JSON</div>
                  <div className="hint">优先展示智能引擎返回的原始结构，方便排查和调提示词。</div>
                </div>
                <div className="assistant-center-actions">
                  <button
                    type="button"
                    className="btn btn-ghost tiny"
                    onClick={() => selectedRawJsonDisplayText && navigator.clipboard?.writeText(selectedRawJsonDisplayText)}
                  >
                    复制
                  </button>
                  <button
                    type="button"
                    className={`btn btn-ghost tiny ${rawViewMode === 'formatted' ? 'active' : ''}`}
                    onClick={() => setRawViewMode('formatted')}
                  >
                    格式化
                  </button>
                  <button
                    type="button"
                    className={`btn btn-ghost tiny ${rawViewMode === 'raw' ? 'active' : ''}`}
                    onClick={() => setRawViewMode('raw')}
                  >
                    原始
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost tiny"
                    onClick={() => setRawCollapsed((prev) => !prev)}
                  >
                    {rawCollapsed ? '展开' : '折叠'}
                  </button>
                </div>
              </div>
              {!rawCollapsed ? <pre className="json-preview small">{selectedRawJsonDisplayText || '暂无原始 JSON'}</pre> : <div className="drawer-line">已折叠原始 JSON 面板</div>}
              <div className="assistant-message-log">
                {(selected.messages || []).map((message) => (
                  <div key={message.id || `${message.role}-${message.createTime}`} className={`assistant-log-item ${message.role || 'system'}`}>
                    <div className="assistant-log-meta">
                      <span>{message.role || 'system'}</span>
                      <span>{message.createTime || ''}</span>
                    </div>
                    <div className="assistant-log-text">{message.content || message.text || ''}</div>
                  </div>
                ))}
              </div>
              <div className="footer-actions">
                <button type="button" className="btn btn-ghost" onClick={() => navigator.clipboard?.writeText(selected.openclawUrl || '')}>复制会话链接</button>
              </div>
            </div>
          ) : (
            <div className="empty-state compact">请选择一条会话查看详情</div>
          )}
        </aside>
      </div>
    </div>
  );
}
