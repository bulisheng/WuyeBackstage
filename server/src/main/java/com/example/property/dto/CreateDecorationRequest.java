package com.example.property.dto;

import javax.validation.constraints.NotBlank;

public class CreateDecorationRequest {
  @NotBlank
  public String decorationType;

  @NotBlank
  public String area;

  public String description;
  @NotBlank
  public String startDate;
  @NotBlank
  public String endDate;
  public String company;
  public String phone;
}
