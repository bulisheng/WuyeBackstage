package com.example.property.dto;

import java.util.List;
import java.util.Map;

public class AssistantMessageRequest {
  public String sessionId;
  public String scene;
  public String role;
  public String content;
  public String contentType;
  public String communityId;
  public String community;
  public String houseId;
  public String userId;
  public String userName;
  public String room;
  public String phone;
  public String promptVersion;
  public String prompt;
  public List<Map<String, Object>> history;
  public Map<String, Object> context;
}
