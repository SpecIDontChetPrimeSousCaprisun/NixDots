// GENERATED FILE. Do not edit directly.
// Source: src/js/mv3/youtube-engine.ts
// Build command: npm run build
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/js/youtube/youtube-page-context.ts
function isYouTubeHost(url) {
  try {
    const h = new URL(url).hostname.replace(/^www\./, "");
    return h === "youtube.com" || h === "m.youtube.com" || h === "youtube-nocookie.com" || h === "music.youtube.com";
  } catch (e) {
    console.warn("[uBR] youtube-page-context: isYouTubeHost URL parse failed", url, e);
    return false;
  }
}
function classifyPageType(url) {
  if (!url) return "UNSUPPORTED";
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host !== "youtube.com" && host !== "m.youtube.com" && host !== "youtube-nocookie.com" && host !== "music.youtube.com") {
      return "UNSUPPORTED";
    }
    const p = u.pathname;
    if (p.startsWith("/embed/")) return "EMBED";
    if (p.startsWith("/watch")) return "WATCH";
    if (p.startsWith("/shorts/")) return "SHORTS";
    if (p.startsWith("/results")) return "SEARCH";
    if (p.startsWith("/feed/") || p.startsWith("/channel/") || p.startsWith("/@")) return "BROWSE";
    if (p.startsWith("/live")) return "LIVE";
    if (host === "music.youtube.com" || p.startsWith("/music")) return "MUSIC";
    return "BROWSE";
  } catch (e) {
    console.warn("[uBR] youtube-page-context: classifyPageType URL parse failed", url, e);
    return "UNSUPPORTED";
  }
}
function classifyPageTypeCategory(pageType, isTopFrame, parentOriginKnown) {
  if (!isTopFrame) return parentOriginKnown ? "NESTED_EMBED" : "EMBED";
  switch (pageType) {
    case "WATCH":
      return "TOP_LEVEL_WATCH";
    case "BROWSE":
      return "TOP_LEVEL_BROWSE";
    case "SEARCH":
      return "TOP_LEVEL_SEARCH";
    case "SHORTS":
      return "SHORTS";
    case "EMBED":
      return "EMBED";
    case "LIVE":
      return "LIVE";
    case "MUSIC":
      return "MUSIC";
    default:
      return "UNSUPPORTED";
  }
}
function createFrameContext(tabId, frameId, url, isTopFrame, parentOriginKnown) {
  const pageType = classifyPageType(url);
  const host = isYouTubeHost(url) ? new URL(url).hostname : "";
  return {
    tabId,
    frameId,
    url,
    host,
    pageType,
    pageTypeCategory: classifyPageTypeCategory(pageType, isTopFrame, parentOriginKnown),
    isTopFrame,
    isYouTubeTopFrame: isTopFrame && isYouTubeHost(url),
    isYouTubeEmbed: !isTopFrame && isYouTubeHost(url),
    parentOriginKnown,
    allowedModules: []
  };
}
function rebuildPageContext(tabId, url, frameContext) {
  const fc = frameContext ?? createFrameContext(tabId, 0, url, true, false);
  return {
    tabId,
    frameId: fc.frameId,
    url,
    host: fc.host,
    pageType: fc.pageType,
    pageTypeCategory: fc.pageTypeCategory,
    frameContext: fc,
    hasPlayer: fc.pageType === "WATCH" || fc.pageType === "EMBED" || fc.pageType === "LIVE",
    hasFeed: fc.pageType === "BROWSE",
    hasSearchResults: fc.pageType === "SEARCH",
    hasShortsShell: fc.pageType === "SHORTS",
    hasLiveStream: fc.pageType === "LIVE",
    hasDvrWindow: false,
    hasAntiBlockPrompt: false,
    playerHealth: "HEALTHY",
    sanitizerShapeConfidence: 0,
    riskLevel: "LOW"
  };
}

// src/js/youtube/youtube-tab-tracker.ts
var HEARTBEAT_TIMEOUT_MS = 3e4;
function createTabTracker() {
  const tabs = /* @__PURE__ */ new Map();
  const embeds = /* @__PURE__ */ new Map();
  function upsertTab(tabId, url, riskLevel) {
    const existing = tabs.get(tabId);
    const pageType = classifyPageType(url);
    const state = {
      tabId,
      url,
      pageType,
      riskLevel: riskLevel ?? existing?.riskLevel ?? "LOW",
      pageContext: existing?.pageContext ?? rebuildPageContext(tabId, url),
      mainWorldAvailable: existing?.mainWorldAvailable ?? "unknown",
      lastSeenAt: Date.now()
    };
    tabs.set(tabId, state);
    return state;
  }
  function removeTab(tabId) {
    tabs.delete(tabId);
    for (const [key, embed] of embeds) {
      if (embed.tabId === tabId) embeds.delete(key);
    }
  }
  function getTab(tabId) {
    return tabs.get(tabId);
  }
  function getAllTabs() {
    return Array.from(tabs.values());
  }
  function getYouTubeTabs() {
    return getAllTabs().filter((t) => t.pageType !== "UNSUPPORTED");
  }
  function registerEmbed(embed) {
    const key = `${embed.tabId}:${embed.frameId}`;
    embeds.set(key, embed);
  }
  function unregisterEmbed(tabId, frameId) {
    embeds.delete(`${tabId}:${frameId}`);
  }
  function getEmbeds() {
    return Array.from(embeds.values());
  }
  function getEmbedsForTab(tabId) {
    return getEmbeds().filter((e) => e.tabId === tabId);
  }
  function heartbeatEmbed(tabId, frameId) {
    const key = `${tabId}:${frameId}`;
    const embed = embeds.get(key);
    if (!embed) return false;
    embed.lastHeartbeatAt = Date.now();
    return true;
  }
  function expireStaleEmbeds(timeoutMs = HEARTBEAT_TIMEOUT_MS) {
    const now = Date.now();
    let expired = 0;
    for (const [key, embed] of embeds) {
      if (now - embed.lastHeartbeatAt > timeoutMs) {
        embeds.delete(key);
        expired++;
      }
    }
    return expired;
  }
  function heartbeatTab(tabId) {
    const tab = tabs.get(tabId);
    if (!tab) return false;
    tab.lastSeenAt = Date.now();
    return true;
  }
  return {
    upsertTab,
    removeTab,
    getTab,
    getAllTabs,
    getYouTubeTabs,
    registerEmbed,
    unregisterEmbed,
    getEmbeds,
    getEmbedsForTab,
    heartbeatEmbed,
    expireStaleEmbeds,
    heartbeatTab
  };
}

// src/js/youtube/youtube-session-state.ts
var SESSION_STATE_KEY = "ubrYouTubeSessionStateV1";
var SCHEMA_VERSION = 1;
var TAB_SNAPSHOT_MAX = 30;
var FALLBACK_TTL_MS = 6 * 60 * 60 * 1e3;
var MAX_FALLBACK_TTL_MS = 24 * 60 * 60 * 1e3;
function createEmptySessionState(sessionEpoch) {
  return {
    schemaVersion: SCHEMA_VERSION,
    sessionEpoch,
    updatedAt: Date.now(),
    globalRulePlanMode: "SAFE_CONSERVATIVE",
    lastAggregateRiskLevel: "LOW",
    suspectModuleClasses: [],
    disabledSurrogateEndpoints: [],
    disabledSanitizerClasses: [],
    disabledWrapperClasses: [],
    disabledBeaconModes: [],
    installedYouTubeRuleIDs: [],
    criticalRuleInstallVerified: false,
    lastRulePlanHash: "",
    panicSessionActive: false,
    panicTabIds: [],
    userRuleInterference: [],
    tabSnapshots: []
  };
}
function validateSessionState(raw) {
  if (!raw || typeof raw !== "object") return false;
  const s = raw;
  return s.schemaVersion === SCHEMA_VERSION && typeof s.sessionEpoch === "string" && typeof s.updatedAt === "number" && typeof s.globalRulePlanMode === "string" && typeof s.lastAggregateRiskLevel === "string" && Array.isArray(s.installedYouTubeRuleIDs) && Array.isArray(s.tabSnapshots);
}
function shouldWriteImmediately(state, change) {
  if (change.panicSessionActive === true) return true;
  if (change.globalRulePlanMode === "PANIC") return true;
  if (change.criticalRuleInstallVerified === false && state.criticalRuleInstallVerified === true) return true;
  return false;
}
function pruneTabSnapshots(snapshots, max = TAB_SNAPSHOT_MAX) {
  if (snapshots.length <= max) return snapshots;
  const sorted = [...snapshots].sort((a, b) => b.lastSeenAt - a.lastSeenAt);
  return sorted.slice(0, max);
}
function evictCriticalOnly(state) {
  return {
    ...state,
    tabSnapshots: state.tabSnapshots.slice(0, 5),
    userRuleInterference: state.userRuleInterference.slice(-20),
    updatedAt: Date.now()
  };
}

// src/js/youtube/youtube-risk.ts
var RISK_ORDER = { LOW: 0, MEDIUM: 1, HIGH: 2, PANIC: 3 };
function riskLevelAtLeast(current, threshold) {
  return RISK_ORDER[current] >= RISK_ORDER[threshold];
}
function maxRiskLevel(a, b) {
  return RISK_ORDER[a] >= RISK_ORDER[b] ? a : b;
}
function healthToRisk(health, currentRisk) {
  switch (health) {
    case "PROMPT_DETECTED":
      return maxRiskLevel(currentRisk, "HIGH");
    case "BROKEN":
      return "PANIC";
    case "STUCK":
      return maxRiskLevel(currentRisk, "HIGH");
    case "DEGRADED":
      return maxRiskLevel(currentRisk, "MEDIUM");
    case "HEALTHY":
      return currentRisk;
  }
}
function recomputeRiskLevel(currentRisk, health, shapeConfidence, promptDetected, pageType, updatePending) {
  let risk = currentRisk;
  if (promptDetected) risk = maxRiskLevel(risk, "HIGH");
  if (updatePending) risk = maxRiskLevel(risk, "MEDIUM");
  risk = maxRiskLevel(risk, healthToRisk(health, risk));
  if (shapeConfidence < 0.3) risk = maxRiskLevel(risk, "HIGH");
  else if (shapeConfidence < 0.6) risk = maxRiskLevel(risk, "MEDIUM");
  if (pageType === "LIVE" || pageType === "UNSUPPORTED") risk = maxRiskLevel(risk, "HIGH");
  if (pageType === "EMBED") risk = maxRiskLevel(risk, "MEDIUM");
  if (pageType === "MUSIC") risk = maxRiskLevel(risk, "HIGH");
  return risk;
}
function riskAllows(riskLevel, requiredMaxRisk) {
  return RISK_ORDER[riskLevel] <= RISK_ORDER[requiredMaxRisk];
}
function healthTriggersRollback(health) {
  return health === "PROMPT_DETECTED" || health === "BROKEN" || health === "STUCK";
}
function selectActiveModules(risk) {
  switch (risk) {
    case "LOW":
      return ["safe_dnr", "sanitizer", "surrogates", "cosmetic", "instrumented_shadow"];
    case "MEDIUM":
      return ["safe_dnr", "sanitizer_cautious", "surrogates"];
    case "HIGH":
      return ["safe_dnr", "shadow_sanitizer"];
    case "PANIC":
      return ["safe_dnr"];
  }
}

// src/js/youtube/youtube-rule-reconciler.ts
function computeRulePlanHash(ruleIDs) {
  return [...ruleIDs].sort((a, b) => a - b).join(",");
}
function reconcileRules(input) {
  const criticalRulesPresent = input.criticalRuleIDs.every((id) => input.installedRuleIDs.includes(id));
  const missingCriticalRules = input.criticalRuleIDs.filter((id) => !input.installedRuleIDs.includes(id));
  const staleOptionalRules = input.optionalRuleIDs.filter((id) => !input.installedRuleIDs.includes(id));
  const userInterferenceDetected = [];
  for (const id of input.userRuleInterference) {
    if (typeof id === "number" && input.criticalRuleIDs.includes(id)) {
      userInterferenceDetected.push({ ruleId: id, rank: 100 });
    }
  }
  const totalRules = input.installedRuleIDs.length;
  const budgetRemaining = input.youtubeBudgetReserve - totalRules;
  const planHashMatch = input.lastRulePlanHash === input.expectedRulePlanHash;
  const requiresPanic = !criticalRulesPresent || userInterferenceDetected.length > 0;
  const requiresConservativeReset = input.globalRulePlanMode !== "SAFE_CONSERVATIVE" && (input.lastAggregateRiskLevel === "PANIC" || input.lastAggregateRiskLevel === "HIGH" || staleOptionalRules.length > 0);
  return {
    criticalRulesPresent,
    staleOptionalRules,
    missingCriticalRules,
    userInterferenceDetected,
    budgetRemaining,
    planHashMatch,
    requiresPanic,
    requiresConservativeReset
  };
}
function checkExtensionUpdate(current, persisted) {
  const changed = [];
  const keys = [
    "manifestVersion",
    "criticalEndpointRegistryVersion",
    "rulePrioritySchemaVersion",
    "youtubeRuleIdRangeVersion",
    "surrogateSchemaVersion",
    "sanitizerSchemaVersion",
    "bootstrapVersion",
    "wrapperRiskSchemaVersion",
    "cosmeticSelectorRegistryVersion"
  ];
  for (const key of keys) {
    if (persisted[key] !== void 0 && persisted[key] !== current[key]) {
      changed.push(key);
    }
  }
  return changed;
}
var ENGINE_UPDATE_RESET = "ENGINE_UPDATE_RESET";
var ENGINE_UPDATE_RESET_ACK = "ENGINE_UPDATE_RESET_ACK";

// src/js/youtube/youtube-sw-restore.ts
async function runStartupRestoration(input) {
  const { tracker, currentVersion, persistedVersion, persistedState, criticalRuleIDs, youtubeRuleIDRangeMin, youtubeRuleIDRangeMax, youtubeBudgetReserve } = input;
  let sessionState;
  let stateValid = false;
  if (persistedState && validateSessionState(persistedState)) {
    sessionState = persistedState;
    stateValid = true;
  } else {
    sessionState = createEmptySessionState(String(Date.now()));
  }
  const openYouTubeTabs = tracker.getYouTubeTabs();
  const currentTabIds = new Set(openYouTubeTabs.map((t) => t.tabId));
  sessionState.tabSnapshots = sessionState.tabSnapshots.filter((ts) => currentTabIds.has(ts.tabId));
  for (const tab of openYouTubeTabs) {
    const persisted = sessionState.tabSnapshots.find((ts) => ts.tabId === tab.tabId);
    if (persisted && persisted.url === tab.url && classifyPageType(tab.url) === tab.pageType) {
      tab.riskLevel = maxRiskLevel(tab.riskLevel, persisted.riskLevel);
    }
  }
  const noYouTubeTabs = openYouTubeTabs.length === 0;
  let globalRulePlanMode = noYouTubeTabs ? "SAFE_CONSERVATIVE" : sessionState.globalRulePlanMode;
  let aggregateRiskLevel = noYouTubeTabs ? "LOW" : sessionState.lastAggregateRiskLevel;
  const reconciliationInput = {
    installedRuleIDs: sessionState.installedYouTubeRuleIDs,
    criticalRuleIDs,
    optionalRuleIDs: sessionState.installedYouTubeRuleIDs.filter((id) => !criticalRuleIDs.includes(id)),
    globalRulePlanMode,
    lastAggregateRiskLevel: aggregateRiskLevel,
    lastRulePlanHash: sessionState.lastRulePlanHash,
    expectedRulePlanHash: computeRulePlanHash([
      ...criticalRuleIDs,
      ...sessionState.installedYouTubeRuleIDs.filter((id) => !criticalRuleIDs.includes(id))
    ]),
    registryVersion: currentVersion.criticalEndpointRegistryVersion,
    manifestVersion: currentVersion.manifestVersion,
    youtubeRuleIDRangeMin,
    youtubeRuleIDRangeMax,
    youtubeBudgetReserve,
    userRuleInterference: new Set(sessionState.userRuleInterference.map((r) => r.ruleId))
  };
  const reconciled = reconcileRules(reconciliationInput);
  let criticalRulesInstalled = reconciled.criticalRulesPresent;
  if (reconciled.requiresPanic) {
    globalRulePlanMode = "PANIC";
    aggregateRiskLevel = "PANIC";
  }
  const requiresReconnect = true;
  const changedKeys = checkExtensionUpdate(currentVersion, persistedVersion);
  const requiresUpdateReset = changedKeys.length > 0;
  if (noYouTubeTabs) {
    globalRulePlanMode = "SAFE_CONSERVATIVE";
    sessionState.installedYouTubeRuleIDs = [...criticalRuleIDs];
    sessionState.lastRulePlanHash = "";
    sessionState.panicSessionActive = false;
    sessionState.panicReason = void 0;
    sessionState.panicTabIds = [];
  }
  sessionState.globalRulePlanMode = globalRulePlanMode;
  sessionState.lastAggregateRiskLevel = aggregateRiskLevel;
  sessionState.updatedAt = Date.now();
  return {
    sessionState,
    globalRulePlanMode,
    aggregateRiskLevel,
    criticalRulesInstalled,
    requiresReconnect,
    requiresUpdateReset,
    staleOptionalRulesRemoved: reconciled.staleOptionalRules,
    missingCriticalRuleIDs: reconciled.missingCriticalRules,
    noYouTubeTabs
  };
}
function selectRestorationPath(isSwwRestart, isFullDocument, isSPA) {
  if (isSwwRestart) return "SERVICE_WORKER_RESTART";
  if (isFullDocument) return "FULL_DOCUMENT_NAVIGATION";
  if (isSPA) return "YOUTUBE_SPA_NAVIGATION";
  return "FULL_DOCUMENT_NAVIGATION";
}

// src/js/youtube/youtube-prompt-detector.ts
var PROMPT_CONFIRMED_THRESHOLD = 80;
var PROMPT_SUSPECTED_THRESHOLD = 50;
var PROMPT_SCORE_WEIGHTS = {
  MODAL_OVERLAY: 20,
  PLAYER_BLOCKED: 20,
  TEXT_MATCH: 30,
  ACTION_BUTTON: 10,
  KNOWN_SHAPE: 20,
  DIALOG_ROLE: 15,
  ARIA_MODAL: 15,
  ENFORCEMENT_OVERLAY: 20
};
function scorePromptSignals(input) {
  let score = 0;
  const signals = [];
  if (input.modalOverlayPresent) {
    score += PROMPT_SCORE_WEIGHTS.MODAL_OVERLAY;
    signals.push("modal_overlay");
  }
  if (input.playerBlockedOrPaused) {
    score += PROMPT_SCORE_WEIGHTS.PLAYER_BLOCKED;
    signals.push("player_blocked");
  }
  if (input.localizedTextMatch) {
    score += PROMPT_SCORE_WEIGHTS.TEXT_MATCH;
    signals.push("ad_blocker_text");
  }
  if (input.primaryActionButtonVisible) {
    score += PROMPT_SCORE_WEIGHTS.ACTION_BUTTON;
    signals.push("action_button");
  }
  if (input.knownEnforcementShape) {
    score += PROMPT_SCORE_WEIGHTS.KNOWN_SHAPE;
    signals.push("known_enforcement_shape");
  }
  if (input.dialogRolePresent) {
    score += PROMPT_SCORE_WEIGHTS.DIALOG_ROLE;
    signals.push("dialog_role");
  }
  if (input.ariaModalPresent) {
    score += PROMPT_SCORE_WEIGHTS.ARIA_MODAL;
    signals.push("aria_modal");
  }
  if (input.enforcementOverlayNearPlayer) {
    score += PROMPT_SCORE_WEIGHTS.ENFORCEMENT_OVERLAY;
    signals.push("enforcement_overlay");
  }
  let confidence = "NONE";
  if (score >= PROMPT_CONFIRMED_THRESHOLD) confidence = "CONFIRMED";
  else if (score >= PROMPT_SUSPECTED_THRESHOLD) confidence = "SUSPECTED";
  return { score, confidence, signals };
}
function createPromptDetectorState() {
  return {
    score: 0,
    confidence: "NONE",
    signalHistory: [],
    suspicionWindowStart: 0,
    consecutiveConfirmations: 0,
    disabled: false
  };
}
function updatePromptDetectorState(state, result, now) {
  if (state.disabled) return state;
  const signalHistory = [...state.signalHistory, ...result.signals].slice(-50);
  const suspicionWindowStart = result.confidence !== "NONE" ? state.suspicionWindowStart === 0 ? now : state.suspicionWindowStart : state.suspicionWindowStart;
  const consecutiveConfirmations = result.confidence === "CONFIRMED" ? state.consecutiveConfirmations + 1 : 0;
  return {
    ...state,
    score: result.score,
    confidence: result.confidence,
    signalHistory,
    suspicionWindowStart,
    consecutiveConfirmations
  };
}
function classifyPromptConfidence(score) {
  if (score >= PROMPT_CONFIRMED_THRESHOLD) return "CONFIRMED";
  if (score >= PROMPT_SUSPECTED_THRESHOLD) return "SUSPECTED";
  return "NONE";
}

