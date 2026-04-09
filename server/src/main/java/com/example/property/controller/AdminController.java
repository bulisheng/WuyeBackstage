package com.example.property.controller;

import com.example.property.common.ApiResponse;
import com.example.property.common.BusinessException;
import com.example.property.dto.AdminLoginRequest;
import com.example.property.service.PropertyDataService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {
  private final PropertyDataService service;

  @Value("${admin.api-key:dev-admin-123456}")
  private String adminApiKey;

  public AdminController(PropertyDataService service) {
    this.service = service;
  }

  private void checkAdmin(String apiKey) {
    if (apiKey == null || !adminApiKey.equals(apiKey)) {
      throw new BusinessException(401, "管理员密钥无效");
    }
  }

  private String bearerToken(String authorization) {
    if (authorization == null || authorization.isEmpty()) {
      return null;
    }
    if (authorization.startsWith("Bearer ")) {
      return authorization.substring(7);
    }
    return authorization;
  }

  private void checkAdmin(String apiKey, String authorization) {
    if (apiKey != null && adminApiKey.equals(apiKey)) {
      return;
    }
    if (authorization != null) {
      service.adminMe(bearerToken(authorization));
      return;
    }
    throw new BusinessException(401, "管理员密钥无效");
  }

  private Map<String, Object> withId(String id, Map<String, Object> payload) {
    Map<String, Object> copy = new LinkedHashMap<>();
    if (payload != null) {
      copy.putAll(payload);
    }
    copy.put("id", id);
    return copy;
  }

  @PostMapping("/auth/login")
  public ApiResponse<Map<String, Object>> login(@RequestBody AdminLoginRequest request) {
    return ApiResponse.ok(service.adminLogin(request.adminKey));
  }

  @GetMapping("/auth/me")
  public ApiResponse<Map<String, Object>> me(@RequestHeader(value = "Authorization", required = false) String authorization) {
    return ApiResponse.ok(service.adminMe(bearerToken(authorization)));
  }

  @PostMapping("/auth/logout")
  public ApiResponse<Map<String, Object>> logout(@RequestHeader(value = "Authorization", required = false) String authorization) {
    return ApiResponse.ok(service.adminLogout(bearerToken(authorization)));
  }

  @GetMapping("/notices")
  public ApiResponse<Object> notices(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                     @RequestHeader(value = "Authorization", required = false) String authorization) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminListNotices());
  }

  @PostMapping("/notices")
  public ApiResponse<Map<String, Object>> createNotice(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                       @RequestHeader(value = "Authorization", required = false) String authorization,
                                                       @RequestBody Map<String, Object> payload) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminSaveNotice(payload));
  }

  @PutMapping("/notices/{id}")
  public ApiResponse<Map<String, Object>> updateNotice(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                       @RequestHeader(value = "Authorization", required = false) String authorization,
                                                       @PathVariable String id,
                                                       @RequestBody Map<String, Object> payload) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminSaveNotice(withId(id, payload)));
  }

  @DeleteMapping("/notices/{id}")
  public ApiResponse<Map<String, Object>> deleteNotice(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                       @RequestHeader(value = "Authorization", required = false) String authorization,
                                                       @PathVariable String id) {
    checkAdmin(apiKey, authorization);
    service.adminDeleteNotice(id);
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("success", true);
    return ApiResponse.ok(result);
  }

  @GetMapping("/bills")
  public ApiResponse<Object> bills(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                   @RequestHeader(value = "Authorization", required = false) String authorization) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminListBills());
  }

  @PostMapping("/bills")
  public ApiResponse<Map<String, Object>> createBill(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                     @RequestHeader(value = "Authorization", required = false) String authorization,
                                                     @RequestBody Map<String, Object> payload) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminSaveBill(payload));
  }

  @PutMapping("/bills/{id}")
  public ApiResponse<Map<String, Object>> updateBill(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                     @RequestHeader(value = "Authorization", required = false) String authorization,
                                                     @PathVariable String id,
                                                     @RequestBody Map<String, Object> payload) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminSaveBill(withId(id, payload)));
  }

  @DeleteMapping("/bills/{id}")
  public ApiResponse<Map<String, Object>> deleteBill(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                     @RequestHeader(value = "Authorization", required = false) String authorization,
                                                     @PathVariable String id) {
    checkAdmin(apiKey, authorization);
    service.adminDeleteBill(id);
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("success", true);
    return ApiResponse.ok(result);
  }

  @GetMapping("/repairs")
  public ApiResponse<Object> repairs(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                     @RequestHeader(value = "Authorization", required = false) String authorization) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminListRepairs());
  }

  @PostMapping("/repairs")
  public ApiResponse<Map<String, Object>> createRepair(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                       @RequestHeader(value = "Authorization", required = false) String authorization,
                                                       @RequestBody Map<String, Object> payload) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminSaveRepair(payload));
  }

  @PutMapping("/repairs/{id}")
  public ApiResponse<Map<String, Object>> updateRepair(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                       @RequestHeader(value = "Authorization", required = false) String authorization,
                                                       @PathVariable String id,
                                                       @RequestBody Map<String, Object> payload) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminSaveRepair(withId(id, payload)));
  }

  @DeleteMapping("/repairs/{id}")
  public ApiResponse<Map<String, Object>> deleteRepair(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                       @RequestHeader(value = "Authorization", required = false) String authorization,
                                                       @PathVariable String id) {
    checkAdmin(apiKey, authorization);
    service.adminDeleteRepair(id);
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("success", true);
    return ApiResponse.ok(result);
  }

  @GetMapping("/complaints")
  public ApiResponse<Object> complaints(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                        @RequestHeader(value = "Authorization", required = false) String authorization) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminListComplaints());
  }

  @GetMapping("/complaints/{id}")
  public ApiResponse<Map<String, Object>> complaintDetail(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                          @RequestHeader(value = "Authorization", required = false) String authorization,
                                                          @PathVariable String id) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminGetComplaint(id));
  }

  @PostMapping("/complaints/{id}/reply")
  public ApiResponse<Map<String, Object>> replyComplaint(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                         @RequestHeader(value = "Authorization", required = false) String authorization,
                                                         @PathVariable String id,
                                                         @RequestBody Map<String, Object> payload) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminReplyComplaint(id, payload));
  }

  @GetMapping("/complaint-queue")
  public ApiResponse<Object> complaintQueue(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                            @RequestHeader(value = "Authorization", required = false) String authorization) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminListComplaintQueue());
  }

  @GetMapping("/complaint-queue/{id}")
  public ApiResponse<Map<String, Object>> complaintQueueDetail(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                               @RequestHeader(value = "Authorization", required = false) String authorization,
                                                               @PathVariable String id) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminGetComplaintQueue(id));
  }

  @PostMapping("/complaint-queue/{id}/analyze")
  public ApiResponse<Map<String, Object>> analyzeComplaintQueue(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                                @RequestHeader(value = "Authorization", required = false) String authorization,
                                                                @PathVariable String id,
                                                                @RequestBody(required = false) Map<String, Object> payload) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminAnalyzeComplaintQueue(id, payload == null ? new LinkedHashMap<>() : payload));
  }

  @PostMapping("/complaint-queue/{id}/push-feishu")
  public ApiResponse<Map<String, Object>> pushComplaintQueueToFeishu(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                                     @RequestHeader(value = "Authorization", required = false) String authorization,
                                                                     @PathVariable String id,
                                                                     @RequestBody(required = false) Map<String, Object> payload) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminPushComplaintQueueToFeishu(id, payload == null ? new LinkedHashMap<>() : payload));
  }

  @GetMapping("/complaint-rules")
  public ApiResponse<Object> complaintRules(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                            @RequestHeader(value = "Authorization", required = false) String authorization) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminListComplaintRules());
  }

  @GetMapping("/complaint-rules/{id}")
  public ApiResponse<Map<String, Object>> complaintRuleDetail(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                              @RequestHeader(value = "Authorization", required = false) String authorization,
                                                              @PathVariable String id) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminGetComplaintRule(id));
  }

  @PostMapping("/complaint-rules")
  public ApiResponse<Map<String, Object>> createComplaintRule(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                              @RequestHeader(value = "Authorization", required = false) String authorization,
                                                              @RequestBody Map<String, Object> payload) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminSaveComplaintRule(payload));
  }

  @PutMapping("/complaint-rules/{id}")
  public ApiResponse<Map<String, Object>> updateComplaintRule(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                              @RequestHeader(value = "Authorization", required = false) String authorization,
                                                              @PathVariable String id,
                                                              @RequestBody Map<String, Object> payload) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminSaveComplaintRule(withId(id, payload)));
  }

  @DeleteMapping("/complaint-rules/{id}")
  public ApiResponse<Map<String, Object>> deleteComplaintRule(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                              @RequestHeader(value = "Authorization", required = false) String authorization,
                                                              @PathVariable String id) {
    checkAdmin(apiKey, authorization);
    service.adminDeleteComplaintRule(id);
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("success", true);
    return ApiResponse.ok(result);
  }

  @GetMapping("/feedbacks")
  public ApiResponse<Object> feedbacks(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                       @RequestHeader(value = "Authorization", required = false) String authorization) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminListFeedbacks());
  }

  @GetMapping("/feedbacks/{id}")
  public ApiResponse<Map<String, Object>> feedbackDetail(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                         @RequestHeader(value = "Authorization", required = false) String authorization,
                                                         @PathVariable String id) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminGetFeedback(id));
  }

  @PostMapping("/feedbacks")
  public ApiResponse<Map<String, Object>> createFeedback(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                         @RequestHeader(value = "Authorization", required = false) String authorization,
                                                         @RequestBody Map<String, Object> payload) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminSaveFeedback(payload));
  }

  @PutMapping("/feedbacks/{id}")
  public ApiResponse<Map<String, Object>> updateFeedback(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                         @RequestHeader(value = "Authorization", required = false) String authorization,
                                                         @PathVariable String id,
                                                         @RequestBody Map<String, Object> payload) {
    checkAdmin(apiKey, authorization);
    payload.put("id", id);
    return ApiResponse.ok(service.adminSaveFeedback(payload));
  }

  @DeleteMapping("/feedbacks/{id}")
  public ApiResponse<Map<String, Object>> deleteFeedback(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                         @RequestHeader(value = "Authorization", required = false) String authorization,
                                                         @PathVariable String id) {
    checkAdmin(apiKey, authorization);
    service.adminDeleteFeedback(id);
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("success", true);
    return ApiResponse.ok(result);
  }

  @PostMapping("/feedbacks/{id}/reply")
  public ApiResponse<Map<String, Object>> replyFeedback(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                        @RequestHeader(value = "Authorization", required = false) String authorization,
                                                        @PathVariable String id,
                                                        @RequestBody Map<String, Object> payload) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminReplyFeedback(id, payload));
  }

  @GetMapping("/community")
  public ApiResponse<Map<String, Object>> community(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                    @RequestHeader(value = "Authorization", required = false) String authorization) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminGetCommunity());
  }

  @PutMapping("/community")
  public ApiResponse<Map<String, Object>> saveCommunity(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                        @RequestHeader(value = "Authorization", required = false) String authorization,
                                                        @RequestBody Map<String, Object> payload) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminSaveCommunity(payload));
  }

  @GetMapping("/communities")
  public ApiResponse<Object> communities(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                         @RequestHeader(value = "Authorization", required = false) String authorization) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminListCommunities());
  }

  @GetMapping("/communities/{id}")
  public ApiResponse<Map<String, Object>> communityDetail(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                          @RequestHeader(value = "Authorization", required = false) String authorization,
                                                          @PathVariable String id) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminGetCommunityById(id));
  }

  @PostMapping("/communities")
  public ApiResponse<Map<String, Object>> createCommunity(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                          @RequestHeader(value = "Authorization", required = false) String authorization,
                                                          @RequestBody Map<String, Object> payload) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminSaveCommunity(payload));
  }

  @PutMapping("/communities/{id}")
  public ApiResponse<Map<String, Object>> updateCommunity(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                          @RequestHeader(value = "Authorization", required = false) String authorization,
                                                          @PathVariable String id,
                                                          @RequestBody Map<String, Object> payload) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminSaveCommunity(withId(id, payload)));
  }

  @PostMapping("/communities/{id}/activate")
  public ApiResponse<Map<String, Object>> activateCommunity(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                            @RequestHeader(value = "Authorization", required = false) String authorization,
                                                            @PathVariable String id) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminActivateCommunity(id));
  }

  @DeleteMapping("/communities/{id}")
  public ApiResponse<Map<String, Object>> deleteCommunity(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                          @RequestHeader(value = "Authorization", required = false) String authorization,
                                                          @PathVariable String id) {
    checkAdmin(apiKey, authorization);
    service.adminDeleteCommunity(id);
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("success", true);
    return ApiResponse.ok(result);
  }

  @GetMapping("/users")
  public ApiResponse<Object> users(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                   @RequestHeader(value = "Authorization", required = false) String authorization) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminListUsers());
  }

  @GetMapping("/users/{id}")
  public ApiResponse<Map<String, Object>> userDetail(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                     @RequestHeader(value = "Authorization", required = false) String authorization,
                                                     @PathVariable String id) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminGetUser(id));
  }

  @PostMapping("/users")
  public ApiResponse<Map<String, Object>> createUser(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                     @RequestHeader(value = "Authorization", required = false) String authorization,
                                                     @RequestBody Map<String, Object> payload) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminSaveUser(payload));
  }

  @PutMapping("/users/{id}")
  public ApiResponse<Map<String, Object>> updateUser(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                     @RequestHeader(value = "Authorization", required = false) String authorization,
                                                     @PathVariable String id,
                                                     @RequestBody Map<String, Object> payload) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminSaveUser(withId(id, payload)));
  }

  @DeleteMapping("/users/{id}")
  public ApiResponse<Map<String, Object>> deleteUser(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                     @RequestHeader(value = "Authorization", required = false) String authorization,
                                                     @PathVariable String id) {
    checkAdmin(apiKey, authorization);
    service.adminDeleteUser(id);
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("success", true);
    return ApiResponse.ok(result);
  }

  @GetMapping("/houses")
  public ApiResponse<Object> houses(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                    @RequestHeader(value = "Authorization", required = false) String authorization) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminListHouses());
  }

  @GetMapping("/houses/{id}")
  public ApiResponse<Map<String, Object>> houseDetail(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                      @RequestHeader(value = "Authorization", required = false) String authorization,
                                                      @PathVariable String id) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminGetHouse(id));
  }

  @PostMapping("/houses")
  public ApiResponse<Map<String, Object>> createHouse(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                      @RequestHeader(value = "Authorization", required = false) String authorization,
                                                      @RequestBody Map<String, Object> payload) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminSaveHouse(payload));
  }

  @PutMapping("/houses/{id}")
  public ApiResponse<Map<String, Object>> updateHouse(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                      @RequestHeader(value = "Authorization", required = false) String authorization,
                                                      @PathVariable String id,
                                                      @RequestBody Map<String, Object> payload) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminSaveHouse(withId(id, payload)));
  }

  @DeleteMapping("/houses/{id}")
  public ApiResponse<Map<String, Object>> deleteHouse(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                      @RequestHeader(value = "Authorization", required = false) String authorization,
                                                      @PathVariable String id) {
    checkAdmin(apiKey, authorization);
    service.adminDeleteHouse(id);
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("success", true);
    return ApiResponse.ok(result);
  }

  @GetMapping("/staffs")
  public ApiResponse<Object> staffs(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                    @RequestHeader(value = "Authorization", required = false) String authorization) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminListStaffs());
  }

  @GetMapping("/staffs/{id}")
  public ApiResponse<Map<String, Object>> staffDetail(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                     @RequestHeader(value = "Authorization", required = false) String authorization,
                                                     @PathVariable String id) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminGetStaff(id));
  }

  @PostMapping("/staffs")
  public ApiResponse<Map<String, Object>> createStaff(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                     @RequestHeader(value = "Authorization", required = false) String authorization,
                                                     @RequestBody Map<String, Object> payload) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminSaveStaff(payload));
  }

  @PutMapping("/staffs/{id}")
  public ApiResponse<Map<String, Object>> updateStaff(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                     @RequestHeader(value = "Authorization", required = false) String authorization,
                                                     @PathVariable String id,
                                                     @RequestBody Map<String, Object> payload) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminSaveStaff(withId(id, payload)));
  }

  @DeleteMapping("/staffs/{id}")
  public ApiResponse<Map<String, Object>> deleteStaff(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                     @RequestHeader(value = "Authorization", required = false) String authorization,
                                                     @PathVariable String id) {
    checkAdmin(apiKey, authorization);
    service.adminDeleteStaff(id);
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("success", true);
    return ApiResponse.ok(result);
  }

  @GetMapping("/visitors")
  public ApiResponse<Object> visitors(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                      @RequestHeader(value = "Authorization", required = false) String authorization) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminListVisitors());
  }

  @GetMapping("/visitors/{id}")
  public ApiResponse<Map<String, Object>> visitorDetail(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                        @RequestHeader(value = "Authorization", required = false) String authorization,
                                                        @PathVariable String id) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminGetVisitor(id));
  }

  @PostMapping("/visitors")
  public ApiResponse<Map<String, Object>> createVisitor(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                        @RequestHeader(value = "Authorization", required = false) String authorization,
                                                        @RequestBody Map<String, Object> payload) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminSaveVisitor(payload));
  }

  @PutMapping("/visitors/{id}")
  public ApiResponse<Map<String, Object>> updateVisitor(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                        @RequestHeader(value = "Authorization", required = false) String authorization,
                                                        @PathVariable String id,
                                                        @RequestBody Map<String, Object> payload) {
    checkAdmin(apiKey, authorization);
    payload.put("id", id);
    return ApiResponse.ok(service.adminSaveVisitor(payload));
  }

  @DeleteMapping("/visitors/{id}")
  public ApiResponse<Map<String, Object>> deleteVisitor(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                        @RequestHeader(value = "Authorization", required = false) String authorization,
                                                        @PathVariable String id) {
    checkAdmin(apiKey, authorization);
    service.adminDeleteVisitor(id);
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("success", true);
    return ApiResponse.ok(result);
  }

  @PostMapping("/visitors/{id}/invalidate")
  public ApiResponse<Map<String, Object>> invalidateVisitor(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                            @RequestHeader(value = "Authorization", required = false) String authorization,
                                                            @PathVariable String id) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminInvalidateVisitor(id));
  }

  @GetMapping("/decorations")
  public ApiResponse<Object> decorations(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                         @RequestHeader(value = "Authorization", required = false) String authorization) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminListDecorations());
  }

  @GetMapping("/decorations/{id}")
  public ApiResponse<Map<String, Object>> decorationDetail(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                           @RequestHeader(value = "Authorization", required = false) String authorization,
                                                           @PathVariable String id) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminGetDecoration(id));
  }

  @PostMapping("/decorations")
  public ApiResponse<Map<String, Object>> createDecoration(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                           @RequestHeader(value = "Authorization", required = false) String authorization,
                                                           @RequestBody Map<String, Object> payload) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminSaveDecoration(payload));
  }

  @PutMapping("/decorations/{id}")
  public ApiResponse<Map<String, Object>> updateDecoration(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                           @RequestHeader(value = "Authorization", required = false) String authorization,
                                                           @PathVariable String id,
                                                           @RequestBody Map<String, Object> payload) {
    checkAdmin(apiKey, authorization);
    payload.put("id", id);
    return ApiResponse.ok(service.adminSaveDecoration(payload));
  }

  @DeleteMapping("/decorations/{id}")
  public ApiResponse<Map<String, Object>> deleteDecoration(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                           @RequestHeader(value = "Authorization", required = false) String authorization,
                                                           @PathVariable String id) {
    checkAdmin(apiKey, authorization);
    service.adminDeleteDecoration(id);
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("success", true);
    return ApiResponse.ok(result);
  }

  @PostMapping("/decorations/{id}/review")
  public ApiResponse<Map<String, Object>> reviewDecoration(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                           @RequestHeader(value = "Authorization", required = false) String authorization,
                                                           @PathVariable String id,
                                                           @RequestBody Map<String, Object> payload) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminReviewDecoration(id, payload));
  }

  @GetMapping("/express")
  public ApiResponse<Object> express(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                     @RequestHeader(value = "Authorization", required = false) String authorization) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminListExpress());
  }

  @GetMapping("/express/{id}")
  public ApiResponse<Map<String, Object>> expressDetail(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                        @RequestHeader(value = "Authorization", required = false) String authorization,
                                                        @PathVariable String id) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminGetExpress(id));
  }

  @PostMapping("/express")
  public ApiResponse<Map<String, Object>> createExpress(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                        @RequestHeader(value = "Authorization", required = false) String authorization,
                                                        @RequestBody Map<String, Object> payload) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminSaveExpress(payload));
  }

  @PutMapping("/express/{id}")
  public ApiResponse<Map<String, Object>> updateExpress(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                        @RequestHeader(value = "Authorization", required = false) String authorization,
                                                        @PathVariable String id,
                                                        @RequestBody Map<String, Object> payload) {
    checkAdmin(apiKey, authorization);
    payload.put("id", id);
    return ApiResponse.ok(service.adminSaveExpress(payload));
  }

  @DeleteMapping("/express/{id}")
  public ApiResponse<Map<String, Object>> deleteExpress(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                        @RequestHeader(value = "Authorization", required = false) String authorization,
                                                        @PathVariable String id) {
    checkAdmin(apiKey, authorization);
    service.adminDeleteExpress(id);
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("success", true);
    return ApiResponse.ok(result);
  }

  @PostMapping("/express/{id}/pickup")
  public ApiResponse<Map<String, Object>> pickupExpress(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                        @RequestHeader(value = "Authorization", required = false) String authorization,
                                                        @PathVariable String id,
                                                        @RequestBody Map<String, Object> payload) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminPickupExpress(id, payload));
  }

  @GetMapping("/vegetables/products")
  public ApiResponse<Object> vegetableProducts(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                               @RequestHeader(value = "Authorization", required = false) String authorization) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminListVegetableProducts());
  }

  @GetMapping("/vegetables/products/{id}")
  public ApiResponse<Map<String, Object>> vegetableProductDetail(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                                 @RequestHeader(value = "Authorization", required = false) String authorization,
                                                                 @PathVariable String id) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminGetVegetableProduct(id));
  }

  @PostMapping("/vegetables/products")
  public ApiResponse<Map<String, Object>> createVegetableProduct(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                                  @RequestHeader(value = "Authorization", required = false) String authorization,
                                                                  @RequestBody Map<String, Object> payload) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminSaveVegetableProduct(payload));
  }

  @PutMapping("/vegetables/products/{id}")
  public ApiResponse<Map<String, Object>> updateVegetableProduct(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                                  @RequestHeader(value = "Authorization", required = false) String authorization,
                                                                  @PathVariable String id,
                                                                  @RequestBody Map<String, Object> payload) {
    checkAdmin(apiKey, authorization);
    payload.put("id", id);
    return ApiResponse.ok(service.adminSaveVegetableProduct(payload));
  }

  @DeleteMapping("/vegetables/products/{id}")
  public ApiResponse<Map<String, Object>> deleteVegetableProduct(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                                  @RequestHeader(value = "Authorization", required = false) String authorization,
                                                                  @PathVariable String id) {
    checkAdmin(apiKey, authorization);
    service.adminDeleteVegetableProduct(id);
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("success", true);
    return ApiResponse.ok(result);
  }

  @GetMapping("/vegetables/orders")
  public ApiResponse<Object> vegetableOrders(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                             @RequestHeader(value = "Authorization", required = false) String authorization) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminListVegetableOrders());
  }

  @GetMapping("/vegetables/orders/{id}")
  public ApiResponse<Map<String, Object>> vegetableOrderDetail(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                               @RequestHeader(value = "Authorization", required = false) String authorization,
                                                               @PathVariable String id) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminGetVegetableOrder(id));
  }

  @PostMapping("/vegetables/orders")
  public ApiResponse<Map<String, Object>> createVegetableOrder(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                               @RequestHeader(value = "Authorization", required = false) String authorization,
                                                               @RequestBody Map<String, Object> payload) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.adminSaveVegetableOrder(payload));
  }

  @PutMapping("/vegetables/orders/{id}")
  public ApiResponse<Map<String, Object>> updateVegetableOrder(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                               @RequestHeader(value = "Authorization", required = false) String authorization,
                                                               @PathVariable String id,
                                                               @RequestBody Map<String, Object> payload) {
    checkAdmin(apiKey, authorization);
    payload.put("id", id);
    return ApiResponse.ok(service.adminSaveVegetableOrder(payload));
  }

  @DeleteMapping("/vegetables/orders/{id}")
  public ApiResponse<Map<String, Object>> deleteVegetableOrder(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                               @RequestHeader(value = "Authorization", required = false) String authorization,
                                                               @PathVariable String id) {
    checkAdmin(apiKey, authorization);
    service.adminDeleteVegetableOrder(id);
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("success", true);
    return ApiResponse.ok(result);
  }
}
