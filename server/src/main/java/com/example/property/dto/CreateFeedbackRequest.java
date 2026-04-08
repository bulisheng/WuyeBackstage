package com.example.property.dto;

import javax.validation.constraints.NotBlank;

public class CreateFeedbackRequest {
  @NotBlank
  public String type;

  public String category;
  public String title;
  public String description;

  @NotBlank
  public String content;

  public String staffName;
  public String staffPosition;
  public String location;
  public String phone;
}
