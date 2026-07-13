/* CANONICAL SERVICE WORKER — Manifest-selected active runtime.
 *
 * This file is the canonical service worker loaded by
 * platform/chromium/manifest.json (background.service_worker).
 *
 * Source of truth: this file (manually maintained).
 * Migration candidate: src/js/mv3/sw-entry.ts (TypeScript prototype).
 * DO NOT replace sw.js with generated bundles; the manifest points here.
 *
 * Generated validation output: platform/chromium/js/sw-entry-bundle.js
 * (from src/js/mv3/sw-entry.ts via build.mjs — NOT loaded by manifest).
 */

import {
    STEALTH_MODE_SETTING,
    createStealthSurrogateRules,
    isStealthSurrogateRuleId,
} from "./stealth-surrogates.js";

import { YouTubeEngine, isYouTubeHost, classifyPageType } from "./youtube-engine.js";
const ytEngine = new YouTubeEngine();

import { smartEngine, smartRuleStore, exportAllRules, parseSmartRules } from "./smart-engine.js";

import { resolvePagePolicy, loadPolicyProfiles, extractHostname, domainFromHostname, explainPolicy, classifySelectorRisk } from "./policy-resolver.js";

import { PolicySnapshot } from "./policy-snapshot.js";
import { OperationToken } from "./operation-token.js";
import { DnrDecisionStore } from "./dnr-decision-store.js";
import { QuotaManager } from "./quota-manager.js";
import { CssInjectionRegistry } from "./css-injection-registry.js";
import { MessageContracts } from "./message-contracts.js";
import { AllowRuleAuthority } from "./allow-rule-authority.js";
import { MainWorldBridgePolicy } from "./main-world-bridge-policy.js";
import { HydrationGate } from "./startup-hydration-gate.js";
import { snapshotDnrRules, restoreDnrSnapshot, updateDnrTransaction } from "./dnr-transaction.js";
import { idAuthority } from "./id-authority.js";
import { timeAuthority } from "./time-authority.js";
import { classifyFirstKnownProfile } from "./page-signal-classifier.js";

// Suppress "No tab with id" errors — harmless race when tab closes mid-async
self.onunhandledrejection = (event) => {
    if (event.reason?.message?.includes("No tab with id")) {
        event.preventDefault();
    }
};

/* uBlock Resurrected MV3 SW — logger + content script bridge + popup panel */

// On-demand blocking state: persisted hostname index loaded lazily via webRequest
let cachedHostnameBlockSet = null;             // Set<string> loaded from storage
let installedSessionHostnames = new Set();     // hostnames already active as session rules
const sessionRuleFifo = [];                    // rule IDs in installation order (for eviction)
const SESSION_RULE_LIMIT = 5000;
const DYNAMIC_RULE_LIMIT = 5000;
let sessionRuleIdCounter = 88000000;           // starts below stealth range

const STORAGE_KEY_HOSTNAME_BLOCK = "hostnameBlockSet";
const STORAGE_KEY_HOSTNAME_BLOCK_TS = "hostnameBlockSetTimestamp";

async function loadCachedHostnameIndex() {
  try {
    const stored = await chrome.storage.local.get(STORAGE_KEY_HOSTNAME_BLOCK);
    const arr = stored[STORAGE_KEY_HOSTNAME_BLOCK];
    if (Array.isArray(arr) && arr.length > 0) {
      cachedHostnameBlockSet = new Set(arr);
      return true;
    }
  } catch (_) { /* ignore */ }
  return false;
}

const STORAGE_KEY_DNR_SCHEMA_VERSION = "ubrDnrSchemaVersion";
const CURRENT_DNR_SCHEMA_VERSION = 2;

async function clearDnrStateForSchemaUpgrade() {
    const stored = await chrome.storage.local.get(STORAGE_KEY_DNR_SCHEMA_VERSION);
    if (stored[STORAGE_KEY_DNR_SCHEMA_VERSION] === CURRENT_DNR_SCHEMA_VERSION) {
        return;
    }
    console.log("[uBR] DNR schema upgrade detected — clearing old DNR state");
    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: (await chrome.declarativeNetRequest.getDynamicRules()).map(r => r.id),
        addRules: [],
    });
    await chrome.declarativeNetRequest.updateSessionRules({
        removeRuleIds: (await chrome.declarativeNetRequest.getSessionRules()).map(r => r.id),
        addRules: [],
    });
    await chrome.storage.local.remove([
        STORAGE_KEY_HOSTNAME_BLOCK,
        STORAGE_KEY_HOSTNAME_BLOCK_TS,
        STORAGE_KEY_COMPILED_COUNTS,
        "cosmeticFiltersData",
    ]);
    cachedHostnameBlockSet = null;
    installedSessionHostnames.clear();
    sessionRuleFifo.length = 0;
    await chrome.storage.local.set({
        [STORAGE_KEY_DNR_SCHEMA_VERSION]: CURRENT_DNR_SCHEMA_VERSION,
    });
}

async function restoreSessionState() {
  try {
    const rules = await chrome.declarativeNetRequest.getSessionRules();
    for (const rule of rules) {
      if (rule.id >= 88000000 && rule.id < 90000000) {
        const m = rule.condition?.urlFilter?.match(/^\|\|([^/^]+)\^/);
        if (m) { installedSessionHostnames.add(m[1]); sessionRuleFifo.push(rule.id); }
      }
    }
    if (installedSessionHostnames.size > 0) {
      console.log(`[uBR] Restored ${installedSessionHostnames.size} session rules from previous session`);
    }
  } catch (_) { /* ignore */ }
}

async function ensureFilterRules() {
  if (cachedHostnameBlockSet) {
    const dyn = await chrome.declarativeNetRequest.getDynamicRules();
    if (dyn.length > 0) {
      await restoreSessionState();
      console.log(`[uBR] Using cached index with ${cachedHostnameBlockSet.size} hostnames + ${dyn.length} dynamic rules`);
      dnrSyncCompleted = true;
      runtimeHealth.dnrStaticRulesReady = true;
      runtimeHealth.filterListsReady = true;
      return dyn.length;
    }
  }
  if (syncInProgress) return 0;
  return await syncFilterListDnrRules();
}

const LOGGER_BUFFER_MAX = 5000;
const LOGGER_OBSOLETE_AFTER = 30000;

// Runtime health — tracks subsystem readiness for diagnostics
const runtimeHealth = {
  dnrStaticRulesReady: false,
  dnrDynamicRulesReady: false,
  filterListsReady: false,
  cosmeticsReady: false,
  scriptletsReady: false,
  lastError: '',
  degradedMode: false,
  degradedModeReason: '',
  degradedModeTimestamp: 0,
  managedPolicyApplied: false,
  idleState: 'active',
  filterListVersions: {},
  filterListsOutdated: [],
  adaptiveMode: false,
};

// Logger singleton — owner-tracked buffer with lifecycle
const loggerBackend = {
  enabled: false,
  ownerId: undefined,
  buffer: [],
  writePtr: 0,
  lastReadTime: 0,
  _janitorTimer: null,

  writeOne(details) {
      if (this.buffer === null) return;
      details.tstamp = Date.now() / 1000;
      const box = JSON.stringify(details);
      if (this.writePtr !== 0 && box === this.buffer[this.writePtr - 1]) return;
      if (this.writePtr === this.buffer.length) {
      this.buffer.push(box);
      } else {
          this.buffer[this.writePtr] = box;
      }
      this.writePtr += 1;
  },

  readAll(ownerId) {
      if (this.ownerId !== undefined && this.ownerId !== ownerId) {
          return { unavailable: true };
      }
      this.ownerId = ownerId;
      if (this.buffer === null) {
          this.enabled = true;
          this.buffer = [];
          this.writePtr = 0;
      this._startJanitor();
      try { new BroadcastChannel("uBR").postMessage({ what: "loggerEnabled" }); } catch (e) { console.warn("[uBR] BroadcastChannel loggerEnabled:", e); }
      }
      const out = this.buffer.slice(0, this.writePtr);
    this.buffer.fill("", 0, this.writePtr);
    this.writePtr = 0;
    this.lastReadTime = Date.now();
    this._startJanitor();
    return out;
  },

  release(ownerId) {
      if (this.ownerId !== ownerId) return;
      this.ownerId = undefined;
    inMemoryFilters.clear();
  },

  _startJanitor() {
      if (this._janitorTimer) clearTimeout(this._janitorTimer);
      this._janitorTimer = setTimeout(() => {
          if (this.buffer === null) return;
          if (this.lastReadTime >= Date.now() - LOGGER_OBSOLETE_AFTER) {
        this._startJanitor();
        return;
          }
          this.enabled = false;
          this.buffer = null;
          this.writePtr = 0;
          this.ownerId = undefined;
      inMemoryFilters.clear();
      try { new BroadcastChannel("uBR").postMessage({ what: "loggerDisabled" }); } catch (e) { console.warn("[uBR] BroadcastChannel loggerDisabled:", e); }
      }, LOGGER_OBSOLETE_AFTER);
  },
};

// Temporary logger exception filters — cleared on releaseView / loggerDisabled
const inMemoryFilters = new Set();

// Storage quota manager (Item 193)
const storageQuota = {
    maxFilterListCacheSize: 5 * 1024 * 1024, // 5MB
    maxDiagnosticsEntries: 100,
    maxCompatHistoryEntries: 200,
    maxRecorderEntries: 50,
    maxRuntimeHealthEntries: 20,
    
    estimateSize(obj) {
        try {
            const str = JSON.stringify(obj);
            return new Blob([str]).size;
        } catch (e) {
            return 0;
        }
    },
    
    async enforceQuota() {
        const keys = ['compatibilityHistory', 'localRecorderOutput', 'diagnosticReports', 'filterListCache'];
        for (const key of keys) {
            const stored = await chrome.storage.local.get(key);
            if (!stored[key]) continue;
            const data = stored[key];
            const size = this.estimateSize(data);
            const limit = key === 'filterListCache' ? this.maxFilterListCacheSize :
                          key === 'compatibilityHistory' ? 1024 * 1024 :
                          key === 'localRecorderOutput' ? 512 * 1024 : 256 * 1024;
            if (size > limit) {
                console.warn(`[uBR] Storage quota exceeded for "${key}": ${size} > ${limit}, truncating`);
                if (Array.isArray(data)) {
                    const trimmed = data.slice(-Math.floor(data.length / 2));
                    await chrome.storage.local.set({ [key]: trimmed });
                }
            }
        }
    }
};

// Feature expiry tracking (Item 340)
const featureExpiryGates = {
    experimentalInterceptors: { enabled: false, expiresAt: 0 },
    antiAdblockCountermeasures: { enabled: false, expiresAt: 0 },
    smartCosmetics: { enabled: false, expiresAt: 0 },
    genericVideoMutation: { enabled: false, expiresAt: 0 },
    firstPartyDomDetection: { enabled: false, expiresAt: 0 },
    
    setExpiry(feature, days = 90) {
        if (this[feature]) {
            this[feature].enabled = true;
            this[feature].expiresAt = Date.now() + days * 24 * 60 * 60 * 1000;
        }
    },
    
    isExpired(feature) {
        const gate = this[feature];
        if (!gate || !gate.enabled) return true;
        if (gate.expiresAt > 0 && Date.now() > gate.expiresAt) {
            gate.enabled = false;
            console.warn(`[uBR] Feature "${feature}" has expired`);
            return true;
        }
        return false;
    }
};

// Inline scriptlet cache for minified scriptlet delivery (Item 146)
const scriptletCache = new Map(); // scriptletName → { script, version }

// URL filtering rules — session (temporary) + permanent (persisted)
const sessionURLFilteringRules = new Map(); // `${context} ${url} ${type}` → action
let permanentURLFilteringRules = {}; // loaded from chrome.storage.local
const STORAGE_KEY_URL_FILTERING = "ubrURLFilteringRules";

// Filter reverse index — lazily loaded from DNR source-map artifacts + assets.json
const filterReverseIndex = new Map(); // rawFilter → [{ assetKey, title, supportURL, sourceList, sourceLine }]
const dnrRuleReverseIndex = new Map(); // ruleId → { rawFilter, assetKey, title, supportURL, sourceList, rulesetId }
let filterReverseIndexReady; // promise, set once during first lazy load

async function ensureFilterReverseIndex() {
    if (filterReverseIndexReady) return filterReverseIndexReady;
    filterReverseIndexReady = (async () => {
    // Build sourceList → asset metadata lookup from assets.json
        let assets;
        try {
            assets = await fetch(chrome.runtime.getURL("assets/assets.json")).then(r => r.json());
        } catch (err) {
            console.warn("[uBR] Failed to fetch assets.json:", err);
        }
        const listByContentURL = new Map();
        if (assets) {
            for (const [assetKey, meta] of Object.entries(assets)) {
                const urls = Array.isArray(meta.contentURL) ? meta.contentURL : [meta.contentURL];
                for (const url of urls.filter(Boolean)) {
          listByContentURL.set(url, { assetKey, title: meta.title, supportURL: meta.supportURL });
                }
            }
        }
        // Load source-map artifacts and populate both indexes
        const sourceMapPaths = ["dnr/core-mini.source-map.json"];
        for (const path of sourceMapPaths) {
            let sm;
            try {
                sm = await fetch(chrome.runtime.getURL(path)).then(r => r.json());
            } catch (err) {
                console.warn("[uBR] Failed to fetch source-map:", path, err);
            }
            if (!sm?.entries) continue;
            for (const entry of sm.entries) {
                const rawFilter = entry.originalFilter;
                if (!rawFilter) continue;
                const meta = listByContentURL.get(entry.sourceList) || {};
                const item = {
          assetKey: meta.assetKey || entry.rulesetId || entry.sourceList,
          title: meta.title || entry.rulesetId || entry.sourceList,
          supportURL: meta.supportURL || "",
          sourceList: entry.sourceList,
          sourceLine: entry.sourceLine,
          rulesetId: entry.rulesetId,
          ruleId: entry.ruleId,
                };
                // Populate raw-filter index
                const existing = filterReverseIndex.get(rawFilter);
                if (existing) existing.push(item);
                else filterReverseIndex.set(rawFilter, [item]);
                // Populate rule-id index
                if (entry.ruleId != null) {
          dnrRuleReverseIndex.set(entry.ruleId, {
            rawFilter,
            assetKey: item.assetKey,
            title: item.title,
            supportURL: item.supportURL,
            sourceList: entry.sourceList,
            rulesetId: entry.rulesetId,
          });
                }
            }
        }
    })();
    return filterReverseIndexReady;
}

function lookupFilterLists(rawFilter) {
    const entries = filterReverseIndex.get(rawFilter);
    if (!entries || entries.length === 0) return {};
    return { [rawFilter]: entries };
}

function lookupFilterByRuleId(ruleId) {
    return dnrRuleReverseIndex.get(ruleId) || null;
}


// Request stats tracking (popup counters)
const reqStats = {
  byTab: new Map(), // tabId → { allowed: { any, script, frame } }
  globalAllowed: { any: 0 },
};
const hostnameStats = new Map(); // hostname → { domain, allowed: { any, script, frame }, blocked: { any, script, frame } }

function categorizeRequestType(type) {
    if (type === "script") return "script";
    if (type === "sub_frame" || type === "main_frame") return "frame";
    return "other";
}

let cachedGlobalMatchCount = 0;
let cachedTabMatchCounts = new Map(); // tabId → count
let lastMatchRefresh = 0;
const MATCH_REFRESH_INTERVAL = 5000;

async function refreshMatchCounts() {
    const now = Date.now();
    if (now - lastMatchRefresh < MATCH_REFRESH_INTERVAL) return;
    lastMatchRefresh = now;
    try {
        const result = await chrome.declarativeNetRequest.getMatchedRules();
        const infos = result?.rulesMatchedInfo || result?.rules || [];
        cachedGlobalMatchCount = infos.length;
        const tabCounts = new Map();
        for (const info of infos) {
            const tid = info.tabId;
      tabCounts.set(tid, (tabCounts.get(tid) || 0) + 1);
        }
        cachedTabMatchCounts = tabCounts;
    } catch (err) {
        console.warn("[uBR] refreshMatchCounts failed:", err);
    }
}

async function getDNRMatchedCount(tabId) {
    await refreshMatchCounts();
    if (typeof tabId === "number" && tabId > 0) {
        return cachedTabMatchCounts.get(tabId) || 0;
    }
    return cachedGlobalMatchCount;
}

// Shared domain/URL utils — delegates to policy-resolver.js implementations
// (Item 281-283: centralize URL/hostname normalization)
function hostnameFromURL(url) {
    return extractHostname(url);
}

function isExtensionURL(url) {
    return String(url || "").startsWith(chrome.runtime.getURL(""));
}

const YOUTUBE_UI_PROTECTED_IDS = [
  "container",
  "center",
  "start",
  "end",
  "guide-button",
  "logo",
  "search-button-narrow",
  "voice-search-button",
];

function youtubeScopeApplies(scope) {
    if (scope === "") return true;
    const includes = [];
    const excludes = [];
    for (const rawToken of scope.split(",")) {
        const token = rawToken.trim().toLowerCase();
        if (token === "") continue;
        if (token.startsWith("~")) excludes.push(token.slice(1));
        else includes.push(token);
    }
    const isYoutubeScope = token =>
        token === "*" ||
    token === "youtube.com" ||
    token === "www.youtube.com" ||
    token === "m.youtube.com" ||
    token === "youtu.be" ||
    token === "*.youtube.com" ||
    token.endsWith(".youtube.com");
    if (excludes.some(isYoutubeScope)) return false;
    return includes.length === 0 || includes.some(isYoutubeScope);
}

function selectorTargetsYouTubeMasthead(selector) {
    const normalized = String(selector || "").toLowerCase();
    const compact = normalized.replace(/\s+/g, "");
    if (
    normalized.includes("ytd-masthead") ||
    normalized.includes("ytd-topbar") ||
    normalized.includes("yt-searchbox")
    ) {
        return true;
    }
    if (
        compact === ".style-scope" ||
    compact === "*.style-scope" ||
    compact === "div.style-scope" ||
    /\[class[*~|^$]?=(["'])?style-scope\1?\]/.test(compact)
    ) {
        return true;
    }
    const idGroup = YOUTUBE_UI_PROTECTED_IDS.join("|");
    return new RegExp(`(^|[^\\w-])#(?:${idGroup})(?:$|[^\\w-])`).test(normalized) ||
    new RegExp(`\\[id\\s*=\\s*["']?(?:${idGroup})["']?\\]`).test(normalized);
}

function cosmeticCacheEntrySelector(entry) {
    if (typeof entry === "string") return entry;
    if (Array.isArray(entry)) return typeof entry[0] === "string" ? entry[0] : "";
    if (entry && typeof entry === "object" && typeof entry.selector === "string") return entry.selector;
    return "";
}

function cosmeticCacheEntryScopes(entry, key) {
    const details = Array.isArray(entry) ? entry[1] : entry && typeof entry === "object" ? entry : {};
    const value = details?.[key];
    if (Array.isArray(value)) return value.filter(scope => typeof scope === "string");
    if (key === "matches" && Array.isArray(details?.domains)) {
        return details.domains.filter(scope => typeof scope === "string");
    }
    return [];
}

function cosmeticCacheEntryAppliesToYoutube(entry) {
    const excludes = cosmeticCacheEntryScopes(entry, "excludeMatches");
    if (excludes.some(scope => youtubeScopeApplies(scope))) return false;
    const includes = cosmeticCacheEntryScopes(entry, "matches");
    return includes.length === 0 || includes.some(scope => youtubeScopeApplies(scope));
}

function scrubStaleYouTubeCosmeticCache(raw) {
    if (raw === undefined || raw === null || raw === "") {
        return { changed: false, removed: [], content: undefined };
    }
    const data = parseStoredCosmeticFilterData(raw);
    const removed = [];
    const keepGeneric = data.genericCosmeticFilters.filter(entry => {
        const selector = cosmeticCacheEntrySelector(entry);
        if (selector === "" || selectorTargetsYouTubeMasthead(selector) === false) return true;
    removed.push(selector);
    return false;
    });
    const keepSpecific = data.specificCosmeticFilters.filter(entry => {
        const selector = cosmeticCacheEntrySelector(entry);
        if (
            selector === "" ||
      selectorTargetsYouTubeMasthead(selector) === false ||
      cosmeticCacheEntryAppliesToYoutube(entry) === false
        ) {
            return true;
        }
    removed.push(selector);
    return false;
    });
    if (removed.length === 0) return { changed: false, removed, content: undefined };
    return {
    changed: true,
    removed,
    content: JSON.stringify({
      ...data,
      genericCosmeticFilters: keepGeneric,
      specificCosmeticFilters: keepSpecific,
    }),
    };
}

async function buildUserCosmeticFilters(hostname) {
    const result = { injectedCSS: "", proceduralFilters: [], exceptionFilters: [] };
    if (!hostname) return result;
    try {
        const stored = await chrome.storage.local.get(["userFilters", "user-filters"]);
        const raw = typeof stored.userFilters === "string" && stored.userFilters !== ""
            ? stored.userFilters
            : typeof stored["user-filters"] === "string"
                ? stored["user-filters"]
                : "";
        if (!raw) return result;
        const lines = [];
        const exceptions = [];
        for (const line of raw.split(/\r?\n/)) {
            const trimmed = line.trim();
            if (trimmed === "" || trimmed.startsWith("!")) continue;
            // Exception cosmetic filter: domain#@#selector
            if (trimmed.includes("#@#")) {
                const sep = trimmed.indexOf("#@#");
                const domain = trimmed.slice(0, sep).trim();
                const selector = trimmed.slice(sep + 3).trim();
                if (selector && hostnameMatches(hostname, domain)) {
                    exceptions.push(selector);
                }
                continue;
            }
            // Standard cosmetic filter: domain##selector
            if (trimmed.includes("##")) {
                const sep = trimmed.indexOf("##");
                const domain = trimmed.slice(0, sep).trim();
                const selector = trimmed.slice(sep + 2).trim();
                if (selector && hostnameMatches(hostname, domain)) {
                    // Check if it's a procedural selector (starts with : or contains exotic tokens)
                    if (/^:/.test(selector) || selector.includes(":has(") || selector.includes(":has-text(") || selector.includes(":matches-path(") || selector.includes(":matches-css(") || selector.includes(":upward(") || selector.includes(":remove(")) {
                        result.proceduralFilters.push({ selector });
                    } else {
                        lines.push(selector);
                    }
                }
            }
        }
        if (lines.length > 0) {
            result.injectedCSS = lines.map(s => `${s} { display: none !important; }`).join("\n");
        }
        if (exceptions.length > 0) {
            result.exceptionFilters = exceptions.map(s => `${s} { display: unset !important; }`);
        }
        return result;
    } catch (e) {
        console.warn("[uBR] buildUserCosmeticFilters failed:", e);
        return result;
    }
}

function hostnameMatches(hostname, domain) {
    if (domain === "" || domain === "*") return true;
    // Strip leading ~ (negation handled by caller via #@#)
    const d = domain.replace(/^~/, "");
    if (d === hostname) return true;
    if (hostname.endsWith(`.${  d}`)) return true;
    return false;
}

async function cleanupStaleYouTubeMastheadFilters() {
    const stored = await chrome.storage.local.get(["cosmeticFiltersData"]);
    const cleaned = scrubStaleYouTubeCosmeticCache(stored.cosmeticFiltersData);
    if (cleaned.changed === false) return [];
    if (cleaned.content !== undefined) {
        await chrome.storage.local.set({ cosmeticFiltersData: cleaned.content });
    }
    try { await reloadAllFilterLists(); } catch (err) { console.warn("[uBR] reloadAllFilterLists after scrub:", err); }
    if (cleaned.removed.length !== 0) {
        console.warn("[uBR] Removed stale YouTube masthead cosmetic entries:", cleaned.removed);
    }
    return cleaned.removed;
}

function hasSafeCustomCosmeticScope(scope) {
    if (scope === "" || scope === "*") return false;
    return scope.split(",").every(rawToken => {
        const token = rawToken.trim();
        return token !== "" &&
            token.startsWith("~") === false &&
            token.includes("*") === false &&
            /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9-]+$/i.test(token);
    });
}

function isUnsafeCustomCosmeticFilterLine(line) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("!") || trimmed.includes("#@#")) {
        return false;
    }
    const separator = trimmed.indexOf("##");
    if (separator === -1) return false;
    return hasSafeCustomCosmeticScope(trimmed.slice(0, separator).trim()) === false;
}

function sanitizeCustomFilterText(text) {
    const removed = [];
    const kept = [];
    for (const line of String(text || "").split(/\r?\n/)) {
        if (isUnsafeCustomCosmeticFilterLine(line)) {
            removed.push(line.trim());
            continue;
        }
        kept.push(line);
    }
    return { content: kept.join("\n").trimEnd(), removed };
}

async function cleanupLegacyGlobalCosmeticFilters() {
    const stored = await chrome.storage.local.get([
        "userFilters",
        "user-filters",
        "cosmeticFiltersData",
    ]);
    const source = typeof stored.userFilters === "string" && stored.userFilters !== ""
        ? stored.userFilters
        : typeof stored["user-filters"] === "string"
            ? stored["user-filters"]
            : "";
    const cleaned = sanitizeCustomFilterText(source);
    if (cleaned.removed.length === 0) return [];
    await chrome.storage.local.set({
        userFilters: cleaned.content,
        "user-filters": cleaned.content,
    });
    await chrome.storage.local.remove("cosmeticFiltersData");
    try { new BroadcastChannel("uBR").postMessage({ what: "userFiltersUpdated" }); } catch (e) { console.warn("[uBR] BroadcastChannel userFiltersUpdated:", e); }
    console.warn("[uBR] Removed unsafe global cosmetic user filters:", cleaned.removed);
    return cleaned.removed;
}

function pushLoggerEntry(entry) {
  loggerBackend.writeOne(entry);
}

async function getActivePageTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs.find(t => typeof t.id === "number" && !isExtensionURL(t.url)) || null;
}

async function getLoggerTabs() {
    const tabs = await chrome.tabs.query({});
    return tabs.filter(t => typeof t.id === "number" && !isExtensionURL(t.url)).map(t => [t.id, t.title || t.url || `Tab ${t.id}`]);
}

async function pushNetworkEntry(details) {
    if (typeof details.tabId !== "number" || details.tabId < 0) return;
    const requestHostname = hostnameFromURL(details.url);
    const requestDomain = domainFromHostname(requestHostname);
    let tabHostname = "";
    let tabDomain = "";
    try {
        const tab = await chrome.tabs.get(details.tabId);
        tabHostname = hostnameFromURL(tab?.url || "");
        tabDomain = domainFromHostname(tabHostname);
    } catch (e) {
        console.warn("[uBR] pushNetworkEntry: tabs.get failed for tab", details.tabId, e);
        tabHostname = requestHostname;
        tabDomain = requestDomain;
    }
    pushLoggerEntry({
    tstamp: Date.now() / 1000,
    realm: "network",
    tabId: details.tabId,
    type: details.type || "other",
    method: details.method || "",
    url: details.url || "",
    docHostname: tabHostname,
    docDomain: tabDomain,
    tabHostname,
    tabDomain,
    domain: requestDomain,
    });
}

async function pushDnrDecision(requestInfo, matchedRule) {
    const tabId = requestInfo?.tabId ?? matchedRule?.tabId;
    if (!tabId || tabId <= 0) return;
    const actionType = matchedRule?.action?.type || "unknown";
    const ruleId = matchedRule?.ruleId;
    const rulesetId = matchedRule?.rulesetId || "static";
    const url = requestInfo?.url || "";
    const method = requestInfo?.method || "";
    const type = requestInfo?.type || "other";
    const filterRef = typeof ruleId === "number" ? lookupFilterByRuleId(ruleId) : null;
    const requestHostname = hostnameFromURL(url);
    const requestDomain = domainFromHostname(requestHostname);
    pushLoggerEntry({
    tstamp: Date.now() / 1000,
    realm: "dnr",
    tabId,
    type: `dnr-${actionType}`,
    method,
    url,
    domain: requestDomain,
    hostname: requestHostname,
    rulesetId,
    ruleId,
    action: actionType,
    filterText: filterRef?.rawFilter || "",
    source: rulesetId === "_session" ? "session" : rulesetId === "_dynamic" ? "dynamic" : "static",
    });
}

async function pushTabReloadMarker(tabId) {
    let tabURL = "";
    let tabHostname = "";
    let tabDomain = "";
    try {
        const tab = await chrome.tabs.get(tabId);
        tabURL = tab?.url || "";
        tabHostname = hostnameFromURL(tabURL);
        tabDomain = domainFromHostname(tabHostname);
    } catch (e) {
        console.warn("[uBR] pushTabReloadMarker: tabs.get failed for tab", tabId, e);
    }
    pushLoggerEntry({
    tstamp: Date.now() / 1000,
    realm: "message",
    tabId,
    type: "tabReload",
    text: `Reload requested for ${tabURL || `tab ${tabId}`}`,
    keywords: ["reload", "logger"],
    });
}

function trackRequest(d) {
    if (d.tabId < 0) return;
    if (isExtensionURL(d.url)) return;
    if (dnrSyncCompleted === false) tabUnprocessedRequest.add(d.tabId);
    const hn = hostnameFromURL(d.url);
    if (hn && !isExtensionURL(d.url)) {
        if (!hostnameStats.has(hn)) {
      hostnameStats.set(hn, { domain: domainFromHostname(hn), allowed: { any: 0, script: 0, frame: 0 }, blocked: { any: 0, script: 0, frame: 0 } });
        }
        if (!tabHostnames.has(d.tabId)) tabHostnames.set(d.tabId, new Set());
        tabHostnames.get(d.tabId).add(hn);
    }
    void pushNetworkEntry(d);
}

function trackAllowed(d) {
    if (d.tabId < 0) return;
    let tab = reqStats.byTab.get(d.tabId);
    if (!tab) { tab = { allowed: { any: 0, script: 0, frame: 0 } }; reqStats.byTab.set(d.tabId, tab); }
    tab.allowed.any++;
    const cat = categorizeRequestType(d.type);
    if (cat === "script") tab.allowed.script++;
    if (cat === "frame") tab.allowed.frame++;
    reqStats.globalAllowed.any++;
    const hn = hostnameFromURL(d.url);
    if (hn && hostnameStats.has(hn)) {
        const h = hostnameStats.get(hn);
        h.allowed.any++;
        const cat2 = categorizeRequestType(d.type);
        if (cat2 === "script") h.allowed.script++;
        if (cat2 === "frame") h.allowed.frame++;
    }
    markTabChanged(d.tabId);
    void pushNetworkEntry({ ...d, type: d.type || "completed" });
}

// Lazy activation: on each observed request, install session rule for hostname in index
async function tryActivateHostname(_hostname) {
  // Deferred activation removed in favor of specificity-preserving rules.
  // Future deferred-rules implementation will preserve full original DNR rules.
}

