package com.example.property.service;

import com.example.property.common.BusinessException;
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
  private static final String ADMIN_SESSIONS_COLLECTION = "property_admin_sessions";
  private static final String DEMO_OPENID = "demo-openid";
  private static final String DEMO_TOKEN = "demo-token";

  @Value("${openclaw.base-url:https://openclaw.example.com}")
  private String openclawBaseUrl;

  @Value("${openclaw.complaint-analysis-path:/api/v1/assistant/complaint/analyze}")
  private String openclawComplaintAnalysisPath;

  @Value("${openclaw.analysis-timeout-ms:5000}")
  private long openclawAnalysisTimeoutMs;

  @Value("${admin.api-key:dev-admin-123456}")
  private String adminApiKey;

  @Value("${admin.session-ttl-minutes:720}")
  private long adminSessionTtlMinutes;

  @Value("${feishu.webhook-url:}")
  private String feishuWebhookUrl;

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
    if (count(ADMIN_SESSIONS_COLLECTION) > 0) {
      loadMapCollection(ADMIN_SESSIONS_COLLECTION, adminSessions);
    }
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
    Map<String, Object> notice = mapOf(
        "id", id,
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
    String communityName = String.valueOf(payload.getOrDefault("community", currentCommunityName()));
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
        "comments", new ArrayList<>(),
        "dispatchHistory", new ArrayList<>(),
        "lastModifiedBy", current.getOrDefault("name", "业主"),
        "lastModifiedAt", now(),
        "openid", current == null ? "demo-openid" : current.get("openid")
    );
    repairs.put(id, repair);
    persistAll();
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
        "dispatchHistory", payload.get("dispatchHistory") instanceof List ? payload.get("dispatchHistory") : new ArrayList<>(),
        "lastModifiedBy", payload.getOrDefault("lastModifiedBy", ""),
        "lastModifiedAt", payload.getOrDefault("lastModifiedAt", ""),
        "comments", payload.get("comments") instanceof List ? payload.get("comments") : new ArrayList<>(),
        "openid", String.valueOf(payload.getOrDefault("openid", DEMO_OPENID)),
        "updateTime", now()
    );
    repairs.put(id, repair);
    persistAll();
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
      return objectMapper.readValue(json, Map.class);
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
    String webhook = feishuWebhookUrl == null ? "" : feishuWebhookUrl.trim();
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
    Map<String, Object> queueItem = new LinkedHashMap<>();
    queueItem.put("id", id);
    queueItem.put("feedbackId", id);
    queueItem.put("type", feedback.getOrDefault("type", "投诉"));
    queueItem.put("community", communityNameForFeedback(feedback));
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
    Map<String, Object> user = mapOf(
        "id", id,
        "openid", String.valueOf(payload.getOrDefault("openid", id)),
        "name", String.valueOf(payload.getOrDefault("name", "业主")),
        "avatar", String.valueOf(payload.getOrDefault("avatar", "/assets/images/default-avatar.png")),
        "phone", String.valueOf(payload.getOrDefault("phone", "")),
        "community", String.valueOf(payload.getOrDefault("community", community.getOrDefault("name", ""))),
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
    Map<String, Object> house = mapOf(
        "id", id,
        "community", String.valueOf(payload.getOrDefault("community", community.getOrDefault("name", ""))),
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
    Map<String, Object> staff = mapOf(
        "id", id,
        "community", String.valueOf(payload.getOrDefault("community", community.getOrDefault("name", ""))),
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
    Map<String, Object> feedback = mapOf(
        "id", id,
        "community", String.valueOf(payload.getOrDefault("community", community.getOrDefault("name", ""))),
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
    Map<String, Object> decoration = mapOf(
        "id", id,
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
    Map<String, Object> item = mapOf(
        "id", id,
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
    Map<String, Object> product = mapOf(
        "id", id,
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
    return cloneMap(order);
  }

  @Override
  public Map<String, Object> createAssistantSession(String token, AssistantSessionRequest request) {
    String id = newId();
    String sessionToken = "session-" + id;
    Map<String, Object> session = mapOf(
        "id", id,
        "scene", request.scene == null ? "general" : request.scene,
        "subjectId", request.subjectId == null ? "" : request.subjectId,
        "prompt", request.prompt == null ? "" : request.prompt,
        "inputText", request.inputText == null ? "" : request.inputText,
        "sessionToken", sessionToken,
        "status", "created",
        "openclawUrl", openclawBaseUrl + "/session/" + id + "?token=" + sessionToken,
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
