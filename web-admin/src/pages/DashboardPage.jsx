import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  deleteBill,
  deleteNotice,
  deleteRepair,
  listBills,
  listNotices,
  listRepairs,
  saveBill,
  saveNotice,
  saveRepair
} from '../lib/api';
import { useAuth } from '../context/AuthContext';

const TABS = {
  notice: { label: '公告', title: '公告管理', subtitle: '搜索、筛选、排序、分页和编辑都在这里完成。' },
  bill: { label: '账单', title: '账单管理', subtitle: '账单查询、筛选、排序、编辑和批量状态变更都在这里。' },
  repair: { label: '报修', title: '报修管理', subtitle: '报修记录、审批流转、详情编辑和批量处理都能直接完成。' }
};

function clone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function defaultDraftFor(type) {
  if (type === 'bill') {
    return { id: '', type: 'property', title: '', amount: '', period: '', dueDate: '', status: 'unpaid', paidDate: '', room: '', openid: '' };
  }
  if (type === 'repair') {
    return { id: '', title: '', category: 'other', categoryName: '', description: '', status: 'pending', statusName: '待处理', handler: '', handlerPhone: '', phone: '', openid: '' };
  }
  return { id: '', title: '', content: '', time: new Date().toISOString().slice(0, 10), important: true };
}

function stripUiFields(item) {
  const copy = clone(item);
  delete copy.selected;
  return copy;
}

function filterOptions(tab) {
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
  return [
    { value: 'all', label: '全部' },
    { value: 'important', label: '重要' },
    { value: 'normal', label: '普通' }
  ];
}

function sortOptions(tab) {
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
  return [
    { field: 'time', label: '时间' },
    { field: 'title', label: '标题' },
    { field: 'important', label: '重要性' }
  ];
}

function batchOptions(tab) {
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
  return [
    ['important', '设为重要'],
    ['normal', '设为普通'],
    ['delete', '批量删除']
  ];
}

function statusClass(status) {
  if (status === 'paid' || status === 'completed' || status === 'important') {
    return 'success';
  }
  if (status === 'processing' || status === 'unpaid') {
    return 'warn';
  }
  if (status === 'pending') {
    return 'danger';
  }
  return '';
}

function rowsFor(type, item) {
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
      ['描述', item.description],
      ['处理人', item.handler],
      ['电话', item.handlerPhone || item.phone],
      ['预约时间', item.appointmentTime],
      ['创建时间', item.createTime],
      ['完成时间', item.completionTime]
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
    return (
      <label className="form-field">
        <span className="field-label">{field === 'content' ? '内容' : field === 'description' ? '描述' : '备注'}</span>
        <textarea className="field textarea" value={value} onChange={onChange(field)} />
      </label>
    );
  }
  if (type === 'switch') {
    return (
      <label className="form-field">
        <span className="field-label">重要公告</span>
        <button type="button" className={`chip ${value ? 'active' : ''}`} onClick={() => onToggle(field)}>
          {value ? '是' : '否'}
        </button>
      </label>
    );
  }
  return (
    <label className="form-field">
      <span className="field-label">{field}</span>
      <input className="field" type={type === 'number' ? 'number' : 'text'} value={value} onChange={onChange(field)} />
    </label>
  );
}