let loggerActive = false; // Set when logger popup opens
let popupNeedsTracking = false; // Set when popup requests live stats
function isInstrumentationActive() {
    return loggerActive || popupNeedsTracking;
}
console.log("[uBR] chrome.webRequest available:", typeof chrome?.webRequest, typeof chrome?.webRequest?.onBeforeRequest);
try {
  chrome.webRequest.onBeforeRequest.addListener(
      d => {
        if (isInstrumentationActive()) trackRequest(d);
        try { const u = new URL(d.url); void tryActivateHostname(u.hostname); }
        catch (_) { /* invalid URL */ }
      },
      { urls: ["<all_urls>"] }
  );
  chrome.webRequest.onCompleted.addListener(
      d => { if (isInstrumentationActive()) trackAllowed(d); },
      { urls: ["<all_urls>"] }
  );
  chrome.webRequest.onErrorOccurred.addListener(
      d => { if (isInstrumentationActive()) trackAllowed(d); },
      { urls: ["<all_urls>"] }
  );
} catch (e) {
  console.warn("[uBR] webRequest registration failed:", e);
}

// ---------------------------------------------------------------------------
// Legacy global CSS used broad substring selectors and could hide application
// UI. Keep its exact text only so it can be removed from already-open tabs.
// ---------------------------------------------------------------------------
const LEGACY_BUILTIN_COSMETIC_HIDE = `
.adsbygoogle,.adsbox,.ad-container,.ad-slot,.ad-banner,.ad-placeholder,
ins.adsbygoogle,.google-adsense,.advertisement,.advertising,
.ad-wrap,.ad-wrapper,.ad-unit,.ad-area,.ad-module,.ad-section,
[class*="adunit"],[class*="ad-unit"],[class*="ad_banner"],[class*="ad-banner"],
[class*="ad-container"],[class*="ad-slot"],[class*="ad_placeholder"],
[class*="ad-holder"],[id*="google_ads"],[id*="ad-slot"],[id*="ad-container"],
[class*="adv-banner"],[class*="advertisement"],[class*="sponsored"],
[class*="advert"],[id*="advert"],[class*="adsbygoogle"],
[data-ad-slot],[data-ad-client],[data-ad-format],
amp-ad,.amp-ad,.ads-ad,.ad-text,.ad-display,.ad-thumb,
.googletag,.dfp-ad,.dfp-tag-wrapper,.ad-iframe,.ad-frame,
.mantis-ad,.taboola-ad,[class*="taboola"],[id*="taboola"],
.outbrain-ad,[class*="outbrain"],[id*="outbrain"],
[data-ad-layout],[data-ad-status]
{display:none!important}
`.replace(/\s+/g, " ").trim();

const LEGACY_BUILTIN_COSMETIC_NUKE = `
iframe[src*="doubleclick"],iframe[src*="googleadservices"],
iframe[src*="googlesyndication"],img[src*="doubleclick"],
img[src*="googleadservices"],img[src*="ads"],
img[src*="adservice"]
{display:none!important;width:0!important;height:0!important}
`.replace(/\s+/g, " ").trim();

const LEGACY_BUILTIN_COSMETIC_CSS = `${LEGACY_BUILTIN_COSMETIC_HIDE} ${LEGACY_BUILTIN_COSMETIC_NUKE}`.trim();
const BUILTIN_COSMETIC_CSS = "";

// ---------------------------------------------------------------------------
// Popup state model
// ---------------------------------------------------------------------------

// In-memory session stores (lost on SW restart)
const sessionNetFiltering = new Map(); // hostname → boolean
const sessionHostnameSwitches = new Map(); // hostname → { noPopups, noLargeMedia, noCosmeticFiltering, noRemoteFonts, noScripting }
const sessionFirewallRules = new Map(); // "src des type" → "src des type action"
const tabContentRevision = new Map(); // tabId → number
const tabUnprocessedRequest = new Set(); // tabId set
let dnrSyncCompleted = false; // set true once initial DNR rules are installed
const tabHostnames = new Map(); // tabId → Set<hostname>

// Storage key constants
const STORAGE_KEY_PERM_NET_FILTERING = "ubrPermanentNetFiltering";
const STORAGE_KEY_PERM_HOSTNAME_SWITCHES = "ubrPermanentHostnameSwitches";
const STORAGE_KEY_PERM_FIREWALL_RULES = "ubrPermanentFirewallRules";
const STORAGE_KEY_POPUP_SETTINGS = "ubrPopupSettings";
const STORAGE_KEY_TAB_STATS = "ubrTabStats";
const STORAGE_KEY_HOSTNAME_STATS = "ubrHostnameStats";
const STORAGE_KEY_FILTER_CACHE = "ubrFilterListCache";
const STORAGE_KEY_COMPILED_COUNTS = "ubrCompiledFilterCounts";

// Cache of permanent state loaded from storage
let permanentNetFiltering = {};
let permanentHostnameSwitches = {};
let permanentFirewallRules = {};
let popupSettings = {};

// Managed enterprise policy cache (chrome.storage.managed)
let managedPolicy = {};

// Idle state tracking
let idleDetectionActive = false;

// Whitelist (trusted site) directive cache
let whitelistTestFns = [];

function compileWhitelistDirective(directive) {
    const d = directive.trim();
    if (!d || /^\s*#/.test(d)) return null;
    if (d.startsWith('/') && d.endsWith('/') && d.length > 2) {
        try { const re = new RegExp(d.slice(1, -1)); return u => re.test(u); } catch (e) { console.warn("[uBR] compileWhitelistDirective: invalid regex", d, e); return null; }
    }
    if (d.endsWith('-scheme')) {
        const s = d.slice(0, -7);
        return u => u.startsWith(`${s  }:`);
    }
    const pos = d.indexOf('/');
    if (pos === -1) {
        return u => {
            const hn = hostnameFromURL(u);
            return hn === d || hn.endsWith(`.${  d}`);
        };
    }
    const hostname = d.slice(0, pos);
    const path = d.slice(pos);
    return u => {
        const hn = hostnameFromURL(u);
        if (hn !== hostname && !hn.endsWith(`.${  hostname}`)) return false;
        const hostnameStart = u.indexOf(hn);
        if (hostnameStart === -1) return false;
        const urlPath = u.slice(hostnameStart + hn.length);
        return urlPath.startsWith(path);
    };
}

function isURLTrusted(url) {
    if (!url) return false;
    for (const fn of whitelistTestFns) {
        if (fn(url)) return true;
    }
    return false;
}

const WHITELIST_DNR_RULE_BASE = 300000;

async function installWhitelistAllowRules(directives) {
    const allowRules = [];
    let id = WHITELIST_DNR_RULE_BASE;
    for (const line of directives) {
        const d = line.trim();
        if (!d || /^\s*#/.test(d)) continue;
        if (d.startsWith('/') && d.endsWith('/') && d.length > 2) {
            try { new RegExp(d.slice(1, -1)); } catch (e) { console.warn("[uBR] installWhitelistAllowRules: invalid regex", d, e); continue; }
            allowRules.push({
                id: id++,
                priority: 100000,
                action: { type: "allow" },
                condition: { regexFilter: d.slice(1, -1), resourceTypes: ["main_frame", "sub_frame", "script", "image", "stylesheet", "xmlhttprequest", "websocket", "other"] },
            });
        } else if (d.endsWith('-scheme')) {
            continue;
        } else {
            allowRules.push({
                id: id++,
                priority: 100000,
                action: { type: "allow" },
                condition: { requestDomains: [d], resourceTypes: ["main_frame", "sub_frame", "script", "image", "stylesheet", "xmlhttprequest", "websocket", "other"] },
            });
        }
    }
    const existing = await chrome.declarativeNetRequest.getSessionRules();
    const removeIds = existing.filter(r => r.id >= WHITELIST_DNR_RULE_BASE && r.id < WHITELIST_DNR_RULE_BASE + 10000).map(r => r.id);
    if (removeIds.length > 0) {
        await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: removeIds, addRules: [] });
    }
    if (allowRules.length > 0) {
        await chrome.declarativeNetRequest.updateSessionRules({ addRules: allowRules, removeRuleIds: [] });
    }
}

async function reloadWhitelist() {
    const data = await chrome.storage.local.get(["whitelist"]);
    const raw = Array.isArray(data.whitelist) ? data.whitelist : [];
    whitelistTestFns = raw.map(compileWhitelistDirective).filter(Boolean);
    await installWhitelistAllowRules(raw);
}

async function removeLegacyBuiltInCosmetics() {
    const tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*"] });
    await Promise.all(tabs.map(tab => {
        if (tab.id === undefined) return Promise.resolve();
        return chrome.scripting.removeCSS({
            target: { tabId: tab.id },
            css: LEGACY_BUILTIN_COSMETIC_CSS,
        }).catch(err => { console.warn("[uBR] Failed to remove legacy cosmetics:", err); });
    }));
}

async function reconcileTrustedTabCosmetics() {
    const tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*"] });
    for (const tab of tabs) {
        if (tab.id === undefined || !tab.url) continue;
        if (isURLTrusted(tab.url)) {
            void chrome.scripting.removeCSS({
                target: { tabId: tab.id },
                css: LEGACY_BUILTIN_COSMETIC_CSS,
            }).catch(err => { console.warn("[uBR] Failed to remove trusted tab cosmetics:", err); });
            markTabChanged(tab.id);
        }
    }
}

// Initialize from storage
async function loadPermanentState() {
    try {
        const result = await chrome.storage.local.get([
      STORAGE_KEY_PERM_NET_FILTERING,
      STORAGE_KEY_PERM_HOSTNAME_SWITCHES,
      STORAGE_KEY_PERM_FIREWALL_RULES,
      STORAGE_KEY_POPUP_SETTINGS,
      STORAGE_KEY_URL_FILTERING,
        ]);
        permanentNetFiltering = result[STORAGE_KEY_PERM_NET_FILTERING] || {};
        permanentHostnameSwitches = result[STORAGE_KEY_PERM_HOSTNAME_SWITCHES] || {};
        permanentFirewallRules = result[STORAGE_KEY_PERM_FIREWALL_RULES] || {};
        popupSettings = result[STORAGE_KEY_POPUP_SETTINGS] || {};
        permanentURLFilteringRules = result[STORAGE_KEY_URL_FILTERING] || {};
    } catch (err) {
        console.warn("[uBR] loadPermanentState failed:", err);
    }
}
void loadPermanentState();
void reloadWhitelist();

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

let revisionCounter = 1;
function markTabChanged(tabId) {
    if (typeof tabId === "number" && tabId > 0) {
    tabContentRevision.set(tabId, revisionCounter++);
    }
}

function getTabRevision(tabId) {
    return tabContentRevision.get(tabId) || 0;
}

function getEffectiveNetFiltering(hostname) {
    if (!hostname) return false;
    if (sessionNetFiltering.has(hostname)) return sessionNetFiltering.get(hostname);
    if (permanentNetFiltering[hostname] !== undefined) return permanentNetFiltering[hostname];
    return true;
}

function getEffectiveHostnameSwitch(hostname, name) {
    if (!hostname) return false;
    const session = sessionHostnameSwitches.get(hostname);
    if (session && session[name] !== undefined) return session[name];
    const perm = permanentHostnameSwitches[hostname];
    if (perm && perm[name] !== undefined) return perm[name];
    return false;
}

function getEffectiveHostnameSwitches(hostname) {
    if (!hostname) return {};
    const session = sessionHostnameSwitches.get(hostname) || {};
    const perm = permanentHostnameSwitches[hostname] || {};
    return {
        noPopups: session.noPopups !== undefined ? session.noPopups : perm.noPopups,
        noLargeMedia: session.noLargeMedia !== undefined ? session.noLargeMedia : perm.noLargeMedia,
        noCosmeticFiltering: session.noCosmeticFiltering !== undefined ? session.noCosmeticFiltering : perm.noCosmeticFiltering,
        noRemoteFonts: session.noRemoteFonts !== undefined ? session.noRemoteFonts : perm.noRemoteFonts,
        noScripting: session.noScripting !== undefined ? session.noScripting : perm.noScripting,
    };
}

function getEffectiveFirewallRule(key) {
    if (sessionFirewallRules.has(key)) return sessionFirewallRules.get(key);
    if (permanentFirewallRules[key] !== undefined) return permanentFirewallRules[key];
    return undefined;
}

function lookupRuleData(srcHostname, desHostname, type) {
    // Walk the full rule hierarchy with a simplified type+hostname fallback chain.
    // Returns the rule string in "src des type action" format, or undefined for implicit allow.
    const decomposeDestination = (hn) => {
        const out = [];
        if (!hn || hn === "*") return ["*"];
        const parts = hn.split(".");
        for (let i = parts.length - 1; i >= 0; i--) {
            out.push(parts.slice(i).join("."));
        }
        out.push("*");
        return out;
    };

    const tryRule = (src, des, t) => {
        const key = `${src} ${des} ${t}`;
        const val = getEffectiveFirewallRule(key);
        if (val !== undefined) return val;
    };

    // 1. Walk destination hostname components (most specific first) with exact type
    for (const deshn of decomposeDestination(desHostname)) {
        if (deshn === "*") break;
        const result = tryRule(srcHostname, deshn, type);
        if (result !== undefined) return result;
    }

    // 2. Walk destination components with catch-all type
    for (const deshn of decomposeDestination(desHostname)) {
        if (deshn === "*") break;
        const result = tryRule(srcHostname, deshn, "*");
        if (result !== undefined) return result;
    }

    // 3. Type-specific fallbacks at global destination
    if (type === "script" || type === "sub_frame" || type === "object") {
        const typeFallback = type === "script" ? "3p-script" : "3p-frame";
        const result = tryRule(srcHostname, "*", typeFallback);
        if (result !== undefined) return result;
    }
    const result = tryRule(srcHostname, "*", type);
    if (result !== undefined) return result;

    // 4. Third-party catch-all
    if (type.startsWith("3p") || type === "script" || type === "sub_frame" || type === "object") {
        const result = tryRule(srcHostname, "*", "3p");
        if (result !== undefined) return result;
    }

    // 5. Global catch-all
    return tryRule(srcHostname, "*", "*");
}

function getEffectiveFirewallRules(pageHostname, hostnameDict) {
    const firewallRuleTypes = [
        "*", "image", "3p", "inline-script",
        "1p-script", "3p-script", "3p-frame",
    ];
    const rules = {};
    const frontendKey = (scope, des, type) => `${scope} ${des} ${type}`;

    for (const type of firewallRuleTypes) {
        const globalRule = lookupRuleData("*", "*", type);
        if (globalRule !== undefined) {
            rules[frontendKey("/", "*", type)] = globalRule;
        }
        const localRule = lookupRuleData(pageHostname, "*", type);
        if (localRule !== undefined) {
            rules[frontendKey(".", "*", type)] = localRule;
        }
    }

    for (const desHostname of Object.keys(hostnameDict || {})) {
        const globalRule = lookupRuleData("*", desHostname, "*");
        if (globalRule !== undefined) {
            rules[frontendKey("/", desHostname, "*")] = globalRule;
        }
        const localRule = lookupRuleData(pageHostname, desHostname, "*");
        if (localRule !== undefined) {
            rules[frontendKey(".", desHostname, "*")] = localRule;
        }
    }

    return rules;
}

function computeMatrixIsDirty(hostname) {
    if (!hostname) return false;
    // Check hostname switches
    const session = sessionHostnameSwitches.get(hostname);
    const perm = permanentHostnameSwitches[hostname] || {};
    if (session) {
        for (const name of ["noPopups", "noLargeMedia", "noCosmeticFiltering", "noRemoteFonts", "noScripting"]) {
            const sv = session[name];
            const pv = perm[name];
            if (sv !== undefined && sv !== pv) return true;
        }
    }
    // Check net filtering
    if (sessionNetFiltering.has(hostname) && sessionNetFiltering.get(hostname) !== (permanentNetFiltering[hostname] !== false)) return true;
    // Check firewall rules
    for (const [key] of sessionFirewallRules) {
        if (permanentFirewallRules[key] !== sessionFirewallRules.get(key)) return true;
    }
    return false;
}

function isSupportedURL(url) {
    if (!url) return false;
    if (url.startsWith("http://") || url.startsWith("https://")) return true;
    if (url.startsWith("worker://") || url.startsWith("worklet://")) return true;
    return false;
}

// Emerging transport / protocol helpers
function isWebTransportURL(url) {
    return url && url.startsWith("https://") && (
        url.includes(".webtransport") || url.includes("webtransport")
    );
}

function isSXGURL(url) {
    return url && url.endsWith(".sxg");
}

// Browser-internal and extension pages cannot be filtered. Disable the action
// for them so its popup cannot present controls which have no valid target.
// Chrome renders a disabled action in gray.
async function syncActionAvailability(tabId, url) {
    if (typeof tabId !== "number" || tabId < 0) return;
    try {
        if (isSupportedURL(url) || isExtensionURL(url)) {
            await chrome.action.enable(tabId);
        } else {
            await chrome.action.disable(tabId);
            await chrome.action.setBadgeText({ tabId, text: "" });
        }
    } catch (err) {
        console.warn("[uBR] syncActionAvailability:", err);
    }
}

async function syncActionAvailabilityForOpenTabs() {
    try {
        const tabs = await chrome.tabs.query({});
        await Promise.all(tabs.map(async tab => {
            await syncActionAvailability(tab.id, tab.url);
            if (typeof tab.id === "number") {
                await clearBlockedCountIcon(tab.id);
            }
        }));
    } catch (err) {
        console.warn("[uBR] syncActionAvailabilityForOpenTabs:", err);
    }
}

// ----- Custom new tab interception -----
async function interceptNewTab(tabId, url) {
    if (!_showCustomNewTab) return;
    if (url !== "chrome://newtab/") return;
    try {
        const tab = await chrome.tabs.get(tabId);
        if (tab.url !== "chrome://newtab/" && tab.pendingUrl !== "chrome://newtab/") return;
        chrome.tabs.update(tabId, { url: chrome.runtime.getURL("pages/newtab.html") }).catch(() => {});
    } catch (_) {}
}

async function loadCustomNewTabState() {
    try {
        const us = await readUserSettings();
        _showCustomNewTab = us.showCustomNewTab !== false;
        await chrome.storage.local.set({ showCustomNewTab: _showCustomNewTab }).catch(() => {});
    } catch (_) {}
}

async function syncNewTabToUserSettings(value) {
    try {
        const stored = await chrome.storage.local.get("userSettings");
        const current = stored.userSettings || {};
        current.showCustomNewTab = value;
        await chrome.storage.local.set({ userSettings: current });
    } catch (_) {}
}

// ----- Managed enterprise policy -----
async function readManagedPolicy() {
    try {
        if (typeof chrome.storage.managed === "undefined") {
            runtimeHealth.managedPolicyApplied = false;
            return;
        }
        const policy = await chrome.storage.managed.get(null);
        if (policy && Object.keys(policy).length > 0) {
            managedPolicy = policy;
            runtimeHealth.managedPolicyApplied = true;
            if (policy.disableFiltering === true) {
                runtimeHealth.degradedMode = true;
                runtimeHealth.lastError = 'Filtering disabled by enterprise policy';
            }
            if (policy.disableLogger === true && loggerBackend.enabled) {
                loggerBackend.enabled = false;
            }
            if (Array.isArray(policy.whitelist)) {
                for (const site of policy.whitelist) {
                    compileWhitelistDirective(site);
                }
            }
        }
    } catch (e) {
        console.warn("[uBR] readManagedPolicy failed:", e);
    }
}

// ----- Idle detection -----
function startIdleDetection() {
    if (typeof chrome.idle === "undefined" || idleDetectionActive) return;
    idleDetectionActive = true;
    try {
        chrome.idle.onStateChanged.addListener(newState => {
            runtimeHealth.idleState = newState;
            if (newState === "idle" || newState === "locked") {
                if (loggerBackend.enabled) {
                    loggerBackend.enabled = false;
                }
                runtimeHealth.degradedMode = true;
            } else {
                runtimeHealth.degradedMode = false;
            }
        });
        chrome.idle.queryState(60, state => {
            runtimeHealth.idleState = state;
        });
    } catch (e) {
        console.warn("[uBR] startIdleDetection failed:", e);
        idleDetectionActive = false;
    }
}

// Map switch ID (from HTML) to popup data field name
const SWITCH_ID_TO_FIELD = {
  "no-popups": "noPopups",
  "no-large-media": "noLargeMedia",
  "no-cosmetic-filtering": "noCosmeticFiltering",
  "no-remote-fonts": "noRemoteFonts",
  "no-scripting": "noScripting",
};
const FIELD_TO_SWITCH_ID = {};
for (const [k, v] of Object.entries(SWITCH_ID_TO_FIELD)) {
    FIELD_TO_SWITCH_ID[v] = k;
}

const ACTION_NUM_TO_WORD = { 1: "block", 2: "allow", 3: "noop" };
const ACTION_WORD_TO_NUM = { block: 1, allow: 2, noop: 3 };

// Serialize all dynamic rules into arrays for the My rules tab
function serializeAllRules() {
    const permanentRules = [];
    const sessionRules = [];

    // Firewall rules
    for (const value of Object.values(permanentFirewallRules)) {
        const parts = String(value).split(" ");
        if (parts.length >= 4) {
            permanentRules.push(`${parts[0]} ${parts[1]} ${parts[2]} ${ACTION_NUM_TO_WORD[parts[3]] || parts[3]}`);
        }
    }
    for (const value of sessionFirewallRules.values()) {
        const parts = String(value).split(" ");
        if (parts.length >= 4) {
            sessionRules.push(`${parts[0]} ${parts[1]} ${parts[2]} ${ACTION_NUM_TO_WORD[parts[3]] || parts[3]}`);
        }
    }

    // Hostname switches
    for (const [hostname, switches] of Object.entries(permanentHostnameSwitches)) {
        if (typeof hostname !== "string" || hostname === "") continue;
        for (const [field, val] of Object.entries(switches)) {
            const name = FIELD_TO_SWITCH_ID[field];
            if (name) permanentRules.push(`${name}: ${hostname} ${val ? "true" : "false"}`);
        }
    }
    for (const [hostname, switches] of sessionHostnameSwitches) {
        if (typeof hostname !== "string" || hostname === "") continue;
        for (const [field, val] of Object.entries(switches)) {
            const name = FIELD_TO_SWITCH_ID[field];
            if (name) sessionRules.push(`${name}: ${hostname} ${val ? "true" : "false"}`);
        }
    }

    // URL filtering rules
    for (const [key, val] of Object.entries(permanentURLFilteringRules)) {
        const parts = key.split(" ");
        if (parts.length >= 3) {
            permanentRules.push(`${parts[0]} ${parts[1]} ${parts[2]} ${ACTION_NUM_TO_WORD[val] || val}`);
        }
    }
    for (const [key, val] of sessionURLFilteringRules) {
        const parts = key.split(" ");
        if (parts.length >= 3) {
            sessionRules.push(`${parts[0]} ${parts[1]} ${parts[2]} ${ACTION_NUM_TO_WORD[val] || val}`);
        }
    }

    return { permanentRules, sessionRules };
}

// Parse a single rule line from the My rules editor into a structured rule object
function parseRuleLine(line) {
    line = line.trim();
    if (!line) return null;

    const swMatch = /^([a-z][a-z-]+):\s+(\S+)\s+(true|false)$/.exec(line);
    if (swMatch) {
        const field = SWITCH_ID_TO_FIELD[swMatch[1]];
        if (field) {
            return { type: "switch", name: swMatch[1], field, hostname: swMatch[2], value: swMatch[3] === "true" };
        }
    }

    const tokens = line.split(/\s+/);
    if (tokens.length < 4) return null;

    const actionWord = tokens[tokens.length - 1];
    const actionNum = ACTION_WORD_TO_NUM[actionWord];
    if (actionNum === undefined) return null;

    // tokens: [src, second, type, action] — type may be multi-word only for switches (already matched above)
    const src = tokens[0];
    const second = tokens[1];
    const ruleType = tokens.slice(2, -1).join(" ");

    if (second.includes("/")) {
        return { type: "url", context: src, url: second, ruleType, action: actionNum };
    }
    return { type: "firewall", src, des: second, ruleType, action: actionNum };
}

// Apply a modifyRuleset operation to the in-memory stores
function applyRuleChanges(permanent, toAdd, toRemove) {
    const process = (line, add) => {
        const rule = parseRuleLine(line);
        if (!rule) return;
        switch (rule.type) {
        case "switch": {
            if (add) {
                const store = permanent ? permanentHostnameSwitches : sessionHostnameSwitches;
                const target = permanent ? store : sessionHostnameSwitches;
                if (permanent) {
                    if (!permanentHostnameSwitches[rule.hostname]) permanentHostnameSwitches[rule.hostname] = {};
                    permanentHostnameSwitches[rule.hostname][rule.field] = rule.value;
                } else {
                    let entry = sessionHostnameSwitches.get(rule.hostname);
                    if (!entry) { entry = {}; sessionHostnameSwitches.set(rule.hostname, entry); }
                    entry[rule.field] = rule.value;
                }
            } else {
                if (permanent) {
                    if (permanentHostnameSwitches[rule.hostname]) {
                        delete permanentHostnameSwitches[rule.hostname][rule.field];
                        if (Object.keys(permanentHostnameSwitches[rule.hostname]).length === 0) {
                            delete permanentHostnameSwitches[rule.hostname];
                        }
                    }
                } else {
                    const entry = sessionHostnameSwitches.get(rule.hostname);
                    if (entry) {
                        delete entry[rule.field];
                        if (Object.keys(entry).length === 0) sessionHostnameSwitches.delete(rule.hostname);
                    }
                }
            }
            break;
        }
        case "firewall": {
            const key = `${rule.src} ${rule.des} ${rule.ruleType}`;
            if (add) {
                const value = `${rule.src} ${rule.des} ${rule.ruleType} ${rule.action}`;
                if (permanent) permanentFirewallRules[key] = value;
                else sessionFirewallRules.set(key, value);
            } else {
                if (permanent) delete permanentFirewallRules[key];
                else sessionFirewallRules.delete(key);
            }
            break;
        }
        case "url": {
            const key = `${rule.context} ${rule.url} ${rule.ruleType}`;
            if (add) {
                if (permanent) permanentURLFilteringRules[key] = String(rule.action);
                else sessionURLFilteringRules.set(key, String(rule.action));
            } else {
                if (permanent) delete permanentURLFilteringRules[key];
                else sessionURLFilteringRules.delete(key);
            }
            break;
        }
        }
    };

    if (toRemove) {
        for (const line of toRemove.split("\n")) process(line, false);
    }
    if (toAdd) {
        for (const line of toAdd.split("\n")) process(line, true);
    }

    if (permanent) {
        chrome.storage.local.set({
            [STORAGE_KEY_PERM_FIREWALL_RULES]: permanentFirewallRules,
            [STORAGE_KEY_PERM_HOSTNAME_SWITCHES]: permanentHostnameSwitches,
            [STORAGE_KEY_URL_FILTERING]: permanentURLFilteringRules,
        }).catch(err => { console.warn("[uBR] Failed to persist firewall rules:", err); });
    }

    const serialized = serializeAllRules();
    return { permanentRules: serialized.permanentRules, sessionRules: serialized.sessionRules };
}

async function resolveTabId(tabId) {
    let id = Number(tabId) > 0 ? Number(tabId) : 0;
    if (id <= 0) {
        id = popupPortTabId;
    }
    if (id <= 0) {
        try {
            const win = await chrome.windows.getLastFocused();
            const tabs = await chrome.tabs.query({ windowId: win.id, active: true });
            for (const t of tabs) {
                if (typeof t.id === "number") { id = t.id; break; }
            }
            if (id <= 0) {
                const tabs2 = await chrome.tabs.query({});
                for (const t of tabs2) {
                    if (typeof t.id === "number" && t.url) { id = t.id; break; }
                }
            }
        } catch (e) {
            console.warn("[uBR] resolveTabId: failed to resolve tab ID", e);
        }
    }
    return id;
}

// Keep a small, per-navigation badge count for actual DNR block actions. This
// is deliberately event-driven: querying getMatchedRules on every request is
// quota-limited and would make badge updates less reliable than the count.
const blockedDnrCountByTab = new Map();
// Cosmetic filters run in every frame. Keep each frame's monotonic count
// separate so a no-match iframe cannot overwrite the top document's count.
const blockedCosmeticCountByTab = new Map();
const pendingBadgeUpdates = new Set();
const matchedRuleActionCache = new Map();
const pendingRuleActionLookups = new Map();
const actionIconBaseImageData = new Map();

// New tab page toggle state
let _showCustomNewTab = true;

