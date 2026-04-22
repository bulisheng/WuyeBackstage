package com.example.property.dto;

import javax.validation.constraints.NotBlank;
import java.util.Map;

public class AuthLoginRequest {
  @NotBlank
  public String phone;

  @NotBlank
  public String code;

  public String community;

  public String building;

  public String unit;

  public String room;

  public String houseId;
  public String houseNo;
  public String relationship;

  public Map<String, Object> userInfo;
}