// src/js/youtube/youtube-health-monitor.ts
var DEFAULT_HEALTH_SIGNALS = {
  videoElementExists: true,
  readyStateHealthy: true,
  currentTimeAdvances: true,
  noPersistentSpinner: true,
  noFatalError: true,
  playerControlsUsable: true,
  commentsReachable: true,
  descriptionReachable: true,
  mastheadSearchVisible: true,
  spaNavigationWorks: true,
  antiBlockPromptAbsent: true
};
function computeHealthState(signals) {
  if (!signals.antiBlockPromptAbsent) return "PROMPT_DETECTED";
  if (!signals.videoElementExists) return "BROKEN";
  if (signals.noFatalError === false) return "BROKEN";
  if (signals.currentTimeAdvances === false && signals.videoElementExists) return "STUCK";
  if (signals.noPersistentSpinner === false) return "STUCK";
  if (!signals.readyStateHealthy) return "DEGRADED";
  if (!signals.playerControlsUsable) return "DEGRADED";
  if (!signals.commentsReachable) return "DEGRADED";
  let healthyCount = 0;
  if (signals.videoElementExists) healthyCount++;
  if (signals.readyStateHealthy) healthyCount++;
  if (signals.currentTimeAdvances) healthyCount++;
  if (signals.noPersistentSpinner) healthyCount++;
  if (signals.noFatalError) healthyCount++;
  if (signals.playerControlsUsable) healthyCount++;
  if (signals.commentsReachable) healthyCount++;
  if (signals.descriptionReachable) healthyCount++;
  if (signals.mastheadSearchVisible) healthyCount++;
  if (signals.spaNavigationWorks) healthyCount++;
  if (signals.antiBlockPromptAbsent) healthyCount++;
  return healthyCount >= 9 ? "HEALTHY" : "DEGRADED";
}
function getBaseInterval(pageCategory) {
  switch (pageCategory) {
    case "WATCH":
      return 1e3;
    case "BROWSE":
      return 2e3;
    case "SHORTS":
      return 2e3;
    case "EMBED":
      return 5e3;
  }
}
function computeTickInterval(config, health) {
  if (config.hidden) {
    return { ...config, currentIntervalMs: 0, consecutiveHealthyTicks: 0 };
  }
  let consecutiveHealthyTicks = config.consecutiveHealthyTicks;
  let consecutiveRecoveryTicks = config.consecutiveRecoveryTicks;
  let recoveryMode = config.recoveryMode;
  if (health === "HEALTHY") {
    consecutiveHealthyTicks++;
    consecutiveRecoveryTicks = 0;
    recoveryMode = false;
  } else if (health === "PROMPT_DETECTED" || health === "BROKEN") {
    consecutiveHealthyTicks = 0;
    consecutiveRecoveryTicks++;
    recoveryMode = true;
  } else {
    consecutiveHealthyTicks = 0;
  }
  let currentIntervalMs = config.baseIntervalMs;
  if (recoveryMode && consecutiveRecoveryTicks <= 10) {
    currentIntervalMs = Math.min(currentIntervalMs, 500);
  }
  if (consecutiveHealthyTicks >= 10 && !recoveryMode) {
    currentIntervalMs = Math.max(currentIntervalMs, 2e3);
  }
  return {
    ...config,
    currentIntervalMs,
    consecutiveHealthyTicks,
    consecutiveRecoveryTicks,
    recoveryMode
  };
}
function createHealthMonitorState(pageCategory, initialSignals) {
  const signals = { ...DEFAULT_HEALTH_SIGNALS, ...initialSignals };
  return {
    currentHealth: computeHealthState(signals),
    lastSignal: signals,
    tickConfig: {
      baseIntervalMs: getBaseInterval(pageCategory),
      currentIntervalMs: getBaseInterval(pageCategory),
      consecutiveHealthyTicks: 0,
      consecutiveRecoveryTicks: 0,
      recoveryMode: false,
      hidden: false
    },
    healthHistory: []
  };
}
function recordHealthTick(state, signals, now) {
  const health = computeHealthState(signals);
  const healthHistory = [...state.healthHistory, health].slice(-100);
  const tickConfig = computeTickInterval(state.tickConfig, health);
  return {
    ...state,
    currentHealth: health,
    lastSignal: signals,
    tickConfig,
    healthHistory
  };
}
function isHealthNormal(state) {
  return state.currentHealth === "HEALTHY" || state.currentHealth === "DEGRADED";
}
function healthTriggersBackoff(state) {
  return state.currentHealth === "PROMPT_DETECTED" || state.currentHealth === "BROKEN" || state.currentHealth === "STUCK";
}
function visibilityPause(state, hidden) {
  return {
    ...state,
    tickConfig: { ...state.tickConfig, hidden }
  };
}

// src/js/youtube/youtube-observer-budget.ts
var DEFAULT_OBSERVER_CONFIGS = [
  { rootType: "PLAYER_SUBTREE", active: true, subtree: true, maxNodesPerBatch: 200, throttleMs: 200, rootDepthLimit: 3 },
  { rootType: "FEED_GRID", active: false, subtree: true, maxNodesPerBatch: 200, throttleMs: 200, rootDepthLimit: 2 },
  { rootType: "DOCUMENT_BODY", active: false, subtree: true, maxNodesPerBatch: 200, throttleMs: 500, rootDepthLimit: 1 }
];
var DEFAULT_MAX_NODES_PER_BATCH = 200;
var DEFAULT_HARD_THROTTLE_MS = 200;
var OVERFLOW_BACKOFF_LIMIT = 3;
var OVERFLOW_BACKOFF_WINDOW_MS = 6e4;
function createObserverBudgetState() {
  return {
    configs: [...DEFAULT_OBSERVER_CONFIGS],
    overflowCount: 0,
    overflowWindowStart: 0,
    backoffActive: false,
    shadowRootCount: 0,
    maxShadowRoots: 5,
    shadowOverflowCount: 0
  };
}
function processObserverBatch(state, nodeCount, now) {
  if (state.backoffActive) {
    return {
      result: { nodesProcessed: 0, overflow: false, remainingNodes: nodeCount, events: [] },
      newState: state
    };
  }
  if (nodeCount <= DEFAULT_MAX_NODES_PER_BATCH) {
    return {
      result: { nodesProcessed: nodeCount, overflow: false, remainingNodes: 0, events: [] },
      newState: state
    };
  }
  const remaining = nodeCount - DEFAULT_MAX_NODES_PER_BATCH;
  let overflowCount = state.overflowCount + 1;
  let overflowWindowStart = state.overflowWindowStart;
  const events = ["OBSERVER_OVERFLOW"];
  if (overflowCount === 1) {
    overflowWindowStart = now;
  }
  const elapsed = now - overflowWindowStart;
  if (overflowCount >= OVERFLOW_BACKOFF_LIMIT && elapsed <= OVERFLOW_BACKOFF_WINDOW_MS) {
    events.push("OBSERVER_OVERFLOW_BACKOFF");
    return {
      result: { nodesProcessed: DEFAULT_MAX_NODES_PER_BATCH, overflow: true, remainingNodes: remaining, events },
      newState: { ...state, overflowCount: 0, overflowWindowStart: 0, backoffActive: true }
    };
  }
  if (elapsed > OVERFLOW_BACKOFF_WINDOW_MS) {
    overflowCount = 1;
    overflowWindowStart = now;
  }
  return {
    result: { nodesProcessed: DEFAULT_MAX_NODES_PER_BATCH, overflow: true, remainingNodes: remaining, events },
    newState: { ...state, overflowCount, overflowWindowStart }
  };
}
function canObserveShadowRoot(state, candidate) {
  if (state.shadowRootCount >= state.maxShadowRoots && !candidate.playerRelated) return false;
  if (candidate.rootDepth > 3) return false;
  if (!candidate.open) return false;
  if (!candidate.playerRelated && state.shadowRootCount >= state.maxShadowRoots) return false;
  return true;
}
function observeShadowRoot(state) {
  return {
    ...state,
    shadowRootCount: state.shadowRootCount + 1
  };
}
function disconnectShadowRoot(state) {
  return {
    ...state,
    shadowRootCount: Math.max(0, state.shadowRootCount - 1)
  };
}
function enableFeedObservation(state) {
  return {
    ...state,
    configs: state.configs.map(
      (c) => c.rootType === "FEED_GRID" ? { ...c, active: true } : c
    )
  };
}
function disconnectAllObservers(state) {
  return {
    ...state,
    configs: state.configs.map((c) => ({ ...c, active: false })),
    backoffActive: true
  };
}
function hasActiveObservers(state) {
  return state.configs.some((c) => c.active) && !state.backoffActive;
}
function isPassiveDomShadowEligible(state) {
  return state.backoffActive || !hasActiveObservers(state);
}

// src/js/youtube/youtube-beacon-policy.ts
var DEFAULT_BEACON_POLICY = {
  defaultMode: "ALLOW",
  localCompleteExperimental: false,
  localCompleteAllowlist: [],
  shapeConfidenceThreshold: 85,
  healthNormalRequired: true
};
function selectBeaconMode(input) {
  if (input.localCompleteConfig.localCompleteExperimental) {
    if (input.localCompleteConfig.localCompleteAllowlist.includes(input.endpoint)) {
      if (input.shapeConfidence >= input.localCompleteConfig.shapeConfidenceThreshold) {
        if (!input.localCompleteConfig.healthNormalRequired || input.healthNormal) {
          return { mode: "LOCAL_COMPLETE", reason: "local_complete_eligible" };
        }
      }
    }
  }
  if (isPixelEndpoint(input.endpoint, input.method, input.contentType)) {
    return { mode: "PIXEL_SURROGATE", reason: "pixel_surrogate_eligible" };
  }
  if (isLowRiskBeacon(input.endpoint)) {
    return { mode: "BLOCK", reason: "low_risk_beacon" };
  }
  return { mode: "ALLOW", reason: "default_allow" };
}
function isPixelEndpoint(endpoint, method, contentType) {
  if (method !== "GET" && method !== "POST") return false;
  if (contentType === "image/gif" || contentType === "image/png") return true;
  if (endpoint.match(/\/beacon|\/ping|\/collect|\/log|\/analytics|\/metrics/i)) return true;
  return false;
}
function isLowRiskBeacon(endpoint) {
  const lowRiskPatterns = [
    /\/heartbeat/i,
    /\/playback_metrics/i,
    /\/stats\/[a-z]/i,
    /\/ad_break/i
  ];
  return lowRiskPatterns.some((p) => p.test(endpoint));
}
function selectBeaconPolicy(pageType, riskLevel, hasPrompt) {
  if (hasPrompt || riskLevel === "PANIC") {
    return { ...DEFAULT_BEACON_POLICY, defaultMode: "ALLOW", localCompleteExperimental: false };
  }
  if (riskLevel === "HIGH") {
    return { ...DEFAULT_BEACON_POLICY, defaultMode: "PIXEL_SURROGATE", localCompleteExperimental: false };
  }
  if (pageType === "EMBED" || pageType === "LIVE") {
    return { ...DEFAULT_BEACON_POLICY, defaultMode: "PIXEL_SURROGATE" };
  }
  return DEFAULT_BEACON_POLICY;
}
function handleLocalCompleteSurrogateDrift(endpoint, expectedFingerprint, actualFingerprint) {
  return { driftDetected: expectedFingerprint !== actualFingerprint };
}
function disableLocalCompleteOnPrompt(config, promptDetected) {
  if (!promptDetected) return config;
  return { ...config, localCompleteExperimental: false };
}

// src/js/youtube/youtube-backoff.ts
var DEFAULT_ROLLBACK_ORDER = [
  "SHADOW_DOM_COSMETIC_CLEANUP",
  "LIGHT_DOM_COSMETIC_CLEANUP",
  "FEED_COSMETIC_CLEANUP",
  "INTERSTITIAL_CLEANUP",
  "SHORTS_CLEANUP",
  "DOCUMENT_WRITE_WRAPPER",
  "DOCUMENT_STREAM_WRAPPER",
  "DYNAMIC_SCRIPT_INSERTION_WRAPPER"
];
var PROMPT_IMMEDIATE_DISABLE = [
  "SHADOW_DOM_COSMETIC_CLEANUP",
  "LIGHT_DOM_COSMETIC_CLEANUP"
];
function createBackoffState() {
  return {
    active: false,
    disabledClasses: /* @__PURE__ */ new Set(),
    suspectGroup: null,
    isolationStep: 0,
    healthObservationMs: 3e4,
    healthObservationStart: 0
  };
}
function enterBackoff(state, promptDetected, now) {
  const disabled = new Set(state.disabledClasses);
  if (promptDetected) {
    for (const cls of PROMPT_IMMEDIATE_DISABLE) {
      disabled.add(cls);
    }
  }
  return {
    ...state,
    active: true,
    disabledClasses: disabled,
    isolationStep: 0,
    healthObservationStart: now
  };
}
function advanceIsolation(state, healthRecovered, now) {
  if (!state.active) {
    return { newState: state, action: "completed" };
  }
  if (healthRecovered) {
    if (state.isolationStep === 0) {
      return { newState: { ...state, active: false, suspectGroup: null }, action: "completed" };
    }
    const suspectGroup = DEFAULT_ROLLBACK_ORDER[state.isolationStep - 1] ?? null;
    return {
      newState: { ...state, active: false, suspectGroup },
      action: "suspect"
    };
  }
  const nextStep = state.isolationStep;
  const nextClass = DEFAULT_ROLLBACK_ORDER[nextStep];
  if (!nextClass) {
    return { newState: { ...state, active: true }, action: "rollback" };
  }
  const newDisabled = new Set(state.disabledClasses);
  newDisabled.add(nextClass);
  return {
    newState: {
      ...state,
      disabledClasses: newDisabled,
      isolationStep: nextStep + 1,
      healthObservationStart: now
    },
    action: "isolate"
  };
}
function isModuleDisabled(state, riskClass) {
  return state.disabledClasses.has(riskClass);
}
function anyCosmeticDisabled(state) {
  return PROMPT_IMMEDIATE_DISABLE.some((cls) => state.disabledClasses.has(cls));
}
function getDisabledClasses(state) {
  return Array.from(state.disabledClasses);
}
function resolveBackoff(state, now, promptScore) {
  if (!state.active) return state;
  const elapsed = now - state.healthObservationStart;
  if (elapsed < state.healthObservationMs) return state;
  if (promptScore >= 80) {
    const newDisabled = new Set(state.disabledClasses);
    for (const cls of PROMPT_IMMEDIATE_DISABLE) {
      newDisabled.add(cls);
    }
    return { ...state, disabledClasses: newDisabled, healthObservationStart: now };
  }
  return { ...state, active: false };
}

// src/js/youtube/youtube-diagnostics.ts
var DEFAULT_DIAGNOSTICS_CONFIG = {
  maxEvents: 500,
  pruneThreshold: 400,
  enabledCategories: [
    "SANITIZER_DECISION",
    "RULE_INSTALL",
    "RULE_INTERFERENCE",
    "UNKNOWN_CHANGE",
    "PROMPT_TRANSITION",
    "HEALTH_TRANSITION",
    "RISK_TRANSITION",
    "MAIN_WORLD_CAPABILITY"
  ],
  storageKey: "ubrYouTubeDiagnosticsV1"
};
function createDiagnosticsState(config) {
  return {
    events: [],
    config: { ...DEFAULT_DIAGNOSTICS_CONFIG, ...config },
    pruneCount: 0
  };
}
function recordEvent(state, category, message, data) {
  if (!state.config.enabledCategories.includes(category)) return state;
  const event = {
    timestamp: Date.now(),
    category,
    message,
    data
  };
  const events = [...state.events, event];
  return maybePrune({ ...state, events });
}
function maybePrune(state) {
  if (state.events.length <= state.config.maxEvents) return state;
  const excess = state.events.length - state.config.pruneThreshold;
  const pruned = state.events.slice(excess);
  return {
    ...state,
    events: pruned,
    pruneCount: state.pruneCount + 1
  };
}
function pruneByCategory(state, category) {
  return {
    ...state,
    events: state.events.filter((e) => e.category !== category)
  };
}
function pruneByAge(state, maxAgeMs) {
  const cutoff = Date.now() - maxAgeMs;
  return {
    ...state,
    events: state.events.filter((e) => e.timestamp >= cutoff)
  };
}
function getEventsByCategory(state, category) {
  return state.events.filter((e) => e.category === category);
}
function getEventsSince(state, since) {
  return state.events.filter((e) => e.timestamp >= since);
}
function getLatestEvents(state, count) {
  return state.events.slice(-count);
}
function summarizeEvents(state) {
  const summary = {};
  for (const event of state.events) {
    summary[event.category] = (summary[event.category] || 0) + 1;
  }
  summary.prune_count = state.pruneCount;
  summary.total_events = state.events.length;
  return summary;
}
function createSanitizerDecisionEvent(endpoint, action, shapeConfidence, reason) {
  return {
    category: "SANITIZER_DECISION",
    message: `Sanitizer ${action} for ${endpoint}`,
    data: { endpoint, action, shapeConfidence, reason }
  };
}
function createRuleInstallEvent(ruleIds, mode) {
  return {
    category: "RULE_INSTALL",
    message: `Installed ${ruleIds.length} rules in ${mode} mode`,
    data: { ruleCount: ruleIds.length, mode, ruleIds: ruleIds.slice(0, 10) }
  };
}
function createPromptTransitionEvent(fromScore, toScore, confidence, signals) {
  return {
    category: "PROMPT_TRANSITION",
    message: `Prompt score ${fromScore} \u2192 ${toScore} (${confidence})`,
    data: { fromScore, toScore, confidence, signalCount: signals.length, signals: signals.slice(0, 5) }
  };
}
function createHealthTransitionEvent(from, to) {
  return {
    category: "HEALTH_TRANSITION",
    message: `Health ${from} \u2192 ${to}`,
    data: { from, to }
  };
}
function createRiskTransitionEvent(from, to, reason) {
  return {
    category: "RISK_TRANSITION",
    message: `Risk ${from} \u2192 ${to}: ${reason}`,
    data: { from, to, reason }
  };
}
function isDiagnosticStorageAvailable() {
  try {
    return typeof chrome !== "undefined" && chrome.storage !== void 0 && chrome.storage.local !== void 0;
  } catch (e) {
    console.warn("[uBR] youtube-diagnostics: isDiagnosticStorageAvailable check failed", e);
    return false;
  }
}
function estimateStorageSize(state) {
  return new TextEncoder().encode(JSON.stringify(state)).length;
}
function shouldPruneStorage(state, maxSizeBytes) {
  return estimateStorageSize(state) > maxSizeBytes;
}

