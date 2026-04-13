package com.example.property.dto;

import java.util.List;
import java.util.Map;

public class AssistantSessionRequest {
  public String scene;
  public String subjectId;
  public String communityId;
  public String community;
  public String assistantName;
  public String prompt;
  public String inputText;
  public String houseId;
  public String userId;
  public String userName;
  public String room;
  public String phone;
  public String promptVersion;
  public String assistantProvider;
  public String openclawMode;
  public String openclawBaseUrl;
  public String openclawLocalBaseUrl;
  public String openclawRemoteBaseUrl;
  public String gemmaMode;
  public String gemmaBaseUrl;
  public String gemmaLocalBaseUrl;
  public String gemmaRemoteBaseUrl;
  public String gemmaChatPath;
  public String gemmaModel;
  public Double gemmaTemperature;
  public Integer gemmaMaxTokens;
  public String openclawSessionPath;
  public String openclawMessagePath;
  public String openclawHandoffPath;
  public String defaultSupervisor;
  public List<String> enabledScenes;
  public Map<String, Object> context;
}
