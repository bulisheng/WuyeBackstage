package com.example.property.common;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {
  @ExceptionHandler(BusinessException.class)
  public ResponseEntity<ApiResponse<Object>> handleBusiness(BusinessException ex) {
    return ResponseEntity.ok(ApiResponse.fail(ex.getCode(), ex.getMessage()));
  }

  @ExceptionHandler({MethodArgumentNotValidException.class, BindException.class})
  public ResponseEntity<ApiResponse<Object>> handleValidation(Exception ex) {
    String message = "参数校验失败";
    if (ex instanceof MethodArgumentNotValidException) {
      message = ((MethodArgumentNotValidException) ex).getBindingResult()
          .getFieldErrors()
          .stream()
          .map(err -> err.getField() + " " + err.getDefaultMessage())
          .collect(Collectors.joining(", "));
    } else if (ex instanceof BindException) {
      message = ((BindException) ex).getBindingResult()
          .getFieldErrors()
          .stream()
          .map(err -> err.getField() + " " + err.getDefaultMessage())
          .collect(Collectors.joining(", "));
    }
    return ResponseEntity.badRequest().body(ApiResponse.fail(400, message));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiResponse<Object>> handleException(Exception ex) {
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(ApiResponse.fail(500, ex.getMessage() == null ? "internal error" : ex.getMessage()));
  }
}