// src/js/youtube/youtube-dnr-aggregator.ts
function riskToNumeric(risk) {
  switch (risk) {
    case "LOW":
      return 0;
    case "MEDIUM":
      return 1;
    case "HIGH":
      return 2;
    case "PANIC":
      return 3;
  }
}
function computeContextualRiskSummary(input) {
  const hasTopLevelYouTube = input.tabStates.length > 0;
  const hasRegisteredEmbed = input.registeredEmbeds.length > 0;
  let maxTabRisk = hasTopLevelYouTube ? "LOW" : "LOW";
  for (const tab of input.tabStates) {
    const risk = input.riskByTab.get(tab.tabId) ?? "LOW";
    if (riskToNumeric(risk) > riskToNumeric(maxTabRisk)) maxTabRisk = risk;
  }
  let maxEmbedRisk = hasRegisteredEmbed ? "LOW" : "LOW";
  for (const embed of input.registeredEmbeds) {
    const key = `${embed.tabId}:${embed.frameId}`;
    const risk = input.riskByEmbed.get(key) ?? "LOW";
    if (riskToNumeric(risk) > riskToNumeric(maxEmbedRisk)) maxEmbedRisk = risk;
  }
  const hasMobileVariant = input.domainVariant === "mobile";
  const hasNoCookieVariant = input.domainVariant === "no_cookie";
  return {
    hasTopLevelYouTube,
    hasRegisteredEmbed,
    maxTabRisk,
    maxEmbedRisk,
    embedCount: input.registeredEmbeds.length,
    healthState: input.healthState ?? "HEALTHY",
    promptScore: input.promptScore ?? 0,
    monitoredEndpointCount: input.monitoredEndpointCount ?? 0,
    hasMobileVariant,
    hasNoCookieVariant
  };
}
function computeGlobalPlanMode(summary) {
  if (summary.hasMobileVariant) return "SAFE_CONSERVATIVE";
  if (summary.hasNoCookieVariant && summary.monitoredEndpointCount > 10) return "EMBED_CONSERVATIVE";
  if (summary.healthState === "BROKEN" || summary.maxTabRisk === "PANIC" || summary.maxEmbedRisk === "PANIC") return "PANIC";
  if (summary.healthState === "PROMPT_DETECTED" || summary.promptScore >= 80) return "BACKOFF";
  if (summary.healthState === "STUCK") return "BACKOFF";
  if (summary.maxTabRisk === "HIGH" || summary.maxEmbedRisk === "HIGH") return "BACKOFF";
  if (!summary.hasTopLevelYouTube && summary.hasRegisteredEmbed) return "EMBED_CONSERVATIVE";
  if (!summary.hasTopLevelYouTube && !summary.hasRegisteredEmbed) return "SAFE_CONSERVATIVE";
  return "BALANCED";
}
function buildRulePlan(mode, input) {
  const criticalIds = [...input.criticalRuleIDs];
  let safeBlockIds = [];
  let surrogateIds = [];
  let beaconIds = [];
  let shadowIds = [];
  if (mode === "SAFE_CONSERVATIVE") {
    safeBlockIds = [];
    surrogateIds = [];
    beaconIds = [];
    shadowIds = [];
  } else if (mode === "EMBED_CONSERVATIVE") {
    safeBlockIds = input.safeBlockRuleIDs;
    surrogateIds = input.surrogateRuleIDs.filter((id) => id % 2 === 0);
    beaconIds = [];
    shadowIds = [];
  } else if (mode === "BALANCED") {
    safeBlockIds = input.safeBlockRuleIDs;
    surrogateIds = input.surrogateRuleIDs;
    beaconIds = input.beaconRuleIDs;
    shadowIds = input.shadowRuleIDs;
  } else if (mode === "BACKOFF") {
    const promptDriven = (input.promptScore ?? 0) >= 80 || input.healthState === "PROMPT_DETECTED";
    if (promptDriven) {
      surrogateIds = input.surrogateRuleIDs.slice(0, Math.ceil(input.surrogateRuleIDs.length / 4));
      safeBlockIds = input.safeBlockRuleIDs.slice(0, Math.ceil(input.safeBlockRuleIDs.length / 2));
    } else {
      surrogateIds = input.surrogateRuleIDs.slice(0, Math.ceil(input.surrogateRuleIDs.length / 2));
      safeBlockIds = input.safeBlockRuleIDs;
    }
    beaconIds = [];
    shadowIds = [];
  }
  const allIds = [...criticalIds, ...safeBlockIds, ...surrogateIds, ...beaconIds, ...shadowIds];
  const planHash = allIds.sort((a, b) => a - b).join(",");
  return {
    globalMode: mode,
    criticalAllowRuleIDs: criticalIds,
    safeBlockRuleIDs: safeBlockIds,
    surrogateRuleIDs: surrogateIds,
    beaconRuleIDs: beaconIds,
    shadowRuleIDs: shadowIds,
    planHash
  };
}
function aggregateDnrRulePlan(input) {
  const summary = computeContextualRiskSummary(input);
  const mode = computeGlobalPlanMode(summary);
  return buildRulePlan(mode, input);
}

// src/js/youtube/youtube-dnr-budget.ts
var DEFAULT_BUDGET = {
  criticalCount: 0,
  optionalCount: 0,
  maxCritical: 200,
  maxOptional: 800
};
function selectRulesForEviction(budget, ruleClasses) {
  const order = ["SHADOW", "EXPERIMENTAL", "INSTRUMENTED_SHADOW", "SURROGATE", "SAFE_BLOCK"];
  const evicted = [];
  for (const cls of order) {
    if (ruleClasses.includes(cls)) {
      evicted.push(cls);
    }
  }
  return evicted;
}
function panicOnCriticalFailure(reason, tabIds, allClasses) {
  const evicted = selectRulesForEviction({ criticalCount: 0, optionalCount: 0, maxCritical: 200, maxOptional: 800 }, allClasses);
  return {
    panicSessionActive: true,
    panicReason: reason,
    panicTabIds: tabIds,
    globalRulePlanMode: "PANIC",
    evictedClasses: evicted
  };
}
var ADAPTIVE_BUDGET_TIERS = {
  CRITICAL_ALLOW_RESERVE: 200,
  GENERIC_STEALTH_EXCLUSION_SOFT_LIMIT: 100,
  SURROGATE_SOFT_LIMIT: 300,
  SAFE_BLOCK_SOFT_LIMIT: 300,
  BEACON_SOFT_LIMIT: 100,
  SHADOW_SOFT_LIMIT: 100,
  EXPERIMENTAL_SOFT_LIMIT: 100
};
var ALLOCATION_PRIORITY_ORDER = [
  "CRITICAL_ALLOW",
  "GENERIC_STEALTH_EXCLUSION",
  "SURROGATE",
  "SAFE_BLOCK",
  "BEACON",
  "SHADOW_DIAGNOSTIC",
  "EXPERIMENTAL"
];
function allocateBudget(requests, criticalBudget, optionalBudget, isLocalComplete) {
  const sorted = [...requests].sort((a, b) => {
    const ai = ALLOCATION_PRIORITY_ORDER.indexOf(a.tier);
    const bi = ALLOCATION_PRIORITY_ORDER.indexOf(b.tier);
    if (ai !== bi) return ai - bi;
    return b.priority - a.priority;
  });
  const allocated = [];
  const rejected = [];
  let remaining = criticalBudget + optionalBudget;
  const maxTotal = isLocalComplete ? remaining + 500 : remaining;
  for (const req of sorted) {
    if (req.tier === "CRITICAL_ALLOW" && req.size <= criticalBudget) {
      allocated.push(req);
      criticalBudget -= req.size;
      remaining -= req.size;
    } else if (req.size <= maxTotal && remaining >= req.size) {
      allocated.push(req);
      remaining -= req.size;
    } else {
      rejected.push(req);
    }
  }
  return {
    allocated,
    rejected,
    remainingCritical: criticalBudget,
    remainingOptional: remaining - criticalBudget
  };
}

// src/js/youtube/youtube-optional-rule-failure.ts
var DEFAULT_FAILURE_POLICY = {
  maxRetriesPerRule: 2,
  maxTierFailuresBeforeHalt: 3,
  retryDelayMs: 100,
  fallbackOnPersistentFailure: true
};
function createTieredFailureState(tierLabel) {
  return {
    tierLabel,
    failures: 0,
    lastFailureRuleId: null,
    lastFailureTime: 0,
    actionTaken: null
  };
}
function handlePartialFailure(input) {
  const updatedState = { ...input.state };
  updatedState.failures += 1;
  updatedState.lastFailureRuleId = input.failedRuleId;
  updatedState.lastFailureTime = Date.now();
  let action;
  let requiresPanic = false;
  if (input.currentRiskLevel === "PANIC" || input.currentRiskLevel === "HIGH") {
    action = "FALLBACK_TO_SAFE_CONSERVATIVE";
    requiresPanic = input.currentRiskLevel === "PANIC";
  } else if (updatedState.failures > input.policy.maxRetriesPerRule) {
    action = "SKIP_TIER";
  } else if (input.consecutiveTierFailures >= input.policy.maxTierFailuresBeforeHalt) {
    action = "HALT_TIERED_INSTALL";
    if (input.policy.fallbackOnPersistentFailure) {
      action = "FALLBACK_TO_SAFE_CONSERVATIVE";
    }
  } else {
    action = "RETRY_ONE";
  }
  updatedState.actionTaken = action;
  return { action, updatedState, requiresPanic };
}

// src/js/youtube/youtube-critical-endpoints.ts
var CRITICAL_ENDPOINTS = [
  // Player bootstrap scripts
  { pattern: "||www.youtube.com/s/player/*/player_ias.vflset/*", classification: "CRITICAL_ALLOW", riskLevel: "HIGH", description: "Core player bootstrap" },
  { pattern: "||www.youtube.com/s/desktop/*/jsbin/*", classification: "CRITICAL_ALLOW", riskLevel: "HIGH", description: "Desktop JS bundles" },
  { pattern: "||www.youtube.com/s/desktop/*/cssbin/*", classification: "CRITICAL_ALLOW", riskLevel: "HIGH", description: "Desktop CSS bundles" },
  { pattern: "||www.youtube.com/s/service-worker.js", classification: "CRITICAL_ALLOW", riskLevel: "HIGH", description: "YouTube SW" },
  // Core player JSON endpoints
  { pattern: "||www.youtube.com/youtubei/v1/player*", classification: "CRITICAL_ALLOW", riskLevel: "HIGH", description: "Player API response" },
  { pattern: "||www.youtube.com/youtubei/v1/next*", classification: "CRITICAL_ALLOW", riskLevel: "HIGH", description: "Watch next API" },
  // Watch and data endpoints
  { pattern: "||www.youtube.com/watch*", classification: "CRITICAL_ALLOW", riskLevel: "HIGH", description: "Watch page navigation" },
  { pattern: "||www.youtube.com/results*", classification: "CRITICAL_ALLOW", riskLevel: "MEDIUM", description: "Search results" },
  { pattern: "||www.youtube.com/feed/*", classification: "CRITICAL_ALLOW", riskLevel: "MEDIUM", description: "Feed navigation" },
  // Identity / account
  { pattern: "||accounts.google.com/*", classification: "CRITICAL_ALLOW", riskLevel: "HIGH", description: "Google identity" },
  // Playback media
  { pattern: "||*.googlevideo.com/videoplayback*", classification: "CRITICAL_ALLOW", riskLevel: "HIGH", description: "Video playback" },
  { pattern: "||*.googlevideo.com/videomanifest*", classification: "CRITICAL_ALLOW", riskLevel: "HIGH", description: "Video manifest" },
  // Live / DVR
  { pattern: "||*.googlevideo.com/*live*", classification: "CRITICAL_ALLOW", riskLevel: "HIGH", description: "Live streaming" },
  // Embed player
  { pattern: "||www.youtube.com/embed/*", classification: "CRITICAL_ALLOW", riskLevel: "HIGH", description: "Embed player" },
  { pattern: "||www.youtube-nocookie.com/embed/*", classification: "CRITICAL_ALLOW", riskLevel: "HIGH", description: "No-cookie embed" },
  // Navigation essentials
  { pattern: "||www.youtube.com/*", classification: "CRITICAL_ALLOW", riskLevel: "MEDIUM", description: "General YouTube (fallback)" }
];

// src/js/youtube/youtube-rule-priorities.ts
var YOUTUBE_PRIORITY = {
  CRITICAL_ALLOW: 2e9,
  SAFE_SURROGATE: 15e8,
  SAFE_BLOCK: 1e9,
  NON_ENGINE_PRIORITY_CEILING: 999999999,
  GENERIC_STEALTH_EXCLUSION_REPLACEMENT: 6e8,
  GENERIC_STEALTH_CEILING: 5e8,
  GENERIC_AD_TRACKER_CEILING: 549999,
  BEACON: 2e8,
  OBSERVE_ONLY: 1e8,
  SHADOW: 5e7,
  EMBED_SAFE_BONUS: 1e4
};
var YOUTUBE_RULE_ID_MIN = 1e6;
var YOUTUBE_RULE_ID_MAX = 2e6;

// src/js/youtube/youtube-dnr-installer.ts
var YOUTUBE_DNR_RANGE_MIN = YOUTUBE_RULE_ID_MIN;
var YOUTUBE_DNR_RANGE_MAX = YOUTUBE_RULE_ID_MAX;
function buildCriticalAllowRules() {
  const rules = [];
  let nextId = YOUTUBE_DNR_RANGE_MIN;
  for (const endpoint of CRITICAL_ENDPOINTS) {
    if (endpoint.classification !== "CRITICAL_ALLOW") continue;
    if (nextId > YOUTUBE_DNR_RANGE_MIN + 200) break;
    const pattern = endpoint.pattern.replace(/^(\|\|)/, "https://").replace(/\*/g, "");
    const isThirdParty = pattern.includes("googlevideo.com") || pattern.includes("accounts.google.com");
    rules.push({
      id: nextId++,
      priority: YOUTUBE_PRIORITY.CRITICAL_ALLOW,
      action: { type: "allow" },
      condition: {
        urlFilter: endpoint.pattern.replace(/^\|\|/, "").replace(/\|\|/, ""),
        resourceTypes: ["script", "xmlhttprequest", "other", "sub_frame"],
        ...isThirdParty ? { domainType: "thirdParty" } : {}
      }
    });
  }
  return rules;
}
function buildSafeBlockRules(plan) {
  return plan.safeBlockRuleIDs.map((id, i) => ({
    id,
    priority: YOUTUBE_PRIORITY.SAFE_BLOCK,
    action: { type: "block" },
    condition: {
      urlFilter: `||www.youtube.com/youtubei/v1/${id % 2 === 0 ? "player" : "next"}`,
      resourceTypes: ["xmlhttprequest"]
    }
  }));
}
function buildSurrogateRules(plan) {
  return plan.surrogateRuleIDs.map((id) => ({
    id,
    priority: YOUTUBE_PRIORITY.SAFE_SURROGATE,
    action: { type: "allow" },
    condition: {
      urlFilter: `||*.googlevideo.com/videoplayback`,
      resourceTypes: ["media"],
      domainType: "thirdParty"
    }
  }));
}
function buildBeaconRules(plan) {
  return plan.beaconRuleIDs.map((id) => ({
    id,
    priority: YOUTUBE_PRIORITY.BEACON,
    action: { type: "allow" },
    condition: {
      urlFilter: `||www.google-analytics.com/g/collect`,
      resourceTypes: ["xmlhttprequest"],
      domainType: "thirdParty"
    }
  }));
}
function buildShadowRules(plan) {
  return plan.shadowRuleIDs.map((id) => ({
    id,
    priority: YOUTUBE_PRIORITY.SHADOW,
    action: { type: "allow" },
    condition: {
      urlFilter: `||www.youtube.com/youtubei/v1/browse`,
      resourceTypes: ["xmlhttprequest"]
    }
  }));
}
async function getInstalledYouTubeRules() {
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  return existing.filter((r) => r.id >= YOUTUBE_DNR_RANGE_MIN && r.id <= YOUTUBE_DNR_RANGE_MAX);
}
function compileRulesFromPlan(plan) {
  const rules = [];
  rules.push(...buildCriticalAllowRules());
  rules.push(...buildSafeBlockRules(plan));
  rules.push(...buildSurrogateRules(plan));
  rules.push(...buildBeaconRules(plan));
  rules.push(...buildShadowRules(plan));
  return rules;
}
async function removeAllYouTubeRules() {
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const toRemove = existing.map((r) => r.id).filter((id) => id >= YOUTUBE_DNR_RANGE_MIN && id <= YOUTUBE_DNR_RANGE_MAX);
  if (toRemove.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: toRemove });
  }
}
async function installCriticalRulesOnly() {
  const criticalRules = buildCriticalAllowRules();
  const existing = await getInstalledYouTubeRules();
  const toRemove = existing.map((r) => r.id);
  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: toRemove,
      addRules: criticalRules
    });
    return {
      kind: "SUCCESS",
      addedCount: criticalRules.length,
      removedCount: toRemove.length,
      planHash: criticalRules.map((r) => r.id).sort((a, b) => a - b).join(",")
    };
  } catch (e) {
    return { kind: "ERROR", message: e.message };
  }
}
async function installRulePlan(plan) {
  const existing = await getInstalledYouTubeRules();
  const existingIds = existing.map((r) => r.id);
  const newRules = compileRulesFromPlan(plan);
  const newIds = newRules.map((r) => r.id);
  const toRemove = existingIds.filter((id) => !newIds.includes(id));
  const toAdd = newRules.filter((r) => !existingIds.includes(r.id));
  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: toRemove,
      addRules: toAdd
    });
    return {
      kind: "SUCCESS",
      addedCount: toAdd.length,
      removedCount: toRemove.length,
      planHash: plan.planHash
    };
  } catch (e) {
    return { kind: "ERROR", message: e.message };
  }
}
async function applyPlanWithFailureHandling(input) {
  const { plan, sessionState, tabIds, policy } = input;
  const tierState = createTieredFailureState(plan.globalMode);
  let installResult = { kind: "SUCCESS", addedCount: 0, removedCount: 0, planHash: plan.planHash };
  if (plan.criticalAllowRuleIDs.length === 0) {
    try {
      installResult = await installCriticalRulesOnly();
    } catch (e) {
      const panic = panicOnCriticalFailure(
        `Critical install error: ${e.message}`,
        tabIds,
        ["SHADOW", "EXPERIMENTAL", "INSTRUMENTED_SHADOW", "SURROGATE", "SAFE_BLOCK"]
      );
      return { kind: "PANIC", panicState: panic };
    }
  }
  try {
    const rules = compileRulesFromPlan(plan);
    const existing = await getInstalledYouTubeRules();
    const existingIds = existing.map((r) => r.id);
    const toRemove = existingIds.filter((id) => !rules.some((r) => r.id === id));
    const toAdd = rules.filter((r) => !existingIds.includes(r.id));
    if (toRemove.length > 0 || toAdd.length > 0) {
      try {
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: toRemove,
          addRules: toAdd
        });
      } catch (installError) {
        const failureInput = {
          tierLabel: plan.globalMode,
          failedRuleId: toAdd[0]?.id ?? 0,
          currentRiskLevel: "MEDIUM",
          policy: policy ?? DEFAULT_FAILURE_POLICY,
          state: tierState,
          consecutiveTierFailures: 0
        };
        const failureResult = handlePartialFailure(failureInput);
        if (failureResult.requiresPanic || failureResult.action === "FALLBACK_TO_SAFE_CONSERVATIVE") {
          if (failureResult.requiresPanic) {
            const panic = panicOnCriticalFailure(
              `Persistent install failure in ${plan.globalMode} mode: ${installError.message}`,
              tabIds,
              ["SHADOW", "EXPERIMENTAL", "INSTRUMENTED_SHADOW", "SURROGATE", "SAFE_BLOCK"]
            );
            return { kind: "PANIC", panicState: panic };
          }
          const safePlan = compileRulesFromPlan({
            ...plan,
            globalMode: "SAFE_CONSERVATIVE"
          });
          await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: toRemove,
            addRules: safePlan
          });
        }
        return {
          kind: "PARTIAL_FAILURE",
          addedCount: toAdd.length - 1,
          failedRuleId: failureInput.failedRuleId,
          tier: plan.globalMode
        };
      }
    }
    const criticalIds = rules.filter((r) => r.priority >= YOUTUBE_PRIORITY.CRITICAL_ALLOW).map((r) => r.id);
    if (criticalIds.length > 0) {
      const installed = await getInstalledYouTubeRules();
      const installedIds = new Set(installed.map((r) => r.id));
      const missingCritical = criticalIds.filter((id) => !installedIds.has(id));
      if (missingCritical.length > 0) {
        const panic = panicOnCriticalFailure(
          `Critical rules missing after install: ${missingCritical.join(",")}`,
          tabIds,
          ["SHADOW", "EXPERIMENTAL", "INSTRUMENTED_SHADOW", "SURROGATE", "SAFE_BLOCK"]
        );
        return { kind: "PANIC", panicState: panic };
      }
    }
    return {
      kind: "SUCCESS",
      addedCount: toAdd.length,
      removedCount: toRemove.length,
      planHash: plan.planHash
    };
  } catch (e) {
    const panic = panicOnCriticalFailure(
      `Fatal install error: ${e.message}`,
      tabIds,
      ["SHADOW", "EXPERIMENTAL", "INSTRUMENTED_SHADOW", "SURROGATE", "SAFE_BLOCK"]
    );
    return { kind: "PANIC", panicState: panic };
  }
}
async function verifyCriticalRulesInstalled(criticalRuleIds) {
  const installed = await getInstalledYouTubeRules();
  const installedIds = new Set(installed.map((r) => r.id));
  return criticalRuleIds.every((id) => installedIds.has(id));
}

