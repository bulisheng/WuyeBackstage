package com.example.property.service;

import com.example.property.common.BusinessException;
import com.example.property.dto.AssistantConfigRequest;
import com.example.property.dto.AssistantHandoffRequest;
import com.example.property.dto.AssistantMessageRequest;
import com.example.property.dto.AssistantSessionRequest;
import com.example.property.dto.AuthLoginRequest;
import com.example.property.dto.CreateDecorationRequest;
import com.example.property.dto.CreateFeedbackRequest;
import com.example.property.dto.CreateRepairRequest;
import com.example.property.dto.CreateVisitorRequest;
import com.example.property.dto.PayBillRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

@Service
public class InMemoryPropertyDataService implements PropertyDataService {
  private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
  private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("yyyy-MM-dd");

  private final Map<String, Map<String, Object>> users = new ConcurrentHashMap<>();
  private final Map<String, Map<String, Object>> tokens = new ConcurrentHashMap<>();
  private final Map<String, Map<String, Object>> notices = new ConcurrentHashMap<>();
  private final Map<String, Map<String, Object>> bills = new ConcurrentHashMap<>();
  private final Map<String, Map<String, Object>> repairs = new ConcurrentHashMap<>();
  private final Map<String, Map<String, Object>> visitors = new ConcurrentHashMap<>();
  private final Map<String, Map<String, Object>> decorations = new ConcurrentHashMap<>();
  private final Map<String, Map<String, Object>> feedbacks = new ConcurrentHashMap<>();
  private final Map<String, Map<String, Object>> complaintQueue = new ConcurrentHashMap<>();
  private final Map<String, Map<String, Object>> complaintRules = new ConcurrentHashMap<>();
  private final Map<String, Map<String, Object>> express = new ConcurrentHashMap<>();
  private final Map<String, Map<String, Object>> vegetableOrders = new ConcurrentHashMap<>();
  private final Map<String, Map<String, Object>> houses = new ConcurrentHashMap<>();
  private final Map<String, Map<String, Object>> staffs = new ConcurrentHashMap<>();
  private final Map<String, Map<String, Object>> assistantSessions = new ConcurrentHashMap<>();
  private final Map<String, Map<String, Object>> assistantSettings = new ConcurrentHashMap<>();
  private final Map<String, Map<String, Object>> assistantFaqs = new ConcurrentHashMap<>();
  private final Map<String, Map<String, Object>> adminSessions = new ConcurrentHashMap<>();
  private final List<Map<String, Object>> vegetableProducts = new CopyOnWriteArrayList<>();
  private final Map<String, Object> community = new ConcurrentHashMap<>();
  private final Map<String, Map<String, Object>> communities = new ConcurrentHashMap<>();
  private final MongoTemplate mongoTemplate;

  private static final String COMMUNITY_COLLECTION = "property_community";
  private static final String COMMUNITIES_COLLECTION = "property_communities";
  private static final String USERS_COLLECTION = "property_users";
  private static final String TOKENS_COLLECTION = "property_tokens";
  private static final String NOTICES_COLLECTION = "property_notices";
  private static final String BILLS_COLLECTION = "property_bills";
  private static final String REPAIRS_COLLECTION = "property_repairs";
  private static final String VISITORS_COLLECTION = "property_visitors";
  private static final String DECORATIONS_COLLECTION = "property_decorations";
  private static final String FEEDBACKS_COLLECTION = "property_feedbacks";
  private static final String COMPLAINT_QUEUE_COLLECTION = "property_complaint_queue";
  private static final String COMPLAINT_RULES_COLLECTION = "property_complaint_rules";
  private static final String EXPRESS_COLLECTION = "property_express";
  private static final String HOUSES_COLLECTION = "property_houses";
  private static final String STAFFS_COLLECTION = "property_staffs";
  private static final String VEGETABLE_PRODUCTS_COLLECTION = "property_vegetable_products";
  private static final String VEGETABLE_ORDERS_COLLECTION = "property_vegetable_orders";
  private static final String ASSISTANT_COLLECTION = "property_assistant_sessions";
  private static final String ASSISTANT_SETTINGS_COLLECTION = "property_assistant_settings";
  private static final String ASSISTANT_FAQS_COLLECTION = "property_assistant_faqs";
  private static final String ADMIN_SESSIONS_COLLECTION = "property_admin_sessions";
  private static final String DEMO_OPENID = "demo-openid";
  private static final String DEMO_TOKEN = "demo-token";

  @Value("${openclaw.base-url:http://127.0.0.1:18789/chat?session=agent%3Amain%3Amain}")
  private String openclawBaseUrl;

  @Value("${openclaw.local-base-url:http://127.0.0.1:18789/chat?session=agent%3Amain%3Amain}")
  private String openclawLocalBaseUrl;

  @Value("${openclaw.remote-base-url:https://openclaw.example.com}")
  private String openclawRemoteBaseUrl;

  @Value("${openclaw.complaint-analysis-path:/api/v1/assistant/complaint/analyze}")
  private String openclawComplaintAnalysisPath;

  @Value("${openclaw.analysis-timeout-ms:5000}")
  private long openclawAnalysisTimeoutMs;

  @Value("${assistant.provider:openclaw}")
  private String assistantProvider;

  @Value("${deepseek.base-url:https://api.deepseek.com/v1}")
  private String deepseekBaseUrl;

  @Value("${deepseek.local-base-url:https://api.deepseek.com/v1}")
  private String deepseekLocalBaseUrl;

  @Value("${deepseek.remote-base-url:https://api.deepseek.com/v1}")
  private String deepseekRemoteBaseUrl;

  @Value("${deepseek.chat-path:/chat/completions}")
  private String deepseekChatPath;

  @Value("${deepseek.model:deepseek-chat}")
  private String deepseekModel;

  @Value("${deepseek.api-key:}")
  private String deepseekApiKey;

  @Value("${deepseek.temperature:0.2}")
  private double deepseekTemperature;

  @Value("${deepseek.max-tokens:512}")
  private int deepseekMaxTokens;

  @Value("${gemma.local-base-url:http://127.0.0.1:11434}")
  private String gemmaLocalBaseUrl;

  @Value("${gemma.remote-base-url:https://gemma.example.com}")
  private String gemmaRemoteBaseUrl;

  @Value("${gemma.chat-path:/api/chat}")
  private String gemmaChatPath;

  @Value("${gemma.model:gemma4:e4b}")
  private String gemmaModel;

  @Value("${gemma.temperature:0.2}")
  private double gemmaTemperature;

  @Value("${gemma.max-tokens:512}")
  private int gemmaMaxTokens;

  @Value("${admin.api-key:dev-admin-123456}")
  private String adminApiKey;

  @Value("${admin.session-ttl-minutes:720}")
  private long adminSessionTtlMinutes;

  @Value("${feishu.customer-webhook-url:}")
  private String feishuCustomerWebhookUrl;

  @Value("${feishu.repair-webhook-url:}")
  private String feishuRepairWebhookUrl;

  @Value("${feishu.life-webhook-url:}")
  private String feishuLifeWebhookUrl;

  @Value("${complaint.default-supervisor:物业主管}")
  private String defaultSupervisor;

  private final ObjectMapper objectMapper = new ObjectMapper();

  public InMemoryPropertyDataService(MongoTemplate mongoTemplate) {
    this.mongoTemplate = mongoTemplate;
  }

  @PostConstruct
  public void init() {
    loadOrSeedCommunities();
    loadOrSeedUsers();
    loadOrSeedNotices();
    loadOrSeedBills();
    loadOrSeedRepairs();
    loadOrSeedVisitors();
    loadOrSeedDecorations();
    loadOrSeedFeedbacks();
    loadOrSeedComplaintQueue();
    loadOrSeedComplaintRules();
    loadOrSeedExpress();
    loadOrSeedHouses();
    loadOrSeedStaffs();
    loadOrSeedVegetables();
    if (count(VEGETABLE_ORDERS_COLLECTION) > 0) {
      loadMapCollection(VEGETABLE_ORDERS_COLLECTION, vegetableOrders);
    }
    if (count(ASSISTANT_COLLECTION) > 0) {
      loadMapCollection(ASSISTANT_COLLECTION, assistantSessions);
    }
    if (count(ASSISTANT_SETTINGS_COLLECTION) > 0) {
      loadMapCollection(ASSISTANT_SETTINGS_COLLECTION, assistantSettings);
    }
    if (count(ASSISTANT_FAQS_COLLECTION) > 0) {
      loadMapCollection(ASSISTANT_FAQS_COLLECTION, assistantFaqs);
    } else {
      loadOrSeedAssistantFaqs();
    }
    if (count(ADMIN_SESSIONS_COLLECTION) > 0) {
      loadMapCollection(ADMIN_SESSIONS_COLLECTION, adminSessions);
    }
    normalizeCommunityBindings();
    normalizeAssistantSettingsModes();
    normalizeAssistantFaqOwnership();
    persistAll();
  }

  private void loadOrSeedCommunities() {
    communities.clear();
    if (count(COMMUNITIES_COLLECTION) > 0) {
      loadMapCollection(COMMUNITIES_COLLECTION, communities);
    } else if (count(COMMUNITY_COLLECTION) > 0) {
      loadSingleDoc(COMMUNITY_COLLECTION, community);
      String id = String.valueOf(community.getOrDefault("id", "community"));
      Map<String, Object> item = new LinkedHashMap<>(community);
      item.put("id", id);
      item.put("active", true);
      item.put("supervisors", normalizeStringList(item.get("supervisors")));
      communities.put(id, item);
    } else {
      Map<String, Object> item = mapOf(
          "id", "community",
          "name", "阳光花园小区",
          "projectName", "阳光花园小区",
          "address", "北京市朝阳区阳光路88号",
          "propertyCompany", "阳光物业服务公司",
          "propertyPhone", "010-88888888",
          "totalHouse", 500,
          "totalPark", 300,
          "availablePark", 45,
          "defaultSupervisor", defaultSupervisor,
          "supervisors", Arrays.asList(defaultSupervisor, "维修主管"),
          "enableNotice", true,
          "enableBill", true,
          "enableRepair", true,
          "enableResident", true,
          "enableHouse", true,
          "enableStaff", true,
          "enableFeedback", true,
          "enableComplaintQueue", true,
          "enableComplaintRule", true,
          "enableVisitor", true,
          "enableDecoration", true,
          "enableExpress", true,
          "enableProduct", true,
          "enableOrder", true,
          "active", true,
          "createTime", now(),
          "updateTime", now()
      );
      communities.put("community", item);
    }
    refreshActiveCommunitySnapshot();
  }

  private void loadOrSeedUsers() {
    if (count(USERS_COLLECTION) > 0) {
      loadMapCollection(USERS_COLLECTION, users);
      if (count(TOKENS_COLLECTION) > 0) {
        loadMapCollection(TOKENS_COLLECTION, tokens);
      }
      normalizeDemoUserAndHouseSeeds();
      return;
    }
    Map<String, Object> user = mapOf(
        "_id", DEMO_OPENID,
        "id", DEMO_OPENID,
        "openid", DEMO_OPENID,
        "name", "业主",
        "avatar", "/assets/images/default-avatar.png",
        "phone", "13800138000",
        "community", currentCommunityName(),
        "building", "A栋",
        "unit", "1单元",
        "room", "101室",
        "houseId", "1",
        "houseNo", "A栋 101室",
        "relationship", "业主",
        "status", "active",
        "role", "resident",
        "createTime", now(),
        "updateTime", now()
    );
    users.put(DEMO_OPENID, user);
    tokens.put(DEMO_TOKEN, mapOf("_id", DEMO_TOKEN, "id", DEMO_TOKEN, "token", DEMO_TOKEN, "openid", DEMO_OPENID));
  }

  private void loadOrSeedHouses() {
    if (count(HOUSES_COLLECTION) > 0) {
      loadMapCollection(HOUSES_COLLECTION, houses);
      normalizeDemoUserAndHouseSeeds();
      return;
    }
    houses.put("1", mapOf(
        "id", "1",
        "houseNo", "A栋 101室",
        "building", "A栋",
        "unit", "1单元",
        "room", "101室",
        "area", "96.8",
        "ownerName", "张先生",
        "ownerPhone", "13800138000",
        "occupantName", "张先生",
        "occupantPhone", "13800138000",
        "boundUserId", DEMO_OPENID,
        "boundUserName", "业主",
        "boundUserPhone", "13800138000",
        "ownershipStatus", "self_owned",
        "occupancyStatus", "occupied",
        "status", "occupied",
        "statusText", "已入住",
        "remark", "首批入住样板房",
        "createTime", now(),
        "updateTime", now()
    ));
    houses.put("2", mapOf(
        "id", "2",
        "houseNo", "A栋 102室",
        "building", "A栋",
        "unit", "1单元",
        "room", "102室",
        "area", "88.6",
        "ownerName", "",
        "ownerPhone", "",
        "occupantName", "",
        "occupantPhone", "",
        "boundUserId", "",
        "boundUserName", "",
        "boundUserPhone", "",
        "ownershipStatus", "vacant",
        "occupancyStatus", "vacant",
        "status", "vacant",
        "statusText", "空置",
        "remark", "待交付",
        "createTime", now(),
        "updateTime", now()
    ));
  }

  private void loadOrSeedStaffs() {
    if (count(STAFFS_COLLECTION) > 0) {
      loadMapCollection(STAFFS_COLLECTION, staffs);
      return;
    }
    staffs.put("0", mapOf(
        "id", "0",
        "community", currentCommunityName(),
        "name", "卜立胜",
        "role", "物业主管",
        "position", "主管",
        "department", "物业服务部",
        "phone", "13800138099",
        "status", "active",
        "statusText", "在岗",
        "skill", "投诉协调、服务督导",
        "shift", "白班",
        "scope", "全小区",
        "responsibleBuildings", Arrays.asList("A栋"),
        "feishuDisplayName", "卜立胜",
        "feishuUserId", "",
        "feishuOpenId", "",
        "feishuUnionId", "",
        "remark", "默认主管",
        "createTime", now(),
        "updateTime", now()
    ));
    staffs.put("1", mapOf(
        "id", "1",
        "community", currentCommunityName(),
        "name", "李师傅",
        "role", "维修人员",
        "position", "水电维修",
        "department", "工程部",
        "phone", "13800138001",
        "status", "active",
        "statusText", "在岗",
        "skill", "水电、门锁",
        "shift", "早班",
        "scope", "1-3号楼",
        "responsibleBuildings", Arrays.asList("A栋", "B栋"),
        "remark", "早班",
        "createTime", now(),
        "updateTime", now()
    ));
    staffs.put("2", mapOf(
        "id", "2",
        "community", currentCommunityName(),
        "name", "王阿姨",
        "role", "物业人员",
        "position", "客服前台",
        "department", "物业服务部",
        "phone", "13800138002",
        "status", "active",
        "statusText", "在岗",
        "skill", "接待、回访",
        "shift", "晚班",
        "scope", "物业前台",
        "responsibleBuildings", Arrays.asList("1号楼", "2号楼"),
        "feishuDisplayName", "王阿姨",
        "feishuUserId", "",
        "feishuOpenId", "",
        "feishuUnionId", "",
        "remark", "晚班",
        "createTime", now(),
        "updateTime", now()
    ));
  }

