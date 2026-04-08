package com.example.property.service;

import com.example.property.dto.AssistantSessionRequest;
import com.example.property.dto.AuthLoginRequest;
import com.example.property.dto.CreateDecorationRequest;
import com.example.property.dto.CreateFeedbackRequest;
import com.example.property.dto.CreateRepairRequest;
import com.example.property.dto.CreateVisitorRequest;
import com.example.property.dto.PayBillRequest;

import java.util.List;
import java.util.Map;

public interface PropertyDataService {
  Map<String, Object> adminLogin(String adminKey);

  Map<String, Object> adminMe(String token);

  Map<String, Object> adminLogout(String token);

  Map<String, Object> login(AuthLoginRequest request);

  Map<String, Object> getCurrentUser(String token);

  Map<String, Object> updateCurrentUser(String token, Map<String, Object> payload);

  Map<String, Object> dashboard(String token);

  Map<String, Object> communityCurrent();

  List<Map<String, Object>> listNotices();

  Map<String, Object> getNotice(String id);

  List<Map<String, Object>> adminListNotices();

  Map<String, Object> adminSaveNotice(Map<String, Object> payload);

  void adminDeleteNotice(String id);

  List<Map<String, Object>> listBills(String token, String status);

  Map<String, Object> getBill(String token, String id);

  Map<String, Object> summaryBills(String token);

  Map<String, Object> payBill(String token, String id, PayBillRequest request);

  List<Map<String, Object>> adminListBills();

  Map<String, Object> adminSaveBill(Map<String, Object> payload);

  void adminDeleteBill(String id);

  List<Map<String, Object>> listRepairs(String token, String status);

  Map<String, Object> getRepair(String token, String id);

  Map<String, Object> createRepair(String token, CreateRepairRequest request);

  Map<String, Object> addRepairComment(String token, String id, Map<String, Object> payload);

  Map<String, Object> assignRepair(String token, String id, Map<String, Object> payload);

  List<Map<String, Object>> adminListRepairs();

  Map<String, Object> adminSaveRepair(Map<String, Object> payload);

  void adminDeleteRepair(String id);

  List<Map<String, Object>> listVisitors(String token);

  Map<String, Object> getVisitor(String token, String id);

  Map<String, Object> createVisitor(String token, CreateVisitorRequest request);

  Map<String, Object> invalidateVisitor(String token, String id);

  List<Map<String, Object>> listDecorations(String token);

  Map<String, Object> getDecoration(String token, String id);

  Map<String, Object> createDecoration(String token, CreateDecorationRequest request);

  Map<String, Object> reviewDecoration(String token, String id, Map<String, Object> payload);

  List<Map<String, Object>> listFeedbacks(String token, String type);

  Map<String, Object> getFeedback(String token, String id);

  Map<String, Object> createFeedback(String token, CreateFeedbackRequest request);

  Map<String, Object> replyFeedback(String token, String id, Map<String, Object> payload);

  List<Map<String, Object>> listExpress(String token);

  Map<String, Object> pickupExpress(String token, String id, Map<String, Object> payload);

  List<Map<String, Object>> listVegetableProducts();

  List<Map<String, Object>> listVegetableOrders(String token);

  Map<String, Object> createVegetableOrder(String token, Map<String, Object> payload);

  Map<String, Object> createAssistantSession(String token, AssistantSessionRequest request);

  Map<String, Object> getAssistantSession(String token, String id);

  Map<String, Object> callbackOpenclaw(String token, Map<String, Object> payload);

  Map<String, Object> draftRepair(String token, Map<String, Object> payload);

  Map<String, Object> draftFeedback(String token, Map<String, Object> payload);

  Map<String, Object> classifyIntent(String token, Map<String, Object> payload);
}
