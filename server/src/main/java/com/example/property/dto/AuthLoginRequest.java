package com.example.property.dto;

import javax.validation.constraints.NotBlank;
import java.util.Map;

public class AuthLoginRequest {
  @NotBlank
  public String phone;

  @NotBlank
  public String code;

  @NotBlank
  public String community;

  @NotBlank
  public String building;

  @NotBlank
  public String unit;

  @NotBlank
  public String room;

  public Map<String, Object> userInfo;
}