const actionIconPaths = Object.freeze({
    16: chrome.runtime.getURL("img/ublock16.png"),
    32: chrome.runtime.getURL("img/ublock32.png"),
});
const actionDefaultTitle = "uBlock Resurrected";
const actionIconPixelData = Object.freeze({
    16: new Uint8ClampedArray([0,0,0,0,0,0,0,0,0,0,0,0,52,53,54,0,0,0,0,0,139,143,143,23,175,180,180,95,175,174,175,202,175,175,175,202,175,180,180,94,138,142,142,22,0,0,0,0,48,49,50,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,0,103,103,104,11,161,165,165,39,174,180,180,81,176,179,179,141,166,161,161,205,145,118,119,246,126,59,62,255,126,59,62,255,145,118,119,246,166,161,161,204,176,179,179,140,174,180,180,80,159,164,164,39,101,100,101,11,228,228,228,0,0,0,0,1,177,177,178,136,161,149,149,234,142,110,112,250,131,75,77,255,126,39,43,255,135,23,27,255,145,23,27,255,145,22,27,255,135,22,26,255,127,40,43,255,131,75,77,255,143,111,112,250,161,149,150,233,176,176,177,134,0,0,0,0,64,67,69,6,173,171,172,180,122,50,53,255,138,20,25,255,144,23,27,255,147,25,29,255,147,25,30,255,144,22,26,255,144,22,26,255,145,22,26,255,147,22,26,255,144,21,26,255,138,20,24,255,121,51,54,255,173,172,172,176,38,40,42,5,98,101,102,9,169,166,166,187,128,44,48,255,146,25,29,255,144,28,32,255,145,25,29,255,145,33,37,255,163,89,91,255,172,102,104,255,172,102,105,255,162,80,83,255,146,33,37,255,147,24,29,255,127,45,48,255,168,166,166,183,83,87,87,7,88,91,93,7,169,167,167,183,126,44,47,255,158,72,75,255,192,156,157,255,146,41,45,255,150,51,54,255,228,220,221,255,219,204,204,255,211,188,189,255,234,228,228,255,178,123,125,255,144,23,27,255,127,47,50,255,169,167,167,181,73,77,77,7,0,0,0,3,172,171,172,169,126,50,53,255,169,96,98,255,229,221,221,255,149,49,53,255,150,51,54,255,227,218,218,255,163,95,97,255,145,50,53,255,216,197,197,255,195,157,159,255,143,23,27,255,129,55,58,255,172,172,172,168,0,0,0,2,255,255,255,0,174,177,177,141,128,67,69,255,166,92,94,255,232,225,226,255,151,60,63,255,149,53,56,255,227,217,217,255,172,128,129,255,221,206,207,255,225,215,216,255,152,68,71,255,143,20,25,255,131,72,74,255,174,177,177,139,255,255,255,0,225,225,225,0,175,180,180,95,139,100,101,253,146,55,58,255,225,213,213,255,219,201,202,255,210,187,187,255,228,220,220,255,157,85,87,255,185,134,136,255,234,227,228,255,187,140,142,255,137,25,29,255,139,102,104,253,174,179,179,94,222,222,222,0,150,150,150,0,161,165,165,40,157,144,145,228,127,29,33,255,154,62,66,255,174,112,114,255,176,116,118,255,158,77,80,255,144,28,32,255,142,23,28,255,184,132,134,255,233,228,228,255,137,72,74,255,157,142,142,227,159,163,164,40,148,147,148,0,69,69,70,0,3,4,6,3,176,177,177,157,129,73,75,255,142,21,25,255,145,23,27,255,144,22,26,255,144,22,27,255,145,25,29,255,145,24,29,255,146,38,42,255,154,72,75,255,130,91,92,255,175,175,176,155,0,0,0,3,67,66,67,0,0,0,0,0,183,183,184,0,165,168,168,52,161,150,150,227,125,37,40,255,147,25,29,255,146,26,30,255,145,25,30,255,145,25,29,255,145,25,29,255,146,23,28,255,123,34,37,255,161,149,150,226,163,166,167,51,181,181,181,0,0,0,0,0,0,0,0,0,62,62,63,0,0,0,0,0,176,179,179,105,149,127,128,245,126,31,34,255,146,24,29,255,146,26,30,255,146,26,30,255,146,24,29,255,127,31,34,255,150,129,130,244,175,178,179,104,255,255,255,0,59,58,59,0,0,0,0,0,0,0,0,0,0,0,0,0,110,110,110,0,83,82,83,6,177,179,179,121,150,130,131,244,124,39,42,255,143,22,26,255,143,22,26,255,125,40,43,255,152,132,133,243,177,180,180,120,79,79,80,5,109,109,110,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,114,114,115,0,85,84,85,5,175,178,178,98,163,153,153,223,128,73,75,255,128,74,76,255,163,154,155,223,175,178,178,96,83,82,83,5,113,113,114,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,72,73,0,0,0,0,0,163,166,166,57,177,178,178,190,177,178,179,188,162,165,166,56,0,0,0,0,69,69,69,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]),
    32: new Uint8ClampedArray([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,68,68,70,0,17,17,18,14,104,104,105,88,172,171,172,203,171,171,172,202,104,104,105,86,15,15,16,13,63,62,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,2,48,47,49,30,122,122,123,98,181,181,181,186,218,218,218,244,197,199,198,255,199,200,200,255,218,219,219,243,180,180,180,184,120,120,121,97,47,47,48,28,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,3,0,0,0,0,4,45,45,46,29,109,109,110,81,158,158,159,152,200,201,201,218,219,220,220,251,185,186,186,255,111,99,99,255,79,29,31,255,79,31,32,255,112,101,101,255,186,188,187,255,219,220,220,251,200,200,200,217,156,156,156,150,106,106,106,79,42,42,43,28,0,0,0,4,1,1,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,3,3,4,10,53,53,54,32,99,99,100,68,137,137,137,116,172,172,172,171,202,202,202,220,218,219,219,249,202,204,204,255,149,147,147,255,93,72,73,255,83,24,26,255,116,17,21,255,143,23,28,255,143,22,27,255,114,16,20,255,83,24,27,255,95,73,74,255,151,149,149,255,203,204,204,255,217,218,218,248,201,201,201,219,171,171,171,169,135,135,136,114,98,97,98,66,49,48,50,31,2,1,2,10,0,0,0,0,3,2,3,0,0,0,0,0,0,0,0,0,104,104,105,0,85,85,86,56,172,172,172,191,207,207,207,224,215,216,216,246,210,212,212,254,185,187,187,255,142,137,137,255,99,78,79,255,82,33,35,255,98,16,19,255,128,19,23,255,146,25,30,255,147,26,30,255,146,25,30,255,145,24,29,255,147,25,29,255,146,24,28,255,129,19,23,255,99,16,19,255,82,34,36,255,99,80,80,255,144,139,139,255,187,188,188,255,211,213,213,254,215,216,216,245,205,205,205,224,169,169,169,190,81,81,82,53,96,96,97,0,0,0,0,0,0,0,0,0,181,181,181,0,129,129,129,102,225,226,226,255,142,137,138,255,100,79,80,255,84,45,46,255,87,23,25,255,106,16,20,255,129,19,23,255,144,23,28,255,148,26,30,255,147,26,30,255,147,26,30,255,146,25,29,255,145,24,29,255,146,25,29,255,146,25,29,255,146,25,30,255,147,26,30,255,149,26,30,255,144,23,28,255,129,19,23,255,105,16,19,255,86,23,26,255,85,46,48,255,101,80,81,255,145,141,141,255,225,225,225,254,122,122,123,95,162,162,162,0,0,0,0,0,0,0,0,0,250,250,249,0,145,144,145,121,209,211,211,255,76,36,38,255,128,17,21,255,141,22,27,255,148,25,29,255,148,26,31,255,147,26,30,255,146,25,29,255,146,26,30,255,147,26,30,255,147,25,30,255,145,25,29,255,144,25,29,255,146,26,30,255,146,26,30,255,145,26,30,255,146,27,30,255,147,27,31,255,147,26,30,255,147,25,30,255,147,25,29,255,147,25,29,255,141,22,26,255,126,15,20,255,77,41,42,255,211,213,213,255,137,137,137,113,215,216,215,0,0,0,0,0,46,43,59,0,255,255,255,0,153,153,153,133,203,205,205,255,85,33,35,255,147,24,29,255,146,26,30,255,146,25,30,255,147,26,31,255,146,26,31,255,146,26,30,255,146,25,30,255,146,26,30,255,147,25,30,255,146,24,29,255,146,26,30,255,147,27,31,255,147,26,30,255,146,25,30,255,147,26,30,255,148,26,31,255,148,26,30,255,146,25,30,255,146,25,30,255,146,25,30,255,146,25,30,255,145,22,27,255,82,35,37,255,205,207,207,255,147,147,147,125,255,255,255,0,224,190,255,0,59,56,71,0,255,255,255,0,158,157,158,141,198,200,200,255,84,29,31,255,147,24,29,255,146,25,30,255,146,25,30,255,147,27,31,255,147,27,31,255,146,26,30,255,145,25,29,255,146,25,29,255,145,25,29,255,140,23,27,255,139,23,27,255,140,24,28,255,141,24,28,255,141,24,28,255,141,23,27,255,142,22,26,255,144,22,26,255,147,25,30,255,147,26,30,255,147,26,30,255,146,26,30,255,145,24,28,255,82,31,32,255,201,203,203,255,152,152,152,134,255,255,255,0,44,41,49,0,47,46,50,0,255,255,255,0,157,157,157,145,196,198,198,255,83,28,30,255,147,25,29,255,146,24,29,255,144,23,27,255,142,22,26,255,143,22,26,255,145,24,29,255,145,25,29,255,146,24,29,255,136,39,42,255,171,138,139,255,186,157,158,255,186,156,157,255,187,157,158,255,187,156,157,255,186,156,157,255,179,143,144,255,153,93,95,255,138,33,37,255,145,25,29,255,146,26,30,255,146,26,30,255,146,24,29,255,82,29,31,255,199,201,201,255,153,152,152,137,255,255,255,0,6,6,5,0,60,55,72,0,255,255,255,0,157,157,158,140,198,199,199,255,83,29,31,255,146,25,29,255,143,24,28,255,143,75,78,255,167,122,124,255,156,105,107,255,138,33,37,255,147,25,29,255,146,24,28,255,139,50,53,255,228,224,225,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,246,247,247,255,179,149,150,255,137,30,34,255,145,25,30,255,146,27,31,255,145,24,28,255,82,31,33,255,200,202,202,255,151,151,151,136,255,255,255,0,36,33,40,0,52,48,62,0,255,255,255,0,152,152,152,130,202,204,204,255,84,33,35,255,146,25,29,255,140,23,27,255,180,149,150,255,255,255,255,255,225,222,222,255,139,48,51,255,146,24,29,255,147,25,29,255,140,51,53,255,227,223,223,255,255,255,255,255,205,191,192,255,173,135,137,255,176,137,138,255,183,153,154,255,230,224,225,255,255,255,255,255,239,239,239,255,144,73,75,255,144,23,27,255,146,26,31,255,145,24,28,255,83,35,36,255,204,206,206,255,147,147,147,126,255,255,255,0,108,94,133,0,0,0,0,0,227,227,227,0,142,142,142,116,208,210,210,255,84,41,42,255,145,25,29,255,141,24,27,255,180,149,150,255,255,255,255,255,226,221,221,255,139,49,52,255,146,25,29,255,147,25,29,255,140,51,53,255,227,223,223,255,255,255,255,255,169,128,129,255,137,18,22,255,142,22,26,255,137,19,23,255,161,112,114,255,251,253,253,255,249,251,250,255,153,95,97,255,142,22,27,255,146,26,31,255,144,24,28,255,84,43,45,255,209,211,212,255,137,137,137,112,212,212,212,0,0,0,0,0,0,0,0,0,164,164,164,0,127,126,127,94,213,215,215,254,87,54,55,255,140,22,26,255,141,24,28,255,181,149,150,255,255,255,255,255,226,221,221,255,138,49,52,255,145,25,29,255,146,25,29,255,140,51,53,255,227,223,224,255,255,255,255,255,171,129,130,255,136,24,27,255,138,32,36,255,137,39,43,255,181,149,150,255,255,255,255,255,235,233,234,255,141,66,69,255,143,23,28,255,147,27,31,255,140,23,27,255,89,57,59,255,214,216,216,253,122,121,122,92,155,155,155,0,0,0,0,0,0,0,0,0,110,110,111,0,101,100,101,68,215,216,216,246,98,77,78,255,130,19,23,255,141,24,28,255,180,149,150,255,255,255,255,255,226,221,221,255,138,48,51,255,146,25,29,255,147,25,29,255,140,51,53,255,227,223,224,255,255,255,255,255,169,126,127,255,141,79,81,255,207,194,194,255,218,209,209,255,248,248,248,255,238,236,236,255,167,125,127,255,137,27,31,255,145,25,30,255,146,26,31,255,131,20,24,255,102,82,82,255,215,216,216,245,96,96,96,65,104,103,104,0,0,0,0,0,0,0,0,0,58,58,59,0,59,59,60,39,207,208,208,230,124,115,115,255,117,17,21,255,142,23,27,255,177,142,143,255,255,255,255,255,237,236,236,255,143,70,72,255,140,19,24,255,144,20,25,255,138,47,50,255,227,223,223,255,255,255,255,255,168,126,127,255,154,101,102,255,251,253,253,255,255,255,255,255,253,254,254,255,175,152,152,255,130,29,33,255,144,23,28,255,145,26,30,255,147,26,31,255,115,17,20,255,127,118,118,255,207,207,207,228,56,56,56,37,55,55,55,0,0,0,0,0,0,0,0,0,20,20,22,0,0,0,0,14,189,189,190,198,162,160,161,255,98,18,21,255,145,21,26,255,158,104,106,255,249,251,251,255,254,254,254,255,212,199,199,255,168,123,125,255,165,113,115,255,170,134,135,255,239,237,237,255,254,255,255,255,165,119,121,255,135,64,66,255,195,175,176,255,239,238,238,255,255,255,255,255,243,241,241,255,180,149,150,255,136,35,39,255,145,25,30,255,149,26,31,255,96,18,21,255,165,164,164,255,186,186,187,196,0,0,0,13,18,17,19,0,0,0,0,0,0,0,0,0,8,7,12,0,255,255,255,0,156,156,156,147,200,202,202,255,83,33,35,255,144,23,27,255,138,40,44,255,197,179,180,255,251,253,253,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,227,224,224,255,144,69,72,255,143,22,27,255,137,28,32,255,152,88,90,255,223,216,216,255,255,255,255,255,250,252,252,255,173,137,138,255,138,25,29,255,145,24,28,255,83,34,35,255,202,203,203,255,153,152,153,145,255,255,255,0,11,9,13,0,0,0,0,0,0,0,0,0,34,28,35,0,142,141,142,0,110,109,110,82,217,218,218,249,98,78,79,255,128,20,24,255,146,24,29,255,138,42,45,255,163,117,119,255,193,171,172,255,202,186,186,255,203,187,188,255,200,181,182,255,180,149,150,255,144,72,75,255,141,25,29,255,146,26,31,255,147,26,31,255,142,21,25,255,150,84,86,255,237,236,236,255,255,255,255,255,232,230,230,255,143,64,67,255,126,16,20,255,100,80,81,255,216,217,217,248,106,106,106,80,135,135,135,0,55,47,65,0,0,0,0,0,0,0,0,0,0,0,0,0,48,47,48,0,33,33,34,26,195,195,196,212,155,153,153,255,95,17,20,255,147,25,30,255,145,24,28,255,140,22,26,255,137,26,30,255,137,30,34,255,137,30,34,255,137,28,32,255,138,23,27,255,143,23,27,255,144,26,30,255,145,26,30,255,145,26,30,255,146,25,30,255,138,26,30,255,189,165,166,255,253,255,255,255,252,255,255,255,171,130,131,255,88,14,17,255,158,156,156,255,194,194,194,210,29,29,30,24,46,45,46,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,1,2,0,255,255,255,0,145,145,145,134,212,213,214,255,83,51,52,255,135,21,25,255,147,26,31,255,147,26,30,255,147,26,31,255,147,27,31,255,147,26,31,255,145,25,29,255,145,25,30,255,144,25,29,255,145,25,29,255,145,26,30,255,146,26,30,255,145,26,30,255,145,23,28,255,140,58,62,255,160,109,111,255,162,111,113,255,130,71,73,255,79,52,53,255,213,214,214,255,142,142,142,130,255,255,255,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,84,83,84,0,69,69,70,44,203,203,204,225,149,146,146,255,92,17,19,255,148,26,30,255,149,28,32,255,147,27,31,255,146,27,31,255,146,26,30,255,146,26,30,255,145,25,30,255,145,25,29,255,145,25,29,255,146,26,30,255,145,26,30,255,144,25,29,255,145,25,30,255,144,24,28,255,142,21,25,255,144,21,25,255,90,15,17,255,152,149,150,255,202,202,202,223,66,65,67,41,80,80,81,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,7,7,0,0,0,0,0,141,141,142,128,217,218,218,254,92,72,72,255,122,18,22,255,148,27,31,255,146,26,31,255,147,27,31,255,146,27,31,255,146,26,30,255,145,25,30,255,145,25,29,255,146,25,29,255,145,25,29,255,144,24,29,255,145,25,29,255,146,26,30,255,146,26,31,255,148,26,31,255,120,18,22,255,94,75,76,255,218,219,219,254,137,137,138,127,0,0,0,0,5,5,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,64,65,0,41,41,42,26,184,184,185,198,192,193,193,255,77,35,37,255,136,22,26,255,147,26,31,255,147,27,31,255,146,26,30,255,146,26,30,255,145,26,30,255,145,25,30,255,145,25,29,255,145,25,29,255,145,25,29,255,146,26,30,255,146,26,30,255,147,25,30,255,135,21,25,255,77,37,38,255,194,196,196,255,182,182,182,196,38,37,38,24,62,62,63,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,168,167,168,0,97,96,97,67,208,208,208,231,161,160,160,255,81,24,26,255,141,24,28,255,146,26,30,255,146,26,30,255,146,26,30,255,146,26,30,255,145,25,30,255,145,25,29,255,145,25,29,255,145,26,30,255,146,26,30,255,147,25,30,255,140,22,26,255,79,25,27,255,165,164,165,255,207,207,207,230,92,92,93,65,155,155,156,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,8,9,0,0,0,0,0,121,121,121,103,217,217,217,243,146,143,143,255,81,22,24,255,140,24,28,255,147,26,31,255,145,26,30,255,146,26,30,255,146,26,30,255,146,26,30,255,147,27,31,255,147,26,31,255,148,27,31,255,140,23,27,255,81,23,26,255,151,148,149,255,217,217,217,242,120,120,120,99,0,0,0,0,9,8,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,26,25,26,0,0,0,0,4,133,133,133,118,219,219,219,245,150,147,148,255,79,27,29,255,133,21,25,255,147,25,30,255,146,25,29,255,147,26,31,255,147,26,30,255,147,26,31,255,148,26,30,255,132,21,24,255,79,29,30,255,155,153,153,255,218,219,219,244,130,130,131,116,0,0,0,4,21,21,21,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,29,29,29,0,0,0,0,5,129,129,130,115,215,215,215,241,172,172,172,255,78,43,45,255,115,17,20,255,147,25,29,255,148,26,30,255,147,25,30,255,147,25,29,255,115,17,21,255,79,46,47,255,176,176,176,255,214,215,215,239,128,128,129,111,0,0,0,5,30,28,32,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,19,19,20,0,0,0,0,3,114,114,114,92,203,203,203,225,203,204,204,255,98,83,83,255,91,18,21,255,138,23,27,255,137,22,26,255,88,18,21,255,102,87,87,255,205,207,207,255,201,201,201,223,111,111,111,89,0,0,0,3,19,19,19,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,0,0,0,0,0,85,84,85,56,177,177,177,189,221,222,222,252,150,148,148,255,78,42,44,255,79,45,46,255,154,152,152,255,222,223,223,252,175,175,175,187,81,81,82,53,0,0,0,0,1,1,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,87,87,88,0,40,39,40,20,138,137,138,125,207,207,208,229,209,211,211,255,210,212,212,255,207,207,207,227,135,135,135,122,38,37,38,19,83,82,84,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,6,8,0,0,0,0,2,82,82,82,62,162,162,162,189,161,161,161,188,82,81,83,59,0,0,0,1,5,5,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]),
});
// Preload icon data on SW startup so badge rendering succeeds reliably.
for (const size of Object.keys(actionIconPaths).map(Number)) {
    getActionIconBaseImageData(size);
}

function getBlockedCosmeticCount(tabId) {
    const countsByFrame = blockedCosmeticCountByTab.get(tabId);
    if (countsByFrame === undefined) return 0;
    let count = 0;
    for (const frameCount of countsByFrame.values()) {
        count += frameCount;
    }
    return count;
}

function reportBlockedCosmeticCount(tabId, frameId, count, clear = false) {
    const normalizedFrameId = Number.isInteger(frameId) && frameId >= 0 ? frameId : 0;
    let countsByFrame = blockedCosmeticCountByTab.get(tabId);
    if (clear) {
        if (countsByFrame === undefined) return;
        countsByFrame.delete(normalizedFrameId);
        if (countsByFrame.size === 0) {
            blockedCosmeticCountByTab.delete(tabId);
        }
        return;
    }
    const currentCount = countsByFrame?.get(normalizedFrameId) || 0;
    if (count <= currentCount) return;
    if (countsByFrame === undefined) {
        countsByFrame = new Map();
        blockedCosmeticCountByTab.set(tabId, countsByFrame);
    }
    countsByFrame.set(normalizedFrameId, count);
}

function incrementBlockedCosmeticCount(tabId, frameId, increment) {
    if (increment <= 0) return;
    const normalizedFrameId = Number.isInteger(frameId) && frameId >= 0 ? frameId : 0;
    let countsByFrame = blockedCosmeticCountByTab.get(tabId);
    if (countsByFrame === undefined) {
        countsByFrame = new Map();
        blockedCosmeticCountByTab.set(tabId, countsByFrame);
    }
    countsByFrame.set(
        normalizedFrameId,
        (countsByFrame.get(normalizedFrameId) || 0) + increment,
    );
}

async function getMatchedRuleActionType(matchedRule) {
    const ruleId = matchedRule?.ruleId;
    const rulesetId = matchedRule?.rulesetId || "_dynamic";
    if (typeof ruleId !== "number") return undefined;
    const cacheKey = `${rulesetId}:${ruleId}`;
    if (matchedRuleActionCache.has(cacheKey)) {
        return matchedRuleActionCache.get(cacheKey);
    }
    const pending = pendingRuleActionLookups.get(cacheKey);
    if (pending) return pending;

    const lookup = (async () => {
        let actionType;
        try {
            if (rulesetId === "_session") {
                const rules = await chrome.declarativeNetRequest.getSessionRules();
                actionType = rules.find(rule => rule.id === ruleId)?.action?.type;
            } else if (rulesetId === "_dynamic") {
                const rules = await chrome.declarativeNetRequest.getDynamicRules();
                actionType = rules.find(rule => rule.id === ruleId)?.action?.type;
            } else {
                const resources = chrome.runtime.getManifest()
                    .declarative_net_request?.rule_resources || [];
                const resource = resources.find(entry => entry.id === rulesetId);
                if (resource) {
                    const rules = await fetch(chrome.runtime.getURL(resource.path)).then(r => r.json());
                    actionType = rules.find(rule => rule.id === ruleId)?.action?.type;
                }
            }
        } catch (err) {
            console.warn("[uBR] getMatchedRuleActionType failed:", err);
        }
        matchedRuleActionCache.set(cacheKey, actionType);
        pendingRuleActionLookups.delete(cacheKey);
        return actionType;
    })();
    pendingRuleActionLookups.set(cacheKey, lookup);
    return lookup;
}

function formatCompactBlockedCount(count) {
    return count > 99 ? "99+" : String(count);
}

function getActionIconBaseImageData(size) {
    const cached = actionIconBaseImageData.get(size);
    if (cached !== undefined) return cached;
    const canvas = new OffscreenCanvas(size, size);
    const context = canvas.getContext("2d");
    const imageData = new ImageData(actionIconPixelData[size], size, size);
    context.putImageData(imageData, 0, 0);
    const result = context.getImageData(0, 0, size, size);
    actionIconBaseImageData.set(size, result);
    return result;
}

