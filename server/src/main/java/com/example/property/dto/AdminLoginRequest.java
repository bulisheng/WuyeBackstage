package com.example.property.dto;

import javax.validation.constraints.NotBlank;

public class AdminLoginRequest {
  @NotBlank
  public String adminKey;
}
