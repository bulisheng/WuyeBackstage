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
  public String communityId;
  public String community;
  public String houseId;
  public String houseNo;
  public String building;
  public String unit;
  public String room;
}
