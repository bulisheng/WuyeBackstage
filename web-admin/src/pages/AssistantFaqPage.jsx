import React, { useEffect, useMemo, useRef, useState } from 'react';
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

function splitMultiValue(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }
  return String(value)
    .split(/[、,\n;|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function escapeCsvCell(value) {
  const text = value == null ? '' : String(value);
  if (!/[",\r\n]/.test(text)) {
    return text;
  }
  return `"${text.replace(/"/g, '""')}"`;
}

function serializeCsv(rows, headers) {
  const lines = [];
  lines.push(headers.map((item) => escapeCsvCell(item.label)).join(','));
  rows.forEach((row) => {
    const cells = headers.map((header) => escapeCsvCell(row[header.key] ?? ''));
    lines.push(cells.join(','));
  });
  return lines.join('\r\n');
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (char === '"') {
        if (next === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ',') {
      row.push(cell);
      cell = '';
      continue;
    }
    if (char === '\r') {
      continue;
    }
    if (char === '\n') {
      row.push(cell);
      if (row.some((value) => String(value).trim() !== '')) {
        rows.push(row);
      }
      row = [];
      cell = '';
      continue;
    }
    cell += char;
  }

  row.push(cell);
  if (row.some((value) => String(value).trim() !== '')) {
    rows.push(row);
  }

  if (!rows.length) {
    return [];
  }
  const meaningfulRows = rows.filter((item) => {
    const firstCell = String(item[0] || '').replace(/^\uFEFF/, '').trim();
    return !firstCell.startsWith('#');
  });
  if (!meaningfulRows.length) {
    return [];
  }
  const [headers, ...dataRows] = meaningfulRows;
  return dataRows.map((values) => {
    if (String(values[0] || '').replace(/^\uFEFF/, '').trim().startsWith('#')) {
      return null;
    }
    const item = {};
    headers.forEach((header, index) => {
      item[String(header || '').replace(/^\uFEFF/, '').trim()] = values[index] ?? '';
    });
    return item;
  }).filter(Boolean);
}

function normalizeHeaderName(name) {
  return String(name || '').trim().toLowerCase();
}

function generateSynonymTemplate(question, keywords) {
  const cleanQuestion = String(question || '').trim().replace(/[?？。！!，,；;：:\s]+$/g, '');
  const keywordList = splitMultiValue(keywords);
  const focus = cleanQuestion.replace(/^(请问|麻烦问一下|想问一下|问一下|请教一下|如何|怎么|怎样|请问一下)/, '').trim() || cleanQuestion;
  const templates = [
    focus ? `怎么${focus}` : '',
    focus ? `如何${focus}` : '',
    focus ? `${focus}怎么弄` : '',
    focus ? `${focus}怎么办` : '',
    focus ? `${focus}怎么查` : '',
    focus ? `${focus}在哪里看` : '',
    focus ? `${focus}怎么处理` : '',
    ...keywordList.slice(0, 4).flatMap((keyword) => [
      `${keyword}怎么查`,
      `${keyword}怎么办`,
      `${keyword}在哪里看`
    ])
  ];
  return Array.from(new Set(templates.filter(Boolean))).join('、');
}

function parseBooleanLike(value, defaultValue = false) {
  if (value == null || String(value).trim() === '') {
    return defaultValue;
  }
  const text = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'y', '是', 'on'].includes(text)) {
    return true;
  }
  if (['false', '0', 'no', 'n', '否', 'off'].includes(text)) {
    return false;
  }
  return defaultValue;
}

const FAQ_CSV_HEADERS = [
  { key: 'id', label: 'id' },
  { key: 'communityId', label: 'communityId' },
  { key: 'community', label: 'community' },
  { key: 'responsibleSupervisor', label: 'responsibleSupervisor' },
  { key: 'question', label: 'question' },
  { key: 'answer', label: 'answer' },
  { key: 'tags', label: 'tags' },
  { key: 'synonyms', label: 'synonyms' },
  { key: 'keywords', label: 'keywords' },
  { key: 'pinned', label: 'pinned' },
  { key: 'enabled', label: 'enabled' },
  { key: 'orderNo', label: 'orderNo' }
];

const FAQ_CSV_NOTES = [
  '# 说明：支持 CSV 或 JSON 导入；CSV 里同义问法、标签、关键词建议用中文逗号“、”分隔。',
  '# 说明：pinned/enabled 可填 TRUE/FALSE、1/0、是/否；orderNo 越小越靠前。'
];

const FAQ_CSV_FIELD_NOTES = [
  '# 字段解释：question=用户常见问题；answer=标准答案；tags=分类标签；synonyms=同义问法；keywords=检索关键词。',
  '# 字段解释：pinned=置顶优先；enabled=是否启用；orderNo=展示顺序；communityId/community=项目归属。'
];

const FAQ_TEMPLATE_SCENES = {
  bill: {
    label: '账单模板',
    fileName: 'assistant-faq-template-bill',
    description: '适合物业费、缴费、发票、账单类问题。',
    rows: [
      {
        question: '如何查看本月物业费？',
        answer: '进入首页即可查看待缴账单，也可以在 AI 客服里直接说“查物业费”。',
        tags: '账单、物业费',
        synonyms: generateSynonymTemplate('如何查看本月物业费？', '物业费、账单'),
        keywords: '物业费、账单、缴费',
        pinned: 'TRUE'
      },
      {
        question: '物业费怎么缴纳？',
        answer: '在账单详情里选择缴费方式完成支付即可。',
        tags: '账单、缴费',
        synonyms: generateSynonymTemplate('物业费怎么缴纳？', '物业费、缴费'),
        keywords: '物业费、缴费、账单',
        pinned: 'TRUE'
      },
      {
        question: '怎么开物业费发票？',
        answer: '发票申请可联系物业财务或查看收费记录是否支持开票。',
        tags: '发票、财务',
        synonyms: generateSynonymTemplate('怎么开物业费发票？', '发票、财务'),
        keywords: '发票、开票、财务',
        pinned: 'FALSE'
      },
      {
        question: '可以代缴物业费吗？',
        answer: '代缴和补缴费用可联系物业前台确认，部分项目支持线上处理。',
        tags: '账单、缴费',
        synonyms: generateSynonymTemplate('可以代缴物业费吗？', '代缴、缴费'),
        keywords: '代缴、补缴、缴费',
        pinned: 'FALSE'
      }
    ]
  },
  repair: {
    label: '报修模板',
    fileName: 'assistant-faq-template-repair',
    description: '适合维修、上门、故障、维修材料类问题。',
    rows: [
      {
        question: '怎么提交报修？',
        answer: '在报修页面填写类型、描述、联系人和时间后提交即可，AI 客服也可以帮你生成报修草稿。',
        tags: '报修、维修',
        synonyms: generateSynonymTemplate('怎么提交报修？', '报修、维修'),
        keywords: '报修、维修、维修申请',
        pinned: 'TRUE'
      },
      {
        question: '维修什么时候上门？',
        answer: '维修上门时间会根据排期安排，提交报修时可以备注可上门时段。',
        tags: '报修、上门',
        synonyms: generateSynonymTemplate('维修什么时候上门？', '维修、上门'),
        keywords: '维修、上门、排期',
        pinned: 'TRUE'
      },
      {
        question: '报修要自己买材料吗？',
        answer: '维修材料是否需要业主自备，通常会在报修后由维修人员确认。',
        tags: '报修、材料',
        synonyms: generateSynonymTemplate('报修要自己买材料吗？', '材料、维修'),
        keywords: '材料、维修、自备',
        pinned: 'FALSE'
      },
      {
        question: '电梯坏了怎么办？',
        answer: '电梯故障请先确保安全，再联系物业前台报修。',
        tags: '电梯、报修',
        synonyms: generateSynonymTemplate('电梯坏了怎么办？', '电梯、报修'),
        keywords: '电梯、故障、报修',
        pinned: 'FALSE'
      }
    ]
  },
  complaint: {
    label: '投诉模板',
    fileName: 'assistant-faq-template-complaint',
    description: '适合投诉、反馈、噪音、邻里扰民等问题。',
    rows: [
      {
        question: '投诉后多久能看到处理？',
        answer: '投诉会先进入后台投诉队列，管理员会先分析并推送到飞书，后续可在后台查看进度。',
        tags: '投诉、飞书',
        synonyms: generateSynonymTemplate('投诉后多久能看到处理？', '投诉、飞书'),
        keywords: '投诉、处理进度、飞书',
        pinned: 'FALSE'
      },
      {
        question: '楼上太吵怎么办？',
        answer: '先沟通，无法解决可提交投诉。',
        tags: '噪音、投诉',
        synonyms: generateSynonymTemplate('楼上太吵怎么办？', '噪音、投诉'),
        keywords: '噪音、扰民、投诉',
        pinned: 'FALSE'
      },
      {
        question: '公共区域问题怎么反馈？',
        answer: '公共设施巡检和维护会按计划执行，如有问题可直接反馈。',
        tags: '反馈、公共设施',
        synonyms: generateSynonymTemplate('公共区域问题怎么反馈？', '反馈、公共设施'),
        keywords: '反馈、设施、建议',
        pinned: 'FALSE'
      },
      {
        question: '物业收费有问题怎么投诉？',
        answer: '可先核对账单，再提交投诉或联系物业财务确认。',
        tags: '投诉、账单',
        synonyms: generateSynonymTemplate('物业收费有问题怎么投诉？', '投诉、账单'),
        keywords: '投诉、账单、收费',
        pinned: 'FALSE'
      }
    ]
  },
  access: {
    label: '门禁模板',
    fileName: 'assistant-faq-template-access',
    description: '适合门禁、访客、出入、门铃、对讲等问题。',
    rows: [
      {
        question: '门禁卡丢了怎么办？',
        answer: '门禁卡问题可以先联系前台处理，部分项目支持在物业前台补办或重置。',
        tags: '门禁、门禁卡',
        synonyms: generateSynonymTemplate('门禁卡丢了怎么办？', '门禁卡、补办'),
        keywords: '门禁、门禁卡、补办',
        pinned: 'TRUE'
      },
      {
        question: '访客怎么登记？',
        answer: '访客可通过访客登记功能提交，生成后会有对应通行信息。',
        tags: '访客、登记',
        synonyms: generateSynonymTemplate('访客怎么登记？', '访客、登记'),
        keywords: '访客、登记、来访',
        pinned: 'FALSE'
      },
      {
        question: '门铃坏了怎么办？',
        answer: '门铃和对讲机故障可直接报修，建议注明楼栋单元和故障表现。',
        tags: '门铃、对讲',
        synonyms: generateSynonymTemplate('门铃坏了怎么办？', '门铃、对讲'),
        keywords: '门铃、对讲机、报修',
        pinned: 'FALSE'
      },
      {
        question: '外来人员怎么进小区？',
        answer: '外来人员请先做访客登记，按项目规则通行。',
        tags: '访客、门禁',
        synonyms: generateSynonymTemplate('外来人员怎么进小区？', '访客、门禁'),
        keywords: '访客、门禁、来访',
        pinned: 'FALSE'
      }
    ]
  },
  parking: {
    label: '停车模板',
    fileName: 'assistant-faq-template-parking',
    description: '适合停车费、车位、车牌、充电桩、车位锁问题。',
    rows: [
      {
        question: '停车费怎么查？',
        answer: '停车费可在停车管理或物业收费页面查看，部分项目支持在线缴费。',
        tags: '停车、车位',
        synonyms: generateSynonymTemplate('停车费怎么查？', '停车费、车位'),
        keywords: '停车费、车位费、停车',
        pinned: 'TRUE'
      },
      {
        question: '车牌怎么录入？',
        answer: '车牌录入和绑定车位通常由物业前台或停车管理处理。',
        tags: '车牌、停车',
        synonyms: generateSynonymTemplate('车牌怎么录入？', '车牌、停车'),
        keywords: '车牌、绑定、停车',
        pinned: 'FALSE'
      },
      {
        question: '小区能装充电桩吗？',
        answer: '充电桩安装和使用请先确认小区是否开放该服务，再联系物业登记。',
        tags: '充电桩、新能源',
        synonyms: generateSynonymTemplate('小区能装充电桩吗？', '充电桩、新能源'),
        keywords: '充电桩、新能源、电车',
        pinned: 'FALSE'
      },
      {
        question: '车位锁坏了怎么办？',
        answer: '车位锁故障或损坏可联系物业前台处理，部分项目支持维修更换。',
        tags: '车位锁、停车',
        synonyms: generateSynonymTemplate('车位锁坏了怎么办？', '车位锁、停车'),
        keywords: '车位锁、停车、报修',
        pinned: 'FALSE'
      }
    ]
  }
};

const FAQ_TEMPLATE_SCENE_ORDER = ['bill', 'repair', 'complaint', 'access', 'parking'];

function buildTemplateExportRows(sceneKey, community, supervisor) {
  const keys = sceneKey && sceneKey !== 'all' ? [sceneKey] : FAQ_TEMPLATE_SCENE_ORDER;
  const rows = [];
  keys.forEach((key) => {
    const scene = FAQ_TEMPLATE_SCENES[key];
    if (!scene) {
      return;
    }
    scene.rows.forEach((item, index) => {
      rows.push({
        id: '',
        communityId: community?.id || '',
        community: communityName(community),
        responsibleSupervisor: supervisor || community?.defaultSupervisor || '',
        question: item.question,
        answer: item.answer,
        tags: item.tags,
        synonyms: item.synonyms,
        keywords: item.keywords,
        pinned: item.pinned,
        enabled: 'TRUE',
        orderNo: index + 1
      });
    });
  });
  return rows;
}

const FAQ_HEADER_ALIASES = {
  id: 'id',
  编号: 'id',
  communityid: 'communityId',
  小区id: 'communityId',
  community: 'community',
  小区: 'community',
  responsablesupervisor: 'responsibleSupervisor',
  负责人: 'responsibleSupervisor',
  question: 'question',
  问题: 'question',
  answer: 'answer',
  答案: 'answer',
  tags: 'tags',
  标签: 'tags',
  synonyms: 'synonyms',
  同义问法: 'synonyms',
  keywords: 'keywords',
  关键词: 'keywords',
  pinned: 'pinned',
  置顶: 'pinned',
  enabled: 'enabled',
  启用: 'enabled',
  orderno: 'orderNo',
  顺序: 'orderNo'
};

function buildDraft(community) {
  return {
    id: '',
    communityId: community?.id || '',
    community: communityName(community),
    responsibleSupervisor: community?.defaultSupervisor || '',
    question: '',
    answer: '',
    tags: '',
    synonyms: '',
    keywords: '',
    pinned: false,
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
  const [onlyFillEmptySynonyms, setOnlyFillEmptySynonyms] = useState(true);
  const [importPreview, setImportPreview] = useState(null);
  const fileInputRef = useRef(null);

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

  const refreshFaqs = async () => {
    if (communityFilter === 'all') {
      await loadFaqs('');
      return;
    }
    const targetId = communityFilter === 'current' ? (activeCommunityId || activeCommunity?.id || '') : communityFilter;
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
      const joined = [item.question, item.answer, splitTags(item.tags), splitTags(item.synonyms), splitTags(item.keywords), item.community].join(' ').toLowerCase();
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
      synonyms: splitTags(item.synonyms),
      keywords: splitTags(item.keywords),
      pinned: item.pinned === true,
      enabled: item.enabled !== false,
      orderNo: item.orderNo || 1
    });
    setDrawer({ mode: 'edit' });
  };

  const setSynonymTemplate = () => {
    setDraft((prev) => {
      const template = generateSynonymTemplate(prev.question, prev.keywords);
      const current = splitMultiValue(prev.synonyms);
      const merged = Array.from(new Set([...current, ...splitMultiValue(template)])).join('、');
      return { ...prev, synonyms: merged };
    });
  };

  const batchGenerateSynonyms = async () => {
    const targets = filteredFaqs.filter((item) => String(item.question || '').trim());
    if (!targets.length) {
      window.alert('当前筛选范围里没有可生成同义问法的技能库条目');
      return;
    }
    if (!window.confirm(`将为当前筛选的 ${targets.length} 条技能库记录自动补全同义问法，是否继续？`)) {
      return;
    }
    setLoading(true);
    try {
      let updated = 0;
      let skipped = 0;
      for (const item of targets) {
        if (onlyFillEmptySynonyms && splitMultiValue(item.synonyms).length > 0) {
          skipped += 1;
          continue;
        }
        const template = generateSynonymTemplate(item.question, item.keywords);
        const merged = Array.from(new Set([
          ...splitMultiValue(item.synonyms),
          ...splitMultiValue(template)
        ])).join('、');
        if (!merged) {
          continue;
        }
        await saveAssistantFaq(apiBase, token, {
          ...item,
          synonyms: merged,
          communityId: item.communityId || activeCommunity?.id || '',
          community: item.community || communityName(activeCommunity),
          responsibleSupervisor: item.responsibleSupervisor || item.supervisorName || activeCommunity?.defaultSupervisor || ''
        });
        updated += 1;
      }
      await refreshFaqs();
      window.alert(`已为 ${updated} 条技能库记录补全同义问法${onlyFillEmptySynonyms ? `，跳过 ${skipped} 条已有同义问法的记录` : ''}`);
    } catch (error) {
      window.alert(error.message || '批量生成同义问法失败');
    } finally {
      setLoading(false);
    }
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
      await refreshFaqs();
      if (drawer?.item?.id === item.id) {
        setDrawer({ mode: 'detail', item: { ...item, enabled: item.enabled === false } });
      }
    } catch (error) {
      window.alert(error.message || '切换启用状态失败');
    } finally {
      setLoading(false);
    }
  };

  const togglePinned = async (item) => {
    setLoading(true);
    try {
      await saveAssistantFaq(apiBase, token, {
        ...item,
        pinned: !item.pinned,
        communityId: item.communityId || activeCommunity?.id || '',
        community: item.community || communityName(activeCommunity),
        responsibleSupervisor: item.responsibleSupervisor || item.supervisorName || activeCommunity?.defaultSupervisor || ''
      });
      await refreshFaqs();
      if (drawer?.item?.id === item.id) {
        setDrawer({ mode: 'detail', item: { ...item, pinned: !item.pinned } });
      }
    } catch (error) {
      window.alert(error.message || '切换置顶状态失败');
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
        synonyms: draft.synonyms,
        keywords: draft.keywords,
        pinned: Boolean(draft.pinned),
        responsibleSupervisor: draft.responsibleSupervisor || currentSupervisorName || activeCommunity?.defaultSupervisor || ''
      };
      await saveAssistantFaq(apiBase, token, payload);
      await refreshFaqs();
      setDrawer(null);
    } catch (error) {
      window.alert(error.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  const exportFaqs = () => {
    const rows = filteredFaqs.map((item) => ({
      id: item.id || '',
      communityId: item.communityId || '',
      community: item.community || communityName(activeCommunity),
      responsibleSupervisor: item.responsibleSupervisor || item.supervisorName || '',
      question: item.question || '',
      answer: item.answer || '',
      tags: splitMultiValue(item.tags).join('、'),
      synonyms: splitMultiValue(item.synonyms).join('、'),
      keywords: splitMultiValue(item.keywords).join('、'),
      pinned: item.pinned === true ? 'TRUE' : 'FALSE',
      enabled: item.enabled !== false ? 'TRUE' : 'FALSE',
      orderNo: Number(item.orderNo || 0)
    }));
    const blob = new Blob([`\uFEFF${FAQ_CSV_NOTES.join('\r\n')}\r\n${FAQ_CSV_FIELD_NOTES.join('\r\n')}\r\n${serializeCsv(rows, FAQ_CSV_HEADERS)}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `assistant-faq-export-${date}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const exportTemplate = (sceneKey = 'all') => {
    const rows = buildTemplateExportRows(sceneKey, activeCommunity, currentSupervisorName);
    const content = `${FAQ_CSV_NOTES.join('\r\n')}\r\n${FAQ_CSV_FIELD_NOTES.join('\r\n')}\r\n${serializeCsv(rows, FAQ_CSV_HEADERS)}`;
    const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `assistant-faq-${sceneKey === 'all' ? 'template' : sceneKey}-${date}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const openImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const importFaqs = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }
    try {
      const text = await file.text();
      const lowerName = String(file.name || '').toLowerCase();
      const trimmed = text.replace(/^\uFEFF/, '').trimStart();
      const looksLikeJson = trimmed.startsWith('{') || trimmed.startsWith('[');
      const isCsv = lowerName.endsWith('.csv') || lowerName.endsWith('.tsv') || !looksLikeJson;
      const parsed = isCsv ? parseCsv(text.replace(/^\uFEFF/, '')) : JSON.parse(text);
      const items = isCsv
        ? parsed
        : Array.isArray(parsed) ? parsed : Array.isArray(parsed.items) ? parsed.items : Array.isArray(parsed.faqs) ? parsed.faqs : [];
      if (!items.length) {
        throw new Error('没有找到可导入的技能库条目');
      }
      const normalizedItems = isCsv
        ? items.map((item) => {
            const normalized = {};
            Object.keys(item || {}).forEach((key) => {
              const mapped = FAQ_HEADER_ALIASES[normalizeHeaderName(key)] || FAQ_HEADER_ALIASES[String(key || '').trim()] || String(key || '').trim();
              normalized[mapped] = item[key];
            });
            return normalized;
          })
        : items;
      const previewItems = normalizedItems.map((item, index) => ({
        id: item.id || '',
        communityId: item.communityId || activeCommunity?.id || '',
        community: item.community || communityName(activeCommunity),
        responsibleSupervisor: item.responsibleSupervisor || item.supervisorName || activeCommunity?.defaultSupervisor || '',
        question: item.question || '',
        answer: item.answer || '',
        tags: splitMultiValue(item.tags),
        synonyms: splitMultiValue(item.synonyms),
        keywords: splitMultiValue(item.keywords),
        pinned: parseBooleanLike(item.pinned, false),
        enabled: parseBooleanLike(item.enabled, true),
        orderNo: Number(item.orderNo || index + 1)
      })).filter((item) => item.question || item.answer || item.tags.length || item.synonyms.length || item.keywords.length);
      setImportPreview({
        fileName: file.name || 'import',
        isCsv,
        items: previewItems,
        sourceCount: normalizedItems.length
      });
    } catch (error) {
      window.alert(error.message || '导入失败，请检查 CSV/JSON 格式');
    } finally {
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const commitImportPreview = async () => {
    if (!importPreview?.items?.length) {
      setImportPreview(null);
      return;
    }
    setLoading(true);
    try {
      let count = 0;
      for (const item of importPreview.items) {
        await saveAssistantFaq(apiBase, token, {
          ...item,
          communityId: item.communityId || activeCommunity?.id || '',
          community: item.community || communityName(activeCommunity),
          responsibleSupervisor: item.responsibleSupervisor || activeCommunity?.defaultSupervisor || ''
        });
        count += 1;
      }
      await refreshFaqs();
      setImportPreview(null);
      window.alert(`已导入 ${count} 条技能库记录`);
    } catch (error) {
      window.alert(error.message || '保存导入内容失败');
    } finally {
      setLoading(false);
    }
  };

  const cancelImportPreview = () => {
    setImportPreview(null);
  };

  const remove = async (item) => {
    if (!window.confirm(`确定删除常见问题「${item.question || '未命名'}」吗？`)) {
      return;
    }
    setLoading(true);
    try {
      await deleteAssistantFaq(apiBase, token, item.id);
      await refreshFaqs();
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
          <h1>AI 客服技能库</h1>
          <p>维护常见问题和标准答案，智能助手会优先从这里命中后再回复。</p>
        </div>
        <div className="assistant-center-actions">
          <button type="button" className="btn btn-primary" onClick={openCreate}>新增问题</button>
          <button type="button" className="btn btn-ghost" onClick={openImport}>导入技能库</button>
          <button type="button" className="btn btn-ghost" onClick={exportFaqs}>导出 CSV</button>
          <button type="button" className="btn btn-ghost" onClick={() => exportTemplate('all')}>总模板</button>
          {FAQ_TEMPLATE_SCENE_ORDER.map((sceneKey) => (
            <button
              key={sceneKey}
              type="button"
              className="btn btn-ghost"
              onClick={() => exportTemplate(sceneKey)}
            >
              {FAQ_TEMPLATE_SCENES[sceneKey].label}
            </button>
          ))}
          <button type="button" className="btn btn-ghost" onClick={batchGenerateSynonyms}>批量生成同义问法</button>
          <button type="button" className={`btn btn-ghost ${onlyFillEmptySynonyms ? 'active' : ''}`} onClick={() => setOnlyFillEmptySynonyms((prev) => !prev)}>
            只补空同义问法：{onlyFillEmptySynonyms ? '是' : '否'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/assistant-prompt')}>提示词</button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/assistant-sessions')}>会话日志</button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/')}>返回控制台</button>
        </div>
      </header>
      <input ref={fileInputRef} type="file" accept="application/json,.json,text/csv,.csv" style={{ display: 'none' }} onChange={importFaqs} />

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
            <div>技能库条目</div>
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
                    <span className={`status-pill ${item.pinned ? 'success' : ''}`}>{item.pinned ? '置顶' : '普通'}</span>
                    <span className="status-pill">{item.community || communityName(activeCommunity)}</span>
                    <span className="status-pill">{item.responsibleSupervisor || item.supervisorName || currentSupervisorName || '未设置负责人'}</span>
                    <span className="status-pill">顺序 {item.orderNo || 0}</span>
                  </div>
                  <div className="chip-row compact">
                    {splitMultiValue(item.synonyms).slice(0, 4).map((synonym) => (
                      <span key={synonym} className="chip tiny">{synonym}</span>
                    ))}
                  </div>
                  <div className="chip-row compact">
                    {splitMultiValue(item.keywords).slice(0, 6).map((keyword) => (
                      <span key={keyword} className="chip tiny">{keyword}</span>
                    ))}
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
                  <button type="button" className="btn btn-ghost tiny" onClick={() => togglePinned(item)}>{item.pinned ? '取消置顶' : '置顶'}</button>
                  <button type="button" className="btn btn-ghost tiny danger" onClick={() => remove(item)}>删除</button>
                </div>
              </div>
            ))}
            {!filteredFaqs.length ? <div className="empty-state compact">当前项目暂无技能库条目</div> : null}
          </div>
        </section>

        <aside className="card assistant-center-drawer">
          <div className="section-header">
            <div>
              <div className="section-title">{drawer?.mode === 'detail' ? '技能库详情' : '编辑技能库条目'}</div>
              <div className="hint">{drawer?.mode === 'detail' ? '点编辑可修改内容' : '修改后保存到后端'}</div>
            </div>
          </div>
          {drawer?.mode === 'detail' ? (
            <div className="assistant-drawer-content">
              <div className="drawer-title">{drawer.item?.question || '未命名问题'}</div>
              <div className="drawer-line">答案：{drawer.item?.answer || '-'}</div>
              <div className="drawer-line">标签：{splitTags(drawer.item?.tags) || '-'}</div>
              <div className="drawer-line">同义问法：{splitTags(drawer.item?.synonyms) || '-'}</div>
              <div className="drawer-line">关键词：{splitTags(drawer.item?.keywords) || '-'}</div>
              <div className="drawer-line">项目：{drawer.item?.community || '-'}</div>
              <div className="drawer-line">负责人：{drawer.item?.responsibleSupervisor || drawer.item?.supervisorName || currentSupervisorName || '-'}</div>
              <div className="drawer-line">顺序：{drawer.item?.orderNo || 0}</div>
              <div className="drawer-line">置顶：{drawer.item?.pinned ? '是' : '否'}</div>
              <div className="drawer-line">状态：{drawer.item?.enabled === false ? '停用' : '启用'}</div>
              <div className="footer-actions">
                <button type="button" className="btn btn-primary" onClick={() => openEdit(drawer.item)}>编辑</button>
                <button type="button" className="btn btn-ghost" onClick={() => toggleEnabled(drawer.item)}>{drawer.item?.enabled === false ? '启用' : '停用'}</button>
                <button type="button" className="btn btn-ghost" onClick={() => togglePinned(drawer.item)}>{drawer.item?.pinned ? '取消置顶' : '置顶'}</button>
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
                <div className="field-label-row">
                  <span className="field-label">同义问法</span>
                  <button type="button" className="btn btn-ghost tiny" onClick={setSynonymTemplate}>自动补全模板</button>
                </div>
                <textarea
                  className="field textarea"
                  rows={4}
                  value={draft.synonyms}
                  placeholder="每行或用逗号分隔，例如：怎么查物业费、物业费怎么查"
                  onChange={(e) => setDraft((prev) => ({ ...prev, synonyms: e.target.value }))}
                />
              </label>
              <label className="field-group">
                <span className="field-label">关键词</span>
                <input
                  className="field"
                  value={draft.keywords}
                  placeholder="例如：物业费、账单、缴费"
                  onChange={(e) => setDraft((prev) => ({ ...prev, keywords: e.target.value }))}
                />
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
              <label className="toggle-item">
                <span>置顶</span>
                <button type="button" className={`chip ${draft.pinned ? 'active' : ''}`} onClick={() => setDraft((prev) => ({ ...prev, pinned: !prev.pinned }))}>
                  {draft.pinned ? '是' : '否'}
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
      {importPreview ? (
        <div className="modal-backdrop">
          <div className="card modal-panel assistant-import-preview">
            <div className="section-header">
              <div>
                <div className="section-title">导入预览</div>
                <div className="hint">
                  {importPreview.fileName} · {importPreview.isCsv ? 'CSV' : 'JSON'} · 共 {importPreview.sourceCount} 条，预览 {importPreview.items.length} 条
                </div>
              </div>
            </div>
            <div className="assistant-preview-notes">
              <div className="hint">确认无误后再保存。导入会按照当前项目归属写入。</div>
            </div>
            <div className="assistant-preview-list">
              {importPreview.items.slice(0, 8).map((item, index) => (
                <div key={`${item.question || 'item'}-${index}`} className="assistant-preview-item">
                  <div className="assistant-list-title">{item.question || '未命名问题'}</div>
                  <div className="assistant-list-sub">{item.answer || '暂无答案'}</div>
                  <div className="assistant-list-meta">
                    <span className="status-pill">{item.community || communityName(activeCommunity)}</span>
                    <span className={`status-pill ${item.pinned ? 'success' : ''}`}>{item.pinned ? '置顶' : '普通'}</span>
                    <span className={`status-pill ${item.enabled ? 'success' : 'danger'}`}>{item.enabled ? '启用' : '停用'}</span>
                    <span className="status-pill">顺序 {item.orderNo || 0}</span>
                  </div>
                  <div className="chip-row compact">
                    {splitMultiValue(item.synonyms).slice(0, 4).map((synonym) => (
                      <span key={synonym} className="chip tiny">{synonym}</span>
                    ))}
                    {splitMultiValue(item.keywords).slice(0, 4).map((keyword) => (
                      <span key={keyword} className="chip tiny">{keyword}</span>
                    ))}
                  </div>
                </div>
              ))}
              {importPreview.items.length > 8 ? <div className="hint">还有 {importPreview.items.length - 8} 条未展开预览。</div> : null}
            </div>
            <div className="footer-actions">
              <button type="button" className="btn btn-primary" onClick={commitImportPreview} disabled={loading}>确认保存</button>
              <button type="button" className="btn btn-ghost" onClick={cancelImportPreview} disabled={loading}>取消</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