const countDigitData = Object.freeze({
    16: Object.freeze({
        "0": Object.freeze({w: 8, h: 8, data: new Uint8ClampedArray([0,0,0,2,0,0,0,148,0,0,0,248,0,0,0,254,0,0,0,253,0,0,0,227,0,0,0,65,0,0,0,0,0,0,0,84,2,2,2,255,147,147,147,255,239,239,239,255,218,218,218,255,66,66,66,254,0,0,0,234,0,0,0,3,0,0,0,178,83,83,83,255,254,254,254,255,43,43,43,255,146,146,146,255,227,227,227,255,3,3,3,255,0,0,0,35,0,0,0,221,140,140,140,255,234,234,234,255,0,0,0,255,86,86,86,255,255,255,255,255,32,32,32,255,0,0,0,61,0,0,0,220,141,141,141,255,235,235,235,255,0,0,0,255,88,88,88,255,255,255,255,255,31,31,31,255,0,0,0,62,0,0,0,179,83,83,83,255,255,255,255,255,43,43,43,255,149,149,149,255,227,227,227,255,3,3,3,255,0,0,0,34,0,0,0,84,2,2,2,255,148,148,148,255,239,239,239,255,218,218,218,255,66,66,66,254,0,0,0,234,0,0,0,3,0,0,0,2,0,0,0,149,0,0,0,248,0,0,0,254,0,0,0,253,0,0,0,227,0,0,0,65,0,0,0,0])}),
        "1": Object.freeze({w: 8, h: 8, data: new Uint8ClampedArray([0,0,0,24,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,176,0,0,0,0,0,0,0,0,0,0,0,24,24,24,24,255,255,255,255,255,255,255,255,255,176,176,176,255,0,0,0,231,0,0,0,0,0,0,0,0,0,0,0,24,0,0,0,255,0,0,0,255,188,188,188,255,176,176,176,255,0,0,0,248,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,250,188,188,188,255,176,176,176,255,0,0,0,248,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,250,188,188,188,255,176,176,176,255,0,0,0,248,0,0,0,0,0,0,0,0,0,0,0,16,0,0,0,255,0,0,0,255,188,188,188,255,176,176,176,255,0,0,0,255,0,0,0,255,0,0,0,4,0,0,0,16,16,16,16,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,4,4,4,255,0,0,0,4,0,0,0,16,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,4])}),
        "2": Object.freeze({w: 7, h: 8, data: new Uint8ClampedArray([0,0,0,88,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,229,0,0,0,70,0,0,0,88,88,88,88,255,255,255,255,255,253,253,253,255,219,219,219,255,71,71,71,254,0,0,0,211,0,0,0,88,0,0,0,255,0,0,0,255,17,17,17,255,206,206,206,255,195,195,195,255,0,0,0,235,0,0,0,0,0,0,0,28,0,0,0,235,41,41,41,255,238,238,238,255,141,141,141,255,0,0,0,229,0,0,0,18,0,0,0,221,29,29,29,254,226,226,226,255,175,175,175,255,9,9,9,253,0,0,0,144,0,0,0,104,18,18,18,255,213,213,213,255,189,189,189,255,6,6,6,255,0,0,0,255,0,0,0,225,0,0,0,104,92,92,92,255,255,255,255,255,255,255,255,255,255,255,255,255,224,224,224,255,0,0,0,224,0,0,0,92,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,224])}),
        "3": Object.freeze({w: 7, h: 8, data: new Uint8ClampedArray([0,0,0,56,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,238,0,0,0,99,0,0,0,56,56,56,56,255,255,255,255,255,253,253,253,255,228,228,228,255,100,100,100,254,0,0,0,211,0,0,0,56,0,0,0,255,0,0,0,255,21,21,21,255,217,217,217,255,183,183,183,255,0,0,0,223,0,0,0,0,0,0,0,120,120,120,120,255,255,255,255,255,249,249,249,255,72,72,72,255,0,0,0,247,0,0,0,0,0,0,0,120,0,0,0,255,15,15,15,255,196,196,196,255,213,213,213,255,0,0,0,250,0,0,0,120,0,0,0,255,0,0,0,255,14,14,14,255,195,195,195,255,214,214,214,255,0,0,0,250,0,0,0,120,120,120,120,255,255,255,255,255,249,249,249,255,209,209,209,255,65,65,65,254,0,0,0,224,0,0,0,120,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,254,0,0,0,220,0,0,0,63])}),
        "4": Object.freeze({w: 8, h: 8, data: new Uint8ClampedArray([0,0,0,0,0,0,0,0,0,0,0,159,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,96,0,0,0,0,0,0,0,0,0,0,0,67,0,0,0,245,159,159,159,255,255,255,255,255,96,96,96,255,0,0,0,156,0,0,0,0,0,0,0,9,0,0,0,229,68,68,68,254,220,220,220,255,255,255,255,255,96,96,96,255,0,0,0,193,0,0,0,0,0,0,0,132,14,14,14,250,219,219,219,255,72,72,72,255,255,255,255,255,96,96,96,255,0,0,0,193,0,0,0,0,0,0,0,212,128,128,128,255,155,155,155,255,12,12,12,255,255,255,255,255,96,96,96,255,0,0,0,255,0,0,0,52,0,0,0,210,164,164,164,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,52,52,52,255,0,0,0,52,0,0,0,164,0,0,0,255,0,0,0,255,12,12,12,255,255,255,255,255,96,96,96,255,0,0,0,255,0,0,0,52,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,96,0,0,0,0])}),
        "5": Object.freeze({w: 7, h: 8, data: new Uint8ClampedArray([0,0,0,40,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,152,0,0,0,74,40,40,40,255,255,255,255,255,255,255,255,255,255,255,255,255,152,152,152,255,0,0,0,152,0,0,0,102,40,40,40,255,255,255,255,255,12,12,12,255,0,0,0,255,0,0,0,255,0,0,0,185,0,0,0,74,40,40,40,255,255,255,255,255,247,247,247,255,224,224,224,255,83,83,83,255,0,0,0,241,0,0,0,40,0,0,0,255,0,0,0,255,9,9,9,255,179,179,179,255,235,235,235,255,0,0,0,254,0,0,0,96,0,0,0,255,0,0,0,255,9,9,9,255,180,180,180,255,232,232,232,255,0,0,0,254,0,0,0,96,96,96,96,255,255,255,255,255,253,253,253,255,216,216,216,255,74,74,74,254,0,0,0,239,0,0,0,96,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,227,0,0,0,73])}),
        "6": Object.freeze({w: 8, h: 8, data: new Uint8ClampedArray([0,0,0,0,0,0,0,92,0,0,0,233,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,192,0,0,0,0,0,0,0,41,0,0,0,253,92,92,92,255,221,221,221,255,254,254,254,255,192,192,192,255,0,0,0,192,0,0,0,0,0,0,0,132,41,41,41,255,252,252,252,255,91,91,91,255,3,3,3,255,0,0,0,255,0,0,0,221,0,0,0,0,0,0,0,187,108,108,108,255,254,254,254,255,218,218,218,255,240,240,240,255,118,118,118,255,0,0,0,254,0,0,0,17,0,0,0,193,114,114,114,255,255,255,255,255,77,77,77,255,130,130,130,255,254,254,254,255,17,17,17,255,0,0,0,26,0,0,0,147,59,59,59,255,255,255,255,255,77,77,77,255,131,131,131,255,250,250,250,255,10,10,10,255,0,0,0,26,0,0,0,59,0,0,0,255,129,129,129,255,236,236,236,255,230,230,230,255,97,97,97,255,0,0,0,252,0,0,0,10,0,0,0,0,0,0,0,129,0,0,0,246,0,0,0,254,0,0,0,254,0,0,0,240,0,0,0,97,0,0,0,0])}),
        "7": Object.freeze({w: 7, h: 8, data: new Uint8ClampedArray([0,0,0,120,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,239,0,0,0,120,120,120,120,255,255,255,255,255,255,255,255,255,255,255,255,255,239,239,239,255,0,0,0,250,0,0,0,120,0,0,0,255,0,0,0,255,2,2,2,255,221,221,221,255,168,168,168,255,0,0,0,251,0,0,0,0,0,0,0,0,0,0,0,208,78,78,78,255,255,255,255,255,54,54,54,255,0,0,0,186,0,0,0,0,0,0,0,43,0,0,0,255,188,188,188,255,196,196,196,255,0,0,0,255,0,0,0,54,0,0,0,0,0,0,0,170,43,43,43,255,255,255,255,255,82,82,82,255,0,0,0,215,0,0,0,0,0,0,0,0,0,0,0,170,153,153,153,255,222,222,222,255,2,2,2,255,0,0,0,83,0,0,0,0,0,0,0,0,0,0,0,153,0,0,0,242,0,0,0,242,0,0,0,222,0,0,0,2,0,0,0,0])}),
        "8": Object.freeze({w: 8, h: 8, data: new Uint8ClampedArray([0,0,0,24,0,0,0,202,0,0,0,253,0,0,0,255,0,0,0,255,0,0,0,245,0,0,0,125,0,0,0,0,0,0,0,95,24,24,24,255,196,196,196,255,247,247,247,255,236,236,236,255,126,126,126,255,0,0,0,240,0,0,0,0,0,0,0,97,78,78,78,255,255,255,255,255,63,63,63,255,168,168,168,255,225,225,225,255,0,0,0,245,0,0,0,0,0,0,0,149,5,5,5,255,201,201,201,255,255,255,255,255,254,254,254,255,95,95,95,255,0,0,0,254,0,0,0,4,0,0,0,170,100,100,100,255,252,252,252,255,31,31,31,255,139,139,139,255,238,238,238,255,4,4,4,255,0,0,0,9,0,0,0,174,112,112,112,255,251,251,251,255,38,38,38,255,143,143,143,255,250,250,250,255,5,5,5,255,0,0,0,9,0,0,0,122,18,18,18,254,185,185,185,255,245,245,245,255,231,231,231,255,106,106,106,255,0,0,0,252,0,0,0,5,0,0,0,17,0,0,0,190,0,0,0,252,0,0,0,255,0,0,0,254,0,0,0,241,0,0,0,106,0,0,0,0])}),
        "9": Object.freeze({w: 8, h: 8, data: new Uint8ClampedArray([0,0,0,12,0,0,0,180,0,0,0,252,0,0,0,254,0,0,0,253,0,0,0,217,0,0,0,48,0,0,0,0,0,0,0,123,14,14,14,253,176,176,176,255,244,244,244,255,208,208,208,255,50,50,50,253,0,0,0,212,0,0,0,0,0,0,0,189,117,117,117,255,246,246,246,255,31,31,31,255,185,185,185,255,202,202,202,255,0,0,0,254,0,0,0,5,0,0,0,193,128,128,128,255,246,246,246,255,31,31,31,255,185,185,185,255,252,252,252,255,5,5,5,255,0,0,0,7,0,0,0,140,25,25,25,254,198,198,198,255,246,246,246,255,223,223,223,255,248,248,248,255,2,2,2,255,0,0,0,7,0,0,0,71,0,0,0,255,0,0,0,255,17,17,17,255,187,187,187,255,180,180,180,255,0,0,0,253,0,0,0,2,0,0,0,52,52,52,52,255,255,255,255,255,245,245,245,255,183,183,183,255,33,33,33,251,0,0,0,188,0,0,0,0,0,0,0,52,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,252,0,0,0,191,0,0,0,28,0,0,0,0])}),
        "+": Object.freeze({w: 8, h: 7, data: new Uint8ClampedArray([0,0,0,0,0,0,0,0,0,0,0,28,0,0,0,213,0,0,0,213,0,0,0,208,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,53,35,35,35,249,215,215,215,254,0,0,0,246,0,0,0,0,0,0,0,0,0,0,0,40,0,0,0,255,0,0,0,255,28,28,28,255,208,208,208,255,0,0,0,255,0,0,0,255,0,0,0,220,0,0,0,40,40,40,40,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,220,220,220,255,0,0,0,220,0,0,0,40,0,0,0,255,0,0,0,255,28,28,28,255,208,208,208,255,0,0,0,255,0,0,0,255,0,0,0,220,0,0,0,0,0,0,0,0,0,0,0,53,35,35,35,249,215,215,215,254,0,0,0,246,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,28,0,0,0,213,0,0,0,213,0,0,0,208,0,0,0,0,0,0,0,0])}),
    }),
    32: Object.freeze({
        "0": Object.freeze({w: 12, h: 12, data: new Uint8ClampedArray([0,0,0,0,0,0,0,0,0,0,0,80,0,0,0,219,0,0,0,254,0,0,0,255,0,0,0,255,0,0,0,252,0,0,0,192,0,0,0,44,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,0,0,0,254,80,80,80,255,202,202,202,255,247,247,247,255,241,241,241,255,179,179,179,255,44,44,44,255,0,0,0,245,0,0,0,36,0,0,0,0,0,0,0,3,0,0,0,237,88,88,88,255,254,254,254,255,225,225,225,255,32,32,32,255,71,71,71,255,252,252,252,255,241,241,241,255,36,36,36,255,0,0,0,179,0,0,0,0,0,0,0,49,3,3,3,255,227,227,227,255,255,255,255,255,126,126,126,255,0,0,0,249,0,0,0,255,195,195,195,255,255,255,255,255,166,166,166,255,0,0,0,250,0,0,0,0,0,0,0,111,47,47,47,255,255,255,255,255,255,255,255,255,90,90,90,255,0,0,0,197,0,0,0,245,159,159,159,255,255,255,255,255,237,237,237,255,0,0,0,255,0,0,0,11,0,0,0,153,76,76,76,255,255,255,255,255,255,255,255,255,77,77,77,255,0,0,0,175,0,0,0,238,146,146,146,255,255,255,255,255,255,255,255,255,11,11,11,255,0,0,0,22,0,0,0,153,77,77,77,255,255,255,255,255,255,255,255,255,78,78,78,255,0,0,0,175,0,0,0,238,147,147,147,255,255,255,255,255,255,255,255,255,11,11,11,255,0,0,0,22,0,0,0,111,47,47,47,255,255,255,255,255,255,255,255,255,91,91,91,255,0,0,0,198,0,0,0,246,160,160,160,255,255,255,255,255,237,237,237,255,0,0,0,255,0,0,0,11,0,0,0,49,3,3,3,255,228,228,228,255,255,255,255,255,127,127,127,255,0,0,0,249,0,0,0,255,196,196,196,255,255,255,255,255,166,166,166,255,0,0,0,250,0,0,0,0,0,0,0,3,0,0,0,238,91,91,91,255,255,255,255,255,226,226,226,255,33,33,33,255,72,72,72,255,252,252,252,255,242,242,242,255,38,38,38,255,0,0,0,179,0,0,0,0,0,0,0,0,0,0,0,91,0,0,0,255,83,83,83,255,203,203,203,255,248,248,248,255,242,242,242,255,181,181,181,255,47,47,47,255,0,0,0,246,0,0,0,38,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,83,0,0,0,220,0,0,0,254,0,0,0,255,0,0,0,255,0,0,0,252,0,0,0,195,0,0,0,47,0,0,0,0,0,0,0,0])}),
        "1": Object.freeze({w: 10, h: 12, data: new Uint8ClampedArray([0,0,0,9,0,0,0,105,0,0,0,227,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,116,0,0,0,0,0,0,0,0,0,0,0,104,45,45,45,220,105,105,105,251,207,207,207,255,255,255,255,255,255,255,255,255,116,116,116,255,0,0,0,179,0,0,0,0,0,0,0,0,0,0,0,104,134,134,134,233,162,162,162,253,58,58,58,255,255,255,255,255,255,255,255,255,116,116,116,255,0,0,0,214,0,0,0,0,0,0,0,0,0,0,0,98,0,0,0,195,0,0,0,211,8,8,8,255,255,255,255,255,255,255,255,255,116,116,116,255,0,0,0,214,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,23,8,8,8,255,255,255,255,255,255,255,255,255,116,116,116,255,0,0,0,214,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,23,8,8,8,255,255,255,255,255,255,255,255,255,116,116,116,255,0,0,0,214,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,23,8,8,8,255,255,255,255,255,255,255,255,255,116,116,116,255,0,0,0,214,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,23,8,8,8,255,255,255,255,255,255,255,255,255,116,116,116,255,0,0,0,214,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,23,8,8,8,255,255,255,255,255,255,255,255,255,116,116,116,255,0,0,0,214,0,0,0,0,0,0,0,0,0,0,0,92,0,0,0,255,0,0,0,255,8,8,8,255,255,255,255,255,255,255,255,255,116,116,116,255,0,0,0,255,0,0,0,255,0,0,0,200,0,0,0,92,92,92,92,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,200,200,200,255,0,0,0,200,0,0,0,92,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,200])}),
        "2": Object.freeze({w: 10, h: 12, data: new Uint8ClampedArray([0,0,0,39,0,0,0,162,0,0,0,243,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,246,0,0,0,178,0,0,0,37,0,0,0,0,0,0,0,186,58,58,58,239,147,147,147,254,222,222,222,255,249,249,249,255,226,226,226,255,165,165,165,255,37,37,37,255,0,0,0,240,0,0,0,20,0,0,0,186,193,193,193,249,94,94,94,253,26,26,26,255,24,24,24,255,187,187,187,255,255,255,255,255,236,236,236,255,20,20,20,255,0,0,0,108,0,0,0,174,0,0,0,203,0,0,0,209,0,0,0,123,0,0,0,228,64,64,64,255,255,255,255,255,255,255,255,255,96,96,96,255,0,0,0,167,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,0,0,0,233,88,88,88,255,255,255,255,255,255,255,255,255,101,101,101,255,0,0,0,169,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,182,9,9,9,255,207,207,207,255,255,255,255,255,246,246,246,255,27,27,27,255,0,0,0,117,0,0,0,0,0,0,0,0,0,0,0,158,3,3,3,255,178,178,178,255,255,255,255,255,253,253,253,255,89,89,89,255,0,0,0,250,0,0,0,27,0,0,0,0,0,0,0,135,0,0,0,255,157,157,157,255,255,255,255,255,253,253,253,255,90,90,90,255,0,0,0,254,0,0,0,89,0,0,0,0,0,0,0,111,0,0,0,255,135,135,135,255,255,255,255,255,255,255,255,255,103,103,103,255,0,0,0,254,0,0,0,90,0,0,0,0,0,0,0,0,0,0,0,240,111,111,111,255,255,255,255,255,255,255,255,255,125,125,125,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,136,0,0,0,240,228,228,228,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,136,136,136,255,0,0,0,136,0,0,0,228,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,136])}),
        "3": Object.freeze({w: 11, h: 12, data: new Uint8ClampedArray([0,0,0,0,0,0,0,24,0,0,0,150,0,0,0,239,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,252,0,0,0,211,0,0,0,73,0,0,0,0,0,0,0,0,0,0,0,142,57,57,57,225,144,144,144,253,216,216,216,255,249,249,249,255,239,239,239,255,193,193,193,255,73,73,73,255,0,0,0,253,0,0,0,42,0,0,0,0,0,0,0,142,163,163,163,239,97,97,97,252,22,22,22,255,22,22,22,255,172,172,172,255,255,255,255,255,251,251,251,255,42,42,42,255,0,0,0,114,0,0,0,0,0,0,0,130,0,0,0,176,0,0,0,182,0,0,0,132,0,0,0,240,76,76,76,255,255,255,255,255,255,255,255,255,86,86,86,255,0,0,0,125,0,0,0,0,0,0,0,0,0,0,0,80,0,0,0,255,0,0,0,255,24,24,24,255,172,172,172,255,255,255,255,255,225,225,225,255,19,19,19,255,0,0,0,99,0,0,0,0,0,0,0,0,0,0,0,80,80,80,80,255,255,255,255,255,255,255,255,255,255,255,255,255,233,233,233,255,63,63,63,255,0,0,0,255,0,0,0,66,0,0,0,0,0,0,0,0,0,0,0,80,0,0,0,255,1,1,1,255,30,30,30,255,170,170,170,255,255,255,255,255,249,249,249,255,51,51,51,255,0,0,0,165,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,31,0,0,0,192,23,23,23,255,255,255,255,255,255,255,255,255,143,143,143,255,0,0,0,214,0,0,0,15,0,0,0,186,0,0,0,204,0,0,0,204,0,0,0,96,0,0,0,193,21,21,21,255,255,255,255,255,255,255,255,255,140,140,140,255,0,0,0,213,0,0,0,15,65,65,65,208,193,193,193,252,67,67,67,254,16,16,16,255,26,26,26,255,167,167,167,255,255,255,255,255,246,246,246,255,45,45,45,255,0,0,0,160,0,0,0,15,0,0,0,205,80,80,80,248,183,183,183,255,233,233,233,255,251,251,251,255,228,228,228,255,167,167,167,255,46,46,46,255,0,0,0,249,0,0,0,45,0,0,0,0,0,0,0,70,0,0,0,202,0,0,0,251,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,247,0,0,0,183,0,0,0,46,0,0,0,0])}),
        "4": Object.freeze({w: 12, h: 12, data: new Uint8ClampedArray([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,173,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,164,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,125,1,1,1,255,173,173,173,255,255,255,255,255,255,255,255,255,164,164,164,255,0,0,0,223,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,74,0,0,0,254,124,124,124,255,255,255,255,255,255,255,255,255,255,255,255,255,164,164,164,255,0,0,0,244,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,37,0,0,0,246,74,74,74,255,253,253,253,255,201,201,201,255,221,221,221,255,255,255,255,255,164,164,164,255,0,0,0,244,0,0,0,0,0,0,0,0,0,0,0,13,0,0,0,221,37,37,37,255,240,240,240,255,241,241,241,255,34,34,34,255,216,216,216,255,255,255,255,255,164,164,164,255,0,0,0,244,0,0,0,0,0,0,0,0,0,0,0,102,13,13,13,255,213,213,213,255,255,255,255,255,90,90,90,255,0,0,0,255,216,216,216,255,255,255,255,255,164,164,164,255,0,0,0,244,0,0,0,0,0,0,0,0,0,0,0,160,94,94,94,255,255,255,255,255,160,160,160,255,0,0,0,255,0,0,0,255,216,216,216,255,255,255,255,255,164,164,164,255,0,0,0,255,0,0,0,255,0,0,0,24,0,0,0,155,96,96,96,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,24,24,24,255,0,0,0,24,0,0,0,96,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,216,216,216,255,255,255,255,255,164,164,164,255,0,0,0,255,0,0,0,255,0,0,0,24,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,254,216,216,216,255,255,255,255,255,164,164,164,255,0,0,0,244,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,249,216,216,216,255,255,255,255,255,164,164,164,255,0,0,0,223,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,216,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,164,0,0,0,0,0,0,0,0])}),
        "5": Object.freeze({w: 10, h: 12, data: new Uint8ClampedArray([0,0,0,132,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,8,0,0,0,196,132,132,132,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,8,8,8,255,0,0,0,8,0,0,0,227,132,132,132,255,255,255,255,255,148,148,148,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,8,0,0,0,227,132,132,132,255,255,255,255,255,148,148,148,255,0,0,0,255,0,0,0,255,0,0,0,249,0,0,0,196,0,0,0,51,0,0,0,0,0,0,0,221,132,132,132,255,255,255,255,255,248,248,248,255,250,250,250,255,231,231,231,255,181,181,181,255,51,51,51,255,0,0,0,251,0,0,0,52,0,0,0,185,110,110,110,255,107,107,107,255,31,31,31,255,22,22,22,255,167,167,167,255,255,255,255,255,249,249,249,255,52,52,52,255,0,0,0,180,0,0,0,110,0,0,0,171,0,0,0,181,0,0,0,136,0,0,0,188,15,15,15,255,252,252,252,255,255,255,255,255,161,161,161,255,0,0,0,236,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,29,0,0,0,255,232,232,232,255,255,255,255,255,190,190,190,255,0,0,0,246,0,0,0,183,0,0,0,208,0,0,0,212,0,0,0,117,0,0,0,186,15,15,15,255,252,252,252,255,255,255,255,255,157,157,157,255,0,0,0,234,0,0,0,197,197,197,197,251,89,89,89,254,25,25,25,255,22,22,22,255,167,167,167,255,255,255,255,255,244,244,244,255,43,43,43,255,0,0,0,174,0,0,0,197,63,63,63,244,161,161,161,254,219,219,219,255,247,247,247,255,223,223,223,255,164,164,164,255,39,39,39,255,0,0,0,247,0,0,0,43,0,0,0,48,0,0,0,177,0,0,0,244,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,245,0,0,0,178,0,0,0,39,0,0,0,0])}),
        "6": Object.freeze({w: 11, h: 12, data: new Uint8ClampedArray([0,0,0,0,0,0,0,0,0,0,0,18,0,0,0,150,0,0,0,242,0,0,0,255,0,0,0,255,0,0,0,254,0,0,0,234,0,0,0,122,0,0,0,7,0,0,0,0,0,0,0,17,0,0,0,223,18,18,18,255,142,142,142,255,223,223,223,255,248,248,248,255,215,215,215,255,125,125,125,251,58,58,58,206,0,0,0,76,0,0,0,0,0,0,0,156,17,17,17,255,218,218,218,255,252,252,252,255,104,104,104,255,17,17,17,255,31,31,31,255,129,129,129,251,121,121,121,219,0,0,0,76,0,0,0,1,0,0,0,248,149,149,149,255,255,255,255,255,156,156,156,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,247,0,0,0,198,0,0,0,71,0,0,0,22,1,1,1,255,236,236,236,255,255,255,255,255,212,212,212,255,228,228,228,255,247,247,247,255,213,213,213,255,102,102,102,255,0,0,0,255,0,0,0,104,0,0,0,46,21,21,21,255,255,255,255,255,255,255,255,255,252,252,252,255,60,60,60,255,40,40,40,255,238,238,238,255,255,255,255,255,104,104,104,255,0,0,0,230,0,0,0,49,26,26,26,255,255,255,255,255,255,255,255,255,201,201,201,255,0,0,0,255,0,0,0,253,165,165,165,255,255,255,255,255,213,213,213,255,0,0,0,254,0,0,0,30,5,5,5,255,249,249,249,255,255,255,255,255,181,181,181,255,0,0,0,252,0,0,0,241,145,145,145,255,255,255,255,255,244,244,244,255,0,0,0,255,0,0,0,5,0,0,0,254,186,186,186,255,255,255,255,255,201,201,201,255,0,0,0,255,0,0,0,253,165,165,165,255,255,255,255,255,206,206,206,255,0,0,0,254,0,0,0,0,0,0,0,201,55,55,55,255,249,249,249,255,252,252,252,255,60,60,60,255,39,39,39,255,237,237,237,255,254,254,254,255,79,79,79,255,0,0,0,221,0,0,0,0,0,0,0,55,0,0,0,251,58,58,58,255,189,189,189,255,244,244,244,255,237,237,237,255,191,191,191,255,63,63,63,255,0,0,0,254,0,0,0,79,0,0,0,0,0,0,0,0,0,0,0,58,0,0,0,204,0,0,0,253,0,0,0,255,0,0,0,255,0,0,0,252,0,0,0,207,0,0,0,63,0,0,0,0])}),
        "7": Object.freeze({w: 11, h: 12, data: new Uint8ClampedArray([0,0,0,16,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,160,0,0,0,16,16,16,16,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,160,160,160,255,0,0,0,213,0,0,0,16,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,90,90,90,255,255,255,255,255,255,255,255,255,141,141,141,255,0,0,0,219,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,49,0,0,0,255,198,198,198,255,255,255,255,255,253,253,253,255,37,37,37,255,0,0,0,158,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,176,49,49,49,255,255,255,255,255,255,255,255,255,172,172,172,255,0,0,0,255,0,0,0,37,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,17,0,0,0,253,157,157,157,255,255,255,255,255,255,255,255,255,53,53,53,255,0,0,0,189,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,125,17,17,17,255,246,246,246,255,255,255,255,255,190,190,190,255,0,0,0,255,0,0,0,53,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,237,116,116,116,255,255,255,255,255,255,255,255,255,71,71,71,255,0,0,0,208,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,76,2,2,2,255,221,221,221,255,255,255,255,255,208,208,208,255,0,0,0,255,0,0,0,71,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,203,75,75,75,255,255,255,255,255,255,255,255,255,89,89,89,255,0,0,0,225,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,203,182,182,182,255,255,255,255,255,223,223,223,255,3,3,3,255,0,0,0,91,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,182,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,223,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0])}),
        "8": Object.freeze({w: 11, h: 12, data: new Uint8ClampedArray([0,0,0,0,0,0,0,15,0,0,0,151,0,0,0,241,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,254,0,0,0,228,0,0,0,110,0,0,0,0,0,0,0,0,0,0,0,176,15,15,15,255,145,145,145,255,221,221,221,255,246,246,246,255,241,241,241,255,207,207,207,255,110,110,110,255,0,0,0,255,0,0,0,102,0,0,0,0,0,0,0,245,171,171,171,255,255,255,255,255,214,214,214,255,23,23,23,255,58,58,58,255,251,251,251,255,255,255,255,255,102,102,102,255,0,0,0,195,0,0,0,0,0,0,0,250,223,223,223,255,255,255,255,255,152,152,152,255,0,0,0,254,0,0,0,255,225,225,225,255,255,255,255,255,155,155,155,255,0,0,0,212,0,0,0,0,0,0,0,240,138,138,138,255,255,255,255,255,214,214,214,255,23,23,23,255,58,58,58,255,252,252,252,255,251,251,251,255,71,71,71,255,0,0,0,183,0,0,0,0,0,0,0,211,2,2,2,255,162,162,162,255,255,255,255,255,255,255,255,255,255,255,255,255,251,251,251,255,101,101,101,255,0,0,0,255,0,0,0,137,0,0,0,17,0,0,0,255,159,159,159,255,255,255,255,255,201,201,201,255,23,23,23,255,50,50,50,255,242,242,242,255,254,254,254,255,92,92,92,255,0,0,0,222,0,0,0,37,17,17,17,255,255,255,255,255,255,255,255,255,103,103,103,255,0,0,0,241,0,0,0,254,171,171,171,255,255,255,255,255,204,204,204,255,0,0,0,249,0,0,0,37,21,21,21,255,255,255,255,255,255,255,255,255,103,103,103,255,0,0,0,241,0,0,0,254,172,172,172,255,255,255,255,255,208,208,208,255,0,0,0,250,0,0,0,21,0,0,0,255,189,189,189,255,255,255,255,255,201,201,201,255,23,23,23,255,49,49,49,255,242,242,242,255,255,255,255,255,120,120,120,255,0,0,0,230,0,0,0,0,0,0,0,193,15,15,15,255,133,133,133,255,216,216,216,255,245,245,245,255,239,239,239,255,203,203,203,255,101,101,101,255,1,1,1,255,0,0,0,121,0,0,0,0,0,0,0,15,0,0,0,140,0,0,0,237,0,0,0,254,0,0,0,255,0,0,0,255,0,0,0,253,0,0,0,224,0,0,0,102,0,0,0,1])}),
        "9": Object.freeze({w: 11, h: 12, data: new Uint8ClampedArray([0,0,0,0,0,0,0,3,0,0,0,111,0,0,0,229,0,0,0,254,0,0,0,255,0,0,0,255,0,0,0,247,0,0,0,165,0,0,0,22,0,0,0,0,0,0,0,0,0,0,0,158,3,3,3,255,109,109,109,255,210,210,210,255,246,246,246,255,232,232,232,255,156,156,156,255,22,22,22,255,0,0,0,220,0,0,0,10,0,0,0,28,0,0,0,255,157,157,157,255,255,255,255,255,192,192,192,255,18,18,18,255,127,127,127,255,255,255,255,255,215,215,215,255,10,10,10,255,0,0,0,118,0,0,0,85,28,28,28,255,254,254,254,255,255,255,255,255,93,93,93,255,0,0,0,243,18,18,18,255,255,255,255,255,255,255,255,255,112,112,112,255,0,0,0,216,0,0,0,107,64,64,64,255,255,255,255,255,255,255,255,255,73,73,73,255,0,0,0,191,0,0,0,255,252,252,252,255,255,255,255,255,182,182,182,255,0,0,0,248,0,0,0,89,34,34,34,255,255,255,255,255,255,255,255,255,93,93,93,255,0,0,0,242,17,17,17,255,255,255,255,255,255,255,255,255,209,209,209,255,0,0,0,252,0,0,0,34,0,0,0,255,183,183,183,255,255,255,255,255,191,191,191,255,17,17,17,255,125,125,125,255,255,255,255,255,255,255,255,255,204,204,204,255,0,0,0,252,0,0,0,0,0,0,0,187,15,15,15,255,148,148,148,255,227,227,227,255,248,248,248,255,216,216,216,255,230,230,230,255,255,255,255,255,164,164,164,255,0,0,0,242,0,0,0,0,0,0,0,131,0,0,0,221,0,0,0,251,0,0,0,255,0,0,0,255,4,4,4,255,226,226,226,255,255,255,255,255,76,76,76,255,0,0,0,191,0,0,0,0,0,0,0,136,153,153,153,239,92,92,92,253,16,16,16,255,30,30,30,255,160,160,160,255,255,255,255,255,163,163,163,255,0,0,0,255,0,0,0,76,0,0,0,0,0,0,0,136,56,56,56,228,161,161,161,254,230,230,230,255,247,247,247,255,207,207,207,255,108,108,108,255,2,2,2,255,0,0,0,164,0,0,0,0,0,0,0,0,0,0,0,26,0,0,0,168,0,0,0,246,0,0,0,255,0,0,0,255,0,0,0,254,0,0,0,228,0,0,0,109,0,0,0,2,0,0,0,0])}),
        "+": Object.freeze({w: 12, h: 10, data: new Uint8ClampedArray([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,244,0,0,0,251,0,0,0,251,0,0,0,172,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,244,244,244,255,172,172,172,255,0,0,0,228,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,244,244,244,255,172,172,172,255,0,0,0,246,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,132,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,244,244,244,255,172,172,172,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,64,0,0,0,196,132,132,132,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,64,64,64,255,0,0,0,112,0,0,0,196,132,132,132,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,64,64,64,255,0,0,0,112,0,0,0,132,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,244,244,244,255,172,172,172,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,244,244,244,255,172,172,172,255,0,0,0,246,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,244,244,244,255,172,172,172,255,0,0,0,228,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,244,0,0,0,251,0,0,0,251,0,0,0,172,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])}),
    }),
});

async function renderCompactBlockedCountIcon(count) {
    const text = formatCompactBlockedCount(count);
    const imageData = {};
    for (const size of Object.keys(actionIconPaths).map(Number)) {
        const digits = countDigitData[size];
        const base = getActionIconBaseImageData(size);
        const canvas = new OffscreenCanvas(size, size);
        const context = canvas.getContext("2d");
        context.putImageData(base, 0, 0);

        // Calculate total width of the count string
        let totalWidth = 0;
        const chars = [];
        for (const ch of text) {
            const d = digits[ch];
            if (d) {
                chars.push(d);
                totalWidth += d.w;
            }
        }

        // Position right-aligned at bottom of icon
        let x = Math.round(size - 0.5 - totalWidth);
        const digitHeight = size === 16 ? 8 : 12;
        const y = size - 1 - digitHeight;

        for (const d of chars) {
            context.putImageData(new ImageData(d.data, d.w, d.h), x, y);
            x += d.w;
        }

        imageData[size] = context.getImageData(0, 0, size, size);
    }
    return imageData;
}

async function clearBlockedCountIcon(tabId) {
    try {
        await Promise.all([
            chrome.action.setBadgeText({ tabId, text: "" }),
            chrome.action.setIcon({ tabId, path: actionIconPaths }),
            chrome.action.setTitle({ tabId, title: actionDefaultTitle }),
        ]);
    } catch (err) {
        console.warn("[uBR] clearBlockedCountIcon failed:", err);
    }
}

async function updateBlockedCountBadge(tabId) {
    try {
        const count = (blockedDnrCountByTab.get(tabId) || 0) +
            getBlockedCosmeticCount(tabId);
        const settings = await readUserSettings();
        if (settings.showIconBadge === false || count === 0) {
            await clearBlockedCountIcon(tabId);
            return;
        }
        const iconRender = renderCompactBlockedCountIcon(count).then(imageData =>
            chrome.action.setIcon({ tabId, imageData })
        );
        const results = await Promise.allSettled([
            iconRender,
            chrome.action.setBadgeText({ tabId, text: "" }),
            chrome.action.setTitle({
                tabId,
                title: `${actionDefaultTitle} — ${ formatCompactBlockedCount(count) } blocked`,
            }),
        ]);
        for (const r of results) {
            if (r.status === "rejected") {
                console.warn("[uBR] Badge update sub-task failed:", r.reason);
            }
        }
    } catch (err) {
        console.warn("[uBR] updateBlockedCountBadge failed:", err);
    }
}

function scheduleBlockedCountBadgeUpdate(tabId) {
    if (pendingBadgeUpdates.has(tabId)) return;
    pendingBadgeUpdates.add(tabId);
    setTimeout(() => {
        pendingBadgeUpdates.delete(tabId);
        void updateBlockedCountBadge(tabId).catch(err => { console.warn("[uBR] scheduleBlockedCountBadgeUpdate:", err); });
    }, 100);
}

function resetBlockedCountBadge(tabId) {
    blockedDnrCountByTab.delete(tabId);
    blockedCosmeticCountByTab.delete(tabId);
    pendingBadgeUpdates.delete(tabId);
    void clearBlockedCountIcon(tabId).catch(err => { console.warn("[uBR] resetBlockedCountBadge:", err); });
}

// The popup uses getMatchedRules() as its DNR source of truth.  Keep the
// action icon's event-driven total in sync whenever that same count is read:
// on some Chromium builds onRuleMatchedDebug does not deliver every match,
// which otherwise leaves the popup with a count while the icon stays empty.
async function syncBlockedDnrCountWithPopup(tabId, count) {
    if (typeof tabId !== "number" || tabId <= 0) return;
    if (count > 0) {
        blockedDnrCountByTab.set(tabId, count);
    } else {
        blockedDnrCountByTab.delete(tabId);
    }
    await updateBlockedCountBadge(tabId);
}

// Bump tab revision on DNR rule matches so popup polling detects blocked-count
// changes, and update the action badge for block rules on that same tab.
try {
  chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
      const tabId = info?.request?.tabId ?? info?.tabId;
      if (!tabId || tabId <= 0) return;
      markTabChanged(tabId);
      void pushDnrDecision(info.request, info.rule);
      void getMatchedRuleActionType(info.rule).then(actionType => {
          if (actionType !== "block") return;
          blockedDnrCountByTab.set(tabId, (blockedDnrCountByTab.get(tabId) || 0) + 1);
          scheduleBlockedCountBadgeUpdate(tabId);
      });
  });
} catch (err) {
    console.warn("[uBR] Failed to register onRuleMatchedDebug listener:", err);
}

