package com.example.property.controller;

import com.example.property.common.ApiResponse;
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
import com.example.property.service.PropertyDataService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class ApiController {
  private final PropertyDataService service;

  @Value("${admin.api-key:dev-admin-123456}")
  private String adminApiKey;

  public ApiController(PropertyDataService service) {
    this.service = service;
  }

  private String token(String authorization) {
    if (authorization == null || authorization.isEmpty()) {
      return null;
    }
    if (authorization.startsWith("Bearer ")) {
      return authorization.substring(7);
    }
    return authorization;
  }

  private void checkAdmin(String apiKey, String authorization) {
    if (apiKey != null && !apiKey.isEmpty() && adminApiKey.equals(apiKey)) {
      return;
    }
    if (authorization != null && !authorization.isEmpty()) {
      service.adminMe(token(authorization));
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

  @PostMapping("/auth/wechat/login")
  public ApiResponse<Map<String, Object>> login(@RequestBody AuthLoginRequest request) {
    return ApiResponse.ok(service.login(request));
  }

  @PostMapping("/auth/logout")
  public ApiResponse<Map<String, Object>> logout() {
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("success", true);
    return ApiResponse.ok(result);
  }

  @GetMapping("/users/me")
  public ApiResponse<Map<String, Object>> me(@RequestHeader(value = "Authorization", required = false) String authorization) {
    return ApiResponse.ok(service.getCurrentUser(token(authorization)));
  }

  @PutMapping("/users/me")
  public ApiResponse<Map<String, Object>> updateMe(@RequestHeader(value = "Authorization", required = false) String authorization,
                                                   @RequestBody Map<String, Object> payload) {
    return ApiResponse.ok(service.updateCurrentUser(token(authorization), payload));
  }

  @GetMapping("/dashboard")
  public ApiResponse<Map<String, Object>> dashboard(@RequestHeader(value = "Authorization", required = false) String authorization) {
    return ApiResponse.ok(service.dashboard(token(authorization)));
  }

  @GetMapping("/community/current")
  public ApiResponse<Map<String, Object>> communityCurrent() {
    return ApiResponse.ok(service.communityCurrent());
  }

  @GetMapping("/notices")
  public ApiResponse<Object> notices() {
    return ApiResponse.ok(service.listNotices());
  }

  @GetMapping("/notices/{id}")
  public ApiResponse<Map<String, Object>> noticeDetail(@PathVariable String id) {
    return ApiResponse.ok(service.getNotice(id));
  }

  @GetMapping("/bills")
  public ApiResponse<Object> bills(@RequestHeader(value = "Authorization", required = false) String authorization,
                                   @RequestParam(value = "status", required = false) String status) {
    return ApiResponse.ok(service.listBills(token(authorization), status));
  }

  @GetMapping("/bills/{id}")
  public ApiResponse<Map<String, Object>> billDetail(@RequestHeader(value = "Authorization", required = false) String authorization,
                                                     @PathVariable String id) {
    return ApiResponse.ok(service.getBill(token(authorization), id));
  }

  @GetMapping("/bills/summary")
  public ApiResponse<Map<String, Object>> billSummary(@RequestHeader(value = "Authorization", required = false) String authorization) {
    return ApiResponse.ok(service.summaryBills(token(authorization)));
  }

  @PostMapping("/bills/{id}/pay")
  public ApiResponse<Map<String, Object>> payBill(@RequestHeader(value = "Authorization", required = false) String authorization,
                                                  @PathVariable String id,
                                                  @RequestBody(required = false) PayBillRequest request) {
    return ApiResponse.ok(service.payBill(token(authorization), id, request));
  }

  @GetMapping("/repairs")
  public ApiResponse<Object> repairs(@RequestHeader(value = "Authorization", required = false) String authorization,
                                     @RequestParam(value = "status", required = false) String status) {
    return ApiResponse.ok(service.listRepairs(token(authorization), status));
  }

  @GetMapping("/repairs/{id}")
  public ApiResponse<Map<String, Object>> repairDetail(@RequestHeader(value = "Authorization", required = false) String authorization,
                                                       @PathVariable String id) {
    return ApiResponse.ok(service.getRepair(token(authorization), id));
  }

  @PostMapping("/repairs")
  public ApiResponse<Map<String, Object>> createRepair(@RequestHeader(value = "Authorization", required = false) String authorization,
                                                       @RequestBody CreateRepairRequest request) {
    return ApiResponse.ok(service.createRepair(token(authorization), request));
  }

  @PostMapping("/repairs/{id}/comments")
  public ApiResponse<Map<String, Object>> addRepairComment(@RequestHeader(value = "Authorization", required = false) String authorization,
                                                           @PathVariable String id,
                                                           @RequestBody Map<String, Object> payload) {
    return ApiResponse.ok(service.addRepairComment(token(authorization), id, payload));
  }

  @GetMapping(value = "/repairs/{id}/ack", produces = MediaType.TEXT_HTML_VALUE)
  public ResponseEntity<String> ackRepair(@PathVariable String id,
                                          @RequestParam(value = "ts", required = false) String ts,
                                          @RequestParam(value = "sign", required = false) String sign) {
    try {
      Map<String, Object> repair = service.acknowledgeRepair(id, ts, sign);
      return ResponseEntity.ok()
          .contentType(MediaType.TEXT_HTML)
          .body(buildRepairAckHtml("签收成功", repair));
    } catch (BusinessException error) {
      return ResponseEntity.status(error.getCode())
          .contentType(MediaType.TEXT_HTML)
          .body(buildRepairAckHtml("签收失败", error.getMessage()));
    } catch (Exception error) {
      return ResponseEntity.status(500)
          .contentType(MediaType.TEXT_HTML)
          .body(buildRepairAckHtml("签收失败", error.getMessage() == null ? "系统异常" : error.getMessage()));
    }
  }

  @GetMapping(value = "/repairs/{id}/complete", produces = MediaType.TEXT_HTML_VALUE)
  public ResponseEntity<String> completeRepair(@PathVariable String id,
                                               @RequestParam(value = "ts", required = false) String ts,
                                               @RequestParam(value = "sign", required = false) String sign) {
    try {
      Map<String, Object> repair = service.completeRepair(id, ts, sign);
      return ResponseEntity.ok()
          .contentType(MediaType.TEXT_HTML)
          .body(buildRepairAckHtml("完成成功", repair));
    } catch (BusinessException error) {
      return ResponseEntity.status(error.getCode())
          .contentType(MediaType.TEXT_HTML)
          .body(buildRepairAckHtml("完成失败", error.getMessage()));
    } catch (Exception error) {
      return ResponseEntity.status(500)
          .contentType(MediaType.TEXT_HTML)
          .body(buildRepairAckHtml("完成失败", error.getMessage() == null ? "系统异常" : error.getMessage()));
    }
  }

  @GetMapping(value = "/complaints/{id}/ack", produces = MediaType.TEXT_HTML_VALUE)
  public ResponseEntity<String> ackComplaint(@PathVariable String id,
                                             @RequestParam(value = "ts", required = false) String ts,
                                             @RequestParam(value = "sign", required = false) String sign) {
    try {
      Map<String, Object> complaint = service.acknowledgeComplaintQueue(id, ts, sign);
      return ResponseEntity.ok()
          .contentType(MediaType.TEXT_HTML)
          .body(buildRepairAckHtml("受理成功", complaint));
    } catch (BusinessException error) {
      return ResponseEntity.status(error.getCode())
          .contentType(MediaType.TEXT_HTML)
          .body(buildRepairAckHtml("受理失败", error.getMessage()));
    } catch (Exception error) {
      return ResponseEntity.status(500)
          .contentType(MediaType.TEXT_HTML)
          .body(buildRepairAckHtml("受理失败", error.getMessage() == null ? "系统异常" : error.getMessage()));
    }
  }

  @GetMapping(value = "/complaints/{id}/complete", produces = MediaType.TEXT_HTML_VALUE)
  public ResponseEntity<String> completeComplaint(@PathVariable String id,
                                                  @RequestParam(value = "ts", required = false) String ts,
                                                  @RequestParam(value = "sign", required = false) String sign) {
    try {
      Map<String, Object> complaint = service.completeComplaintQueue(id, ts, sign);
      return ResponseEntity.ok()
          .contentType(MediaType.TEXT_HTML)
          .body(buildRepairAckHtml("处理成功", complaint));
    } catch (BusinessException error) {
      return ResponseEntity.status(error.getCode())
          .contentType(MediaType.TEXT_HTML)
          .body(buildRepairAckHtml("处理失败", error.getMessage()));
    } catch (Exception error) {
      return ResponseEntity.status(500)
          .contentType(MediaType.TEXT_HTML)
          .body(buildRepairAckHtml("处理失败", error.getMessage() == null ? "系统异常" : error.getMessage()));
    }
  }

  @GetMapping(value = "/visitors/{id}/invalidate", produces = MediaType.TEXT_HTML_VALUE)
  public ResponseEntity<String> invalidateVisitorLink(@PathVariable String id,
                                                     @RequestParam(value = "ts", required = false) String ts,
                                                     @RequestParam(value = "sign", required = false) String sign) {
    try {
      Map<String, Object> visitor = service.invalidateVisitor(id, ts, sign);
      return ResponseEntity.ok()
          .contentType(MediaType.TEXT_HTML)
          .body(buildRepairAckHtml("访客已失效", visitor));
    } catch (BusinessException error) {
      return ResponseEntity.status(error.getCode())
          .contentType(MediaType.TEXT_HTML)
          .body(buildRepairAckHtml("失效失败", error.getMessage()));
    } catch (Exception error) {
      return ResponseEntity.status(500)
          .contentType(MediaType.TEXT_HTML)
          .body(buildRepairAckHtml("失效失败", error.getMessage() == null ? "系统异常" : error.getMessage()));
    }
  }

  @GetMapping(value = "/decorations/{id}/review/{action}", produces = MediaType.TEXT_HTML_VALUE)
  public ResponseEntity<String> reviewDecorationLink(@PathVariable String id,
                                                     @PathVariable String action,
                                                     @RequestParam(value = "ts", required = false) String ts,
                                                     @RequestParam(value = "sign", required = false) String sign) {
    try {
      Map<String, Object> decoration = service.reviewDecoration(id, action, ts, sign);
      String title = "reject".equalsIgnoreCase(action) || "rejected".equalsIgnoreCase(action) ? "装修已驳回" : "装修已通过";
      return ResponseEntity.ok()
          .contentType(MediaType.TEXT_HTML)
          .body(buildRepairAckHtml(title, decoration));
    } catch (BusinessException error) {
      return ResponseEntity.status(error.getCode())
          .contentType(MediaType.TEXT_HTML)
          .body(buildRepairAckHtml("审核失败", error.getMessage()));
    } catch (Exception error) {
      return ResponseEntity.status(500)
          .contentType(MediaType.TEXT_HTML)
          .body(buildRepairAckHtml("审核失败", error.getMessage() == null ? "系统异常" : error.getMessage()));
    }
  }

  private String buildRepairAckHtml(String title, Object content) {
    String safeTitle = escapeHtml(title == null ? "签收结果" : String.valueOf(title));
    String safeContent;
    if (content instanceof Map) {
      try {
        safeContent = escapeHtml(new com.fasterxml.jackson.databind.ObjectMapper()
            .writerWithDefaultPrettyPrinter()
            .writeValueAsString(content));
      } catch (Exception error) {
        safeContent = escapeHtml(String.valueOf(content));
      }
    } else {
      safeContent = escapeHtml(String.valueOf(content));
    }
    String text = String.join("\n",
        "<!doctype html>",
        "<html lang=\"zh-CN\">",
        "<head>",
        "<meta charset=\"utf-8\"/>",
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"/>",
        "<title>" + safeTitle + "</title>",
        "<style>",
        "body{font-family:Arial,'Microsoft YaHei',sans-serif;background:#f5f7fb;color:#1f2937;margin:0;padding:24px;}",
        ".card{max-width:720px;margin:0 auto;background:#fff;border-radius:18px;padding:24px;box-shadow:0 10px 30px rgba(15,23,42,.08);}",
        ".title{font-size:28px;font-weight:700;margin:0 0 12px;}",
        ".desc{font-size:16px;line-height:1.8;white-space:pre-wrap;word-break:break-word;background:#f8fafc;border-radius:14px;padding:16px;}",
        "</style>",
        "</head>",
        "<body>",
        "<div class=\"card\">",
        "<div class=\"title\">" + safeTitle + "</div>",
        "<div class=\"desc\">" + safeContent + "</div>",
        "</div>",
        "</body>",
        "</html>");
    return text;
  }

  private String escapeHtml(String value) {
    if (value == null) {
      return "";
    }
    return value
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;")
        .replace("'", "&#39;");
  }

  @PostMapping("/repairs/{id}/assign")
  public ApiResponse<Map<String, Object>> assignRepair(@RequestHeader(value = "Authorization", required = false) String authorization,
                                                        @PathVariable String id,
                                                        @RequestBody Map<String, Object> payload) {
    return ApiResponse.ok(service.assignRepair(token(authorization), id, payload));
  }

  @GetMapping("/visitors")
  public ApiResponse<Object> visitors(@RequestHeader(value = "Authorization", required = false) String authorization) {
    return ApiResponse.ok(service.listVisitors(token(authorization)));
  }

  @GetMapping("/visitors/{id}")
  public ApiResponse<Map<String, Object>> visitorDetail(@RequestHeader(value = "Authorization", required = false) String authorization,
                                                        @PathVariable String id) {
    return ApiResponse.ok(service.getVisitor(token(authorization), id));
  }

  @PostMapping("/visitors")
  public ApiResponse<Map<String, Object>> createVisitor(@RequestHeader(value = "Authorization", required = false) String authorization,
                                                        @RequestBody CreateVisitorRequest request) {
    return ApiResponse.ok(service.createVisitor(token(authorization), request));
  }

  @PostMapping("/visitors/{id}/invalidate")
  public ApiResponse<Map<String, Object>> invalidateVisitor(@RequestHeader(value = "Authorization", required = false) String authorization,
                                                            @PathVariable String id) {
    return ApiResponse.ok(service.invalidateVisitor(token(authorization), id));
  }

  @GetMapping("/decorations")
  public ApiResponse<Object> decorations(@RequestHeader(value = "Authorization", required = false) String authorization) {
    return ApiResponse.ok(service.listDecorations(token(authorization)));
  }

  @GetMapping("/decorations/{id}")
  public ApiResponse<Map<String, Object>> decorationDetail(@RequestHeader(value = "Authorization", required = false) String authorization,
                                                           @PathVariable String id) {
    return ApiResponse.ok(service.getDecoration(token(authorization), id));
  }

  @PostMapping("/decorations")
  public ApiResponse<Map<String, Object>> createDecoration(@RequestHeader(value = "Authorization", required = false) String authorization,
                                                           @RequestBody CreateDecorationRequest request) {
    return ApiResponse.ok(service.createDecoration(token(authorization), request));
  }

  @PostMapping("/decorations/{id}/review")
  public ApiResponse<Map<String, Object>> reviewDecoration(@RequestHeader(value = "Authorization", required = false) String authorization,
                                                           @PathVariable String id,
                                                           @RequestBody Map<String, Object> payload) {
    return ApiResponse.ok(service.reviewDecoration(token(authorization), id, payload));
  }

  @GetMapping("/feedbacks")
  public ApiResponse<Object> feedbacks(@RequestHeader(value = "Authorization", required = false) String authorization,
                                       @RequestParam(value = "type", required = false) String type) {
    return ApiResponse.ok(service.listFeedbacks(token(authorization), type));
  }

  @GetMapping("/feedbacks/{id}")
  public ApiResponse<Map<String, Object>> feedbackDetail(@RequestHeader(value = "Authorization", required = false) String authorization,
                                                         @PathVariable String id) {
    return ApiResponse.ok(service.getFeedback(token(authorization), id));
  }

  @PostMapping("/feedbacks")
  public ApiResponse<Map<String, Object>> createFeedback(@RequestHeader(value = "Authorization", required = false) String authorization,
                                                         @RequestBody CreateFeedbackRequest request) {
    return ApiResponse.ok(service.createFeedback(token(authorization), request));
  }

  @PostMapping("/feedbacks/{id}/reply")
  public ApiResponse<Map<String, Object>> replyFeedback(@RequestHeader(value = "Authorization", required = false) String authorization,
                                                        @PathVariable String id,
                                                        @RequestBody Map<String, Object> payload) {
    return ApiResponse.ok(service.replyFeedback(token(authorization), id, payload));
  }

  @GetMapping("/express")
  public ApiResponse<Object> express(@RequestHeader(value = "Authorization", required = false) String authorization) {
    return ApiResponse.ok(service.listExpress(token(authorization)));
  }

  @PostMapping("/express/{id}/pickup")
  public ApiResponse<Map<String, Object>> pickupExpress(@RequestHeader(value = "Authorization", required = false) String authorization,
                                                        @PathVariable String id,
                                                        @RequestBody Map<String, Object> payload) {
    return ApiResponse.ok(service.pickupExpress(token(authorization), id, payload));
  }

  @GetMapping("/vegetables/products")
  public ApiResponse<Object> vegetableProducts() {
    return ApiResponse.ok(service.listVegetableProducts());
  }

  @GetMapping("/vegetables/orders")
  public ApiResponse<Object> vegetableOrders(@RequestHeader(value = "Authorization", required = false) String authorization) {
    return ApiResponse.ok(service.listVegetableOrders(token(authorization)));
  }

  @PostMapping("/vegetables/orders")
  public ApiResponse<Map<String, Object>> createVegetableOrder(@RequestHeader(value = "Authorization", required = false) String authorization,
                                                               @RequestBody Map<String, Object> payload) {
    return ApiResponse.ok(service.createVegetableOrder(token(authorization), payload));
  }

  @PostMapping("/assistant/sessions")
  public ApiResponse<Map<String, Object>> createAssistantSession(@RequestHeader(value = "Authorization", required = false) String authorization,
                                                                  @RequestBody AssistantSessionRequest request) {
    return ApiResponse.ok(service.createAssistantSession(token(authorization), request));
  }

  @GetMapping("/assistant/sessions/{id}")
  public ApiResponse<Map<String, Object>> assistantSession(@RequestHeader(value = "Authorization", required = false) String authorization,
                                                           @PathVariable String id) {
    return ApiResponse.ok(service.getAssistantSession(token(authorization), id));
  }

  @GetMapping("/assistant/sessions")
  public ApiResponse<Object> assistantSessions(@RequestHeader(value = "Authorization", required = false) String authorization,
                                               @RequestParam(value = "communityId", required = false) String communityId) {
    checkAdmin(null, authorization);
    return ApiResponse.ok(service.adminListAssistantSessions(communityId));
  }

  @GetMapping("/assistant/settings")
  public ApiResponse<Map<String, Object>> assistantSettings(@RequestHeader(value = "Authorization", required = false) String authorization,
                                                            @RequestParam(value = "communityId", required = false) String communityId) {
    return ApiResponse.ok(service.getAssistantSettings(token(authorization), communityId));
  }

  @PutMapping("/assistant/settings")
  public ApiResponse<Map<String, Object>> saveAssistantSettings(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                                @RequestHeader(value = "Authorization", required = false) String authorization,
                                                                @RequestBody Map<String, Object> payload) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.saveAssistantSettings(token(authorization), payload));
  }

  @PostMapping("/assistant/settings/test")
  public ApiResponse<Map<String, Object>> testAssistantSettings(@RequestHeader(value = "X-Admin-Key", required = false) String apiKey,
                                                                @RequestHeader(value = "Authorization", required = false) String authorization,
                                                                @RequestBody Map<String, Object> payload) {
    checkAdmin(apiKey, authorization);
    return ApiResponse.ok(service.testAssistantSettings(token(authorization), payload));
  }

  @GetMapping("/assistant/faq")
  public ApiResponse<Object> assistantFaqs(@RequestHeader(value = "Authorization", required = false) String authorization,
                                           @RequestParam(value = "communityId", required = false) String communityId) {
    checkAdmin(null, authorization);
    return ApiResponse.ok(service.adminListAssistantFaqs(communityId));
  }

  @PostMapping("/assistant/faq")
  public ApiResponse<Map<String, Object>> createAssistantFaq(@RequestHeader(value = "Authorization", required = false) String authorization,
                                                             @RequestBody Map<String, Object> payload) {
    checkAdmin(null, authorization);
    return ApiResponse.ok(service.adminSaveAssistantFaq(payload));
  }

  @PutMapping("/assistant/faq/{id}")
  public ApiResponse<Map<String, Object>> updateAssistantFaq(@RequestHeader(value = "Authorization", required = false) String authorization,
                                                             @PathVariable String id,
                                                             @RequestBody Map<String, Object> payload) {
    checkAdmin(null, authorization);
    return ApiResponse.ok(service.adminSaveAssistantFaq(withId(id, payload)));
  }

  @DeleteMapping("/assistant/faq/{id}")
  public ApiResponse<Map<String, Object>> deleteAssistantFaq(@RequestHeader(value = "Authorization", required = false) String authorization,
                                                             @PathVariable String id) {
    checkAdmin(null, authorization);
    service.adminDeleteAssistantFaq(id);
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("success", true);
    return ApiResponse.ok(result);
  }

  @PostMapping("/assistant/messages")
  public ApiResponse<Map<String, Object>> assistantMessages(@RequestHeader(value = "Authorization", required = false) String authorization,
                                                            @RequestBody AssistantMessageRequest request) {
    return ApiResponse.ok(service.assistantMessage(token(authorization), request));
  }

  @PostMapping("/assistant/handoff")
  public ApiResponse<Map<String, Object>> assistantHandoff(@RequestHeader(value = "Authorization", required = false) String authorization,
                                                           @RequestBody AssistantHandoffRequest request) {
    return ApiResponse.ok(service.assistantHandoff(token(authorization), request));
  }

  @PostMapping("/assistant/callback/openclaw")
  public ApiResponse<Map<String, Object>> callbackOpenclaw(@RequestHeader(value = "Authorization", required = false) String authorization,
                                                           @RequestBody Map<String, Object> payload) {
    return ApiResponse.ok(service.callbackOpenclaw(token(authorization), payload));
  }

  @PostMapping("/assistant/draft-repair")
  public ApiResponse<Map<String, Object>> draftRepair(@RequestHeader(value = "Authorization", required = false) String authorization,
                                                      @RequestBody Map<String, Object> payload) {
    return ApiResponse.ok(service.draftRepair(token(authorization), payload));
  }

  @PostMapping("/assistant/draft-feedback")
  public ApiResponse<Map<String, Object>> draftFeedback(@RequestHeader(value = "Authorization", required = false) String authorization,
                                                         @RequestBody Map<String, Object> payload) {
    return ApiResponse.ok(service.draftFeedback(token(authorization), payload));
  }

  @PostMapping("/assistant/classify-intent")
  public ApiResponse<Map<String, Object>> classifyIntent(@RequestHeader(value = "Authorization", required = false) String authorization,
                                                         @RequestBody Map<String, Object> payload) {
    return ApiResponse.ok(service.classifyIntent(token(authorization), payload));
  }
}
