package com.example.property.dto;

import java.util.Map;

public class AssistantActionResponse {
  public String actionId;
  public String actionType;
  public String status;
  public String resultType;
  public String resultId;
  public String resultText;
  public Boolean needConfirm;
  public Map<String, Object> payload;
  public String createTime;
}
