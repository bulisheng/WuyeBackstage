package com.example.property.dto;

import java.util.List;
import java.util.Map;

public class AssistantSettingsRequest {
  public String communityId;
  public String community;
  public Boolean enabled;
  public String assistantName;
  public String openclawMode;
  public String openclawBaseUrl;
  public String openclawLocalBaseUrl;
  public String openclawRemoteBaseUrl;
  public String openclawModel;
  public String openclawSessionPath;
  public String openclawMessagePath;
  public String openclawHandoffPath;
  public String promptVersion;
  public Integer analysisTimeoutMs;
  public Boolean fallbackToHeuristic;
  public Boolean autoCreateSession;
  public Boolean autoSaveHistory;
  public Boolean autoHandoff;
  public String promptTemplate;
  public List<String> enabledScenes;
  public List<String> handoffKeywords;
  public String defaultSupervisor;
  public Map<String, Object> extra;
}
