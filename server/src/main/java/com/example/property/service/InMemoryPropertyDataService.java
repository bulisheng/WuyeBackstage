package com.example.property.service;

import com.example.property.common.BusinessException;
import com.example.property.dto.AssistantSessionRequest;
import com.example.property.dto.AuthLoginRequest;
import com.example.property.dto.CreateDecorationRequest;
import com.example.property.dto.CreateFeedbackRequest;
import com.example.property.dto.CreateRepairRequest;
import com.example.property.dto.CreateVisitorRequest;
import com.example.property.dto.PayBillRequest;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
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
  private final Map<String, Map<String, Object>> express = new ConcurrentHashMap<>();
  private final Map<String, Map<String, Object>> vegetableOrders = new ConcurrentHashMap<>();
  private final Map<String, Map<String, Object>> assistantSessions = new ConcurrentHashMap<>();
  private final Map<String, Map<String, Object>> adminSessions = new ConcurrentHashMap<>();
  private final List<Map<String, Object>> vegetableProducts = new CopyOnWriteArrayList<>();
  private final Map<String, Object> community = new ConcurrentHashMap<>();
  private final MongoTemplate mongoTemplate;

  private static final String COMMUNITY_COLLECTION = "property_community";
  private static final String USERS_COLLECTION = "property_users";
  private static final String TOKENS_COLLECTION = "property_tokens";
  private static final String NOTICES_COLLECTION = "property_notices";
  private static final String BILLS_COLLECTION = "property_bills";
  private static final String REPAIRS_COLLECTION = "property_repairs";
  private static final String VISITORS_COLLECTION = "property_visitors";
  private static final String DECORATIONS_COLLECTION = "property_decorations";
  private static final String FEEDBACKS_COLLECTION = "property_feedbacks";
  private static final String EXPRESS_COLLECTION = "property_express";
  private static final String VEGETABLE_PRODUCTS_COLLECTION = "property_vegetable_products";
  private static final String VEGETABLE_ORDERS_COLLECTION = "property_vegetable_orders";
  private static final String ASSISTANT_COLLECTION = "property_assistant_sessions";
  private static final String ADMIN_SESSIONS_COLLECTION = "property_admin_sessions";
  private static final String DEMO_OPENID = "demo-openid";
  private static final String DEMO_TOKEN = "demo-token";

  @Value("${openclaw.base-url:https://openclaw.example.com}")
  private String openclawBaseUrl;

  @Value("${admin.api-key:dev-admin-123456}")
  private String adminApiKey;

  @Value("${admin.session-ttl-minutes:720}")
  private long adminSessionTtlMinutes;

  public InMemoryPropertyDataService(MongoTemplate mongoTemplate) {
    this.mongoTemplate = mongoTemplate;
  }

  @PostConstruct
  public void init() {
    loadOrSeedCommunity();
    loadOrSeedUsers();
    loadOrSeedNotices();
    loadOrSeedBills();
    loadOrSeedRepairs();
    loadOrSeedVisitors();
    loadOrSeedDecorations();
    loadOrSeedFeedbacks();
    loadOrSeedExpress();
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

  private void loadOrSeedCommunity() {
    if (count(COMMUNITY_COLLECTION) > 0) {
      loadSingleDoc(COMMUNITY_COLLECTION, community);
      return;
    }
    community.put("name", "阳光花园小区");
    community.put("address", "北京市朝阳区阳光路88号");
    community.put("propertyCompany", "阳光物业服务公司");
    community.put("propertyPhone", "010-88888888");
    community.put("totalHouse", 500);
    community.put("totalPark", 300);
    community.put("availablePark", 45);
  }

  private void loadOrSeedUsers() {
    if (count(USERS_COLLECTION) > 0) {
      loadMapCollection(USERS_COLLECTION, users);
      if (count(TOKENS_COLLECTION) > 0) {
        loadMapCollection(TOKENS_COLLECTION, tokens);
      }
      return;
    }
    Map<String, Object> user = mapOf(
        "_id", DEMO_OPENID,
        "id", DEMO_OPENID,
        "openid", DEMO_OPENID,
        "name", "业主",
        "avatar", "/assets/images/default-avatar.png",
        "phone", "13800138000",
        "community", "阳光花园小区",
        "building", "A栋",
        "unit", "1单元",
        "room", "1001室",
        "createTime", now(),
        "status", "active"
    );
    users.put(DEMO_OPENID, user);
    tokens.put(DEMO_TOKEN, mapOf("_id", DEMO_TOKEN, "id", DEMO_TOKEN, "token", DEMO_TOKEN, "openid", DEMO_OPENID));
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
      return;
    }
    addBill("1", "property", "物业费", 350.00, "2026年3月", "2026-04-15", "unpaid", "A栋 1001室", null);
    addBill("2", "water", "水费", 86.50, "2026年3月", "2026-04-15", "unpaid", "A栋 1001室", null);
    addBill("3", "electricity", "电费", 156.80, "2026年3月", "2026-04-15", "unpaid", "A栋 1001室", null);
    addBill("4", "property", "物业费", 350.00, "2026年2月", "2026-03-15", "paid", "A栋 1001室", "2026-03-10");
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
    persistMapCollection(USERS_COLLECTION, users);
    persistMapCollection(TOKENS_COLLECTION, tokens);
    persistMapCollection(NOTICES_COLLECTION, notices);
    persistMapCollection(BILLS_COLLECTION, bills);
    persistMapCollection(REPAIRS_COLLECTION, repairs);
    persistMapCollection(VISITORS_COLLECTION, visitors);
    persistMapCollection(DECORATIONS_COLLECTION, decorations);
    persistMapCollection(FEEDBACKS_COLLECTION, feedbacks);
    persistMapCollection(EXPRESS_COLLECTION, express);
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
    }
    String token = tokenFor(openid);
    persistAll();
    return mapOf("token", token, "user", cloneMap(user), "community", communityCurrent());
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
    for (String key : Arrays.asList("phone", "community", "building", "unit", "room", "name", "avatar")) {
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
    List<Map<String, Object>> allBills = listBills(token, null);
    List<Map<String, Object>> unpaidBills = allBills.stream().filter(item -> "unpaid".equals(item.get("status"))).collect(Collectors.toList());
    List<Map<String, Object>> processingRepairs = listRepairs(token, "processing");
    List<Map<String, Object>> importantNotices = listNotices().stream().filter(item -> Boolean.TRUE.equals(item.get("important"))).collect(Collectors.toList());

    return mapOf(
        "userInfo", getCurrentUser(token),
        "communityInfo", communityCurrent(),
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
    return cloneMap(community);
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
    return sortedValues(bills).stream()
        .filter(item -> status == null || status.isEmpty() || status.equals(String.valueOf(item.get("status"))))
        .collect(Collectors.toList());
  }

  @Override
  public Map<String, Object> getBill(String token, String id) {
    return findById(bills, id, "账单");
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
    Map<String, Object> bill = mapOf(
        "id", id,
        "type", String.valueOf(payload.getOrDefault("type", "property")),
        "title", String.valueOf(payload.getOrDefault("title", "")),
        "amount", payload.getOrDefault("amount", 0),
        "period", String.valueOf(payload.getOrDefault("period", "")),
        "dueDate", String.valueOf(payload.getOrDefault("dueDate", "")),
        "status", String.valueOf(payload.getOrDefault("status", "unpaid")),
        "paidDate", payload.getOrDefault("paidDate", null),
        "room", String.valueOf(payload.getOrDefault("room", "")),
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
        "comments", new ArrayList<>(),
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
        "title", input.isEmpty() ? "报修内容" : input.substring(0, Math.min(input.length(), 20)),
        "category", classifyRepairCategory(input),
        "suggestion", "建议补充地点、是否可上门和联系人电话。"
    );
  }

  @Override
  public Map<String, Object> draftFeedback(String token, Map<String, Object> payload) {
    String input = String.valueOf(payload.getOrDefault("inputText", ""));
    return mapOf(
        "title", input.isEmpty() ? "反馈内容" : input.substring(0, Math.min(input.length(), 20)),
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
