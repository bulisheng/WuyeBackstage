package com.example.property.dto;

import javax.validation.constraints.NotBlank;

public class CreateRepairRequest {
  @NotBlank
  public String type;

  @NotBlank
  public String description;

  public String appointmentDate;
  public String appointmentSlot;
  public String phone;
}
