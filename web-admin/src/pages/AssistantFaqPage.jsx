import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { activateCommunity, deleteAssistantFaq, listAssistantFaqs, listCommunities, listStaffs, saveAssistantFaq } from '../lib/api';
import { useAuth } from '../context/AuthContext';

function communityName(community) {
  if (!community) return '未选择项目';
  return community.projectName || community.name || '未命名项目';
}

function splitTags(value) {
  if (!value) return '';
  return Array.isArray(value) ? value.join('、') : String(value);
}

function buildDraft(community) {
  return {
    id: '',
    communityId: community?.id || '',
    community: communityName(community),
    responsibleSupervisor: community?.defaultSupervisor || '',
    question: '',
    answer: '',
    tags: '',
    enabled: true,
    orderNo: 1
  };
}

export default function AssistantFaqPage() {
  const navigate = useNavigate();
  const { apiBase, token, logout } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [staffs, setStaffs] = useState([]);
  const [activeCommunityId, setActiveCommunityId] = useState('');
  const [faqs, setFaqs] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [communityFilter, setCommunityFilter] = useState('current');
  const [supervisorFilter, setSupervisorFilter] = useState('all');
  const [enabledFilter, setEnabledFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [draft, setDraft] = useState(buildDraft(null));
  const [drawer, setDrawer] = useState(null);
  const [loading, setLoading] = useState(false);

  const activeCommunity = useMemo(
    () => communities.find((item) => String(item.id || '') === String(activeCommunityId || '')) || communities.find((item) => Boolean(item.active)) || communities[0] || null,
    [activeCommunityId, communities]
  );

  const currentSupervisorName = useMemo(
    () => String(activeCommunity?.defaultSupervisor || activeCommunity?.supervisorName || '').trim(),
    [activeCommunity]
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

  const responsibleOptions = useMemo(() => {
    const options = [];
    const seen = new Set();
    if (currentSupervisorName) {
      options.push({ value: currentSupervisorName, label: `${currentSupervisorName}（当前负责人）` });
      seen.add(currentSupervisorName);
    }
    currentStaffOptions.forEach((staff) => {
      const value = String(staff.name || '').trim();
      if (!value || seen.has(value)) return;
      seen.add(value);
      options.push({ value, label: staff.name || value });
    });
    return options;
  }, [currentSupervisorName, currentStaffOptions]);

  const loadFaqs = async (communityId) => {
    const list = await listAssistantFaqs(apiBase, token, communityId || '');
    setFaqs(Array.isArray(list) ? list : []);
  };

  const loadFaqsByFilter = async (filterValue, fallbackCommunityId) => {
    const nextFilter = String(filterValue || 'current');
    setCommunityFilter(nextFilter);
    if (nextFilter === 'all') {
      await loadFaqs('');
      return;
    }
    const targetId = nextFilter === 'current' ? (fallbackCommunityId || activeCommunity?.id || '') : nextFilter;
    await loadFaqs(targetId);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [list, staffList] = await Promise.all([
          listCommunities(apiBase, token),
          listStaffs(apiBase, token)
        ]);
        setCommunities(list || []);
        setStaffs(staffList || []);
        const active = (list || []).find((item) => Boolean(item.active)) || (list || [])[0] || null;
        const nextCommunityId = String(active?.id || '');
        setActiveCommunityId(nextCommunityId);
        await loadFaqsByFilter('current', nextCommunityId);
        setDraft(buildDraft(active));
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

  const filteredFaqs = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    const currentTag = String(tagFilter || 'all');
    const targetSupervisor = currentSupervisorName;
    return faqs.filter((item) => {
      const enabled = item.enabled !== false;
      if (enabledFilter === 'enabled' && !enabled) return false;
      if (enabledFilter === 'disabled' && enabled) return false;
      const itemSupervisor = String(item.responsibleSupervisor || item.supervisorName || item.owner || '').trim();
      if (supervisorFilter === 'current' && targetSupervisor && itemSupervisor !== targetSupervisor) {
        return false;
      }
      const itemTags = (Array.isArray(item.tags) ? item.tags : splitTags(item.tags).split('、')).filter(Boolean);
      if (currentTag !== 'all' && !itemTags.includes(currentTag)) {
        return false;
      }
      if (!term) return true;
      const joined = [item.question, item.answer, splitTags(item.tags), item.community].join(' ').toLowerCase();
      return joined.includes(term);
    });
  }, [faqs, searchText, enabledFilter, tagFilter, supervisorFilter, currentSupervisorName]);

  const tagOptions = useMemo(() => {
    const tags = new Set();
    faqs.forEach((item) => {
      (Array.isArray(item.tags) ? item.tags : splitTags(item.tags).split('、')).filter(Boolean).forEach((tag) => tags.add(tag));
    });
    return Array.from(tags);
  }, [faqs]);

  const communityOptions = useMemo(() => {
    const list = [];
    const seen = new Set();
    communities.forEach((community) => {
      const id = String(community.id || '');
      if (!id || seen.has(id)) return;
      seen.add(id);
      list.push({ id, label: communityName(community) });
    });
    return list;
  }, [communities]);

  const openCreate = () => {
    setDraft(buildDraft(activeCommunity));
    setDrawer({ mode: 'edit' });
  };

  const openEdit = (item) => {
    setDraft({
      id: item.id || '',
      communityId: item.communityId || activeCommunity?.id || '',
      community: item.community || communityName(activeCommunity),
      responsibleSupervisor: item.responsibleSupervisor || item.supervisorName || activeCommunity?.defaultSupervisor || '',
      question: item.question || '',
      answer: item.answer || '',
      tags: splitTags(item.tags),
      enabled: item.enabled !== false,
      orderNo: item.orderNo || 1
    });
    setDrawer({ mode: 'edit' });
  };

  const toggleEnabled = async (item) => {
    setLoading(true);
    try {
      await saveAssistantFaq(apiBase, token, {
        ...item,
        enabled: item.enabled === false,
        communityId: item.communityId || activeCommunity?.id || '',
        community: item.community || communityName(activeCommunity),
        responsibleSupervisor: item.responsibleSupervisor || item.supervisorName || activeCommunity?.defaultSupervisor || ''
      });
      await loadFaqs(activeCommunity?.id || '');
      if (drawer?.item?.id === item.id) {
        setDrawer({ mode: 'detail', item: { ...item, enabled: item.enabled === false } });
      }
    } catch (error) {
      window.alert(error.message || '切换启用状态失败');
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    setLoading(true);
    try {
      const payload = {
        ...draft,
        communityId: activeCommunity?.id || draft.communityId || '',
        community: communityName(activeCommunity),
        tags: draft.tags,
        responsibleSupervisor: draft.responsibleSupervisor || currentSupervisorName || activeCommunity?.defaultSupervisor || ''
      };
      await saveAssistantFaq(apiBase, token, payload);
      await loadFaqs(payload.communityId);
      setDrawer(null);
    } catch (error) {
      window.alert(error.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`确定删除常见问题「${item.question || '未命名'}」吗？`)) {
      return;
    }
    setLoading(true);
    try {
      await deleteAssistantFaq(apiBase, token, item.id);
      await loadFaqs(activeCommunity?.id || '');
      if (drawer?.item?.id === item.id) {
        setDrawer(null);
      }
    } catch (error) {
      window.alert(error.message || '删除失败');
    } finally {
      setLoading(false);
    }
  };

  const switchCommunity = async (id) => {
    setActiveCommunityId(id);
    try {
      await activateCommunity(apiBase, token, id);
      if (communityFilter === 'current') {
        await loadFaqsByFilter('current', id);
      }
      const community = communities.find((item) => String(item.id || '') === String(id));
      setDraft(buildDraft(community));
    } catch (error) {
      window.alert(error.message || '切换项目失败');
    }
  };

  const switchFaqScope = async (value) => {
    try {
      await loadFaqsByFilter(value, activeCommunityId);
    } catch (error) {
      window.alert(error.message || '切换项目筛选失败');
    }
  };

  return (
    <div className="assistant-center-page">
      <header className="assistant-center-hero card">
        <div>
          <div className="eyebrow">智能中台</div>
          <h1>常见问题管理</h1>
          <p>维护常见问题，智能助手会优先拿这些答案做回复。</p>
        </div>
        <div className="assistant-center-actions">
          <button type="button" className="btn btn-primary" onClick={openCreate}>新增问题</button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/assistant-prompt')}>提示词</button>
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
        <div className="toolbar-group grow">
          <div className="toolbar-title">搜索</div>
          <input className="field" placeholder="搜索问题、答案、标签..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
        </div>
        <div className="assistant-toolbar-stack">
          <div className="assistant-toolbar-row wrap">
            <div className="toolbar-title">项目范围</div>
            <div className="chip-row compact">
              <button type="button" className={`chip ${communityFilter === 'current' ? 'active' : ''}`} onClick={() => switchFaqScope('current')}>当前项目</button>
              <button type="button" className={`chip ${communityFilter === 'all' ? 'active' : ''}`} onClick={() => switchFaqScope('all')}>全部项目</button>
              {communityOptions.slice(0, 8).map((community) => (
                <button
                  key={community.id}
                  type="button"
                  className={`chip ${communityFilter === community.id ? 'active' : ''}`}
                  onClick={() => switchFaqScope(community.id)}
                >
                  {community.label}
                </button>
              ))}
            </div>
          </div>
          <div className="assistant-toolbar-row">
            <div className="toolbar-title">状态</div>
            <div className="chip-row compact">
              {[
                { key: 'all', label: '全部' },
                { key: 'enabled', label: '启用' },
                { key: 'disabled', label: '停用' }
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`chip ${enabledFilter === item.key ? 'active' : ''}`}
                  onClick={() => setEnabledFilter(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="assistant-toolbar-row">
            <div className="toolbar-title">负责人</div>
            <div className="chip-row compact">
              <button type="button" className={`chip ${supervisorFilter === 'all' ? 'active' : ''}`} onClick={() => setSupervisorFilter('all')}>全部</button>
              <button type="button" className={`chip ${supervisorFilter === 'current' ? 'active' : ''}`} onClick={() => setSupervisorFilter('current')}>只看当前负责人</button>
              {currentSupervisorName ? <span className="hint">当前负责人：{currentSupervisorName}</span> : <span className="hint">当前项目未配置负责人</span>}
            </div>
          </div>
          <div className="assistant-toolbar-row wrap">
            <div className="toolbar-title">标签</div>
            <div className="chip-row compact">
              <button type="button" className={`chip ${tagFilter === 'all' ? 'active' : ''}`} onClick={() => setTagFilter('all')}>全部标签</button>
              {tagOptions.slice(0, 12).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`chip ${tagFilter === tag ? 'active' : ''}`}
                  onClick={() => setTagFilter(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="assistant-center-layout">
        <section className="card assistant-center-list">
          <div className="assistant-list-head">
            <div>常见问题列表</div>
            <div className="hint">{filteredFaqs.length} 条</div>
          </div>
          <div className="assistant-list">
            {filteredFaqs.map((item) => (
              <div key={item.id} className="assistant-list-item">
                <div className="assistant-list-main" onClick={() => setDrawer({ mode: 'detail', item })} role="button" tabIndex={0}>
                  <div className="assistant-list-title">{item.question || '未命名问题'}</div>
                  <div className="assistant-list-sub">{item.answer || '暂无答案'}</div>
                  <div className="assistant-list-meta">
                    <span className={`status-pill ${item.enabled === false ? 'danger' : 'success'}`}>{item.enabled === false ? '停用' : '启用'}</span>
                    <span className="status-pill">{item.community || communityName(activeCommunity)}</span>
                    <span className="status-pill">{item.responsibleSupervisor || item.supervisorName || currentSupervisorName || '未设置负责人'}</span>
                    <span className="status-pill">顺序 {item.orderNo || 0}</span>
                  </div>
                  <div className="chip-row compact">
                    {(Array.isArray(item.tags) ? item.tags : splitTags(item.tags).split('、')).filter(Boolean).map((tag) => (
                      <span key={tag} className="chip active tiny">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="assistant-list-actions">
                  <button type="button" className="btn btn-ghost tiny" onClick={() => openEdit(item)}>编辑</button>
                  <button type="button" className="btn btn-ghost tiny" onClick={() => toggleEnabled(item)}>{item.enabled === false ? '启用' : '停用'}</button>
                  <button type="button" className="btn btn-ghost tiny danger" onClick={() => remove(item)}>删除</button>
                </div>
              </div>
            ))}
            {!filteredFaqs.length ? <div className="empty-state compact">当前项目暂无常见问题</div> : null}
          </div>
        </section>

        <aside className="card assistant-center-drawer">
          <div className="section-header">
            <div>
              <div className="section-title">{drawer?.mode === 'detail' ? '常见问题详情' : '编辑常见问题'}</div>
              <div className="hint">{drawer?.mode === 'detail' ? '点编辑可修改内容' : '修改后保存到后端'}</div>
            </div>
          </div>
          {drawer?.mode === 'detail' ? (
            <div className="assistant-drawer-content">
              <div className="drawer-title">{drawer.item?.question || '未命名问题'}</div>
              <div className="drawer-line">答案：{drawer.item?.answer || '-'}</div>
              <div className="drawer-line">标签：{splitTags(drawer.item?.tags) || '-'}</div>
              <div className="drawer-line">项目：{drawer.item?.community || '-'}</div>
              <div className="drawer-line">负责人：{drawer.item?.responsibleSupervisor || drawer.item?.supervisorName || currentSupervisorName || '-'}</div>
              <div className="drawer-line">顺序：{drawer.item?.orderNo || 0}</div>
              <div className="drawer-line">状态：{drawer.item?.enabled === false ? '停用' : '启用'}</div>
              <div className="footer-actions">
                <button type="button" className="btn btn-primary" onClick={() => openEdit(drawer.item)}>编辑</button>
                <button type="button" className="btn btn-ghost" onClick={() => toggleEnabled(drawer.item)}>{drawer.item?.enabled === false ? '启用' : '停用'}</button>
              </div>
            </div>
          ) : (
            <div className="assistant-form">
              <label className="field-group">
                <span className="field-label">问题</span>
                <input className="field" value={draft.question} onChange={(e) => setDraft((prev) => ({ ...prev, question: e.target.value }))} />
              </label>
              <label className="field-group">
                <span className="field-label">答案</span>
                <textarea className="field textarea" rows={8} value={draft.answer} onChange={(e) => setDraft((prev) => ({ ...prev, answer: e.target.value }))} />
              </label>
              <label className="field-group">
                <span className="field-label">标签</span>
                <input className="field" value={draft.tags} onChange={(e) => setDraft((prev) => ({ ...prev, tags: e.target.value }))} />
              </label>
              <label className="field-group">
                <span className="field-label">负责人</span>
                <select className="field" value={draft.responsibleSupervisor || ''} onChange={(e) => setDraft((prev) => ({ ...prev, responsibleSupervisor: e.target.value }))}>
                  <option value="">请选择负责人</option>
                  {responsibleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-group">
                <span className="field-label">顺序</span>
                <input className="field" type="number" value={draft.orderNo} onChange={(e) => setDraft((prev) => ({ ...prev, orderNo: Number(e.target.value || 0) }))} />
              </label>
              <label className="toggle-item">
                <span>启用</span>
                <button type="button" className={`chip ${draft.enabled ? 'active' : ''}`} onClick={() => setDraft((prev) => ({ ...prev, enabled: !prev.enabled }))}>
                  {draft.enabled ? '是' : '否'}
                </button>
              </label>
              <div className="footer-actions">
                <button type="button" className="btn btn-primary" onClick={save} disabled={loading}>保存问题</button>
                <button type="button" className="btn btn-ghost" onClick={() => setDrawer(null)}>取消</button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
