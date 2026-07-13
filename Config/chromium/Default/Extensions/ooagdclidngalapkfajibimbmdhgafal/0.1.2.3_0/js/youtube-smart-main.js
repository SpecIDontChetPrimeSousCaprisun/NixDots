// GENERATED FILE. Do not edit directly.
// Source: src/js/contentscript/youtube-smart-main.ts
// Build command: npm run build
(() => {
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

  // src/js/youtube/youtube-readiness-probe.ts
  var READINESS_GRACE_WINDOW_MS = 250;
  var READINESS_EVENT = "uBRYouTubeMainReady";
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

  // src/js/contentscript/youtube-smart-main.ts
  var BOOTSTRAP_CHANNEL = "youtube-smart-main";
  var NONCE_KEY = "ys_nonce";
  function getOrCreateNonce() {
    const existing = sessionStorage.getItem(NONCE_KEY);
    if (existing) return existing;
    const nonce = generateNonce();
    sessionStorage.setItem(NONCE_KEY, nonce);
    return nonce;
  }
  async function bootstrapMainWorld() {
    const nonce = getOrCreateNonce();
    const diag = createDiagnosticsState();
    recordEvent(diag, "bootstrap", "main-world bootstrap start");
    const capabilityResult = runCapabilityProbe();
    recordEvent(diag, "capability", `capability probe: ${JSON.stringify(capabilityResult)}`);
    const readinessResult = waitForReadiness(nonce, "", "1.0.0", 5e3);
    recordEvent(diag, "readiness", `readiness result: ${readinessResult}`);
    const wrapperManager = createWrapperManager();
    const captureResult = captureAccessor(wrapperManager, window, "fetch", "main-world bootstrap", "DOCUMENT_WRITE_WRAPPER");
    recordEvent(diag, "wrapper", `fetch capture: ${captureResult ? "captured" : "skipped"}`);
    const hookTelemetry = collectHookRaceTelemetry({
      mainWorldAvailable: !!capabilityResult,
      contentScriptStartTime: Date.now(),
      mainWorldProbeTime: Date.now(),
      pageType: "WATCH",
      frameContext: "top"
    });
    recordEvent(diag, "hook-race", `hook race telemetry: ${JSON.stringify(hookTelemetry)}`);
    const bc = new BroadcastChannel(BOOTSTRAP_CHANNEL);
    bc.postMessage({
      type: "main-world-ready",
      nonce,
      capability: capabilityResult,
      readiness: readinessResult,
      wrapperCount: wrapperManager.getActiveCount(),
      hookRace: hookTelemetry,
      diagnostics: diag.events.length
    });
    navigator.serviceWorker?.controller?.postMessage({
      type: "youtube-smart-ready",
      nonce,
      source: "main-world"
    });
  }
  if (document.readyState === "complete" || document.readyState === "interactive") {
    void bootstrapMainWorld();
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      void bootstrapMainWorld();
    });
  }
})();