async function buildPopupData(tabId) {
    const id = await resolveTabId(tabId);
    let tabTitle = "";
    let pageURL = "";
    let rawURL = "";
    if (id > 0) {
        try {
            const t = await chrome.tabs.get(id);
            tabTitle = t?.title || "";
            pageURL = t?.url || "";
            rawURL = pageURL;
        } catch (e) {
            console.warn("[uBR] buildPopupData: tabs.get failed for tab", id, e);
        }
    }

    const pageHostname = hostnameFromURL(pageURL);
    const pageDomain = domainFromHostname(pageHostname);
    const isSupported = isSupportedURL(pageURL);
    const manifest = chrome.runtime.getManifest();

    const storage = await chrome.storage.local.get([
    "popupPanelSections", "popupPanelOrientation",
    "popupPanelDisabledSections", "popupPanelLockedSections",
    "firewallPaneMinimized", "selectedFilterLists",
    ]);

    const tabBlocked = await getDNRMatchedCount(id);
    const globalBlocked = await getDNRMatchedCount();
    // The badge must agree with the figure displayed in the popup. This also
    // recovers from a missed declarativeNetRequest debug event.
    // Guard against badge-side failures leaking into popup data.
    try { await syncBlockedDnrCountWithPopup(id, tabBlocked); } catch (err) { console.warn("[uBR] buildPopupData badge sync:", err); }

    const tabStats = reqStats.byTab.get(id);
    const pageBlocked = { any: tabBlocked, script: 0, frame: 0 };
    const pageAllowed = {
    any: tabStats?.allowed.any || 0,
    script: tabStats?.allowed.script || 0,
    frame: tabStats?.allowed.frame || 0,
    };

    const hostnameDict = {};
    for (const [hn, h] of hostnameStats) {
        hostnameDict[hn] = {
      domain: h.domain,
      counts: {
        allowed: { any: h.allowed.any, script: h.allowed.script, frame: h.allowed.frame },
        // DNR blocked attribution is page-level only — per-hostname blocked stays 0
        // unless exact request hostname data is available.
        // MV3 limitation: getMatchedRules() returns ruleId/tabId/timestamp but NOT
        // the blocked URL, so we cannot attribute per-hostname.
        blocked: { any: 0, script: 0, frame: 0 },
      },
        };
    }
    // Always include current page hostname and its domain even with zero counts
    if (pageHostname && !hostnameDict[pageHostname]) {
        hostnameDict[pageHostname] = {
      domain: pageDomain,
      counts: {
        allowed: { any: 0, script: 0, frame: 0 },
        blocked: { any: 0, script: 0, frame: 0 },
      },
        };
    }
    if (pageDomain && pageDomain !== pageHostname && !hostnameDict[pageDomain]) {
        hostnameDict[pageDomain] = {
      domain: pageDomain,
      counts: {
        allowed: { any: 0, script: 0, frame: 0 },
        blocked: { any: 0, script: 0, frame: 0 },
      },
        };
    }

    const trusted = isURLTrusted(pageURL);
    const policy = resolvePagePolicy({
        url: pageURL,
        hostname: pageHostname,
        trusted,
        netFilteringEnabled: trusted ? false : getEffectiveNetFiltering(pageHostname),
        hostnameSwitches: getEffectiveHostnameSwitches(pageHostname),
    });
    const netFilteringSwitch = trusted ? false : getEffectiveNetFiltering(pageHostname);
    const noPopups = !policy.popupsAllowed;
    const noLargeMedia = !policy.largeMediaAllowed;
    const noCosmeticFiltering = !policy.cosmeticFilteringEnabled;
    const noRemoteFonts = !policy.remoteFontsAllowed;
    const noScripting = !policy.scriptletsEnabled;
    const advancedUserEnabled = popupSettings.advancedUserEnabled === true;
    const colorBlindFriendly = popupSettings.colorBlindFriendly === true;
    const tooltipsDisabled = popupSettings.tooltipsDisabled === true;
    const popupPanelHeightMode = popupSettings.popupPanelHeightMode || 0;
    const godMode = popupSettings.godMode === true;
    const matrixIsDirty = computeMatrixIsDirty(pageHostname);
    // Read stored firewallPaneMinimized; default false (expanded, not minimized)
    const firewallPaneMinimized = storage.firewallPaneMinimized !== undefined
        ? storage.firewallPaneMinimized === true
        : false;

    return {
    tabId: id,
    tabTitle,
    appName: manifest.name || "uBlock Resurrected",
    appVersion: manifest.version || "0.0.0.0",
    rawURL,
    pageURL,
    pageHostname,
    pageDomain,
    contentLastModified: getTabRevision(id),

    netFilteringSwitch,
    advancedUserEnabled,
    matrixIsDirty,
    canElementPicker: isSupported && /^https?:\/\/(chrome\.google\.com|chromewebstore\.google\.com)\//.test(pageURL) === false,
    userFiltersAreEnabled: Array.isArray(storage.selectedFilterLists) ? storage.selectedFilterLists.includes("user-filters") : true,
    colorBlindFriendly,
    firewallPaneMinimized,
    tooltipsDisabled,
    popupPanelHeightMode,
    popupPanelOrientation: storage.popupPanelOrientation || "portrait",
    popupPanelSections: typeof storage.popupPanelSections === "number" ? storage.popupPanelSections : 0b1111,
    popupPanelDisabledSections: typeof storage.popupPanelDisabledSections === "number" ? storage.popupPanelDisabledSections : 0,
    popupPanelLockedSections: typeof storage.popupPanelLockedSections === "number" ? storage.popupPanelLockedSections : 0,
    fontSize: popupSettings.fontSize || "unset",
    uiPopupConfig: popupSettings.uiPopupConfig,
    godMode,

    noPopups,
    noLargeMedia,
    noCosmeticFiltering,
    noRemoteFonts,
    noScripting,

    popupBlockedCount: tabBlocked,
    // DNR getMatchedRules() does not distinguish request types — large media and
    // remote font blocked counts cannot be attributed per-type under MV3.
    largeMediaCount: 0,
    remoteFontCount: 0,

    globalBlockedRequestCount: globalBlocked,
    globalAllowedRequestCount: reqStats.globalAllowed.any,
    pageCounts: { blocked: pageBlocked, allowed: pageAllowed },
    hostnameDict,
    cnameMap: [],
    firewallRules: getEffectiveFirewallRules(pageHostname, hostnameDict),
    hasUnprocessedRequest: tabUnprocessedRequest.has(id),
    };
}

// ---------------------------------------------------------------------------
// Badge counting scripts
// ---------------------------------------------------------------------------

async function getHiddenElementCount(tabId) {
    try {
        const results = await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      func: () => {
          let count = 0;
          for (const el of document.querySelectorAll("*")) {
              const cs = getComputedStyle(el);
              if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0) count++;
          }
          return count;
      },
        });
        return results.reduce((sum, r) => sum + (Number(r.result) || 0), 0);
    } catch (e) {
        console.warn("[uBR] getHiddenElementCount: executeScript failed", tabId, e);
        return -1;
    }
}

async function getScriptCount(tabId) {
    try {
        const results = await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      func: () => document.scripts.length,
        });
        return results.reduce((sum, r) => sum + (Number(r.result) || 0), 0);
    } catch (e) {
        console.warn("[uBR] getScriptCount: executeScript failed", tabId, e);
        return 0;
    }
}

// ---------------------------------------------------------------------------
// VAPI (localStorage + userCSS)
// ---------------------------------------------------------------------------
async function handleVAPI(msg, senderTabId) {
    if (msg?.what === "localStorage") {
        const key = msg?.args?.[0];
        const value = msg?.args?.[1];
        try {
            switch (msg.fn) {
            case "getItemAsync": {
                const r = await chrome.storage.local.get(key);
                return r[key] ?? null;
            }
            case "setItem": {
                await chrome.storage.local.set({ [key]: value });
                return null;
            }
            case "removeItem": {
                await chrome.storage.local.remove(key);
                return null;
            }
            case "clear": {
                await chrome.storage.local.clear();
                return null;
            }
            default: return { error: `Unknown localStorage fn: ${  msg.fn}` };
            }
        } catch (e) {
            return { error: String(e?.message || e) };
        }
    }

    if (msg?.what === "userCSS") {
        const tabId = msg._tabId || senderTabId;
        const addCSS = msg.add;
        const removeCSS = msg.remove;
        try {
            if (addCSS && Array.isArray(addCSS) && addCSS.length > 0 && tabId) {
                await chrome.scripting.insertCSS({
          target: { tabId },
          css: addCSS.join("\n"),
                });
            }
            if (removeCSS && Array.isArray(removeCSS) && removeCSS.length > 0 && tabId) {
                await chrome.scripting.removeCSS({
          target: { tabId },
          css: removeCSS.join("\n"),
                });
            }
        } catch (e) {
      console.warn("[uBR] userCSS error:", e);
        }
        return null;
    }

    return { error: `Unknown vapi message: ${  msg?.what}` };
}

// ---------------------------------------------------------------------------
// Capability layer action permissions
// ---------------------------------------------------------------------------

const ALLOWED_LAYER_ACTIONS = {
    cosmetic: ["hide", "remove-style", "inject-css", "hide-element", "unhide-element", "picker-launch", "picker-create-filter", "dom-remove"],
    video: ["observe", "hide", "remove", "neutralize-click", "skip-click", "mark"],
    smart: ["smart-style", "smart-observe", "smart-hide", "smart-unhide", "smart-limited-dom-mutation", "smart-selector-update", "smart-rollback"],
    interceptors: ["fetch-wrap", "xhr-wrap", "mutate-fetch-response", "mutate-xhr-response", "observe-dom", "response-mutation"],
};

// ---------------------------------------------------------------------------
// Content script handler
// ---------------------------------------------------------------------------
async function handleContentscript(msg, senderTabId, senderFrameId) {
    const tabId = msg.tabId || msg._tabId || senderTabId;
    const senderDocumentId = msg.documentId || msg._documentId || null;

    switch (msg.what) {

    case "retrieveContentScriptParameters": {
        const hostname = msg.hostname || hostnameFromURL(msg.url || "");
        const isYouTubePage = hostname !== "" && youtubeScopeApplies(hostname);
        if (isYouTubePage) {
            await cleanupStaleYouTubeMastheadFilters();
        }
        // Build cosmetic filters from user custom filters
        const userResult = await buildUserCosmeticFilters(hostname);
        // Also load compiled filter list cosmetic filters
        let compiledCSS = "";
        let compiledProcedural = [];
        try {
            const stored = await chrome.storage.local.get(["cosmeticFiltersData"]);
            if (stored.cosmeticFiltersData) {
                const data = typeof stored.cosmeticFiltersData === "string"
                    ? JSON.parse(stored.cosmeticFiltersData)
                    : stored.cosmeticFiltersData;
                if (Array.isArray(data.specificCosmeticFilters)) {
                    const hostnameParts = hostname.split(".");
                    for (const entry of data.specificCosmeticFilters) {
                        if (!entry || !entry.domains || !entry.selector) continue;
                        const matches = entry.domains.some(d => {
                            const cleaned = d.replace(/^~/, "");
                            if (cleaned === hostname) return true;
                            if (hostname.endsWith(`.${  cleaned}`)) return true;
                            return false;
                        });
                        if (matches) {
                            if (/^:/.test(entry.selector) || entry.selector.includes(":has(") || entry.selector.includes(":has-text(")) {
                                compiledProcedural.push({ selector: entry.selector });
                            } else {
                                compiledCSS += `${entry.selector} { display: none !important; }\n`;
                            }
                        }
                    }
                }
                if (Array.isArray(data.genericCosmeticFilters)) {
                    for (const sel of data.genericCosmeticFilters) {
                        if (!sel) continue;
                        if (/^:/.test(sel) || sel.includes(":has(") || sel.includes(":has-text(")) {
                            compiledProcedural.push({ selector: sel });
                        } else {
                            compiledCSS += `${sel} { display: none !important; }\n`;
                        }
                    }
                }
            }
        } catch (e) {
            console.warn("[uBR] Error loading compiled cosmetic filters:", e);
        }
        const allCSS = [userResult.injectedCSS, compiledCSS].filter(Boolean).join("\n");
        const allProcedural = [...(userResult.proceduralFilters || []), ...compiledProcedural];
        const allExceptions = [...(userResult.exceptionFilters || [])];
        const policy = resolvePagePolicy({
            url: msg.url || "",
            hostname,
            trusted: isURLTrusted(msg.url || ""),
            netFilteringEnabled: getEffectiveNetFiltering(hostname),
            hostnameSwitches: getEffectiveHostnameSwitches(hostname),
        });
        return {
        tabId,
        url: msg.url || "",
        hostname,
        origin: msg.origin || "",
        noCosmeticFiltering: !policy.cosmeticFilteringEnabled,
        noGenericCosmeticFiltering: !policy.cosmeticField.generic,
        noSpecificCosmeticFiltering: !policy.cosmeticField.specific,
        noProceduralCosmeticFiltering: !policy.cosmeticField.procedural,
        noSmartCosmeticFiltering: !policy.cosmeticField.smart,
        specificCosmeticFilters: {
          ready: true,
          injectedCSS: allCSS,
          proceduralFilters: allProcedural,
          exceptionFilters: allExceptions,
          exceptedFilters: [],
          convertedProceduralFilters: [],
        },
        genericCosmeticFiltersHidden: false,
        scriptletInjectable: policy && policy.scriptlets !== "off", // gated by policy
        scriptletWillInject: policy && policy.scriptlets !== "off", // gated by policy
        trustedScriptletTokens: [],
        tabId,
        userStyles: "",
        userScripts: "",
        popupPanelType: "legacy",
        experimentalHeuristicInterceptorsEnabled: popupSettings.experimentalHeuristicInterceptorsEnabled === true,
        firstPartyDomDetection: policy?.contentScript?.firstPartyDomDetection === true,
        };
    }

    case "getCosmeticSelectorsForDomain": {
        return { ok: true, selectors: [] };
    }

    case "retrieveGenericCosmeticSelectors": {
        return { result: undefined };
    }

    case "onDomReady":
    case "enableCSS":
    case "disableCSS": {
        return { ok: true };
    }

    case "getCollapsibleBlockedRequests": {
        return { requests: [] };
    }

    case "cosmeticBlockCount": {
        const count = Math.max(0, Number(msg.count) || 0);
        if ( typeof tabId === "number" && tabId > 0 ) {
            // A content-script report is a snapshot of elements which are
            // presently in the DOM. It can legitimately be lower than the
            // number already counted for this page (for example, an element
            // picker just hid an element before its storage update triggers a
            // re-scan). Do not let that delayed re-scan make the badge go
            // backwards during a navigation.
            reportBlockedCosmeticCount(tabId, senderFrameId, count, msg.clear === true);
            scheduleBlockedCountBadgeUpdate(tabId);
        }
        return { ok: true };
    }

    case "getPagePolicy": {
        // Diagnostic-only: returns the resolved policy without creating a snapshot
        const hostname = msg.hostname || hostnameFromURL(msg.url || "");
        const trusted = msg.trusted || false;
        const hasKnownFilterSupport = msg.hasKnownFilterSupport || false;
        const policy = resolvePagePolicy({
            url: msg.url || "",
            hostname,
            trusted,
            netFilteringEnabled: true,
            hasKnownFilterSupport,
            pageSignals: msg.pageSignals || {},
        });

        return { policy };
    }

    case "getPageActivation": {
        // ── 1. Resolve policy once ────────────────────────────────────────
        const hostname = msg.hostname || hostnameFromURL(msg.url || "");
        const policy = resolvePagePolicy({
            url: msg.url || "",
            hostname,
            trusted: msg.trusted || false,
            netFilteringEnabled: true,
            hasKnownFilterSupport: msg.hasKnownFilterSupport || false,
            pageSignals: msg.pageSignals || {},
        });

        // ── 2. Apply feature expiry gates ─────────────────────────────────
        if (policy && policy.video && featureExpiryGates.isExpired("genericVideoMutation")) {
            policy.video.allowMutation = false;
            policy.video.allowSkipClick = false;
        }
        if (policy && policy.smartCosmetic && featureExpiryGates.isExpired("smartCosmetics")) {
            policy.smartCosmetic = false;
            policy.contentScript.loadSmartRuntime = false;
        }
        if (policy && policy.contentScript && featureExpiryGates.isExpired("firstPartyDomDetection")) {
            policy.contentScript.firstPartyDomDetection = false;
        }
        if (policy && policy.antiAdblockCountermeasures && featureExpiryGates.isExpired("antiAdblockCountermeasures")) {
            policy.antiAdblockCountermeasures = false;
        }

        // ── 3. Create ONE policy snapshot ─────────────────────────────────
        const snapshot = PolicySnapshot.create(
            senderTabId,
            senderFrameId,
            msg.documentId || null,
            msg.url || "",
            policy,
        );

        // ── 4. Compute active layers ──────────────────────────────────────
        const activeLayers = [];
        if (policy && policy.contentScript && policy.contentScript.loadCosmeticRuntime) {
            activeLayers.push("cosmetic");
        }
        if (policy && policy.contentScript && policy.contentScript.loadVideoRuntime) {
            activeLayers.push("video");
        }
        if (policy && policy.contentScript && policy.contentScript.loadSmartRuntime) {
            activeLayers.push("smart");
        }
        if (policy && policy.contentScript && policy.contentScript.loadInterceptors) {
            activeLayers.push("interceptors");
        }

        // ── 5. Issue tokens ───────────────────────────────────────────────
        const tokens = {};
        for (const layer of activeLayers) {
            tokens[layer] = snapshot._issueToken(layer);
        }

        // ── 6. Inject into MAIN world ─────────────────────────────────────
        const errors = [];
        let approvedFiles = [];
        if (senderTabId != null && senderFrameId != null && activeLayers.length > 0) {
            const layerFileMap = {
                cosmetic: "/js/contentscript.js",
                smart: "/js/smart-content.js",
                video: "/js/video-adblock-generic.js",
                interceptors: "/js/contentscript.js",
            };
            approvedFiles = [...new Set(activeLayers
                .map(l => layerFileMap[l])
                .filter(Boolean))];

            try {
                await chrome.tabs.get(senderTabId);

                // Seed tokens, revision, AND policy into MAIN world
                await chrome.scripting.executeScript({
                    target: { tabId: senderTabId, frameIds: [senderFrameId] },
                    func: (tokens, revision, policy) => {
                        self.__uborTokens = tokens;
                        self.__uborPolicyRevision = revision;
                        self.__uborPagePolicy = policy;
                    },
                    args: [tokens, snapshot.revision, policy],
                    world: "MAIN",
                });

                await chrome.scripting.executeScript({
                    target: { tabId: senderTabId, frameIds: [senderFrameId] },
                    files: ["/js/capability-enforcer.js"],
                    world: "MAIN",
                });

                for (const file of approvedFiles) {
                    await chrome.scripting.executeScript({
                        target: { tabId: senderTabId, frameIds: [senderFrameId] },
                        files: [file],
                        world: "MAIN",
                    });
                }
            } catch (e) {
                errors.push(e.message || String(e));
            }
        }

        return {
            ok: errors.length === 0,
            activeLayers,
            policyRevision: snapshot.revision,
            tokens,
            policy,
            injectedFiles: approvedFiles.length,
            approvedFileCount: approvedFiles.length,
            errors: errors.length > 0 ? errors : undefined,
        };
    }

    case "getPageDiagnostics": {
        // Test-mode-only diagnostics endpoint for e2e verification.
        // Returns resolved policy, active layers, tokens, and snapshot info
        // for the given tab. Gated by self.__ubrTestMode; silently returns
        // minimal data when not in test mode.
        const isTestMode = self.__ubrTestMode === true;
        if (!isTestMode || senderTabId == null) {
            return {
                available: false,
                hint: "set self.__ubrTestMode=true and provide tabId",
                profileId: null,
                activeLayers: [],
                tokens: {},
            };
        }
        const diagnosticsSnapshot = senderTabId != null
            ? PolicySnapshot.getActiveSnapshotForTab
                ? PolicySnapshot.getActiveSnapshotForTab(senderTabId)
                : null
            : null;
        if (!diagnosticsSnapshot) {
            const policyOnly = resolvePagePolicy({
                url: msg.url || "",
                hostname: msg.hostname || hostnameFromURL(msg.url || ""),
                trusted: false,
                netFilteringEnabled: true,
                hasKnownFilterSupport: false,
                pageSignals: {},
            });
            const cs = policyOnly && policyOnly.contentScript || {};
            const active = [];
            if (cs.loadCosmeticRuntime) active.push("cosmetic");
            if (cs.loadVideoRuntime) active.push("video");
            if (cs.loadSmartRuntime) active.push("smart");
            if (cs.loadInterceptors) active.push("interceptors");
            return {
                available: true,
                fromSnapshot: false,
                profileId: policyOnly ? policyOnly.profileId || "unknown" : "unknown",
                activeLayers: active,
                policySummary: {
                    network: policyOnly ? policyOnly.network || "off" : "off",
                    cosmetic: policyOnly ? policyOnly.cosmetic || "off" : "off",
                    contentScript: {
                        loadCosmeticRuntime: cs.loadCosmeticRuntime === true,
                        loadSmartRuntime: cs.loadSmartRuntime === true,
                        loadVideoRuntime: cs.loadVideoRuntime === true,
                        loadInterceptors: cs.loadInterceptors === true,
                    },
                },
                tokens: {},
                revision: "",
            };
        }
        const dp = diagnosticsSnapshot.policy || {};
        const dcs = dp.contentScript || {};
        const dActive = [];
        if (dcs.loadCosmeticRuntime) dActive.push("cosmetic");
        if (dcs.loadVideoRuntime) dActive.push("video");
        if (dcs.loadSmartRuntime) dActive.push("smart");
        if (dcs.loadInterceptors) dActive.push("interceptors");
        return {
            available: true,
            fromSnapshot: true,
            profileId: dp.profileId || "unknown",
            activeLayers: dActive,
            deniedLayers: ["cosmetic", "video", "smart", "interceptors"].filter(l => !dActive.includes(l)),
            policySummary: {
                network: dp.network || "off",
                cosmetic: dp.cosmetic || "off",
                genericCosmetic: dp.genericCosmetic === true,
                genericVideo: dp.genericVideo || "off",
                contentScript: {
                    loadCosmeticRuntime: dcs.loadCosmeticRuntime === true,
                    loadSmartRuntime: dcs.loadSmartRuntime === true,
                    loadVideoRuntime: dcs.loadVideoRuntime === true,
                    loadInterceptors: dcs.loadInterceptors === true,
                },
            },
            tokens: diagnosticsSnapshot.tokens
                ? Object.keys(diagnosticsSnapshot.tokens).map(k => ({ layer: k }))
                : [],
            revision: diagnosticsSnapshot.revision || "",
        };
    }

    case "validateToken": {
        // ── 1. Fail closed: missing sender identity ─────────────────────
        if (senderTabId == null) return { valid: false, reason: "missing-sender-tab" };
        if (senderFrameId == null) return { valid: false, reason: "missing-sender-frame" };

        const token = PolicySnapshot.getTokenById(msg.tokenId);
        if (!token) return { valid: false, reason: "token-not-found" };

        // ── 2. Fail closed: missing token identity ──────────────────────
        if (token.tabId == null) return { valid: false, reason: "token-missing-tab" };
        if (token.frameId == null) return { valid: false, reason: "token-missing-frame" };

        // ── 3. Sender identity match (unconditional) ────────────────────
        if (senderTabId !== token.tabId) return { valid: false, reason: "wrong-tab" };
        if (senderFrameId !== token.frameId) return { valid: false, reason: "wrong-frame" };

        // ── 4. Document ID match ─────────────────────────────────────────
        if (senderDocumentId && token.documentId && senderDocumentId !== token.documentId) {
            return { valid: false, reason: "wrong-document" };
        }

        // ── 5. Layer check ───────────────────────────────────────────────
        if (token.layer !== msg.layer) {
            return { valid: false, reason: "wrong-layer" };
        }

        // ── 6. Fail closed: require action for every validation ─────────
        if (!msg.action) return { valid: false, reason: "missing-action" };

        // ── 7. Fail closed: layer must have action allowlist ─────────────
        const layerActions = ALLOWED_LAYER_ACTIONS[token.layer];
        if (!layerActions) return { valid: false, reason: "unknown-layer" };

        // ── 8. Action must be allowed ────────────────────────────────────
        if (!layerActions.includes(msg.action)) {
            return { valid: false, reason: "action-not-allowed" };
        }

        // ── 9. Snapshot and revision check ───────────────────────────────
        const snap = PolicySnapshot.get(token.tabId, token.frameId);
        if (!snap) return { valid: false, reason: "no-snapshot" };
        if (token.revision !== snap.revision) return { valid: false, reason: "stale-revision" };

        // ── 10. Expiry check ─────────────────────────────────────────────
        if (token.expiresAt && Date.now() > token.expiresAt) {
            return { valid: false, reason: "token-expired" };
        }

        return { valid: true, layer: token.layer };
    }

    default: {
        return { error: `Unhandled contentscript request: ${  msg.what}` };
    }
    }
}

// ---------------------------------------------------------------------------
// Popup panel handlers
// ---------------------------------------------------------------------------
let popupPortTabId = 0;

async function handlePopupPanel(msg) {
    const rawTabId = Number(msg?.tabId) || Number(msg?._tabId) || 0;

    switch (msg.what) {

    case "getPopupData": {
        return buildPopupData(rawTabId);
    }

    case "toggleNetFiltering": {
        const hostname = hostnameFromURL(msg.url || "");
        if (!hostname) return { ok: false, error: "No hostname" };
        if (isURLTrusted(msg.url || "")) return buildPopupData(rawTabId);
        const state = msg.state === true || msg.state === false ? msg.state : true;
      sessionNetFiltering.set(hostname, state);
      if (msg.scope !== "page") {
          // Site scope — also store for root domain
          const domain = domainFromHostname(hostname);
          if (domain !== hostname) sessionNetFiltering.set(domain, state);
      }
      if (msg.persist || msg.scope === "page") {
          permanentNetFiltering[hostname] = state;
          await chrome.storage.local.set({
          [STORAGE_KEY_PERM_NET_FILTERING]: permanentNetFiltering,
          });
      }
      const tabId = await resolveTabId(rawTabId);
      if (tabId > 0) markTabChanged(tabId);
      PolicySnapshot.invalidateAll({ reason: "net-filtering-toggle" });
      return buildPopupData(rawTabId);
    }

    case "toggleHostnameSwitch": {
        const hostname = msg.hostname || "";
        if (!hostname) return { ok: false, error: "No hostname" };
        const field = SWITCH_ID_TO_FIELD[msg.name];
        if (!field) return { ok: false, error: `Unknown switch: ${  msg.name}` };
        if (!sessionHostnameSwitches.has(hostname)) {
        sessionHostnameSwitches.set(hostname, {});
        }
      sessionHostnameSwitches.get(hostname)[field] = msg.state === true;
      if (msg.persist) {
          if (!permanentHostnameSwitches[hostname]) permanentHostnameSwitches[hostname] = {};
          permanentHostnameSwitches[hostname][field] = msg.state === true;
          await chrome.storage.local.set({
          [STORAGE_KEY_PERM_HOSTNAME_SWITCHES]: permanentHostnameSwitches,
          });
      }
      const tabId = await resolveTabId(rawTabId);
      if (tabId > 0) markTabChanged(tabId);
      PolicySnapshot.invalidateAll({ reason: "hostname-switch-toggle" });
      return buildPopupData(rawTabId);
    }

    case "toggleFirewallRule": {
        const pageHostname = msg.pageHostname || "";
        const srcHostname = msg.srcHostname || "*";
        const desHostname = msg.desHostname || "*";
        const requestType = msg.requestType || "*";
        const action = Number(msg.action) || 0;
        // Frontend sends global source "*" or local source (pageHostname)
        // For consistency, store the effective source
        const effectiveSrc = srcHostname === "*" ? "*" : pageHostname;
        const key = `${effectiveSrc} ${desHostname} ${requestType}`;
        if (action === 0) {
        // Remove from both session and permanent — this ensures clicking
        // an own-rule cell to unset it actually removes the rule even after
        // saveFirewallRules has copied it to permanent storage.
        sessionFirewallRules.delete(key);
        delete permanentFirewallRules[key];
        await chrome.storage.local.set({
          [STORAGE_KEY_PERM_FIREWALL_RULES]: permanentFirewallRules,
        });
        } else {
            const value = `${effectiveSrc} ${desHostname} ${requestType} ${action}`;
        sessionFirewallRules.set(key, value);
        if (msg.persist) {
            permanentFirewallRules[key] = `${effectiveSrc} ${desHostname} ${requestType} ${action}`;
            await chrome.storage.local.set({
            [STORAGE_KEY_PERM_FIREWALL_RULES]: permanentFirewallRules,
            });
        }
        }
        const tabId = await resolveTabId(rawTabId);
        if (tabId > 0) markTabChanged(tabId);
        return buildPopupData(rawTabId);
    }

    case "saveFirewallRules": {
        // Copy session → permanent
        const hostname = msg.srcHostname || "";
        // Save hostname switches
        if (hostname && sessionHostnameSwitches.has(hostname)) {
            if (!permanentHostnameSwitches[hostname]) permanentHostnameSwitches[hostname] = {};
        Object.assign(permanentHostnameSwitches[hostname], sessionHostnameSwitches.get(hostname));
        }
        // Save net filtering
        if (hostname && sessionNetFiltering.has(hostname)) {
            permanentNetFiltering[hostname] = sessionNetFiltering.get(hostname);
        }
        // Save firewall rules
        for (const [key, value] of sessionFirewallRules) {
            permanentFirewallRules[key] = value;
        }
        await chrome.storage.local.set({
        [STORAGE_KEY_PERM_NET_FILTERING]: permanentNetFiltering,
        [STORAGE_KEY_PERM_HOSTNAME_SWITCHES]: permanentHostnameSwitches,
        [STORAGE_KEY_PERM_FIREWALL_RULES]: permanentFirewallRules,
        });
        const tabId = await resolveTabId(rawTabId);
        if (tabId > 0) markTabChanged(tabId);
        return buildPopupData(rawTabId);
    }

    case "revertFirewallRules": {
        const hostname = msg.srcHostname || "";
        if (hostname) {
            sessionHostnameSwitches.delete(hostname);
            sessionNetFiltering.delete(hostname);
            // Only remove session firewall rules scoped to this hostname
            for (const key of sessionFirewallRules.keys()) {
                const parts = key.split(" ");
                if (parts.length >= 1 && (parts[0] === hostname || parts[0] === "*")) {
                    sessionFirewallRules.delete(key);
                }
            }
        }
        const tabId = await resolveTabId(rawTabId);
        if (tabId > 0) markTabChanged(tabId);
        return buildPopupData(rawTabId);
    }

    case "getHiddenElementCount":
    case "getScriptCount": {
        const tabId = await resolveTabId(rawTabId);
        if (msg.what === "getHiddenElementCount") return getHiddenElementCount(tabId);
        return getScriptCount(tabId);
    }

    case "hasPopupContentChanged": {
        const tabId = await resolveTabId(rawTabId);
        const lastModified = Number(msg.contentLastModified) || 0;
        const current = getTabRevision(tabId);
        return current > lastModified;
    }

    case "getPopupStats": {
        const tabId = await resolveTabId(rawTabId);
        const tabBlocked = await getDNRMatchedCount(tabId);
        await syncBlockedDnrCountWithPopup(tabId, tabBlocked);
        const tabStats = reqStats.byTab.get(tabId);
        return {
        blocked: { any: tabBlocked, script: 0, frame: 0 },
        allowed: {
          any: tabStats?.allowed.any || 0,
          script: tabStats?.allowed.script || 0,
          frame: tabStats?.allowed.frame || 0,
        },
        };
    }

    case "gotoURL": {
        const url = msg?.details?.url;
        if (url) {
            const fullUrl = url.startsWith("http") || url.startsWith("chrome-extension://")
                ? url
                : chrome.runtime.getURL(url);
            try {
                await chrome.tabs.create({ url: fullUrl, active: true });
            } catch (e) {
                console.warn("[uBR] gotoURL: tabs.create failed", fullUrl, e);
            }
        }
        return { ok: true };
    }

    case "userSettings": {
        if (msg.name && msg.value !== undefined) {
        // Frontend-facing popup UI keys (popupPanelSections, firewallPaneMinimized, etc.)
        // go directly to chrome.storage.local as the frontend reads them via vAPI.localStorage
            await chrome.storage.local.set({ [msg.name]: msg.value });
            // Also mirror to backend settings if it's a known key
            if (["colorBlindFriendly", "tooltipsDisabled", "popupPanelHeightMode",
             "godMode", "advancedUserEnabled", "fontSize", "uiPopupConfig"].includes(msg.name)) {
                popupSettings[msg.name] = msg.value;
                await chrome.storage.local.set({ [STORAGE_KEY_POPUP_SETTINGS]: popupSettings });
            }
        }
        return { ok: true };
    }

    case "dismissUnprocessedRequest": {
        const tabId = await resolveTabId(rawTabId);
        if (tabId > 0) {
        tabUnprocessedRequest.delete(tabId);
        markTabChanged(tabId);
        }
        return { ok: true };
    }

    case "reloadTab": {
        const tabId = await resolveTabId(rawTabId);
        if (tabId > 0) {
            await pushTabReloadMarker(tabId);
            // If a URL is provided and differs from current, navigate to it
            // (handles interstitial/blocked-page recovery)
            if (msg.url) {
                try {
                    const t = await chrome.tabs.get(tabId);
                    if (t?.url !== msg.url) {
                        await chrome.tabs.update(tabId, { url: msg.url });
                    } else {
                        await chrome.tabs.reload(tabId, { bypassCache: !!msg.bypassCache });
                    }
                } catch (e) {
                    console.warn("[uBR] reloadTab: tabs.get failed", tabId, e);
                    try { await chrome.tabs.reload(tabId, { bypassCache: !!msg.bypassCache }); } catch (_) {}
                }
            } else {
                try {
                    await chrome.tabs.reload(tabId, { bypassCache: !!msg.bypassCache });
                } catch (e) {
                    console.warn("[uBR] reloadTab: tabs.reload failed", tabId, e);
                }
            }
            if (msg.select) {
                try {
                    await chrome.tabs.update(tabId, { active: true });
                } catch (e) {
                    console.warn("[uBR] reloadTab: tabs.update failed", tabId, e);
                }
            }
            markTabChanged(tabId);
        }
        return { ok: true };
    }

    case "launchElementPicker": {
        // Frontend uses direct MV3 imports for zapper/picker.
        // This handler exists for compatibility with fallback paths.
        return { unsupported: true, message: "Use frontend MV3 helper directly" };
    }

    case "launchReporter": {
        chrome.tabs.create({ url: chrome.runtime.getURL("logger-ui.html"), active: true }).catch(e => { console.warn("[uBR] tabs.create launchReporter:", e); });
        return { ok: true };
    }

    default: {
        return buildPopupData(rawTabId);
    }
    }
}