// src/js/youtube/youtube-endpoint-ownership.ts
var ENDPOINT_OWNERSHIP = [
  // YouTube Engine — core
  { domain: "www.youtube.com", pathPattern: "/youtubei/v1/player*", owner: "YOUTUBE_ENGINE", purpose: "Player API", conflictRisk: "HIGH", performanceTimingRisk: "MONITORED_BY_DEFAULT" },
  { domain: "www.youtube.com", pathPattern: "/youtubei/v1/next*", owner: "YOUTUBE_ENGINE", purpose: "Watch next API", conflictRisk: "HIGH", performanceTimingRisk: "MONITORED_BY_DEFAULT" },
  { domain: "www.youtube.com", pathPattern: "/youtubei/v1/browse*", owner: "YOUTUBE_ENGINE", purpose: "Browse API", conflictRisk: "HIGH", performanceTimingRisk: "MONITORED_BY_DEFAULT" },
  { domain: "www.youtube.com", pathPattern: "/youtubei/v1/search*", owner: "YOUTUBE_ENGINE", purpose: "Search API", conflictRisk: "MEDIUM", performanceTimingRisk: "MONITORED_BY_DEFAULT" },
  { domain: "www.youtube.com", pathPattern: "/s/player/*", owner: "YOUTUBE_ENGINE", purpose: "Player scripts", conflictRisk: "HIGH", performanceTimingRisk: "MONITORED_BY_DEFAULT" },
  { domain: "www.youtube.com", pathPattern: "/s/desktop/*", owner: "YOUTUBE_ENGINE", purpose: "Desktop assets", conflictRisk: "HIGH", performanceTimingRisk: "MONITORED_BY_DEFAULT" },
  { domain: "*.googlevideo.com", pathPattern: "/videoplayback*", owner: "YOUTUBE_ENGINE", purpose: "Video playback", conflictRisk: "HIGH", performanceTimingRisk: "MONITORED_BY_DEFAULT" },
  { domain: "*.googlevideo.com", pathPattern: "/videomanifest*", owner: "YOUTUBE_ENGINE", purpose: "Video manifest", conflictRisk: "HIGH", performanceTimingRisk: "MONITORED_BY_DEFAULT" },
  { domain: "www.youtube.com", pathPattern: "/youtubei/v1/reel/*", owner: "YOUTUBE_ENGINE", purpose: "Shorts API", conflictRisk: "MEDIUM", performanceTimingRisk: "MONITORED_BY_DEFAULT" },
  { domain: "www.youtube.com", pathPattern: "/player_adu*", owner: "YOUTUBE_ENGINE", purpose: "Player ADU", conflictRisk: "HIGH", performanceTimingRisk: "MONITORED_BY_DEFAULT" },
  // YouTube domain variants
  { domain: "m.youtube.com", pathPattern: "*", owner: "YOUTUBE_ENGINE", purpose: "Mobile YouTube", conflictRisk: "LOW", performanceTimingRisk: "LIKELY_MONITORED" },
  { domain: "youtube-nocookie.com", pathPattern: "*", owner: "YOUTUBE_ENGINE", purpose: "No-cookie embed", conflictRisk: "LOW", performanceTimingRisk: "LIKELY_MONITORED" },
  { domain: "music.youtube.com", pathPattern: "*", owner: "YOUTUBE_ENGINE", purpose: "YouTube Music", conflictRisk: "LOW" },
  // Generic stealth — known conflict risk
  { domain: "doubleclick.net", pathPattern: "*", owner: "GENERIC_STEALTH", purpose: "Ad serving", conflictRisk: "HIGH", performanceTimingRisk: "MONITORED_BY_DEFAULT" },
  { domain: "googlesyndication.com", pathPattern: "*", owner: "GENERIC_STEALTH", purpose: "Ad serving", conflictRisk: "HIGH", performanceTimingRisk: "MONITORED_BY_DEFAULT" },
  { domain: "googleadservices.com", pathPattern: "*", owner: "GENERIC_STEALTH", purpose: "Ad serving", conflictRisk: "HIGH", performanceTimingRisk: "MONITORED_BY_DEFAULT" },
  { domain: "google-analytics.com", pathPattern: "*", owner: "GENERIC_STEALTH", purpose: "Analytics", conflictRisk: "MEDIUM" },
  { domain: "googletagmanager.com", pathPattern: "*", owner: "GENERIC_STEALTH", purpose: "Tag manager", conflictRisk: "MEDIUM" },
  { domain: "googletagservices.com", pathPattern: "*", owner: "GENERIC_STEALTH", purpose: "Ad services", conflictRisk: "HIGH" },
  { domain: "ytimg.com", pathPattern: "*", owner: "GENERIC_STEALTH", purpose: "YouTube image CDN", conflictRisk: "LOW" },
  // Unknown — default allow
  { domain: "*", pathPattern: "*", owner: "UNKNOWN", purpose: "Catch-all", conflictRisk: "NONE" }
];
function getEndpointOwner(domain, path) {
  for (const entry of ENDPOINT_OWNERSHIP) {
    const domainPattern = entry.domain.replace(/\./g, "\\.").replace(/\*/g, ".*");
    const pathPattern = entry.pathPattern.replace(/\*/g, ".*");
    if (new RegExp(`^${domainPattern}$`).test(domain) && new RegExp(`^${pathPattern}$`).test(path)) {
      return entry;
    }
  }
  return ENDPOINT_OWNERSHIP[ENDPOINT_OWNERSHIP.length - 1];
}
function getPerformanceTimingRisk(domain, path) {
  const entry = getEndpointOwner(domain, path);
  return entry.performanceTimingRisk;
}
function isEndpointMonitoredByDefault(domain, path) {
  const risk = getPerformanceTimingRisk(domain, path);
  return risk === "MONITORED_BY_DEFAULT" || risk === void 0;
}
function registerThirdPartyInitiator(domain) {
  const known = ["doubleclick.net", "googleadservices.com", "googlesyndication.com", "googlevideo.com", "ytimg.com"];
  return known.filter((d) => domain.includes(d));
}
function resolveOwnerConflict(domain, path, genericStealthActive) {
  const entry = getEndpointOwner(domain, path);
  if (entry.owner === "YOUTUBE_ENGINE") return "YOUTUBE_ENGINE";
  if (entry.owner === "GENERIC_STEALTH" && genericStealthActive) {
    return "GENERIC_STEALTH";
  }
  return "YOUTUBE_ENGINE";
}

// src/js/youtube/youtube-shadow-mode.ts
function selectShadowMode(input) {
  if (input.riskLevel === "PANIC") return "PASSIVE_DOM_SHADOW";
  if (input.promptDetected) return "PASSIVE_DOM_SHADOW";
  if (!input.mainWorldAvailable) return "PASSIVE_DOM_SHADOW";
  if (input.riskLevel === "HIGH") return "PASSIVE_DOM_SHADOW";
  if (input.updatePending) return "PASSIVE_DOM_SHADOW";
  if (input.riskLevel === "MEDIUM" && input.shapeConfidence >= 0.7) {
    return "INSTRUMENTED_SHADOW";
  }
  if (input.riskLevel === "LOW" && input.shapeConfidence >= 0.9) {
    return "OFFLINE_FIXTURE_SHADOW";
  }
  return "PASSIVE_DOM_SHADOW";
}

// src/js/youtube/youtube-rule-authority.ts
var RULE_SOURCE = {
  YOUTUBE_ENGINE: "YOUTUBE_ENGINE",
  GENERIC_STEALTH: "GENERIC_STEALTH",
  GENERIC_STEALTH_EXCLUSION: "GENERIC_STEALTH_EXCLUSION",
  STATIC_LIST: "STATIC_LIST",
  USER_FILTER: "USER_FILTER",
  IMPORTED_LIST: "IMPORTED_LIST",
  UNKNOWN: "UNKNOWN"
};
var RULE_AUTHORITY = {
  CRITICAL: "CRITICAL",
  ENGINE_POLICY: "ENGINE_POLICY",
  SAFE_FALLBACK: "SAFE_FALLBACK",
  GENERIC_STEALTH_EXCLUSION: "GENERIC_STEALTH_EXCLUSION",
  NON_ENGINE: "NON_ENGINE",
  UNKNOWN: "UNKNOWN"
};
function getRuleAuthority(source, endpointClass) {
  if (source === RULE_SOURCE.YOUTUBE_ENGINE) {
    return RULE_AUTHORITY.CRITICAL;
  }
  if (source === RULE_SOURCE.GENERIC_STEALTH_EXCLUSION) {
    return RULE_AUTHORITY.GENERIC_STEALTH_EXCLUSION;
  }
  if (source === RULE_SOURCE.GENERIC_STEALTH) {
    return RULE_AUTHORITY.NON_ENGINE;
  }
  if (source === RULE_SOURCE.USER_FILTER || source === RULE_SOURCE.IMPORTED_LIST) {
    return RULE_AUTHORITY.NON_ENGINE;
  }
  return RULE_AUTHORITY.UNKNOWN;
}
var NON_ENGINE_PRIORITY_CEILING = 999999999;
function priorityCanOverrideYouTube(priority) {
  return priority > NON_ENGINE_PRIORITY_CEILING;
}
function capUserOrImportedRulePriority(source, priority) {
  if ((source === RULE_SOURCE.USER_FILTER || source === RULE_SOURCE.IMPORTED_LIST) && priority > NON_ENGINE_PRIORITY_CEILING) {
    return NON_ENGINE_PRIORITY_CEILING;
  }
  return priority;
}
function categorizeRuleBySourceAndPriority(source, priority) {
  if (source === RULE_SOURCE.YOUTUBE_ENGINE) return RULE_AUTHORITY.CRITICAL;
  if (source === RULE_SOURCE.GENERIC_STEALTH_EXCLUSION) return RULE_AUTHORITY.GENERIC_STEALTH_EXCLUSION;
  if (priority > NON_ENGINE_PRIORITY_CEILING) return RULE_AUTHORITY.ENGINE_POLICY;
  return RULE_AUTHORITY.NON_ENGINE;
}

// src/js/youtube/youtube-safe-block.ts
var SAFE_BLOCK_ENDPOINTS = [
  { pattern: "doubleclick.net/instream/*", reason: "Video overlay ad", fixtureRequired: true },
  { pattern: "googleads.g.doubleclick.net/pagead/ads*", reason: "Page-level ad serving", fixtureRequired: true },
  { pattern: "securepubads.g.doubleclick.net/gampad/ads*", reason: "GPT ad serving", fixtureRequired: true },
  { pattern: "tpc.googlesyndication.com/safeframe/*", reason: "SafeFrame container", fixtureRequired: true },
  { pattern: "pagead2.googlesyndication.com/pagead/js/adsbygoogle.js", reason: "Adsbygoogle script", fixtureRequired: true },
  { pattern: "pagead2.googlesyndication.com/getconfig/sodar*", reason: "Sodar config", fixtureRequired: true },
  { pattern: "www.youtube.com/pagead/*", reason: "YouTube page-level ad", fixtureRequired: true },
  { pattern: "www.youtube.com/api/stats/ads*", reason: "YouTube ad stats beacon", fixtureRequired: true },
  { pattern: "www.youtube.com/youtubei/v1/ads*", reason: "YouTube Ads API", fixtureRequired: true },
  { pattern: "www.youtube.com/youtubei/v1/ad_break*", reason: "Ad break API", fixtureRequired: true },
  { pattern: "www.youtube.com/pagead/ads*", reason: "YouTube pagead ads", fixtureRequired: true }
];
var FIXTURE_PATTERNS = SAFE_BLOCK_ENDPOINTS.filter((e) => e.fixtureRequired).map((e) => e.pattern);
function classifySafeBlockEndpoint(url) {
  for (const entry of SAFE_BLOCK_ENDPOINTS) {
    const escaped = entry.pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
    const regex = new RegExp(escaped);
    if (regex.test(url)) return entry;
  }
  return null;
}
function isSafeBlockEndpoint(url) {
  return classifySafeBlockEndpoint(url) !== null;
}
function hasFixturesForSafeBlock(entry, availableFixtures) {
  if (!entry.fixtureRequired) return true;
  const fixtureName = entry.pattern.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
  return availableFixtures.some((f) => f.includes(fixtureName) || f.includes(entry.reason.replace(/\s+/g, "_")));
}

// src/js/youtube/youtube-surrogate-redirects.ts
var SURROGATE_REDIRECT_REGISTRY = [
  { pattern: "pagead2.googlesyndication.com/pagead/js/adsbygoogle.js", surrogatePath: "/js/youtube-surrogates/adsbygoogle.js", resourceType: "script", fixtureRequired: true, description: "Adsbygoogle replacement" },
  { pattern: "pagead2.googlesyndication.com/pagead/js/r20250605/r20110914/abg*", surrogatePath: "/js/youtube-surrogates/abg.js", resourceType: "script", fixtureRequired: true, description: "Abg script replacement" },
  { pattern: "googleads.g.doubleclick.net/pagead/ads?*", surrogatePath: "", resourceType: "xmlhttprequest", fixtureRequired: true, description: "Ad request redirect (empty)" },
  { pattern: "securepubads.g.doubleclick.net/gampad/ads?*", surrogatePath: "", resourceType: "xmlhttprequest", fixtureRequired: true, description: "GPT ad request redirect (empty)" },
  { pattern: "tpc.googlesyndication.com/safeframe/*", surrogatePath: "/js/youtube-surrogates/safeframe.js", resourceType: "sub_frame", fixtureRequired: true, description: "SafeFrame replacement" },
  { pattern: "www.youtube.com/pagead/*", surrogatePath: "", resourceType: "xmlhttprequest", fixtureRequired: true, description: "YouTube pagead redirect (empty)" },
  { pattern: "www.youtube.com/api/stats/ads*", surrogatePath: "", resourceType: "xmlhttprequest", fixtureRequired: true, description: "YouTube ad stats beacon (empty)" },
  { pattern: "doubleclick.net/instream/*", surrogatePath: "", resourceType: "xmlhttprequest", fixtureRequired: true, description: "Instream ad redirect (empty)" }
];
function getSurrogateForEndpoint(url) {
  for (const entry of SURROGATE_REDIRECT_REGISTRY) {
    const escaped = entry.pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
    const regex = new RegExp(escaped);
    if (regex.test(url)) return entry;
  }
  return null;
}
function isSurrogateEligible(entry, eligibility) {
  if (!entry.fixtureRequired) return eligibility === "ELIGIBLE";
  return eligibility === "ELIGIBLE" || eligibility === "NEEDS_FIXTURE";
}
function getSurrogatePaths() {
  return SURROGATE_REDIRECT_REGISTRY.filter((e) => e.surrogatePath.length > 0).map((e) => e.surrogatePath);
}

// src/js/youtube/youtube-rule-interference-sim.ts
function detectConflictingPriorities(rule, targets, sourceLabel, category) {
  const results = [];
  for (const target of targets) {
    if (priorityCanOverrideYouTube(rule.priority) && rule.priority > target.priority) {
      const priorityDiff = rule.priority - target.priority;
      results.push({
        ruleId: rule.id,
        ruleSource: sourceLabel,
        conflictTarget: `${target.source}|${target.authority}|${target.endpointClass}`,
        conflictPriority: target.priority,
        severity: target.authority === "CRITICAL" ? "HIGH" : "MEDIUM",
        description: `${sourceLabel} rule ${rule.id} (priority ${rule.priority}) overrides ${target.source} ${target.endpointClass} (priority ${target.priority}), diff=${priorityDiff}`,
        compromisedCategory: category
      });
    }
  }
  return results;
}
function simulateUserRuleInterference(input) {
  const interferences = [];
  for (const rule of input.userRules) {
    interferences.push(...detectConflictingPriorities(rule, input.engineCriticalRules, "USER", "CRITICAL"));
    interferences.push(...detectConflictingPriorities(rule, input.engineSafeBlockRules, "USER", "SAFE_BLOCK"));
    interferences.push(...detectConflictingPriorities(rule, input.engineSurrogateRules, "USER", "SURROGATE"));
  }
  for (const rule of input.importedRules) {
    interferences.push(...detectConflictingPriorities(rule, input.engineCriticalRules, "IMPORTED", "CRITICAL"));
    interferences.push(...detectConflictingPriorities(rule, input.engineSafeBlockRules, "IMPORTED", "SAFE_BLOCK"));
    interferences.push(...detectConflictingPriorities(rule, input.engineSurrogateRules, "IMPORTED", "SURROGATE"));
  }
  const criticalCompromised = interferences.filter((i) => i.compromisedCategory === "CRITICAL").length;
  const safeBlockCompromised = interferences.filter((i) => i.compromisedCategory === "SAFE_BLOCK").length;
  const surrogateCompromised = interferences.filter((i) => i.compromisedCategory === "SURROGATE").length;
  const hasHighSeverity = interferences.some((i) => i.severity === "HIGH");
  return {
    interferences,
    criticalRulesCompromised: criticalCompromised,
    safeBlockRulesCompromised: safeBlockCompromised,
    surrogateRulesCompromised: surrogateCompromised,
    totalCompromised: interferences.length,
    requiresPanic: criticalCompromised > 0,
    requiresConservativeReset: hasHighSeverity
  };
}

// src/js/youtube/youtube-config.ts
var YOUTUBE_SETTING_KEYS = {
  SMART_BLOCKING: "youtubeSmartBlockingEnabled",
  DETECTION_NEUTRAL_MODE: "youtubeDetectionNeutralMode",
  SHADOW_MODE: "youtubeShadowMode",
  SURROGATES_ENABLED: "youtubeSurrogatesEnabled",
  DATA_SANITIZER: "youtubeDataSanitizerEnabled",
  CONFIG_SANITIZER: "youtubeConfigSanitizerEnabled",
  COSMETIC_CLEANUP: "youtubeCosmeticCleanupEnabled",
  PROMPT_DETECTOR: "youtubePromptDetectorEnabled",
  AUTO_BACKOFF: "youtubeAutoBackoffEnabled",
  BEACON_LOCAL_COMPLETE: "youtubeBeaconLocalComplete",
  INSTRUMENTED_SHADOW: "youtubeInstrumentedShadow",
  AGGRESSIVE_MODE: "youtubeAggressiveMode"
};
var YOUTUBE_SETTING_DEFAULTS = {
  [YOUTUBE_SETTING_KEYS.SMART_BLOCKING]: false,
  [YOUTUBE_SETTING_KEYS.DETECTION_NEUTRAL_MODE]: false,
  [YOUTUBE_SETTING_KEYS.SHADOW_MODE]: true,
  [YOUTUBE_SETTING_KEYS.SURROGATES_ENABLED]: true,
  [YOUTUBE_SETTING_KEYS.DATA_SANITIZER]: true,
  [YOUTUBE_SETTING_KEYS.CONFIG_SANITIZER]: true,
  [YOUTUBE_SETTING_KEYS.COSMETIC_CLEANUP]: true,
  [YOUTUBE_SETTING_KEYS.PROMPT_DETECTOR]: true,
  [YOUTUBE_SETTING_KEYS.AUTO_BACKOFF]: true,
  [YOUTUBE_SETTING_KEYS.BEACON_LOCAL_COMPLETE]: true,
  [YOUTUBE_SETTING_KEYS.INSTRUMENTED_SHADOW]: false,
  [YOUTUBE_SETTING_KEYS.AGGRESSIVE_MODE]: false
};
function readYouTubeSettings(raw) {
  return {
    youtubeSmartBlockingEnabled: raw.youtubeSmartBlockingEnabled === true,
    youtubeDetectionNeutralMode: raw.youtubeDetectionNeutralMode === true,
    youtubeShadowMode: raw.youtubeShadowMode !== false,
    youtubeSurrogatesEnabled: raw.youtubeSurrogatesEnabled !== false,
    youtubeDataSanitizerEnabled: raw.youtubeDataSanitizerEnabled !== false,
    youtubeConfigSanitizerEnabled: raw.youtubeConfigSanitizerEnabled !== false,
    youtubeCosmeticCleanupEnabled: raw.youtubeCosmeticCleanupEnabled !== false,
    youtubePromptDetectorEnabled: raw.youtubePromptDetectorEnabled !== false,
    youtubeAutoBackoffEnabled: raw.youtubeAutoBackoffEnabled !== false,
    youtubeBeaconLocalComplete: raw.youtubeBeaconLocalComplete !== false,
    youtubeInstrumentedShadow: raw.youtubeInstrumentedShadow === true,
    youtubeAggressiveMode: raw.youtubeAggressiveMode === true
  };
}
async function readYouTubeSettingsFromStorage() {
  const stored = await chrome.storage.local.get("userSettings");
  const userSettings = stored?.userSettings ?? {};
  return readYouTubeSettings(userSettings);
}
function createSettingDefaultsPayload() {
  return { ...YOUTUBE_SETTING_DEFAULTS };
}

// src/js/youtube/youtube-local-complete.ts
var DEFAULT_LOCAL_COMPLETE_CONFIG = {
  enabled: false,
  readinessGated: true,
  shadowGuardActive: true,
  failOpenOnError: true,
  extendedBudget: 500,
  allowedRiskLevels: ["LOW", "MEDIUM"]
};
function isLocalCompleteAllowed(config, readinessProbePassed, shadowGuardActive, currentRisk) {
  if (!config.enabled) return false;
  if (config.readinessGated && !readinessProbePassed) return false;
  if (config.shadowGuardActive && !shadowGuardActive) return false;
  if (!config.allowedRiskLevels.includes(currentRisk)) return false;
  return true;
}
function getLocalCompleteBudgetExtension(config, isActive) {
  if (!isActive) return 0;
  return config.extendedBudget;
}

