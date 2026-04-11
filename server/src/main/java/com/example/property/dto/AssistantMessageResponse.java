package com.example.property.dto;

import java.util.List;
import java.util.Map;

public class AssistantMessageResponse {
  public String replyText;
  public String intent;
  public Double confidence;
  public Boolean needConfirm;
  public Boolean handoff;
  public Map<String, Object> action;
  public Map<String, Object> slots;
  public List<String> quickReplies;
  public String reason;
  public Map<String, Object> data;
}
