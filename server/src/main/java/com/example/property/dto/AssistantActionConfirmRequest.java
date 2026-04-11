package com.example.property.dto;

import java.util.Map;

public class AssistantActionConfirmRequest {
  public String sessionId;
  public String actionId;
  public String actionType;
  public Boolean confirmed;
  public Map<String, Object> payload;
}