// src/js/youtube/youtube-player-sanitizer.ts
var PLAYER_AD_FIELDS = [
  "adPlacements",
  "playerAds",
  "adSlots",
  "adBreakHeartbeatParams",
  "adSafetyReason",
  "adParams",
  "companionAdConfig",
  "instreamVideoAdRenderer",
  "playerLegacyDesktopWatchAdsRenderer"
];
var PLAYER_PROTECTED_FIELDS = [
  "streamingData",
  "videoDetails",
  "captions",
  "microformat",
  "playabilityStatus",
  "storyboards",
  "endscreen",
  "cards",
  "annotations",
  "playlist"
];
function getPlayerAdFieldNames() {
  return [...PLAYER_AD_FIELDS];
}
function getPlayerProtectedFieldNames() {
  return [...PLAYER_PROTECTED_FIELDS];
}
function sanitizePlayerResponse(input) {
  const result = {
    sanitized: { ...input.data },
    adFieldsRemoved: [],
    protectedFieldsTouched: [],
    skipReason: null
  };
  if (input.confidence < 50 && !input.fixtureValidated) {
    result.skipReason = "CONFIDENCE_TOO_LOW";
    return result;
  }
  if (input.traversalDepth > 5) {
    result.skipReason = "PERFORMANCE_SKIP";
    return result;
  }
  for (const field of PLAYER_AD_FIELDS) {
    if (field in result.sanitized) {
      result.adFieldsRemoved.push(field);
      delete result.sanitized[field];
    }
  }
  for (const field of PLAYER_PROTECTED_FIELDS) {
    const original = input.data[field];
    const after = result.sanitized[field];
    if (original !== after) {
      result.protectedFieldsTouched.push(field);
      result.sanitized[field] = original;
    }
  }
  return result;
}
function isPlayerAdField(key) {
  return PLAYER_AD_FIELDS.includes(key);
}
function isPlayerProtectedField(key) {
  return PLAYER_PROTECTED_FIELDS.includes(key);
}
function sanitizePlayerResponseIdempotent(input) {
  const first = sanitizePlayerResponse(input);
  const second = sanitizePlayerResponse({ ...input, data: first.sanitized });
  return second;
}

// src/js/youtube/youtube-data-sanitizer.ts
var AD_RENDERER_PATTERNS = [
  "adSlotRenderer",
  "promotedContentRenderer",
  "promotedSparklesWebRenderer",
  "playerLegacyDesktopWatchAdsRenderer",
  "companionAdRenderer",
  "carouselAdRenderer",
  "searchPyvRenderer",
  "statementBannerRenderer"
];
var SHELF_CONTAINING_PROMOTED_TYPES = [
  "shelfRenderer",
  "reelShelfRenderer",
  "richShelfRenderer"
];
function getAdRendererPatterns() {
  return [...AD_RENDERER_PATTERNS];
}
function isAdRenderer(obj) {
  for (const key of Object.keys(obj)) {
    if (AD_RENDERER_PATTERNS.includes(key)) return true;
  }
  return false;
}
function hasPromotedContent(obj) {
  const str = JSON.stringify(obj);
  for (const pattern of AD_RENDERER_PATTERNS) {
    if (str.includes(pattern)) return true;
  }
  return false;
}
function sanitizeArray(arr, depth) {
  let removed = 0;
  let shelvesChecked = 0;
  let shelvesCleared = 0;
  if (depth <= 0) return { result: arr, removed: 0, shelvesChecked: 0, shelvesCleared: 0 };
  const result = arr.filter((item) => {
    if (typeof item !== "object" || item === null) return true;
    const obj = item;
    for (const shelfType of SHELF_CONTAINING_PROMOTED_TYPES) {
      if (shelfType in obj) {
        shelvesChecked++;
        const shelf = obj[shelfType];
        if (shelf && hasPromotedContent(shelf)) {
          shelvesCleared++;
          return false;
        }
      }
    }
    if (isAdRenderer(obj)) {
      removed++;
      return false;
    }
    for (const key of Object.keys(obj)) {
      if (Array.isArray(obj[key])) {
        const nested = sanitizeArray(obj[key], depth - 1);
        obj[key] = nested.result;
        removed += nested.removed;
        shelvesChecked += nested.shelvesChecked;
        shelvesCleared += nested.shelvesCleared;
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        const nestedResult = sanitizeNode(obj[key], depth - 1);
        obj[key] = nestedResult.result;
        removed += nestedResult.removed;
        shelvesChecked += nestedResult.shelvesChecked;
        shelvesCleared += nestedResult.shelvesCleared;
      }
    }
    return true;
  });
  return { result, removed, shelvesChecked, shelvesCleared };
}
function sanitizeNode(obj, depth) {
  let removed = 0;
  let shelvesChecked = 0;
  let shelvesCleared = 0;
  if (depth <= 0) return { result: obj, removed: 0, shelvesChecked: 0, shelvesCleared: 0 };
  for (const key of Object.keys(obj)) {
    if (Array.isArray(obj[key])) {
      const nested = sanitizeArray(obj[key], depth - 1);
      obj[key] = nested.result;
      removed += nested.removed;
      shelvesChecked += nested.shelvesChecked;
      shelvesCleared += nested.shelvesCleared;
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      const nestedResult = sanitizeNode(obj[key], depth - 1);
      obj[key] = nestedResult.result;
      removed += nestedResult.removed;
      shelvesChecked += nestedResult.shelvesChecked;
      shelvesCleared += nestedResult.shelvesCleared;
    }
  }
  return { result: obj, removed, shelvesChecked, shelvesCleared };
}
function sanitizeData(input) {
  const output = {
    sanitized: input.data,
    adRenderersRemoved: 0,
    shelvesChecked: 0,
    shelvesCleared: 0,
    skipReason: null
  };
  if (input.confidence < 50 && !input.fixtureValidated) {
    output.skipReason = "CONFIDENCE_TOO_LOW";
    return output;
  }
  if (input.traversalDepth > 5) {
    output.skipReason = "PERFORMANCE_SKIP";
    return output;
  }
  const depth = Math.min(input.traversalDepth, 3);
  if (Array.isArray(input.data)) {
    const result = sanitizeArray(input.data, depth);
    output.sanitized = result.result;
    output.adRenderersRemoved = result.removed;
    output.shelvesChecked = result.shelvesChecked;
    output.shelvesCleared = result.shelvesCleared;
  } else if (typeof input.data === "object" && input.data !== null) {
    const result = sanitizeNode(input.data, depth);
    output.sanitized = result.result;
    output.adRenderersRemoved = result.removed;
    output.shelvesChecked = result.shelvesChecked;
    output.shelvesCleared = result.shelvesCleared;
  }
  return output;
}
function containsAdRenderer(data) {
  const str = typeof data === "string" ? data : JSON.stringify(data);
  return AD_RENDERER_PATTERNS.some((p) => str.includes(p));
}

// src/js/youtube/youtube-config-sanitizer.ts
var AD_CONFIG_KEYS = [
  "adSlots",
  "adConfig",
  "adSignalsInfo",
  "enable_ad_detection_logging",
  "ad_preroll",
  "ad_device_signals",
  "ad_break",
  "adPlacements"
];
function getAdConfigKeys() {
  return [...AD_CONFIG_KEYS];
}
function isAdConfigKey(key) {
  return AD_CONFIG_KEYS.includes(key);
}
function isAdConfigValue(value) {
  if (value === null || value === void 0) return false;
  const str = (typeof value === "object" ? JSON.stringify(value) : String(value)).toLowerCase();
  const adTerms = ["ad", "sponsored", "promoted", "campaign", "placement"];
  return adTerms.some((t) => str.includes(t));
}
function sanitizeConfigValue(key, value) {
  if (Array.isArray(value)) return [];
  if (typeof value === "object" && value !== null) return {};
  if (typeof value === "number") return 0;
  if (typeof value === "boolean") return false;
  if (typeof value === "string") return "";
  return value;
}
function handleConfigSet(input) {
  if (input.riskLevel === "PANIC") {
    return { sanitizedValue: null, action: "FAIL_OPEN", reason: "PANIC_RISK" };
  }
  if (input.confidence < 30) {
    return { sanitizedValue: input.value, action: "PASSTHROUGH", reason: "CONFIDENCE_TOO_LOW" };
  }
  if (!isAdConfigKey(input.key)) {
    return { sanitizedValue: input.value, action: "PASSTHROUGH", reason: "NOT_AD_KEY" };
  }
  if (typeof input.value === "object" && input.value !== null) {
    return { sanitizedValue: sanitizeConfigValue(input.key, input.value), action: "SANITIZED", reason: "AD_CONFIG_SANITIZED" };
  }
  return { sanitizedValue: input.value, action: "PASSTHROUGH", reason: "SCALAR_VALUE_KEPT" };
}
function handleConfigGet(input) {
  if (input.riskLevel === "PANIC") {
    return { sanitizedValue: null, action: "FAIL_OPEN", reason: "PANIC_RISK" };
  }
  if (input.confidence < 30) {
    return { sanitizedValue: input.value, action: "PASSTHROUGH", reason: "CONFIDENCE_TOO_LOW" };
  }
  if (!isAdConfigKey(input.key)) {
    return { sanitizedValue: input.value, action: "PASSTHROUGH", reason: "NOT_AD_KEY" };
  }
  const sanitized = sanitizeConfigValue(input.key, input.value);
  return { sanitizedValue: sanitized, action: "SANITIZED", reason: "AD_CONFIG_VALUE_REPLACED" };
}
function handleConfigUpdate(input) {
  if (input.riskLevel === "PANIC" || input.confidence < 30) {
    return { sanitizedValue: input.value, action: "FAIL_OPEN", reason: "PANIC_OR_LOW_CONFIDENCE" };
  }
  if (typeof input.value !== "object" || input.value === null) {
    return { sanitizedValue: input.value, action: "PASSTHROUGH", reason: "NON_OBJECT_VALUE" };
  }
  const value = input.value;
  const sanitized = {};
  let changed = false;
  for (const [k, v] of Object.entries(value)) {
    if (isAdConfigKey(k)) {
      sanitized[k] = sanitizeConfigValue(k, v);
      changed = true;
    } else {
      sanitized[k] = v;
    }
  }
  if (!changed) {
    return { sanitizedValue: input.value, action: "PASSTHROUGH", reason: "NO_AD_KEYS_IN_UPDATE" };
  }
  return { sanitizedValue: sanitized, action: "SANITIZED", reason: "AD_KEYS_SANITIZED_IN_UPDATE" };
}

// src/js/youtube/youtube-fetch-guard.ts
var GUARDED_ENDPOINTS = [
  "/youtubei/v1/player",
  "/youtubei/v1/next",
  "/youtubei/v1/browse",
  "/youtubei/v1/search",
  "/youtubei/v1/reel"
];
var YOUTUBE_API_ORIGINS = [
  "https://www.youtube.com",
  "https://www.youtube-nocookie.com",
  "https://m.youtube.com"
];
var AD_HEADERS = [
  "x-ads-event",
  "x-adset",
  "x-ad-signals"
];
function getGuardedEndpoints() {
  return [...GUARDED_ENDPOINTS];
}
function getApiOrigins() {
  return [...YOUTUBE_API_ORIGINS];
}
function getAdHeaders() {
  return [...AD_HEADERS];
}
function classifyEndpoint(url) {
  for (const endpoint of GUARDED_ENDPOINTS) {
    if (url.includes(endpoint)) return endpoint;
  }
  return null;
}
function isGuardedUrl(url) {
  return YOUTUBE_API_ORIGINS.some((origin) => url.startsWith(origin)) && classifyEndpoint(url) !== null;
}
function evaluateFetchInterception(input) {
  if (!isGuardedUrl(input.url)) {
    return { intercepted: false, skipReason: "NOT_GUARDED_ENDPOINT", requiresSanitizer: false, requiresHeaderSanitization: false };
  }
  if (input.riskLevel === "PANIC" || input.riskLevel === "HIGH") {
    return { intercepted: false, skipReason: "RISK_TOO_HIGH", requiresSanitizer: false, requiresHeaderSanitization: false };
  }
  if (input.responseSize > 1e6) {
    return { intercepted: false, skipReason: "RESPONSE_TOO_LARGE", requiresSanitizer: false, requiresHeaderSanitization: false };
  }
  if (!input.contentType.includes("json") && !input.contentType.includes("javascript")) {
    return { intercepted: false, skipReason: "NOT_JSON_RESPONSE", requiresSanitizer: false, requiresHeaderSanitization: false };
  }
  const requiresSanitizer = input.confidence >= 50;
  const requiresHeaderSanitization = input.confidence >= 70 && input.riskLevel === "LOW";
  return {
    intercepted: requiresSanitizer || requiresHeaderSanitization,
    skipReason: null,
    requiresSanitizer,
    requiresHeaderSanitization
  };
}
function sanitizeResponseHeader(input) {
  if (input.riskLevel === "PANIC") {
    return { sanitizedValue: input.headerValue, modified: false, skipReason: "PANIC_RISK" };
  }
  const headerLower = input.headerName.toLowerCase();
  if (AD_HEADERS.some((h) => h.toLowerCase() === headerLower)) {
    return { sanitizedValue: null, modified: true, skipReason: null };
  }
  return { sanitizedValue: input.headerValue, modified: false, skipReason: "NOT_AD_HEADER" };
}
function sanitizeAllResponseHeaders(headers, riskLevel) {
  const result = {};
  for (const [key, value] of Object.entries(headers)) {
    const output = sanitizeResponseHeader({ headerName: key, headerValue: value, riskLevel });
    if (output.modified && output.sanitizedValue === null) {
      continue;
    }
    result[key] = value;
  }
  return result;
}

// src/js/youtube/youtube-sanitizer-traversal.ts
var DEFAULT_MAX_DEPTH = 5;
var CONTENTS_ARRAY_MAX_DEPTH = 3;
var UNKNOWN_NESTED_MAX_DEPTH = 1;
var OBSERVATION_WINDOWS = {
  WATCH: 5e3,
  BROWSE: 3e3,
  SEARCH: 3e3,
  SHORTS: 3e3,
  EMBED: 5e3,
  LIVE: 5e3,
  MUSIC: 3e3,
  UNSUPPORTED: 0
};
var DEFAULT_TRAVERSAL_CONFIG = {
  defaultMaxDepth: DEFAULT_MAX_DEPTH,
  contentsArrayMaxDepth: CONTENTS_ARRAY_MAX_DEPTH,
  unknownNestedMaxDepth: UNKNOWN_NESTED_MAX_DEPTH
};
function getMaxDepthForPath(path, config) {
  if (path.includes("contents")) return config.contentsArrayMaxDepth;
  if (path.length === 0) return config.defaultMaxDepth;
  return config.defaultMaxDepth;
}
function shouldSkipTraversal(path, depth, config) {
  const maxDepth = getMaxDepthForPath(path, config);
  return depth > maxDepth;
}
function evaluateCleanObservation(input) {
  const rejectionReasons = [];
  if (input.promptScore >= 50) rejectionReasons.push("PROMPT_SCORE_TOO_HIGH");
  if (input.healthState === "PROMPT_DETECTED" || input.healthState === "BROKEN") rejectionReasons.push("UNHEALTHY_STATE");
  if (input.performanceBudgetOverrun) rejectionReasons.push("PERFORMANCE_BUDGET_OVERRUN");
  if (input.sanitizerErrors > 0) rejectionReasons.push("SANITIZER_ERRORS");
  const window2 = OBSERVATION_WINDOWS[input.pageType] ?? 0;
  if (input.timeSinceLoad < window2) rejectionReasons.push("OBSERVATION_WINDOW_NOT_ELAPSED");
  return {
    isClean: rejectionReasons.length === 0,
    rejectionReasons
  };
}
function evaluateRetroactiveSanitization(input) {
  if (input.sanitizerConfidence < 50) {
    return { shouldRetroact: false, hooksToRetry: [], skipReason: "CONFIDENCE_TOO_LOW" };
  }
  if (input.timeSincePageLoad > input.maxRetroactiveWindow) {
    return { shouldRetroact: false, hooksToRetry: [], skipReason: "RETROACTIVE_WINDOW_EXPIRED" };
  }
  if (input.missedHooks.length === 0) {
    return { shouldRetroact: false, hooksToRetry: [], skipReason: "NO_MISSED_HOOKS" };
  }
  const retryableHooks = input.missedHooks.filter((hook) => {
    const nonRetryable = ["fetch", "xhr", "DOMContentLoaded", "load"];
    return !nonRetryable.includes(hook);
  });
  if (retryableHooks.length === 0) {
    return { shouldRetroact: false, hooksToRetry: [], skipReason: "ALL_HOOKS_NON_RETRYABLE" };
  }
  return { shouldRetroact: true, hooksToRetry: retryableHooks, skipReason: null };
}
function getMaxDepth(pageType) {
  if (pageType === "SHORTS" || pageType === "EMBED") return CONTENTS_ARRAY_MAX_DEPTH;
  return DEFAULT_MAX_DEPTH;
}

// src/js/youtube/youtube-ab-variation.ts
var EXPERIMENT_SIGNAL_PATTERNS = [
  "experiments",
  "experiment_ids",
  "client.experimentIds",
  "client.experiments",
  "variation",
  "bucket",
  "flags",
  "encodedExperimentFlags",
  "client.experimentFlags"
];
var DEFAULT_KNOWN_EXPERIMENTS = /* @__PURE__ */ new Map([
  ["ad_variation", ["control", "treatment_1", "treatment_2"]],
  ["player_ui", ["control", "new_layout"]],
  ["recommendation_feed", ["control", "dense", "expanded"]]
]);
function getDefaultKnownExperiments() {
  return new Map(DEFAULT_KNOWN_EXPERIMENTS);
}
function detectExperimentSignals(data) {
  const signals = {};
  for (const pattern of EXPERIMENT_SIGNAL_PATTERNS) {
    const parts = pattern.split(".");
    let current = data;
    let found = true;
    for (const part of parts) {
      if (typeof current === "object" && current !== null && part in current) {
        current = current[part];
      } else {
        found = false;
        break;
      }
    }
    if (found && typeof current === "string") {
      signals[pattern] = current;
    }
  }
  return signals;
}
function parseVariationFromSignals(signals, knownExperiments) {
  for (const [signalKey, signalValue] of Object.entries(signals)) {
    for (const [expId, variations] of knownExperiments.entries()) {
      if (signalValue.includes(expId) || signalKey.includes(expId)) {
        for (const variation of variations) {
          if (signalValue.includes(variation)) {
            return {
              detected: true,
              experimentId: expId,
              variation,
              confidenceImpact: -10
            };
          }
        }
      }
    }
  }
  return {
    detected: false,
    experimentId: null,
    variation: null,
    confidenceImpact: 0
  };
}
function createABVariationState(key) {
  return {
    key,
    firstSeenAt: Date.now(),
    lastSeenAt: Date.now(),
    observationCount: 0,
    cleanObservationCount: 0,
    confidence: 0,
    disabled: false
  };
}
function updateABVariationState(state, isClean) {
  const updated = { ...state };
  updated.lastSeenAt = Date.now();
  updated.observationCount += 1;
  if (isClean) {
    updated.cleanObservationCount += 1;
  }
  const ratio = updated.observationCount > 0 ? updated.cleanObservationCount / updated.observationCount : 0;
  updated.confidence = Math.round(ratio * 100);
  if (updated.observationCount >= 10 && ratio < 0.3) {
    updated.disabled = true;
  }
  return updated;
}
function detectABVariation(input) {
  const signals = detectExperimentSignals(input.data);
  return parseVariationFromSignals(signals, input.knownExperiments);
}

// src/js/youtube/youtube-shape-confidence.ts
var ACTIVATION_THRESHOLDS = {
  SHADOW_ONLY: 0,
  CAUTIOUS: 50,
  BALANCED: 70,
  STABLE: 85,
  MAX: 100
};
function computeShapeConfidence(key, evidence) {
  let score = 0;
  if (evidence.fixtureExists && evidence.shapeMatchesFixture) score += 35;
  else if (evidence.fixtureExists) score += 20;
  if (evidence.expectedParentKeysPresent) score += 15;
  score += Math.min(evidence.shadowCleanObservations * 10, 20);
  if (evidence.consecutiveCleanLoads >= 3) score += 15;
  else if (evidence.consecutiveCleanLoads >= 1) score += 5;
  if (evidence.unknownParentKey) score -= 30;
  if (evidence.typeDrift) score -= 30;
  if (evidence.promptAfterSanitize) score -= 50;
  if (evidence.playbackErrorAfterSanitize) score -= 50;
  if (evidence.domBreakageAfterSanitize) score -= 50;
  if (evidence.surrogateMismatch) score -= 40;
  if (evidence.browserMajorUpdateSinceValidation) score = Math.min(score, 60);
  return Math.max(0, Math.min(100, score));
}
function confidenceToMode(score) {
  if (score >= ACTIVATION_THRESHOLDS.STABLE) return "STABLE";
  if (score >= ACTIVATION_THRESHOLDS.BALANCED) return "BALANCED";
  if (score >= ACTIVATION_THRESHOLDS.CAUTIOUS) return "CAUTIOUS";
  return "SHADOW_ONLY";
}
function canPromoteToBalanced(state) {
  if (state.disabledForSession) return false;
  if (!state.confidenceKey.schemaFingerprint) return false;
  if (state.consecutiveCleanObservations < 3) return false;
  if (state.score < ACTIVATION_THRESHOLDS.BALANCED) return false;
  return true;
}

