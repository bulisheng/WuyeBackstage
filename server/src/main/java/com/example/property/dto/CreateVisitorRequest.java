package com.example.property.dto;

import javax.validation.constraints.NotBlank;

public class CreateVisitorRequest {
  @NotBlank
  public String visitorName;

  @NotBlank
  public String visitorPhone;

  public String visitPurpose;
  public Integer expireHours;
  public String passCode;
}