// ---------------------------------------------------------------------------
// Logger UI handler
// ---------------------------------------------------------------------------
async function handleLoggerUI(msg) {
    switch (msg.what) {

    case "readAll": {
        const ownerId = Number(msg.ownerId);
        const entries = loggerBackend.readAll(ownerId);
        if (entries && typeof entries === "object" && entries.unavailable === true) {
            return { unavailable: true };
        }
        const tabIds = await getLoggerTabs();
        const activeTab = await getActivePageTab();
        const activeTabId = activeTab?.id || (tabIds.length > 0 ? tabIds[0][0] : 0);
        return {
        activeTabId,
        tabIds,
        tabIdsToken: String(Date.now()),
        colorBlind: popupSettings.colorBlindFriendly === true,
        tooltips: popupSettings.tooltipsDisabled !== true,
        entries,
        };
    }

    case "releaseView": {
      loggerBackend.release(Number(msg.ownerId));
      return { ok: true };
    }

    case "hasInMemoryFilter": {
        return typeof msg.filter === "string" ? inMemoryFilters.has(msg.filter) : false;
    }

    case "toggleInMemoryFilter": {
        const filter = String(msg.filter || "");
        if (!filter) return false;
        if (inMemoryFilters.has(filter)) {
        inMemoryFilters.delete(filter);
        return false;
        }
      inMemoryFilters.add(filter);
      return true;
    }

    case "getURLFilteringData": {
        const context = msg.context || "";
        const type = msg.type || "*";
        const urls = Array.isArray(msg.urls) ? msg.urls : [];
        const colors = {};
        let dirty = false;
        for (const url of urls) {
            const sessionKey = `${context} ${url} ${type}`;
            const permKey = `${context} ${url} ${type}`;
            const sessionVal = sessionURLFilteringRules.get(sessionKey);
            const permVal = permanentURLFilteringRules[permKey];
            let r = 0;
            if (permVal !== undefined) r = Number(permVal);
            const own = sessionVal !== undefined && sessionVal !== permVal;
            if (own) dirty = true;
            if (sessionVal !== undefined) {
                r = Number(sessionVal);
            }
            colors[url] = { r, own };
        }
        return { dirty, colors };
    }

    case "setURLFilteringRule": {
        const context = msg.context || "";
        const url = msg.url || "";
        const type = msg.type || "*";
        const action = Number(msg.action) || 0;
        const key = `${context} ${url} ${type}`;
        if (action === 0) {
        sessionURLFilteringRules.delete(key);
        } else {
        sessionURLFilteringRules.set(key, String(action));
        }
        if (msg.persist) {
            if (action === 0) {
                delete permanentURLFilteringRules[key];
            } else {
                permanentURLFilteringRules[key] = String(action);
            }
            await chrome.storage.local.set({ [STORAGE_KEY_URL_FILTERING]: permanentURLFilteringRules });
        }
        return { ok: true };
    }

    case "saveURLFilteringRules": {
        const context = msg.context || "";
        const type = msg.type || "*";
        const urls = Array.isArray(msg.urls) ? msg.urls : [];
        for (const url of urls) {
            const key = `${context} ${url} ${type}`;
            if (sessionURLFilteringRules.has(key)) {
                permanentURLFilteringRules[key] = sessionURLFilteringRules.get(key);
            }
        }
        await chrome.storage.local.set({ [STORAGE_KEY_URL_FILTERING]: permanentURLFilteringRules });
        return { ok: true };
    }

    case "getDomainNames": {
        const targets = Array.isArray(msg.targets) ? msg.targets : [];
        return targets.map(t => {
            if (typeof t !== "string") return "";
            return t.indexOf("/") !== -1
                ? domainFromHostname(new URL(t).hostname) || ""
                : domainFromHostname(t) || t;
        });
    }

    case "listsFromNetFilter": {
        await ensureFilterReverseIndex();
        return lookupFilterLists(String(msg.rawFilter || ""));
    }

    case "listsFromCosmeticFilter": {
        await ensureFilterReverseIndex();
        return lookupFilterLists(String(msg.rawFilter || msg.filter || ""));
    }

    case "createUserFilter":
        return createUserFilter(msg);

    case "registerScriptletCache": {
        const { name, script, version } = msg;
        if (name && script) {
            scriptletCache.set(name, { script, version: version || '1' });
            return { ok: true };
        }
        return { ok: false, error: 'missing-name-or-script' };
    }

    case "explainPolicy": {
        const policyUrl = msg.url || "";
        const policyHostname = extractHostname(policyUrl);
        const policy = resolvePagePolicy({ url: policyUrl, hostname: policyHostname });
        return { ok: true, explanation: explainPolicy(policyUrl, policyHostname, policy) };
    }

    case "classifySelectorRisk": {
        if (typeof msg.selector !== "string") return { ok: false, error: "Missing selector" };
        return { ok: true, classification: classifySelectorRisk(msg.selector) };
    }

    case "getMutationLedger": {
        const tabId = Number(msg.tabId);
        if (tabId > 0) {
            try {
                const response = await chrome.tabs.sendMessage(tabId, { what: "getMutationLedger" });
                return { ok: true, ledger: response.ledger || [] };
            } catch (e) {
                return { ok: false, error: String(e) };
            }
        }
        return { ok: true, ledger: [] };
    }

    case "getCssInjectionInventory": {
        const cssTabId = Number(msg.tabId);
        if (cssTabId > 0) {
            try {
                const response = await chrome.tabs.sendMessage(cssTabId, { what: "getCssInjectionInventory" });
                return { ok: true, inventory: response.inventory || [] };
            } catch (e) {
                return { ok: false, error: String(e) };
            }
        }
        return { ok: true, inventory: [] };
    }

    case "rollbackMutationsForTab": {
        // Signal content scripts to rollback via broadcast
        const tabId = Number(msg.tabId);
        try {
            new BroadcastChannel("uBR").postMessage({ what: "rollbackMutations", tabId });
            // Also try direct tab message for content scripts that may not have BroadcastChannel
            if (tabId > 0) {
                chrome.tabs.sendMessage(tabId, { what: "rollbackMutations" }).catch(() => {});
            }
            return { ok: true };
        } catch (e) {
            return { ok: false, error: String(e) };
        }
    }

    case "getStorageQuota":
        return { ok: true, quota: { maxFilterListCacheSize: storageQuota.maxFilterListCacheSize } };

    case "enforceStorageQuota":
        await storageQuota.enforceQuota();
        return { ok: true };

    case "getFeatureExpiryGates":
        return { ok: true, gates: { ...featureExpiryGates } };

    case "setFeatureExpiry":
        if (msg.feature && typeof msg.days === "number") {
            featureExpiryGates.setExpiry(msg.feature, msg.days);
            return { ok: true };
        }
        return { ok: false, error: "Invalid feature or days" };

    case "isFeatureExpired":
        if (msg.feature) {
            const expired = featureExpiryGates.isExpired(msg.feature);
            return { ok: true, expired };
        }
        return { ok: false, error: "Invalid feature" };

    case "launchElementPicker": {
        // Matches popup panel handler — frontend uses direct MV3 imports
        return { unsupported: true, message: "Use frontend MV3 helper directly" };
    }

    case "reloadTab": {
        const tabId = Number(msg.tabId);
        if (tabId > 0) {
            await pushTabReloadMarker(tabId);
            try {
                await chrome.tabs.reload(tabId, { bypassCache: !!msg.bypassCache });
            } catch (e) {
                console.warn("[uBR] loggerUI reloadTab: tabs.reload failed", tabId, e);
            }
            markTabChanged(tabId);
        }
        return { ok: true };
    }

    default: return { error: `Unhandled loggerUI: ${  msg.what}` };
    }
}

async function handleDom(msg) {
    switch (msg.what) {
    case "uiStyles": {
        const data = await chrome.storage.local.get(["uiStyles", "uiAccentStylesheet"]);
        return {
            uiStyles: typeof data.uiStyles === "string" ? data.uiStyles : "unset",
            uiAccentStylesheet: typeof data.uiAccentStylesheet === "string" ? data.uiAccentStylesheet : "",
        };
    }
    case "uiAccentStylesheet":
        if (typeof msg.stylesheet === "string") {
            await chrome.storage.local.set({ uiAccentStylesheet: msg.stylesheet });
        }
        return {};
    default:
        return {};
    }
}

// ---------------------------------------------------------------------------
// Main message dispatcher
// ---------------------------------------------------------------------------
async function dispatchMessage(channel, msg, senderTabId, senderFrameId) {
    if (channel === "ping") return { pong: true };
    if (channel === "loggerUI") return handleLoggerUI(msg);
    if (channel === "popupPanel") return handlePopupPanel(msg);
    if (channel === "vapi") return handleVAPI(msg, senderTabId);
    if (channel === "contentscript") return handleContentscript(msg, senderTabId, senderFrameId);
    if (channel === "codeViewer") return handleCodeViewer(msg);
    if (channel === "domInspectorContent") return handleDOMInspectorContent(msg, senderTabId, senderFrameId);
    if (channel === "dashboard") return handleDashboard(msg, senderTabId);
    if (channel === "elementPicker") return handleElementPicker(msg);
    if (channel === "getWhitelist") return handleWhitelist.get(msg);
    if (channel === "setWhitelist") return handleWhitelist.set(msg);
    if (channel === "cloudWidget") return handleCloudWidget(msg);
    if (channel === "broadcast") return { ok: true };
    if (channel === "dom") return handleDom(msg);
    if (channel === "default") return handleDefaultChannel(msg);
    return { error: `No handler for channel ${  channel}` };
}

async function handleDefaultChannel(msg) {
    switch (msg.what) {
    case "getAssetContent": {
        const url = msg.url || "";
        try {
            const response = await fetchWithTimeout(url, 15000);
            if (response.ok) {
                const content = await response.text();
                return { content, ok: true };
            }
        } catch (e) {
            console.warn("[uBR] fetchAsset: fetch failed", url, e);
        }
        return { error: `Failed to fetch ${url}` };
    }
    case "gotoURL": {
        const url = msg?.details?.url;
        if (url) {
            const fullUrl = url.startsWith("http") || url.startsWith("chrome-extension://")
                ? url
                : chrome.runtime.getURL(url);
            chrome.tabs.create({ url: fullUrl, active: true }).catch(e => { console.warn("[uBR] tabs.create gotoURL:", e); });
        }
        return { ok: true };
    }
    case "setNewtabToggle": {
        _showCustomNewTab = msg.enabled;
        await chrome.storage.local.set({ showCustomNewTab: msg.enabled }).catch(() => {});
        await syncNewTabToUserSettings(msg.enabled);
        if (msg._tabId && msg.navigate) {
            const ourUrl = chrome.runtime.getURL("pages/newtab.html");
        if (msg.enabled) {
            chrome.tabs.update(msg._tabId, { url: ourUrl }).catch(() => {});
        } else {
            chrome.tabs.update(msg._tabId, { url: "chrome://newtab/" }).catch(() => {});
        }
        }
        return { ok: true };
    }
    case "getNewtabToggle": {
        return { enabled: _showCustomNewTab };
    }
    default:
        return { error: `Unhandled default message: ${  msg.what}` };
    }
}

const pickerArgs = { target: "", mouse: false, zap: false, eprom: null };

async function handleElementPicker(msg) {
    switch (msg.what) {
    case "elementPickerArguments":
        return {
        target: pickerArgs.target,
        mouse: pickerArgs.mouse,
        zap: pickerArgs.zap,
        pickerURL: chrome.runtime.getURL(`/web_accessible_resources/epicker-ui.html?zap=${  Math.random().toString(36).slice(2, 10)}`),
        eprom: pickerArgs.eprom || null,
        };
    case "elementPickerEprom":
        if (msg.eprom) {
            pickerArgs.eprom = msg.eprom;
            await chrome.storage.local.set({ elementPickerEprom: msg.eprom }).catch(e => { console.warn("[uBR] storage.set elementPickerEprom:", e); });
        }
        return { success: true };
    case "createUserFilter":
    case "elementPickerCreateFilter":
        return createUserFilter(msg);
    default:
        return {};
    }
}

// Whitelist/trusted-site directive constants (single source of truth)
const WHITELIST_RE_BAD_HOSTNAME = "^[0-9.]+$|^(\\.|.*[^0-9a-zA-Z._-]).*$";
const WHITELIST_RE_HOSTNAME_EXTRACTOR = "^([^\\/]+)\\/(.*)$";
const WHITELIST_DEFAULT_DIRECTIVES = [
    "about-scheme",
    "chrome-extension-scheme",
    "moz-extension-scheme",
    "opera-scheme",
    "vivaldi-scheme",
    "wyciwyg-scheme",
];

const handleWhitelist = {
  async get() {
      const data = await chrome.storage.local.get(["whitelist"]);
      const whitelist = Array.isArray(data.whitelist) ? data.whitelist : [];
      return {
      reBadHostname: WHITELIST_RE_BAD_HOSTNAME,
      reHostnameExtractor: WHITELIST_RE_HOSTNAME_EXTRACTOR,
      whitelistDefault: WHITELIST_DEFAULT_DIRECTIVES,
      whitelist,
      };
  },
  async set(msg) {
      const whitelist = typeof msg.whitelist === "string"
          ? msg.whitelist.split("\n").filter((l) => l.trim())
          : Array.isArray(msg.whitelist)
              ? msg.whitelist
              : [];
      await chrome.storage.local.set({ whitelist });
      await reloadWhitelist();
      void reconcileTrustedTabCosmetics();
      PolicySnapshot.invalidateAll({ reason: "whitelist-change" });
      return { ok: true };
  },
};

let contextMenuInstalled = false;

async function installContextMenu() {
    if (contextMenuInstalled) return;
    contextMenuInstalled = true;
    await chrome.contextMenus.removeAll().catch(e => { console.warn("[uBR] contextMenus.removeAll install:", e); });
    try {
        chrome.contextMenus.create({
            id: "uBlockResurrectedBlockElement",
            title: "Block element…",
            contexts: ["all"],
            documentUrlPatterns: ["http://*/*", "https://*/*"],
        });
    } catch (err) { console.warn("[uBR] Failed to create context menu items:", err); }
    try {
        chrome.contextMenus.create({
            id: "uBlockResurrectedOpenLogger",
            title: "Open logger",
            contexts: ["action"],
        });
    } catch (err) { console.warn("[uBR] Failed to create logger context menu:", err); }
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
    case "uBlockResurrectedBlockElement":
        if (tab?.id) {
            chrome.tabs.sendMessage(tab.id, { what: "launchElementPicker" }).catch(e => { console.warn("[uBR] tabs.sendMessage elementPicker:", e); });
        }
        break;
    case "uBlockResurrectedOpenLogger":
        chrome.tabs.create({ url: chrome.runtime.getURL("logger-ui.html"), active: true }).catch(e => { console.warn("[uBR] tabs.create contextMenu logger:", e); });
        break;
    }
});

async function resolveUserFilterTabId(msg) {
    const explicitTabId = Number(msg.tabId) || 0;
    if (explicitTabId > 0) return explicitTabId;
    const senderTabId = Number(msg._tabId) || 0;
    if (typeof msg.docURL !== "string") return senderTabId;

    let targetURL;
    try {
        targetURL = new URL(msg.docURL);
    } catch (e) {
        console.warn("[uBR] resolveUserFilterTabId: invalid docURL", msg.docURL, e);
        return senderTabId;
    }
    if (targetURL.protocol !== "http:" && targetURL.protocol !== "https:") {
        return senderTabId;
    }
    try {
        const tabs = await chrome.tabs.query({});
        const targetHref = targetURL.href.split("#", 1)[0];
        const matchingTabs = tabs.filter(tab => {
            if (typeof tab.id !== "number" || typeof tab.url !== "string") return false;
            try {
                return new URL(tab.url).hostname === targetURL.hostname;
            } catch (e) {
                console.warn("[uBR] resolveUserFilterTabId: invalid tab URL", tab.url, e);
                return false;
            }
        });
        if (matchingTabs.some(tab => tab.id === senderTabId)) {
            return senderTabId;
        }
        const exactMatch = matchingTabs.find(tab => tab.url?.split("#", 1)[0] === targetHref);
        return exactMatch?.id || matchingTabs.find(tab => tab.active)?.id || senderTabId;
    } catch (e) {
        console.warn("[uBR] resolveUserFilterTabId: tabs.query failed", e);
        return senderTabId;
    }
}

async function createUserFilter(msg) {
    try {
        const tabId = await resolveUserFilterTabId(msg);
        const frameId = Number(msg._frameId);
        const existing = await chrome.storage.local.get(["userFilters", "user-filters", "selectedFilterLists"]);
        const current =
      typeof existing.userFilters === "string"
          ? existing.userFilters
          : typeof existing["user-filters"] === "string"
              ? existing["user-filters"]
              : "";
        const sanitized = sanitizeCustomFilterText(msg.filter || msg.filters || "");
        const lines = current.split("\n").map(f => f.trim()).filter(Boolean);
        let addedCount = 0;
        let highRiskFilters = [];
        for (const filter of sanitized.content.split("\n").map(f => f.trim()).filter(Boolean)) {
            if (lines.includes(filter) === false) {
                // Validate against risk model (Item 126)
                const isHighRisk = filter.includes('##') || filter.includes('#@#') ||
                    filter.includes('$replace') || filter.includes('$header') ||
                    filter.includes('$redirect') || filter.includes('$redirect-rule') ||
                    filter.includes('$csp') || filter.includes('$webrtc') ||
                    filter.includes('+js(') || filter.includes('$xmlhttprequest') ||
                    /main-world/i.test(filter) || /responseheader/i.test(filter);
                if (isHighRisk) {
                    highRiskFilters.push(filter);
                }
                lines.push(filter);
                addedCount += 1;
            }
        }
        const selected = new Set(Array.isArray(existing.selectedFilterLists) ? existing.selectedFilterLists : []);
    selected.add("user-filters");
    const updated = lines.join("\n");
    
    // Warn about high-risk filters but still allow them
    if (highRiskFilters.length > 0) {
        console.warn(`[uBR] User filter added ${highRiskFilters.length} high-risk filter(s): ${highRiskFilters.slice(0, 3).join(', ')}${highRiskFilters.length > 3 ? '...' : ''}`);
    }
    
    await chrome.storage.local.set({
      userFilters: updated,
      "user-filters": updated,
      selectedFilterLists: Array.from(selected)
    });
    if ( tabId > 0 && addedCount > 0 ) {
        incrementBlockedCosmeticCount(tabId, frameId, addedCount);
        scheduleBlockedCountBadgeUpdate(tabId);
    }
    reloadAllFilterLists().catch(err => console.warn("[uBR] reloadAllFilterLists after user filters update:", err));
    try { new BroadcastChannel("uBR").postMessage({ what: "userFiltersUpdated" }); } catch (e) { console.warn("[uBR] BroadcastChannel userFiltersUpdated:", e); }
    return { ok: true, added: addedCount, rejected: sanitized.removed.length, highRisk: highRiskFilters.length };
    } catch (e) {
        return { ok: false, error: String(e) };
    }
}