// src/js/youtube/youtube-navigation.ts
var SPA_EVENT_NAMES = ["yt-navigate-start", "yt-navigate-finish", "yt-page-data-updated", "popstate", "historyPushState", "historyReplaceState"];
function initializeNavigation(tabId, url) {
  const ctx = rebuildPageContext(tabId, url);
  return {
    currentContext: ctx,
    previousContext: null,
    knownSPARoutes: /* @__PURE__ */ new Set([new URL(url).pathname]),
    navigationCount: 0,
    lastNavigationType: "FULL_DOCUMENT"
  };
}
function onFullDocumentStart(state, url) {
  const newCtx = rebuildPageContext(state.currentContext.tabId, url);
  return {
    ...state,
    previousContext: state.currentContext,
    currentContext: newCtx,
    navigationCount: state.navigationCount + 1,
    lastNavigationType: "FULL_DOCUMENT"
  };
}
function onYouTubeNavigationFinish(state, url, health) {
  const old = state.currentContext;
  const newCtx = {
    ...old,
    url,
    pageType: classifyPageType(url),
    riskLevel: health ? recomputeRiskLevel(old.riskLevel, health, old.sanitizerShapeConfidence, old.hasAntiBlockPrompt, classifyPageType(url), false) : old.riskLevel
  };
  const routes = new Set(state.knownSPARoutes);
  try {
    routes.add(new URL(url).pathname);
  } catch (e) {
    console.warn("[uBR] youtube-navigation: URL parsing failed", e);
  }
  return {
    ...state,
    previousContext: state.currentContext,
    currentContext: newCtx,
    knownSPARoutes: routes,
    navigationCount: state.navigationCount + 1,
    lastNavigationType: "SPA"
  };
}
function onBFCacheRestore(state, url) {
  return {
    ...state,
    lastNavigationType: "BFCACHE_RESTORE",
    navigationCount: state.navigationCount + 1
  };
}
function handleBFCacheRestore(state, probesPass) {
  const ctx = state.currentContext;
  let risk = ctx.riskLevel;
  let shadowMode = "PASSIVE_DOM_SHADOW";
  if (probesPass) {
    shadowMode = "INSTRUMENTED_SHADOW";
  } else {
    risk = "HIGH";
    shadowMode = "PASSIVE_DOM_SHADOW";
  }
  return {
    state: { ...state, currentContext: { ...ctx, riskLevel: risk }, lastNavigationType: "BFCACHE_RESTORE" },
    newRisk: risk,
    shadowMode
  };
}
function isSPAEvent(eventName) {
  return SPA_EVENT_NAMES.includes(eventName);
}

// src/js/youtube/youtube-content-reconnect.ts
function computeConservativeState(contentState, swState) {
  if (!contentState) {
    return { riskLevel: "HIGH", shadowMode: "PASSIVE_DOM_SHADOW" };
  }
  const riskLevel = maxRiskLevel(swState.riskLevel, contentState.lastHealth === "BROKEN" ? "PANIC" : contentState.lastHealth === "PROMPT_DETECTED" ? "HIGH" : "LOW");
  const shadowMode = riskLevel === "PANIC" || riskLevel === "HIGH" ? "PASSIVE_DOM_SHADOW" : swState.shadowMode;
  return { riskLevel, shadowMode };
}
function mergeRegistration(existing, incoming) {
  if (!existing) return incoming;
  return incoming.contentScriptGenerationId > existing.contentScriptGenerationId ? incoming : existing;
}
function createReconnectResponse(contentState, swRisk) {
  if (!contentState) {
    return { state: null, conservativeMode: true, duplicatMergeKey: "" };
  }
  const conservativeState = computeConservativeState(contentState, { riskLevel: swRisk, shadowMode: "PASSIVE_DOM_SHADOW" });
  return {
    state: contentState,
    conservativeMode: conservativeState.riskLevel !== swRisk,
    duplicatMergeKey: `${contentState.tabId}:${contentState.frameId}`
  };
}

// src/js/youtube/youtube-mainworld-capability.ts
async function runCapabilityProbe(timeoutMs = 250) {
  const start = performance.now();
  let mainWorldExecuted = false;
  let mainWorldActuallyPageWorld = false;
  let domVisible = false;
  let persistentURLVisible = false;
  let temporaryURLVisible = false;
  if (typeof document !== "undefined") {
    for (const script of document.scripts) {
      if (script.src && script.src.startsWith("chrome-extension://")) {
        persistentURLVisible = true;
        domVisible = true;
      }
    }
  }
  try {
    const result = await attemptMinimalBootstrap(timeoutMs);
    mainWorldExecuted = result.executed;
    mainWorldActuallyPageWorld = result.inPageWorld;
    if (result.domVisibleExtensionOrigin) {
      domVisible = true;
      temporaryURLVisible = true;
    }
  } catch (e) {
    console.warn("[uBR] youtube-mainworld-capability: probeMainWorldCapability bootstrap failed", e);
    return {
      result: "MAIN_WORLD_PROBE_FAILED",
      domVisibleScriptElementCreated: false,
      persistentChromeExtensionURLVisible: persistentURLVisible,
      temporaryChromeExtensionURLVisible: false,
      probeRoundTripMs: performance.now() - start,
      mainWorldExecuted: false,
      mainWorldActuallyPageWorld: false
    };
  }
  const elapsed = performance.now() - start;
  if (!mainWorldExecuted) {
    return {
      result: "MAIN_WORLD_UNAVAILABLE",
      domVisibleScriptElementCreated: domVisible,
      persistentChromeExtensionURLVisible: persistentURLVisible,
      temporaryChromeExtensionURLVisible: temporaryURLVisible,
      probeRoundTripMs: elapsed,
      mainWorldExecuted: false,
      mainWorldActuallyPageWorld: false
    };
  }
  if (!mainWorldActuallyPageWorld) {
    return {
      result: "MAIN_WORLD_COMMUNICATION_FAILED",
      domVisibleScriptElementCreated: domVisible,
      persistentChromeExtensionURLVisible: persistentURLVisible,
      temporaryChromeExtensionURLVisible: temporaryURLVisible,
      probeRoundTripMs: elapsed,
      mainWorldExecuted: true,
      mainWorldActuallyPageWorld: false
    };
  }
  if (domVisible) {
    return {
      result: "MAIN_WORLD_CAPABLE_DOM_VISIBLE",
      domVisibleScriptElementCreated: domVisible,
      persistentChromeExtensionURLVisible: persistentURLVisible,
      temporaryChromeExtensionURLVisible: temporaryURLVisible,
      probeRoundTripMs: elapsed,
      mainWorldExecuted: true,
      mainWorldActuallyPageWorld: true
    };
  }
  return {
    result: "MAIN_WORLD_CAPABLE_CLEAN",
    domVisibleScriptElementCreated: false,
    persistentChromeExtensionURLVisible: false,
    temporaryChromeExtensionURLVisible: false,
    probeRoundTripMs: elapsed,
    mainWorldExecuted: true,
    mainWorldActuallyPageWorld: true
  };
}
async function attemptMinimalBootstrap(timeoutMs) {
  return new Promise((resolve) => {
    if (typeof document === "undefined" || typeof window === "undefined") {
      resolve({ executed: false, inPageWorld: false, domVisibleExtensionOrigin: false });
      return;
    }
    const marker = `__uBR_capability_probe_${Math.random().toString(36).slice(2)}`;
    const timeout = setTimeout(() => {
      resolve({ executed: false, inPageWorld: false, domVisibleExtensionOrigin: false });
    }, timeoutMs);
    const handler = (event) => {
      if (event.data?.source === "uBRYouTubeMain" && event.data?.type === "CAPABILITY_PROBE_RESULT") {
        clearTimeout(timeout);
        window.removeEventListener("message", handler);
        resolve({
          executed: true,
          inPageWorld: event.data.inPageWorld === true,
          domVisibleExtensionOrigin: event.data.domVisible === true
        });
      }
    };
    window.addEventListener("message", handler);
    try {
      window.postMessage({
        source: "uBRYouTubeIsolated",
        type: "CAPABILITY_PROBE",
        marker
      }, location.origin);
    } catch (e) {
      console.warn("[uBR] youtube-mainworld-capability: postMessage probe failed", e);
      clearTimeout(timeout);
      window.removeEventListener("message", handler);
      resolve({ executed: false, inPageWorld: false, domVisibleExtensionOrigin: false });
    }
  });
}
var cachedProbe = null;
function clearCachedProbe() {
  cachedProbe = null;
}
function scanForExtensionOriginScripts() {
  const found = [];
  if (typeof document === "undefined") return { hasExtensionOriginScript: false, scripts: [] };
  for (const script of document.scripts) {
    if (script.src && script.src.includes("chrome-extension://")) {
      found.push(script.src);
    }
  }
  return { hasExtensionOriginScript: found.length > 0, scripts: found };
}
function mainWorldActiveAllowed(input) {
  if (!input.capabilityOk) return false;
  if (!input.readinessAccepted) return false;
  if (!input.hookRacePermitsEarlyAccessors) return false;
  if (!input.shapeConfidencePermits) return false;
  if (!input.riskLevelPermits) return false;
  return true;
}

// src/js/youtube/youtube-readiness-probe.ts
var READINESS_GRACE_WINDOW_MS = 250;
var READINESS_EVENT = "uBRYouTubeMainReady";
var BOOTSTRAP_VERSION = "1.0.0";
function generateNonce() {
  const arr = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < 16; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function computeExpectedHash(input) {
  const data = new TextEncoder().encode(input.nonce + input.bootstrapSalt + input.bootstrapVersion);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
function validateReadinessEvent(detail, expectedHash, currentBootstrapVersion, startTime) {
  const arrival = performance.now();
  const arrivalMs = arrival - startTime;
  const arrivedLate = arrivalMs > READINESS_GRACE_WINDOW_MS;
  const nonceHashMatch = detail.nonceHash === expectedHash;
  const bootstrapVersionMatch = detail.bootstrapVersion === currentBootstrapVersion;
  const accepted = nonceHashMatch && bootstrapVersionMatch && !arrivedLate;
  return { accepted, nonceHashMatch, bootstrapVersionMatch, arrivedLate, arrivalMs };
}
async function waitForReadiness(nonce, bootstrapSalt, bootstrapVersion, timeoutMs = READINESS_GRACE_WINDOW_MS) {
  const startTime = performance.now();
  const expectedHash = await computeExpectedHash({ nonce, bootstrapSalt, bootstrapVersion });
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve({ accepted: false, mainWorldAvailable: false, nonceHashMatch: false, bootstrapVersionMatch: false, arrivedLate: false, arrivalMs: 0 });
      return;
    }
    const timeout = setTimeout(() => {
      window.removeEventListener(READINESS_EVENT, handler);
      window.removeEventListener("message", messageHandler);
      resolve({ accepted: false, mainWorldAvailable: false, nonceHashMatch: false, bootstrapVersionMatch: false, arrivedLate: false, arrivalMs: performance.now() - startTime });
    }, timeoutMs);
    const handler = (event) => {
      const customEvent = event;
      if (!customEvent.detail) return;
      const result = validateReadinessEvent(customEvent.detail, expectedHash, bootstrapVersion, startTime);
      if (result.nonceHashMatch || result.bootstrapVersionMatch) {
        clearTimeout(timeout);
        window.removeEventListener(READINESS_EVENT, handler);
        window.removeEventListener("message", messageHandler);
        resolve({ ...result, mainWorldAvailable: result.accepted });
      }
    };
    const messageHandler = (event) => {
      if (event.data?.source !== "uBRYouTubeMain") return;
      if (event.origin !== location.origin) return;
      const result = validateReadinessEvent(event.data, expectedHash, bootstrapVersion, startTime);
      if (result.nonceHashMatch || result.bootstrapVersionMatch) {
        clearTimeout(timeout);
        window.removeEventListener(READINESS_EVENT, handler);
        window.removeEventListener("message", messageHandler);
        resolve({ ...result, mainWorldAvailable: result.accepted });
      }
    };
    window.addEventListener(READINESS_EVENT, handler);
    window.addEventListener("message", messageHandler);
  });
}
function readinessToShadowMode(available) {
  return available ? "INSTRUMENTED_SHADOW" : "PASSIVE_DOM_SHADOW";
}

// src/js/youtube/youtube-wrapper-manager.ts
function createWrapperManager() {
  const registry = /* @__PURE__ */ new Map();
  let nextId = 0;
  function generateWrapperId() {
    return `wrapper_${++nextId}_${Date.now()}`;
  }
  function hashDescriptor(desc) {
    if (!desc) return "none";
    const parts = [];
    if (typeof desc.value === "function") parts.push(`fn:${desc.value.name}`);
    if (typeof desc.get === "function") parts.push("getter");
    if (typeof desc.set === "function") parts.push("setter");
    parts.push(`c:${Boolean(desc.configurable)}`);
    parts.push(`e:${Boolean(desc.enumerable)}`);
    parts.push(`w:${Boolean(desc.writable)}`);
    return parts.join("|");
  }
  function capture(targetObject, propertyName, targetKind, activationReason, riskClass) {
    let originalDescriptor;
    let originalFunction = void 0;
    try {
      originalDescriptor = Object.getOwnPropertyDescriptor(targetObject, propertyName);
    } catch (e) {
      console.warn("[uBR] youtube-wrapper-manager: getOwnPropertyDescriptor failed for", propertyName, e);
    }
    const wrapperId = generateWrapperId();
    const capture2 = {
      wrapperId,
      targetObject,
      propertyName,
      originalDescriptor,
      originalFunction: originalDescriptor?.value !== void 0 ? originalDescriptor.value : void 0,
      restoreState: "active"
    };
    registry.set(wrapperId, capture2);
    return capture2;
  }
  function restoreAccessor(wrapperId) {
    const cap = registry.get(wrapperId);
    if (!cap) return false;
    if (cap.restoreState === "restored") return true;
    try {
      if (cap.originalDescriptor) {
        Object.defineProperty(cap.targetObject, cap.propertyName, cap.originalDescriptor);
      }
      cap.restoreState = "restored";
      return true;
    } catch (e) {
      console.warn("[uBR] youtube-wrapper-manager: restoreAccessor defineProperty failed for", cap.propertyName, e);
      cap.restoreState = "restore-failed";
      return false;
    }
  }
  function restoreFunction(wrapperId) {
    const cap = registry.get(wrapperId);
    if (!cap) return false;
    if (cap.restoreState === "restored") return true;
    try {
      if (cap.originalFunction !== void 0) {
        ;
        cap.targetObject[cap.propertyName] = cap.originalFunction;
      }
      cap.restoreState = "restored";
      return true;
    } catch (e) {
      console.warn("[uBR] youtube-wrapper-manager: restoreFunction assignment failed for", cap.propertyName, e);
      cap.restoreState = "restore-failed";
      return false;
    }
  }
  function restoreXHRFetchGuard(wrapperId) {
    return restoreFunction(wrapperId);
  }
  function restoreConfigWrapper(wrapperId) {
    return restoreAccessor(wrapperId);
  }
  function disableWrapper(wrapperId) {
    const cap = registry.get(wrapperId);
    if (!cap) return false;
    switch (cap.originalDescriptor?.get !== void 0 || cap.originalDescriptor?.set !== void 0) {
      case true:
        return restoreAccessor(wrapperId);
      default:
        return restoreFunction(wrapperId);
    }
  }
  function disableByRiskClass(riskClass) {
    const restored = [];
    const failed = [];
    for (const [id, cap] of registry) {
      if (cap.restoreState === "restored") continue;
      if (riskClass !== "all" && cap.restoreState !== riskClass) continue;
      const ok = disableWrapper(id);
      if (ok) restored.push(id);
      else failed.push(id);
    }
    return { restored, failed };
  }
  function disableAll() {
    return disableByRiskClass("all");
  }
  function getRecord(wrapperId) {
    const cap = registry.get(wrapperId);
    if (!cap) return void 0;
    return {
      wrapperId: cap.wrapperId,
      targetKind: cap.originalDescriptor?.get !== void 0 ? "accessor" : "function",
      targetName: cap.propertyName,
      originalDescriptorHash: cap.originalDescriptor ? hashDescriptor(cap.originalDescriptor) : "none",
      installedAt: 0,
      activationReason: "",
      riskClass: "",
      restoreState: cap.restoreState
    };
  }
  function getActiveCount() {
    let count = 0;
    for (const cap of registry.values()) {
      if (cap.restoreState === "active") count++;
    }
    return count;
  }
  function getAllRecords() {
    const records = [];
    for (const cap of registry.values()) {
      records.push({
        wrapperId: cap.wrapperId,
        targetKind: "function",
        targetName: cap.propertyName,
        originalDescriptorHash: cap.originalDescriptor ? hashDescriptor(cap.originalDescriptor) : "none",
        installedAt: 0,
        activationReason: "",
        riskClass: "",
        restoreState: cap.restoreState
      });
    }
    return records;
  }
  function createDisableCommand(wrapperIds, reason, commandNonce) {
    return {
      source: "uBRYouTubeIsolated",
      type: "UBR_DISABLE_MAINWORLD_WRAPPERS",
      commandNonce,
      wrapperIds,
      reason
    };
  }
  function createDisableAck(commandNonce, restored, failed) {
    return {
      source: "uBRYouTubeMain",
      type: "UBR_DISABLE_MAINWORLD_WRAPPERS_ACK",
      commandNonce,
      restoredWrapperIds: restored,
      failedWrapperIds: failed,
      activeWrapperCount: getActiveCount()
    };
  }
  return {
    capture,
    disableWrapper,
    disableByRiskClass,
    disableAll,
    restoreAccessor,
    restoreFunction,
    restoreXHRFetchGuard,
    restoreConfigWrapper,
    getRecord,
    getActiveCount,
    getAllRecords,
    createDisableCommand,
    createDisableAck
  };
}
function captureAccessor(manager, targetObject, propertyName, activationReason, riskClass) {
  const cap = manager.capture(targetObject, propertyName, "accessor", activationReason, riskClass);
  return cap?.wrapperId ?? null;
}
function captureFunctionWrapper(manager, targetObject, propertyName, activationReason, riskClass) {
  const cap = manager.capture(targetObject, propertyName, "function", activationReason, riskClass);
  return cap?.wrapperId ?? null;
}

// src/js/youtube/youtube-hook-race-telemetry.ts
function collectHookRaceTelemetry(input) {
  const ytInitialPlayerResponseAlreadyDefinedAtProbe = checkGlobalDefined("ytInitialPlayerResponse");
  const ytInitialDataAlreadyDefinedAtProbe = checkGlobalDefined("ytInitialData");
  const ytplayerAlreadyDefined = checkGlobalDefined("ytplayer");
  const ytcfgAlreadyDefined = checkGlobalDefined("ytcfg");
  const totalChecked = [ytInitialPlayerResponseAlreadyDefinedAtProbe, ytInitialDataAlreadyDefinedAtProbe, ytplayerAlreadyDefined, ytcfgAlreadyDefined];
  const alreadyDefinedCount = totalChecked.filter(Boolean).length;
  return {
    earlyAccessorWinsLikely: alreadyDefinedCount < 2,
    ytInitialPlayerResponseAlreadyDefinedAtProbe,
    ytInitialDataAlreadyDefinedAtProbe,
    preExistingDescriptorKind: classifyDescriptorKind(),
    inlineAssignmentEvidenceFromDOM: "unknown",
    retroactiveSanitizerSucceeded: false,
    accessorWouldHaveWon: alreadyDefinedCount < 2 ? "yes" : "no"
  };
}
function checkGlobalDefined(name) {
  if (typeof window === "undefined") return false;
  return name in window && window[name] !== void 0;
}
function classifyDescriptorKind() {
  if (typeof window === "undefined") return "unknown";
  const checks = ["ytInitialPlayerResponse", "ytInitialData", "ytplayer"];
  for (const name of checks) {
    try {
      const desc = Object.getOwnPropertyDescriptor(window, name);
      if (!desc) return "absent";
      if (desc.get !== void 0 || desc.set !== void 0) return "accessor";
      return "data";
    } catch (e) {
      console.warn("[uBR] youtube-hook-race-telemetry: classifyDescriptorKind getOwnPropertyDescriptor failed for", name, e);
      return "unknown";
    }
  }
  return "unknown";
}
function earlyAccessorAllowed(input) {
  if (!input.hookRaceEvidence.earlyAccessorWinsLikely) return false;
  if (!input.mainWorldAvailable) return false;
  if (!input.pageTypeIsFixtureCovered) return false;
  if (!input.sanitizerShapeConfidenceAboveThreshold) return false;
  if (!input.noAntiBlockPromptOrWrapperAnomaly) return false;
  if (!input.descriptorRiskBudgetAvailable) return false;
  return true;
}

