package com.example.property.common;

import java.util.UUID;

public class ApiResponse<T> {
  public int code;
  public String message;
  public T data;
  public String traceId;

  public ApiResponse() {
  }

  public ApiResponse(int code, String message, T data, String traceId) {
    this.code = code;
    this.message = message;
    this.data = data;
    this.traceId = traceId;
  }

  public static <T> ApiResponse<T> ok(T data) {
    return new ApiResponse<>(0, "ok", data, UUID.randomUUID().toString());
  }

  public static <T> ApiResponse<T> ok(String message, T data) {
    return new ApiResponse<>(0, message, data, UUID.randomUUID().toString());
  }

  public static <T> ApiResponse<T> fail(int code, String message) {
    return new ApiResponse<>(code, message, null, UUID.randomUUID().toString());
  }
}