async function handleDashboard(msg, senderTabId) {
    switch (msg.what) {
    case "getLists":
        return getFilterListState();
    case "dashboardConfig":
        return { canUpdate: true, noDashboard: false };
    case "getRuntimeHealth":
        return { ...runtimeHealth };
    case "userSettings":
        if (msg.name) return changeUserSetting(msg);
        return readUserSettings();
    case "getLocalData":
        return readLocalData();
    case "reloadAllFilters":
        return reloadAllFilterLists();
    case "updateNow":
        return updateFilterListsNow(msg);
    case "listsUpdateNow":
        if (Array.isArray(msg.assetKeys)) {
            for (const key of msg.assetKeys) {
                await purgeFilterListCache(key);
            }
        }
        return updateFilterListsNow(msg);
    case "applyFilterListSelection":
        return applyFilterListSelection(msg);
    case "readUserFilters":
        return readUserFilters();
    case "writeUserFilters":
        return writeUserFilters(msg);
    case "getAutoCompleteDetails": {
        const stored = await chrome.storage.local.get(["redirectResourceDetails", "trustedScriptletTokens"]);
        const result = {
            hintUpdateToken: msg.hintUpdateToken || 0,
            redirectResources: stored.redirectResourceDetails || [],
            preparseDirectiveEnv: ["chromium", "firefox", "edge", "safari", "mobile", "devbuild"],
            preparseDirectiveHints: ["chromium", "firefox", "edge", "safari", "mobile", "devbuild", "true", "false"],
            originHints: [],
        };
        try {
            const tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*"] });
            const hosts = new Set();
            for (const tab of tabs) {
                try { hosts.add(new URL(tab.url).hostname); } catch (e) { console.warn("[uBR] getHostnameHints: invalid tab URL", tab.url, e); }
            }
            result.originHints = Array.from(hosts).sort();
        } catch (e) {
            console.warn("[uBR] getHostnameHints: tabs.query failed", e);
        }
        return result;
    }
    case "getTrustedScriptletTokens": {
        const stored = await chrome.storage.local.get("trustedScriptletTokens");
        return new Set(stored.trustedScriptletTokens || []);
    }
    case "getRules": {
        const serialized = serializeAllRules();
        let pslSelfie = null;
        try {
            const cached = await chrome.storage.local.get('pslSelfie');
            if (cached.pslSelfie) pslSelfie = cached.pslSelfie;
        } catch (e) {
            console.warn("[uBR] getRules: failed to read pslSelfie", e);
        }
        return { permanentRules: serialized.permanentRules, sessionRules: serialized.sessionRules, pslSelfie };
    }
    case "modifyRuleset": {
        return applyRuleChanges(msg.permanent === true, msg.toAdd || "", msg.toRemove || "");
    }
    case "getAppData":
        return { name: "uBlock Resurrected", version: chrome.runtime.getManifest().version || "1.0.0" };
    case "readHiddenSettings": {
        const stored = await chrome.storage.local.get("hiddenSettings").catch(e => { console.warn("[uBR] readHiddenSettings: storage.get failed", e); return {}; });
        return { default: {}, admin: {}, current: stored.hiddenSettings || {} };
    }
    case "writeHiddenSettings": {
        await chrome.storage.local.set({ hiddenSettings: msg.settings || {} });
        return { ok: true };
    }
    case "resetUserData": {
        await chrome.storage.local.clear();
        await chrome.storage.session?.clear().catch(e => { console.warn("[uBR] storage.session.clear:", e); });
        return { ok: true };
    }
    case "getMatchedRuleInfo":
        return { ok: true, matches: [] };
    case "restoreUserData": {
        if (msg.userData) {
            await chrome.storage.local.set(msg.userData);
        }
        if (msg.localData) {
            await chrome.storage.local.set({ localData: msg.localData });
        }
        try {
            await reloadAllFilterLists();
        } catch (e) {
            console.warn("[uBR] restoreUserData: reloadAllFilterLists failed", e);
        }
        return { ok: true };
    }
    case "backupUserData": {
        const allKeys = await chrome.storage.local.get(null);
        const userDataKeys = ["userSettings", "selectedFilterLists", "userFilters", "user-filters", "whitelist",
            "ubrPermanentNetFiltering", "ubrPermanentHostnameSwitches", "ubrPermanentFirewallRules",
            "ubrURLFilteringRules", "aboutPageSettings", "hiddenSettings", "dynamicFilteringString",
            "hostnameSwitchesString", "ubrFilterListCache", "filterListWriteTimes",
        ];
        const userData = {};
        for (const key of userDataKeys) {
            if (key in allKeys) userData[key] = allKeys[key];
        }
        const localData = { lastBackupFile: msg?.filename || "", lastBackupTime: Date.now() };
        return { userData, localData };
    }
    case "getWhitelist":
        return handleWhitelist.get();
    case "setWhitelist":
        return handleWhitelist.set(msg);
    case "readyToFilter":
        return true;
    case "getSmartRules":
        await smartRuleStore.load();
        return { rules: smartRuleStore.getAllRules(), collections: smartRuleStore.getAllCollections() };
    case "addSmartRule": {
        const rule = msg.rule;
        rule.id = rule.id || `ubr:smart:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        rule.metadata = rule.metadata || { createdAt: new Date().toISOString() };
        await smartRuleStore.load();
        return smartRuleStore.addRule(rule);
    }
    case "updateSmartRule":
        await smartRuleStore.load();
        return smartRuleStore.updateRule(msg.rule.id, msg.rule);
    case "removeSmartRule":
        await smartRuleStore.load();
        return { ok: await smartRuleStore.removeRule(msg.id) };
    case "setSmartRuleState":
        await smartRuleStore.load();
        return { ok: await smartRuleStore.setRuleState(msg.id, msg.state) };
    case "subscribeSmartCollection": {
        await smartEngine.init();
        const collectionId = `col-${Date.now()}`;
        const ok = await smartEngine.subscribeToCollection(msg.url, collectionId);
        return { ok, collectionId };
    }
    case "testSmartRules": {
        await smartEngine.init();
        const tabId = msg.tabId || senderTabId || 0;
        const selectors = smartEngine.applyRulesToTab(tabId, msg.url).selectors;
        return { selectors };
    }
    case "getCosmeticPlanForDocument": {
        const tabId = msg.tabId || senderTabId || 0;
        const result = smartEngine.getCosmeticPlanForTab(tabId, msg.url);
        return result;
    }
    case "getSmartTabId":
        return { tabId: senderTabId || 0 };
    case "previewSmartCosmeticRule": {
        await smartRuleStore.load();
        try { new BroadcastChannel("ubr-smart-cosmetic").postMessage({ what: "previewRule" }); } catch (e) { console.warn("[uBR] BroadcastChannel smart-cosmetic previewRule:", e); }
        return { ok: true, rule: msg.rule || null };
    }
    case "confirmSmartCosmeticRulePreview": {
        await smartRuleStore.load();
        const rule = smartRuleStore.getRule(msg.id);
        if (rule) {
            const updated = { ...rule, preview: { status: 'confirmed', confirmationHash: msg.hash || rule.preview?.confirmationHash, confirmedAt: new Date().toISOString(), lastPreviewedAt: new Date().toISOString() } };
            await smartRuleStore.updateRule(msg.id, updated);
            return { ok: true };
        }
        return { ok: false, error: 'Rule not found' };
    }
    case "saveSmartCosmeticRule": {
        await smartRuleStore.load();
        const result = await smartRuleStore.addRule(msg.rule);
        try { new BroadcastChannel("ubr-smart-cosmetic").postMessage({ what: "rules-changed" }); } catch (e) { console.warn("[uBR] BroadcastChannel smart-cosmetic rules-changed:", e); }
        return { ok: result.ok, errors: result.validation?.diagnostics };
    }
    case "updateSmartCosmeticRule": {
        await smartRuleStore.load();
        const result = await smartRuleStore.updateRule(msg.id, msg.updates);
        try { new BroadcastChannel("ubr-smart-cosmetic").postMessage({ what: "rules-changed" }); } catch (e) { console.warn("[uBR] BroadcastChannel smart-cosmetic rules-changed:", e); }
        return { ok: result.ok, errors: result.validation?.diagnostics };
    }
    case "deleteSmartCosmeticRule": {
        await smartRuleStore.load();
        const success = await smartRuleStore.removeRule(msg.id);
        try { new BroadcastChannel("ubr-smart-cosmetic").postMessage({ what: "rules-changed" }); } catch (e) { console.warn("[uBR] BroadcastChannel smart-cosmetic rules-changed:", e); }
        return { ok: success };
    }
    case "enableDisableSmartCosmeticRule": {
        await smartRuleStore.load();
        const success = await smartRuleStore.setRuleState(msg.id, msg.state);
        try { new BroadcastChannel("ubr-smart-cosmetic").postMessage({ what: "rules-changed" }); } catch (e) { console.warn("[uBR] BroadcastChannel smart-cosmetic rules-changed:", e); }
        return { ok: success };
    }
    case "importSmartRules": {
        const parsed = parseSmartRules(msg.yaml);
        if (parsed.errors.length > 0 && parsed.rules.length === 0) {
            return { ok: false, errors: parsed.errors };
        }
        let added = 0;
        for (const rule of parsed.rules) {
            const result = await smartRuleStore.addRule(rule);
            if (result.ok) added++;
        }
        return { ok: true, count: added, errors: parsed.errors };
    }
    case "exportSmartRules": {
        const result = await exportAllRules();
        return result;
    }
    case "exportSmartRulesToClassic": {
        const result = await exportAllRules();
        return { classicLines: result.classicLines, lossMetadata: result.lossMetadata };
    }
    default:
        return {};
    }
}

async function handleCloudWidget(msg) {
    switch (msg.what) {
    case "cloudGetOptions": {
        const stored = await chrome.storage.local.get(["cloudOptions", "userSettings"]);
        const options = stored.cloudOptions || {};
        const userSettings = stored.userSettings || {};
        if (!options.deviceName) {
            options.deviceName = `${navigator.platform || "unknown"}-${Date.now().toString(36).slice(-6)}`;
            await chrome.storage.local.set({ cloudOptions: options });
        }
        return {
            enabled: userSettings.cloudStorageEnabled === true,
            deviceName: options.deviceName || "",
            defaultDeviceName: "Default device",
            cloudStorageSupported: typeof chrome.storage.sync !== "undefined",
        };
    }
    case "cloudSetOptions": {
        const stored = await chrome.storage.local.get("cloudOptions");
        const options = stored.cloudOptions || {};
        if (msg.options?.deviceName) options.deviceName = msg.options.deviceName;
        await chrome.storage.local.set({ cloudOptions: options });
        return {
            deviceName: options.deviceName || "",
            defaultDeviceName: "Default device",
        };
    }
    case "cloudPush": {
        const datakey = msg.datakey || "cloudData";
        try {
            const payload = { data: msg.data, source: msg.source || "", tstamp: Date.now() };
            const json = JSON.stringify(payload);
            await chrome.storage.local.set({ [datakey]: json });
            return false;
        } catch (e) {
            return String(e);
        }
    }
    case "cloudPull": {
        const datakey = msg.datakey || "cloudData";
        try {
            const stored = await chrome.storage.local.get(datakey);
            const raw = stored[datakey];
            if (!raw) return false;
            return JSON.parse(raw);
        } catch (e) {
            console.warn("[uBR] sw: cloudPull failed", datakey, e);
            return false;
        }
    }
    case "cloudUsed": {
        const datakey = msg.datakey || "cloudData";
        const max = typeof chrome.storage.sync !== "undefined" ? 102400 : 10485760;
        const total = await chrome.storage.local.getBytesInUse(null).catch(e => { console.warn("[uBR] sw: cloudUsed getBytesInUse failed", e); return 0; });
        const stored = await chrome.storage.local.get(datakey).catch(e => { console.warn("[uBR] sw: cloudUsed storage.get failed", datakey, e); return {}; });
        const used = stored[datakey] ? stored[datakey].length : 0;
        return { max, total, used };
    }
    default:
        return false;
    }
}

const userSettingsDefault = {
  advancedUserEnabled: false,
  autoUpdate: true,
  cloudStorageEnabled: false,
    collapseBlocked: true,
    showCustomNewTab: true,
    colorBlindFriendly: false,
  contextMenuEnabled: true,
  cnameUncloakEnabled: false,
  hyperlinkAuditingDisabled: true,
  ignoreGenericCosmeticFilters: false,
  importedLists: [],
  largeMediaSize: 10485760,
  noCosmeticFiltering: false,
  noLargeMedia: false,
  noRemoteFonts: false,
  noScripting: false,
  noCSPReports: true,
  experimentalHeuristicInterceptorsEnabled: false,
  prefetchingDisabled: false,
  webrtcIPAddressHidden: false,
  firewallPaneMinimized: true,
  popupPanelSections: 15,
  showIconBadge: true,
  stealthModeEnabled: true,
  suspendUntilListsAreLoaded: false,
  tooltipsDisabled: false,
  uiAccentCustom: false,
  uiAccentCustom0: "#3498d6",
  uiTheme: "auto",
};

async function readUserSettings() {
    const stored = await chrome.storage.local.get("userSettings");
    return { ...userSettingsDefault, ...(stored.userSettings || {}) };
}

async function changeUserSetting(msg) {
    const stored = await chrome.storage.local.get("userSettings");
    const current = stored.userSettings || {};
    current[msg.name] = msg.value;
    if (msg.name === "advancedUserEnabled" && msg.value === true) {
        const ps = await chrome.storage.local.get("popupPanelSections");
        const bits = typeof ps.popupPanelSections === "number" ? ps.popupPanelSections : 0b111;
        current.popupPanelSections = bits | 0b11111;
        await chrome.storage.local.set({ popupPanelSections: current.popupPanelSections });
    }
    await chrome.storage.local.set({ userSettings: current });
    if (msg.name === STEALTH_MODE_SETTING) {
        await syncStealthSurrogateRules();
    }
    if (msg.name === "contextMenuEnabled") {
        if (msg.value) {
            await installContextMenu();
        } else {
            chrome.contextMenus.removeAll().catch(e => { console.warn("[uBR] contextMenus.removeAll settings:", e); });
        }
    }
    if (msg.name === "showCustomNewTab") {
        _showCustomNewTab = msg.value;
        await chrome.storage.local.set({ showCustomNewTab: msg.value }).catch(() => {});
    }
    if (msg.name === "showIconBadge") {
        if (!msg.value) {
            const tabs = await chrome.tabs.query({}).catch(e => { console.warn("[uBR] sw: showIconBadge tabs.query failed", e); return []; });
            await Promise.all(tabs.map(tab => clearBlockedCountIcon(tab.id)));
        } else {
            const tabs = await chrome.tabs.query({}).catch(e => { console.warn("[uBR] sw: showIconBadge tabs.query failed", e); return []; });
            for (const tab of tabs) {
                if (typeof tab.id === "number") {
                    scheduleBlockedCountBadgeUpdate(tab.id);
                }
            }
        }
    }
    if (msg.name === "prefetchingDisabled" && typeof chrome.privacy !== "undefined") {
        chrome.privacy.network.networkPredictionEnabled.set({ value: !msg.value }).catch(e => { console.warn("[uBR] privacy.networkPredictionEnabled:", e); });
    }
    if (msg.name === "hyperlinkAuditingDisabled" && typeof chrome.privacy !== "undefined") {
        chrome.privacy.websites.hyperlinkAuditingEnabled.set({ value: !msg.value }).catch(e => { console.warn("[uBR] privacy.hyperlinkAuditingEnabled:", e); });
    }
    if (msg.name === "webrtcIPAddressHidden" && typeof chrome.privacy !== "undefined") {
        chrome.privacy.services.ipHandlingPolicy.set({ value: msg.value ? "disable_non_proxied_udp" : "default" }).catch(e => { console.warn("[uBR] privacy.ipHandlingPolicy:", e); });
    }
    return { ok: true };
}

async function syncStealthSurrogateRules() {
    const settings = await readUserSettings();
    const existing = await chrome.declarativeNetRequest.getSessionRules();
    const removeRuleIds = existing
        .map(rule => rule.id)
        .filter(isStealthSurrogateRuleId);
    const addRules = settings[STEALTH_MODE_SETTING] === false
        ? []
        : createStealthSurrogateRules();

    await chrome.declarativeNetRequest.updateSessionRules({
        removeRuleIds,
        addRules,
    });
}

async function readLocalData() {
    const storageUsed = await chrome.storage.local.getBytesInUse(null).catch(e => { console.warn("[uBR] sw: readLocalData getBytesInUse failed", e); return 0; });
    const localData = (await chrome.storage.local.get("localData")).localData || {};
    const userSettings = await readUserSettings();
    return {
    storageUsed,
    lastBackupFile: localData.lastBackupFile || "",
    lastBackupTime: localData.lastBackupTime || 0,
    lastRestoreFile: localData.lastRestoreFile || "",
    lastRestoreTime: localData.lastRestoreTime || 0,
    cloudStorageSupported: typeof chrome.storage.sync !== "undefined",
    privacySettingsSupported: typeof chrome.privacy !== "undefined",
    canLeakLocalIPAddresses: typeof chrome.privacy !== "undefined",
    };
}

async function readUserFilters() {
    const data = await chrome.storage.local.get(["userFilters", "user-filters", "selectedFilterLists", "userSettings"]);
    const selectedLists = Array.isArray(data.selectedFilterLists) ? data.selectedFilterLists : [];
    const userSettings = data.userSettings || {};
    const content =
    typeof data.userFilters === "string"
        ? data.userFilters
        : typeof data["user-filters"] === "string"
            ? data["user-filters"]
            : "";
    let enabled = selectedLists.includes("user-filters");
    if (enabled === false && content.trim() === "") {
        enabled = true;
        await chrome.storage.local.set({
      selectedFilterLists: ["user-filters", ...selectedLists],
        });
    }
    return {
    content,
    enabled,
    trusted: userSettings.userFiltersTrusted === true,
    };
}

async function writeUserFilters(msg) {
    try {
        const data = await chrome.storage.local.get(["selectedFilterLists", "userSettings"]);
        const selected = new Set(Array.isArray(data.selectedFilterLists) ? data.selectedFilterLists : []);
        if (msg.enabled !== false) {
      selected.add("user-filters");
        } else {
      selected.delete("user-filters");
        }
        const nextUserSettings = {
      ...(data.userSettings || {}),
      userFiltersTrusted: msg.trusted === true,
        };
        const sanitized = sanitizeCustomFilterText(msg.content || "");
        await chrome.storage.local.set({
      userFilters: sanitized.content,
      "user-filters": sanitized.content,
      selectedFilterLists: Array.from(selected),
      userSettings: nextUserSettings,
        });
        try { new BroadcastChannel("uBR").postMessage({ what: "userFiltersUpdated" }); } catch (e) { console.warn("[uBR] BroadcastChannel userFiltersUpdated:", e); }
        return { ok: true, rejected: sanitized.removed.length };
    } catch (e) {
        return { ok: false, error: String(e) };
    }
}

// ---------------------------------------------------------------------------
// Filter list management pipeline
// ---------------------------------------------------------------------------
const FILTER_LIST_USER_PATH = "user-filters";
const FILTER_LIST_ASSETS_URL = "assets/assets.json";
let filterListsUpdating = false;
let syncInProgress = false;  // boolean fallback guard for non-token callers

async function getFilterListCache() {
    const stored = await chrome.storage.local.get(STORAGE_KEY_FILTER_CACHE).catch(e => { console.warn("[uBR] sw: getFilterListCache storage.get failed", e); return {}; });
    return stored[STORAGE_KEY_FILTER_CACHE] || {};
}

async function setFilterListCacheEntry(listKey, entry) {
    const cache = await getFilterListCache();
    cache[listKey] = { ...cache[listKey], ...entry, tstamp: Date.now() };
    await chrome.storage.local.set({ [STORAGE_KEY_FILTER_CACHE]: cache });
}

async function purgeFilterListCache(listKey) {
    if (!listKey) {
        await chrome.storage.local.remove(STORAGE_KEY_FILTER_CACHE);
        return;
    }
    const cache = await getFilterListCache();
    delete cache[listKey];
    await chrome.storage.local.set({ [STORAGE_KEY_FILTER_CACHE]: cache });
}

function normalizeListEntries(value) {
    if (Array.isArray(value) === false) return [];
    return value.map(e => typeof e === "string" ? e.trim() : "").filter(e => e !== "");
}

const normalizeImportedLists = normalizeListEntries;
const normalizeSelectedFilterLists = normalizeListEntries;

function isValidExternalList(value) {
    return /^[a-z-]+:\/\/(?:\S+\/\S*|\/\S+)/i.test(value);
}

function extractListURLs(text) {
    return text.split(/\s+/).map(l => l.trim()).filter(l => l !== "" && isValidExternalList(l));
}

function listSupportNameFromURL(value) {
    try { return new URL(value).hostname; } catch (e) { console.warn("[uBR] listSupportNameFromURL: invalid URL", value, e); return ""; }
}

function cloneObject(value) {
    return JSON.parse(JSON.stringify(value));
}

function deriveDefaultSelectedFilterLists(available, userPath) {
    const selected = [userPath];
    for (const [key, details] of Object.entries(available)) {
        if (key === userPath) continue;
        if (details.content !== "filters") continue;
        if (details.off === true) continue;
    selected.push(key);
    }
    return selected;
}

function resolveBundledFilterListPath(asset) {
    const contentURLs = Array.isArray(asset.contentURL)
        ? asset.contentURL
        : typeof asset.contentURL === "string" ? [asset.contentURL] : [];
    return contentURLs.find(url => typeof url === "string" && url.startsWith("assets/"));
}

function resolveStockAssetKeyFromURL(catalog, urlKey) {
    const needle = urlKey.replace(/^https?:/, "");
    for (const [assetKey, asset] of Object.entries(catalog)) {
        if (asset.content !== "filters") continue;
        const contentURLs = Array.isArray(asset.contentURL)
            ? asset.contentURL
            : typeof asset.contentURL === "string" ? [asset.contentURL] : [];
        for (const contentURL of contentURLs) {
            if (contentURL.replace(/^https?:/, "") === needle) return assetKey;
        }
    }
    return urlKey;
}

function buildAvailableFilterLists(catalog, importedLists, selectedListSet, userPath) {
    const available = {
    [userPath]: {
      content: "filters",
      group: "user",
      title: "My filters",
      off: selectedListSet.has(userPath) === false,
    },
    };
    for (const [assetKey, asset] of Object.entries(catalog)) {
        if (asset.content !== "filters") continue;
        available[assetKey] = { ...cloneObject(asset), off: selectedListSet.has(assetKey) === false };
    }
    for (const importedList of importedLists) {
        if (available[importedList] !== void 0) {
            available[importedList].off = selectedListSet.has(importedList) === false;
            continue;
        }
        available[importedList] = {
      content: "filters",
      contentURL: importedList,
      external: true,
      group: "custom",
      submitter: "user",
      supportURL: importedList,
      supportName: listSupportNameFromURL(importedList),
      title: importedList,
      off: selectedListSet.has(importedList) === false,
        };
    }
    return available;
}

async function estimateFilterCounts(available) {
    // Prefer cached compiled counts from last sync for accuracy
    const stored = await chrome.storage.local.get(STORAGE_KEY_COMPILED_COUNTS).catch(e => { console.warn("[uBR] sw: estimateFilterCounts storage.get failed", e); return {}; });
    const cached = stored[STORAGE_KEY_COMPILED_COUNTS];
    if (cached && typeof cached.netFilterCount === "number" && typeof cached.cosmeticFilterCount === "number") {
        return { netFilterCount: cached.netFilterCount, cosmeticFilterCount: cached.cosmeticFilterCount };
    }
    // Fall back to catalog metadata
    let netFilterCount = 0;
    let cosmeticFilterCount = 0;
    for (const details of Object.values(available)) {
        if (details.off === true) continue;
        netFilterCount += details.entryCount || 0;
        cosmeticFilterCount += details.entryUsedCount || 0;
    }
    return { netFilterCount, cosmeticFilterCount };
}

function parseStoredCosmeticFilterData(raw) {
    let parsed = raw;
    if (typeof parsed === "string" && parsed !== "") {
        try { parsed = JSON.parse(parsed); } catch (e) { console.warn("[uBR] parseStoredCosmeticFilterData: JSON parse failed", e); parsed = {}; }
    }
    const data = parsed && typeof parsed === "object" ? parsed : {};
    return {
    genericCosmeticFilters: Array.isArray(data.genericCosmeticFilters) ? data.genericCosmeticFilters : [],
    genericCosmeticExceptions: Array.isArray(data.genericCosmeticExceptions) ? data.genericCosmeticExceptions : [],
    specificCosmeticFilters: Array.isArray(data.specificCosmeticFilters) ? data.specificCosmeticFilters : [],
    scriptletFilters: Array.isArray(data.scriptletFilters) ? data.scriptletFilters : [],
    };
}

async function fetchFilterListCatalog() {
    const url = chrome.runtime.getURL(FILTER_LIST_ASSETS_URL);
  console.log(`[uBR] Fetching catalog from ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    console.error(`[uBR] Catalog fetch failed: ${response.status} ${response.statusText}`);
    throw new Error(`HTTP ${response.status}`);
  }
  const catalog = await response.json();
  const filterKeys = Object.entries(catalog).filter(([, v]) => v?.content === "filters").map(([k]) => k);
  console.log(`[uBR] Catalog loaded: ${Object.keys(catalog).length} entries, ${filterKeys.length} filter lists`);
  return catalog;
}

function serializeCosmeticFilterData(dnrData) {
    return {
    genericCosmeticFilters: Array.isArray(dnrData?.genericCosmeticFilters) ? dnrData.genericCosmeticFilters : [],
    genericCosmeticExceptions: Array.isArray(dnrData?.genericCosmeticExceptions) ? dnrData.genericCosmeticExceptions : [],
    specificCosmeticFilters: dnrData?.specificCosmetic instanceof Map
        ? Array.from(dnrData.specificCosmetic.entries())
        : Array.isArray(dnrData?.specificCosmetic) ? dnrData.specificCosmetic : [],
    scriptletFilters: dnrData?.scriptlet instanceof Map
        ? Array.from(dnrData.scriptlet.entries())
        : Array.isArray(dnrData?.scriptlet) ? dnrData.scriptlet : [],
    };
}

function generateFallbackRules() {
    const rules = [];
    const baseId = 1;
    const adDomains = [
    "doubleclick.net",
    "googlesyndication.com",
    "pagead2.googlesyndication.com",
    "googleadservices.com",
    "google-analytics.com",
    "ssl.google-analytics.com",
    "analytics.google.com",
    "adservice.google.com",
    "googletagmanager.com",
    "ads.youtube.com",
    "adnxs.com",
    "adsrvr.org",
    "criteo.com",
    "pubmatic.com",
    "rubiconproject.com",
    "openx.net",
    "advertising.com",
    "media.net",
    "static.media.net",
    "casalemedia.com",
    "contextweb.com",
    "scorecardresearch.com",
    "quantserve.com",
    "krxd.net",
    "taboola.com",
    "outbrain.com",
    "amazon-adsystem.com",
    "aax.amazon-adsystem.com",
    "connect.facebook.net",
    "pixel.facebook.com",
    "analytics.tiktok.com",
    "ads-api.tiktok.com",
    "analytics.twitter.com",
    "stats.wp.com",
    "pixel.wp.com",
    "events.reddit.com",
    "ads.linkedin.com",
    "adzerk.net",
    "metrika.yandex.ru",
    "mc.yandex.ru",
    "samsungads.com",
    "smetrics.samsung.com",
    "iadsdk.apple.com",
    "metrics.icloud.com",
    "metrics.mzstatic.com",
    "auction.unityads.unity3d.com",
    "config.unityads.unity3d.com",
    "notify.bugsnag.com",
    "analytics.query.yahoo.com",
    "gemini.yahoo.com",
    "moatads.com",
    "moat.com",
    "exelator.com",
    "tracking.rus.miui.com",
    "data.mistat.xiaomi.com",
    "data.mistat.india.xiaomi.com",
    "data.mistat.rus.xiaomi.com",
    "sdkconfig.ad.xiaomi.com",
    "sdkconfig.ad.intl.xiaomi.com",
    "api.ad.xiaomi.com",
    "grs.hicloud.com",
    "logservice1.hicloud.com",
    "metrics.data.hicloud.com",
    "metrics2.data.hicloud.com",
    "logbak.hicloud.com",
    "logservice.hicloud.com",
    "iot-eu-logser.realme.com",
    "iot-logser.realme.com",
    "bdapi-ads.realmemobile.com",
    "bdapi-in-ads.realmemobile.com",
    "ck.ads.oppomobile.com",
    "adx.ads.oppomobile.com",
    "data.ads.oppomobile.com",
    "adsfs.oppomobile.com",
    "analytics-api.samsunghealthcn.com",
    "api-adservices.apple.com",
    "books-analytics-events.apple.com",
    "weather-analytics-events.apple.com",
    "notes-analytics-events.apple.com",
    "log.byteoversea.com",
    "analytics-sg.tiktok.com",
    "ads-sg.tiktok.com",
    "business-api.tiktok.com",
    "click.googleanalytics.com",
    "log.pinterest.com",
    "trk.pinterest.com",
    "analytics.yahoo.com",
    "adtech.yahooinc.com",
    "analytics.pointdrive.linkedin.com",
    "app.bugsnag.com",
    "browser.sentry-cdn.com",
    "app.getsentry.com",
    "freshmarketer.com",
    "fwtracks.freshmarketer.com",
    "claritybt.freshmarketer.com",
    "adtago.s3.amazonaws.com",
    "advice-ads.s3.amazonaws.com",
    "analytics.s3.amazonaws.com",
    "analyticsengine.s3.amazonaws.com",
    "adsafeprotected.com",
    "criteo.net",
    "ezodn.com",
    ];
    for (let i = 0; i < adDomains.length; i++) {
    rules.push({
      id: baseId + i,
      priority: 1,
      action: { type: "block" },
      condition: {
        urlFilter: `||${adDomains[i]}^`,
        resourceTypes: ["image", "sub_frame", "other"],
      },
    });
    }
    return rules;
}

async function replaceDynamicRules(addRules, removeAll = false) {
    // Remove existing dynamic rules
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const removeRuleIds = removeAll
        ? existingRules.map(r => r.id)
        : existingRules.map(r => r.id).filter(id => id >= 100);
    if (removeRuleIds.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds, addRules: [] });
    }
    // Add rules in batches of 4500 to avoid per-call limits
    let added = 0;
    for (let i = 0; i < addRules.length; i += 4500) {
        const batch = addRules.slice(i, i + 4500);
        await chrome.declarativeNetRequest.updateDynamicRules({ addRules: batch, removeRuleIds: [] });
        added += batch.length;
    }
    const refreshedRules = await chrome.declarativeNetRequest.getDynamicRules();
    return removeAll ? refreshedRules.length : refreshedRules.filter(r => r.id >= 100).length;
}

async function enterDegradedAllowMode(reason) {
    console.warn(`[uBR] Entering degraded allow mode: ${reason}`);
    runtimeHealth.degradedMode = true;
    runtimeHealth.degradedModeReason = reason;
    runtimeHealth.degradedModeTimestamp = Date.now();

    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: (await chrome.declarativeNetRequest.getDynamicRules()).map(r => r.id),
        addRules: [],
    });

    await chrome.declarativeNetRequest.updateSessionRules({
        removeRuleIds: (await chrome.declarativeNetRequest.getSessionRules()).map(r => r.id),
        addRules: [],
    });

    tabUnprocessedRequest.clear();
    dnrSyncCompleted = true;
    runtimeHealth.dnrDynamicRulesReady = false;
    runtimeHealth.filterListsReady = false;
    runtimeHealth.degradedMode = true;
    runtimeHealth.lastError = reason;

    return 0;
}

// Resource type mapping for filter options
const FILTER_RESOURCE_MAP = {
  script: "script",
  image: "image",
  stylesheet: "stylesheet",
  object: "object",
  xmlhttprequest: "xmlhttprequest",
  subdocument: "sub_frame",
  document: "main_frame",
  font: "font",
  media: "media",
  websocket: "websocket",
  ping: "ping",
  other: "other",
  xhr: "xmlhttprequest",
};

// Options that make a filter DNR-incompatible
const FILTER_INCOMPATIBLE_OPTIONS = new Set([
  "removeparam", "csp", "replace", "popup", "badfilter",
  "redirect", "redirect-rule", "urlskip", "specifichide",
  "generichide", "inline-font", "inline-script", "webrtc",
  "min", "max", "stealth", "empty", "mp4",
]);

// Domain importance scoring — ensures critical ad/tracker domains survive 30K truncation
const CRITICAL_DOMAIN_PRIORITY = {
  "doubleclick.net": 100,
  "googlesyndication.com": 100,
  "pagead2.googlesyndication.com": 100,
  "googleadservices.com": 100,
  "google-analytics.com": 100,
  "ssl.google-analytics.com": 100,
  "analytics.google.com": 100,
  "adservice.google.com": 100,
  "googletagmanager.com": 100,
  "googlesyndication.com/safeframe": 95,
  "google.com/pagead": 95,
  "google.com/ads": 95,
  "youtube.com/api/stats": 95,
  "ads.youtube.com": 95,
  "youtube.com/pagead": 95,
  "adnxs.com": 90,
  "adsrvr.org": 90,
  "criteo.com": 90,
  "pubmatic.com": 90,
  "rubiconproject.com": 90,
  "openx.net": 90,
  "advertising.com": 90,
  "media.net": 90,
  "static.media.net": 90,
  "casalemedia.com": 90,
  "contextweb.com": 90,
  "criteo.net": 85,
  "adsafeprotected.com": 85,
  "moatads.com": 85,
  "moat.com": 85,
  "scorecardresearch.com": 85,
  "quantserve.com": 85,
  "exelator.com": 85,
  "krxd.net": 85,
  "taboola.com": 85,
  "outbrain.com": 85,
  "amazon-adsystem.com": 85,
  "aax.amazon-adsystem.com": 85,
  "s3.amazonaws.com": 80,
  "adtago.s3.amazonaws.com": 80,
  "advice-ads.s3.amazonaws.com": 80,
  "analyticsengine.s3.amazonaws.com": 80,
  "connect.facebook.net": 85,
  "facebook.com/tr": 85,
  "pixel.facebook.com": 85,
  "analytics.tiktok.com": 80,
  "ads-api.tiktok.com": 80,
  "business-api.tiktok.com": 80,
  "ads-sg.tiktok.com": 80,
  "analytics-sg.tiktok.com": 80,
  "analytics.twitter.com": 80,
  "ads-api.twitter.com": 80,
  "analytics.pinterest.com": 80,
  "trk.pinterest.com": 80,
  "log.pinterest.com": 80,
  "events.reddit.com": 80,
  "ads.linkedin.com": 80,
  "analytics.pointdrive.linkedin.com": 80,
  "stats.wp.com": 80,
  "pixel.wp.com": 80,
  "adzerk.net": 80,
  "ezodn.com": 80,
  "tracking.rus.miui.com": 80,
  "data.mistat.xiaomi.com": 80,
  "data.mistat.india.xiaomi.com": 80,
  "data.mistat.rus.xiaomi.com": 80,
  "api.ad.xiaomi.com": 80,
  "sdkconfig.ad.xiaomi.com": 80,
  "sdkconfig.ad.intl.xiaomi.com": 80,
  "grs.hicloud.com": 75,
  "metrics2.data.hicloud.com": 75,
  "logbak.hicloud.com": 75,
  "metrics.data.hicloud.com": 75,
  "logservice1.hicloud.com": 75,
  "logservice.hicloud.com": 75,
  "ck.ads.oppomobile.com": 75,
  "data.ads.oppomobile.com": 75,
  "adx.ads.oppomobile.com": 75,
  "iot-eu-logser.realme.com": 75,
  "bdapi-ads.realmemobile.com": 75,
  "samsungads.com": 80,
  "samsung-com.112.2o7.net": 75,
  "smetrics.samsung.com": 75,
  "nmetrics.samsung.com": 75,
  "analytics-api.samsunghealthcn.com": 75,
  "iadsdk.apple.com": 75,
  "api-adservices.apple.com": 75,
  "books-analytics-events.apple.com": 75,
  "weather-analytics-events.apple.com": 75,
  "metrics.icloud.com": 75,
  "metrics.mzstatic.com": 75,
  "auction.unityads.unity3d.com": 80,
  "webview.unityads.unity3d.com": 80,
  "adserver.unityads.unity3d.com": 80,
  "config.unityads.unity3d.com": 80,
  "metrika.yandex.ru": 80,
  "mc.yandex.ru": 80,
  "appmetrica.yandex.ru": 80,
  "adfox.yandex.ru": 80,
  "adfstat.yandex.ru": 80,
  "analytics.query.yahoo.com": 80,
  "udcm.yahoo.com": 75,
  "geo.yahoo.com": 75,
  "log.fc.yahoo.com": 75,
  "gemini.yahoo.com": 80,
  "partnerads.ysm.yahoo.com": 80,
  "notify.bugsnag.com": 75,
  "sessions.bugsnag.com": 75,
  "api.bugsnag.com": 75,
  "app.bugsnag.com": 75,
  "browser.sentry-cdn.com": 75,
  "app.getsentry.com": 75,
  "fwtracks.freshmarketer.com": 75,
  "claritybt.freshmarketer.com": 75,
  "freshmarketer.com": 75,
  "click.googleanalytics.com": 100,
  "analytics.yahoo.com": 80,
  "adtech.yahooinc.com": 80,
  "log.byteoversea.com": 80,
  "analytics-sg.tiktok.com": 80,
  "ads-sg.tiktok.com": 80,
  "business-api.tiktok.com": 80,
  "adsfs.oppomobile.com": 75,
  "bdapi-in-ads.realmemobile.com": 75,
  "iot-logser.realme.com": 75,
  "notes-analytics-events.apple.com": 75,
  "adtago.s3.amazonaws.com": 80,
  "advice-ads.s3.amazonaws.com": 80,
  "analytics.s3.amazonaws.com": 80,
  "analyticsengine.s3.amazonaws.com": 80,
};