// src/js/youtube/youtube-cosmetic-cleanup.ts
var FORBIDDEN_SELECTORS = [
  ".style-scope",
  '[class*="ad"]',
  '[id*="ad"]',
  "ytd-masthead",
  "ytd-topbar",
  "#container",
  "#center",
  "#start",
  "#end",
  "#guide-button",
  "#logo"
];
var RISK_CLASS_PRIORITY = {
  SHADOW_DOM_COSMETIC_CLEANUP: 8,
  LIGHT_DOM_COSMETIC_CLEANUP: 7,
  FEED_COSMETIC_CLEANUP: 6,
  INTERSTITIAL_CLEANUP: 5,
  SHORTS_CLEANUP: 4,
  DOCUMENT_WRITE_WRAPPER: 3,
  DOCUMENT_STREAM_WRAPPER: 2,
  DYNAMIC_SCRIPT_INSERTION_WRAPPER: 1
};
var DEFAULT_RISK_CLASS_ENABLED = {
  SHADOW_DOM_COSMETIC_CLEANUP: false,
  LIGHT_DOM_COSMETIC_CLEANUP: false,
  FEED_COSMETIC_CLEANUP: false,
  INTERSTITIAL_CLEANUP: false,
  SHORTS_CLEANUP: false,
  DOCUMENT_WRITE_WRAPPER: false,
  DOCUMENT_STREAM_WRAPPER: false,
  DYNAMIC_SCRIPT_INSERTION_WRAPPER: false
};
function isForbiddenSelector(selector) {
  return FORBIDDEN_SELECTORS.some((f) => selector === f || selector.startsWith(f));
}
function validateSelector(sel) {
  if (isForbiddenSelector(sel.selector)) return false;
  if (!sel.selector) return false;
  if (!sel.pageType || sel.pageType.length === 0) return false;
  if (!sel.riskLevelAllowed || sel.riskLevelAllowed.length === 0) return false;
  if (!sel.fixtureEvidence) return false;
  if (!sel.protectedAncestorCheck) return false;
  if (!sel.rollbackTag) return false;
  return true;
}
function shouldCleanTransientUI(element, riskLevel, shapeConfidence, hasPrompt) {
  if (hasPrompt) return false;
  if (!element.fixtureCovered) return false;
  if (shapeConfidence < 70) return false;
  if (riskLevel === "PANIC") return false;
  if (riskLevel === "HIGH") return false;
  return true;
}
function selectRollbackOrder(enabledClasses) {
  return [...enabledClasses].sort(
    (a, b) => RISK_CLASS_PRIORITY[b] - RISK_CLASS_PRIORITY[a]
  );
}
function detectInterstitial(signals) {
  const signalCount = [signals.fullPageModalOverlay, signals.navigationDelay, signals.knownInterstitialRenderer, signals.playerUnavailableDueToAd].filter(Boolean).length;
  return signalCount >= 2;
}
function createShortsCleanupConfig() {
  return {
    enabled: false,
    minConsecutiveCleanObservations: 5,
    consecutiveCleanObservations: 0,
    preserveSwipe: true,
    preserveFeedContinuity: true
  };
}
function updateShortsCleanupConfig(config, observationClean) {
  const consecutive = observationClean ? config.consecutiveCleanObservations + 1 : 0;
  return {
    ...config,
    consecutiveCleanObservations: consecutive,
    enabled: consecutive >= config.minConsecutiveCleanObservations
  };
}
function computeRiskClassEnabled(promptDetected, backoffActive, riskLevel, shapeConfidence) {
  if (backoffActive || riskLevel === "PANIC") {
    return Object.fromEntries(
      Object.entries(DEFAULT_RISK_CLASS_ENABLED)
    );
  }
  if (promptDetected) {
    return {
      ...DEFAULT_RISK_CLASS_ENABLED,
      SHADOW_DOM_COSMETIC_CLEANUP: false,
      LIGHT_DOM_COSMETIC_CLEANUP: false,
      FEED_COSMETIC_CLEANUP: false,
      INTERSTITIAL_CLEANUP: false
    };
  }
  const enabled = { ...DEFAULT_RISK_CLASS_ENABLED };
  if (shapeConfidence >= 85 && riskLevel !== "HIGH") {
    enabled.LIGHT_DOM_COSMETIC_CLEANUP = true;
    enabled.FEED_COSMETIC_CLEANUP = true;
    enabled.INTERSTITIAL_CLEANUP = true;
  }
  if (shapeConfidence >= 90 && riskLevel === "LOW") {
    enabled.SHADOW_DOM_COSMETIC_CLEANUP = true;
    enabled.SHORTS_CLEANUP = true;
  }
  return enabled;
}
var TRANSIENT_UI_ELEMENTS = [
  { kind: "SKIP_BUTTON", fixtureCovered: false, selector: ".ytp-ad-skip-button" },
  { kind: "COUNTDOWN_OVERLAY", fixtureCovered: false, selector: ".ytp-ad-countdown" },
  { kind: "AD_PROGRESS_MARKER", fixtureCovered: false, selector: ".ytp-ad-progress" },
  { kind: "SPONSORED_COMPANION", fixtureCovered: false, selector: "#sponsored-companion" },
  { kind: "PROMOTED_FEED_CARD", fixtureCovered: false, selector: "ytd-promoted-video-renderer" },
  { kind: "PLAYER_OVERLAY_AD_BADGE", fixtureCovered: false, selector: ".ytp-ad-badge" }
];

// src/js/youtube/youtube-domain-variant.ts
var DOMAIN_VARIANT_POLICIES = {
  TOP_LEVEL_YOUTUBE: {
    variant: "TOP_LEVEL_YOUTUBE",
    phaseGate: "PHASE_4",
    safeDefault: "BALANCED",
    dnrMode: "BALANCED",
    mainWorldAllowed: true,
    sanitizerAllowed: true,
    cosmeticCleanupAllowed: true,
    requiresFixtures: false
  },
  WWW_YOUTUBE: {
    variant: "WWW_YOUTUBE",
    phaseGate: "PHASE_4",
    safeDefault: "BALANCED",
    dnrMode: "BALANCED",
    mainWorldAllowed: true,
    sanitizerAllowed: true,
    cosmeticCleanupAllowed: true,
    requiresFixtures: false
  },
  MOBILE_YOUTUBE: {
    variant: "MOBILE_YOUTUBE",
    phaseGate: "PHASE_2",
    safeDefault: "SAFE_CONSERVATIVE",
    dnrMode: "SAFE_CONSERVATIVE",
    mainWorldAllowed: false,
    sanitizerAllowed: false,
    cosmeticCleanupAllowed: false,
    requiresFixtures: true
  },
  NO_COOKIE_YOUTUBE: {
    variant: "NO_COOKIE_YOUTUBE",
    phaseGate: "PHASE_3",
    safeDefault: "EMBED_CONSERVATIVE",
    dnrMode: "EMBED_CONSERVATIVE",
    mainWorldAllowed: false,
    sanitizerAllowed: true,
    cosmeticCleanupAllowed: false,
    requiresFixtures: false
  },
  MUSIC_YOUTUBE: {
    variant: "MUSIC_YOUTUBE",
    phaseGate: "PHASE_1",
    safeDefault: "SAFE_CONSERVATIVE",
    dnrMode: "SAFE_CONSERVATIVE",
    mainWorldAllowed: false,
    sanitizerAllowed: false,
    cosmeticCleanupAllowed: false,
    requiresFixtures: true
  },
  EMBED_IFRAME: {
    variant: "EMBED_IFRAME",
    phaseGate: "PHASE_3",
    safeDefault: "EMBED_CONSERVATIVE",
    dnrMode: "EMBED_CONSERVATIVE",
    mainWorldAllowed: false,
    sanitizerAllowed: true,
    cosmeticCleanupAllowed: false,
    requiresFixtures: false
  },
  SANDBOXED_EMBED: {
    variant: "SANDBOXED_EMBED",
    phaseGate: "PHASE_2",
    safeDefault: "SAFE_CONSERVATIVE",
    dnrMode: "SAFE_CONSERVATIVE",
    mainWorldAllowed: false,
    sanitizerAllowed: false,
    cosmeticCleanupAllowed: false,
    requiresFixtures: true
  },
  NESTED_FRAME: {
    variant: "NESTED_FRAME",
    phaseGate: "PHASE_1",
    safeDefault: "SAFE_CONSERVATIVE",
    dnrMode: "SAFE_CONSERVATIVE",
    mainWorldAllowed: false,
    sanitizerAllowed: false,
    cosmeticCleanupAllowed: false,
    requiresFixtures: true
  },
  UNKNOWN: {
    variant: "UNKNOWN",
    phaseGate: "PHASE_1",
    safeDefault: "SAFE_CONSERVATIVE",
    dnrMode: "SAFE_CONSERVATIVE",
    mainWorldAllowed: false,
    sanitizerAllowed: false,
    cosmeticCleanupAllowed: false,
    requiresFixtures: false
  }
};
function classifyDomainVariant(hostname, isTopFrame, parentOriginKnown, isSandboxed) {
  if (isSandboxed) return "SANDBOXED_EMBED";
  if (!isTopFrame) {
    if (parentOriginKnown) return "NESTED_FRAME";
    return "EMBED_IFRAME";
  }
  const host = hostname.replace(/^www\./, "");
  if (host === "youtube.com" || host === "www.youtube.com") return "TOP_LEVEL_YOUTUBE";
  if (host === "m.youtube.com") return "MOBILE_YOUTUBE";
  if (host === "youtube-nocookie.com") return "NO_COOKIE_YOUTUBE";
  if (host === "music.youtube.com") return "MUSIC_YOUTUBE";
  return "UNKNOWN";
}
function getDomainPolicy(hostname, isTopFrame, parentOriginKnown, isSandboxed) {
  const variant = classifyDomainVariant(hostname, isTopFrame, parentOriginKnown, isSandboxed);
  return DOMAIN_VARIANT_POLICIES[variant];
}
function domainAllowsMainWorld(policy) {
  return policy.mainWorldAllowed && policy.phaseGate !== "PHASE_1" && policy.phaseGate !== "DISABLED";
}
function domainAllowsSanitizer(policy) {
  return policy.sanitizerAllowed && policy.phaseGate !== "PHASE_1" && policy.phaseGate !== "DISABLED";
}
function domainAllowsCosmeticCleanup(policy) {
  return policy.cosmeticCleanupAllowed && policy.phaseGate !== "PHASE_1" && policy.phaseGate !== "PHASE_2" && policy.phaseGate !== "DISABLED";
}
function canPromoteDomain(policy, fixtureEvidence, shapeConfidence) {
  if (policy.phaseGate === "DISABLED") return policy;
  if (!fixtureEvidence && policy.requiresFixtures) return policy;
  if (shapeConfidence < 70) return policy;
  const promotionMap = {
    PHASE_1: "PHASE_2",
    PHASE_2: "PHASE_3",
    PHASE_3: "PHASE_4",
    PHASE_4: "PHASE_4",
    DISABLED: "DISABLED"
  };
  return { ...policy, phaseGate: promotionMap[policy.phaseGate] };
}
function selectSafeDefault(variant) {
  return DOMAIN_VARIANT_POLICIES[variant].safeDefault;
}
function isDomainSupported(hostname) {
  const host = hostname.replace(/^www\./, "");
  return ["youtube.com", "m.youtube.com", "youtube-nocookie.com", "music.youtube.com"].includes(host);
}

// src/js/youtube/youtube-performance-timeline.ts
function classifyPerformanceTimingRisk(endpoint, inCriticalRegistry, hasShadowTelemetry, hasFixtureEvidence, pageObservesPerformance) {
  if (inCriticalRegistry) return "MONITORED_BY_DEFAULT";
  if (pageObservesPerformance) return "MONITORED_BY_DEFAULT";
  if (endpoint.match(/\/player|\/bootstrap|\/ad|\/beacon|\/measure|\/ping|\/collect/i)) return "MONITORED_BY_DEFAULT";
  if (hasShadowTelemetry && !hasFixtureEvidence) return "LIKELY_MONITORED";
  if (hasFixtureEvidence && !pageObservesPerformance) return "UNLIKELY_MONITORED";
  return "MONITORED_BY_DEFAULT";
}
function selectTimelineAction(risk, surrogateEligible, fixtureProven, shapeConfidence) {
  if (risk === "UNLIKELY_MONITORED") {
    return {
      action: "BLOCK_ONLY_WITH_FIXTURE",
      reason: "low_monitoring_risk",
      performanceTimingRisk: risk
    };
  }
  if (risk === "LIKELY_MONITORED") {
    if (surrogateEligible && fixtureProven && shapeConfidence >= 85) {
      return {
        action: "SURROGATE_WITH_VALIDATION",
        reason: "surrogate_with_timing_validation",
        performanceTimingRisk: risk
      };
    }
    return {
      action: "SHADOW_OBSERVE",
      reason: "likely_monitored_shadow_observe",
      performanceTimingRisk: risk
    };
  }
  if (surrogateEligible && fixtureProven && shapeConfidence >= 90) {
    return {
      action: "SURROGATE_WITH_VALIDATION",
      reason: "surrogate_with_fixture",
      performanceTimingRisk: risk
    };
  }
  return {
    action: "ALLOW",
    reason: "monitored_by_default_allow",
    performanceTimingRisk: risk
  };
}
function surrogateExtensionOriginAcceptable(endpoint, requirement) {
  if (!requirement) return false;
  return requirement.extensionOriginAcceptable;
}
function evaluateSurrogateTiming(surrogateEntry, requirement) {
  const reasons = [];
  let acceptable = true;
  if (surrogateEntry.url.startsWith("chrome-extension://")) {
    if (!requirement.extensionOriginAcceptable) {
      reasons.push("extension_origin_not_acceptable");
      acceptable = false;
    }
  }
  if (surrogateEntry.duration < requirement.timingEnvelopeMs.min) {
    reasons.push("timing_too_fast");
    acceptable = false;
  }
  if (surrogateEntry.duration > requirement.timingEnvelopeMs.max) {
    reasons.push("timing_too_slow");
    acceptable = false;
  }
  if (surrogateEntry.transferSize === 0) {
    reasons.push("zero_transfer_size");
    acceptable = false;
  }
  return { acceptable, reasons };
}
function selectRuleActionForEndpoint(endpoint, performanceTimingRisk, surrogateEligible, fixtureProven, shapeConfidence) {
  const decision = selectTimelineAction(performanceTimingRisk, surrogateEligible, fixtureProven, shapeConfidence);
  switch (decision.action) {
    case "BLOCK_ONLY_WITH_FIXTURE":
      return fixtureProven ? "BLOCK" : "ALLOW";
    case "SURROGATE_WITH_VALIDATION":
      return "SURROGATE";
    case "SHADOW_OBSERVE":
      return "ALLOW";
    case "ALLOW":
      return "ALLOW";
    case "LOCAL_COMPLETE":
      return "ALLOW";
  }
}
function getTimelineVisibilityFromRisk(risk) {
  switch (risk) {
    case "MONITORED_BY_DEFAULT":
      return "MONITORED_BY_DEFAULT";
    case "LIKELY_MONITORED":
      return "LIKELY_MONITORED";
    case "UNLIKELY_MONITORED":
      return "UNLIKELY_MONITORED";
  }
}
var SURROGATE_TIMING_REQUIREMENTS = [
  {
    endpoint: "doubleclick.net",
    entryType: "resource",
    urlClass: "ad-script",
    initiatorType: "script",
    timingEnvelopeMs: { min: 50, max: 3e3 },
    extensionOriginAcceptable: false
  },
  {
    endpoint: "googlevideo.com/videoplayback",
    entryType: "media",
    urlClass: "video",
    initiatorType: "media",
    timingEnvelopeMs: { min: 200, max: 1e4 },
    extensionOriginAcceptable: false
  }
];
function getSurrogateTimingRequirement(endpoint) {
  for (const req of SURROGATE_TIMING_REQUIREMENTS) {
    if (endpoint.includes(req.endpoint)) return req;
  }
  return null;
}

