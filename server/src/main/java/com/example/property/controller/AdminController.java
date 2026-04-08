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
}