function getDomainFromRule(rule) {
  const urlFilter = rule?.condition?.urlFilter;
  if (!urlFilter) return null;
  const m = urlFilter.match(/^\|\|([a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  return m ? m[1] : null;
}

function getDomainPriority(domain) {
  if (!domain) return 0;
  if (CRITICAL_DOMAIN_PRIORITY[domain]) return CRITICAL_DOMAIN_PRIORITY[domain];
  const dots = domain.split(".");
  if (dots.length >= 2) {
    const tldPlus1 = dots.slice(-2).join(".");
    if (CRITICAL_DOMAIN_PRIORITY[tldPlus1]) return CRITICAL_DOMAIN_PRIORITY[tldPlus1];
  }
  return 1;
}

// ---------------------------------------------------------------------------
// Rule-safety compiler gate
// Classifies DNR rules by risk. High-risk rules (main_frame, script,
// xmlhttprequest, websocket, firstParty) that are not site-scoped should
// not be globally installed — they break unknown complex apps.
// ---------------------------------------------------------------------------

// Resource types that are high-risk when blocked globally
const HIGH_RISK_TYPES = new Set(["main_frame", "script", "xmlhttprequest", "websocket"]);

function classifyDnrRuleRisk(rule) {
    const types = new Set(rule.condition?.resourceTypes || []);

    // If no resourceTypes specified, it matches everything — high risk
    if (types.size === 0) return "high";

    for (const t of types) {
        if (HIGH_RISK_TYPES.has(t)) return "high";
    }

    // firstParty domainType without specific initiator is high risk
    if (rule.condition?.domainType === "firstParty" && !rule.condition?.initiatorDomains?.length) {
        return "high";
    }

    // Rules scoped to specific initiator domains are safer
    if (rule.condition?.initiatorDomains?.length > 0 || rule.condition?.requestDomains?.length > 0) {
        return "safe";
    }

    // Unspecific but non-high-risk types (image, sub_frame, other)
    return "medium";
}

function shouldInstallRule(rule) {
    const risk = classifyDnrRuleRisk(rule);

    // High-risk rules need specific site scoping
    if (risk === "high") {
        const hasScoping = (
            (rule.condition?.initiatorDomains?.length > 0) ||
            (rule.condition?.requestDomains?.length > 0) ||
            (rule.condition?.domains?.length > 0)
        );
        // Allow high-risk if scoped AND it has a specific domain filter
        if (hasScoping && rule.condition?.urlFilter) {
            return true;
        }
        // Also allow if it's an allow rule (exceptions)
        if (rule.action?.type === "allow") return true;
        return false;
    }

    // Medium-risk (image-only blocks, etc.) — allow
    if (risk === "medium") return true;

    // Safe — allow
    return true;
}

// Parse a single uBO filter line into DNR rule parts
function parseFilterLine(line) {
    line = line.trim();
    if (!line || line.startsWith("!") || line.startsWith("#") || line.startsWith("[")) return null;

    // HTML filters, scriptlet filters — skip entirely
    if (line.includes("##^") || line.includes("##+js")) return null;

    const result = {
    action: "block", urlFilter: null, resourceTypes: null,
    priority: 1, domain: null, initiatorDomains: null,
    excludedInitiatorDomains: null, domainType: null,
    cosmetic: null, skip: false,
    };

    // Exception filter
    if (line.startsWith("@@")) {
        result.action = "allow";
        result.priority = 100001;
        line = line.slice(2);
    }

    // Extract options (...$option1=val,option2)
    let optionsPart = "";
    const dollarIdx = line.lastIndexOf("$");
    if (dollarIdx !== -1) {
        const before = line.slice(dollarIdx + 1);
        // Allow alphanumeric, underscore, tilde, comma, hyphen, equals
        if (/^[a-zA-Z0-9_,~=-]+$/.test(before)) {
            optionsPart = before;
            line = line.slice(0, dollarIdx);
        } else {
            // Complex options — skip
            return null;
        }
    }

    // Parse options
    if (optionsPart) {
        const parsed = parseFilterOptions(optionsPart);
        if (parsed === null) return null;
        result.resourceTypes = parsed.types.length > 0 ? parsed.types : null;
        result.initiatorDomains = parsed.initiatorDomains;
        result.excludedInitiatorDomains = parsed.excludedInitiatorDomains;
        result.domainType = parsed.domainType;
        if (parsed.important) result.priority = 100001;
    }

    // Network filter patterns
    if (line.startsWith("||")) {
        const rest = line.slice(2);
        const caretIdx = rest.indexOf("^");
        const part = caretIdx !== -1 ? rest.slice(0, caretIdx) : rest;
        result.urlFilter = `||${part}^`;
        result.domain = part.replace(/\/.*$/, "");
    } else if (line.startsWith("|")) {
        result.urlFilter = line;
    } else if (line.endsWith("|")) {
        result.urlFilter = line;
    } else if (line.includes("^")) {
        result.urlFilter = line;
    } else if (/^https?:\/\//.test(line)) {
        result.urlFilter = `||${line.replace(/^https?:\/\//, "")}^`;
    } else if (/^[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(line)) {
        result.urlFilter = `||${line}^`;
    } else if (line.startsWith("/") && line.endsWith("/")) {
    // Regex filter — skip
        return null;
    } else if (line.startsWith("*")) {
    // Wildcard prefix — try extracting domain
        const m = line.match(/^\*([a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (m) {
            result.urlFilter = `||${m[1]}^`;
            result.domain = m[1];
        } else {
            return null;
        }
    } else {
        result.urlFilter = line;
    }

    return result;
}

// Parse filter options ($...) into DNR-compatible fields
function parseFilterOptions(optionsStr) {
    const types = [];
    let initiatorDomains = null;
    let excludedInitiatorDomains = null;
    let domainType = null;
    let important = false;

    // Handle domain= option specially (contains =)
    const domainMatch = optionsStr.match(/(?:^|,)domain=([^,]+)/);
    const optionsWithoutDomain = domainMatch
        ? optionsStr.replace(/(?:^|,)domain=[^,]+/, "")
        : optionsStr;

    if (domainMatch) {
        const val = domainMatch[1];
        const domains = val.split("|").filter(Boolean);
        const incl = [];
        const excl = [];
        for (const d of domains) {
            if (d.startsWith("~")) excl.push(d.slice(1));
            else incl.push(d);
        }
        if (incl.length > 0) initiatorDomains = incl;
        if (excl.length > 0) excludedInitiatorDomains = excl;
    }

    const parts = optionsWithoutDomain.split(",").filter(Boolean);
    for (const p of parts) {
        const name = p.replace(/^~/, "").toLowerCase();
        const negated = p.startsWith("~");

        if (FILTER_INCOMPATIBLE_OPTIONS.has(name)) return null;

        if (name === "important") {
            important = true;
        } else if ((name === "third-party" || name === "3p") && !negated) {
            domainType = "thirdParty";
        } else if ((name === "first-party" || name === "1p") && !negated) {
            domainType = "firstParty";
        } else if (name === "match-case") {
            // DNR urlFilter is case-sensitive by default — no action needed
        } else if (FILTER_RESOURCE_MAP[name] && !negated) {
      types.push(FILTER_RESOURCE_MAP[name]);
        }
    // Negated types (~script, ~image) — skip for now
    }

    return { types, initiatorDomains, excludedInitiatorDomains, domainType, important };
}

// Compile filter text to DNR rules
function compileFilterTextToDNR(filterText, startId = 100) {
    const rules = [];
    const cosmeticFilters = { generic: [], specific: [] };
    const seen = new Set();
    let ruleId = startId;

    const lines = filterText.split("\n");
    for (const rawLine of lines) {
        const parsed = parseFilterLine(rawLine);
        if (!parsed) continue;

        // Cosmetic filters
        if (parsed.cosmetic) {
            if (parsed.cosmetic.type === "generic") {
        cosmeticFilters.generic.push(parsed.cosmetic.selector);
            } else {
        cosmeticFilters.specific.push({ domains: parsed.cosmetic.domains, selector: parsed.cosmetic.selector });
            }
            continue;
        }

        // Network filters
        if (!parsed.urlFilter) continue;

        // Deduplicate
        const key = `${parsed.urlFilter  }|${  Array.isArray(parsed.resourceTypes) ? parsed.resourceTypes.join(",") : ""  }|${  parsed.action}`;
        if (seen.has(key)) continue;
    seen.add(key);

    const rule = {
      id: ruleId++,
      priority: parsed.priority,
      action: { type: parsed.action },
      condition: { urlFilter: parsed.urlFilter },
    };

    if (parsed.resourceTypes && parsed.resourceTypes.length > 0) {
        rule.condition.resourceTypes = parsed.resourceTypes;
    }
    if (parsed.initiatorDomains) {
        rule.condition.initiatorDomains = parsed.initiatorDomains;
    }
    if (parsed.excludedInitiatorDomains) {
        rule.condition.excludedInitiatorDomains = parsed.excludedInitiatorDomains;
    }
    if (parsed.domainType) {
        rule.condition.domainType = parsed.domainType;
    }

    rules.push(rule);
    if (ruleId - startId >= 30000) break;
    }

    return { rules, cosmeticFilters };
}

// Fetch with timeout
async function fetchWithTimeout(url, ms = 10000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
        const response = await fetch(url, { signal: controller.signal });
        return response;
    } finally {
        clearTimeout(timer);
    }
}

// Load a filter list — try bundled first, then CDN fallback
async function loadFilterList(asset) {
    const bundledPath = resolveBundledFilterListPath(asset);
    let text = "";
    if (bundledPath) {
        try {
            const response = await fetch(chrome.runtime.getURL(bundledPath));
            if (response.ok) {
                text = await response.text();
            }
        } catch (e) {
            console.warn("[uBR] fetchBundledResource: fetch failed", bundledPath, e);
        }
    }
    // If bundled is empty or a stub, try CDN
    if ((!text || text.trim() === "stub" || text.trim() === "") && Array.isArray(asset.cdnURLs) && asset.cdnURLs.length > 0) {
        for (const url of asset.cdnURLs) {
            try {
                const response = await fetchWithTimeout(url, 15000);
                if (response.ok) {
                    text = await response.text();
                    if (text && text.trim() !== "stub") break;
                }
            } catch (e) {
        console.warn(`[uBR] CDN fetch failed for ${url}: ${e?.message || e}`);
            }
        }
    }
    return text && text.trim() !== "stub" ? text : null;
}

// Load all selected filter lists and compile to DNR
async function compileSelectedLists() {
    const result = { rules: [], cosmeticFilters: { generic: [], specific: [] }, loadedLists: [] };
    let nextRuleId = 100;

    const stored = await chrome.storage.local.get(["selectedFilterLists", "userFilters", "user-filters", "userSettings"]);
    let selectedLists = normalizeSelectedFilterLists(stored.selectedFilterLists);

    // Bootstrap defaults if empty — use curated default set
    if (selectedLists.length === 0) {
        selectedLists = [
      FILTER_LIST_USER_PATH,
      "ublock-filters",
      "ublock-privacy",
      "ublock-badware",
      "ublock-quick-fixes",
      "ublock-unbreak",
      "easylist",
      "easyprivacy",
      "plowe-0",
        ];
        await chrome.storage.local.set({ selectedFilterLists: selectedLists });
    }

    const catalog = await fetchFilterListCatalog().catch(e => { console.warn("[uBR] sw: compileSelectedLists fetchFilterListCatalog failed", e); return {}; });

  console.log(`[uBR] compileSelectedLists: ${selectedLists.length} lists selected`);
  for (const listKey of selectedLists) {
    console.log(`[uBR]   Processing list: "${listKey}"`);
    // User filters
    if (listKey === FILTER_LIST_USER_PATH) {
        const userFilters = typeof stored.userFilters === "string"
            ? stored.userFilters
            : typeof stored["user-filters"] === "string"
                ? stored["user-filters"]
                : "";
        if (userFilters) {
            const compiled = compileFilterTextToDNR(userFilters, nextRuleId);
            nextRuleId += compiled.rules.length;
        result.rules.push(...compiled.rules);
        result.cosmeticFilters.generic.push(...compiled.cosmeticFilters.generic);
        result.cosmeticFilters.specific.push(...compiled.cosmeticFilters.specific);
        result.loadedLists.push(listKey);
        console.log(`[uBR]   Loaded user filters: ${compiled.rules.length} rules`);
        } else {
        console.log(`[uBR]   User filters: empty, skipping`);
        }
        continue;
    }

    // Catalog-based lists
    const asset = catalog[listKey];
    if (!asset) {
      console.log(`[uBR]   NOT FOUND in catalog, skipping`);
      continue;
    }
    console.log(`[uBR]   Found in catalog, contentURL=${Array.isArray(asset.contentURL) ? asset.contentURL[0] : asset.contentURL}, cdnURLs=${Array.isArray(asset.cdnURLs) ? asset.cdnURLs.length : 0}`);

    const filterText = await loadFilterList(asset);
    if (!filterText) {
      console.log(`[uBR]   loadFilterList returned null, skipping`);
      continue;
    }
    console.log(`[uBR]   Downloaded ${filterText.length} bytes`);

    const compiled = compileFilterTextToDNR(filterText, nextRuleId);
    nextRuleId += compiled.rules.length;
    result.rules.push(...compiled.rules);
    result.cosmeticFilters.generic.push(...compiled.cosmeticFilters.generic);
    result.cosmeticFilters.specific.push(...compiled.cosmeticFilters.specific);
        result.loadedLists.push(listKey);
        await setFilterListCacheEntry(listKey, { writeTime: Date.now() });
        console.log(`[uBR]   Compiled ${compiled.rules.length} rules from ${listKey}`);
    if (result.rules.length >= 200000) {
      console.log(`[uBR]   Reached max total rules (200K), stopping list compilation`);
      break;
    }
  }

  return result;
}

// Main orchestrator: load filter lists, compile to DNR, install rules, store cosmetics
async function syncFilterListDnrRules() {
    const token = OperationToken.acquire("dnr-sync", "default", { policyRevision: runtimeHealth.filterListVersions?.revision });
    try {
        const compiled = await compileSelectedLists();
    if (!token.isCurrent()) { console.log("[uBR] DNR sync superseded, discarding"); return 0; }
        const rules = compiled.rules;
    console.log(`[uBR] Compiled ${rules.length} DNR rules from ${compiled.loadedLists.length} lists`);

    if (rules.length === 0) {
      DnrDecisionStore.record({ action: "skip", ruleIds: [], source: "syncFilterListDnrRules", reason: "no-rules-compiled" });
      console.log("[uBR] No rules from filter lists, entering degraded allow mode");
      tabUnprocessedRequest.clear();
      dnrSyncCompleted = true;
      runtimeHealth.degradedMode = true;
      runtimeHealth.lastError = 'No rules compiled from filter lists';
      return await enterDegradedAllowMode('No rules compiled from filter lists');
    }

    // Normalize and deduplicate rules while preserving specificity
    const deduped = [];
    const seenKeys = new Set();
    let criticalCount = 0;
    for (const rule of rules) {
        const r = {
            id: rule.id,
            priority: rule.priority || 1,
            action: { type: rule.action?.type || "block" },
            condition: { ...(rule.condition || {}) },
        };
        delete r.condition.domain;
        delete r.condition.cosmetic;
        delete r.condition.skip;
        delete r.condition.exception;
        if (r.condition.regexFilter && r.condition.regexFilter.length > 2048) continue;
        const key = JSON.stringify({ action: r.action, condition: r.condition });
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);
        const domain = getDomainFromRule(r);
        const priority = getDomainPriority(domain);
        if (!shouldInstallRule(r)) {
            continue;
        }
        if (domain && priority >= 75) criticalCount++;
        deduped.push({ rule: r, domain, priority });
    }

    deduped.sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return a.rule.id - b.rule.id;
    });

    const allReady = deduped.map(({ rule }) => rule);
    const dynamicRules = allReady.slice(0, DYNAMIC_RULE_LIMIT);

    const hostnameBlockSet = new Set();
    const otherInitialSession = [];
    for (const rule of allReady.slice(DYNAMIC_RULE_LIMIT)) {
        if (getDomainFromRule(rule) === null) {
            otherInitialSession.push(rule);
        }
    }

    console.log(`[uBR] Normalized ${rules.length} input rules → ${deduped.length} (${criticalCount} priority domains, ${dynamicRules.length} dynamic, ${otherInitialSession.length} session)`);

    // Pre-installation quota check
    const quotaCheck = QuotaManager.checkDnrQuota("dynamic", dynamicRules.length);
    if (!quotaCheck.ok) {
        console.warn(`[uBR] DNR dynamic quota check failed: ${quotaCheck.reason} (current=${quotaCheck.current}, limit=${quotaCheck.limit})`);
    }
    if (otherInitialSession.length > 0) {
        QuotaManager.checkDnrQuota("session", otherInitialSession.length);
    }

    DnrDecisionStore.record({
        action: "install-attempt",
        ruleIds: dynamicRules.slice(0, 100).map(r => String(r.id)),
        source: "syncFilterListDnrRules",
        reason: `dynamic=${dynamicRules.length}, session=${otherInitialSession.length}`,
    });

    try {
        if (!token.isCurrent()) { console.log("[uBR] DNR sync stale before install, aborting"); return 0; }
        const dynCount = await replaceDynamicRules(dynamicRules, true);

        if (!token.isCurrent()) { console.log("[uBR] DNR sync stale after dynamic install, will not commit session"); return 0; }

        let sessCount = 0;
        if (otherInitialSession.length > 0) {
            await chrome.declarativeNetRequest.updateSessionRules({
            removeRuleIds: (await chrome.declarativeNetRequest.getSessionRules()).filter(r => r.id < 30000).map(r => r.id),
            addRules: otherInitialSession.slice(0, 5000).map((r, i) => ({ ...r, id: 23000000 + i })),
            });
            sessCount = Math.min(otherInitialSession.length, 5000);
        }
        const count = dynCount + sessCount;

        // Record success in audit store
        DnrDecisionStore.record({
            action: "install-success",
            ruleIds: dynamicRules.slice(0, 100).map(r => String(r.id)),
            source: "syncFilterListDnrRules",
            reason: `installed ${dynCount} dynamic, ${sessCount} session`,
        });
        QuotaManager.recordDnrUsage("dynamic", dynCount);
        QuotaManager.recordDnrUsage("session", sessCount);

        await chrome.storage.local.set({ [STORAGE_KEY_HOSTNAME_BLOCK]: [...hostnameBlockSet], [STORAGE_KEY_HOSTNAME_BLOCK_TS]: Date.now() });
        cachedHostnameBlockSet = hostnameBlockSet;
      console.log(`[uBR] Installed ${dynCount} dynamic rules, ${hostnameBlockSet.size} hostnames cached, ${sessCount} initial session rules`);

      if (dynCount >= DYNAMIC_RULE_LIMIT * 0.95 || sessCount >= 5000) {
          runtimeHealth.adaptiveMode = true;
          console.warn(`[uBR] DNR budget near limit, switching to adaptive mode (${dynCount} dynamic, ${sessCount} session)`);
      } else {
          runtimeHealth.adaptiveMode = false;
      }

      if (compiled.listVersions) {
          runtimeHealth.filterListVersions = compiled.listVersions;
          const outdated = Object.entries(compiled.listVersions)
              .filter(([, v]) => v && v.outdated === true)
              .map(([k]) => k);
          if (outdated.length > 0) {
              runtimeHealth.filterListsOutdated = outdated;
              console.warn(`[uBR] Outdated filter lists detected: ${outdated.join(', ')}`);
          }
      }

      if (compiled.cosmeticFilters) {
          await chrome.storage.local.set({
          cosmeticFiltersData: JSON.stringify({
            genericCosmeticFilters: compiled.cosmeticFilters.generic || [],
            genericCosmeticExceptions: [],
            specificCosmeticFilters: compiled.cosmeticFilters.specific || [],
            scriptletFilters: [],
          }),
          });
      }
      await chrome.storage.local.set({ [STORAGE_KEY_COMPILED_COUNTS]: { netFilterCount: count, cosmeticFilterCount: compiled.cosmeticFilters?.generic?.length || 0 } });
      try {
        new BroadcastChannel("uBR").postMessage({ what: "staticFilteringDataChanged" });
        new BroadcastChannel("uBR").postMessage({ what: "assetsUpdated" });
      } catch (e) {
        console.warn("[uBR] BroadcastChannel postCompilation:", e);
      }
      tabUnprocessedRequest.clear();
      dnrSyncCompleted = true;
      runtimeHealth.dnrStaticRulesReady = true;
      runtimeHealth.filterListsReady = true;
      runtimeHealth.degradedMode = false;
      runtimeHealth.lastError = '';

      token.release();
      return count;
    } catch (e) {
      DnrDecisionStore.record({
          action: "install-failure",
          ruleIds: dynamicRules.slice(0, 100).map(r => String(r.id)),
          source: "syncFilterListDnrRules",
          reason: e instanceof Error ? e.message : String(e),
      });
      console.warn("[uBR] Rule installation failed, entering degraded allow mode:", e);
      tabUnprocessedRequest.clear();
      dnrSyncCompleted = true;
      runtimeHealth.degradedMode = true;
      runtimeHealth.lastError = 'Rule installation failed, entering degraded allow mode';
      token.release();
      return await enterDegradedAllowMode('Rule installation failed: ' + (e instanceof Error ? e.message : String(e)));
    }
    } catch (e) {
    DnrDecisionStore.record({
        action: "sync-failure",
        ruleIds: [],
        source: "syncFilterListDnrRules",
        reason: e instanceof Error ? e.message : String(e),
    });
    console.error("[uBR] Failed to sync filter list rules:", e);
    runtimeHealth.degradedMode = true;
    runtimeHealth.lastError = e instanceof Error ? e.message : String(e);
    token.release();
    return 0;
    }
}

async function getFilterListState() {
    // Check if DNR rules are installed — if not, trigger sync
    const installedRules = await chrome.declarativeNetRequest.getDynamicRules().catch(e => { console.warn("[uBR] sw: getFilterListState getDynamicRules failed", e); return []; });
    if (installedRules.length === 0) {
        void syncFilterListDnrRules().catch(err => { console.warn("[uBR] DNR sync on startup check failed:", err); });
    }

    const catalog = await fetchFilterListCatalog().catch(e => { console.warn("[uBR] sw: getFilterListState fetchFilterListCatalog failed", e); return {}; });
    const stored = await chrome.storage.local.get(["selectedFilterLists", "availableFilterLists", "userSettings"]);
    const storedUserSettings = stored.userSettings || {};
    const importedLists = normalizeImportedLists(storedUserSettings.importedLists);
    const availableFromStorage = stored.availableFilterLists;

    let selectedFilterLists = normalizeSelectedFilterLists(stored.selectedFilterLists);
    if (selectedFilterLists.length === 0) {
        if (availableFromStorage && Object.keys(availableFromStorage).length !== 0) {
            selectedFilterLists = Object.entries(availableFromStorage)
        .filter(([, d]) => d?.content === "filters" && d?.off !== true)
        .map(([k]) => k);
            if (selectedFilterLists.includes(FILTER_LIST_USER_PATH) === false) {
        selectedFilterLists.unshift(FILTER_LIST_USER_PATH);
            }
        } else {
            selectedFilterLists = deriveDefaultSelectedFilterLists(catalog, FILTER_LIST_USER_PATH);
            await chrome.storage.local.set({ selectedFilterLists });
        }
    }

    const selectedListSet = new Set(selectedFilterLists);
  selectedListSet.add(FILTER_LIST_USER_PATH);
  const available = buildAvailableFilterLists(catalog, importedLists, selectedListSet);
  for (const d of Object.values(available)) {
      if (d?.parent == null) delete d.parent;
  }

  const counts = await estimateFilterCounts(available);
  await chrome.storage.local.set({ availableFilterLists: available });

  const filterListCache = await getFilterListCache();

  return {
    autoUpdate: storedUserSettings.autoUpdate,
    available,
    cache: filterListCache,
    cosmeticFilterCount: counts.cosmeticFilterCount,
    current: cloneObject(available),
    ignoreGenericCosmeticFilters: storedUserSettings.ignoreGenericCosmeticFilters,
    isUpdating: filterListsUpdating,
    netFilterCount: counts.netFilterCount,
    parseCosmeticFilters: true,
    suspendUntilListsAreLoaded: storedUserSettings.suspendUntilListsAreLoaded,
    userFiltersPath: FILTER_LIST_USER_PATH,
  };
}

async function applyFilterListSelection(payload) {
    const catalog = await fetchFilterListCatalog().catch(e => { console.warn("[uBR] sw: applyFilterListSelection fetchFilterListCatalog failed", e); return {}; });
    const stored = await chrome.storage.local.get(["selectedFilterLists", "userSettings"]);
    const currentUserSettings = { ...(stored.userSettings || {}) };
    const importedSet = new Set(normalizeImportedLists(currentUserSettings.importedLists));
    const selectedSet = new Set(normalizeSelectedFilterLists(stored.selectedFilterLists));
  selectedSet.add(FILTER_LIST_USER_PATH);

  if (Array.isArray(payload.toSelect)) {
    selectedSet.clear();
    selectedSet.add(FILTER_LIST_USER_PATH);
    for (const key of payload.toSelect) {
        if (typeof key === "string" && key.trim() !== "") selectedSet.add(key.trim());
    }
  }

  if (typeof payload.toImport === "string" && payload.toImport.trim() !== "") {
      for (const imported of extractListURLs(payload.toImport)) {
          const resolved = resolveStockAssetKeyFromURL(catalog, imported);
          if (resolved === imported) importedSet.add(imported);
      selectedSet.add(resolved);
      }
  }

  if (Array.isArray(payload.toRemove)) {
      for (const key of payload.toRemove) {
          if (typeof key !== "string" || key.trim() === "") continue;
      importedSet.delete(key.trim());
      selectedSet.delete(key.trim());
      }
  }

  const nextUserSettings = { ...currentUserSettings, importedLists: Array.from(importedSet).sort() };
  await chrome.storage.local.set({
    selectedFilterLists: Array.from(selectedSet),
    userSettings: nextUserSettings,
  });

  await syncFilterListDnrRules();
  PolicySnapshot.invalidateAll({ reason: "filter-list-selection" });
  return getFilterListState();
}

async function reloadAllFilterLists() {
    filterListsUpdating = true;
    try {
        await syncFilterListDnrRules();
        PolicySnapshot.invalidateAll({ reason: "filter-list-reload" });
        return await getFilterListState();
    } finally {
        filterListsUpdating = false;
    }
}

async function updateFilterListsNow(payload) {
    filterListsUpdating = true;
    try {
        await syncFilterListDnrRules();
        PolicySnapshot.invalidateAll({ reason: "filter-list-update" });
        return await getFilterListState();
    } finally {
        filterListsUpdating = false;
    }
}

function handleCodeViewer(msg) {
    if (msg.what === "gotoURL") {
        const url = msg?.details?.url;
        if (url) {
            const fullUrl = url.startsWith("http") || url.startsWith("chrome-extension://")
                ? url
                : chrome.runtime.getURL(url);
      chrome.tabs.create({ url: fullUrl, active: true }).catch(e => { console.warn("[uBR] tabs.create codeViewer:", e); });
        }
        return { ok: true };
    }
    return { error: `Unhandled codeViewer: ${  msg.what}` };
}

function handleDOMInspectorContent(msg, senderTabId, senderFrameId) {
    if (msg.what === "getInspectorArgs") {
    // Broadcast tab/frame identity on contentInspectorChannel AFTER the
    // scriptlet is already running and listening (this handler is called
    // from the content script, not from the logger page).
        if (senderTabId) {
            try {
                const bc = new BroadcastChannel("contentInspectorChannel");
        bc.postMessage({ what: "contentInspectorChannel", tabId: senderTabId, frameId: senderFrameId || 0 });
            } catch (e) {
                console.warn("[uBR] BroadcastChannel contentInspectorChannel:", e);
            }
        }
        const secret = Math.random().toString(36).slice(2, 10);
        return {
      inspectorURL: chrome.runtime.getURL(
          `/web_accessible_resources/dom-inspector.html?secret=${secret}`
      ),
        };
    }
    return { error: `Unhandled domInspectorContent: ${  msg.what}` };
}

// ---------------------------------------------------------------------------
// Port-based messaging
// ---------------------------------------------------------------------------
chrome.runtime.onConnect.addListener(port => {
  const senderTabId = port.sender?.tab?.id;

  if (port.sender?.url && port.sender.url.includes("/popup-fenix.html")) {
      popupPortTabId = port.sender?.tab?.id || 0;
    port.onDisconnect.addListener(() => {
        void chrome.runtime.lastError;
        popupPortTabId = 0;
    });
  }

  port.onMessage.addListener(async message => {
      const channel = message?.channel;
      const msgId = message?.msgId;
      const msg = message?.msg;
      try {
          const response = await dispatchMessage(channel, { ...msg, _tabId: senderTabId, _frameId: port.sender?.frameId }, senderTabId, port.sender?.frameId);
          if (msgId !== undefined) try { port.postMessage({ msgId, msg: response }); } catch (e) { console.warn('[uBR] port.postMessage response failed:', e); }
      } catch (err) {
          const errMsg = String(err?.message || err);
          console.warn('[uBR SW] Port message error:', errMsg, 'channel:', channel);
          if (msgId !== undefined) try { port.postMessage({ msgId, msg: { error: errMsg } }); } catch (e) { console.warn('[uBR] port.postMessage error response failed:', e); }
      }
  });
});

// ---------------------------------------------------------------------------
// One-shot messaging
// ---------------------------------------------------------------------------
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const channel = message?.channel || message?.topic;
  const msg = message?.msg || message?.payload;
  const senderTabId = sender?.tab?.id;
  void dispatchMessage(channel, { ...msg, _tabId: senderTabId, _frameId: sender.frameId, _documentId: sender.documentId }, senderTabId, sender.frameId)
    .then(sendResponse)
    .catch(err => {
        const errMsg = String(err?.message || err);
      console.warn('[uBR SW] One-shot message error:', errMsg, 'channel:', channel);
      sendResponse({ error: errMsg });
    });
  return true;
});

// ---------------------------------------------------------------------------
// Custom new tab interception
// ---------------------------------------------------------------------------
chrome.tabs.onCreated.addListener(tab => {
    if (tab.id) void interceptNewTab(tab.id, tab.url || tab.pendingUrl || "");
});

// ---------------------------------------------------------------------------
// Inject cosmetic CSS into pages when tabs update
// ---------------------------------------------------------------------------
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url !== undefined || changeInfo.status === "loading") {
      void syncActionAvailability(tabId, changeInfo.url || tab.url);
      if (changeInfo.url === "chrome://newtab/") {
          void interceptNewTab(tabId, changeInfo.url);
      }
  }
  if (changeInfo.status === "loading") {
      resetBlockedCountBadge(tabId);
      if (tab.url && !isExtensionURL(tab.url) && tab.url.startsWith("http")) {
          void chrome.scripting.removeCSS({
          target: { tabId },
          css: LEGACY_BUILTIN_COSMETIC_CSS,
          }).catch(e => { console.warn("[uBR] scripting.removeCSS failed for tab", tabId, e); });
      }
      // Bump revision so polling detects tab navigation changes
      markTabChanged(tabId);
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.url && isYouTubeHost(changeInfo.url)) {
        ytEngine.onTabNavigate(tabId, changeInfo.url);
    }
});



// ---------------------------------------------------------------------------
// Keyboard shortcut: toggle custom new tab
// ---------------------------------------------------------------------------
chrome.commands.onCommand.addListener(async (command) => {
    if (command !== "toggle-newtab") return;
    _showCustomNewTab = !_showCustomNewTab;
    await chrome.storage.local.set({ showCustomNewTab: _showCustomNewTab }).catch(() => {});
    await syncNewTabToUserSettings(_showCustomNewTab);
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) return;
    const ourUrl = chrome.runtime.getURL("pages/newtab.html");
    if (_showCustomNewTab && tab.url === "chrome://newtab/") {
        chrome.tabs.update(tab.id, { url: ourUrl }).catch(() => {});
    } else if (!_showCustomNewTab && tab.url === ourUrl) {
        chrome.tabs.update(tab.id, { url: "chrome://newtab/" }).catch(() => {});
    }
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
    ytEngine.onTabActivate(tabId);
    void chrome.tabs.get(tabId)
        .then(tab => syncActionAvailability(tabId, tab.url))
        .catch(e => { console.warn("[uBR] tabs.get onActivated:", e); });
});

// Clean up stale tab state periodically
chrome.tabs.onRemoved.addListener(tabId => {
  blockedDnrCountByTab.delete(tabId);
  blockedCosmeticCountByTab.delete(tabId);
  pendingBadgeUpdates.delete(tabId);
  ytEngine.onTabRemove(tabId);
  reqStats.byTab.delete(tabId);
  tabContentRevision.delete(tabId);
  tabUnprocessedRequest.delete(tabId);
  const tabHns = tabHostnames.get(tabId);
  if (tabHns) {
      for (const hn of tabHns) hostnameStats.delete(hn);
      tabHostnames.delete(tabId);
  }
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("[uBR] SW installed/updated — syncing filter lists (first-time download)");
  installContextMenu();
  void loadPolicyProfiles().then(() => {
    return clearDnrStateForSchemaUpgrade().then(() => syncStealthSurrogateRules()).then(removeLegacyBuiltInCosmetics).then(cleanupLegacyGlobalCosmeticFilters).then(cleanupStaleYouTubeMastheadFilters).then(() => syncFilterListDnrRules()).then(count => {
      console.log(`[uBR] Initial DNR sync complete: ${count} rules installed`);
    });
  });
});
// Startup: load cached hostname index, restore session state, verify dynamic rules
void (async () => {
    try {
        await loadPolicyProfiles();
        installContextMenu();
        await clearDnrStateForSchemaUpgrade();
        await loadCachedHostnameIndex();
        await restoreSessionState();
        void chrome.declarativeNetRequest.getAvailableStaticRuleCount().then(count => {
            console.log(`[uBR] Available static DNR rule budget: ${count} / 30000`);
        });
        await syncActionAvailabilityForOpenTabs();
        await loadCustomNewTabState();
        await syncStealthSurrogateRules();
        await removeLegacyBuiltInCosmetics();
        await cleanupLegacyGlobalCosmeticFilters();
        await cleanupStaleYouTubeMastheadFilters();
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
            if (tab.id && tab.url && isYouTubeHost(tab.url)) {
                ytEngine.onTabNavigate(tab.id, tab.url);
            }
        }
        ytEngine.init({ manifestVersion: "1.0", criticalEndpointRegistryVersion: "1.0", rulePrioritySchemaVersion: "1.0", youtubeRuleIdRangeVersion: "1.0", surrogateSchemaVersion: "1.0", sanitizerSchemaVersion: "1.0", bootstrapVersion: "1.0", wrapperRiskSchemaVersion: "1.0", cosmeticSelectorRegistryVersion: "1.0" });
        await smartEngine.init();
        void readManagedPolicy();
        startIdleDetection();
        const count = await ensureFilterRules();
        if (count === 0) {
            console.log("[uBR] ensureFilterRules returned 0, fallback may be needed");
        } else {
            console.log(`[uBR] Startup complete: ${count} DNR rules active + ${cachedHostnameBlockSet?.size || 0} hostnames cached for on-demand`);
        }
    } catch (e) {
    console.warn("[uBR] Error during startup filter initialization:", e);
    void ensureFilterRules().catch(err => { console.warn("[uBR] Retry ensureFilterRules failed:", err); });
    }
})();
console.log("[uBR] SW started");