// src/js/youtube/youtube-performance-timeline-policy.ts
var MONITORED_ENDPOINTS = [
  // Ad-serving endpoints — monitored by default
  { pattern: "doubleclick.net", visibility: "MONITORED_BY_DEFAULT", riskClass: "ALLOW" },
  { pattern: "googlesyndication.com", visibility: "MONITORED_BY_DEFAULT", riskClass: "ALLOW" },
  { pattern: "googleadservices.com", visibility: "MONITORED_BY_DEFAULT", riskClass: "ALLOW" },
  { pattern: "*.googlevideo.com/videoplayback", visibility: "MONITORED_BY_DEFAULT", riskClass: "ALLOW" },
  { pattern: "*.googlevideo.com/videomanifest", visibility: "MONITORED_BY_DEFAULT", riskClass: "ALLOW" },
  // YouTube critical APIs — monitored by default
  { pattern: "www.youtube.com/youtubei/v1/player", visibility: "MONITORED_BY_DEFAULT", riskClass: "ALLOW" },
  { pattern: "www.youtube.com/youtubei/v1/next", visibility: "MONITORED_BY_DEFAULT", riskClass: "ALLOW" },
  { pattern: "www.youtube.com/youtubei/v1/browse", visibility: "MONITORED_BY_DEFAULT", riskClass: "ALLOW" },
  { pattern: "www.youtube.com/youtubei/v1/search", visibility: "MONITORED_BY_DEFAULT", riskClass: "ALLOW" },
  { pattern: "www.youtube.com/youtubei/v1/reel", visibility: "MONITORED_BY_DEFAULT", riskClass: "ALLOW" },
  // Player bootstrap and assets
  { pattern: "www.youtube.com/s/player/*", visibility: "MONITORED_BY_DEFAULT", riskClass: "ALLOW" },
  { pattern: "www.youtube.com/s/desktop/*", visibility: "MONITORED_BY_DEFAULT", riskClass: "ALLOW" },
  { pattern: "www.youtube.com/player_adu*", visibility: "MONITORED_BY_DEFAULT", riskClass: "ALLOW" },
  // Beacon/measurement endpoints
  { pattern: "*/beacon", visibility: "MONITORED_BY_DEFAULT", riskClass: "ALLOW" },
  { pattern: "*/collect", visibility: "MONITORED_BY_DEFAULT", riskClass: "ALLOW" },
  { pattern: "*/ping", visibility: "LIKELY_MONITORED", riskClass: "SHADOW_OBSERVE" },
  // Domain variants — lower monitoring confidence
  { pattern: "m.youtube.com/*", visibility: "LIKELY_MONITORED", riskClass: "SHADOW_OBSERVE" },
  { pattern: "youtube-nocookie.com/*", visibility: "LIKELY_MONITORED", riskClass: "SHADOW_OBSERVE" },
  { pattern: "music.youtube.com/*", visibility: "UNLIKELY_MONITORED", riskClass: "BLOCK_ONLY_WITH_FIXTURE" }
];
function getTimelinePolicy(endpoint) {
  for (const entry of MONITORED_ENDPOINTS) {
    const pattern = entry.pattern.replace(/\./g, "\\.").replace(/\*/g, ".*").replace(/\//g, "\\/");
    if (new RegExp(pattern, "i").test(endpoint)) {
      return entry.visibility;
    }
  }
  return "UNKNOWN";
}
function getMonitoredEndpointEntry(endpoint) {
  for (const entry of MONITORED_ENDPOINTS) {
    const pattern = entry.pattern.replace(/\./g, "\\.").replace(/\*/g, ".*").replace(/\//g, "\\/");
    if (new RegExp(pattern, "i").test(endpoint)) {
      return entry;
    }
  }
  return null;
}
function isMonitored(endpoint) {
  const policy = getTimelinePolicy(endpoint);
  return policy === "MONITORED_BY_DEFAULT" || policy === "LIKELY_MONITORED";
}
function downgradeToUnlikely(endpoint, fixtureEvidence, shadowTelemetryClean) {
  if (!fixtureEvidence) return false;
  if (!shadowTelemetryClean) return false;
  return true;
}
function selectEndpointAction(riskClass, shapeConfidence, fixtureProven) {
  if (riskClass === "BLOCK_ONLY_WITH_FIXTURE" && fixtureProven) return "BLOCK";
  if (riskClass === "SURROGATE_WITH_VALIDATION" && shapeConfidence >= 85) return "SURROGATE";
  return "ALLOW";
}

// src/js/youtube/youtube-redirect-chain.ts
var KNOWN_REDIRECT_FIXTURES = [
  {
    initialUrlPattern: "*://*.doubleclick.net/*/ad*",
    observedRedirectStatusCodes: [302, 307],
    observedLocationHostPatterns: ["*.doubleclick.net", "*.google.com"],
    finalUrlPatterns: ["*://*.doubleclick.net/*"],
    resourceType: "script",
    initiatorDomain: "youtube.com",
    frameContext: "top_level",
    monitoredByDefault: true,
    sriObserved: false,
    corsPreflightObserved: false
  },
  {
    initialUrlPattern: "*://googleads.g.doubleclick.net/*",
    observedRedirectStatusCodes: [302],
    observedLocationHostPatterns: ["*.doubleclick.net"],
    finalUrlPatterns: ["*://*.doubleclick.net/*"],
    resourceType: "image",
    initiatorDomain: "youtube.com",
    frameContext: "top_level",
    monitoredByDefault: true,
    sriObserved: false,
    corsPreflightObserved: false
  }
];
function classifyRedirectChain(initialUrl, redirectChain, fixtures) {
  const finalUrl = redirectChain.length > 0 ? redirectChain[redirectChain.length - 1] : initialUrl;
  const chainStr = [initialUrl, ...redirectChain].join(" -> ");
  for (const fixture of fixtures) {
    const pattern = new RegExp(fixture.initialUrlPattern.replace(/\./g, "\\.").replace(/\*/g, ".*"));
    if (!pattern.test(initialUrl)) continue;
    const finalMatch = fixture.finalUrlPatterns.some((fp) => {
      const fpPattern = new RegExp(fp.replace(/\./g, "\\.").replace(/\*/g, ".*"));
      return fpPattern.test(finalUrl);
    });
    if (finalMatch) {
      if (fixture.monitoredByDefault) {
        return {
          initialUrl,
          redirectChain,
          finalUrl,
          known: true,
          action: "ALLOW",
          reason: "redirect_known_monitored"
        };
      }
      return {
        initialUrl,
        redirectChain,
        finalUrl,
        known: true,
        action: "SURROGATE",
        reason: "redirect_known_surrogate_eligible"
      };
    }
    return {
      initialUrl,
      redirectChain,
      finalUrl,
      known: false,
      action: "UNKNOWN_REDIRECT_FINAL",
      reason: "redirect_final_unknown"
    };
  }
  return {
    initialUrl,
    redirectChain,
    finalUrl,
    known: false,
    action: "ALLOW",
    reason: "redirect_no_fixture_allow"
  };
}
function recordRedirectChainResult(result, fixtures) {
  if (result.action !== "UNKNOWN_REDIRECT_FINAL") return fixtures;
  const newFixture = {
    initialUrlPattern: result.initialUrl.replace(/\/\d+/g, "/*"),
    observedRedirectStatusCodes: [302],
    observedLocationHostPatterns: [],
    finalUrlPatterns: [result.finalUrl.replace(/\/\d+/g, "/*")],
    resourceType: "unknown",
    initiatorDomain: "youtube.com",
    frameContext: "top_level",
    monitoredByDefault: true,
    sriObserved: false,
    corsPreflightObserved: false
  };
  return [...fixtures, newFixture];
}
function isRedirectSafeToBlock(chain, fixtures) {
  if (chain.length === 0) return true;
  const result = classifyRedirectChain(chain[0], chain.slice(1), fixtures);
  return result.known && (result.action === "SURROGATE" || result.action === "SAFE_BLOCK");
}
function shouldBroadenUrlPattern(pattern, fixtureCount) {
  if (fixtureCount < 3) return false;
  return false;
}

// src/js/youtube/youtube-cors-preflight.ts
var DEFAULT_CORS_POLICY = {
  optionsAllowByDefault: true,
  doNotRedirectOptions: true,
  requirePreflightParity: true,
  failOpenOnParityFailure: true
};
var KNOWN_API_FIXTURES = [
  {
    requestMethod: "POST",
    requestMode: "cors",
    credentialsMode: "include",
    originHeaderPresent: true,
    accessControlRequestMethod: "POST",
    accessControlRequestHeaders: "content-type,authorization",
    responseAccessControlAllowOrigin: "https://www.youtube.com",
    responseAccessControlAllowCredentials: true,
    responseAccessControlAllowHeaders: "content-type,authorization",
    responseAccessControlAllowMethods: "POST,OPTIONS",
    preflightCacheBehavior: "cache-3600"
  },
  {
    requestMethod: "GET",
    requestMode: "cors",
    credentialsMode: "include",
    originHeaderPresent: true,
    accessControlRequestMethod: null,
    accessControlRequestHeaders: null,
    responseAccessControlAllowOrigin: "https://www.youtube.com",
    responseAccessControlAllowCredentials: true,
    responseAccessControlAllowHeaders: null,
    responseAccessControlAllowMethods: "GET,OPTIONS",
    preflightCacheBehavior: "cache-3600"
  }
];
function isOptionsRequest(method) {
  return method.toUpperCase() === "OPTIONS";
}
function shouldAllowOptionsRequest(url, method, hasFixture) {
  if (!isOptionsRequest(method)) {
    return { allowed: true, reason: "not_options", surrogateEligible: true };
  }
  if (hasFixture) {
    return { allowed: true, reason: "options_with_fixture", surrogateEligible: true };
  }
  return {
    allowed: true,
    reason: "options_default_allow",
    surrogateEligible: false
  };
}
function evaluateSurrogateCorsParity(fixture, observed) {
  const mismatches = [];
  if (observed.responseAccessControlAllowOrigin !== void 0 && observed.responseAccessControlAllowOrigin !== fixture.responseAccessControlAllowOrigin) {
    mismatches.push("access-control-allow-origin");
  }
  if (observed.responseAccessControlAllowCredentials !== void 0 && observed.responseAccessControlAllowCredentials !== fixture.responseAccessControlAllowCredentials) {
    mismatches.push("access-control-allow-credentials");
  }
  if (observed.responseAccessControlAllowMethods !== void 0 && observed.responseAccessControlAllowMethods !== fixture.responseAccessControlAllowMethods) {
    mismatches.push("access-control-allow-methods");
  }
  return { parity: mismatches.length === 0, mismatches };
}
function shouldSuppressSurrogate(originalPreflightSucceeds, surrogateChangesCors) {
  if (!originalPreflightSucceeds) return true;
  if (surrogateChangesCors) return true;
  return false;
}
function selectCorsAction(isPreflight, hasFixture, preflightSucceeds, surrogateChangesCors) {
  if (isPreflight) return "ALLOW";
  if (!preflightSucceeds) return "ALLOW_WITH_SANITIZER";
  if (surrogateChangesCors) return "ALLOW_WITH_SANITIZER";
  if (hasFixture) return "SURROGATE_WITH_VALIDATION";
  return "ALLOW";
}
function getCorsActionForEndpoint(url, method, fixture) {
  if (isOptionsRequest(method)) {
    return shouldAllowOptionsRequest(url, method, fixture !== null);
  }
  if (!fixture) {
    return { allowed: true, reason: "no_fixture_allow", surrogateEligible: false };
  }
  return { allowed: true, reason: "fixture_match", surrogateEligible: true };
}

// src/js/mv3/youtube-engine.ts
var YouTubeEngine = class {
  constructor() {
    __publicField(this, "tracker", createTabTracker());
    __publicField(this, "sessionState", null);
    __publicField(this, "versionVector", null);
    __publicField(this, "healthMonitor", null);
    __publicField(this, "promptDetector", createPromptDetectorState());
    __publicField(this, "observerBudget", createObserverBudgetState());
    __publicField(this, "beaconPolicy", null);
    __publicField(this, "backoff", createBackoffState());
    __publicField(this, "diagnostics", createDiagnosticsState());
  }
  init(version) {
    this.versionVector = version;
    this.sessionState = createEmptySessionState(String(Date.now()));
  }
  async onStartup(criticalRuleIDs) {
    return runStartupRestoration({
      tracker: this.tracker,
      currentVersion: this.versionVector,
      persistedVersion: {},
      persistedState: this.sessionState,
      criticalRuleIDs,
      youtubeRuleIDRangeMin: 1e6,
      youtubeRuleIDRangeMax: 2e6,
      youtubeBudgetReserve: 5e3
    });
  }
  onTabNavigate(tabId, url) {
    this.tracker.upsertTab(tabId, url);
  }
  onTabRemove(tabId) {
    this.tracker.removeTab(tabId);
  }
  onTabActivate(tabId) {
    this.tracker.heartbeatTab(tabId);
  }
  onEmbedRegister(tabId, frameId, url, parentOriginKnown) {
    const pageType = classifyPageType(url);
    this.tracker.registerEmbed({
      tabId,
      frameId,
      url,
      parentOriginKnown,
      pageType,
      mainWorldAvailable: "unknown",
      firstSeenAt: Date.now(),
      lastHeartbeatAt: Date.now()
    });
  }
  getActiveYouTubeTabCount() {
    return this.tracker.getYouTubeTabs().length;
  }
  getGlobalPlanMode() {
    if (this.getActiveYouTubeTabCount() === 0) return "SAFE_CONSERVATIVE";
    return this.sessionState?.globalRulePlanMode ?? "SAFE_CONSERVATIVE";
  }
  initializeHealthMonitor(pageCategory) {
    this.healthMonitor = createHealthMonitorState(pageCategory);
  }
  recordHealthTick(signals) {
    if (!this.healthMonitor) return;
    const fullSignals = {
      videoElementExists: signals.videoElementExists ?? true,
      readyStateHealthy: signals.readyStateHealthy ?? true,
      currentTimeAdvances: signals.currentTimeAdvances ?? true,
      noPersistentSpinner: signals.noPersistentSpinner ?? true,
      noFatalError: signals.noFatalError ?? true,
      playerControlsUsable: signals.playerControlsUsable ?? true,
      commentsReachable: signals.commentsReachable ?? true,
      descriptionReachable: signals.descriptionReachable ?? true,
      mastheadSearchVisible: signals.mastheadSearchVisible ?? true,
      spaNavigationWorks: signals.spaNavigationWorks ?? true,
      antiBlockPromptAbsent: signals.antiBlockPromptAbsent ?? true
    };
    this.healthMonitor = recordHealthTick(this.healthMonitor, fullSignals, Date.now());
  }
  evaluatePrompt(input) {
    const result = scorePromptSignals({
      modalOverlayPresent: input.modalOverlayPresent ?? false,
      playerBlockedOrPaused: input.playerBlockedOrPaused ?? false,
      localizedTextMatch: input.localizedTextMatch ?? false,
      primaryActionButtonVisible: input.primaryActionButtonVisible ?? false,
      knownEnforcementShape: input.knownEnforcementShape ?? false,
      dialogRolePresent: input.dialogRolePresent ?? false,
      ariaModalPresent: input.ariaModalPresent ?? false,
      enforcementOverlayNearPlayer: input.enforcementOverlayNearPlayer ?? false
    });
    this.promptDetector = updatePromptDetectorState(this.promptDetector, result, Date.now());
    if (this.promptDetector.confidence === "CONFIRMED") {
      this.backoff = enterBackoff(this.backoff, true, Date.now());
    }
  }
  processObserverBatch(nodeCount) {
    const { result, newState } = processObserverBatch(this.observerBudget, nodeCount, Date.now());
    this.observerBudget = newState;
    if (result.events.includes("OBSERVER_OVERFLOW_BACKOFF")) {
      this.backoff = enterBackoff(this.backoff, false, Date.now());
    }
  }
  selectBeaconPolicy(pageType, riskLevel) {
    this.beaconPolicy = selectBeaconPolicy(pageType, riskLevel, this.promptDetector.confidence !== "NONE");
  }
  advanceBackoffIfNeeded() {
    const { newState } = advanceIsolation(
      this.backoff,
      this.healthMonitor?.currentHealth === "HEALTHY",
      Date.now()
    );
    this.backoff = newState;
  }
  async applyRulePlan(tabIds) {
    if (!this.sessionState) return { kind: "ERROR", message: "Engine not initialized" };
    const criticalIds = buildCriticalAllowRules().map((r) => r.id);
    const aggregatorInput = {
      tabStates: this.tracker.getYouTubeTabs(),
      registeredEmbeds: this.tracker.getEmbeds(),
      criticalRuleIDs: criticalIds,
      safeBlockRuleIDs: [],
      surrogateRuleIDs: [],
      beaconRuleIDs: [],
      shadowRuleIDs: [],
      riskByTab: /* @__PURE__ */ new Map(),
      riskByEmbed: /* @__PURE__ */ new Map(),
      hasMainWorldCapability: false,
      readinessProbePassed: false,
      localCompleteAllowed: false,
      healthState: this.healthMonitor?.currentHealth ?? "HEALTHY",
      promptScore: this.promptDetector.score ?? 0
    };
    const plan = aggregateDnrRulePlan(aggregatorInput);
    const result = await applyPlanWithFailureHandling({
      plan,
      sessionState: this.sessionState,
      tabIds
    });
    if (result.kind === "PANIC") {
      this.sessionState.panicSessionActive = true;
      this.sessionState.panicReason = result.panicState.panicReason;
      this.sessionState.panicTabIds = result.panicState.panicTabIds;
      this.sessionState.globalRulePlanMode = "PANIC";
      this.sessionState.lastRulePlanHash = plan.planHash;
    } else if (result.kind === "SUCCESS") {
      this.sessionState.lastRulePlanHash = plan.planHash;
      this.sessionState.installedYouTubeRuleIDs = plan.criticalAllowRuleIDs;
      this.sessionState.criticalRuleInstallVerified = true;
    }
    return result;
  }
};
export {
  ADAPTIVE_BUDGET_TIERS,
  ALLOCATION_PRIORITY_ORDER,
  BOOTSTRAP_VERSION,
  DEFAULT_BEACON_POLICY,
  DEFAULT_CORS_POLICY,
  DEFAULT_FAILURE_POLICY,
  DEFAULT_HARD_THROTTLE_MS,
  DEFAULT_LOCAL_COMPLETE_CONFIG,
  DEFAULT_MAX_NODES_PER_BATCH,
  DEFAULT_ROLLBACK_ORDER,
  DEFAULT_TRAVERSAL_CONFIG,
  ENGINE_UPDATE_RESET,
  ENGINE_UPDATE_RESET_ACK,
  FORBIDDEN_SELECTORS,
  KNOWN_API_FIXTURES,
  KNOWN_REDIRECT_FIXTURES,
  MONITORED_ENDPOINTS,
  OVERFLOW_BACKOFF_LIMIT,
  PROMPT_CONFIRMED_THRESHOLD,
  PROMPT_IMMEDIATE_DISABLE,
  PROMPT_SCORE_WEIGHTS,
  PROMPT_SUSPECTED_THRESHOLD,
  READINESS_EVENT,
  READINESS_GRACE_WINDOW_MS,
  RISK_CLASS_PRIORITY,
  SAFE_BLOCK_ENDPOINTS,
  SCHEMA_VERSION,
  SESSION_STATE_KEY,
  SURROGATE_REDIRECT_REGISTRY,
  SURROGATE_TIMING_REQUIREMENTS,
  TRANSIENT_UI_ELEMENTS,
  CRITICAL_ENDPOINTS as YOUTUBE_CRITICAL_ENDPOINTS,
  ENDPOINT_OWNERSHIP as YOUTUBE_OWNED_ENDPOINTS,
  YOUTUBE_PRIORITY,
  DEFAULT_BUDGET as YOUTUBE_RULE_BUDGET,
  YOUTUBE_SETTING_DEFAULTS,
  YOUTUBE_SETTING_KEYS,
  YouTubeEngine,
  advanceIsolation,
  aggregateDnrRulePlan,
  allocateBudget,
  anyCosmeticDisabled,
  applyPlanWithFailureHandling,
  buildCriticalAllowRules,
  canObserveShadowRoot,
  canPromoteDomain,
  canPromoteToBalanced,
  capUserOrImportedRulePriority,
  captureAccessor,
  captureFunctionWrapper,
  categorizeRuleBySourceAndPriority,
  checkExtensionUpdate,
  classifyDomainVariant,
  classifyEndpoint,
  classifyPageType,
  classifyPageTypeCategory,
  classifyPerformanceTimingRisk,
  classifyPromptConfidence,
  classifyRedirectChain,
  classifySafeBlockEndpoint,
  clearCachedProbe,
  collectHookRaceTelemetry,
  compileRulesFromPlan,
  computeConservativeState,
  computeContextualRiskSummary,
  computeGlobalPlanMode,
  computeHealthState,
  computeRiskClassEnabled,
  computeShapeConfidence,
  computeTickInterval,
  confidenceToMode,
  containsAdRenderer,
  createABVariationState,
  createBackoffState,
  createDiagnosticsState,
  createEmptySessionState,
  createFrameContext,
  createHealthMonitorState,
  createHealthTransitionEvent,
  createObserverBudgetState,
  createPromptDetectorState,
  createPromptTransitionEvent,
  createReconnectResponse,
  createRiskTransitionEvent,
  createRuleInstallEvent,
  createSanitizerDecisionEvent,
  createSettingDefaultsPayload,
  createShortsCleanupConfig,
  createTabTracker,
  createTieredFailureState,
  createWrapperManager,
  detectABVariation,
  detectConflictingPriorities,
  detectExperimentSignals,
  detectInterstitial,
  disableLocalCompleteOnPrompt,
  disconnectAllObservers,
  disconnectShadowRoot,
  domainAllowsCosmeticCleanup,
  domainAllowsMainWorld,
  domainAllowsSanitizer,
  downgradeToUnlikely,
  earlyAccessorAllowed,
  enableFeedObservation,
  enterBackoff,
  estimateStorageSize,
  evaluateCleanObservation,
  evaluateFetchInterception,
  evaluateRetroactiveSanitization,
  evaluateSurrogateCorsParity,
  evaluateSurrogateTiming,
  evictCriticalOnly,
  generateNonce,
  getAdConfigKeys,
  getAdHeaders,
  getAdRendererPatterns,
  getApiOrigins,
  getBaseInterval,
  getCorsActionForEndpoint,
  getDefaultKnownExperiments,
  getDisabledClasses,
  getDomainPolicy,
  getEndpointOwner,
  getEventsByCategory,
  getEventsSince,
  getGuardedEndpoints,
  getInstalledYouTubeRules,
  getLatestEvents,
  getLocalCompleteBudgetExtension,
  getMaxDepth,
  getMaxDepthForPath,
  getMonitoredEndpointEntry,
  getPerformanceTimingRisk,
  getPlayerAdFieldNames,
  getPlayerProtectedFieldNames,
  getRuleAuthority,
  getSurrogateForEndpoint,
  getSurrogatePaths,
  getSurrogateTimingRequirement,
  getTimelinePolicy,
  getTimelineVisibilityFromRisk,
  handleBFCacheRestore,
  handleConfigGet,
  handleConfigSet,
  handleConfigUpdate,
  handleLocalCompleteSurrogateDrift,
  handlePartialFailure,
  hasActiveObservers,
  hasFixturesForSafeBlock,
  healthToRisk,
  healthTriggersBackoff,
  healthTriggersRollback,
  initializeNavigation,
  installCriticalRulesOnly,
  installRulePlan,
  isAdConfigKey,
  isAdConfigValue,
  isDiagnosticStorageAvailable,
  isDomainSupported,
  isEndpointMonitoredByDefault,
  isForbiddenSelector,
  isGuardedUrl,
  isHealthNormal,
  isLocalCompleteAllowed,
  isLowRiskBeacon,
  isModuleDisabled,
  isMonitored,
  isOptionsRequest,
  isPassiveDomShadowEligible,
  isPixelEndpoint,
  isPlayerAdField,
  isPlayerProtectedField,
  isRedirectSafeToBlock,
  isSPAEvent,
  isSafeBlockEndpoint,
  isSurrogateEligible,
  isYouTubeHost,
  mainWorldActiveAllowed,
  maxRiskLevel,
  maybePrune,
  mergeRegistration,
  observeShadowRoot,
  onBFCacheRestore,
  onFullDocumentStart,
  onYouTubeNavigationFinish,
  parseVariationFromSignals,
  processObserverBatch,
  pruneByAge,
  pruneByCategory,
  pruneTabSnapshots,
  readYouTubeSettings,
  readYouTubeSettingsFromStorage,
  readinessToShadowMode,
  rebuildPageContext,
  recomputeRiskLevel,
  reconcileRules,
  recordEvent,
  recordHealthTick,
  recordRedirectChainResult,
  registerThirdPartyInitiator,
  removeAllYouTubeRules,
  resolveBackoff,
  resolveOwnerConflict,
  riskAllows,
  riskLevelAtLeast,
  runCapabilityProbe,
  runStartupRestoration,
  sanitizeAllResponseHeaders,
  sanitizeData,
  sanitizePlayerResponse,
  sanitizePlayerResponseIdempotent,
  sanitizeResponseHeader,
  scanForExtensionOriginScripts,
  scorePromptSignals,
  selectActiveModules,
  selectBeaconMode,
  selectBeaconPolicy,
  selectCorsAction,
  selectEndpointAction,
  selectRestorationPath,
  selectRollbackOrder,
  selectRuleActionForEndpoint,
  selectSafeDefault,
  selectShadowMode,
  selectTimelineAction,
  shouldAllowOptionsRequest,
  shouldBroadenUrlPattern,
  shouldCleanTransientUI,
  shouldPruneStorage,
  shouldSkipTraversal,
  shouldSuppressSurrogate,
  shouldWriteImmediately,
  simulateUserRuleInterference,
  summarizeEvents,
  surrogateExtensionOriginAcceptable,
  updateABVariationState,
  updatePromptDetectorState,
  updateShortsCleanupConfig,
  validateReadinessEvent,
  validateSelector,
  validateSessionState,
  verifyCriticalRulesInstalled,
  visibilityPause,
  waitForReadiness
};
