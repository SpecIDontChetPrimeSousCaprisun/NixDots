// GENERATED FILE. Do not edit directly.
// Source: src/js/contentscript/youtube-smart-isolated.ts
// Build command: npm run build
(() => {
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

  // src/js/youtube/youtube-observer-budget.ts
  var DEFAULT_OBSERVER_CONFIGS = [
    { rootType: "PLAYER_SUBTREE", active: true, subtree: true, maxNodesPerBatch: 200, throttleMs: 200, rootDepthLimit: 3 },
    { rootType: "FEED_GRID", active: false, subtree: true, maxNodesPerBatch: 200, throttleMs: 200, rootDepthLimit: 2 },
    { rootType: "DOCUMENT_BODY", active: false, subtree: true, maxNodesPerBatch: 200, throttleMs: 500, rootDepthLimit: 1 }
  ];
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

  // src/js/contentscript/youtube-smart-isolated.ts
  var BOOTSTRAP_CHANNEL = "youtube-smart-isolated";
  var HEALTH_INTERVAL_MS = 3e4;
  var healthMonitor = createHealthMonitorState("WATCH");
  var observerBudget = createObserverBudgetState();
  var backoff = createBackoffState();
  var diag = createDiagnosticsState();
  recordEvent(diag, "bootstrap", "isolated-world bootstrap start");
  async function connectToServiceWorker() {
    try {
      const response = await chrome.runtime.sendMessage({ what: "youtubeSmartPing", source: "isolated-world" });
      recordEvent(diag, "connect", `SW response: ${JSON.stringify(response)}`);
      return;
    } catch (e) {
      console.warn("[uBR] youtube-smart-isolated: connectToServiceWorker failed", e);
      recordEvent(diag, "connect", "SW not reachable, retrying");
      setTimeout(() => {
        void connectToServiceWorker();
      }, 1e3);
    }
  }
  function collectHealthSignals() {
    const video = document.querySelector("video");
    const player = document.querySelector("#movie_player, ytd-player, #player-container");
    const comments = document.querySelector("#comments, ytd-comments");
    const description = document.querySelector("#description, ytd-video-secondary-info-renderer");
    const mastheadSearch = document.querySelector("#masthead input, ytd-searchbox");
    const antiBlock = document.querySelector("ytd-enforcement-message-view-model, tp-yt-paper-dialog");
    return {
      videoElementExists: !!video,
      readyStateHealthy: video ? video.readyState >= 2 : true,
      currentTimeAdvances: true,
      noPersistentSpinner: player ? !player.querySelector('[aria-label="Loading"]') : true,
      noFatalError: !document.querySelector("#error-screen, yt-error-screen"),
      playerControlsUsable: player ? !!player.querySelector(".ytp-chrome-controls") : true,
      commentsReachable: !!comments,
      descriptionReachable: !!description,
      mastheadSearchVisible: !!mastheadSearch,
      spaNavigationWorks: true,
      antiBlockPromptAbsent: !antiBlock
    };
  }
  function runHealthCheck() {
    const signals = collectHealthSignals();
    healthMonitor = recordHealthTick(healthMonitor, signals, Date.now());
    const healthOk = healthMonitor.currentHealth === "HEALTHY" || healthMonitor.currentHealth === "DEGRADED";
    const { newState } = advanceIsolation(backoff, healthOk, Date.now());
    backoff = newState;
    const bc = new BroadcastChannel(BOOTSTRAP_CHANNEL);
    bc.postMessage({
      type: "health-tick",
      health: healthMonitor.currentHealth,
      backoffActive: backoff.isolationStep > 0,
      timestamp: Date.now()
    });
  }
  function startHealthMonitoring() {
    runHealthCheck();
    setInterval(runHealthCheck, HEALTH_INTERVAL_MS);
  }
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.what === "youtubeRollbackRequest") {
      const classesToDisable = message.classes ?? [];
      if (classesToDisable.includes("backoff")) {
        backoff = enterBackoff(backoff, true, Date.now());
      }
      sendResponse({ ok: true, backoffLevel: backoff.isolationStep });
      return true;
    }
    if (message.what === "youtubeHealthQuery") {
      sendResponse({
        health: healthMonitor.currentHealth,
        backoffLevel: backoff.isolationStep,
        observerOverflow: observerBudget.overflowCount
      });
      return true;
    }
    if (message.what === "youtubeDiagnosticsQuery") {
      sendResponse({ eventCount: diag.events.length });
      return true;
    }
    return false;
  });
  void connectToServiceWorker().then(() => {
    startHealthMonitoring();
  });
})();