function FormFields({ type, item, onChange, onToggle }) {
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
        {renderField(item, 'title', 'text', onChange, onToggle)}
        {renderField(item, 'category', 'text', onChange, onToggle)}
        {renderField(item, 'categoryName', 'text', onChange, onToggle)}
        {renderField(item, 'status', 'text', onChange, onToggle)}
        {renderField(item, 'statusName', 'text', onChange, onToggle)}
        {renderField(item, 'handler', 'text', onChange, onToggle)}
        {renderField(item, 'handlerPhone', 'text', onChange, onToggle)}
        {renderField(item, 'description', 'textarea', onChange, onToggle)}
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
  const { apiBase, token, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('notice');
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({ notice: 'all', bill: 'all', repair: 'all' });
  const [sortField, setSortField] = useState('time');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(8);
  const [notices, setNotices] = useState([]);
  const [bills, setBills] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('等待连接');
  const [drawer, setDrawer] = useState(null);
  const [drawerMode, setDrawerMode] = useState('view');
  const [drawerDraft, setDrawerDraft] = useState(null);
  const [modal, setModal] = useState(null);
  const [modalDraft, setModalDraft] = useState(null);

  const currentList = activeTab === 'bill' ? bills : activeTab === 'repair' ? repairs : notices;
  const currentRows = useMemo(() => currentList, [currentList]);
  const filteredItems = useMemo(() => {
    const filter = filters[activeTab];
    const query = searchText.trim().toLowerCase();
    const list = currentRows.filter((item) => {
      const passFilter =
        filter === 'all' ||
        (activeTab === 'notice' ? (filter === 'important' ? item.important : !item.important) : item.status === filter);
      const passSearch = !query || Object.values(item).some((value) => String(value == null ? '' : value).toLowerCase().includes(query));
      return passFilter && passSearch;
    });

    list.sort((a, b) => {
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
  }, [currentRows, activeTab, filters, searchText, sortField, sortOrder]);

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
    const loadAll = async () => {
      setLoading(true);
      setStatusText('加载中...');
      try {
        const [noticeList, billList, repairList] = await Promise.all([
          listNotices(apiBase, token),
          listBills(apiBase, token),
          listRepairs(apiBase, token)
        ]);
        setNotices(noticeList || []);
        setBills(billList || []);
        setRepairs(repairList || []);
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

  const setTab = (tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setSearchText('');
    setSelectedIds([]);
    setCurrentPage(1);
    const defaults = tab === 'bill' ? { field: 'dueDate', order: 'asc' } : tab === 'repair' ? { field: 'createTime', order: 'desc' } : { field: 'time', order: 'desc' };
    setSortField(defaults.field);
    setSortOrder(defaults.order);
    setFilters((prev) => ({ ...prev, [tab]: 'all' }));
    setDrawer(null);
    setModal(null);
  };

  const updateSelected = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
  };

  const selectPage = () => {
    const ids = pageItems.map((item) => item.id);
    setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const clearSelection = () => setSelectedIds([]);

  const openDrawer = (item, mode = 'view') => {
    setDrawer({ type: activeTab, item: clone(item) });
    setDrawerMode(mode);
    setDrawerDraft(clone(item));
  };

  const openModal = () => {
    setModal({ type: activeTab });
    setModalDraft(defaultDraftFor(activeTab));
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
    if (type === 'bill' && payload.amount !== '' && payload.amount != null) {
      payload.amount = Number(payload.amount);
    }
    setLoading(true);
    try {
      if (type === 'notice') {
        await saveNotice(apiBase, token, payload);
      } else if (type === 'bill') {
        await saveBill(apiBase, token, payload);
      } else {
        await saveRepair(apiBase, token, payload);
      }
      setStatusText('已保存');
      closeDrawer();
      closeModal();
      const [noticeList, billList, repairList] = await Promise.all([
        listNotices(apiBase, token),
        listBills(apiBase, token),
        listRepairs(apiBase, token)
      ]);
      setNotices(noticeList || []);
      setBills(billList || []);
      setRepairs(repairList || []);
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
      } else {
        await deleteRepair(apiBase, token, id);
      }
      closeDrawer();
      const [noticeList, billList, repairList] = await Promise.all([
        listNotices(apiBase, token),
        listBills(apiBase, token),
        listRepairs(apiBase, token)
      ]);
      setNotices(noticeList || []);
      setBills(billList || []);
      setRepairs(repairList || []);
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

  const batchRun = async (action) => {
    if (!selectedIds.length) {
      window.alert('请先勾选记录');
      return;
    }
    if (!window.confirm('确定执行批量操作吗？')) {
      return;
    }
    const items = currentRows.filter((item) => selectedIds.includes(item.id));
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
            return deleteRepair(apiBase, token, item.id);
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
          const nextStatus = action === 'approve' || action === 'process' ? 'processing' : 'completed';
          return saveRepair(apiBase, token, stripUiFields({ ...item, status: nextStatus, statusName: nextStatus === 'processing' ? '处理中' : '已完成' }));
        })
      );
      setSelectedIds([]);
      const [noticeList, billList, repairList] = await Promise.all([
        listNotices(apiBase, token),
        listBills(apiBase, token),
        listRepairs(apiBase, token)
      ]);
      setNotices(noticeList || []);
      setBills(billList || []);
      setRepairs(repairList || []);
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
      await saveRepair(apiBase, token, stripUiFields({ ...item, status: nextStatus, statusName: nextStatus === 'processing' ? '处理中' : '已完成' }));
      closeDrawer();
      const [noticeList, billList, repairList] = await Promise.all([
        listNotices(apiBase, token),
        listBills(apiBase, token),
        listRepairs(apiBase, token)
      ]);
      setNotices(noticeList || []);
      setBills(billList || []);
      setRepairs(repairList || []);
    } catch (error) {
      window.alert(error.message || '更新失败');
      if (error.status === 401) {
        await logout();
        navigate('/login', { replace: true });
      }
    }
  };

  const onFieldChange = (setDraft) => (field) => (event) => {
    const value = event.target.value;
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const onToggleSwitch = (setDraft) => (field) => {
    setDraft((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const drawerRows = drawer ? rowsFor(drawer.type, drawer.item) : [];

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
          {Object.entries(TABS).map(([key, item]) => (
            <button key={key} type="button" className={`nav-item ${activeTab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
              <span>{item.label}</span>
              <b>{key === 'notice' ? notices.length : key === 'bill' ? bills.length : repairs.length}</b>
            </button>
          ))}
        </div>

        <div className="panel">
          <div className="panel-title">登录信息</div>
          <div className="stat-row"><span>当前状态</span><strong>{statusText}</strong></div>
          <div className="stat-row"><span>API 地址</span><strong>{apiBase}</strong></div>
          <div className="stat-row"><span>登录态</span><strong>{token ? '已登录' : '未登录'}</strong></div>
          <button type="button" className="btn btn-ghost block-btn" onClick={logout}>退出登录</button>
        </div>

        <div className="panel">
          <div className="stat-row"><span>当前结果</span><strong>{filteredItems.length}</strong></div>
          <div className="stat-row"><span>分页</span><strong>{currentPage} / {totalPages}</strong></div>
          <div className="stat-row"><span>已选中</span><strong>{selectedIds.length}</strong></div>
        </div>

        <div className="panel">
          <div className="panel-title">批量操作</div>
          <button type="button" className="btn btn-ghost block-btn" onClick={selectPage}>选中当前页</button>
          <button type="button" className="btn btn-ghost block-btn" onClick={clearSelection}>清空选择</button>
          <div className="batch-stack">
            {batchOptions(activeTab).map(([action, label]) => (
              <button key={action} type="button" className={`btn ${action === 'delete' ? 'danger' : 'btn-primary'} block-btn tiny`} onClick={() => batchRun(action)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar card">
          <div>
            <div className="eyebrow">物业管理控制台</div>
            <h1>{TABS[activeTab].title}</h1>
            <p>{TABS[activeTab].subtitle}</p>
          </div>
          <div className="topbar-actions">
            <input className="search" placeholder="搜索标题、内容、房号、处理人..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
            <button type="button" className="btn btn-primary" onClick={openModal}>新增{TABS[activeTab].label}</button>
          </div>
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
        </section>

        <section className="card table-card">
          <div className="table-head">
            <div className="table-col check"></div>
            <div className="table-col title">标题</div>
            <div className="table-col meta">状态 / 分类</div>
            <div className="table-col meta">时间 / 金额</div>
            <div className="table-col actions">操作</div>
          </div>
          {pageItems.length ? (
            pageItems.map((item) => (
              <div key={item.id} className={`table-row ${item.selected ? 'selected' : ''}`} onClick={() => openDrawer(item, 'view')}>
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
                    <div className="row-title">{item.title || '未命名'}</div>
                    <div className="row-sub">
                      {activeTab === 'repair' ? (item.categoryName || item.category || '') : activeTab === 'bill' ? (item.room || '') : String(item.content || '').slice(0, 40)}
                    </div>
                  </div>
                </div>
                <div className="table-col meta">
                  <span className={`status-pill ${statusClass(activeTab === 'notice' ? (item.important ? 'important' : '') : item.status)}`}>
                    {activeTab === 'notice' ? (item.important ? '重要' : '普通') : item.status || item.statusName || '-'}
                  </span>
                </div>
                <div className="table-col meta">
                  {activeTab === 'bill'
                    ? `${item.dueDate || '-'} / ${item.amount == null ? '-' : item.amount}`
                    : activeTab === 'repair'
                      ? `${item.createTime || '-'} / ${item.handler || '-'}`
                      : `${item.time || '-'} / ${item.important ? '重要' : '普通'}`}
                </div>
                <div className="table-col actions">
                  <div className="mini-actions">
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
                    {activeTab === 'repair' ? (
                      <>
                        <button type="button" className="btn btn-ghost tiny" onClick={(event) => { event.stopPropagation(); quickRepair(item, 'process'); }}>处理中</button>
                        <button type="button" className="btn btn-ghost tiny" onClick={(event) => { event.stopPropagation(); quickRepair(item, 'complete'); }}>完成</button>
                      </>
                    ) : null}
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
                  </div>
                </div>
              </div>
            ))
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
                <h2>{drawer.item.title || '记录详情'}</h2>
                <div className="drawer-sub">{drawer.type === 'notice' ? '公告详情' : drawer.type === 'bill' ? '账单详情' : '报修详情'}</div>
              </div>
              <div className="drawer-actions">
                {drawerMode === 'view' ? (
                  <button type="button" className="btn btn-primary" onClick={() => setDrawerMode('edit')}>编辑</button>
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
                <div className="drawer-footer">
                  <button type="button" className="btn btn-ghost" onClick={() => setDrawerMode('edit')}>编辑模式</button>
                  <button type="button" className="btn danger" onClick={() => removeItem(drawer.type, drawer.item.id)}>删除</button>
                </div>
              </>
            ) : (
              <>
                <FormFields
                  type={drawer.type}
                  item={drawerDraft}
                  onChange={onFieldChange(setDrawerDraft)}
                  onToggle={onToggleSwitch(setDrawerDraft)}
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
                <div className="eyebrow">新增记录</div>
                <h2>新增{TABS[modal.type].label}</h2>
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
            />
          </div>
        </div>
      ) : null}

      {loading ? <div className="loading-cover">处理中...</div> : null}
    </div>
  );
}