  private void loadOrSeedAssistantFaqs() {
    if (!assistantFaqs.isEmpty()) {
      return;
    }
    String communityId = currentCommunityId();
    String communityName = currentCommunityName();
    List<Map<String, Object>> seeds = new ArrayList<>();
    int orderNo = 1;
    orderNo = addAssistantFaqGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, true,
        "进入首页即可查看待缴账单，也可以在 AI 客服里直接说“查物业费”。",
        Arrays.asList("账单", "物业费"),
        Arrays.asList("物业费", "账单", "缴费"),
        "如何查看本月物业费？",
        "怎么查物业费？",
        "本月物业费在哪里看？",
        "物业费怎么缴纳？");
    orderNo = addAssistantFaqGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, true,
        "在报修页面填写类型、描述、联系人和时间后提交即可，AI 客服也可以帮你生成报修草稿。",
        Arrays.asList("报修", "维修"),
        Arrays.asList("报修", "维修", "维修申请"),
        "怎么提交报修？",
        "如何报修？",
        "报修怎么弄？",
        "我要修东西怎么办？");
    orderNo = addAssistantFaqGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "投诉会先进入后台投诉队列，管理员会先分析并推送到飞书，后续可在后台查看进度。",
        Arrays.asList("投诉", "飞书"),
        Arrays.asList("投诉", "处理进度", "飞书"),
        "投诉后多久能看到处理？",
        "投诉多久处理？",
        "投诉进度怎么看？",
        "投诉后怎么跟进？");
    orderNo = addAssistantFaqGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "在公告列表里可以查看最新通知，AI 客服也可以直接帮你查最新公告。",
        Arrays.asList("公告", "通知"),
        Arrays.asList("公告", "通知", "小区公告"),
        "怎么查看小区公告？",
        "最新公告在哪里看？",
        "最近有什么通知？",
        "公告从哪里进入？");
    orderNo = addAssistantFaqGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, true,
        "门禁卡问题可以先联系前台处理，部分项目支持在物业前台补办或重置。",
        Arrays.asList("门禁", "门禁卡"),
        Arrays.asList("门禁", "门禁卡", "出入"),
        "门禁卡丢了怎么办？",
        "怎么补办门禁卡？",
        "门禁失效怎么处理？",
        "门禁卡在哪里办？");
    orderNo = addAssistantFaqGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "访客可通过访客登记功能提交，生成后会有对应通行信息。",
        Arrays.asList("访客", "登记"),
        Arrays.asList("访客", "访客登记", "来访"),
        "访客怎么登记？",
        "如何登记来访人员？",
        "访客通行怎么弄？",
        "外来人员怎么进小区？");
    orderNo = addAssistantFaqGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "装修申请提交后会进入审批流程，审批通过再安排进场。",
        Arrays.asList("装修", "审批"),
        Arrays.asList("装修", "装修申请", "装修审批"),
        "装修怎么申请？",
        "如何提交装修审批？",
        "装修进场前要做什么？",
        "装修手续怎么办理？");
    orderNo = addAssistantFaqGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "快递会放到快递点或前台，具体以项目规则为准。",
        Arrays.asList("快递", "代收"),
        Arrays.asList("快递", "代收", "取件"),
        "快递放哪里？",
        "怎么取快递？",
        "快递点在哪里？",
        "快递谁帮忙收？");
    orderNo = addAssistantFaqGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "停车费可在停车管理或物业收费页面查看，部分项目支持在线缴费。",
        Arrays.asList("停车", "车位"),
        Arrays.asList("停车费", "车位费", "车位"),
        "停车费怎么查？",
        "车位费在哪里看？",
        "月租车位怎么缴费？",
        "停车费用怎么处理？");
    orderNo = addAssistantFaqGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "车位申请和绑定信息请联系物业前台确认，部分项目支持线上申请。",
        Arrays.asList("车位", "停车"),
        Arrays.asList("车位", "停车位", "绑定"),
        "车位怎么申请？",
        "怎么绑定车位？",
        "临停怎么收费？",
        "车位信息如何修改？");
    orderNo = addAssistantFaqGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "垃圾分类按小区投放点标识执行，具体时间和位置以公告为准。",
        Arrays.asList("垃圾分类", "环境"),
        Arrays.asList("垃圾分类", "投放", "环境"),
        "垃圾分类怎么投？",
        "垃圾桶在哪？",
        "什么时候扔垃圾？",
        "分类投放点在哪里？");
    orderNo = addAssistantFaqGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "水电燃气异常可先查看是否为临时停供，再联系物业或对应服务单位。",
        Arrays.asList("水电", "燃气"),
        Arrays.asList("停水", "停电", "停气"),
        "停水了怎么办？",
        "停电怎么处理？",
        "燃气异常找谁？",
        "水电怎么报修？");
    orderNo = addAssistantFaqGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "电梯故障请先确保安全，随后联系物业前台报修。",
        Arrays.asList("电梯", "报修"),
        Arrays.asList("电梯", "故障", "维修"),
        "电梯坏了找谁？",
        "电梯故障怎么报修？",
        "电梯一直不运行怎么办？",
        "电梯困人怎么处理？");
    orderNo = addAssistantFaqGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "卫生和保洁问题可直接反馈给物业前台或客服。",
        Arrays.asList("保洁", "卫生"),
        Arrays.asList("卫生", "保洁", "清洁"),
        "楼道卫生谁负责？",
        "公共区域保洁怎么反馈？",
        "垃圾没人清理怎么办？",
        "卫生打扫不到位找谁？");
    orderNo = addAssistantFaqGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "物业服务时间和联系电话一般在首页公告或联系方式里可查看。",
        Arrays.asList("电话", "时间"),
        Arrays.asList("电话", "服务时间", "上班"),
        "物业电话是多少？",
        "几点上班？",
        "客服什么时候在线？",
        "怎么联系物业前台？");
    orderNo = addAssistantFaqGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "维修上门时间会根据排期安排，提交报修时可以备注可上门时段。",
        Arrays.asList("维修", "上门"),
        Arrays.asList("维修", "上门", "排期"),
        "维修什么时候上门？",
        "报修后多久来修？",
        "维修师傅怎么预约？",
        "什么时候可以上门处理？");
    orderNo = addAssistantFaqGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "发票申请可联系物业财务或在收费记录里查看是否支持开票。",
        Arrays.asList("发票", "财务"),
        Arrays.asList("发票", "开票", "财务"),
        "怎么开物业费发票？",
        "发票在哪里申请？",
        "缴费后能开票吗？",
        "怎么补开发票？");
    orderNo = addAssistantFaqGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "宠物管理按小区规定执行，遛狗请牵绳并及时清理粪便。",
        Arrays.asList("宠物", "文明养宠"),
        Arrays.asList("宠物", "养宠", "遛狗"),
        "小区能养宠物吗？",
        "遛狗要注意什么？",
        "宠物扰民怎么反馈？",
        "宠物管理规定是什么？");
    orderNo = addAssistantFaqGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "噪音问题建议先沟通，无法解决可直接提交投诉。",
        Arrays.asList("噪音", "投诉"),
        Arrays.asList("噪音", "扰民", "投诉"),
        "楼上太吵怎么办？",
        "噪音怎么投诉？",
        "夜里施工影响休息怎么办？",
        "邻里噪音找谁处理？");
    orderNo = addAssistantFaqGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "漏水、渗水、空调问题都可以直接按报修处理。",
        Arrays.asList("漏水", "空调"),
        Arrays.asList("漏水", "渗水", "空调"),
        "天花板漏水怎么办？",
        "空调坏了怎么报修？",
        "墙面渗水找谁？",
        "漏水怎么拍照片给物业？");
    orderNo = addAssistantFaqGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "楼道照明和公共设施损坏可直接提交报修。",
        Arrays.asList("照明", "公共设施"),
        Arrays.asList("楼道灯", "照明", "公共设施"),
        "楼道灯坏了怎么办？",
        "公共设施损坏怎么报修？",
        "灯不亮找谁修？",
        "扶手坏了怎么处理？");
    orderNo = addAssistantFaqGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "停水停电一般会在公告里提前通知，突发情况可联系物业前台确认。",
        Arrays.asList("停水", "停电"),
        Arrays.asList("停水", "停电", "通知"),
        "停水停电有通知吗？",
        "为什么突然停电？",
        "停水通知在哪里看？",
        "临时停供怎么知道？");
    orderNo = addAssistantFaqGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "公共设施报修和建议反馈都可以通过 AI 客服提交。",
        Arrays.asList("公共设施", "建议"),
        Arrays.asList("设施", "报修", "建议"),
        "公共设施坏了怎么报修？",
        "怎么提建议？",
        "健身器材坏了找谁？",
        "公共区域问题怎么反馈？");
    orderNo = addAssistantFaqGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "账号登录异常可以先尝试重新登录，仍有问题联系物业前台。",
        Arrays.asList("账号", "登录"),
        Arrays.asList("登录", "账号", "异常"),
        "登录不上怎么办？",
        "账号异常怎么处理？",
        "手机换了怎么登录？",
        "验证码收不到怎么办？");
    orderNo = addAssistantFaqGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "物业收费标准会根据项目公示执行，具体请查看收费通知或咨询前台。",
        Arrays.asList("收费", "标准"),
        Arrays.asList("收费标准", "物业收费", "公示"),
        "物业费收费标准是什么？",
        "收费依据在哪里看？",
        "物业怎么收费？",
        "收费标准有调整吗？");
    orderNo = addAssistantFaqGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "代缴和补缴费用可以联系物业前台确认，部分项目支持线上处理。",
        Arrays.asList("代缴", "补缴"),
        Arrays.asList("代缴", "补缴", "缴费"),
        "可以代缴物业费吗？",
        "物业费能补缴吗？",
        "忘记缴费怎么办？",
        "物业费怎么代缴？");
    orderNo = addAssistantFaqGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "车牌录入和绑定车位通常由物业前台或停车管理处理。",
        Arrays.asList("车牌", "停车"),
        Arrays.asList("车牌", "绑定", "停车"),
        "车牌怎么录入？",
        "车牌绑定怎么做？",
        "临停车牌怎么处理？",
        "进出车库识别不了怎么办？");
    orderNo = addAssistantFaqGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "充电桩安装和使用请先确认小区是否开放该服务，再联系物业登记。",
        Arrays.asList("充电桩", "新能源"),
        Arrays.asList("充电桩", "新能源", "电车"),
        "小区能装充电桩吗？",
        "充电桩怎么申请？",
        "新能源车充电怎么登记？",
        "电车充电位在哪里？");
    orderNo = addAssistantFaqGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "垃圾清运时间和地点请以小区公告为准，异常情况可反馈物业。",
        Arrays.asList("垃圾", "清运"),
        Arrays.asList("垃圾清运", "清运", "公告"),
        "垃圾什么时候清运？",
        "垃圾没人收怎么办？",
        "垃圾点怎么处理？",
        "清运时间在哪里看？");
    orderNo = addAssistantFaqGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "门铃和对讲机故障可直接报修，建议注明楼栋单元和故障表现。",
        Arrays.asList("门铃", "对讲"),
        Arrays.asList("门铃", "对讲机", "呼叫"),
        "门铃坏了怎么办？",
        "对讲机怎么报修？",
        "呼叫器不响怎么处理？",
        "门铃故障找谁修？");
    orderNo = addAssistantFaqGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "车位锁故障或损坏可联系物业前台处理，部分项目支持维修更换。",
        Arrays.asList("车位锁", "车位"),
        Arrays.asList("车位锁", "锁", "停车"),
        "车位锁坏了怎么办？",
        "车位锁怎么报修？",
        "停车位被占怎么处理？",
        "车位锁不升起怎么办？");
    orderNo = addAssistantFaqGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "维修材料是否需要业主自备，通常会在报修后由维修人员确认。",
        Arrays.asList("材料", "维修"),
        Arrays.asList("材料", "维修", "自备"),
        "报修要自己买材料吗？",
        "维修材料谁准备？",
        "上门维修要收费吗？",
        "材料费用怎么算？");
    orderNo = addAssistantFaqGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "公共设施巡检和维护会按计划执行，如有问题可直接反馈。",
        Arrays.asList("巡检", "维护"),
        Arrays.asList("巡检", "维护", "检查"),
        "公共设施多久巡检一次？",
        "物业会定期检查吗？",
        "设施维护怎么安排？",
        "巡检问题怎么反馈？");
    orderNo = addAssistantFaqFocusGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, true,
        "物业费缴纳", "进入首页可查看待缴账单，逾期请尽快缴纳。",
        Arrays.asList("物业费", "账单"), Arrays.asList("物业费", "缴费", "账单"));
    orderNo = addAssistantFaqFocusGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, true,
        "报修提交", "填写报修内容后即可提交，客服可协助生成草稿。",
        Arrays.asList("报修", "维修"), Arrays.asList("报修", "维修", "申请"));
    orderNo = addAssistantFaqFocusGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "投诉反馈", "投诉会进入处理队列，后续可查看进度。",
        Arrays.asList("投诉", "反馈"), Arrays.asList("投诉", "反馈", "进度"));
    orderNo = addAssistantFaqFocusGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "访客登记", "登记访客信息后可生成通行信息。",
        Arrays.asList("访客", "登记"), Arrays.asList("访客", "来访", "登记"));
    orderNo = addAssistantFaqFocusGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "装修审批", "装修申请提交后会进入审批流程。",
        Arrays.asList("装修", "审批"), Arrays.asList("装修", "审批", "申请"));
    orderNo = addAssistantFaqFocusGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "停车缴费", "停车费可在停车管理里查看，部分项目支持在线缴费。",
        Arrays.asList("停车", "车位"), Arrays.asList("停车", "车位", "缴费"));
    orderNo = addAssistantFaqFocusGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "车牌录入", "车牌信息通常由物业前台或停车管理处理。",
        Arrays.asList("车牌", "停车"), Arrays.asList("车牌", "绑定", "停车"));
    orderNo = addAssistantFaqFocusGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "门禁补办", "门禁卡可联系前台补办或重置。",
        Arrays.asList("门禁", "门禁卡"), Arrays.asList("门禁", "门禁卡", "补办"));
    orderNo = addAssistantFaqFocusGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "快递代收", "快递一般放到快递点或前台，具体以项目规则为准。",
        Arrays.asList("快递", "代收"), Arrays.asList("快递", "取件", "代收"));
    orderNo = addAssistantFaqFocusGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "发票开具", "发票申请可联系物业财务或查看收费记录。",
        Arrays.asList("发票", "财务"), Arrays.asList("发票", "开票", "财务"));
    orderNo = addAssistantFaqFocusGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "充电桩安装", "先确认项目是否开放，再联系物业登记。",
        Arrays.asList("充电桩", "新能源"), Arrays.asList("充电桩", "新能源", "电车"));
    orderNo = addAssistantFaqFocusGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "楼道照明", "楼道灯或公共照明故障可直接报修。",
        Arrays.asList("照明", "公共设施"), Arrays.asList("楼道灯", "照明", "报修"));
    orderNo = addAssistantFaqFocusGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "电梯故障", "电梯故障请先确保安全，再联系物业报修。",
        Arrays.asList("电梯", "报修"), Arrays.asList("电梯", "故障", "报修"));
    orderNo = addAssistantFaqFocusGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "噪音扰民", "先沟通，无法解决可提交投诉。",
        Arrays.asList("噪音", "投诉"), Arrays.asList("噪音", "扰民", "投诉"));
    orderNo = addAssistantFaqFocusGroup(seeds, communityId, communityName, currentSupervisorName(), orderNo, false,
        "宠物管理", "按小区规定文明养宠，遛狗请牵绳并清理粪便。",
        Arrays.asList("宠物", "养宠"), Arrays.asList("宠物", "养宠", "遛狗"));
    for (int i = 0; i < seeds.size(); i++) {
      Map<String, Object> item = seeds.get(i);
      assistantFaqs.put(String.valueOf(item.getOrDefault("id", "faq-" + (i + 1))), item);
    }
  }

  private int addAssistantFaqGroup(List<Map<String, Object>> seeds,
                                   String communityId,
                                   String communityName,
                                   String supervisor,
                                   int startOrderNo,
                                   boolean pinned,
                                   String answer,
                                   List<String> tags,
                                   List<String> keywords,
                                   String... questions) {
    int orderNo = startOrderNo;
    for (String question : questions) {
      Map<String, Object> item = mapOf(
          "id", "faq-" + newId(),
          "communityId", communityId,
          "community", communityName,
          "responsibleSupervisor", supervisor,
          "question", question,
          "answer", answer,
          "tags", new ArrayList<>(tags),
          "synonyms", buildAssistantFaqSynonyms(question, keywords),
          "keywords", new ArrayList<>(keywords),
          "pinned", pinned && orderNo - startOrderNo < 2,
          "enabled", true,
          "orderNo", orderNo,
          "createTime", now(),
          "updateTime", now()
      );
      seeds.add(item);
      orderNo += 1;
    }
    return orderNo;
  }

  private int addAssistantFaqFocusGroup(List<Map<String, Object>> seeds,
                                        String communityId,
                                        String communityName,
                                        String supervisor,
                                        int startOrderNo,
                                        boolean pinned,
                                        String focus,
                                        String answer,
                                        List<String> tags,
                                        List<String> keywords) {
    String cleanFocus = String.valueOf(firstNonEmpty(focus, "")).trim();
    List<String> questions = Arrays.asList(
        cleanFocus + "怎么办？",
        "怎么" + cleanFocus + "？",
        "如何" + cleanFocus + "？",
        cleanFocus + "怎么处理？",
        cleanFocus + "怎么查？",
        cleanFocus + "在哪里看？",
        cleanFocus + "要找谁？",
        cleanFocus + "怎么报修？"
    );
    return addAssistantFaqGroup(seeds, communityId, communityName, supervisor, startOrderNo, pinned, answer, tags, keywords, questions.toArray(new String[0]));
  }

  private List<String> buildAssistantFaqSynonyms(String question, List<String> keywords) {
    String cleanQuestion = String.valueOf(firstNonEmpty(question, "")).trim().replaceAll("[?？。！!，,；;：:\\s]+$", "");
    String focus = cleanQuestion.replaceFirst("^(请问|麻烦问一下|想问一下|问一下|请教一下|如何|怎么|怎样|请问一下)", "").trim();
    if (focus.isEmpty()) {
      focus = cleanQuestion;
    }
    List<String> list = new ArrayList<>();
    if (!focus.isEmpty()) {
      list.add("怎么" + focus);
      list.add("如何" + focus);
      list.add(focus + "怎么弄");
      list.add(focus + "怎么办");
      list.add(focus + "怎么查");
      list.add(focus + "在哪里看");
      list.add(focus + "怎么处理");
    }
    for (String keyword : normalizeStringList(keywords)) {
      list.add(keyword + "怎么查");
      list.add(keyword + "怎么办");
      list.add(keyword + "在哪里看");
    }
    return list.stream()
        .filter(value -> value != null && !value.trim().isEmpty())
        .distinct()
        .collect(Collectors.toList());
  }

  private void normalizeAssistantFaqOwnership() {
    if (assistantFaqs.isEmpty()) {
      return;
    }
    boolean changed = false;
    for (Map<String, Object> item : assistantFaqs.values()) {
      if (item == null) {
        continue;
      }
      String communityId = textValue(item.get("communityId"));
      Map<String, Object> communityRecord = communityRecordById(communityId);
      String responsibleSupervisor = String.valueOf(firstNonEmpty(
          item.get("responsibleSupervisor"),
          item.get("supervisorName"),
          communityRecord.getOrDefault("defaultSupervisor", currentSupervisorName())
      ));
      if (responsibleSupervisor.isEmpty()) {
        responsibleSupervisor = currentSupervisorName();
      }
      if (!responsibleSupervisor.equals(String.valueOf(item.getOrDefault("responsibleSupervisor", "")))) {
        item.put("responsibleSupervisor", responsibleSupervisor);
        changed = true;
      }
    }
    if (changed) {
      persistAll();
    }
  }

  private void loadOrSeedNotices() {
    if (count(NOTICES_COLLECTION) > 0) {
      loadMapCollection(NOTICES_COLLECTION, notices);
      return;
    }
    addNotice("1", "关于清明节假期小区管理安排的通知", "清明节期间，小区将正常提供物业服务...", "2026-04-03", true);
    addNotice("2", "4月份物业费缴纳通知", "请各位业主于4月15日前完成4月份物业费缴纳...", "2026-04-01", true);
    addNotice("3", "小区绿化改造施工通知", "本周将对小区花园进行绿化改造...", "2026-03-28", false);
  }

  private void loadOrSeedBills() {
    if (count(BILLS_COLLECTION) > 0) {
      loadMapCollection(BILLS_COLLECTION, bills);
      normalizeDemoBillSeeds();
      return;
    }
    addBill("1", "property", "物业费", 350.00, "2026年3月", "2026-04-15", "unpaid", "A栋 101室", null);
    addBill("2", "water", "水费", 86.50, "2026年3月", "2026-04-15", "unpaid", "A栋 102室", null);
    addBill("3", "electricity", "电费", 156.80, "2026年3月", "2026-04-15", "unpaid", "A栋 102室", null);
    addBill("4", "property", "物业费", 350.00, "2026年2月", "2026-03-15", "paid", "A栋 101室", "2026-03-10");
  }

  private void loadOrSeedRepairs() {
    if (count(REPAIRS_COLLECTION) > 0) {
      loadMapCollection(REPAIRS_COLLECTION, repairs);
      return;
    }
    repairs.put("1", mapOf(
        "id", "1",
        "title", "厨房水龙头漏水",
        "category", "water",
        "categoryName", "水管维修",
        "description", "厨房水龙头滴水，无法拧紧",
        "status", "processing",
        "statusName", "处理中",
        "createTime", "2026-04-05 14:30:00",
        "appointmentTime", "2026-04-08 10:00",
        "handler", "李师傅",
        "handlerPhone", "13800138000",
        "phone", "13800138000",
        "comments", new ArrayList<>()
    ));
    repairs.put("2", mapOf(
        "id", "2",
        "title", "客厅灯不亮",
        "category", "electric",
        "categoryName", "电路维修",
        "description", "客厅主灯无法点亮",
        "status", "completed",
        "statusName", "已完成",
        "createTime", "2026-03-20 09:00:00",
        "completionTime", "2026-03-20 15:30:00",
        "handler", "王师傅",
        "handlerPhone", "13900139000",
        "phone", "13900139000",
        "comments", new ArrayList<>()
    ));
  }

  private void loadOrSeedVisitors() {
    if (count(VISITORS_COLLECTION) > 0) {
      loadMapCollection(VISITORS_COLLECTION, visitors);
      return;
    }
    visitors.put("1", mapOf(
        "id", "1",
        "visitorName", "张先生",
        "visitorPhone", "13900001111",
        "visitPurpose", "走亲访友",
        "passCode", "A1B2C3",
        "status", "active",
        "statusText", "有效",
        "visitTime", "2026-04-08 10:20",
        "expireTime", "2026-04-08 22:20"
    ));
  }

  private void loadOrSeedDecorations() {
    if (count(DECORATIONS_COLLECTION) > 0) {
      loadMapCollection(DECORATIONS_COLLECTION, decorations);
      return;
    }
    decorations.put("1", mapOf(
        "id", "1",
        "decorationType", "局部装修",
        "icon", "🔧",
        "area", "客厅",
        "description", "客厅墙面修补",
        "startDate", "2026-04-10",
        "endDate", "2026-04-15",
        "company", "个人装修",
        "phone", "13800138000",
        "status", "pending",
        "statusText", "待审核",
        "applyDate", "2026-04-08 09:00"
    ));
  }

  private void loadOrSeedFeedbacks() {
    if (count(FEEDBACKS_COLLECTION) > 0) {
      loadMapCollection(FEEDBACKS_COLLECTION, feedbacks);
      return;
    }
    feedbacks.put("1", mapOf(
        "id", "1",
        "type", "投诉",
        "category", "噪音扰民",
        "content", "晚上施工声音较大，希望协调处理。",
        "staffName", "",
        "staffPosition", "",
        "location", "3号楼",
        "phone", "13800138000",
        "status", "pending",
        "statusText", "待处理",
        "reply", "",
        "createTime", "2026-04-06 10:00"
    ));
    feedbacks.put("2", mapOf(
        "id", "2",
        "type", "表扬",
        "category", "物业服务",
        "content", "安保师傅帮助搬运重物，服务很周到。",
        "staffName", "李师傅",
        "staffPosition", "保安",
        "location", "",
        "phone", "13800138000",
        "status", "pending",
        "statusText", "待处理",
        "reply", "",
        "createTime", "2026-04-07 11:00"
    ));
  }

  private void loadOrSeedComplaintQueue() {
    if (count(COMPLAINT_QUEUE_COLLECTION) > 0) {
      loadMapCollection(COMPLAINT_QUEUE_COLLECTION, complaintQueue);
    }
  }

  private void loadOrSeedComplaintRules() {
    if (count(COMPLAINT_RULES_COLLECTION) > 0) {
      loadMapCollection(COMPLAINT_RULES_COLLECTION, complaintRules);
      return;
    }
    complaintRules.put("rule-urgent", mapOf(
        "id", "rule-urgent",
        "name", "紧急投诉规则",
        "enabled", true,
        "priority", 100,
        "severity", "high",
        "matchKeywords", Arrays.asList("漏水", "停电", "电梯", "燃气", "冒烟", "火警", "淹水", "停水"),
        "matchCategories", Arrays.asList("水管", "电路", "电梯", "燃气", "消防"),
        "matchBuildings", new ArrayList<>(),
        "supervisorName", currentSupervisorName(),
        "mentionTargets", Arrays.asList(currentSupervisorName()),
        "autoPush", true,
        "autoAnalyze", true,
        "remark", "用于紧急投诉自动升级和推送",
        "createTime", now(),
        "updateTime", now()
    ));
    complaintRules.put("rule-noise", mapOf(
        "id", "rule-noise",
        "name", "噪音施工规则",
        "enabled", true,
        "priority", 80,
        "severity", "medium",
        "matchKeywords", Arrays.asList("噪音", "施工", "扰民", "装修"),
        "matchCategories", Arrays.asList("噪音扰民", "施工扰民", "装修"),
        "matchBuildings", new ArrayList<>(),
        "supervisorName", currentSupervisorName(),
        "mentionTargets", Arrays.asList(currentSupervisorName()),
        "autoPush", false,
        "autoAnalyze", true,
        "remark", "用于噪音和施工类投诉",
        "createTime", now(),
        "updateTime", now()
    ));
  }

  private void loadOrSeedExpress() {
    if (count(EXPRESS_COLLECTION) > 0) {
      loadMapCollection(EXPRESS_COLLECTION, express);
      return;
    }
    express.put("1", mapOf(
        "id", "1",
        "company", "顺丰速运",
        "arriveTime", "2026-04-08 14:30",
        "code", "A-12-365",
        "status", "pending",
        "statusText", "待取件",
        "createTime", "2026-04-08 14:30"
    ));
    express.put("2", mapOf(
        "id", "2",
        "company", "中通快递",
        "arriveTime", "2026-04-08 10:15",
        "code", "B-05-128",
        "status", "pending",
        "statusText", "待取件",
        "createTime", "2026-04-08 10:15"
    ));
  }

  private void loadOrSeedVegetables() {
    if (count(VEGETABLE_PRODUCTS_COLLECTION) > 0) {
      vegetableProducts.clear();
      loadListCollection(VEGETABLE_PRODUCTS_COLLECTION, vegetableProducts);
      return;
    }
    vegetableProducts.add(product("1", "新鲜小白菜", "约500g/份", 3.50));
    vegetableProducts.add(product("2", "有机胡萝卜", "约400g/份", 4.00));
    vegetableProducts.add(product("3", "新鲜土豆", "约500g/份", 2.80));
    vegetableProducts.add(product("4", "嫩豆腐", "约300g/盒", 3.00));
    vegetableProducts.add(product("5", "新鲜青椒", "约300g/份", 4.50));
    vegetableProducts.add(product("6", "土鸡蛋", "10枚/盒", 15.00));
  }

  private long count(String collection) {
    return mongoTemplate.count(new org.springframework.data.mongodb.core.query.Query(), collection);
  }

  private void loadMapCollection(String collection, Map<String, Map<String, Object>> target) {
    target.clear();
    for (Document doc : mongoTemplate.findAll(Document.class, collection)) {
      Map<String, Object> item = toMap(doc);
      target.put(String.valueOf(item.get("id")), item);
    }
  }

  private void loadListCollection(String collection, List<Map<String, Object>> target) {
    target.clear();
    for (Document doc : mongoTemplate.findAll(Document.class, collection)) {
      target.add(toMap(doc));
    }
  }

  private void loadSingleDoc(String collection, Map<String, Object> target) {
    Document doc = mongoTemplate.findById("current", Document.class, collection);
    target.clear();
    if (doc != null) {
      Map<String, Object> item = toMap(doc);
      item.remove("id");
      target.putAll(item);
    }
  }

  private void persistAll() {
    persistSingleDoc(COMMUNITY_COLLECTION, community);
    persistMapCollection(COMMUNITIES_COLLECTION, communities);
    persistMapCollection(USERS_COLLECTION, users);
    persistMapCollection(TOKENS_COLLECTION, tokens);
    persistMapCollection(NOTICES_COLLECTION, notices);
    persistMapCollection(BILLS_COLLECTION, bills);
    persistMapCollection(REPAIRS_COLLECTION, repairs);
    persistMapCollection(VISITORS_COLLECTION, visitors);
    persistMapCollection(DECORATIONS_COLLECTION, decorations);
    persistMapCollection(FEEDBACKS_COLLECTION, feedbacks);
    persistMapCollection(COMPLAINT_QUEUE_COLLECTION, complaintQueue);
    persistMapCollection(COMPLAINT_RULES_COLLECTION, complaintRules);
    persistMapCollection(EXPRESS_COLLECTION, express);
    persistMapCollection(HOUSES_COLLECTION, houses);
    persistMapCollection(STAFFS_COLLECTION, staffs);
    persistMapCollection(VEGETABLE_ORDERS_COLLECTION, vegetableOrders);
    persistMapCollection(ASSISTANT_COLLECTION, assistantSessions);
    persistMapCollection(ASSISTANT_SETTINGS_COLLECTION, assistantSettings);
    persistMapCollection(ASSISTANT_FAQS_COLLECTION, assistantFaqs);
    persistMapCollection(ADMIN_SESSIONS_COLLECTION, adminSessions);
    persistListCollection(VEGETABLE_PRODUCTS_COLLECTION, vegetableProducts);
  }

  private void persistMapCollection(String collection, Map<String, Map<String, Object>> source) {
    mongoTemplate.remove(new org.springframework.data.mongodb.core.query.Query(), collection);
    for (Map<String, Object> item : source.values()) {
      mongoTemplate.save(toDocument(item), collection);
    }
  }

  private void persistListCollection(String collection, List<Map<String, Object>> source) {
    mongoTemplate.remove(new org.springframework.data.mongodb.core.query.Query(), collection);
    for (Map<String, Object> item : source) {
      mongoTemplate.save(toDocument(item), collection);
    }
  }

  private void persistSingleDoc(String collection, Map<String, Object> source) {
    mongoTemplate.remove(new org.springframework.data.mongodb.core.query.Query(), collection);
    Map<String, Object> item = new LinkedHashMap<>(source);
    item.put("_id", "current");
    item.put("id", "current");
    mongoTemplate.save(toDocument(item), collection);
  }

  private Map<String, Object> mapOf(Object... values) {
    Map<String, Object> map = new LinkedHashMap<>();
    for (int i = 0; i < values.length; i += 2) {
      map.put(String.valueOf(values[i]), values[i + 1]);
    }
    return map;
  }

  private Document toDocument(Map<String, Object> source) {
    Document document = new Document();
    for (Map.Entry<String, Object> entry : source.entrySet()) {
      document.put(entry.getKey(), toStoredValue(entry.getValue()));
    }
    if (document.get("_id") == null && document.get("id") != null) {
      document.put("_id", String.valueOf(document.get("id")));
    }
    if (document.get("id") == null && document.get("_id") != null) {
      document.put("id", String.valueOf(document.get("_id")));
    }
    return document;
  }

  private Object toStoredValue(Object value) {
    if (value instanceof Map) {
      Map<String, Object> nested = new LinkedHashMap<>();
      for (Map.Entry<?, ?> entry : ((Map<?, ?>) value).entrySet()) {
        nested.put(String.valueOf(entry.getKey()), toStoredValue(entry.getValue()));
      }
      return new Document(nested);
    }
    if (value instanceof List) {
      List<Object> items = new ArrayList<>();
      for (Object item : (List<?>) value) {
        items.add(toStoredValue(item));
      }
      return items;
    }
    return value;
  }

  private Map<String, Object> toMap(Document document) {
    Map<String, Object> map = new LinkedHashMap<>();
    for (Map.Entry<String, Object> entry : document.entrySet()) {
      if ("_id".equals(entry.getKey())) {
        continue;
      }
      map.put(entry.getKey(), toResultValue(entry.getValue()));
    }
    if (map.get("id") == null && document.get("_id") != null) {
      map.put("id", String.valueOf(document.get("_id")));
    }
    return map;
  }

  private Object toResultValue(Object value) {
    if (value instanceof Document) {
      return toMap((Document) value);
    }
    if (value instanceof Map) {
      Map<String, Object> nested = new LinkedHashMap<>();
      for (Map.Entry<?, ?> entry : ((Map<?, ?>) value).entrySet()) {
        nested.put(String.valueOf(entry.getKey()), toResultValue(entry.getValue()));
      }
      return nested;
    }
    if (value instanceof List) {
      List<Object> items = new ArrayList<>();
      for (Object item : (List<?>) value) {
        items.add(toResultValue(item));
      }
      return items;
    }
    return value;
  }

  private Map<String, Object> product(String id, String name, String spec, double price) {
    return mapOf("id", id, "name", name, "spec", spec, "price", price);
  }

  private void addNotice(String id, String title, String content, String time, boolean important) {
    notices.put(id, mapOf("id", id, "title", title, "content", content, "time", time, "important", important));
  }

  private void addBill(String id, String type, String title, double amount, String period, String dueDate, String status, String room, String paidDate) {
    bills.put(id, mapOf(
        "id", id,
        "type", type,
        "title", title,
        "amount", amount,
        "period", period,
        "dueDate", dueDate,
        "status", status,
        "paidDate", paidDate,
        "room", room,
        "houseNo", room,
        "houseId", "1",
        "community", currentCommunityName(),
        "openid", "demo-openid",
        "createTime", now()
    ));
  }

  private String now() {
    return LocalDateTime.now().format(DATE_TIME);
  }

  private String today() {
    return LocalDateTime.now().format(DATE);
  }

  private String newId() {
    return UUID.randomUUID().toString().replace("-", "");
  }

  private Map<String, Object> cloneMap(Map<String, Object> source) {
    return new LinkedHashMap<>(source);
  }

  private List<Map<String, Object>> sortedValues(Map<String, Map<String, Object>> source) {
    List<Map<String, Object>> list = new ArrayList<>();
    source.values().forEach(item -> list.add(cloneMap(item)));
    list.sort(Comparator.comparing(item -> String.valueOf(item.getOrDefault("createTime", "")), Comparator.reverseOrder()));
    return list;
  }

  private Map<String, Object> findById(Map<String, Map<String, Object>> source, String id, String label) {
    Map<String, Object> item = source.get(id);
    if (item == null) {
      throw new BusinessException(404, label + "不存在");
    }
    return cloneMap(item);
  }

  private Map<String, Object> currentUser(String token) {
    if (token != null && tokens.containsKey(token)) {
      String openid = String.valueOf(tokens.get(token).get("openid"));
      return users.get(openid);
    }
    return users.get("demo-openid");
  }

  private String tokenFor(String openid) {
    for (Map<String, Object> tokenInfo : tokens.values()) {
      if (openid.equals(String.valueOf(tokenInfo.get("openid")))) {
        return String.valueOf(tokenInfo.get("token"));
      }
    }
    String token = "token-" + newId();
    tokens.put(token, mapOf("_id", token, "id", token, "token", token, "openid", openid));
    return token;
  }

  private Map<String, Object> adminSessionFor(String token) {
    if (token == null || token.isEmpty()) {
      return null;
    }
    Map<String, Object> session = adminSessions.get(token);
    if (session == null) {
      return null;
    }
    Object expiresAt = session.get("expiresAt");
    if (expiresAt != null && !String.valueOf(expiresAt).isEmpty()) {
      LocalDateTime expireTime = LocalDateTime.parse(String.valueOf(expiresAt), DATE_TIME);
      if (expireTime.isBefore(LocalDateTime.now())) {
        adminSessions.remove(token);
        persistAll();
        return null;
      }
    }
    return session;
  }

  private String adminToken() {
    return "admin-" + UUID.randomUUID().toString().replace("-", "");
  }

  private void ensureAdminToken(String token) {
    if (adminSessionFor(token) == null) {
      throw new BusinessException(401, "管理员登录已失效，请重新登录");
    }
  }

  private String repairTypeName(String type) {
    if ("water".equals(type)) {
      return "水管维修";
    }
    if ("electric".equals(type)) {
      return "电路维修";
    }
    if ("lock".equals(type)) {
      return "门锁服务";
    }
    if ("gas".equals(type)) {
      return "燃气维修";
    }
    return "其他报修";
  }

  @Override
  public Map<String, Object> adminLogin(String adminKey) {
    if (adminKey == null || !adminApiKey.equals(adminKey)) {
      throw new BusinessException(401, "管理员密钥无效");
    }
    String token = adminToken();
    LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(adminSessionTtlMinutes);
    Map<String, Object> session = mapOf(
        "_id", token,
        "id", token,
        "token", token,
        "expiresAt", expiresAt.format(DATE_TIME),
        "loginTime", now(),
        "role", "admin"
    );
    adminSessions.put(token, session);
    persistAll();
    return mapOf(
        "token", token,
        "expiresAt", session.get("expiresAt"),
        "role", "admin",
        "adminKeyHint", adminKey.substring(0, Math.min(4, adminKey.length())) + "****"
    );
  }

  @Override
  public Map<String, Object> adminMe(String token) {
    Map<String, Object> session = adminSessionFor(token);
    if (session == null) {
      throw new BusinessException(401, "管理员登录已失效");
    }
    return cloneMap(session);
  }

  @Override
  public Map<String, Object> adminLogout(String token) {
    if (token != null) {
      adminSessions.remove(token);
      persistAll();
    }
    return mapOf("success", true);
  }

  private String repairIcon(String type) {
    if ("water".equals(type)) {
      return "💧";
    }
    if ("electric".equals(type)) {
      return "💡";
    }
    if ("lock".equals(type)) {
      return "🔐";
    }
    if ("gas".equals(type)) {
      return "🔥";
    }
    return "🔧";
  }

  private String decorationIcon(String type) {
    if ("局部装修".equals(type)) {
      return "🔧";
    }
    if ("整体翻新".equals(type)) {
      return "🏠";
    }
    if ("水电改造".equals(type)) {
      return "⚡";
    }
    if ("墙面刷新".equals(type)) {
      return "🎨";
    }
    return "📝";
  }

  private String generateCode() {
    return UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
  }

  @Override
  public Map<String, Object> login(AuthLoginRequest request) {
    String openid = "openid-" + request.phone;
    Map<String, Object> matchedHouse = findHouseForLogin(request);
    String resolvedHouseId = request.houseId;
    String resolvedHouseNo = request.houseNo;
    if (matchedHouse != null) {
      if (resolvedHouseId == null || resolvedHouseId.trim().isEmpty()) {
        resolvedHouseId = textValue(matchedHouse.get("id"));
      }
      if (resolvedHouseNo == null || resolvedHouseNo.trim().isEmpty()) {
        resolvedHouseNo = textValue(matchedHouse.get("houseNo"));
      }
      if (request.community == null || request.community.trim().isEmpty()) {
        request.community = textValue(matchedHouse.get("community"));
      }
      if (request.building == null || request.building.trim().isEmpty()) {
        request.building = textValue(matchedHouse.get("building"));
      }
      if (request.unit == null || request.unit.trim().isEmpty()) {
        request.unit = textValue(matchedHouse.get("unit"));
      }
      if (request.room == null || request.room.trim().isEmpty()) {
        request.room = textValue(matchedHouse.get("room"));
      }
    }
    Map<String, Object> user = users.get(openid);
    if (user == null) {
      user = mapOf(
          "_id", openid,
          "id", openid,
          "openid", openid,
          "name", request.userInfo != null && request.userInfo.get("nickName") != null ? String.valueOf(request.userInfo.get("nickName")) : "业主",
          "avatar", request.userInfo != null && request.userInfo.get("avatarUrl") != null ? String.valueOf(request.userInfo.get("avatarUrl")) : "/assets/images/default-avatar.png",
          "phone", request.phone,
        "community", request.community,
        "building", request.building,
        "unit", request.unit,
        "room", request.room,
        "houseId", resolvedHouseId == null ? "" : resolvedHouseId,
        "houseNo", resolvedHouseNo == null || resolvedHouseNo.isEmpty() ? request.room : resolvedHouseNo,
        "relationship", request.relationship == null ? "业主" : request.relationship,
        "createTime", now(),
        "status", "active"
      );
      users.put(openid, user);
    } else {
      user.put("phone", request.phone);
      user.put("community", request.community);
      user.put("building", request.building);
      user.put("unit", request.unit);
      user.put("room", request.room);
      if (resolvedHouseId != null) {
        user.put("houseId", resolvedHouseId);
      }
      if (resolvedHouseNo != null) {
        user.put("houseNo", resolvedHouseNo);
      }
      if (request.relationship != null) {
        user.put("relationship", request.relationship);
      }
    }
    String token = tokenFor(openid);
    persistAll();
    return mapOf("token", token, "user", cloneMap(user), "community", communityByName(request.community));
  }

  @Override
  public Map<String, Object> getCurrentUser(String token) {
    Map<String, Object> user = currentUser(token);
    if (user == null) {
      throw new BusinessException(404, "用户不存在");
    }
    return cloneMap(user);
  }

  @Override
  public Map<String, Object> updateCurrentUser(String token, Map<String, Object> payload) {
    Map<String, Object> user = currentUser(token);
    if (user == null) {
      throw new BusinessException(404, "用户不存在");
    }
    for (String key : Arrays.asList("phone", "community", "building", "unit", "room", "name", "avatar", "houseId", "houseNo", "relationship")) {
      if (payload.get(key) != null) {
        user.put(key, payload.get(key));
      }
    }
    user.put("updateTime", now());
    persistAll();
    return cloneMap(user);
  }

  @Override
  public Map<String, Object> dashboard(String token) {
    Map<String, Object> user = getCurrentUser(token);
    List<Map<String, Object>> allBills = listBills(token, null);
    List<Map<String, Object>> unpaidBills = allBills.stream().filter(item -> "unpaid".equals(item.get("status"))).collect(Collectors.toList());
    List<Map<String, Object>> processingRepairs = listRepairs(token, "processing");
    List<Map<String, Object>> importantNotices = listNotices().stream().filter(item -> Boolean.TRUE.equals(item.get("important"))).collect(Collectors.toList());

    return mapOf(
        "userInfo", user,
        "communityInfo", communityByName(String.valueOf(user.getOrDefault("community", ""))),
        "notices", listNotices(),
        "unpaidBills", unpaidBills.size() > 2 ? unpaidBills.subList(0, 2) : unpaidBills,
        "processingRepairs", processingRepairs,
        "summary", mapOf(
            "unpaidCount", unpaidBills.size(),
            "repairCount", listRepairs(token, null).size(),
            "noticeCount", importantNotices.size(),
            "processingRepairCount", processingRepairs.size(),
            "totalUnpaid", unpaidBills.stream().mapToDouble(item -> Double.parseDouble(String.valueOf(item.getOrDefault("amount", 0)))).sum()
        )
    );
  }

  @Override
  public Map<String, Object> communityCurrent() {
    return activeCommunityRecord();
  }

  @Override
  public List<Map<String, Object>> listNotices() {
    return sortedValues(notices);
  }

  @Override
  public Map<String, Object> getNotice(String id) {
    return findById(notices, id, "公告");
  }

  @Override
  public List<Map<String, Object>> adminListNotices() {
    return listNotices();
  }

  @Override
  public Map<String, Object> adminSaveNotice(Map<String, Object> payload) {
    String id = payload.get("id") == null || String.valueOf(payload.get("id")).isEmpty()
        ? newId()
        : String.valueOf(payload.get("id"));
    String communityId = communityIdByName(String.valueOf(payload.getOrDefault("community", currentCommunityName())));
    String communityName = String.valueOf(payload.getOrDefault("community", communityNameById(communityId)));
    Map<String, Object> notice = mapOf(
        "id", id,
        "communityId", communityId,
        "community", communityName,
        "title", String.valueOf(payload.getOrDefault("title", "")),
        "content", String.valueOf(payload.getOrDefault("content", "")),
        "time", payload.getOrDefault("time", now()),
        "important", payload.getOrDefault("important", false)
    );
    notices.put(id, notice);
    persistAll();
    return cloneMap(notice);
  }

  @Override
  public void adminDeleteNotice(String id) {
    if (notices.remove(id) == null) {
      throw new BusinessException(404, "公告不存在");
    }
    persistAll();
  }

  @Override
  public List<Map<String, Object>> listBills(String token, String status) {
    boolean scoped = token != null && !token.isEmpty();
    Map<String, Object> current = scoped ? currentUser(token) : null;
    return sortedValues(bills).stream()
        .filter(item -> status == null || status.isEmpty() || status.equals(String.valueOf(item.get("status"))))
        .filter(item -> !scoped || billVisibleToUser(item, current))
        .collect(Collectors.toList());
  }

  @Override
  public Map<String, Object> getBill(String token, String id) {
    Map<String, Object> bill = findById(bills, id, "账单");
    if (token != null && !token.isEmpty()) {
      Map<String, Object> user = currentUser(token);
      if (!billVisibleToUser(bill, user)) {
        throw new BusinessException(404, "账单不存在");
      }
    }
    return bill;
  }

  @Override
  public Map<String, Object> summaryBills(String token) {
    List<Map<String, Object>> all = listBills(token, null);
    List<Map<String, Object>> unpaid = all.stream().filter(item -> "unpaid".equals(item.get("status"))).collect(Collectors.toList());
    List<Map<String, Object>> paid = all.stream().filter(item -> "paid".equals(item.get("status"))).collect(Collectors.toList());
    return mapOf(
        "totalUnpaid", unpaid.stream().mapToDouble(item -> Double.parseDouble(String.valueOf(item.get("amount")))).sum(),
        "unpaidCount", unpaid.size(),
        "paidCount", paid.size()
    );
  }

  @Override
  public Map<String, Object> payBill(String token, String id, PayBillRequest request) {
    Map<String, Object> bill = bills.get(id);
    if (bill == null) {
      throw new BusinessException(404, "账单不存在");
    }
    if (token != null && !token.isEmpty()) {
      Map<String, Object> user = currentUser(token);
      if (!billVisibleToUser(bill, user)) {
        throw new BusinessException(404, "账单不存在");
      }
    }
    bill.put("status", "paid");
    bill.put("paidDate", today());
    bill.put("updateTime", now());
    bill.put("paymentMethod", request == null || request.paymentMethod == null ? "wechat" : request.paymentMethod);
    persistAll();
    return cloneMap(bill);
  }

  @Override
  public List<Map<String, Object>> adminListBills() {
    return listBills(null, null);
  }

  @Override
  public Map<String, Object> adminSaveBill(Map<String, Object> payload) {
    String id = payload.get("id") == null || String.valueOf(payload.get("id")).isEmpty()
        ? newId()
        : String.valueOf(payload.get("id"));
    String room = String.valueOf(payload.getOrDefault("room", ""));
    String houseNo = String.valueOf(payload.getOrDefault("houseNo", room));
    String communityId = communityIdByName(String.valueOf(payload.getOrDefault("community", currentCommunityName())));
    String communityName = String.valueOf(payload.getOrDefault("community", communityNameById(communityId)));
    Map<String, Object> bill = mapOf(
        "id", id,
        "type", String.valueOf(payload.getOrDefault("type", "property")),
        "title", String.valueOf(payload.getOrDefault("title", "")),
        "amount", payload.getOrDefault("amount", 0),
        "period", String.valueOf(payload.getOrDefault("period", "")),
        "dueDate", String.valueOf(payload.getOrDefault("dueDate", "")),
        "status", String.valueOf(payload.getOrDefault("status", "unpaid")),
        "paidDate", payload.getOrDefault("paidDate", null),
        "room", room,
        "houseNo", houseNo.isEmpty() ? room : houseNo,
        "houseId", String.valueOf(payload.getOrDefault("houseId", "")),
        "communityId", communityId,
        "community", communityName,
        "openid", String.valueOf(payload.getOrDefault("openid", DEMO_OPENID)),
        "createTime", payload.getOrDefault("createTime", now()),
        "updateTime", now()
    );
    bills.put(id, bill);
    persistAll();
    return cloneMap(bill);
  }

  @Override
  public void adminDeleteBill(String id) {
    if (bills.remove(id) == null) {
      throw new BusinessException(404, "账单不存在");
    }
    persistAll();
  }

  @Override
  public List<Map<String, Object>> listRepairs(String token, String status) {
    return sortedValues(repairs).stream()
        .filter(item -> status == null || status.isEmpty() || status.equals(String.valueOf(item.get("status"))))
        .collect(Collectors.toList());
  }

  @Override
  public Map<String, Object> getRepair(String token, String id) {
    return findById(repairs, id, "报修");
  }

  @Override
  public Map<String, Object> createRepair(String token, CreateRepairRequest request) {
    Map<String, Object> current = currentUser(token);
    String id = newId();
    String currentCommunityId = String.valueOf(current.getOrDefault("communityId", communityIdByName(String.valueOf(current.getOrDefault("community", currentCommunityName())))));
    String currentCommunityName = String.valueOf(current.getOrDefault("community", communityNameById(currentCommunityId)));
    Map<String, Object> repair = mapOf(
        "id", id,
        "title", repairTypeName(request.type),
        "category", request.type,
        "categoryName", repairTypeName(request.type),
        "icon", repairIcon(request.type),
        "description", request.description,
        "status", "pending",
        "statusName", "待处理",
        "createTime", now(),
        "appointmentTime", (request.appointmentDate == null ? "" : request.appointmentDate) + (request.appointmentSlot == null ? "" : " " + request.appointmentSlot),
        "appointmentDate", request.appointmentDate,
        "appointmentSlot", request.appointmentSlot,
        "phone", request.phone == null || request.phone.isEmpty() ? String.valueOf(current.get("phone")) : request.phone,
        "handler", "",
        "handlerPhone", "",
        "dispatchTime", "",
        "dispatchRemark", "",
        "dispatchShift", "",
        "dispatchBuilding", "",
        "communityId", currentCommunityId,
        "community", currentCommunityName,
        "comments", new ArrayList<>(),
        "dispatchHistory", new ArrayList<>(),
        "lastModifiedBy", current.getOrDefault("name", "业主"),
        "lastModifiedAt", now(),
        "openid", current == null ? "demo-openid" : current.get("openid")
    );
    repairs.put(id, repair);
    persistAll();
    try {
      notifyRepairFeishu(repair, "新报修");
    } catch (Exception ignored) {
      // 通知失败不影响报修入库
    }
    return cloneMap(repair);
  }

  @Override
  public Map<String, Object> addRepairComment(String token, String id, Map<String, Object> payload) {
    Map<String, Object> repair = repairs.get(id);
    if (repair == null) {
      throw new BusinessException(404, "报修不存在");
    }
    List<Map<String, Object>> comments = (List<Map<String, Object>>) repair.get("comments");
    if (comments == null) {
      comments = new ArrayList<>();
      repair.put("comments", comments);
    }
    comments.add(mapOf(
        "content", payload.getOrDefault("content", ""),
        "author", payload.getOrDefault("author", "业主"),
        "createTime", now()
    ));
    repair.put("updateTime", now());
    persistAll();
    return cloneMap(repair);
  }

  @Override
  public Map<String, Object> assignRepair(String token, String id, Map<String, Object> payload) {
    Map<String, Object> repair = repairs.get(id);
    if (repair == null) {
      throw new BusinessException(404, "报修不存在");
    }
    if (payload.get("handler") != null) {
      repair.put("handler", payload.get("handler"));
    }
    if (payload.get("handlerPhone") != null) {
      repair.put("handlerPhone", payload.get("handlerPhone"));
    }
    if (payload.get("dispatchTime") != null) {
      repair.put("dispatchTime", payload.get("dispatchTime"));
    }
    if (payload.get("dispatchRemark") != null) {
      repair.put("dispatchRemark", payload.get("dispatchRemark"));
    }
    if (payload.get("dispatchShift") != null) {
      repair.put("dispatchShift", payload.get("dispatchShift"));
    }
    if (payload.get("dispatchBuilding") != null) {
      repair.put("dispatchBuilding", payload.get("dispatchBuilding"));
    }
    if (payload.get("dispatchHistory") instanceof List) {
      repair.put("dispatchHistory", payload.get("dispatchHistory"));
    }
    if (payload.get("lastModifiedBy") != null) {
      repair.put("lastModifiedBy", payload.get("lastModifiedBy"));
    }
    if (payload.get("lastModifiedAt") != null) {
      repair.put("lastModifiedAt", payload.get("lastModifiedAt"));
    }
    repair.put("status", payload.getOrDefault("status", "processing"));
    repair.put("statusName", payload.getOrDefault("statusName", "处理中"));
    repair.put("updateTime", now());
    persistAll();
    return cloneMap(repair);
  }

  @Override
  public List<Map<String, Object>> adminListRepairs() {
    return listRepairs(null, null);
  }

  @Override
  public Map<String, Object> adminSaveRepair(Map<String, Object> payload) {
    String id = payload.get("id") == null || String.valueOf(payload.get("id")).isEmpty()
        ? newId()
        : String.valueOf(payload.get("id"));
    boolean isNew = !repairs.containsKey(id);
    String communityId = communityIdByName(String.valueOf(payload.getOrDefault("community", currentCommunityName())));
    String communityName = String.valueOf(payload.getOrDefault("community", communityNameById(communityId)));
    Map<String, Object> repair = mapOf(
        "id", id,
        "title", String.valueOf(payload.getOrDefault("title", repairTypeName(String.valueOf(payload.getOrDefault("category", "other"))))),
        "category", String.valueOf(payload.getOrDefault("category", "other")),
        "categoryName", String.valueOf(payload.getOrDefault("categoryName", repairTypeName(String.valueOf(payload.getOrDefault("category", "other"))))),
        "icon", payload.getOrDefault("icon", repairIcon(String.valueOf(payload.getOrDefault("category", "other")))),
        "description", String.valueOf(payload.getOrDefault("description", "")),
        "status", String.valueOf(payload.getOrDefault("status", "pending")),
        "statusName", String.valueOf(payload.getOrDefault("statusName", "待处理")),
        "createTime", payload.getOrDefault("createTime", now()),
        "appointmentTime", payload.getOrDefault("appointmentTime", ""),
        "appointmentDate", payload.getOrDefault("appointmentDate", ""),
        "appointmentSlot", payload.getOrDefault("appointmentSlot", ""),
        "completionTime", payload.getOrDefault("completionTime", null),
        "handler", payload.getOrDefault("handler", ""),
        "handlerPhone", payload.getOrDefault("handlerPhone", ""),
        "phone", payload.getOrDefault("phone", ""),
        "dispatchTime", payload.getOrDefault("dispatchTime", ""),
        "dispatchRemark", payload.getOrDefault("dispatchRemark", ""),
        "dispatchShift", payload.getOrDefault("dispatchShift", ""),
        "dispatchBuilding", payload.getOrDefault("dispatchBuilding", ""),
        "communityId", communityId,
        "community", communityName,
        "dispatchHistory", payload.get("dispatchHistory") instanceof List ? payload.get("dispatchHistory") : new ArrayList<>(),
        "lastModifiedBy", payload.getOrDefault("lastModifiedBy", ""),
        "lastModifiedAt", payload.getOrDefault("lastModifiedAt", ""),
        "comments", payload.get("comments") instanceof List ? payload.get("comments") : new ArrayList<>(),
        "openid", String.valueOf(payload.getOrDefault("openid", DEMO_OPENID)),
        "updateTime", now()
    );
    repairs.put(id, repair);
    persistAll();
    if (isNew) {
      try {
        notifyRepairFeishu(repair, "维修通知");
      } catch (Exception ignored) {
        // 通知失败不影响维修记录保存
      }
    }
    return cloneMap(repair);
  }

  @Override
  public void adminDeleteRepair(String id) {
    if (repairs.remove(id) == null) {
      throw new BusinessException(404, "报修不存在");
    }
    persistAll();
  }

  @Override
  public List<Map<String, Object>> adminListComplaints() {
    return listFeedbacks(null, "投诉").stream()
        .map(this::cloneMap)
        .collect(Collectors.toList());
  }

  @Override
  public Map<String, Object> adminGetComplaint(String id) {
    Map<String, Object> complaint = findById(feedbacks, id, "投诉");
    if (!"投诉".equals(String.valueOf(complaint.get("type")))) {
      throw new BusinessException(404, "投诉不存在");
    }
    return complaint;
  }

  @Override
  public Map<String, Object> adminReplyComplaint(String id, Map<String, Object> payload) {
    Map<String, Object> complaint = feedbacks.get(id);
    if (complaint == null) {
      throw new BusinessException(404, "投诉不存在");
    }
    complaint.put("reply", payload.getOrDefault("reply", ""));
    complaint.put("status", payload.getOrDefault("status", "replied"));
    complaint.put("statusText", payload.getOrDefault("statusText", "已回复"));
    complaint.put("replyTime", now());
    complaint.put("updateTime", now());
    persistAll();
    syncComplaintQueueFromFeedback(complaint);
    return cloneMap(complaint);
  }

  @Override
  public List<Map<String, Object>> adminListComplaintQueue() {
    return sortedValues(complaintQueue);
  }

  @Override
  public Map<String, Object> adminGetComplaintQueue(String id) {
    Map<String, Object> queueItem = complaintQueue.get(id);
    if (queueItem == null) {
      Map<String, Object> feedback = feedbacks.get(id);
      if (feedback != null && "投诉".equals(String.valueOf(feedback.get("type")))) {
        queueItem = enqueueComplaintQueue(feedback);
      }
    }
    if (queueItem == null) {
      throw new BusinessException(404, "投诉队列不存在");
    }
    return cloneMap(queueItem);
  }

  @Override
  public Map<String, Object> adminAnalyzeComplaintQueue(String id, Map<String, Object> payload) {
    Map<String, Object> queueItem = ensureComplaintQueueItem(id);
    Map<String, Object> heuristic = buildHeuristicComplaintAnalysis(queueItem, payload);
    Map<String, Object> openclawAnalysis = analyzeComplaintWithOpenclaw(queueItem, payload);
    Map<String, Object> update = new LinkedHashMap<>(heuristic);
    update.put("analysisStatus", "done");
    update.put("analysisTime", now());
    if (openclawAnalysis != null && !openclawAnalysis.isEmpty()) {
      update.putAll(openclawAnalysis);
      update.put("analysisSource", "openclaw");
    } else {
      update.put("analysisSource", "heuristic");
    }
    update.put("updateTime", now());
    queueItem.putAll(update);
    complaintQueue.put(String.valueOf(queueItem.get("id")), queueItem);
    persistAll();
    return cloneMap(queueItem);
  }

  private Map<String, Object> buildHeuristicComplaintAnalysis(Map<String, Object> queueItem, Map<String, Object> payload) {
    Map<String, Object> rule = matchComplaintRule(queueItem);
    String content = String.valueOf(queueItem.getOrDefault("content", ""));
    List<String> keywords = complaintKeywords(content);
    String severity = severityForComplaint(content, rule);
    Map<String, Object> update = new LinkedHashMap<>();
    update.put("summary", buildComplaintSummary(queueItem));
    update.put("severity", payload != null && payload.get("severity") != null ? payload.get("severity") : severity);
    update.put("keywords", keywords);
    update.put("ruleId", rule == null ? "" : String.valueOf(rule.get("id")));
    update.put("ruleName", rule == null ? "" : String.valueOf(rule.get("name")));
    update.put("supervisorName", rule == null ? currentSupervisorName() : String.valueOf(rule.getOrDefault("supervisorName", currentSupervisorName())));
    update.put("mentionTargets", rule == null ? Arrays.asList(currentSupervisorName()) : normalizeMentionTargets(rule.get("mentionTargets")));
    update.put("suggestedAction", suggestedComplaintAction(severity));
    return update;
  }

  private Map<String, Object> analyzeComplaintWithOpenclaw(Map<String, Object> queueItem, Map<String, Object> payload) {
    String base = openclawBaseUrl == null ? "" : openclawBaseUrl.trim();
    String path = openclawComplaintAnalysisPath == null ? "" : openclawComplaintAnalysisPath.trim();
    if (base.isEmpty() || path.isEmpty() || base.contains("openclaw.example.com")) {
      return null;
    }
    try {
      String endpoint = buildEndpoint(base, path);
      Map<String, Object> requestBody = mapOf(
          "scene", "complaint-analysis",
          "complaintId", queueItem.getOrDefault("id", ""),
          "complaint", queueItem,
          "inputText", queueItem.getOrDefault("content", ""),
          "title", queueItem.getOrDefault("title", ""),
          "content", queueItem.getOrDefault("content", ""),
          "location", queueItem.getOrDefault("location", ""),
          "category", queueItem.getOrDefault("category", ""),
          "keywords", queueItem.getOrDefault("keywords", Collections.emptyList()),
          "severityHint", queueItem.getOrDefault("severity", "medium"),
          "mentionTargets", queueItem.getOrDefault("mentionTargets", Collections.emptyList()),
          "supervisorName", queueItem.getOrDefault("supervisorName", currentSupervisorName()),
          "ruleId", queueItem.getOrDefault("ruleId", ""),
          "ruleName", queueItem.getOrDefault("ruleName", ""),
          "requestedBy", payload == null ? "" : String.valueOf(payload.getOrDefault("requestedBy", "property-admin"))
      );
      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create(endpoint))
          .timeout(Duration.ofMillis(Math.max(1000L, openclawAnalysisTimeoutMs)))
          .header("Content-Type", "application/json")
          .POST(HttpRequest.BodyPublishers.ofString(toJson(requestBody)))
          .build();
      HttpResponse<String> response = HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() < 200 || response.statusCode() >= 300) {
        return null;
      }
      Map<String, Object> responseBody = parseJsonObject(response.body());
      Object data = responseBody.get("data");
      Map<String, Object> analysis = data instanceof Map ? cloneMap((Map<String, Object>) data) : responseBody;
      return normalizeOpenclawAnalysis(analysis);
    } catch (Exception error) {
      return null;
    }
  }

  private Map<String, Object> normalizeOpenclawAnalysis(Map<String, Object> analysis) {
    Map<String, Object> normalized = new LinkedHashMap<>();
    if (analysis == null) {
      return normalized;
    }
    Object summary = firstNonEmpty(analysis.get("summary"), analysis.get("conclusion"), analysis.get("result"), analysis.get("analysis"));
    Object severity = firstNonEmpty(analysis.get("severity"), analysis.get("level"));
    Object suggestedAction = firstNonEmpty(analysis.get("suggestedAction"), analysis.get("suggestion"), analysis.get("recommendation"));
    Object ruleId = analysis.get("ruleId");
    Object ruleName = analysis.get("ruleName");
    Object supervisorName = analysis.get("supervisorName");
    Object mentionTargets = analysis.get("mentionTargets");
    Object keywords = analysis.get("keywords");
    if (summary != null && !String.valueOf(summary).isEmpty()) {
      normalized.put("summary", String.valueOf(summary));
    }
    if (severity != null && !String.valueOf(severity).isEmpty()) {
      normalized.put("severity", normalizeSeverityValue(String.valueOf(severity)));
    }
    if (suggestedAction != null && !String.valueOf(suggestedAction).isEmpty()) {
      normalized.put("suggestedAction", String.valueOf(suggestedAction));
    }
    if (ruleId != null && !String.valueOf(ruleId).isEmpty()) {
      normalized.put("ruleId", String.valueOf(ruleId));
    }
    if (ruleName != null && !String.valueOf(ruleName).isEmpty()) {
      normalized.put("ruleName", String.valueOf(ruleName));
    }
    if (supervisorName != null && !String.valueOf(supervisorName).isEmpty()) {
      normalized.put("supervisorName", String.valueOf(supervisorName));
    }
    normalized.put("mentionTargets", normalizeMentionTargets(mentionTargets));
    normalized.put("keywords", normalizeStringList(keywords));
    normalized.put("analysisRaw", analysis);
    return normalized;
  }

  private Map<String, Object> assistantSettingsSummary(Map<String, Object> settings) {
    Map<String, Object> summary = new LinkedHashMap<>();
    if (settings == null) {
      return summary;
    }
    summary.put("communityId", settings.getOrDefault("communityId", ""));
    summary.put("community", settings.getOrDefault("community", ""));
    summary.put("enabled", settings.getOrDefault("enabled", true));
    summary.put("assistantName", settings.getOrDefault("assistantName", "物业AI客服"));
    summary.put("assistantProvider", settings.getOrDefault("assistantProvider", "openclaw"));
    summary.put("deepseekMode", settings.getOrDefault("deepseekMode", "remote"));
    summary.put("deepseekBaseUrl", settings.getOrDefault("deepseekBaseUrl", ""));
    summary.put("deepseekLocalBaseUrl", settings.getOrDefault("deepseekLocalBaseUrl", ""));
    summary.put("deepseekRemoteBaseUrl", settings.getOrDefault("deepseekRemoteBaseUrl", ""));
    summary.put("deepseekChatPath", settings.getOrDefault("deepseekChatPath", ""));
    summary.put("deepseekModel", settings.getOrDefault("deepseekModel", ""));
    summary.put("deepseekApiKeySet", truthy(settings.get("deepseekApiKey")));
    summary.put("deepseekTemperature", settings.getOrDefault("deepseekTemperature", 0.2));
    summary.put("deepseekMaxTokens", settings.getOrDefault("deepseekMaxTokens", 512));
    summary.put("openclawMode", settings.getOrDefault("openclawMode", "local"));
    summary.put("openclawBaseUrl", settings.getOrDefault("openclawBaseUrl", ""));
    summary.put("openclawLocalBaseUrl", settings.getOrDefault("openclawLocalBaseUrl", ""));
    summary.put("openclawRemoteBaseUrl", settings.getOrDefault("openclawRemoteBaseUrl", ""));
    summary.put("openclawModel", settings.getOrDefault("openclawModel", ""));
    summary.put("openclawSessionPath", settings.getOrDefault("openclawSessionPath", ""));
    summary.put("openclawMessagePath", settings.getOrDefault("openclawMessagePath", ""));
    summary.put("openclawHandoffPath", settings.getOrDefault("openclawHandoffPath", ""));
    summary.put("gemmaMode", settings.getOrDefault("gemmaMode", "local"));
    summary.put("gemmaBaseUrl", settings.getOrDefault("gemmaBaseUrl", ""));
    summary.put("gemmaLocalBaseUrl", settings.getOrDefault("gemmaLocalBaseUrl", ""));
    summary.put("gemmaRemoteBaseUrl", settings.getOrDefault("gemmaRemoteBaseUrl", ""));
    summary.put("gemmaChatPath", settings.getOrDefault("gemmaChatPath", ""));
    summary.put("gemmaModel", settings.getOrDefault("gemmaModel", ""));
    summary.put("gemmaTemperature", settings.getOrDefault("gemmaTemperature", 0.2));
    summary.put("gemmaMaxTokens", settings.getOrDefault("gemmaMaxTokens", 512));
    summary.put("promptVersion", settings.getOrDefault("promptVersion", ""));
    summary.put("analysisTimeoutMs", settings.getOrDefault("analysisTimeoutMs", 5000));
    summary.put("fallbackToHeuristic", settings.getOrDefault("fallbackToHeuristic", true));
    summary.put("autoCreateSession", settings.getOrDefault("autoCreateSession", true));
    summary.put("autoSaveHistory", settings.getOrDefault("autoSaveHistory", true));
    summary.put("autoHandoff", settings.getOrDefault("autoHandoff", true));
    summary.put("promptTemplate", settings.getOrDefault("promptTemplate", ""));
    summary.put("enabledScenes", normalizeStringList(settings.get("enabledScenes")));
    summary.put("handoffKeywords", normalizeStringList(settings.get("handoffKeywords")));
    summary.put("defaultSupervisor", settings.getOrDefault("defaultSupervisor", currentSupervisorName()));
    summary.put("supervisors", normalizeStringList(settings.get("supervisors")));
    return summary;
  }

  private Map<String, Object> assistantMessageContext(String token, AssistantMessageRequest request, Map<String, Object> session, Map<String, Object> settings) {
    Map<String, Object> context = new LinkedHashMap<>();
    if (request != null && request.context != null) {
      context.putAll(request.context);
    }
    Map<String, Object> current = currentUser(token);
    Map<String, Object> communityRecord = communityRecordById(String.valueOf(firstNonEmpty(request == null ? null : request.communityId, session == null ? null : session.get("communityId"), currentCommunityId())));
    context.putIfAbsent("communityId", communityRecord.getOrDefault("id", ""));
    context.putIfAbsent("community", communityRecord.getOrDefault("projectName", communityRecord.getOrDefault("name", currentCommunityName())));
    context.putIfAbsent("assistantProvider", settings == null ? normalizeAssistantProvider(assistantProvider, openclawBaseUrl) : settings.getOrDefault("assistantProvider", "openclaw"));
    context.putIfAbsent("defaultSupervisor", settings == null ? currentSupervisorName() : settings.getOrDefault("defaultSupervisor", currentSupervisorName()));
    context.putIfAbsent("assistantName", settings == null ? "物业AI客服" : settings.getOrDefault("assistantName", "物业AI客服"));
    context.putIfAbsent("enabledScenes", settings == null ? Arrays.asList("query_bill", "query_repair", "create_repair", "create_feedback", "query_notice", "handoff") : normalizeStringList(settings.get("enabledScenes")));
    context.putIfAbsent("userName", firstNonEmpty(request == null ? null : request.userName, current == null ? null : current.get("name"), ""));
    context.putIfAbsent("userId", firstNonEmpty(request == null ? null : request.userId, current == null ? null : current.get("id"), ""));
    context.putIfAbsent("houseId", firstNonEmpty(request == null ? null : request.houseId, current == null ? null : current.get("houseId"), ""));
    context.putIfAbsent("room", firstNonEmpty(request == null ? null : request.room, current == null ? null : current.get("room"), ""));
    context.putIfAbsent("phone", firstNonEmpty(request == null ? null : request.phone, current == null ? null : current.get("phone"), ""));
    context.putIfAbsent("houseNo", firstNonEmpty(current == null ? null : current.get("houseNo"), ""));
    context.putIfAbsent("billSummary", summarizeBillsForAssistant(token));
    context.putIfAbsent("repairSummary", summarizeRepairsForAssistant(token));
    context.putIfAbsent("noticeSummary", summarizeNoticesForAssistant());
    context.putIfAbsent("feedbackSummary", summarizeFeedbacksForAssistant(token));
    context.putIfAbsent("featureOverview", normalizeStringList(communityRecord.get("supervisors")));
    return context;
  }

  private String summarizeBillsForAssistant(String token) {
    List<Map<String, Object>> billsList = listBills(token, null);
    long unpaid = billsList.stream().filter(item -> "unpaid".equals(String.valueOf(item.get("status")))).count();
    if (billsList.isEmpty()) {
      return "当前暂无账单";
    }
    return "共" + billsList.size() + "条，其中待缴" + unpaid + "条";
  }

  private String summarizeRepairsForAssistant(String token) {
    List<Map<String, Object>> repairList = listRepairs(token, null);
    long pending = repairList.stream().filter(item -> "pending".equals(String.valueOf(item.get("status"))) || "processing".equals(String.valueOf(item.get("status")))).count();
    if (repairList.isEmpty()) {
      return "当前暂无报修";
    }
    return "共" + repairList.size() + "条，其中待处理/处理中" + pending + "条";
  }

  private String summarizeNoticesForAssistant() {
    List<Map<String, Object>> noticeList = listNotices();
    if (noticeList.isEmpty()) {
      return "当前暂无公告";
    }
    return "最新" + noticeList.size() + "条公告";
  }

  private String summarizeFeedbacksForAssistant(String token) {
    List<Map<String, Object>> feedbackList = listFeedbacks(token, null);
    long complaints = feedbackList.stream().filter(item -> "投诉".equals(String.valueOf(item.get("type")))).count();
    long praises = feedbackList.stream().filter(item -> "表扬".equals(String.valueOf(item.get("type")))).count();
    if (feedbackList.isEmpty()) {
      return "当前暂无反馈";
    }
    return "共" + feedbackList.size() + "条，其中投诉" + complaints + "条、表扬" + praises + "条";
  }

  @SuppressWarnings("unchecked")
  private List<Map<String, Object>> assistantSessionMessages(Map<String, Object> session) {
    Object raw = session == null ? null : session.get("messages");
    if (raw instanceof List) {
      return (List<Map<String, Object>>) raw;
    }
    List<Map<String, Object>> list = new ArrayList<>();
    if (session != null) {
      session.put("messages", list);
    }
    return list;
  }

  private void appendAssistantSessionMessage(Map<String, Object> session, String role, String content, Map<String, Object> extra) {
    if (session == null) {
      return;
    }
    List<Map<String, Object>> messages = assistantSessionMessages(session);
    Map<String, Object> item = new LinkedHashMap<>();
    item.put("id", newId());
    item.put("role", role);
    item.put("content", content == null ? "" : content);
    item.put("createTime", now());
    if (extra != null) {
      item.putAll(extra);
    }
    messages.add(item);
    session.put("messageCount", messages.size());
    session.put("lastMessageAt", now());
  }

  private Map<String, Object> resolveAssistantSession(AssistantMessageRequest request) {
    String sessionId = request == null ? "" : textValue(request.sessionId);
    if (!sessionId.isEmpty() && assistantSessions.containsKey(sessionId)) {
      return assistantSessions.get(sessionId);
    }
    AssistantSessionRequest sessionRequest = new AssistantSessionRequest();
    if (request != null) {
      sessionRequest.scene = request.scene;
      sessionRequest.communityId = request.communityId;
      sessionRequest.houseId = request.houseId;
      sessionRequest.userId = request.userId;
      sessionRequest.userName = request.userName;
      sessionRequest.room = request.room;
      sessionRequest.phone = request.phone;
      sessionRequest.inputText = request.content;
      sessionRequest.context = request.context;
      sessionRequest.subjectId = request.userId;
    }
    return createAssistantSession(null, sessionRequest);
  }

  private Map<String, Object> resolveAssistantSession(String sessionId, String communityId, String houseId, String userId, String userName, String phone) {
    String target = textValue(sessionId);
    if (!target.isEmpty() && assistantSessions.containsKey(target)) {
      return assistantSessions.get(target);
    }
    AssistantSessionRequest request = new AssistantSessionRequest();
    request.communityId = communityId;
    request.houseId = houseId;
    request.userId = userId;
    request.userName = userName;
    request.phone = phone;
    request.subjectId = userId;
    return createAssistantSession(null, request);
  }

  private String assistantSessionUrl(Map<String, Object> settings, String sessionId, String sessionToken) {
    String base = effectiveOpenclawBaseUrl(settings);
    String path = textValue(settings == null ? null : settings.get("openclawSessionPath"));
    if (base.isEmpty() || base.contains("openclaw.example.com")) {
      return "";
    }
    if (isInlineOpenclawUrl(base)) {
      String endpoint = appendQuery(base, "token", sessionToken);
      return endpoint;
    }
    if (path.isEmpty()) {
      path = "/session/{sessionId}";
    }
    String endpoint = buildEndpoint(base, path.replace("{sessionId}", sessionId).replace("{id}", sessionId));
    if (!endpoint.contains("token=") && sessionToken != null && !sessionToken.isEmpty()) {
      endpoint = endpoint + (endpoint.contains("?") ? "&" : "?") + "token=" + sessionToken;
    }
    return endpoint;
  }

  private String assistantEndpoint(Map<String, Object> settings, String pathKey) {
    String base = effectiveOpenclawBaseUrl(settings);
    String path = textValue(settings == null ? null : settings.get(pathKey));
    if (base.isEmpty() || base.contains("openclaw.example.com") || path.isEmpty()) {
      if (base.isEmpty() || base.contains("openclaw.example.com")) {
        return "";
      }
      if (isInlineOpenclawUrl(base)) {
        return base;
      }
      if (path.isEmpty()) {
        return base;
      }
    }
    if (isInlineOpenclawUrl(base)) {
      return base;
    }
    return buildEndpoint(base, path);
  }

  private String assistantEndpointForProvider(Map<String, Object> settings, String provider, String pathKey) {
    if ("gemma".equals(provider)) {
      String base = effectiveGemmaBaseUrl(settings);
      String path = textValue(settings == null ? null : settings.get(pathKey));
      if (base.isEmpty()) {
        return "";
      }
      if (path.isEmpty()) {
        path = "/api/chat";
      }
      return buildEndpoint(base, path);
    }
    return assistantEndpoint(settings, pathKey);
  }

  private String defaultOpenclawLocalBaseUrl() {
    String value = textValue(openclawLocalBaseUrl);
    if (!value.isEmpty()) {
      return value;
    }
    value = textValue(openclawBaseUrl);
    return value.isEmpty() ? "http://127.0.0.1:18789/chat?session=agent%3Amain%3Amain" : value;
  }

  private String defaultOpenclawRemoteBaseUrl() {
    String value = textValue(openclawRemoteBaseUrl);
    return value.isEmpty() ? "https://openclaw.example.com" : value;
  }

  private String defaultGemmaLocalBaseUrl() {
    String value = textValue(gemmaLocalBaseUrl);
    return value.isEmpty() ? "http://127.0.0.1:11434" : value;
  }

  private String defaultGemmaRemoteBaseUrl() {
    String value = textValue(gemmaRemoteBaseUrl);
    return value.isEmpty() ? "https://gemma.example.com" : value;
  }

  private String defaultDeepseekLocalBaseUrl() {
    String value = textValue(deepseekLocalBaseUrl);
    if (!value.isEmpty()) {
      return value;
    }
    value = textValue(deepseekBaseUrl);
    return value.isEmpty() ? "https://api.deepseek.com/v1" : value;
  }

  private String defaultDeepseekRemoteBaseUrl() {
    String value = textValue(deepseekRemoteBaseUrl);
    if (!value.isEmpty()) {
      return value;
    }
    value = textValue(deepseekBaseUrl);
    return value.isEmpty() ? "https://api.deepseek.com/v1" : value;
  }

  private boolean looksLikeLocalOpenclawUrl(String value) {
    String normalized = textValue(value).toLowerCase();
    return normalized.contains("127.0.0.1") || normalized.contains("localhost") || normalized.contains(":18789");
  }

  private String normalizeOpenclawMode(Object modeValue, Object baseValue) {
    String mode = textValue(modeValue).toLowerCase();
    if ("local".equals(mode) || "本地".equals(mode)) {
      return "local";
    }
    if ("remote".equals(mode) || "远程".equals(mode)) {
      return "remote";
    }
    String base = textValue(baseValue);
    if (looksLikeLocalOpenclawUrl(base)) {
      return "local";
    }
    if (!base.isEmpty()) {
      return "remote";
    }
    return "local";
  }

  private String resolveOpenclawBaseUrl(String mode, String localBaseUrl, String remoteBaseUrl, String fallbackBaseUrl) {
    String normalizedMode = normalizeOpenclawMode(mode, fallbackBaseUrl);
    if ("remote".equals(normalizedMode)) {
      return String.valueOf(firstNonEmpty(remoteBaseUrl, fallbackBaseUrl, defaultOpenclawRemoteBaseUrl()));
    }
    return String.valueOf(firstNonEmpty(localBaseUrl, fallbackBaseUrl, defaultOpenclawLocalBaseUrl()));
  }

  private String normalizeAssistantProvider(Object value, Object baseValue) {
    String provider = textValue(value).toLowerCase();
    if (provider.contains("deepseek") || provider.contains("深度求索") || provider.contains("深度")) {
      return "deepseek";
    }
    if (provider.contains("gemma") || provider.contains("本地大模型") || provider.contains("本地")) {
      return "gemma";
    }
    if (provider.contains("openclaw") || provider.contains("智能引擎") || provider.contains("路由")) {
      return "openclaw";
    }
    String base = textValue(baseValue).toLowerCase();
    if (base.contains("deepseek") || base.contains("api.deepseek.com")) {
      return "deepseek";
    }
    if (base.contains("11434") || base.contains("gemma")) {
      return "gemma";
    }
    return "openclaw";
  }

  private String resolveDeepseekBaseUrl(String mode, String localBaseUrl, String remoteBaseUrl, String fallbackBaseUrl) {
    String normalizedMode = normalizeOpenclawMode(mode, fallbackBaseUrl);
    if ("remote".equals(normalizedMode)) {
      return String.valueOf(firstNonEmpty(remoteBaseUrl, fallbackBaseUrl, defaultDeepseekRemoteBaseUrl()));
    }
    return String.valueOf(firstNonEmpty(localBaseUrl, fallbackBaseUrl, defaultDeepseekLocalBaseUrl()));
  }

  private String resolveGemmaBaseUrl(String mode, String localBaseUrl, String remoteBaseUrl, String fallbackBaseUrl) {
    String normalizedMode = normalizeOpenclawMode(mode, fallbackBaseUrl);
    if ("remote".equals(normalizedMode)) {
      return String.valueOf(firstNonEmpty(remoteBaseUrl, fallbackBaseUrl, defaultGemmaRemoteBaseUrl()));
    }
    return String.valueOf(firstNonEmpty(localBaseUrl, fallbackBaseUrl, defaultGemmaLocalBaseUrl()));
  }

  private String effectiveAssistantProvider(Map<String, Object> settings) {
    if (settings == null) {
      return normalizeAssistantProvider(assistantProvider, openclawBaseUrl);
    }
    String provider = normalizeAssistantProvider(settings.get("assistantProvider"), firstNonEmpty(settings.get("deepseekBaseUrl"), settings.get("gemmaBaseUrl"), settings.get("openclawBaseUrl")));
    if ("deepseek".equals(provider)) {
      return "deepseek";
    }
    if ("gemma".equals(provider)) {
      return "gemma";
    }
    return "openclaw";
  }

  private String effectiveDeepseekBaseUrl(Map<String, Object> settings) {
    if (settings == null) {
      return defaultDeepseekLocalBaseUrl();
    }
    String mode = textValue(settings.get("deepseekMode"));
    String localBase = textValue(settings.get("deepseekLocalBaseUrl"));
    String remoteBase = textValue(settings.get("deepseekRemoteBaseUrl"));
    String base = textValue(settings.get("deepseekBaseUrl"));
    return resolveDeepseekBaseUrl(mode, localBase, remoteBase, base);
  }

  private String effectiveGemmaBaseUrl(Map<String, Object> settings) {
    if (settings == null) {
      return defaultGemmaLocalBaseUrl();
    }
    String mode = textValue(settings.get("gemmaMode"));
    String localBase = textValue(settings.get("gemmaLocalBaseUrl"));
    String remoteBase = textValue(settings.get("gemmaRemoteBaseUrl"));
    String base = textValue(settings.get("gemmaBaseUrl"));
    return resolveGemmaBaseUrl(mode, localBase, remoteBase, base);
  }

  private String effectiveOpenclawBaseUrl(Map<String, Object> settings) {
    if (settings == null) {
      return defaultOpenclawLocalBaseUrl();
    }
    String mode = textValue(settings.get("openclawMode"));
    String localBase = textValue(settings.get("openclawLocalBaseUrl"));
    String remoteBase = textValue(settings.get("openclawRemoteBaseUrl"));
    String base = textValue(settings.get("openclawBaseUrl"));
    return resolveOpenclawBaseUrl(mode, localBase, remoteBase, base);
  }

  private void normalizeAssistantSettingsModes() {
    if (assistantSettings.isEmpty()) {
      return;
    }
    boolean changed = false;
    for (Map<String, Object> item : assistantSettings.values()) {
      if (item == null) {
        continue;
      }
      String localBase = String.valueOf(firstNonEmpty(item.get("openclawLocalBaseUrl"), defaultOpenclawLocalBaseUrl()));
      String remoteBase = String.valueOf(firstNonEmpty(item.get("openclawRemoteBaseUrl"), defaultOpenclawRemoteBaseUrl()));
      String base = String.valueOf(firstNonEmpty(item.get("openclawBaseUrl"), localBase));
      String mode = normalizeOpenclawMode(item.get("openclawMode"), base);
      String resolved = resolveOpenclawBaseUrl(mode, localBase, remoteBase, base);
      String provider = normalizeAssistantProvider(item.get("assistantProvider"), firstNonEmpty(item.get("deepseekBaseUrl"), item.get("gemmaBaseUrl"), item.get("openclawBaseUrl")));
      String deepseekLocal = String.valueOf(firstNonEmpty(item.get("deepseekLocalBaseUrl"), defaultDeepseekLocalBaseUrl()));
      String deepseekRemote = String.valueOf(firstNonEmpty(item.get("deepseekRemoteBaseUrl"), defaultDeepseekRemoteBaseUrl()));
      String deepseekBase = String.valueOf(firstNonEmpty(item.get("deepseekBaseUrl"), deepseekLocal));
      String deepseekMode = normalizeOpenclawMode(item.get("deepseekMode"), deepseekBase);
      String deepseekResolved = resolveDeepseekBaseUrl(deepseekMode, deepseekLocal, deepseekRemote, deepseekBase);
      String gemmaLocal = String.valueOf(firstNonEmpty(item.get("gemmaLocalBaseUrl"), defaultGemmaLocalBaseUrl()));
      String gemmaRemote = String.valueOf(firstNonEmpty(item.get("gemmaRemoteBaseUrl"), defaultGemmaRemoteBaseUrl()));
      String gemmaBase = String.valueOf(firstNonEmpty(item.get("gemmaBaseUrl"), gemmaLocal));
      String gemmaMode = normalizeOpenclawMode(item.get("gemmaMode"), gemmaBase);
      String gemmaResolved = resolveGemmaBaseUrl(gemmaMode, gemmaLocal, gemmaRemote, gemmaBase);
      if (!mode.equals(String.valueOf(item.getOrDefault("openclawMode", "")))) {
        item.put("openclawMode", mode);
        changed = true;
      }
      if (!localBase.equals(String.valueOf(item.getOrDefault("openclawLocalBaseUrl", "")))) {
        item.put("openclawLocalBaseUrl", localBase);
        changed = true;
      }
      if (!remoteBase.equals(String.valueOf(item.getOrDefault("openclawRemoteBaseUrl", "")))) {
        item.put("openclawRemoteBaseUrl", remoteBase);
        changed = true;
      }
      if (!resolved.equals(String.valueOf(item.getOrDefault("openclawBaseUrl", "")))) {
        item.put("openclawBaseUrl", resolved);
        changed = true;
      }
      if (!provider.equals(String.valueOf(item.getOrDefault("assistantProvider", "")))) {
        item.put("assistantProvider", provider);
        changed = true;
      }
      if (!deepseekMode.equals(String.valueOf(item.getOrDefault("deepseekMode", "")))) {
        item.put("deepseekMode", deepseekMode);
        changed = true;
      }
      if (!deepseekLocal.equals(String.valueOf(item.getOrDefault("deepseekLocalBaseUrl", "")))) {
        item.put("deepseekLocalBaseUrl", deepseekLocal);
        changed = true;
      }
      if (!deepseekRemote.equals(String.valueOf(item.getOrDefault("deepseekRemoteBaseUrl", "")))) {
        item.put("deepseekRemoteBaseUrl", deepseekRemote);
        changed = true;
      }
      if (!deepseekResolved.equals(String.valueOf(item.getOrDefault("deepseekBaseUrl", "")))) {
        item.put("deepseekBaseUrl", deepseekResolved);
        changed = true;
      }
      if (!gemmaMode.equals(String.valueOf(item.getOrDefault("gemmaMode", "")))) {
        item.put("gemmaMode", gemmaMode);
        changed = true;
      }
      if (!gemmaLocal.equals(String.valueOf(item.getOrDefault("gemmaLocalBaseUrl", "")))) {
        item.put("gemmaLocalBaseUrl", gemmaLocal);
        changed = true;
      }
      if (!gemmaRemote.equals(String.valueOf(item.getOrDefault("gemmaRemoteBaseUrl", "")))) {
        item.put("gemmaRemoteBaseUrl", gemmaRemote);
        changed = true;
      }
      if (!gemmaResolved.equals(String.valueOf(item.getOrDefault("gemmaBaseUrl", "")))) {
        item.put("gemmaBaseUrl", gemmaResolved);
        changed = true;
      }
      item.putIfAbsent("deepseekChatPath", "/chat/completions");
      item.putIfAbsent("deepseekModel", deepseekModel);
      item.putIfAbsent("deepseekApiKey", "");
      item.putIfAbsent("deepseekTemperature", deepseekTemperature);
      item.putIfAbsent("deepseekMaxTokens", deepseekMaxTokens);
      item.putIfAbsent("gemmaChatPath", "/api/chat");
      item.putIfAbsent("gemmaModel", gemmaModel);
      item.putIfAbsent("gemmaTemperature", gemmaTemperature);
      item.putIfAbsent("gemmaMaxTokens", gemmaMaxTokens);
    }
    if (changed) {
      persistAll();
    }
  }

  private boolean isInlineOpenclawUrl(String base) {
    String normalized = textValue(base);
    return normalized.contains("session=") || normalized.contains("/chat");
  }

  private String appendQuery(String url, String key, String value) {
    if (url == null || url.isEmpty() || value == null || value.isEmpty()) {
      return url == null ? "" : url;
    }
    if (url.contains(key + "=")) {
      return url;
    }
    return url + (url.contains("?") ? "&" : "?") + key + "=" + value;
  }

  private Map<String, Object> invokeOpenclawAssistant(Map<String, Object> settings, Map<String, Object> requestBody) {
    String endpoint = assistantEndpoint(settings, "openclawMessagePath");
    if (endpoint.isEmpty()) {
      return null;
    }
    try {
      String responseBody = postJson(endpoint, requestBody);
      Map<String, Object> response = parseJsonObject(responseBody);
      Map<String, Object> raw = flattenOpenclawEnvelope(response);
      return normalizeOpenclawAssistantResponse(raw);
    } catch (Exception error) {
      return null;
    }
  }

  private Map<String, Object> invokeAssistantEngine(String token, Map<String, Object> settings, Map<String, Object> requestBody) {
    String provider = effectiveAssistantProvider(settings);
    Map<String, Object> normalized = "deepseek".equals(provider)
        ? invokeDeepseekAssistant(settings, requestBody)
        : "gemma".equals(provider)
        ? invokeGemmaAssistant(settings, requestBody)
        : invokeOpenclawAssistant(settings, requestBody);
    if (normalized != null && !normalized.isEmpty()) {
      return normalized;
    }
    boolean fallbackEnabled = truthy(settings == null ? null : settings.get("fallbackToHeuristic"));
    if (fallbackEnabled || "deepseek".equals(provider) || "gemma".equals(provider)) {
      Map<String, Object> safeRequestBody = requestBody == null ? new LinkedHashMap<>() : requestBody;
      return buildHeuristicAssistantResponse(
          String.valueOf(firstNonEmpty(token, safeRequestBody.get("sessionToken"), safeRequestBody.get("sessionId"), "")),
          toAssistantMessageRequest(safeRequestBody),
          mapOf("id", safeRequestBody.getOrDefault("sessionId", ""), "communityId", safeRequestBody.getOrDefault("communityId", ""), "community", safeRequestBody.getOrDefault("community", "")),
          settings,
          new LinkedHashMap<>(safeRequestBody)
      );
    }
    return null;
  }

  @SuppressWarnings("unchecked")
  private Map<String, Object> invokeDeepseekAssistant(Map<String, Object> settings, Map<String, Object> requestBody) {
    String endpoint = assistantEndpointForProvider(settings, "deepseek", "deepseekChatPath");
    if (endpoint.isEmpty()) {
      return null;
    }
    String apiKey = String.valueOf(firstNonEmpty(settings == null ? null : settings.get("deepseekApiKey"), deepseekApiKey, "")).trim();
    if (apiKey.isEmpty()) {
      return null;
    }
    try {
      List<Map<String, Object>> messages = new ArrayList<>();
      String prompt = String.valueOf(firstNonEmpty(requestBody.get("prompt"), "你是物业智能助手，只回答当前小区和当前房屋的问题。"));
      messages.add(mapOf("role", "system", "content", prompt + "\n只返回纯 JSON，不要 markdown 代码块，不要额外解释。字段包括 回复内容、场景、是否需要确认、是否转人工、动作、上下文、快捷回复、原因。"));
      Object history = requestBody.get("history");
      if (history instanceof List) {
        List<Map<String, Object>> historyList = (List<Map<String, Object>>) history;
        int start = Math.max(0, historyList.size() - 6);
        for (int i = start; i < historyList.size(); i++) {
          Map<String, Object> item = historyList.get(i);
          if (item == null) {
            continue;
          }
          String role = String.valueOf(firstNonEmpty(item.get("role"), "user"));
          String content = String.valueOf(firstNonEmpty(item.get("content"), item.get("text"), ""));
          if (!content.trim().isEmpty()) {
            messages.add(mapOf("role", role, "content", content));
          }
        }
      }
      String inputText = String.valueOf(firstNonEmpty(requestBody.get("inputText"), requestBody.get("content"), ""));
      messages.add(mapOf("role", "user", "content", inputText));
      Map<String, Object> payload = mapOf(
          "model", String.valueOf(firstNonEmpty(settings == null ? null : settings.get("deepseekModel"), deepseekModel, "deepseek-chat")),
          "messages", messages,
          "stream", false,
          "response_format", mapOf("type", "json_object"),
          "temperature", Double.parseDouble(String.valueOf(firstNonEmpty(settings == null ? null : settings.get("deepseekTemperature"), deepseekTemperature, 0.2))),
          "max_tokens", Integer.parseInt(String.valueOf(firstNonEmpty(settings == null ? null : settings.get("deepseekMaxTokens"), deepseekMaxTokens, 512)))
      );
      String responseBody = postJsonWithAuth(endpoint, payload, apiKey);
      Map<String, Object> response = parseJsonObject(responseBody);
      Map<String, Object> raw = flattenDeepseekEnvelope(response);
      return normalizeOpenclawAssistantResponse(raw);
    } catch (Exception error) {
      return null;
    }
  }

  private AssistantMessageRequest toAssistantMessageRequest(Map<String, Object> requestBody) {
    AssistantMessageRequest request = new AssistantMessageRequest();
    if (requestBody == null) {
      return request;
    }
    request.content = String.valueOf(firstNonEmpty(requestBody.get("content"), ""));
    request.scene = String.valueOf(firstNonEmpty(requestBody.get("scene"), "general"));
    request.communityId = String.valueOf(firstNonEmpty(requestBody.get("communityId"), ""));
    request.community = String.valueOf(firstNonEmpty(requestBody.get("community"), ""));
    request.houseId = String.valueOf(firstNonEmpty(requestBody.get("houseId"), ""));
    request.userId = String.valueOf(firstNonEmpty(requestBody.get("userId"), ""));
    request.userName = String.valueOf(firstNonEmpty(requestBody.get("userName"), ""));
    request.room = String.valueOf(firstNonEmpty(requestBody.get("room"), ""));
    request.phone = String.valueOf(firstNonEmpty(requestBody.get("phone"), ""));
    request.promptVersion = String.valueOf(firstNonEmpty(requestBody.get("promptVersion"), "v1"));
    request.prompt = String.valueOf(firstNonEmpty(requestBody.get("prompt"), ""));
    request.contentType = String.valueOf(firstNonEmpty(requestBody.get("contentType"), "text"));
    request.context = requestBody.containsKey("context") && requestBody.get("context") instanceof Map
        ? (Map<String, Object>) requestBody.get("context")
        : new LinkedHashMap<>();
    return request;
  }

  @SuppressWarnings("unchecked")
  private Map<String, Object> invokeGemmaAssistant(Map<String, Object> settings, Map<String, Object> requestBody) {
    String endpoint = assistantEndpointForProvider(settings, "gemma", "gemmaChatPath");
    if (endpoint.isEmpty()) {
      return null;
    }
    try {
      List<Map<String, Object>> messages = new ArrayList<>();
      String prompt = String.valueOf(firstNonEmpty(requestBody.get("prompt"), "你是物业智能助手，只回答当前小区和当前房屋的问题。"));
      messages.add(mapOf("role", "system", "content", prompt + "\n只返回纯结构化结果，不要 markdown 代码块，不要额外解释。字段包括回复内容、场景、是否需要确认、是否转人工、动作、上下文、快捷回复、原因。"));
      Object history = requestBody.get("history");
      if (history instanceof List) {
        List<Map<String, Object>> historyList = (List<Map<String, Object>>) history;
        int start = Math.max(0, historyList.size() - 6);
        for (int i = start; i < historyList.size(); i++) {
          Map<String, Object> item = historyList.get(i);
          if (item == null) {
            continue;
          }
          String role = String.valueOf(firstNonEmpty(item.get("role"), "user"));
          String content = String.valueOf(firstNonEmpty(item.get("content"), item.get("text"), ""));
          if (!content.trim().isEmpty()) {
            messages.add(mapOf("role", role, "content", content));
          }
        }
      }
      String inputText = String.valueOf(firstNonEmpty(requestBody.get("inputText"), requestBody.get("content"), ""));
      messages.add(mapOf("role", "user", "content", inputText));
      Map<String, Object> payload = mapOf(
          "model", String.valueOf(firstNonEmpty(settings == null ? null : settings.get("gemmaModel"), gemmaModel, "gemma4:e4b")),
          "messages", messages,
          "stream", false,
          "format", "json",
          "temperature", Double.parseDouble(String.valueOf(firstNonEmpty(settings == null ? null : settings.get("gemmaTemperature"), gemmaTemperature, 0.2))),
          "max_tokens", Integer.parseInt(String.valueOf(firstNonEmpty(settings == null ? null : settings.get("gemmaMaxTokens"), gemmaMaxTokens, 512)))
      );
      String responseBody = postJson(endpoint, payload);
      Map<String, Object> response = parseJsonObject(responseBody);
      Map<String, Object> raw = flattenGemmaEnvelope(response);
      return normalizeOpenclawAssistantResponse(raw);
    } catch (Exception error) {
      return null;
    }
  }

  @SuppressWarnings("unchecked")
  private Map<String, Object> flattenGemmaEnvelope(Map<String, Object> response) {
    Map<String, Object> raw = new LinkedHashMap<>();
    if (response == null) {
      return raw;
    }
    raw.putAll(cloneMap(response));
    for (String key : Arrays.asList("data", "result", "payload", "output", "assistant", "response", "message")) {
      Object value = response.get(key);
      if (value instanceof Map) {
        raw.putAll(cloneMap((Map<String, Object>) value));
      }
    }
    Object choices = response.get("choices");
    if (choices instanceof List && !((List<?>) choices).isEmpty()) {
      Object firstChoice = ((List<?>) choices).get(0);
      if (firstChoice instanceof Map) {
        Map<String, Object> choiceMap = cloneMap((Map<String, Object>) firstChoice);
        raw.putAll(choiceMap);
        Object message = choiceMap.get("message");
        if (message instanceof Map) {
          raw.putAll(cloneMap((Map<String, Object>) message));
        }
      }
    }
    Object content = firstNonEmpty(
        raw.get("replyText"),
        raw.get("content"),
        raw.get("message"),
        findDeepValue(raw, "replyText", "content", "message", "text")
    );
    if (content instanceof String) {
      String text = String.valueOf(content);
      String cleanText = normalizeAssistantJsonText(text);
      if (!cleanText.isEmpty()) {
        raw.put("replyText", cleanText);
        raw.put("content", cleanText);
      }
      String jsonCandidate = extractJsonCandidate(stripMarkdownFence(text));
      if (!jsonCandidate.isEmpty()) {
        try {
          Map<String, Object> parsed = parseJsonObject(jsonCandidate);
          if (!parsed.isEmpty()) {
            raw.putAll(parsed);
            Object parsedReply = firstNonEmpty(
                parsed.get("replyText"),
                parsed.get("reply"),
                parsed.get("answer"),
                parsed.get("content"),
                parsed.get("message"),
                parsed.get("text")
            );
            if (parsedReply != null && !String.valueOf(parsedReply).trim().isEmpty()) {
              raw.put("replyText", String.valueOf(parsedReply).trim());
            }
            raw.put("rawText", text.trim());
          }
        } catch (Exception ignored) {
          // keep cleaned text
        }
      }
    }
    return raw;
  }

  @SuppressWarnings("unchecked")
  private Map<String, Object> flattenDeepseekEnvelope(Map<String, Object> response) {
    Map<String, Object> raw = new LinkedHashMap<>();
    if (response == null) {
      return raw;
    }
    raw.putAll(cloneMap(response));
    for (String key : Arrays.asList("data", "result", "payload", "output", "assistant", "response", "message")) {
      Object value = response.get(key);
      if (value instanceof Map) {
        raw.putAll(cloneMap((Map<String, Object>) value));
      }
    }
    Object choices = response.get("choices");
    if (choices instanceof List && !((List<?>) choices).isEmpty()) {
      Object firstChoice = ((List<?>) choices).get(0);
      if (firstChoice instanceof Map) {
        Map<String, Object> choiceMap = cloneMap((Map<String, Object>) firstChoice);
        raw.putAll(choiceMap);
        Object message = choiceMap.get("message");
        if (message instanceof Map) {
          raw.putAll(cloneMap((Map<String, Object>) message));
        }
      }
    }
    Object content = firstNonEmpty(
        raw.get("replyText"),
        raw.get("content"),
        raw.get("message"),
        findDeepValue(raw, "replyText", "content", "message", "text")
    );
    if (content instanceof String) {
      String text = String.valueOf(content);
      String cleanText = normalizeAssistantJsonText(text);
      if (!cleanText.isEmpty()) {
        raw.put("replyText", cleanText);
        raw.put("content", cleanText);
      }
      String jsonCandidate = extractJsonCandidate(stripMarkdownFence(text));
      if (!jsonCandidate.isEmpty()) {
        try {
          Map<String, Object> parsed = parseJsonObject(jsonCandidate);
          if (!parsed.isEmpty()) {
            raw.putAll(parsed);
            Object parsedReply = firstNonEmpty(
                parsed.get("replyText"),
                parsed.get("reply"),
                parsed.get("answer"),
                parsed.get("content"),
                parsed.get("message"),
                parsed.get("text")
            );
            if (parsedReply != null && !String.valueOf(parsedReply).trim().isEmpty()) {
              raw.put("replyText", String.valueOf(parsedReply).trim());
            }
            raw.put("rawText", text.trim());
          }
        } catch (Exception ignored) {
          // keep cleaned text
        }
      }
    }
    return raw;
  }

  private Map<String, Object> flattenOpenclawEnvelope(Map<String, Object> response) {
    Map<String, Object> raw = new LinkedHashMap<>();
    if (response == null) {
      return raw;
    }
    raw.putAll(cloneMap(response));
    for (String key : Arrays.asList("data", "result", "payload", "output", "assistant", "response")) {
      Object value = response.get(key);
      if (value instanceof Map) {
        raw.putAll(cloneMap((Map<String, Object>) value));
      }
    }
    return raw;
  }

  private Map<String, Object> normalizeOpenclawAssistantResponse(Map<String, Object> raw) {
    Map<String, Object> normalized = new LinkedHashMap<>();
    if (raw == null) {
      return normalized;
    }
    Object replyText = firstNonEmpty(
        raw.get("replyText"),
        raw.get("reply"),
        raw.get("answer"),
        raw.get("content"),
        raw.get("message"),
        raw.get("text"),
        findDeepValue(raw, "replyText", "reply", "answer", "content", "message", "text")
    );
    if (replyText != null) {
      String cleaned = normalizeAssistantJsonText(String.valueOf(replyText));
      if (!cleaned.isEmpty()) {
        replyText = cleaned;
      }
    }
    Object intent = firstNonEmpty(
        raw.get("intent"),
        raw.get("scene"),
        raw.get("type"),
        findDeepValue(raw, "intent", "scene", "type")
    );
    Object confidence = firstNonEmpty(
        raw.get("confidence"),
        raw.get("score"),
        raw.get("probability"),
        findDeepValue(raw, "confidence", "score", "probability")
    );
    Object needConfirm = firstNonEmpty(
        raw.get("needConfirm"),
        raw.get("confirm"),
        raw.get("requiresConfirm"),
        findDeepValue(raw, "needConfirm", "confirm", "requiresConfirm")
    );
    Object handoff = firstNonEmpty(
        raw.get("handoff"),
        raw.get("transferToHuman"),
        raw.get("needHandoff"),
        findDeepValue(raw, "handoff", "transferToHuman", "needHandoff")
    );
    Object action = firstNonEmpty(raw.get("action"), findDeepValue(raw, "action"));
    Object slots = firstNonEmpty(raw.get("slots"), findDeepValue(raw, "slots"));
    Object quickReplies = firstNonEmpty(
        raw.get("quickReplies"),
        raw.get("suggestions"),
        raw.get("replies"),
        findDeepValue(raw, "quickReplies", "suggestions", "replies")
    );
    Object reason = firstNonEmpty(
        raw.get("reason"),
        raw.get("explanation"),
        raw.get("summary"),
        findDeepValue(raw, "reason", "explanation", "summary")
    );
    if (replyText != null) {
      normalized.put("replyText", String.valueOf(replyText));
    }
    if (intent != null) {
      normalized.put("intent", String.valueOf(intent));
    }
    if (confidence != null) {
      try {
        normalized.put("confidence", Double.parseDouble(String.valueOf(confidence)));
      } catch (Exception ignored) {
        normalized.put("confidence", 0.85);
      }
    }
    normalized.put("needConfirm", truthy(needConfirm));
    normalized.put("handoff", truthy(handoff));
    if (action instanceof Map) {
      normalized.put("action", cloneMap((Map<String, Object>) action));
    } else {
      Object actionType = firstNonEmpty(raw.get("actionType"), findDeepValue(raw, "actionType"));
      Object actionParams = firstNonEmpty(raw.get("actionParams"), findDeepValue(raw, "actionParams"));
      if (actionType != null || actionParams != null) {
      normalized.put("action", mapOf(
          "type", String.valueOf(firstNonEmpty(actionType, "none")),
          "params", actionParams instanceof Map ? cloneMap((Map<String, Object>) actionParams) : new LinkedHashMap<>()
      ));
      }
    }
    if (slots instanceof Map) {
      normalized.put("slots", cloneMap((Map<String, Object>) slots));
    } else {
      Map<String, Object> slotMap = new LinkedHashMap<>();
      for (String key : Arrays.asList("communityId", "community", "houseId", "room", "building", "unit", "category", "title", "content", "phone")) {
        if (raw.get(key) != null) {
          slotMap.put(key, raw.get(key));
        }
      }
      normalized.put("slots", slotMap);
    }
    if (quickReplies instanceof List) {
      normalized.put("quickReplies", normalizeStringList(quickReplies));
    }
    if (reason != null) {
      normalized.put("reason", String.valueOf(reason));
    }
    normalized.put("raw", raw);
    return normalized;
  }

  private String stripMarkdownFence(String text) {
    if (text == null) {
      return "";
    }
    String trimmed = text.trim();
    if (trimmed.startsWith("```")) {
      String[] lines = trimmed.split("\\R");
      StringBuilder builder = new StringBuilder();
      for (int i = 0; i < lines.length; i++) {
        String line = lines[i].trim();
        if (i == 0 && line.startsWith("```")) {
          continue;
        }
        if (line.startsWith("```")) {
          continue;
        }
        builder.append(lines[i]);
        if (i < lines.length - 1) {
          builder.append("\n");
        }
      }
      return builder.toString().trim();
    }
    return trimmed;
  }

  private String extractJsonCandidate(String text) {
    if (text == null) {
      return "";
    }
    String trimmed = text.trim();
    if (trimmed.isEmpty()) {
      return "";
    }
    int objectStart = trimmed.indexOf('{');
    int objectEnd = trimmed.lastIndexOf('}');
    if (objectStart >= 0 && objectEnd > objectStart) {
      return trimmed.substring(objectStart, objectEnd + 1).trim();
    }
    int arrayStart = trimmed.indexOf('[');
    int arrayEnd = trimmed.lastIndexOf(']');
    if (arrayStart >= 0 && arrayEnd > arrayStart) {
      return trimmed.substring(arrayStart, arrayEnd + 1).trim();
    }
    return "";
  }

  private String normalizeAssistantJsonText(String text) {
    if (text == null) {
      return "";
    }
    String stripped = stripMarkdownFence(text);
    String candidate = extractJsonCandidate(stripped);
    if (!candidate.isEmpty()) {
      Map<String, Object> parsed = parseJsonObject(candidate);
      if (!parsed.isEmpty()) {
        Object reply = firstNonEmpty(
            parsed.get("replyText"),
            parsed.get("reply"),
            parsed.get("answer"),
            parsed.get("content"),
            parsed.get("message"),
            parsed.get("text")
        );
        if (reply != null && !String.valueOf(reply).trim().isEmpty()) {
          return String.valueOf(reply).trim();
        }
        return candidate;
      }
    }
    return stripped;
  }

  private Object findDeepValue(Object source, String... keys) {
    if (source == null || keys == null || keys.length == 0) {
      return null;
    }
    List<String> targetKeys = Arrays.asList(keys);
    return findDeepValueRecursive(source, targetKeys, 0, 6);
  }

  private Object findDeepValueRecursive(Object source, List<String> keys, int depth, int maxDepth) {
    if (source == null || depth > maxDepth) {
      return null;
    }
    if (source instanceof Map) {
      Map<?, ?> map = (Map<?, ?>) source;
      for (Map.Entry<?, ?> entry : map.entrySet()) {
        String key = String.valueOf(entry.getKey());
        Object value = entry.getValue();
        if (keys.contains(key) && value != null && String.valueOf(value).trim().length() > 0) {
          return value;
        }
      }
      for (Map.Entry<?, ?> entry : map.entrySet()) {
        Object value = entry.getValue();
        Object found = findDeepValueRecursive(value, keys, depth + 1, maxDepth);
        if (found != null && String.valueOf(found).trim().length() > 0) {
          return found;
        }
      }
    } else if (source instanceof List) {
      for (Object item : (List<?>) source) {
        Object found = findDeepValueRecursive(item, keys, depth + 1, maxDepth);
        if (found != null && String.valueOf(found).trim().length() > 0) {
          return found;
        }
      }
    }
    return null;
  }

  private Map<String, Object> buildHeuristicAssistantResponse(String token, AssistantMessageRequest request, Map<String, Object> session, Map<String, Object> settings, Map<String, Object> context) {
    String input = String.valueOf(firstNonEmpty(request == null ? null : request.content, ""));
    String intent = classifyIntentName(input);
    Map<String, Object> response = new LinkedHashMap<>();
    response.put("intent", intent);
    response.put("confidence", 0.86);
    response.put("needConfirm", false);
    response.put("handoff", false);
    response.put("slots", new LinkedHashMap<>());
    response.put("action", mapOf("type", "none", "params", new LinkedHashMap<>()));
    response.put("quickReplies", Arrays.asList("查物业费", "查报修", "提交报修", "提交投诉", "转人工"));
    response.put("reason", "本地规则回退");
    if ("query_bill".equals(intent) || input.contains("物业费") || input.contains("缴费")) {
      List<Map<String, Object>> billsList = listBills(token, null);
      List<Map<String, Object>> unpaid = billsList.stream()
          .filter(item -> "unpaid".equals(String.valueOf(item.get("status"))))
          .collect(Collectors.toList());
      response.put("replyText", unpaid.isEmpty()
          ? "当前没有找到待缴账单。"
          : "你当前有 " + unpaid.size() + " 条待缴账单。");
      response.put("action", mapOf("type", "query_bill", "params", mapOf(
          "communityId", context.getOrDefault("communityId", ""),
          "houseId", context.getOrDefault("houseId", "")
      )));
      response.put("quickReplies", Arrays.asList("查看账单", "去缴费", "查报修", "提交报修", "转人工"));
      response.put("reason", "账单查询");
      return response;
    }
    if ("query_repair".equals(intent) || input.contains("报修")) {
      List<Map<String, Object>> repairList = listRepairs(token, null);
      List<Map<String, Object>> active = repairList.stream()
          .filter(item -> "processing".equals(String.valueOf(item.get("status"))) || "pending".equals(String.valueOf(item.get("status"))))
          .collect(Collectors.toList());
      response.put("replyText", active.isEmpty()
          ? "当前没有处理中报修。"
          : "你当前有 " + active.size() + " 条处理中或待处理报修。");
      response.put("action", mapOf("type", "query_repair", "params", mapOf(
          "communityId", context.getOrDefault("communityId", ""),
          "houseId", context.getOrDefault("houseId", "")
      )));
      response.put("quickReplies", Arrays.asList("提交报修", "查看报修详情", "查物业费", "转人工"));
      response.put("reason", "报修查询");
      return response;
    }
    if ("create_repair".equals(intent) || input.contains("漏") || input.contains("坏") || input.contains("报修")) {
      Map<String, Object> draft = draftRepair(token, mapOf("inputText", input));
      response.put("replyText", String.valueOf(draft.getOrDefault("suggestion", "建议补充地点、是否可上门和联系人电话。")));
      response.put("needConfirm", true);
      response.put("action", mapOf("type", "create_repair", "params", mapOf(
          "title", draft.getOrDefault("title", input.isEmpty() ? "报修内容" : input),
          "category", draft.getOrDefault("category", "other"),
          "suggestion", draft.getOrDefault("suggestion", ""),
          "communityId", context.getOrDefault("communityId", ""),
          "houseId", context.getOrDefault("houseId", ""),
          "room", context.getOrDefault("room", ""),
          "phone", context.getOrDefault("phone", "")
      )));
      response.put("quickReplies", Arrays.asList("确认提交报修", "再补充一下", "查报修", "转人工"));
      response.put("reason", "报修草稿");
      return response;
    }
    if ("create_feedback".equals(intent) || input.contains("投诉") || input.contains("表扬") || input.contains("反馈")) {
      Map<String, Object> draft = draftFeedback(token, mapOf("inputText", input));
      response.put("replyText", String.valueOf(draft.getOrDefault("suggestion", "建议补充楼栋、时间和具体影响。")));
      response.put("needConfirm", true);
      response.put("action", mapOf("type", "create_feedback", "params", mapOf(
          "title", draft.getOrDefault("title", input.isEmpty() ? "反馈内容" : input),
          "category", draft.getOrDefault("category", "其他"),
          "suggestion", draft.getOrDefault("suggestion", ""),
          "communityId", context.getOrDefault("communityId", ""),
          "houseId", context.getOrDefault("houseId", ""),
          "room", context.getOrDefault("room", ""),
          "phone", context.getOrDefault("phone", "")
      )));
      response.put("quickReplies", Arrays.asList("确认提交投诉", "再补充一下", "查公告", "转人工"));
      response.put("reason", "投诉/表扬草稿");
      return response;
    }
    if ("handoff".equals(intent) || input.contains("人工") || input.contains("客服") || input.contains("找主管")) {
      response.put("replyText", "已为你转人工，稍后会有工作人员跟进。");
      response.put("handoff", true);
      response.put("needConfirm", false);
      response.put("action", mapOf("type", "handoff", "params", mapOf(
          "communityId", context.getOrDefault("communityId", ""),
          "houseId", context.getOrDefault("houseId", "")
      )));
      response.put("quickReplies", Arrays.asList("继续问物业费", "继续查报修", "提交投诉", "提交报修"));
      response.put("reason", "用户请求转人工");
      return response;
    }
    if ("query_notice".equals(intent) || input.contains("公告")) {
      List<Map<String, Object>> noticesList = listNotices();
      String title = noticesList.isEmpty() ? "暂无公告" : String.valueOf(noticesList.get(0).getOrDefault("title", "最新公告"));
      response.put("replyText", noticesList.isEmpty() ? "当前没有最新公告。" : "我查到最新公告：" + title);
      response.put("action", mapOf("type", "query_notice", "params", mapOf("communityId", context.getOrDefault("communityId", ""))));
      response.put("quickReplies", Arrays.asList("查看公告", "查物业费", "提交报修", "转人工"));
      response.put("reason", "公告查询");
      return response;
    }
      response.put("replyText", "我先帮你看着，你可以继续补充更具体的信息，或者直接点下方快捷入口，我来接着办。");
      response.put("quickReplies", Arrays.asList("查物业费", "查报修", "提交报修", "提交投诉", "转人工"));
      response.put("reason", "通用回复");
      return response;
  }

  private boolean truthy(Object value) {
    if (value == null) {
      return false;
    }
    if (value instanceof Boolean) {
      return (Boolean) value;
    }
    String text = String.valueOf(value).trim().toLowerCase();
    return "true".equals(text) || "1".equals(text) || "yes".equals(text) || "y".equals(text) || "是".equals(text);
  }

  private String normalizeSeverityValue(String value) {
    String text = value == null ? "" : value.trim().toLowerCase();
    if ("high".equals(text) || "高".equals(text) || "urgent".equals(text)) {
      return "high";
    }
    if ("medium".equals(text) || "中".equals(text) || "normal".equals(text)) {
      return "medium";
    }
    if ("low".equals(text) || "低".equals(text)) {
      return "low";
    }
    return text.isEmpty() ? "medium" : text;
  }

  private Object firstNonEmpty(Object... values) {
    if (values == null) {
      return null;
    }
    for (Object value : values) {
      if (value != null && !String.valueOf(value).trim().isEmpty()) {
        return value;
      }
    }
    return null;
  }

  private String buildEndpoint(String base, String path) {
    String normalizedBase = base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
    String normalizedPath = path.startsWith("/") ? path : "/" + path;
    return normalizedBase + normalizedPath;
  }

  private Map<String, Object> parseJsonObject(String json) {
    try {
      String candidate = extractJsonCandidate(stripMarkdownFence(json));
      if (candidate.isEmpty()) {
        candidate = json == null ? "" : json.trim();
      }
      return objectMapper.readValue(candidate, Map.class);
    } catch (Exception error) {
      return new LinkedHashMap<>();
    }
  }

  @Override
  public Map<String, Object> adminPushComplaintQueueToFeishu(String id, Map<String, Object> payload) {
    Map<String, Object> queueItem = ensureComplaintQueueItem(id);
    if (!"done".equals(String.valueOf(queueItem.get("analysisStatus")))) {
      queueItem = adminAnalyzeComplaintQueue(id, payload == null ? new LinkedHashMap<>() : payload);
    }
    String message = buildFeishuComplaintMessage(queueItem, payload);
    String webhook = resolveFeishuWebhook("customer");
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("message", message);
    result.put("webhookEnabled", !webhook.isEmpty());
    result.put("pushTime", now());
    if (webhook.isEmpty()) {
      queueItem.put("pushStatus", "prepared");
      queueItem.put("pushResult", "未配置飞书 webhook，仅返回待发送消息");
      queueItem.put("pushTime", now());
      queueItem.put("updateTime", now());
      complaintQueue.put(String.valueOf(queueItem.get("id")), queueItem);
      persistAll();
      result.put("pushStatus", "prepared");
      result.put("pushResult", "未配置飞书 webhook");
      return result;
    }
    try {
      String responseBody = postJson(webhook, mapOf(
          "msg_type", "text",
          "content", mapOf("text", message)
      ));
      queueItem.put("pushStatus", "sent");
      queueItem.put("pushResult", responseBody);
      queueItem.put("pushTime", now());
      queueItem.put("updateTime", now());
      complaintQueue.put(String.valueOf(queueItem.get("id")), queueItem);
      persistAll();
      result.put("pushStatus", "sent");
      result.put("pushResult", responseBody);
      return result;
    } catch (Exception error) {
      queueItem.put("pushStatus", "failed");
      queueItem.put("pushError", error.getMessage());
      queueItem.put("pushTime", now());
      queueItem.put("updateTime", now());
      complaintQueue.put(String.valueOf(queueItem.get("id")), queueItem);
      persistAll();
      result.put("pushStatus", "failed");
      result.put("pushError", error.getMessage());
      return result;
    }
  }

  private String resolveFeishuWebhook(String channel) {
    String normalized = String.valueOf(channel == null ? "" : channel).trim().toLowerCase();
    if ("repair".equals(normalized)) {
      return feishuRepairWebhookUrl == null ? "" : feishuRepairWebhookUrl.trim();
    }
    if ("life".equals(normalized)) {
      return feishuLifeWebhookUrl == null ? "" : feishuLifeWebhookUrl.trim();
    }
    return feishuCustomerWebhookUrl == null ? "" : feishuCustomerWebhookUrl.trim();
  }

  private void notifyRepairFeishu(Map<String, Object> repair, String title) throws Exception {
    String webhook = resolveFeishuWebhook("repair");
    if (webhook.isEmpty()) {
      return;
    }
    StringBuilder builder = new StringBuilder();
    builder.append("【").append(title == null || title.isEmpty() ? "报修通知" : title).append("】\n");
    builder.append("小区: ").append(repair.getOrDefault("community", "-")).append("\n");
    builder.append("房屋: ").append(firstNonEmpty(repair.get("houseNo"), repair.get("room"), repair.get("building"), "-")).append("\n");
    builder.append("标题: ").append(repair.getOrDefault("title", "-")).append("\n");
    builder.append("分类: ").append(repair.getOrDefault("categoryName", repair.getOrDefault("category", "-"))).append("\n");
    builder.append("状态: ").append(repair.getOrDefault("statusName", repair.getOrDefault("status", "-"))).append("\n");
    builder.append("描述: ").append(repair.getOrDefault("description", "-")).append("\n");
    builder.append("处理人: ").append(firstNonEmpty(repair.get("handler"), repair.get("handlerName"), "未分派"));
    postJson(webhook, mapOf("msg_type", "text", "content", mapOf("text", builder.toString())));
  }

  private void notifyLifeServiceFeishu(String title, Map<String, Object> payload, String scene) throws Exception {
    String webhook = resolveFeishuWebhook("life");
    if (webhook.isEmpty()) {
      return;
    }
    StringBuilder builder = new StringBuilder();
    builder.append("【").append(title == null || title.isEmpty() ? "生活服务通知" : title).append("】\n");
    builder.append("小区: ").append(payload.getOrDefault("community", "-")).append("\n");
    builder.append("场景: ").append(scene == null || scene.isEmpty() ? "-" : scene).append("\n");
    if (payload.containsKey("company")) {
      builder.append("公司: ").append(payload.getOrDefault("company", "-")).append("\n");
    }
    if (payload.containsKey("orderNo")) {
      builder.append("订单号: ").append(payload.getOrDefault("orderNo", "-")).append("\n");
      builder.append("金额: ").append(payload.getOrDefault("totalAmount", "-")).append("\n");
    }
    if (payload.containsKey("code")) {
      builder.append("取件码: ").append(payload.getOrDefault("code", "-")).append("\n");
      builder.append("状态: ").append(payload.getOrDefault("statusText", payload.getOrDefault("status", "-"))).append("\n");
    }
    postJson(webhook, mapOf("msg_type", "text", "content", mapOf("text", builder.toString())));
  }

  private List<String> resolveAssistantHandoffMentionTargets(Map<String, Object> session) {
    List<String> targets = new ArrayList<>();
    Map<String, Object> communityRecord = communityRecordById(textValue(session == null ? null : session.get("communityId")));
    String defaultName = textValue(communityRecord.getOrDefault("defaultSupervisor", currentSupervisorName()));
    if (!defaultName.isEmpty()) {
      targets.add(defaultName);
    }
    for (String name : normalizeStringList(communityRecord.get("supervisors"))) {
      if (!name.isEmpty() && !targets.contains(name)) {
        targets.add(name);
      }
    }
    return targets;
  }

  private String buildAssistantHandoffMessage(Map<String, Object> session, Map<String, Object> result) {
    StringBuilder builder = new StringBuilder();
    builder.append("【智能助手转人工】\n");
    builder.append("小区: ").append(firstNonEmpty(session == null ? null : session.get("community"), "-")).append("\n");
    builder.append("房屋: ").append(firstNonEmpty(
        session == null ? null : session.get("room"),
        session == null ? null : session.get("houseNo"),
        session == null ? null : session.get("houseId"),
        "-")).append("\n");
    builder.append("用户: ").append(firstNonEmpty(session == null ? null : session.get("userName"), "-")).append("\n");
    builder.append("原因: ").append(firstNonEmpty(result == null ? null : result.get("reason"), "用户请求转人工")).append("\n");
    builder.append("工单号: ").append(firstNonEmpty(result == null ? null : result.get("ticketId"), "-")).append("\n");
    List<String> mentions = resolveFeishuMentionTags(session, resolveAssistantHandoffMentionTargets(session));
    if (!mentions.isEmpty()) {
      builder.append("提醒对象: ").append(String.join(" ", mentions)).append("\n");
    }
    builder.append("会话: ").append(firstNonEmpty(session == null ? null : session.get("id"), "-"));
    return builder.toString().trim();
  }

  private Map<String, Object> notifyAssistantHandoffFeishu(Map<String, Object> session, Map<String, Object> result) {
    Map<String, Object> notify = new LinkedHashMap<>();
    String webhook = resolveFeishuWebhook("customer");
    notify.put("webhookEnabled", !webhook.isEmpty());
    if (webhook.isEmpty()) {
      notify.put("pushStatus", "prepared");
      notify.put("pushResult", "未配置客服飞书 webhook");
      return notify;
    }
    String message = buildAssistantHandoffMessage(session, result);
    try {
      String responseBody = postJson(webhook, mapOf(
          "msg_type", "text",
          "content", mapOf("text", message)
      ));
      notify.put("pushStatus", "sent");
      notify.put("pushResult", responseBody);
      return notify;
    } catch (Exception error) {
      notify.put("pushStatus", "failed");
      notify.put("pushError", error.getMessage());
      return notify;
    }
  }

  @Override
  public List<Map<String, Object>> adminListComplaintRules() {
    return sortedValues(complaintRules);
  }

  @Override
  public Map<String, Object> adminGetComplaintRule(String id) {
    return findById(complaintRules, id, "投诉规则");
  }

  @Override
  public Map<String, Object> adminSaveComplaintRule(Map<String, Object> payload) {
    String id = payload.get("id") == null || String.valueOf(payload.get("id")).isEmpty()
        ? newId()
        : String.valueOf(payload.get("id"));
    String communityId = communityIdByName(String.valueOf(payload.getOrDefault("community", currentCommunityName())));
    String communityName = String.valueOf(payload.getOrDefault("community", communityNameById(communityId)));
    Map<String, Object> rule = mapOf(
        "id", id,
        "name", payload.getOrDefault("name", "未命名规则"),
        "enabled", payload.getOrDefault("enabled", true),
        "priority", payload.getOrDefault("priority", 0),
        "severity", payload.getOrDefault("severity", "medium"),
        "matchKeywords", normalizeStringList(payload.get("matchKeywords")),
        "matchCategories", normalizeStringList(payload.get("matchCategories")),
        "matchBuildings", normalizeStringList(payload.get("matchBuildings")),
        "supervisorName", payload.getOrDefault("supervisorName", currentSupervisorName()),
        "mentionTargets", normalizeStringList(payload.get("mentionTargets")),
        "communityId", communityId,
        "community", communityName,
        "onlyCurrentCommunityStaff", payload.getOrDefault("onlyCurrentCommunityStaff", true),
        "autoPush", payload.getOrDefault("autoPush", false),
        "autoAnalyze", payload.getOrDefault("autoAnalyze", true),
        "remark", payload.getOrDefault("remark", ""),
        "createTime", complaintRules.containsKey(id) ? String.valueOf(complaintRules.get(id).getOrDefault("createTime", now())) : now(),
        "updateTime", now()
    );
    complaintRules.put(id, rule);
    persistAll();
    return cloneMap(rule);
  }

  @Override
  public void adminDeleteComplaintRule(String id) {
    if (complaintRules.remove(id) == null) {
      throw new BusinessException(404, "投诉规则不存在");
    }
    persistAll();
  }

  private Map<String, Object> enqueueComplaintQueue(Map<String, Object> feedback) {
    if (feedback == null) {
      return null;
    }
    String id = String.valueOf(feedback.get("id"));
    String communityId = communityIdByName(communityNameForFeedback(feedback));
    String communityName = String.valueOf(feedback.getOrDefault("community", communityNameById(communityId)));
    Map<String, Object> queueItem = new LinkedHashMap<>();
    queueItem.put("id", id);
    queueItem.put("feedbackId", id);
    queueItem.put("type", feedback.getOrDefault("type", "投诉"));
    queueItem.put("communityId", communityId);
    queueItem.put("community", communityName);
    queueItem.put("category", feedback.getOrDefault("category", ""));
    queueItem.put("content", feedback.getOrDefault("content", ""));
    queueItem.put("title", feedback.getOrDefault("title", feedback.getOrDefault("category", "投诉")));
    queueItem.put("location", feedback.getOrDefault("location", ""));
    queueItem.put("phone", feedback.getOrDefault("phone", ""));
    queueItem.put("staffName", feedback.getOrDefault("staffName", ""));
    queueItem.put("staffPosition", feedback.getOrDefault("staffPosition", ""));
    queueItem.put("openid", feedback.getOrDefault("openid", ""));
    queueItem.put("status", feedback.getOrDefault("status", "pending"));
    queueItem.put("statusText", feedback.getOrDefault("statusText", "待处理"));
    queueItem.put("feedbackReply", feedback.getOrDefault("reply", ""));
    queueItem.put("analysisStatus", "pending");
    queueItem.put("pushStatus", "pending");
    queueItem.put("summary", buildComplaintSummary(feedback));
    queueItem.put("severity", severityForComplaint(String.valueOf(feedback.getOrDefault("content", "")), null));
    queueItem.put("keywords", complaintKeywords(String.valueOf(feedback.getOrDefault("content", ""))));
    Map<String, Object> rule = matchComplaintRule(queueItem);
    Map<String, Object> complaintCommunity = communityByName(String.valueOf(queueItem.getOrDefault("community", "")));
    queueItem.put("ruleId", rule == null ? "" : String.valueOf(rule.get("id")));
    queueItem.put("ruleName", rule == null ? "" : String.valueOf(rule.get("name")));
    String communitySupervisor = String.valueOf(complaintCommunity.getOrDefault("defaultSupervisor", currentSupervisorName()));
    queueItem.put("supervisorName", rule == null ? communitySupervisor : String.valueOf(rule.getOrDefault("supervisorName", communitySupervisor)));
    queueItem.put("mentionTargets", rule == null ? Arrays.asList(communitySupervisor) : normalizeMentionTargets(rule.get("mentionTargets")));
    queueItem.put("createTime", feedback.getOrDefault("createTime", now()));
    queueItem.put("updateTime", now());
    complaintQueue.put(id, queueItem);
    persistAll();
    return queueItem;
  }

  private void syncComplaintQueueFromFeedback(Map<String, Object> feedback) {
    if (feedback == null || !"投诉".equals(String.valueOf(feedback.get("type")))) {
      return;
    }
    String id = String.valueOf(feedback.get("id"));
    Map<String, Object> queueItem = complaintQueue.get(id);
    if (queueItem == null) {
      queueItem = enqueueComplaintQueue(feedback);
    }
    queueItem.put("status", feedback.getOrDefault("status", "pending"));
    queueItem.put("statusText", feedback.getOrDefault("statusText", "待处理"));
    queueItem.put("feedbackReply", feedback.getOrDefault("reply", ""));
    queueItem.put("feedbackReplyTime", feedback.getOrDefault("replyTime", ""));
    queueItem.put("updateTime", now());
    if ("replied".equals(String.valueOf(feedback.get("status")))) {
      queueItem.put("analysisStatus", queueItem.getOrDefault("analysisStatus", "done"));
      queueItem.put("pushStatus", queueItem.getOrDefault("pushStatus", "sent"));
    }
    complaintQueue.put(id, queueItem);
    persistAll();
  }

  private Map<String, Object> ensureComplaintQueueItem(String id) {
    Map<String, Object> queueItem = complaintQueue.get(id);
    if (queueItem != null) {
      return queueItem;
    }
    Map<String, Object> feedback = feedbacks.get(id);
    if (feedback != null && "投诉".equals(String.valueOf(feedback.get("type")))) {
      return enqueueComplaintQueue(feedback);
    }
    throw new BusinessException(404, "投诉队列不存在");
  }

  private Map<String, Object> matchComplaintRule(Map<String, Object> complaint) {
    String content = String.valueOf(complaint.getOrDefault("content", ""));
    String category = String.valueOf(complaint.getOrDefault("category", ""));
    String title = String.valueOf(complaint.getOrDefault("title", ""));
    String building = String.valueOf(complaint.getOrDefault("location", ""));
    List<Map<String, Object>> enabledRules = complaintRules.values().stream()
        .filter(rule -> Boolean.parseBoolean(String.valueOf(rule.getOrDefault("enabled", true))))
        .sorted(Comparator.comparingInt(rule -> -Integer.parseInt(String.valueOf(rule.getOrDefault("priority", 0)))))
        .collect(Collectors.toList());
    for (Map<String, Object> rule : enabledRules) {
      List<String> keywords = normalizeStringList(rule.get("matchKeywords"));
      List<String> categories = normalizeStringList(rule.get("matchCategories"));
      List<String> buildings = normalizeStringList(rule.get("matchBuildings"));
      if (containsAny(content, keywords) || containsAny(title, keywords) || containsAny(category, categories) || containsAny(building, buildings)) {
        return cloneMap(rule);
      }
    }
    return enabledRules.isEmpty() ? null : cloneMap(enabledRules.get(0));
  }

  private List<String> complaintKeywords(String content) {
    List<String> keywords = new ArrayList<>();
    if (content == null) {
      return keywords;
    }
    List<String> dictionary = Arrays.asList("漏水", "停电", "电梯", "燃气", "冒烟", "火警", "淹水", "停水", "噪音", "施工", "扰民", "卫生", "垃圾", "快递", "车辆");
    for (String word : dictionary) {
      if (content.contains(word)) {
        keywords.add(word);
      }
    }
    return keywords;
  }

  private String severityForComplaint(String content, Map<String, Object> rule) {
    List<String> urgentKeywords = Arrays.asList("漏水", "停电", "电梯", "燃气", "冒烟", "火警", "淹水", "停水");
    List<String> mediumKeywords = Arrays.asList("噪音", "施工", "扰民", "卫生", "垃圾", "车辆");
    if (containsAny(content, urgentKeywords) || "high".equalsIgnoreCase(rule == null ? "" : String.valueOf(rule.getOrDefault("severity", "")))) {
      return "high";
    }
    if (containsAny(content, mediumKeywords) || "medium".equalsIgnoreCase(rule == null ? "" : String.valueOf(rule.getOrDefault("severity", "")))) {
      return "medium";
    }
    return "low";
  }

  private String buildComplaintSummary(Map<String, Object> complaint) {
    String text = String.valueOf(complaint.getOrDefault("content", complaint.getOrDefault("description", "")));
    if (text.length() <= 60) {
      return text;
    }
    return text.substring(0, 60) + "...";
  }

  private String suggestedComplaintAction(String severity) {
    if ("high".equalsIgnoreCase(severity)) {
      return "立即处理并通知主管";
    }
    if ("medium".equalsIgnoreCase(severity)) {
      return "尽快处理并跟进回访";
    }
    return "普通工单流转";
  }

  private List<String> normalizeMentionTargets(Object value) {
    List<String> list = normalizeStringList(value);
    if (list.isEmpty()) {
      list.add(currentSupervisorName());
    }
    return list;
  }

  private List<String> normalizeStringList(Object value) {
    if (value == null) {
      return new ArrayList<>();
    }
    if (value instanceof List) {
      List<String> list = new ArrayList<>();
      for (Object item : (List<?>) value) {
        if (item != null && !String.valueOf(item).isEmpty()) {
          list.add(String.valueOf(item));
        }
      }
      return list;
    }
    String text = String.valueOf(value).trim();
    if (text.isEmpty()) {
      return new ArrayList<>();
    }
    if (text.contains("、") || text.contains(",") || text.contains(";") || text.contains("|")) {
      String[] parts = text.split("[、,;|]");
      List<String> list = new ArrayList<>();
      for (String part : parts) {
        String item = part.trim();
        if (!item.isEmpty()) {
          list.add(item);
        }
      }
      return list;
    }
    return new ArrayList<>(Collections.singletonList(text));
  }

  private boolean containsAny(String text, List<String> keywords) {
    if (text == null || keywords == null || keywords.isEmpty()) {
      return false;
    }
    for (String keyword : keywords) {
      if (keyword != null && !keyword.isEmpty() && text.contains(keyword)) {
        return true;
      }
    }
    return false;
  }

  private String buildFeishuComplaintMessage(Map<String, Object> complaint, Map<String, Object> payload) {
    String severity = severityDisplayLabel(String.valueOf(complaint.getOrDefault("severity", "medium")));
    List<String> mentionTargets = normalizeMentionTargets(complaint.get("mentionTargets"));
    List<String> mentionTags = resolveFeishuMentionTags(complaint, mentionTargets);
    String mentionLine = mentionTargets.isEmpty()
        ? ""
        : "提醒对象: " + (mentionTags.isEmpty() ? String.join("、", mentionTargets) : String.join(" ", mentionTags));
    StringBuilder builder = new StringBuilder();
    builder.append("【投诉待处理】");
    builder.append(String.valueOf(complaint.getOrDefault("title", complaint.getOrDefault("category", "投诉"))));
    builder.append("\n");
    builder.append("投诉编号: ").append(complaint.getOrDefault("id", "")).append("\n");
    builder.append("小区: ").append(complaint.getOrDefault("community", "-")).append("\n");
    builder.append("楼栋/位置: ").append(complaint.getOrDefault("location", "-")).append("\n");
    builder.append("严重等级: ").append(severity).append("\n");
    builder.append("摘要: ").append(complaint.getOrDefault("summary", "")).append("\n");
    builder.append("详情: ").append(complaint.getOrDefault("content", "")).append("\n");
    if (!mentionLine.isEmpty()) {
      builder.append(mentionLine).append("\n");
    }
    Object extraRemark = payload == null ? null : payload.get("remark");
    if (extraRemark != null && !String.valueOf(extraRemark).isEmpty()) {
      builder.append("备注: ").append(extraRemark).append("\n");
    }
    return builder.toString().trim();
  }

  private String severityDisplayLabel(String severity) {
    if ("high".equalsIgnoreCase(severity)) {
      return "高";
    }
    if ("medium".equalsIgnoreCase(severity)) {
      return "中";
    }
    if ("low".equalsIgnoreCase(severity)) {
      return "低";
    }
    return severity == null || severity.trim().isEmpty() ? "中" : severity;
  }

  private List<String> resolveFeishuMentionTags(Map<String, Object> complaint, List<String> mentionTargets) {
    if (mentionTargets == null || mentionTargets.isEmpty()) {
      return new ArrayList<>();
    }
    String communityName = String.valueOf(complaint == null ? "" : complaint.getOrDefault("community", ""));
    List<String> tags = new ArrayList<>();
    for (String target : mentionTargets) {
      Map<String, Object> staff = findStaffByNameForCommunity(target, communityName);
      if (staff == null) {
        continue;
      }
      String displayName = String.valueOf(staff.getOrDefault("feishuDisplayName", staff.getOrDefault("name", target))).trim();
      String userId = textValue(staff.get("feishuUserId"));
      if (!userId.isEmpty()) {
        tags.add("<at user_id=\"" + escapeXml(userId) + "\">" + escapeXml(displayName.isEmpty() ? target : displayName) + "</at>");
      }
    }
    return tags;
  }

  private Map<String, Object> findStaffByNameForCommunity(String name, String communityName) {
    String target = textValue(name);
    if (target.isEmpty()) {
      return null;
    }
    String trimmedCommunity = textValue(communityName);
    return staffs.values().stream()
        .filter(staff -> target.equals(textValue(staff.get("name")))
            || target.equals(textValue(staff.get("feishuDisplayName"))))
        .filter(staff -> {
          String staffCommunity = textValue(staff.get("community"));
          return trimmedCommunity.isEmpty() || staffCommunity.isEmpty() || trimmedCommunity.equals(staffCommunity);
        })
        .findFirst()
        .map(this::cloneMap)
        .orElse(null);
  }

  private String escapeXml(String value) {
    if (value == null) {
      return "";
    }
    return value
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;")
        .replace("'", "&apos;");
  }

  private String postJson(String url, Map<String, Object> payload) throws Exception {
    String body = toJson(payload);
    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(url))
        .header("Content-Type", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString(body))
        .build();
    HttpResponse<String> response = HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
    if (response.statusCode() < 200 || response.statusCode() >= 300) {
      throw new BusinessException(response.statusCode(), "飞书推送失败");
    }
    return response.body();
  }

  private String postJsonWithAuth(String url, Map<String, Object> payload, String apiKey) throws Exception {
    String body = toJson(payload);
    HttpRequest.Builder builder = HttpRequest.newBuilder()
        .uri(URI.create(url))
        .header("Content-Type", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString(body));
    if (apiKey != null && !apiKey.trim().isEmpty()) {
      builder.header("Authorization", "Bearer " + apiKey.trim());
    }
    HttpResponse<String> response = HttpClient.newHttpClient().send(builder.build(), HttpResponse.BodyHandlers.ofString());
    if (response.statusCode() < 200 || response.statusCode() >= 300) {
      throw new BusinessException(response.statusCode(), "智能引擎调用失败");
    }
    return response.body();
  }

  private String toJson(Object value) {
    if (value == null) {
      return "null";
    }
    if (value instanceof Map) {
      StringBuilder builder = new StringBuilder();
      builder.append("{");
      boolean first = true;
      for (Map.Entry<?, ?> entry : ((Map<?, ?>) value).entrySet()) {
        if (!first) {
          builder.append(",");
        }
        first = false;
        builder.append("\"").append(escapeJson(String.valueOf(entry.getKey()))).append("\":");
        builder.append(toJson(entry.getValue()));
      }
      builder.append("}");
      return builder.toString();
    }
    if (value instanceof List) {
      StringBuilder builder = new StringBuilder();
      builder.append("[");
      boolean first = true;
      for (Object item : (List<?>) value) {
        if (!first) {
          builder.append(",");
        }
        first = false;
        builder.append(toJson(item));
      }
      builder.append("]");
      return builder.toString();
    }
    if (value instanceof Number || value instanceof Boolean) {
      return String.valueOf(value);
    }
    return "\"" + escapeJson(String.valueOf(value)) + "\"";
  }

  private String escapeJson(String value) {
    return value
        .replace("\\", "\\\\")
        .replace("\"", "\\\"")
        .replace("\n", "\\n")
        .replace("\r", "\\r")
        .replace("\t", "\\t");
  }

  private String currentSupervisorName() {
    Object value = community.get("defaultSupervisor");
    String text = value == null ? "" : String.valueOf(value).trim();
    return text.isEmpty() ? defaultSupervisor : text;
  }

  private String currentCommunityName() {
    Object value = community.get("projectName");
    if (value == null || String.valueOf(value).trim().isEmpty()) {
      value = community.get("name");
    }
    String text = value == null ? "" : String.valueOf(value).trim();
    return text.isEmpty() ? "阳光花园小区" : text;
  }

  private String currentCommunityId() {
    Object value = community.get("id");
    String text = value == null ? "" : String.valueOf(value).trim();
    return text.isEmpty() ? "community" : text;
  }

  private String communityIdByName(String name) {
    String target = textValue(name);
    if (target.isEmpty()) {
      return currentCommunityId();
    }
    return communities.values().stream()
        .filter(item -> target.equals(textValue(item.get("projectName"))) || target.equals(textValue(item.get("name"))))
        .map(item -> textValue(item.get("id")))
        .filter(id -> !id.isEmpty())
        .findFirst()
        .orElseGet(this::currentCommunityId);
  }

  private String communityNameById(String id) {
    String target = textValue(id);
    if (target.isEmpty()) {
      return currentCommunityName();
    }
    Map<String, Object> record = communities.get(target);
    if (record == null) {
      return currentCommunityName();
    }
    String projectName = textValue(record.get("projectName"));
    if (!projectName.isEmpty()) {
      return projectName;
    }
    String name = textValue(record.get("name"));
    return name.isEmpty() ? currentCommunityName() : name;
  }

  private Map<String, Object> communityRecordById(String id) {
    String target = textValue(id);
    if (target.isEmpty()) {
      return activeCommunityRecord();
    }
    Map<String, Object> record = communities.get(target);
    if (record == null) {
      return activeCommunityRecord();
    }
    Map<String, Object> item = cloneMap(record);
    normalizeCommunityFeatureFlags(item);
    item.putIfAbsent("defaultSupervisor", defaultSupervisor);
    item.putIfAbsent("supervisors", Arrays.asList(String.valueOf(item.getOrDefault("defaultSupervisor", defaultSupervisor))));
    return item;
  }

  private Map<String, Object> defaultAssistantSettings(String communityId) {
    Map<String, Object> communityRecord = communityRecordById(communityId);
    String normalizedCommunityId = textValue(communityRecord.get("id"));
    if (normalizedCommunityId.isEmpty()) {
      normalizedCommunityId = currentCommunityId();
    }
    String normalizedCommunityName = String.valueOf(communityRecord.getOrDefault("projectName", communityRecord.getOrDefault("name", currentCommunityName())));
    String supervisor = String.valueOf(communityRecord.getOrDefault("defaultSupervisor", currentSupervisorName()));
    List<String> supervisors = normalizeStringList(communityRecord.get("supervisors"));
    if (supervisors.isEmpty() && !supervisor.isEmpty()) {
      supervisors = Arrays.asList(supervisor);
    }
    String deepseekLocalBaseUrl = defaultDeepseekLocalBaseUrl();
    String deepseekRemoteBaseUrl = defaultDeepseekRemoteBaseUrl();
    String openclawLocalBaseUrl = defaultOpenclawLocalBaseUrl();
    String openclawRemoteBaseUrl = defaultOpenclawRemoteBaseUrl();
    Map<String, Object> settings = mapOf(
        "id", normalizedCommunityId,
        "communityId", normalizedCommunityId,
        "community", normalizedCommunityName,
        "enabled", true,
        "assistantName", "物业AI客服",
        "assistantProvider", normalizeAssistantProvider(assistantProvider, deepseekBaseUrl),
        "deepseekMode", "remote",
        "deepseekBaseUrl", deepseekRemoteBaseUrl,
        "deepseekLocalBaseUrl", deepseekLocalBaseUrl,
        "deepseekRemoteBaseUrl", deepseekRemoteBaseUrl,
        "deepseekChatPath", "/chat/completions",
        "deepseekModel", deepseekModel,
        "deepseekApiKey", "",
        "deepseekTemperature", deepseekTemperature,
        "deepseekMaxTokens", deepseekMaxTokens,
        "openclawMode", "local",
        "openclawBaseUrl", openclawLocalBaseUrl,
        "openclawLocalBaseUrl", openclawLocalBaseUrl,
        "openclawRemoteBaseUrl", openclawRemoteBaseUrl,
        "openclawModel", "openclaw-assistant",
        "openclawSessionPath", "/session/{sessionId}",
        "openclawMessagePath", "/api/v1/assistant/messages",
        "openclawHandoffPath", "/api/v1/assistant/handoff",
        "gemmaMode", "local",
        "gemmaBaseUrl", defaultGemmaLocalBaseUrl(),
        "gemmaLocalBaseUrl", defaultGemmaLocalBaseUrl(),
        "gemmaRemoteBaseUrl", defaultGemmaRemoteBaseUrl(),
        "gemmaChatPath", "/api/chat",
        "gemmaModel", gemmaModel,
        "gemmaTemperature", gemmaTemperature,
        "gemmaMaxTokens", gemmaMaxTokens,
        "promptVersion", "v1",
        "analysisTimeoutMs", Math.max(1000L, openclawAnalysisTimeoutMs),
        "fallbackToHeuristic", true,
        "autoCreateSession", true,
        "autoSaveHistory", true,
        "autoHandoff", true,
        "promptTemplate", "你是物业智能助手，只回答当前小区和当前房屋的问题。输出严格结构化结果。",
        "enabledScenes", Arrays.asList("query_bill", "query_repair", "create_repair", "create_feedback", "query_notice", "handoff"),
        "handoffKeywords", Arrays.asList("人工", "客服", "投诉升级", "找主管"),
        "defaultSupervisor", supervisor,
        "supervisors", supervisors,
        "createTime", now(),
        "updateTime", now()
    );
    return settings;
  }

  private Map<String, Object> assistantSettingsRecord(String communityId) {
    String target = textValue(communityId);
    if (target.isEmpty()) {
      target = currentCommunityId();
    }
    Map<String, Object> record = assistantSettings.get(target);
    if (record != null) {
      Map<String, Object> item = cloneMap(record);
      Map<String, Object> communityRecord = communityRecordById(target);
      item.putIfAbsent("communityId", target);
      item.putIfAbsent("community", communityNameById(target));
      item.putIfAbsent("enabled", true);
      item.putIfAbsent("assistantName", "物业AI客服");
      item.put("assistantProvider", normalizeAssistantProvider(item.get("assistantProvider"), firstNonEmpty(item.get("deepseekBaseUrl"), item.get("gemmaBaseUrl"), item.get("openclawBaseUrl"))));
      item.put("deepseekMode", normalizeOpenclawMode(item.get("deepseekMode"), item.get("deepseekBaseUrl")));
      item.putIfAbsent("deepseekLocalBaseUrl", defaultDeepseekLocalBaseUrl());
      item.putIfAbsent("deepseekRemoteBaseUrl", defaultDeepseekRemoteBaseUrl());
      item.put("deepseekBaseUrl", resolveDeepseekBaseUrl(
          String.valueOf(item.getOrDefault("deepseekMode", "remote")),
          String.valueOf(item.getOrDefault("deepseekLocalBaseUrl", defaultDeepseekLocalBaseUrl())),
          String.valueOf(item.getOrDefault("deepseekRemoteBaseUrl", defaultDeepseekRemoteBaseUrl())),
          String.valueOf(item.getOrDefault("deepseekBaseUrl", deepseekBaseUrl))
      ));
      item.putIfAbsent("deepseekChatPath", "/chat/completions");
      item.putIfAbsent("deepseekModel", deepseekModel);
      item.put("deepseekApiKeySet", truthy(item.get("deepseekApiKey")));
      item.putIfAbsent("deepseekTemperature", deepseekTemperature);
      item.putIfAbsent("deepseekMaxTokens", deepseekMaxTokens);
      item.put("openclawMode", normalizeOpenclawMode(item.get("openclawMode"), item.get("openclawBaseUrl")));
      item.putIfAbsent("openclawLocalBaseUrl", defaultOpenclawLocalBaseUrl());
      item.putIfAbsent("openclawRemoteBaseUrl", defaultOpenclawRemoteBaseUrl());
      item.put("openclawBaseUrl", resolveOpenclawBaseUrl(
          String.valueOf(item.getOrDefault("openclawMode", "local")),
          String.valueOf(item.getOrDefault("openclawLocalBaseUrl", defaultOpenclawLocalBaseUrl())),
          String.valueOf(item.getOrDefault("openclawRemoteBaseUrl", defaultOpenclawRemoteBaseUrl())),
          String.valueOf(item.getOrDefault("openclawBaseUrl", openclawBaseUrl))
      ));
      item.putIfAbsent("openclawModel", "openclaw-assistant");
      item.putIfAbsent("openclawSessionPath", "/session/{sessionId}");
      item.putIfAbsent("openclawMessagePath", "/api/v1/assistant/messages");
      item.putIfAbsent("openclawHandoffPath", "/api/v1/assistant/handoff");
      item.put("gemmaMode", normalizeOpenclawMode(item.get("gemmaMode"), item.get("gemmaBaseUrl")));
      item.putIfAbsent("gemmaLocalBaseUrl", defaultGemmaLocalBaseUrl());
      item.putIfAbsent("gemmaRemoteBaseUrl", defaultGemmaRemoteBaseUrl());
      item.put("gemmaBaseUrl", resolveGemmaBaseUrl(
          String.valueOf(item.getOrDefault("gemmaMode", "local")),
          String.valueOf(item.getOrDefault("gemmaLocalBaseUrl", defaultGemmaLocalBaseUrl())),
          String.valueOf(item.getOrDefault("gemmaRemoteBaseUrl", defaultGemmaRemoteBaseUrl())),
          String.valueOf(item.getOrDefault("gemmaBaseUrl", defaultGemmaLocalBaseUrl()))
      ));
      item.putIfAbsent("gemmaChatPath", "/api/chat");
      item.putIfAbsent("gemmaModel", gemmaModel);
      item.putIfAbsent("gemmaTemperature", gemmaTemperature);
      item.putIfAbsent("gemmaMaxTokens", gemmaMaxTokens);
      item.putIfAbsent("promptVersion", "v1");
      item.putIfAbsent("analysisTimeoutMs", Math.max(1000L, openclawAnalysisTimeoutMs));
      item.putIfAbsent("fallbackToHeuristic", true);
      item.putIfAbsent("autoCreateSession", true);
      item.putIfAbsent("autoSaveHistory", true);
      item.putIfAbsent("autoHandoff", true);
      item.putIfAbsent("promptTemplate", "你是物业智能助手，只回答当前小区和当前房屋的问题。输出严格结构化结果。");
      item.putIfAbsent("enabledScenes", Arrays.asList("query_bill", "query_repair", "create_repair", "create_feedback", "query_notice", "handoff"));
      item.putIfAbsent("handoffKeywords", Arrays.asList("人工", "客服", "投诉升级", "找主管"));
      item.putIfAbsent("defaultSupervisor", currentSupervisorName());
      item.putIfAbsent("supervisors", normalizeStringList(communityRecord.get("supervisors")));
      item.putIfAbsent("createTime", now());
      item.put("updateTime", now());
      item.put("supervisors", normalizeStringList(item.get("supervisors")));
      return item;
    }
    return defaultAssistantSettings(target);
  }

  private Map<String, Object> upsertAssistantSettings(Map<String, Object> payload) {
    String communityId = textValue(payload.get("communityId"));
    if (communityId.isEmpty()) {
      communityId = currentCommunityId();
    }
    Map<String, Object> communityRecord = communityRecordById(communityId);
    String communityName = String.valueOf(payload.getOrDefault("community", communityRecord.getOrDefault("projectName", communityRecord.getOrDefault("name", currentCommunityName()))));
    Map<String, Object> previous = assistantSettings.getOrDefault(communityId, defaultAssistantSettings(communityId));
    Map<String, Object> record = new LinkedHashMap<>(previous);
    record.put("id", communityId);
    record.put("communityId", communityId);
    record.put("community", communityName);
    String provider = normalizeAssistantProvider(firstNonEmpty(payload.get("assistantProvider"), previous.get("assistantProvider"), assistantProvider), firstNonEmpty(payload.get("deepseekBaseUrl"), previous.get("deepseekBaseUrl"), payload.get("gemmaBaseUrl"), previous.get("gemmaBaseUrl"), payload.get("openclawBaseUrl"), previous.get("openclawBaseUrl"), openclawBaseUrl));
    record.put("assistantProvider", provider);
    String deepseekMode = normalizeOpenclawMode(firstNonEmpty(payload.get("deepseekMode"), previous.get("deepseekMode")), previous.get("deepseekBaseUrl"));
    String deepseekLocalBaseUrl = String.valueOf(firstNonEmpty(payload.get("deepseekLocalBaseUrl"), previous.get("deepseekLocalBaseUrl"), defaultDeepseekLocalBaseUrl()));
    String deepseekRemoteBaseUrl = String.valueOf(firstNonEmpty(payload.get("deepseekRemoteBaseUrl"), previous.get("deepseekRemoteBaseUrl"), defaultDeepseekRemoteBaseUrl()));
    record.put("deepseekMode", deepseekMode);
    record.put("deepseekLocalBaseUrl", deepseekLocalBaseUrl);
    record.put("deepseekRemoteBaseUrl", deepseekRemoteBaseUrl);
    record.put("deepseekBaseUrl", resolveDeepseekBaseUrl(
        deepseekMode,
        deepseekLocalBaseUrl,
        deepseekRemoteBaseUrl,
        String.valueOf(firstNonEmpty(payload.get("deepseekBaseUrl"), record.getOrDefault("deepseekBaseUrl", deepseekBaseUrl)))
    ));
    record.put("deepseekChatPath", String.valueOf(payload.getOrDefault("deepseekChatPath", record.getOrDefault("deepseekChatPath", "/chat/completions"))));
    record.put("deepseekModel", String.valueOf(payload.getOrDefault("deepseekModel", record.getOrDefault("deepseekModel", deepseekModel))));
    Object deepseekApiKeyValue = firstNonEmpty(payload.get("deepseekApiKey"), previous.get("deepseekApiKey"));
    if (deepseekApiKeyValue != null && !String.valueOf(deepseekApiKeyValue).trim().isEmpty()) {
      record.put("deepseekApiKey", String.valueOf(deepseekApiKeyValue));
    } else if (previous.containsKey("deepseekApiKey")) {
      record.put("deepseekApiKey", previous.get("deepseekApiKey"));
    } else {
      record.put("deepseekApiKey", "");
    }
    record.put("deepseekApiKeySet", truthy(record.get("deepseekApiKey")));
    Object deepseekTemperatureValue = firstNonEmpty(payload.get("deepseekTemperature"), previous.get("deepseekTemperature"), deepseekTemperature);
    try {
      record.put("deepseekTemperature", Double.parseDouble(String.valueOf(deepseekTemperatureValue)));
    } catch (Exception error) {
      record.put("deepseekTemperature", deepseekTemperature);
    }
    Object deepseekMaxTokensValue = firstNonEmpty(payload.get("deepseekMaxTokens"), previous.get("deepseekMaxTokens"), deepseekMaxTokens);
    try {
      record.put("deepseekMaxTokens", Integer.parseInt(String.valueOf(deepseekMaxTokensValue)));
    } catch (Exception error) {
      record.put("deepseekMaxTokens", deepseekMaxTokens);
    }
    String mode = normalizeOpenclawMode(firstNonEmpty(payload.get("openclawMode"), previous.get("openclawMode")), previous.get("openclawBaseUrl"));
    String localBaseUrl = String.valueOf(firstNonEmpty(payload.get("openclawLocalBaseUrl"), previous.get("openclawLocalBaseUrl"), defaultOpenclawLocalBaseUrl()));
    String remoteBaseUrl = String.valueOf(firstNonEmpty(payload.get("openclawRemoteBaseUrl"), previous.get("openclawRemoteBaseUrl"), defaultOpenclawRemoteBaseUrl()));
    record.put("enabled", payload.getOrDefault("enabled", record.getOrDefault("enabled", true)));
    record.put("assistantName", String.valueOf(payload.getOrDefault("assistantName", record.getOrDefault("assistantName", "物业AI客服"))));
    record.put("openclawMode", mode);
    record.put("openclawLocalBaseUrl", localBaseUrl);
    record.put("openclawRemoteBaseUrl", remoteBaseUrl);
    record.put("openclawBaseUrl", resolveOpenclawBaseUrl(
        mode,
        localBaseUrl,
        remoteBaseUrl,
        String.valueOf(firstNonEmpty(payload.get("openclawBaseUrl"), record.getOrDefault("openclawBaseUrl", openclawBaseUrl)))
    ));
    record.put("openclawModel", String.valueOf(payload.getOrDefault("openclawModel", record.getOrDefault("openclawModel", "openclaw-assistant"))));
    record.put("openclawSessionPath", String.valueOf(payload.getOrDefault("openclawSessionPath", record.getOrDefault("openclawSessionPath", "/session/{sessionId}"))));
    record.put("openclawMessagePath", String.valueOf(payload.getOrDefault("openclawMessagePath", record.getOrDefault("openclawMessagePath", "/api/v1/assistant/messages"))));
    record.put("openclawHandoffPath", String.valueOf(payload.getOrDefault("openclawHandoffPath", record.getOrDefault("openclawHandoffPath", "/api/v1/assistant/handoff"))));
    String gemmaMode = normalizeOpenclawMode(firstNonEmpty(payload.get("gemmaMode"), previous.get("gemmaMode")), previous.get("gemmaBaseUrl"));
    String gemmaLocalBaseUrl = String.valueOf(firstNonEmpty(payload.get("gemmaLocalBaseUrl"), previous.get("gemmaLocalBaseUrl"), defaultGemmaLocalBaseUrl()));
    String gemmaRemoteBaseUrl = String.valueOf(firstNonEmpty(payload.get("gemmaRemoteBaseUrl"), previous.get("gemmaRemoteBaseUrl"), defaultGemmaRemoteBaseUrl()));
    record.put("gemmaMode", gemmaMode);
    record.put("gemmaLocalBaseUrl", gemmaLocalBaseUrl);
    record.put("gemmaRemoteBaseUrl", gemmaRemoteBaseUrl);
    record.put("gemmaBaseUrl", resolveGemmaBaseUrl(
        gemmaMode,
        gemmaLocalBaseUrl,
        gemmaRemoteBaseUrl,
        String.valueOf(firstNonEmpty(payload.get("gemmaBaseUrl"), record.getOrDefault("gemmaBaseUrl", defaultGemmaLocalBaseUrl())))
    ));
    record.put("gemmaChatPath", String.valueOf(payload.getOrDefault("gemmaChatPath", record.getOrDefault("gemmaChatPath", "/api/chat"))));
    record.put("gemmaModel", String.valueOf(payload.getOrDefault("gemmaModel", record.getOrDefault("gemmaModel", gemmaModel))));
    Object gemmaTemperatureValue = firstNonEmpty(payload.get("gemmaTemperature"), record.get("gemmaTemperature"), gemmaTemperature);
    try {
      record.put("gemmaTemperature", Double.parseDouble(String.valueOf(gemmaTemperatureValue)));
    } catch (Exception error) {
      record.put("gemmaTemperature", gemmaTemperature);
    }
    Object gemmaMaxTokensValue = firstNonEmpty(payload.get("gemmaMaxTokens"), record.get("gemmaMaxTokens"), gemmaMaxTokens);
    try {
      record.put("gemmaMaxTokens", Integer.parseInt(String.valueOf(gemmaMaxTokensValue)));
    } catch (Exception error) {
      record.put("gemmaMaxTokens", gemmaMaxTokens);
    }
    record.put("promptVersion", String.valueOf(payload.getOrDefault("promptVersion", record.getOrDefault("promptVersion", "v1"))));
    Object timeoutValue = payload.getOrDefault("analysisTimeoutMs", record.getOrDefault("analysisTimeoutMs", Math.max(1000L, openclawAnalysisTimeoutMs)));
    record.put("analysisTimeoutMs", timeoutValue == null ? Math.max(1000L, openclawAnalysisTimeoutMs) : Long.parseLong(String.valueOf(timeoutValue)));
    record.put("fallbackToHeuristic", payload.getOrDefault("fallbackToHeuristic", record.getOrDefault("fallbackToHeuristic", true)));
    record.put("autoCreateSession", payload.getOrDefault("autoCreateSession", record.getOrDefault("autoCreateSession", true)));
    record.put("autoSaveHistory", payload.getOrDefault("autoSaveHistory", record.getOrDefault("autoSaveHistory", true)));
    record.put("autoHandoff", payload.getOrDefault("autoHandoff", record.getOrDefault("autoHandoff", true)));
    record.put("promptTemplate", String.valueOf(payload.getOrDefault("promptTemplate", record.getOrDefault("promptTemplate", "你是物业智能助手，只回答当前小区和当前房屋的问题。输出严格结构化结果."))));
    record.put("enabledScenes", normalizeStringList(payload.get("enabledScenes")).isEmpty()
        ? normalizeStringList(record.get("enabledScenes"))
        : normalizeStringList(payload.get("enabledScenes")));
    record.put("handoffKeywords", normalizeStringList(payload.get("handoffKeywords")).isEmpty()
        ? normalizeStringList(record.get("handoffKeywords"))
        : normalizeStringList(payload.get("handoffKeywords")));
    record.put("defaultSupervisor", String.valueOf(payload.getOrDefault("defaultSupervisor", record.getOrDefault("defaultSupervisor", currentSupervisorName()))));
    record.put("supervisors", normalizeStringList(payload.get("supervisors")).isEmpty()
        ? normalizeStringList(communityRecord.get("supervisors"))
        : normalizeStringList(payload.get("supervisors")));
    record.put("extra", payload.getOrDefault("extra", record.getOrDefault("extra", new LinkedHashMap<>())));
    record.put("createTime", previous.getOrDefault("createTime", now()));
    record.put("updateTime", now());
    assistantSettings.put(communityId, record);
    persistAll();
    return cloneMap(record);
  }

  private void bindCommunityFields(Map<String, Object> record) {
    if (record == null) {
      return;
    }
    String communityId = textValue(record.get("communityId"));
    String communityName = textValue(record.get("community"));
    if (communityId.isEmpty()) {
      communityId = communityIdByName(communityName);
      record.put("communityId", communityId);
    }
    if (communityName.isEmpty()) {
      record.put("community", communityNameById(communityId));
    }
  }

  private void normalizeCommunityBindings() {
    notices.values().forEach(this::bindCommunityFields);
    bills.values().forEach(this::bindCommunityFields);
    repairs.values().forEach(this::bindCommunityFields);
    visitors.values().forEach(this::bindCommunityFields);
    decorations.values().forEach(this::bindCommunityFields);
    feedbacks.values().forEach(this::bindCommunityFields);
    complaintQueue.values().forEach(this::bindCommunityFields);
    complaintRules.values().forEach(this::bindCommunityFields);
    assistantFaqs.values().forEach(this::bindCommunityFields);
    assistantSessions.values().forEach(this::bindCommunityFields);
    express.values().forEach(this::bindCommunityFields);
    vegetableOrders.values().forEach(this::bindCommunityFields);
    houses.values().forEach(this::bindCommunityFields);
    staffs.values().forEach(this::bindCommunityFields);
    vegetableProducts.forEach(this::bindCommunityFields);
    users.values().forEach(this::bindCommunityFields);
  }

  private Map<String, Object> activeCommunityRecord() {
    Map<String, Object> active = communities.values().stream()
        .filter(item -> Boolean.TRUE.equals(item.get("active")))
        .findFirst()
        .orElseGet(() -> communities.values().stream().findFirst().orElse(null));
    if (active != null) {
      Map<String, Object> item = cloneMap(active);
      item.putIfAbsent("defaultSupervisor", defaultSupervisor);
      item.putIfAbsent("supervisors", Arrays.asList(String.valueOf(item.getOrDefault("defaultSupervisor", defaultSupervisor))));
      normalizeCommunityFeatureFlags(item);
      return item;
    }
    if (!community.isEmpty()) {
      Map<String, Object> fallback = cloneMap(community);
      if (!fallback.containsKey("id")) {
        fallback.put("id", "community");
      }
      fallback.putIfAbsent("active", true);
      normalizeCommunityFeatureFlags(fallback);
      return fallback;
    }
    return new LinkedHashMap<>();
  }

  private void refreshActiveCommunitySnapshot() {
    Map<String, Object> active = activeCommunityRecord();
    community.clear();
    if (!active.isEmpty()) {
      community.putAll(active);
      if (!community.containsKey("defaultSupervisor")) {
        community.put("defaultSupervisor", defaultSupervisor);
      }
      if (!community.containsKey("supervisors")) {
        community.put("supervisors", Arrays.asList(currentSupervisorName()));
      }
      normalizeCommunityFeatureFlags(community);
    }
  }

  private Map<String, Object> normalizeCommunityPayload(Map<String, Object> payload, String id, boolean active) {
    Map<String, Object> source = payload == null ? new LinkedHashMap<>() : payload;
    Map<String, Object> item = new LinkedHashMap<>();
    item.put("id", id);
    String projectName = String.valueOf(source.getOrDefault("projectName", source.getOrDefault("name", "未命名小区")));
    item.put("name", projectName);
    item.put("projectName", projectName);
    item.put("address", String.valueOf(source.getOrDefault("address", "")));
    item.put("propertyCompany", String.valueOf(source.getOrDefault("propertyCompany", "")));
    item.put("propertyPhone", String.valueOf(source.getOrDefault("propertyPhone", "")));
    item.put("totalHouse", source.getOrDefault("totalHouse", 0));
    item.put("totalPark", source.getOrDefault("totalPark", 0));
    item.put("availablePark", source.getOrDefault("availablePark", 0));
    List<String> supervisors = normalizeStringList(source.get("supervisors"));
    if (supervisors.isEmpty()) {
      String fallbackSupervisor = String.valueOf(source.getOrDefault("defaultSupervisor", defaultSupervisor));
      if (!fallbackSupervisor.isEmpty()) {
        supervisors.add(fallbackSupervisor);
      }
    }
    item.put("supervisors", supervisors);
    String defaultSupervisorName = String.valueOf(source.getOrDefault("defaultSupervisor", supervisors.isEmpty() ? defaultSupervisor : supervisors.get(0)));
    if (defaultSupervisorName.isEmpty() && !supervisors.isEmpty()) {
      defaultSupervisorName = supervisors.get(0);
    }
    item.put("defaultSupervisor", defaultSupervisorName);
    item.put("remark", String.valueOf(source.getOrDefault("remark", "")));
    normalizeCommunityFeatureFlags(item, source);
    item.put("active", active || Boolean.TRUE.equals(source.get("active")));
    item.put("createTime", source.getOrDefault("createTime", now()));
    item.put("updateTime", now());
    return item;
  }

  private Map<String, Object> communityByName(String name) {
    String target = String.valueOf(name == null ? "" : name).trim();
    if (target.isEmpty()) {
      return activeCommunityRecord();
    }
    return communities.values().stream()
        .filter(item -> target.equals(String.valueOf(item.getOrDefault("projectName", item.getOrDefault("name", ""))).trim())
            || target.equals(String.valueOf(item.getOrDefault("name", "")).trim()))
        .findFirst()
        .map(item -> {
          Map<String, Object> copy = cloneMap(item);
          copy.putIfAbsent("defaultSupervisor", defaultSupervisor);
          copy.putIfAbsent("supervisors", Arrays.asList(String.valueOf(copy.getOrDefault("defaultSupervisor", defaultSupervisor))));
          normalizeCommunityFeatureFlags(copy);
          return copy;
        })
        .orElseGet(this::activeCommunityRecord);
  }

  private String communityNameForFeedback(Map<String, Object> feedback) {
    if (feedback == null) {
      return String.valueOf(activeCommunityRecord().getOrDefault("name", ""));
    }
    String explicit = String.valueOf(feedback.getOrDefault("community", "")).trim();
    if (!explicit.isEmpty()) {
      return explicit;
    }
    String openid = String.valueOf(feedback.getOrDefault("openid", "")).trim();
    if (!openid.isEmpty()) {
      Map<String, Object> user = users.get(openid);
      if (user != null) {
        String userCommunity = String.valueOf(user.getOrDefault("community", "")).trim();
        if (!userCommunity.isEmpty()) {
          return userCommunity;
        }
      }
    }
    return String.valueOf(activeCommunityRecord().getOrDefault("name", ""));
  }

  private List<String> communityFeatureKeys() {
    return Arrays.asList(
        "enableNotice",
        "enableBill",
        "enableRepair",
        "enableResident",
        "enableHouse",
        "enableStaff",
        "enableFeedback",
        "enableComplaintQueue",
        "enableComplaintRule",
        "enableVisitor",
        "enableDecoration",
        "enableExpress",
        "enableProduct",
        "enableOrder"
    );
  }

  private void normalizeCommunityFeatureFlags(Map<String, Object> target) {
    normalizeCommunityFeatureFlags(target, target);
  }

  private void normalizeCommunityFeatureFlags(Map<String, Object> target, Map<String, Object> source) {
    if (target == null) {
      return;
    }
    for (String key : communityFeatureKeys()) {
      if (source != null && source.containsKey(key)) {
        target.put(key, Boolean.parseBoolean(String.valueOf(source.get(key))));
      } else if (!target.containsKey(key)) {
        target.put(key, true);
      }
    }
  }

  private void normalizeDemoUserAndHouseSeeds() {
    boolean changed = false;
    Map<String, Object> demoUser = users.get(DEMO_OPENID);
    if (demoUser != null) {
      changed |= updateDemoRecord(demoUser, "community", currentCommunityName());
      changed |= updateDemoRecord(demoUser, "building", "A栋");
      changed |= updateDemoRecord(demoUser, "unit", "1单元");
      changed |= updateDemoRecord(demoUser, "room", "101室");
      changed |= updateDemoRecord(demoUser, "houseId", "1");
      changed |= updateDemoRecord(demoUser, "houseNo", "A栋 101室");
      changed |= updateDemoRecord(demoUser, "relationship", "业主");
    }
    Map<String, Object> primaryHouse = houses.get("1");
    if (primaryHouse != null) {
      changed |= updateDemoRecord(primaryHouse, "community", currentCommunityName());
      changed |= updateDemoRecord(primaryHouse, "houseNo", "A栋 101室");
      changed |= updateDemoRecord(primaryHouse, "building", "A栋");
      changed |= updateDemoRecord(primaryHouse, "unit", "1单元");
      changed |= updateDemoRecord(primaryHouse, "room", "101室");
      changed |= updateDemoRecord(primaryHouse, "boundUserId", DEMO_OPENID);
      changed |= updateDemoRecord(primaryHouse, "boundUserName", "业主");
      changed |= updateDemoRecord(primaryHouse, "boundUserPhone", "13800138000");
      changed |= updateDemoRecord(primaryHouse, "occupantName", "业主");
      changed |= updateDemoRecord(primaryHouse, "occupantPhone", "13800138000");
    }
    Map<String, Object> secondaryHouse = houses.get("2");
    if (secondaryHouse != null) {
      changed |= updateDemoRecord(secondaryHouse, "community", currentCommunityName());
      changed |= updateDemoRecord(secondaryHouse, "houseNo", "A栋 102室");
      changed |= updateDemoRecord(secondaryHouse, "building", "A栋");
      changed |= updateDemoRecord(secondaryHouse, "unit", "1单元");
      changed |= updateDemoRecord(secondaryHouse, "room", "102室");
    }
    if (changed) {
      persistAll();
    }
  }

  private void normalizeDemoBillSeeds() {
    boolean changed = false;
    for (Map<String, Object> bill : bills.values()) {
      String openid = String.valueOf(bill.getOrDefault("openid", "")).trim();
      if (!openid.isEmpty() && !DEMO_OPENID.equals(openid)) {
        continue;
      }
      String type = String.valueOf(bill.getOrDefault("type", "")).trim();
      String room = String.valueOf(bill.getOrDefault("room", "")).trim();
      String houseNo = String.valueOf(bill.getOrDefault("houseNo", "")).trim();
      if ("water".equals(type) || "electricity".equals(type)) {
        if (room.contains("101") || room.contains("1001") || houseNo.contains("101") || houseNo.contains("1001") || room.isEmpty() || houseNo.isEmpty()) {
          bill.put("room", "A栋 102室");
          bill.put("houseNo", "A栋 102室");
          bill.put("houseId", "2");
          bill.put("community", currentCommunityName());
          bill.put("openid", DEMO_OPENID);
          bill.put("updateTime", now());
          changed = true;
        }
        continue;
      }
      if (room.contains("1001") || houseNo.contains("1001") || room.isEmpty() || houseNo.isEmpty()) {
        bill.put("room", "A栋 101室");
        bill.put("houseNo", "A栋 101室");
        bill.put("houseId", "1");
        bill.put("community", currentCommunityName());
        bill.put("openid", DEMO_OPENID);
        bill.put("updateTime", now());
        changed = true;
      }
    }
    if (changed) {
      persistAll();
    }
  }

  private boolean updateDemoRecord(Map<String, Object> record, String key, Object value) {
    Object current = record.get(key);
    if (current == null || !String.valueOf(current).equals(String.valueOf(value))) {
      record.put(key, value);
      record.put("updateTime", now());
      return true;
    }
    return false;
  }

  private boolean billVisibleToUser(Map<String, Object> bill, Map<String, Object> user) {
    if (bill == null || user == null) {
      return false;
    }
    String userOpenid = textValue(user.get("openid"));
    String billOpenid = textValue(bill.get("openid"));
    if (!userOpenid.isEmpty() && userOpenid.equals(billOpenid)) {
      return true;
    }
    String userHouseId = textValue(user.get("houseId"));
    String billHouseId = textValue(bill.get("houseId"));
    if (!userHouseId.isEmpty() && userHouseId.equals(billHouseId)) {
      return true;
    }
    boolean userHasHouseBinding = !userHouseId.isEmpty()
        || !textValue(user.get("houseNo")).isEmpty()
        || !textValue(user.get("room")).isEmpty()
        || !textValue(user.get("building")).isEmpty()
        || !textValue(user.get("unit")).isEmpty();
    if (sameHouseLabel(bill.get("houseNo"), user.get("houseNo"))
        || sameHouseLabel(bill.get("room"), user.get("room"))
        || sameHouseLabel(bill.get("houseNo"), user.get("room"))
        || sameHouseLabel(bill.get("room"), user.get("houseNo"))) {
      return true;
    }
    if (userHasHouseBinding) {
      return false;
    }
    String userCommunity = textValue(user.get("community"));
    String billCommunity = textValue(bill.get("community"));
    if (!userCommunity.isEmpty() && userCommunity.equals(billCommunity)) {
      String billHouseNo = textValue(bill.get("houseNo"));
      String billRoom = textValue(bill.get("room"));
      if (billHouseNo.isEmpty() && billRoom.isEmpty()) {
        return true;
      }
    }
    return false;
  }

  private boolean sameHouseLabel(Object left, Object right) {
    String leftText = textValue(left);
    String rightText = textValue(right);
    if (leftText.isEmpty() || rightText.isEmpty()) {
      return false;
    }
    if (leftText.equals(rightText)) {
      return true;
    }
    String leftDigits = leftText.replaceAll("\\D+", "");
    String rightDigits = rightText.replaceAll("\\D+", "");
    if (!leftDigits.isEmpty() && leftDigits.equals(rightDigits)) {
      return true;
    }
    String normalizedLeft = leftText.replaceAll("\\s+", "").replaceAll("[\\p{Punct}]+", "");
    String normalizedRight = rightText.replaceAll("\\s+", "").replaceAll("[\\p{Punct}]+", "");
    return normalizedLeft.equals(normalizedRight);
  }

  private String textValue(Object value) {
    return value == null ? "" : String.valueOf(value).trim();
  }

  private Map<String, Object> findHouseForLogin(AuthLoginRequest request) {
    if (request == null) {
      return null;
    }
    String houseId = textValue(request.houseId);
    if (!houseId.isEmpty() && houses.containsKey(houseId)) {
      return cloneMap(houses.get(houseId));
    }
    String houseNo = textValue(request.houseNo);
    String communityName = textValue(request.community);
    String building = textValue(request.building);
    String unit = textValue(request.unit);
    String room = textValue(request.room);
    return houses.values().stream()
        .filter(house -> {
          if (!communityName.isEmpty() && !communityName.equals(textValue(house.get("community")))) {
            return false;
          }
          if (!houseNo.isEmpty() && sameHouseLabel(houseNo, house.get("houseNo"))) {
            return true;
          }
          boolean sameBuilding = building.isEmpty() || sameHouseLabel(building, house.get("building"));
          boolean sameUnit = unit.isEmpty() || sameHouseLabel(unit, house.get("unit"));
          boolean sameRoom = room.isEmpty() || sameHouseLabel(room, house.get("room"));
          return sameBuilding && sameUnit && sameRoom;
        })
        .findFirst()
        .map(this::cloneMap)
        .orElse(null);
  }

  @Override
  public Map<String, Object> adminGetCommunity() {
    return activeCommunityRecord();
  }

  @Override
  public Map<String, Object> adminSaveCommunity(Map<String, Object> payload) {
    String id = payload != null && payload.get("id") != null && !String.valueOf(payload.get("id")).isEmpty()
        ? String.valueOf(payload.get("id"))
        : newId();
    Map<String, Object> existing = communities.get(id);
    boolean active = payload != null && payload.get("active") != null
        ? Boolean.parseBoolean(String.valueOf(payload.get("active")))
        : existing != null && Boolean.TRUE.equals(existing.get("active"));
    Map<String, Object> item = normalizeCommunityPayload(payload, id, active);
    if (existing != null && existing.get("createTime") != null) {
      item.put("createTime", existing.get("createTime"));
    }
    if (Boolean.TRUE.equals(item.get("active"))) {
      for (Map<String, Object> value : communities.values()) {
        value.put("active", false);
      }
    }
    communities.put(id, item);
    refreshActiveCommunitySnapshot();
    persistAll();
    return cloneMap(item);
  }

  @Override
  public List<Map<String, Object>> adminListCommunities() {
    return sortedValues(communities);
  }

  @Override
  public Map<String, Object> adminGetCommunityById(String id) {
    return findById(communities, id, "小区配置");
  }

  @Override
  public void adminDeleteCommunity(String id) {
    if (communities.remove(id) == null) {
      throw new BusinessException(404, "小区配置不存在");
    }
    if (communities.values().stream().noneMatch(item -> Boolean.TRUE.equals(item.get("active"))) && !communities.isEmpty()) {
      Map<String, Object> first = communities.values().stream().findFirst().orElse(null);
      if (first != null) {
        first.put("active", true);
      }
    }
    refreshActiveCommunitySnapshot();
    persistAll();
  }

  @Override
  public Map<String, Object> adminActivateCommunity(String id) {
    Map<String, Object> target = communities.get(id);
    if (target == null) {
      throw new BusinessException(404, "小区配置不存在");
    }
    for (Map<String, Object> value : communities.values()) {
      value.put("active", false);
    }
    target.put("active", true);
    refreshActiveCommunitySnapshot();
    persistAll();
    return cloneMap(target);
  }

  @Override
  public List<Map<String, Object>> adminListUsers() {
    return sortedValues(users);
  }

  @Override
  public Map<String, Object> adminGetUser(String id) {
    return findById(users, id, "住户账号");
  }

  @Override
  public Map<String, Object> adminSaveUser(Map<String, Object> payload) {
    String id = payload.get("id") == null || String.valueOf(payload.get("id")).isEmpty()
        ? newId()
        : String.valueOf(payload.get("id"));
    String communityId = communityIdByName(String.valueOf(payload.getOrDefault("community", community.getOrDefault("name", ""))));
    String communityName = String.valueOf(payload.getOrDefault("community", communityNameById(communityId)));
    Map<String, Object> user = mapOf(
        "id", id,
        "openid", String.valueOf(payload.getOrDefault("openid", id)),
        "name", String.valueOf(payload.getOrDefault("name", "业主")),
        "avatar", String.valueOf(payload.getOrDefault("avatar", "/assets/images/default-avatar.png")),
        "phone", String.valueOf(payload.getOrDefault("phone", "")),
        "communityId", communityId,
        "community", communityName,
        "building", String.valueOf(payload.getOrDefault("building", "")),
        "unit", String.valueOf(payload.getOrDefault("unit", "")),
        "room", String.valueOf(payload.getOrDefault("room", "")),
        "houseId", String.valueOf(payload.getOrDefault("houseId", "")),
        "houseNo", String.valueOf(payload.getOrDefault("houseNo", String.valueOf(payload.getOrDefault("building", "")) + String.valueOf(payload.getOrDefault("unit", "")) + String.valueOf(payload.getOrDefault("room", "")))),
        "relationship", String.valueOf(payload.getOrDefault("relationship", "业主")),
        "role", String.valueOf(payload.getOrDefault("role", "resident")),
        "status", String.valueOf(payload.getOrDefault("status", "active")),
        "remark", String.valueOf(payload.getOrDefault("remark", "")),
        "createTime", payload.getOrDefault("createTime", now()),
        "updateTime", now()
    );
    users.put(id, user);
    persistAll();
    return cloneMap(user);
  }

  @Override
  public void adminDeleteUser(String id) {
    if (users.remove(id) == null) {
      throw new BusinessException(404, "住户账号不存在");
    }
    persistAll();
  }

  @Override
  public List<Map<String, Object>> adminListHouses() {
    return sortedValues(houses);
  }

  @Override
  public Map<String, Object> adminGetHouse(String id) {
    return findById(houses, id, "房屋档案");
  }

  @Override
  public Map<String, Object> adminSaveHouse(Map<String, Object> payload) {
    String id = payload.get("id") == null || String.valueOf(payload.get("id")).isEmpty()
        ? newId()
        : String.valueOf(payload.get("id"));
    String communityId = communityIdByName(String.valueOf(payload.getOrDefault("community", community.getOrDefault("name", ""))));
    String communityName = String.valueOf(payload.getOrDefault("community", communityNameById(communityId)));
    Map<String, Object> house = mapOf(
        "id", id,
        "communityId", communityId,
        "community", communityName,
        "houseNo", String.valueOf(payload.getOrDefault("houseNo", String.valueOf(payload.getOrDefault("building", "")) + String.valueOf(payload.getOrDefault("unit", "")) + String.valueOf(payload.getOrDefault("room", "")))),
        "building", String.valueOf(payload.getOrDefault("building", "")),
        "unit", String.valueOf(payload.getOrDefault("unit", "")),
        "room", String.valueOf(payload.getOrDefault("room", "")),
        "area", String.valueOf(payload.getOrDefault("area", "")),
        "ownerName", String.valueOf(payload.getOrDefault("ownerName", "")),
        "ownerPhone", String.valueOf(payload.getOrDefault("ownerPhone", "")),
        "occupantName", String.valueOf(payload.getOrDefault("occupantName", "")),
        "occupantPhone", String.valueOf(payload.getOrDefault("occupantPhone", "")),
        "boundUserId", String.valueOf(payload.getOrDefault("boundUserId", "")),
        "boundUserName", String.valueOf(payload.getOrDefault("boundUserName", payload.getOrDefault("occupantName", ""))),
        "boundUserPhone", String.valueOf(payload.getOrDefault("boundUserPhone", payload.getOrDefault("occupantPhone", ""))),
        "ownershipStatus", String.valueOf(payload.getOrDefault("ownershipStatus", "self_owned")),
        "occupancyStatus", String.valueOf(payload.getOrDefault("occupancyStatus", payload.getOrDefault("status", "occupied"))),
        "status", String.valueOf(payload.getOrDefault("status", "occupied")),
        "statusText", String.valueOf(payload.getOrDefault("statusText", "已入住")),
        "remark", String.valueOf(payload.getOrDefault("remark", "")),
        "createTime", payload.getOrDefault("createTime", now()),
        "updateTime", now()
    );
    houses.put(id, house);
    persistAll();
    return cloneMap(house);
  }

  @Override
  public void adminDeleteHouse(String id) {
    if (houses.remove(id) == null) {
      throw new BusinessException(404, "房屋档案不存在");
    }
    persistAll();
  }

  @Override
  public List<Map<String, Object>> adminListStaffs() {
    return sortedValues(staffs);
  }

  @Override
  public Map<String, Object> adminGetStaff(String id) {
    return findById(staffs, id, "物业人员");
  }

  @Override
  public Map<String, Object> adminSaveStaff(Map<String, Object> payload) {
    String id = payload.get("id") == null || String.valueOf(payload.get("id")).isEmpty()
        ? newId()
        : String.valueOf(payload.get("id"));
    String communityId = communityIdByName(String.valueOf(payload.getOrDefault("community", community.getOrDefault("name", ""))));
    String communityName = String.valueOf(payload.getOrDefault("community", communityNameById(communityId)));
    Map<String, Object> staff = mapOf(
        "id", id,
        "communityId", communityId,
        "community", communityName,
        "name", String.valueOf(payload.getOrDefault("name", "")),
        "role", String.valueOf(payload.getOrDefault("role", "物业人员")),
        "position", String.valueOf(payload.getOrDefault("position", "")),
        "department", String.valueOf(payload.getOrDefault("department", "")),
        "phone", String.valueOf(payload.getOrDefault("phone", "")),
        "status", String.valueOf(payload.getOrDefault("status", "active")),
        "statusText", String.valueOf(payload.getOrDefault("statusText", "在岗")),
        "skill", String.valueOf(payload.getOrDefault("skill", "")),
        "shift", String.valueOf(payload.getOrDefault("shift", "白班")),
        "scope", String.valueOf(payload.getOrDefault("scope", "")),
        "responsibleBuildings", payload.get("responsibleBuildings") instanceof List
            ? payload.get("responsibleBuildings")
            : payload.get("responsibleBuildings") == null ? new ArrayList<>() : Arrays.asList(String.valueOf(payload.get("responsibleBuildings")).split("\\s*,\\s*")),
        "feishuDisplayName", String.valueOf(payload.getOrDefault("feishuDisplayName", String.valueOf(payload.getOrDefault("name", "")))),
        "feishuUserId", String.valueOf(payload.getOrDefault("feishuUserId", "")),
        "feishuOpenId", String.valueOf(payload.getOrDefault("feishuOpenId", "")),
        "feishuUnionId", String.valueOf(payload.getOrDefault("feishuUnionId", "")),
        "remark", String.valueOf(payload.getOrDefault("remark", "")),
        "createTime", payload.getOrDefault("createTime", now()),
        "updateTime", now()
    );
    staffs.put(id, staff);
    persistAll();
    return cloneMap(staff);
  }

  @Override
  public void adminDeleteStaff(String id) {
    if (staffs.remove(id) == null) {
      throw new BusinessException(404, "物业人员不存在");
    }
    persistAll();
  }

  @Override
  public List<Map<String, Object>> adminListFeedbacks() {
    return listFeedbacks(null, null);
  }

  @Override
  public Map<String, Object> adminGetFeedback(String id) {
    return findById(feedbacks, id, "反馈");
  }

  @Override
  public Map<String, Object> adminSaveFeedback(Map<String, Object> payload) {
    String id = payload.get("id") == null || String.valueOf(payload.get("id")).isEmpty()
        ? newId()
        : String.valueOf(payload.get("id"));
    String communityId = communityIdByName(String.valueOf(payload.getOrDefault("community", communityNameById(currentCommunityId()))));
    String communityName = String.valueOf(payload.getOrDefault("community", communityNameById(communityId)));
    Map<String, Object> feedback = mapOf(
        "id", id,
        "communityId", communityId,
        "community", communityName,
        "type", String.valueOf(payload.getOrDefault("type", "投诉")),
        "category", String.valueOf(payload.getOrDefault("category", payload.getOrDefault("type", "投诉"))),
        "title", String.valueOf(payload.getOrDefault("title", payload.getOrDefault("category", "投诉"))),
        "description", String.valueOf(payload.getOrDefault("description", payload.getOrDefault("content", ""))),
        "content", String.valueOf(payload.getOrDefault("content", "")),
        "staffName", String.valueOf(payload.getOrDefault("staffName", "")),
        "staffPosition", String.valueOf(payload.getOrDefault("staffPosition", "")),
        "location", String.valueOf(payload.getOrDefault("location", "")),
        "phone", String.valueOf(payload.getOrDefault("phone", "")),
        "status", String.valueOf(payload.getOrDefault("status", "pending")),
        "statusText", String.valueOf(payload.getOrDefault("statusText", "待处理")),
        "reply", String.valueOf(payload.getOrDefault("reply", "")),
        "replyTime", payload.getOrDefault("replyTime", ""),
        "createTime", payload.getOrDefault("createTime", now()),
        "updateTime", now(),
        "openid", String.valueOf(payload.getOrDefault("openid", DEMO_OPENID))
    );
    feedbacks.put(id, feedback);
    persistAll();
    return cloneMap(feedback);
  }

  @Override
  public void adminDeleteFeedback(String id) {
    if (feedbacks.remove(id) == null) {
      throw new BusinessException(404, "反馈不存在");
    }
    persistAll();
  }

  @Override
  public Map<String, Object> adminReplyFeedback(String id, Map<String, Object> payload) {
    return replyFeedback(null, id, payload);
  }

  @Override
  public List<Map<String, Object>> adminListVisitors() {
    return listVisitors(null);
  }

  @Override
  public Map<String, Object> adminGetVisitor(String id) {
    return findById(visitors, id, "访客");
  }

  @Override
  public Map<String, Object> adminSaveVisitor(Map<String, Object> payload) {
    String id = payload.get("id") == null || String.valueOf(payload.get("id")).isEmpty()
        ? newId()
        : String.valueOf(payload.get("id"));
    String communityId = communityIdByName(String.valueOf(payload.getOrDefault("community", community.getOrDefault("name", ""))));
    String communityName = String.valueOf(payload.getOrDefault("community", communityNameById(communityId)));
    int hours = 24;
    Object rawHours = payload.get("expireHours");
    if (rawHours != null && !String.valueOf(rawHours).isEmpty()) {
      try {
        hours = Integer.parseInt(String.valueOf(rawHours));
      } catch (Exception ignore) {
        hours = 24;
      }
    }
    Map<String, Object> visitor = mapOf(
        "id", id,
        "communityId", communityId,
        "community", communityName,
        "visitorName", String.valueOf(payload.getOrDefault("visitorName", "")),
        "visitorPhone", String.valueOf(payload.getOrDefault("visitorPhone", "")),
        "visitPurpose", String.valueOf(payload.getOrDefault("visitPurpose", "走亲访友")),
        "passCode", String.valueOf(payload.getOrDefault("passCode", generateCode())),
        "status", String.valueOf(payload.getOrDefault("status", "active")),
        "statusText", String.valueOf(payload.getOrDefault("statusText", "有效")),
        "visitTime", payload.getOrDefault("visitTime", now()),
        "expireTime", payload.getOrDefault("expireTime", LocalDateTime.now().plusHours(hours).format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))),
        "expireHours", hours,
        "updateTime", now(),
        "openid", String.valueOf(payload.getOrDefault("openid", DEMO_OPENID))
    );
    visitors.put(id, visitor);
    persistAll();
    return cloneMap(visitor);
  }

  @Override
  public void adminDeleteVisitor(String id) {
    if (visitors.remove(id) == null) {
      throw new BusinessException(404, "访客记录不存在");
    }
    persistAll();
  }

  @Override
  public Map<String, Object> adminInvalidateVisitor(String id) {
    Map<String, Object> visitor = visitors.get(id);
    if (visitor == null) {
      throw new BusinessException(404, "访客记录不存在");
    }
    visitor.put("status", "invalid");
    visitor.put("statusText", "已失效");
    visitor.put("updateTime", now());
    persistAll();
    return cloneMap(visitor);
  }

  @Override
  public List<Map<String, Object>> adminListDecorations() {
    return listDecorations(null);
  }

  @Override
  public Map<String, Object> adminGetDecoration(String id) {
    return findById(decorations, id, "装修申请");
  }

  @Override
  public Map<String, Object> adminSaveDecoration(Map<String, Object> payload) {
    String id = payload.get("id") == null || String.valueOf(payload.get("id")).isEmpty()
        ? newId()
        : String.valueOf(payload.get("id"));
    String communityId = communityIdByName(String.valueOf(payload.getOrDefault("community", community.getOrDefault("name", ""))));
    String communityName = String.valueOf(payload.getOrDefault("community", communityNameById(communityId)));
    Map<String, Object> decoration = mapOf(
        "id", id,
        "communityId", communityId,
        "community", communityName,
        "decorationType", String.valueOf(payload.getOrDefault("decorationType", "其他")),
        "icon", payload.getOrDefault("icon", decorationIcon(String.valueOf(payload.getOrDefault("decorationType", "其他")))),
        "area", String.valueOf(payload.getOrDefault("area", "")),
        "description", String.valueOf(payload.getOrDefault("description", "")),
        "startDate", String.valueOf(payload.getOrDefault("startDate", "")),
        "endDate", String.valueOf(payload.getOrDefault("endDate", "")),
        "company", String.valueOf(payload.getOrDefault("company", "个人装修")),
        "phone", String.valueOf(payload.getOrDefault("phone", "")),
        "status", String.valueOf(payload.getOrDefault("status", "pending")),
        "statusText", String.valueOf(payload.getOrDefault("statusText", "待审核")),
        "applyDate", payload.getOrDefault("applyDate", now()),
        "reviewTime", payload.getOrDefault("reviewTime", ""),
        "reviewRemark", String.valueOf(payload.getOrDefault("reviewRemark", "")),
        "updateTime", now(),
        "openid", String.valueOf(payload.getOrDefault("openid", DEMO_OPENID))
    );
    decorations.put(id, decoration);
    persistAll();
    return cloneMap(decoration);
  }

  @Override
  public void adminDeleteDecoration(String id) {
    if (decorations.remove(id) == null) {
      throw new BusinessException(404, "装修申请不存在");
    }
    persistAll();
  }

  @Override
  public Map<String, Object> adminReviewDecoration(String id, Map<String, Object> payload) {
    return reviewDecoration(null, id, payload);
  }

  @Override
  public List<Map<String, Object>> adminListExpress() {
    return listExpress(null);
  }

  @Override
  public Map<String, Object> adminGetExpress(String id) {
    return findById(express, id, "快递记录");
  }

  @Override
  public Map<String, Object> adminSaveExpress(Map<String, Object> payload) {
    String id = payload.get("id") == null || String.valueOf(payload.get("id")).isEmpty()
        ? newId()
        : String.valueOf(payload.get("id"));
    boolean isNew = !express.containsKey(id);
    String communityId = communityIdByName(String.valueOf(payload.getOrDefault("community", community.getOrDefault("name", ""))));
    String communityName = String.valueOf(payload.getOrDefault("community", communityNameById(communityId)));
    Map<String, Object> item = mapOf(
        "id", id,
        "communityId", communityId,
        "community", communityName,
        "company", String.valueOf(payload.getOrDefault("company", "")),
        "arriveTime", String.valueOf(payload.getOrDefault("arriveTime", now())),
        "code", String.valueOf(payload.getOrDefault("code", "")),
        "status", String.valueOf(payload.getOrDefault("status", "pending")),
        "statusText", String.valueOf(payload.getOrDefault("statusText", "待取件")),
        "createTime", payload.getOrDefault("createTime", now()),
        "pickupTime", payload.getOrDefault("pickupTime", ""),
        "openid", String.valueOf(payload.getOrDefault("openid", DEMO_OPENID)),
        "updateTime", now()
    );
    express.put(id, item);
    persistAll();
    if (isNew) {
      try {
        notifyLifeServiceFeishu("快递通知", item, "admin_save_express");
      } catch (Exception ignored) {
        // 通知失败不影响快递记录保存
      }
    }
    return cloneMap(item);
  }

  @Override
  public void adminDeleteExpress(String id) {
    if (express.remove(id) == null) {
      throw new BusinessException(404, "快递记录不存在");
    }
    persistAll();
  }

  @Override
  public Map<String, Object> adminPickupExpress(String id, Map<String, Object> payload) {
    return pickupExpress(null, id, payload);
  }

  @Override
  public List<Map<String, Object>> adminListVegetableProducts() {
    return listVegetableProducts();
  }

  @Override
  public Map<String, Object> adminGetVegetableProduct(String id) {
    for (Map<String, Object> product : vegetableProducts) {
      if (id.equals(String.valueOf(product.get("id")))) {
        return cloneMap(product);
      }
    }
    throw new BusinessException(404, "商品不存在");
  }

  @Override
  public Map<String, Object> adminSaveVegetableProduct(Map<String, Object> payload) {
    String id = payload.get("id") == null || String.valueOf(payload.get("id")).isEmpty()
        ? newId()
        : String.valueOf(payload.get("id"));
    String communityId = communityIdByName(String.valueOf(payload.getOrDefault("community", community.getOrDefault("name", ""))));
    String communityName = String.valueOf(payload.getOrDefault("community", communityNameById(communityId)));
    Map<String, Object> product = mapOf(
        "id", id,
        "communityId", communityId,
        "community", communityName,
        "name", String.valueOf(payload.getOrDefault("name", "")),
        "spec", String.valueOf(payload.getOrDefault("spec", "")),
        "price", payload.getOrDefault("price", 0),
        "stock", payload.getOrDefault("stock", 0),
        "cover", String.valueOf(payload.getOrDefault("cover", "")),
        "description", String.valueOf(payload.getOrDefault("description", "")),
        "status", String.valueOf(payload.getOrDefault("status", "active")),
        "statusText", String.valueOf(payload.getOrDefault("statusText", "上架")),
        "updateTime", now()
    );
    boolean replaced = false;
    for (int i = 0; i < vegetableProducts.size(); i++) {
      if (id.equals(String.valueOf(vegetableProducts.get(i).get("id")))) {
        vegetableProducts.set(i, product);
        replaced = true;
        break;
      }
    }
    if (!replaced) {
      vegetableProducts.add(product);
    }
    persistAll();
    return cloneMap(product);
  }

  @Override
  public void adminDeleteVegetableProduct(String id) {
    boolean removed = vegetableProducts.removeIf(item -> id.equals(String.valueOf(item.get("id"))));
    if (!removed) {
      throw new BusinessException(404, "商品不存在");
    }
    persistAll();
  }

  @Override
  public List<Map<String, Object>> adminListVegetableOrders() {
    return listVegetableOrders(null);
  }

  @Override
  public Map<String, Object> adminGetVegetableOrder(String id) {
    return findById(vegetableOrders, id, "订单");
  }

  @Override
  public Map<String, Object> adminSaveVegetableOrder(Map<String, Object> payload) {
    String id = payload.get("id") == null || String.valueOf(payload.get("id")).isEmpty()
        ? newId()
        : String.valueOf(payload.get("id"));
    boolean isNew = !vegetableOrders.containsKey(id);
    String communityId = communityIdByName(String.valueOf(payload.getOrDefault("community", community.getOrDefault("name", ""))));
    String communityName = String.valueOf(payload.getOrDefault("community", communityNameById(communityId)));
    List<Map<String, Object>> items = new ArrayList<>();
    Object rawItems = payload.get("items");
    if (rawItems instanceof List) {
      for (Object rawItem : (List<?>) rawItems) {
        if (rawItem instanceof Map) {
          items.add(new LinkedHashMap<>((Map<String, Object>) rawItem));
        }
      }
    }
    double totalAmount = 0;
    for (Map<String, Object> item : items) {
      double price = item.get("price") == null ? 0 : Double.parseDouble(String.valueOf(item.get("price")));
      int count = item.get("count") == null ? 1 : Integer.parseInt(String.valueOf(item.get("count")));
      totalAmount += price * count;
    }
    Map<String, Object> order = mapOf(
        "id", id,
        "communityId", communityId,
        "community", communityName,
        "orderNo", String.valueOf(payload.getOrDefault("orderNo", "VEG" + System.currentTimeMillis())),
        "items", items,
        "totalAmount", payload.getOrDefault("totalAmount", totalAmount),
        "status", String.valueOf(payload.getOrDefault("status", "pending")),
        "statusText", String.valueOf(payload.getOrDefault("statusText", "待处理")),
        "createTime", payload.getOrDefault("createTime", now()),
        "pickupTime", payload.getOrDefault("pickupTime", ""),
        "updateTime", now()
    );
    vegetableOrders.put(id, order);
    persistAll();
    if (isNew) {
      try {
        notifyLifeServiceFeishu("蔬菜订单通知", order, "admin_save_vegetable_order");
      } catch (Exception ignored) {
        // 通知失败不影响订单保存
      }
    }
    return cloneMap(order);
  }

  @Override
  public void adminDeleteVegetableOrder(String id) {
    if (vegetableOrders.remove(id) == null) {
      throw new BusinessException(404, "订单不存在");
    }
    persistAll();
  }

  @Override
  public List<Map<String, Object>> listVisitors(String token) {
    return sortedValues(visitors);
  }

  @Override
  public Map<String, Object> getVisitor(String token, String id) {
    return findById(visitors, id, "访客");
  }

  @Override
  public Map<String, Object> createVisitor(String token, CreateVisitorRequest request) {
    int hours = request.expireHours == null ? 24 : request.expireHours;
    Map<String, Object> visitor = mapOf(
        "id", newId(),
        "visitorName", request.visitorName,
        "visitorPhone", request.visitorPhone,
        "visitPurpose", request.visitPurpose == null ? "走亲访友" : request.visitPurpose,
        "passCode", request.passCode == null || request.passCode.isEmpty() ? generateCode() : request.passCode,
        "status", "active",
        "statusText", "有效",
        "visitTime", now(),
        "expireTime", LocalDateTime.now().plusHours(hours).format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")),
        "expireHours", hours
    );
    visitors.put(String.valueOf(visitor.get("id")), visitor);
    persistAll();
    return cloneMap(visitor);
  }

  @Override
  public Map<String, Object> invalidateVisitor(String token, String id) {
    Map<String, Object> visitor = visitors.get(id);
    if (visitor == null) {
      throw new BusinessException(404, "访客记录不存在");
    }
    visitor.put("status", "invalid");
    visitor.put("statusText", "已失效");
    visitor.put("updateTime", now());
    persistAll();
    return cloneMap(visitor);
  }

  @Override
  public List<Map<String, Object>> listDecorations(String token) {
    return sortedValues(decorations);
  }

  @Override
  public Map<String, Object> getDecoration(String token, String id) {
    return findById(decorations, id, "装修申请");
  }

  @Override
  public Map<String, Object> createDecoration(String token, CreateDecorationRequest request) {
    Map<String, Object> decoration = mapOf(
        "id", newId(),
        "decorationType", request.decorationType,
        "icon", decorationIcon(request.decorationType),
        "area", request.area,
        "description", request.description == null || request.description.isEmpty() ? request.area + "装修" : request.description,
        "startDate", request.startDate,
        "endDate", request.endDate,
        "company", request.company == null || request.company.isEmpty() ? "个人装修" : request.company,
        "phone", request.phone,
        "status", "pending",
        "statusText", "待审核",
        "applyDate", now()
    );
    decorations.put(String.valueOf(decoration.get("id")), decoration);
    persistAll();
    return cloneMap(decoration);
  }

  @Override
  public Map<String, Object> reviewDecoration(String token, String id, Map<String, Object> payload) {
    Map<String, Object> decoration = decorations.get(id);
    if (decoration == null) {
      throw new BusinessException(404, "装修申请不存在");
    }
    decoration.put("status", payload.getOrDefault("status", "approved"));
    decoration.put("statusText", payload.getOrDefault("statusText", "已审核"));
    decoration.put("reviewTime", now());
    decoration.put("reviewRemark", payload.getOrDefault("remark", ""));
    persistAll();
    return cloneMap(decoration);
  }

  @Override
  public List<Map<String, Object>> listFeedbacks(String token, String type) {
    return sortedValues(feedbacks).stream()
        .filter(item -> type == null || type.isEmpty() || type.equals(String.valueOf(item.get("type"))))
        .collect(Collectors.toList());
  }

  @Override
  public Map<String, Object> getFeedback(String token, String id) {
    return findById(feedbacks, id, "反馈");
  }

  @Override
  public Map<String, Object> createFeedback(String token, CreateFeedbackRequest request) {
    Map<String, Object> current = currentUser(token);
    Map<String, Object> feedback = mapOf(
        "id", newId(),
        "community", String.valueOf(
            request.community == null || request.community.isEmpty()
                ? (current == null ? currentCommunityName() : String.valueOf(current.getOrDefault("community", currentCommunityName())))
                : request.community
        ),
        "type", request.type,
        "category", request.category == null || request.category.isEmpty() ? request.type : request.category,
        "title", request.title == null || request.title.isEmpty() ? (request.category == null || request.category.isEmpty() ? request.type : request.category) : request.title,
        "description", request.description == null || request.description.isEmpty() ? request.content : request.description,
        "content", request.content,
        "staffName", request.staffName == null ? "" : request.staffName,
        "staffPosition", request.staffPosition == null ? "" : request.staffPosition,
        "location", request.location == null ? "" : request.location,
        "phone", request.phone == null ? "" : request.phone,
        "status", "pending",
        "statusText", "待处理",
        "reply", "",
        "createTime", now(),
        "openid", current == null ? "demo-openid" : current.get("openid")
    );
    feedbacks.put(String.valueOf(feedback.get("id")), feedback);
    if ("投诉".equals(String.valueOf(feedback.get("type")))) {
      Map<String, Object> queueItem = enqueueComplaintQueue(feedback);
      try {
        queueItem = adminAnalyzeComplaintQueue(String.valueOf(queueItem.get("id")), new LinkedHashMap<>());
        adminPushComplaintQueueToFeishu(String.valueOf(queueItem.get("id")), new LinkedHashMap<>());
      } catch (Exception ignored) {
        // 自动推送失败不影响投诉入库，队列里会保留失败状态供后台处理。
      }
    }
    persistAll();
    return cloneMap(feedback);
  }

  @Override
  public Map<String, Object> replyFeedback(String token, String id, Map<String, Object> payload) {
    Map<String, Object> feedback = feedbacks.get(id);
    if (feedback == null) {
      throw new BusinessException(404, "反馈不存在");
    }
    feedback.put("reply", payload.getOrDefault("reply", ""));
    feedback.put("status", "replied");
    feedback.put("statusText", "已回复");
    feedback.put("replyTime", now());
    persistAll();
    syncComplaintQueueFromFeedback(feedback);
    return cloneMap(feedback);
  }

  @Override
  public List<Map<String, Object>> listExpress(String token) {
    return sortedValues(express);
  }

  @Override
  public Map<String, Object> pickupExpress(String token, String id, Map<String, Object> payload) {
    Map<String, Object> item = express.get(id);
    if (item == null) {
      throw new BusinessException(404, "快递记录不存在");
    }
    item.put("status", "completed");
    item.put("statusText", "已取件");
    item.put("pickupTime", now());
    persistAll();
    try {
      notifyLifeServiceFeishu("快递已取件", item, "pickup_express");
    } catch (Exception ignored) {
      // 通知失败不影响取件状态更新
    }
    return cloneMap(item);
  }

  @Override
  public List<Map<String, Object>> listVegetableProducts() {
    return vegetableProducts.stream().map(this::cloneMap).collect(Collectors.toList());
  }

  @Override
  public List<Map<String, Object>> listVegetableOrders(String token) {
    return sortedValues(vegetableOrders);
  }

  @Override
  public Map<String, Object> createVegetableOrder(String token, Map<String, Object> payload) {
    List<Map<String, Object>> items = new ArrayList<>();
    Object rawItems = payload.get("items");
    if (rawItems instanceof List) {
      for (Object rawItem : (List<?>) rawItems) {
        if (rawItem instanceof Map) {
          items.add(new LinkedHashMap<>((Map<String, Object>) rawItem));
        }
      }
    }
    double totalAmount = 0;
    for (Map<String, Object> item : items) {
      double price = item.get("price") == null ? 0 : Double.parseDouble(String.valueOf(item.get("price")));
      int count = item.get("count") == null ? 1 : Integer.parseInt(String.valueOf(item.get("count")));
      totalAmount += price * count;
    }
    Map<String, Object> order = mapOf(
        "id", newId(),
        "orderNo", "VEG" + System.currentTimeMillis(),
        "items", items,
        "totalAmount", totalAmount,
        "status", "pending",
        "statusText", "待处理",
        "createTime", now()
    );
    vegetableOrders.put(String.valueOf(order.get("id")), order);
    persistAll();
    try {
      notifyLifeServiceFeishu("蔬菜代买新订单", order, "create_vegetable_order");
    } catch (Exception ignored) {
      // 通知失败不影响订单入库
    }
    return cloneMap(order);
  }

  @Override
  public Map<String, Object> createAssistantSession(String token, AssistantSessionRequest request) {
    AssistantSessionRequest safeRequest = request == null ? new AssistantSessionRequest() : request;
    Map<String, Object> settings = assistantSettingsRecord(safeRequest.communityId);
    String communityId = textValue(firstNonEmpty(safeRequest.communityId, settings.get("communityId"), currentCommunityId()));
    String communityName = String.valueOf(firstNonEmpty(safeRequest.community, settings.get("community"), communityNameById(communityId)));
    String id = newId();
    String sessionToken = "session-" + id;
    Map<String, Object> context = safeRequest.context == null ? new LinkedHashMap<>() : new LinkedHashMap<>(safeRequest.context);
    context.putIfAbsent("communityId", communityId);
    context.putIfAbsent("community", communityName);
    context.putIfAbsent("assistantName", String.valueOf(settings.getOrDefault("assistantName", "物业AI客服")));
    context.putIfAbsent("defaultSupervisor", String.valueOf(settings.getOrDefault("defaultSupervisor", currentSupervisorName())));
    context.putIfAbsent("enabledScenes", normalizeStringList(settings.get("enabledScenes")));
    Map<String, Object> session = mapOf(
        "id", id,
        "scene", safeRequest.scene == null ? "general" : safeRequest.scene,
        "subjectId", safeRequest.subjectId == null ? "" : safeRequest.subjectId,
        "communityId", communityId,
        "community", communityName,
        "houseId", safeRequest.houseId == null ? "" : safeRequest.houseId,
        "userId", safeRequest.userId == null ? "" : safeRequest.userId,
        "userName", safeRequest.userName == null ? "" : safeRequest.userName,
        "room", safeRequest.room == null ? "" : safeRequest.room,
        "phone", safeRequest.phone == null ? "" : safeRequest.phone,
        "assistantName", String.valueOf(settings.getOrDefault("assistantName", "物业AI客服")),
        "promptVersion", safeRequest.promptVersion == null ? String.valueOf(settings.getOrDefault("promptVersion", "v1")) : safeRequest.promptVersion,
        "prompt", safeRequest.prompt == null ? String.valueOf(settings.getOrDefault("promptTemplate", "")) : safeRequest.prompt,
        "inputText", safeRequest.inputText == null ? "" : safeRequest.inputText,
        "enabledScenes", normalizeStringList(settings.get("enabledScenes")),
        "defaultSupervisor", String.valueOf(settings.getOrDefault("defaultSupervisor", currentSupervisorName())),
        "openclawBaseUrl", String.valueOf(settings.getOrDefault("openclawBaseUrl", openclawBaseUrl)),
        "openclawSessionPath", String.valueOf(settings.getOrDefault("openclawSessionPath", "/session/{sessionId}")),
        "openclawMessagePath", String.valueOf(settings.getOrDefault("openclawMessagePath", "/api/v1/assistant/messages")),
        "openclawHandoffPath", String.valueOf(settings.getOrDefault("openclawHandoffPath", "/api/v1/assistant/handoff")),
        "context", context,
        "messages", new ArrayList<Map<String, Object>>(),
        "sessionToken", sessionToken,
        "status", "created",
        "openclawUrl", assistantSessionUrl(settings, id, sessionToken),
        "createTime", now()
    );
    assistantSessions.put(id, session);
    persistAll();
    return cloneMap(session);
  }

  @Override
  public Map<String, Object> getAssistantSession(String token, String id) {
    return findById(assistantSessions, id, "会话");
  }

  @Override
  public Map<String, Object> getAssistantSettings(String token, String communityId) {
    return cloneMap(assistantSettingsRecord(communityId));
  }

  @Override
  public Map<String, Object> saveAssistantSettings(String token, AssistantConfigRequest request) {
    Map<String, Object> payload = new LinkedHashMap<>();
    if (request != null) {
      payload.put("communityId", request.communityId);
      payload.put("community", request.community);
      payload.put("enabled", request.enabled);
      payload.put("assistantName", request.assistantName);
      payload.put("assistantProvider", request.assistantProvider);
      payload.put("openclawBaseUrl", request.openclawBaseUrl);
      payload.put("openclawModel", request.openclawModel);
      payload.put("openclawSessionPath", request.openclawSessionPath);
      payload.put("openclawMessagePath", request.openclawMessagePath);
      payload.put("openclawHandoffPath", request.openclawHandoffPath);
      payload.put("gemmaMode", request.gemmaMode);
      payload.put("gemmaBaseUrl", request.gemmaBaseUrl);
      payload.put("gemmaLocalBaseUrl", request.gemmaLocalBaseUrl);
      payload.put("gemmaRemoteBaseUrl", request.gemmaRemoteBaseUrl);
      payload.put("gemmaChatPath", request.gemmaChatPath);
      payload.put("gemmaModel", request.gemmaModel);
      payload.put("gemmaTemperature", request.gemmaTemperature);
      payload.put("gemmaMaxTokens", request.gemmaMaxTokens);
      payload.put("promptVersion", request.promptVersion);
      payload.put("analysisTimeoutMs", request.analysisTimeoutMs);
      payload.put("fallbackToHeuristic", request.fallbackToHeuristic);
      payload.put("autoCreateSession", request.autoCreateSession);
      payload.put("autoSaveHistory", request.autoSaveHistory);
      payload.put("autoHandoff", request.autoHandoff);
      payload.put("promptTemplate", request.promptTemplate);
      payload.put("enabledScenes", request.enabledScenes);
      payload.put("handoffKeywords", request.handoffKeywords);
      payload.put("defaultSupervisor", request.defaultSupervisor);
      payload.put("extra", request.extra);
    }
    return upsertAssistantSettings(payload);
  }

  @Override
  public Map<String, Object> testAssistantSettings(String token, Map<String, Object> payload) {
    Map<String, Object> request = payload == null ? new LinkedHashMap<>() : new LinkedHashMap<>(payload);
    String communityId = textValue(firstNonEmpty(request.get("communityId"), currentCommunityId()));
    Map<String, Object> settings = assistantSettingsRecord(communityId);
    String provider = effectiveAssistantProvider(settings);
    String communityName = String.valueOf(firstNonEmpty(
        request.get("community"),
        settings.get("community"),
        communityNameById(communityId)
    ));
    String engineLabel = "deepseek".equals(provider) ? "深度求索" : "gemma".equals(provider) ? "本地模型" : "兼容引擎";
    String endpoint = "deepseek".equals(provider)
        ? assistantEndpointForProvider(settings, "deepseek", "deepseekChatPath")
        : "gemma".equals(provider)
        ? assistantEndpointForProvider(settings, "gemma", "gemmaChatPath")
        : assistantEndpoint(settings, "openclawMessagePath");
    long started = System.currentTimeMillis();
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("测试结果", "失败");
    result.put("智能引擎", engineLabel);
    result.put("连接模式", "deepseek".equals(provider)
        ? ("remote".equals(normalizeOpenclawMode(settings.get("deepseekMode"), settings.get("deepseekBaseUrl"))) ? "远程" : "本地")
        : "gemma".equals(provider)
        ? ("remote".equals(normalizeOpenclawMode(settings.get("gemmaMode"), settings.get("gemmaBaseUrl"))) ? "远程" : "本地")
        : ("remote".equals(normalizeOpenclawMode(settings.get("openclawMode"), settings.get("openclawBaseUrl"))) ? "远程" : "本地"));
    result.put("项目ID", communityId);
    result.put("项目名称", communityName);
    result.put("接口地址", endpoint.isEmpty() ? "未配置" : endpoint);
    result.put("模型名称", "deepseek".equals(provider)
        ? String.valueOf(settings.getOrDefault("deepseekModel", deepseekModel))
        : "gemma".equals(provider)
        ? String.valueOf(settings.getOrDefault("gemmaModel", gemmaModel))
        : String.valueOf(settings.getOrDefault("openclawModel", "openclaw-assistant")));
    try {
      Map<String, Object> testRequest = mapOf(
          "sessionId", "test-" + newId(),
          "sessionToken", "test-" + newId(),
          "assistantProvider", provider,
          "scene", "general",
          "role", "user",
          "contentType", "text",
          "content", "请用一句中文回复：连接成功",
          "communityId", communityId,
          "community", communityName,
          "houseId", "",
          "userId", "",
          "userName", "",
          "room", "",
          "phone", "",
          "enabledScenes", normalizeStringList(settings.get("enabledScenes")),
          "history", new ArrayList<Map<String, Object>>(),
          "settings", assistantSettingsSummary(settings),
          "context", mapOf("communityId", communityId, "community", communityName),
          "promptVersion", String.valueOf(firstNonEmpty(settings.get("promptVersion"), "v1")),
          "prompt", String.valueOf(firstNonEmpty(settings.get("promptTemplate"), "你是物业智能助手，只回答当前小区和当前房屋的问题。")),
          "inputText", "请用一句中文回复：连接成功"
      );
      Map<String, Object> normalized = "deepseek".equals(provider)
          ? invokeDeepseekAssistant(settings, testRequest)
          : "gemma".equals(provider)
          ? invokeGemmaAssistant(settings, testRequest)
          : invokeOpenclawAssistant(settings, testRequest);
      if (normalized == null || normalized.isEmpty()) {
        result.put("测试结果", "失败");
        result.put("提示", "接口未返回内容，请检查地址、密钥或服务状态。");
        result.put("耗时毫秒", System.currentTimeMillis() - started);
        return result;
      }
      result.put("测试结果", "成功");
      result.put("耗时毫秒", System.currentTimeMillis() - started);
      result.put("回复内容", String.valueOf(firstNonEmpty(normalized.get("replyText"), normalized.get("回复内容"), "")));
      result.put("原始结果", normalized);
      result.put("提示", "连接正常，可以保存并使用。");
      return result;
    } catch (Exception error) {
      result.put("测试结果", "失败");
      result.put("耗时毫秒", System.currentTimeMillis() - started);
      result.put("提示", String.valueOf(firstNonEmpty(error.getMessage(), "连接失败，请检查配置。")));
      return result;
    }
  }

  @Override
  public List<Map<String, Object>> adminListAssistantFaqs(String communityId) {
    String target = textValue(communityId);
    return assistantFaqs.values().stream()
        .map(this::cloneMap)
        .filter(item -> target.isEmpty() || target.equals(String.valueOf(item.getOrDefault("communityId", ""))))
        .sorted(Comparator.comparing((Map<String, Object> item) -> !truthy(item.get("pinned")))
            .thenComparingInt(item -> {
              try {
                return Integer.parseInt(String.valueOf(item.getOrDefault("orderNo", 0)));
              } catch (Exception error) {
                return 0;
              }
            })
            .thenComparing(item -> String.valueOf(item.getOrDefault("createTime", "")), Comparator.reverseOrder()))
        .collect(Collectors.toList());
  }

  @Override
  public Map<String, Object> adminGetAssistantFaq(String id) {
    Map<String, Object> item = assistantFaqs.get(textValue(id));
    if (item == null) {
      throw new BusinessException(404, "FAQ 不存在");
    }
    return cloneMap(item);
  }

  @Override
  public Map<String, Object> adminSaveAssistantFaq(Map<String, Object> payload) {
    Map<String, Object> source = payload == null ? new LinkedHashMap<>() : new LinkedHashMap<>(payload);
    String id = textValue(source.get("id"));
    if (id.isEmpty()) {
      id = "faq-" + newId();
    }
    String communityId = textValue(source.get("communityId"));
    if (communityId.isEmpty()) {
      communityId = currentCommunityId();
    }
    Map<String, Object> communityRecord = communityRecordById(communityId);
    String communityName = String.valueOf(firstNonEmpty(source.get("community"), communityRecord.getOrDefault("projectName", communityRecord.getOrDefault("name", currentCommunityName()))));
    Map<String, Object> previous = assistantFaqs.getOrDefault(id, new LinkedHashMap<>());
    Map<String, Object> record = new LinkedHashMap<>(previous);
    record.put("id", id);
    record.put("communityId", communityId);
    record.put("community", communityName);
    record.put("responsibleSupervisor", String.valueOf(firstNonEmpty(
        source.get("responsibleSupervisor"),
        previous.get("responsibleSupervisor"),
        communityRecord.getOrDefault("defaultSupervisor", currentSupervisorName())
    )));
    record.put("question", String.valueOf(source.getOrDefault("question", record.getOrDefault("question", ""))));
    record.put("answer", String.valueOf(source.getOrDefault("answer", record.getOrDefault("answer", ""))));
    record.put("tags", normalizeStringList(source.get("tags")).isEmpty()
        ? normalizeStringList(record.get("tags"))
        : normalizeStringList(source.get("tags")));
    record.put("synonyms", normalizeStringList(source.get("synonyms")).isEmpty()
        ? normalizeStringList(record.get("synonyms"))
        : normalizeStringList(source.get("synonyms")));
    record.put("keywords", normalizeStringList(source.get("keywords")).isEmpty()
        ? normalizeStringList(record.get("keywords"))
        : normalizeStringList(source.get("keywords")));
    record.put("enabled", truthy(source.getOrDefault("enabled", record.getOrDefault("enabled", true))));
    record.put("pinned", truthy(source.getOrDefault("pinned", record.getOrDefault("pinned", false))));
    Object orderNoValue = firstNonEmpty(source.get("orderNo"), record.get("orderNo"), 0);
    try {
      record.put("orderNo", Integer.parseInt(String.valueOf(orderNoValue)));
    } catch (Exception error) {
      record.put("orderNo", 0);
    }
    record.put("createTime", previous.getOrDefault("createTime", now()));
    record.put("updateTime", now());
    assistantFaqs.put(id, record);
    persistAll();
    return cloneMap(record);
  }

  @Override
  public void adminDeleteAssistantFaq(String id) {
    if (assistantFaqs.remove(textValue(id)) == null) {
      throw new BusinessException(404, "FAQ 不存在");
    }
    persistAll();
  }

  private String normalizeAssistantFaqText(String text) {
    if (text == null) {
      return "";
    }
    String normalized = text.trim().toLowerCase();
    normalized = normalized.replaceAll("[\\p{Punct}\\p{IsPunctuation}]", " ");
    normalized = normalized.replaceAll("\\s+", " ").trim();
    return normalized;
  }

  private boolean faqMatchesCommunity(Map<String, Object> faq, String communityId) {
    String faqCommunityId = textValue(faq == null ? null : faq.get("communityId"));
    if (faqCommunityId.isEmpty() || communityId.isEmpty()) {
      return true;
    }
    return faqCommunityId.equals(communityId);
  }

  private int scoreAssistantFaq(String input, Map<String, Object> faq) {
    String question = normalizeAssistantFaqText(String.valueOf(faq.getOrDefault("question", "")));
    String answer = normalizeAssistantFaqText(String.valueOf(faq.getOrDefault("answer", "")));
    String tags = normalizeAssistantFaqText(String.join(" ", normalizeStringList(faq.get("tags"))));
    String synonyms = normalizeAssistantFaqText(String.join(" ", normalizeStringList(faq.get("synonyms"))));
    String keywords = normalizeAssistantFaqText(String.join(" ", normalizeStringList(faq.get("keywords"))));
    String normalizedInput = normalizeAssistantFaqText(input);
    String compactInput = normalizedInput.replace(" ", "");
    String compactQuestion = question.replace(" ", "");
    String compactAnswer = answer.replace(" ", "");
    String compactTags = tags.replace(" ", "");
    String compactSynonyms = synonyms.replace(" ", "");
    String compactKeywords = keywords.replace(" ", "");
    if (compactInput.isEmpty() || compactQuestion.isEmpty()) {
      return 0;
    }

    int score = 0;
    if (truthy(faq.get("pinned"))) {
      score += 30;
    }
    if (compactInput.equals(compactQuestion)) {
      score += 120;
    }
    if (compactQuestion.contains(compactInput) || compactInput.contains(compactQuestion)) {
      score += 70;
    }
    if (!compactAnswer.isEmpty() && compactAnswer.contains(compactInput)) {
      score += 20;
    }
    if (!compactTags.isEmpty() && compactTags.contains(compactInput)) {
      score += 25;
    }
    if (!compactSynonyms.isEmpty() && compactSynonyms.contains(compactInput)) {
      score += 55;
    }
    if (!compactKeywords.isEmpty() && compactKeywords.contains(compactInput)) {
      score += 45;
    }

    LinkedHashSet<String> fragments = new LinkedHashSet<>();
    for (int size = 2; size <= 4; size++) {
      for (int i = 0; i + size <= compactInput.length(); i++) {
        fragments.add(compactInput.substring(i, i + size));
      }
    }
    for (String fragment : fragments) {
      if (compactQuestion.contains(fragment)) {
        score += fragment.length() >= 3 ? 18 : 8;
      }
      if (!compactAnswer.isEmpty() && compactAnswer.contains(fragment)) {
        score += fragment.length() >= 3 ? 4 : 2;
      }
      if (!compactTags.isEmpty() && compactTags.contains(fragment)) {
        score += fragment.length() >= 3 ? 15 : 6;
      }
      if (!compactSynonyms.isEmpty() && compactSynonyms.contains(fragment)) {
        score += fragment.length() >= 3 ? 20 : 10;
      }
      if (!compactKeywords.isEmpty() && compactKeywords.contains(fragment)) {
        score += fragment.length() >= 3 ? 16 : 8;
      }
    }
    return score;
  }

  private Map<String, Object> buildFaqAssistantResponse(Map<String, Object> faq, Map<String, Object> context) {
    Map<String, Object> response = new LinkedHashMap<>();
    response.put("intent", "faq");
    response.put("confidence", 0.98);
    response.put("needConfirm", false);
    response.put("handoff", false);
    response.put("slots", new LinkedHashMap<>());
    response.put("action", mapOf("type", "none", "params", new LinkedHashMap<>()));
    response.put("replyText", String.valueOf(firstNonEmpty(faq.get("answer"), "我查到了对应的常见问题答案。")));
    response.put("quickReplies", Arrays.asList("继续提问", "查物业费", "查报修", "转人工"));
    response.put("reason", "FAQ 命中");
    response.put("faqMatched", true);
    response.put("faqId", faq.getOrDefault("id", ""));
    response.put("faqQuestion", faq.getOrDefault("question", ""));
    response.put("faqAnswer", faq.getOrDefault("answer", ""));
    response.put("faqTags", normalizeStringList(faq.get("tags")));
    response.put("faqSynonyms", normalizeStringList(faq.get("synonyms")));
    response.put("faqKeywords", normalizeStringList(faq.get("keywords")));
    response.put("faqCommunityId", faq.getOrDefault("communityId", ""));
    response.put("faqCommunity", faq.getOrDefault("community", ""));
    response.put("faqResponsibleSupervisor", faq.getOrDefault("responsibleSupervisor", ""));
    response.put("faqPinned", truthy(faq.get("pinned")));
    response.put("faqContext", context == null ? new LinkedHashMap<>() : new LinkedHashMap<>(context));
    return response;
  }

  private Map<String, Object> matchAssistantFaq(String token, AssistantMessageRequest request, Map<String, Object> session, Map<String, Object> settings, Map<String, Object> context, String input) {
    String normalizedInput = input == null ? "" : input.trim();
    if (normalizedInput.isEmpty()) {
      return null;
    }
    String communityId = String.valueOf(firstNonEmpty(
        request == null ? null : request.communityId,
        session == null ? null : session.get("communityId"),
        settings == null ? null : settings.get("communityId"),
        currentCommunityId()
    ));
    Map<String, Object> bestFaq = null;
    int bestScore = 0;
    for (Map<String, Object> faq : assistantFaqs.values()) {
      if (faq == null) {
        continue;
      }
      if (faq.get("enabled") != null && !truthy(faq.get("enabled"))) {
        continue;
      }
      if (!faqMatchesCommunity(faq, communityId)) {
        continue;
      }
      int score = scoreAssistantFaq(normalizedInput, faq);
      if (score > bestScore) {
        bestScore = score;
        bestFaq = faq;
      }
    }
    if (bestFaq == null || bestScore < 35) {
      return null;
    }
    Map<String, Object> response = buildFaqAssistantResponse(bestFaq, context);
    response.put("confidence", Math.min(0.99, 0.9 + (bestScore / 300.0)));
    response.put("reason", "FAQ 命中: " + String.valueOf(bestFaq.getOrDefault("question", "")));
    return response;
  }

  @Override
  public List<Map<String, Object>> adminListAssistantSessions(String communityId) {
    String target = textValue(communityId);
    return assistantSessions.values().stream()
        .map(this::cloneMap)
        .filter(item -> target.isEmpty() || target.equals(String.valueOf(item.getOrDefault("communityId", ""))))
        .sorted(Comparator.comparing((Map<String, Object> item) -> String.valueOf(item.getOrDefault("updateTime", item.getOrDefault("createTime", ""))), Comparator.reverseOrder()))
        .collect(Collectors.toList());
  }

  @Override
  public Map<String, Object> assistantMessage(String token, AssistantMessageRequest request) {
    AssistantMessageRequest safeRequest = request == null ? new AssistantMessageRequest() : request;
    Map<String, Object> session = resolveAssistantSession(safeRequest);
    Map<String, Object> settings = assistantSettingsRecord(String.valueOf(firstNonEmpty(safeRequest.communityId, session.get("communityId"), currentCommunityId())));
    String sessionId = String.valueOf(session.getOrDefault("id", ""));
    String content = String.valueOf(firstNonEmpty(safeRequest.content, ""));
    String role = String.valueOf(firstNonEmpty(safeRequest.role, "user"));
    Map<String, Object> context = assistantMessageContext(token, safeRequest, session, settings);
    String assistantProvider = effectiveAssistantProvider(settings);
    List<Map<String, Object>> history = new ArrayList<>(assistantSessionMessages(session));
    Map<String, Object> requestBody = mapOf(
        "sessionId", sessionId,
        "sessionToken", session.getOrDefault("sessionToken", ""),
        "assistantProvider", assistantProvider,
        "scene", String.valueOf(firstNonEmpty(safeRequest.scene, session.get("scene"), "general")),
        "role", role,
        "contentType", String.valueOf(firstNonEmpty(safeRequest.contentType, "text")),
        "content", content,
        "communityId", String.valueOf(firstNonEmpty(safeRequest.communityId, session.get("communityId"), currentCommunityId())),
        "community", String.valueOf(firstNonEmpty(session.get("community"), communityNameById(String.valueOf(session.getOrDefault("communityId", currentCommunityId()))))),
        "houseId", String.valueOf(firstNonEmpty(safeRequest.houseId, session.get("houseId"), "")),
        "userId", String.valueOf(firstNonEmpty(safeRequest.userId, session.get("userId"), "")),
        "userName", String.valueOf(firstNonEmpty(safeRequest.userName, session.get("userName"), "")),
        "room", String.valueOf(firstNonEmpty(safeRequest.room, session.get("room"), "")),
        "phone", String.valueOf(firstNonEmpty(safeRequest.phone, session.get("phone"), "")),
        "enabledScenes", normalizeStringList(settings.get("enabledScenes")),
        "history", history,
        "settings", assistantSettingsSummary(settings),
        "context", context,
        "promptVersion", String.valueOf(firstNonEmpty(safeRequest.promptVersion, session.get("promptVersion"), settings.get("promptVersion"), "v1")),
        "prompt", String.valueOf(firstNonEmpty(safeRequest.prompt, session.get("prompt"), settings.get("promptTemplate"), "")),
        "inputText", content
    );
    Map<String, Object> normalized = matchAssistantFaq(token, safeRequest, session, settings, context, content);
    if (normalized == null) {
      normalized = invokeAssistantEngine(token, settings, requestBody);
    }
    if (normalized == null || normalized.isEmpty()) {
      normalized = buildHeuristicAssistantResponse(token, safeRequest, session, settings, context);
    }
    normalized.putIfAbsent("replyText", "我已收到你的问题。");
    normalized.putIfAbsent("intent", "general");
    normalized.putIfAbsent("confidence", 0.85);
    normalized.putIfAbsent("needConfirm", false);
    normalized.putIfAbsent("handoff", false);
    normalized.putIfAbsent("quickReplies", Arrays.asList("查物业费", "查报修", "提交报修", "提交投诉", "转人工"));
    normalized.putIfAbsent("slots", new LinkedHashMap<>());
    normalized.putIfAbsent("action", mapOf("type", "none", "params", new LinkedHashMap<>()));
    normalized.put("sessionId", sessionId);
    normalized.put("communityId", session.getOrDefault("communityId", ""));
    normalized.put("community", session.getOrDefault("community", ""));
    normalized.put("openclawUrl", session.getOrDefault("openclawUrl", ""));
    normalized.put("updateTime", now());
    appendAssistantSessionMessage(session, "user", content, mapOf("contentType", String.valueOf(firstNonEmpty(safeRequest.contentType, "text")), "scene", requestBody.get("scene")));
    appendAssistantSessionMessage(session, "assistant", String.valueOf(normalized.getOrDefault("replyText", "")), normalized);
    session.put("status", Boolean.TRUE.equals(normalized.get("handoff")) ? "handoff" : "active");
    session.put("lastMessageAt", now());
    session.put("messageCount", assistantSessionMessages(session).size());
    session.put("updateTime", now());
    assistantSessions.put(sessionId, session);
    persistAll();
    return cloneMap(normalized);
  }

  @Override
  public Map<String, Object> assistantHandoff(String token, AssistantHandoffRequest request) {
    AssistantHandoffRequest safeRequest = request == null ? new AssistantHandoffRequest() : request;
    Map<String, Object> session = resolveAssistantSession(safeRequest.sessionId, safeRequest.communityId, safeRequest.houseId, safeRequest.userId, safeRequest.userName, safeRequest.phone);
    Map<String, Object> settings = assistantSettingsRecord(String.valueOf(firstNonEmpty(safeRequest.communityId, session.get("communityId"), currentCommunityId())));
    String provider = effectiveAssistantProvider(settings);
    String sessionId = String.valueOf(session.getOrDefault("id", ""));
    String ticketId = "hf-" + newId();
    Map<String, Object> result = mapOf(
        "sessionId", sessionId,
        "ticketId", ticketId,
        "handoff", true,
        "status", "queued",
        "reason", String.valueOf(firstNonEmpty(safeRequest.reason, "用户请求转人工")),
        "communityId", session.getOrDefault("communityId", ""),
        "community", session.getOrDefault("community", ""),
        "openclawUrl", session.getOrDefault("openclawUrl", "")
    );
    String endpoint = "gemma".equals(provider) ? "" : assistantEndpoint(settings, "openclawHandoffPath");
    if (!endpoint.isEmpty()) {
      try {
        Map<String, Object> response = parseJsonObject(postJson(endpoint, mapOf(
            "sessionId", sessionId,
            "ticketId", ticketId,
            "reason", result.get("reason"),
            "communityId", session.getOrDefault("communityId", ""),
            "community", session.getOrDefault("community", ""),
            "houseId", session.getOrDefault("houseId", ""),
            "userId", session.getOrDefault("userId", ""),
            "userName", session.getOrDefault("userName", ""),
            "phone", session.getOrDefault("phone", ""),
            "context", session.getOrDefault("context", new LinkedHashMap<>()),
            "settings", assistantSettingsSummary(settings)
        )));
        Map<String, Object> payload = flattenOpenclawEnvelope(response);
        result.putAll(payload);
        result.put("status", String.valueOf(firstNonEmpty(payload.get("status"), result.get("status"), "queued")));
      } catch (Exception ignored) {
        result.put("status", "queued");
      }
    } else if ("gemma".equals(provider)) {
      result.put("status", "queued");
      result.put("reason", String.valueOf(firstNonEmpty(safeRequest.reason, "用户请求转人工")));
    }
    session.put("status", "handoff");
    session.put("handoffTicketId", ticketId);
    session.put("handoffReason", result.get("reason"));
    session.put("updateTime", now());
    appendAssistantSessionMessage(session, "system", "转人工：" + String.valueOf(result.get("reason")), result);
    Map<String, Object> feishuNotify = notifyAssistantHandoffFeishu(session, result);
    result.putAll(feishuNotify);
    session.put("handoffPushStatus", feishuNotify.getOrDefault("pushStatus", "prepared"));
    session.put("handoffPushResult", feishuNotify.getOrDefault("pushResult", ""));
    session.put("handoffPushError", feishuNotify.getOrDefault("pushError", ""));
    assistantSessions.put(sessionId, session);
    persistAll();
    return cloneMap(result);
  }

  @Override
  public Map<String, Object> callbackOpenclaw(String token, Map<String, Object> payload) {
    Object sessionId = payload.get("sessionId");
    if (sessionId == null) {
      throw new BusinessException(400, "sessionId不能为空");
    }
    Map<String, Object> session = assistantSessions.get(String.valueOf(sessionId));
    if (session == null) {
      throw new BusinessException(404, "会话不存在");
    }
    session.put("status", payload.getOrDefault("status", "completed"));
    session.put("result", payload.getOrDefault("result", Collections.emptyMap()));
    session.put("updateTime", now());
    persistAll();
    return cloneMap(session);
  }

  @Override
  public Map<String, Object> draftRepair(String token, Map<String, Object> payload) {
    String input = String.valueOf(payload.getOrDefault("inputText", ""));
    return mapOf(
        "title", input.isEmpty() ? "报修内容" : input,
        "category", classifyRepairCategory(input),
        "suggestion", "建议补充地点、是否可上门和联系人电话。"
    );
  }

  @Override
  public Map<String, Object> draftFeedback(String token, Map<String, Object> payload) {
    String input = String.valueOf(payload.getOrDefault("inputText", ""));
    return mapOf(
        "title", input.isEmpty() ? "反馈内容" : input,
        "category", classifyFeedbackCategory(input),
        "suggestion", "建议补充楼栋、时间和具体影响。"
    );
  }

  @Override
  public Map<String, Object> classifyIntent(String token, Map<String, Object> payload) {
    String input = String.valueOf(payload.getOrDefault("inputText", ""));
    return mapOf(
        "intent", classifyIntentName(input),
        "confidence", 0.86,
        "summary", input
    );
  }

  private String classifyRepairCategory(String input) {
    String text = input == null ? "" : input;
    if (text.contains("水") || text.contains("漏")) {
      return "water";
    }
    if (text.contains("灯") || text.contains("电")) {
      return "electric";
    }
    if (text.contains("锁")) {
      return "lock";
    }
    if (text.contains("燃气") || text.contains("煤气")) {
      return "gas";
    }
    return "other";
  }

  private String classifyFeedbackCategory(String input) {
    String text = input == null ? "" : input;
    if (text.contains("吵") || text.contains("噪音")) {
      return "噪音扰民";
    }
    if (text.contains("脏") || text.contains("卫生")) {
      return "环境卫生";
    }
    if (text.contains("坏") || text.contains("损坏")) {
      return "设施损坏";
    }
    return "其他";
  }

  private String classifyIntentName(String input) {
    String text = input == null ? "" : input;
    if (text.contains("报修")) {
      return "repair";
    }
    if (text.contains("投诉") || text.contains("表扬")) {
      return "feedback";
    }
    if (text.contains("缴费") || text.contains("物业费")) {
      return "payment";
    }
    if (text.contains("访客")) {
      return "visitor";
    }
    if (text.contains("装修")) {
      return "decoration";
    }
    return "general";
  }
}
