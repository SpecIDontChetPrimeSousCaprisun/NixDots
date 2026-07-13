// GENERATED FILE. Do not edit directly.
// Source: src/core/smart-cosmetic/engine.ts
// Build command: npm run build
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/core/smart-cosmetic/smart-rule-schema.ts
function normalizeRuleState(state) {
  return STATE_ALIASES[state] ?? state;
}
function isValidStateTransition(from, to, rule) {
  if (!STATE_TRANSITIONS[from].includes(to)) return false;
  if (to === "active" && rule?.preview?.status && ACTIVE_BLOCKED_PREVIEW_STATUSES.has(rule.preview.status)) return false;
  return true;
}
var STATE_TRANSITIONS, STATE_ALIASES, ACTIVE_BLOCKED_PREVIEW_STATUSES, DEFAULT_BOUNDARY, DEFAULT_SAFETY, DEFAULT_PERFORMANCE, DEFAULT_FRAMES, DEFAULT_SHADOW, DEFAULT_RUNTIME, DEFAULT_CACHE, DEFAULT_LOGIC_OPTIONS, RULE_ID_PREFIX, SAFE_STYLE_PROPERTIES, DEFAULT_THRESHOLDS, DEFAULT_WEIGHT_PROFILES;
var init_smart_rule_schema = __esm({
  "src/core/smart-cosmetic/smart-rule-schema.ts"() {
    STATE_TRANSITIONS = {
      draft: ["needs-preview", "previewed", "disabled"],
      "needs-preview": ["previewed", "disabled", "error"],
      previewed: ["active", "needs-preview", "disabled", "error", "partial"],
      active: ["disabled", "paused", "needs-preview", "previewed", "partial", "awaiting-scope"],
      disabled: ["draft", "active", "previewed"],
      paused: ["active", "disabled"],
      error: ["draft", "disabled"],
      "awaiting-scope": ["active", "disabled"],
      partial: ["active", "disabled", "needs-preview"]
    };
    STATE_ALIASES = {
      enabled: "active"
    };
    ACTIVE_BLOCKED_PREVIEW_STATUSES = /* @__PURE__ */ new Set(["required", "previewed", "stale", "forced-by-policy"]);
    DEFAULT_BOUNDARY = Object.freeze({
      mode: "repeated-card",
      maxDepth: 8,
      stopAtScope: true,
      allowCrossScope: false,
      allowScopeRoot: false,
      includeSelf: false,
      allowPageRoot: false
    });
    DEFAULT_SAFETY = Object.freeze({
      preview: "required",
      maxMatches: 100,
      maxPagePercent: 25,
      maxViewportAreaPercent: 40,
      minFeatures: 3,
      minLogicMatches: 1,
      allowPartialApply: false,
      warnIfScopeIsBody: true,
      warnIfNoWhereLogic: true,
      warnIfActionRemove: true,
      warnIfWeakExactReference: true,
      confirmPageRoot: false
    });
    DEFAULT_PERFORMANCE = Object.freeze({
      maxCandidates: 150,
      maxEvaluationsPerCycle: 150,
      maxAddedNodesPerCycle: 300,
      maxRegexMsPerRuleCycle: 10,
      maxRegexPatternLength: 256,
      maxTextRegexInputChars: 4096,
      debounceMs: 100,
      dependencyDepth: 3,
      dependencyPrefilter: true,
      preferCssPrefilter: true,
      metrics: "collect",
      sampleRate: 1
    });
    DEFAULT_FRAMES = Object.freeze({
      mode: "top-only",
      accounting: "per-frame",
      maxTotalMatches: 150
    });
    DEFAULT_SHADOW = Object.freeze({
      mode: "none",
      observeMutations: true,
      observeRecursive: false,
      allowHostAncestor: false,
      maxRootsPerCycle: 20
    });
    DEFAULT_RUNTIME = Object.freeze({
      observePathChanges: true,
      pathChangeDebounceMs: 200,
      reEvaluateOnPathChange: "smart",
      observeSubtree: true,
      observeAttributes: "auto",
      errorRecovery: "continue",
      onBudgetExceeded: "stop-cycle",
      maxConsecutivePartialCycles: 3
    });
    DEFAULT_CACHE = Object.freeze({
      maxEntries: 1e3,
      maxAgeMs: 6e4,
      evictionPolicy: "LRU",
      scope: "per-rule"
    });
    DEFAULT_LOGIC_OPTIONS = Object.freeze({
      stopAtScopeForAncestor: true
    });
    RULE_ID_PREFIX = "ubr:smart:";
    SAFE_STYLE_PROPERTIES = /* @__PURE__ */ new Set([
      "display",
      "visibility",
      "opacity",
      "outline",
      "outline-color",
      "outline-style",
      "outline-width",
      "outline-offset",
      "border",
      "border-color",
      "border-style",
      "border-width",
      "background-color",
      "color",
      "filter",
      "pointer-events"
    ]);
    DEFAULT_THRESHOLDS = Object.freeze({
      "hide-similar:similar:default-card": 0.82,
      "hide-similar:similar:": 0.82,
      "hide-similar:structural": 0.8,
      "smart-hide:similar:strong-logic": 0.74,
      "smart-hide:structural:strong-logic": 0.76,
      "smart-hide:similar:": 0.82,
      "smart-hide:similar:content-heavy": 0.78
    });
    DEFAULT_WEIGHT_PROFILES = Object.freeze({
      "default-card": Object.freeze({
        roleTag: 1,
        textTokens: 1.5,
        semanticText: 1.5,
        href: 2,
        dataAttrs: 1.5,
        aria: 1.2,
        structure: 2,
        visualBox: 1,
        classes: 0.25,
        nthChild: 0.5
      }),
      "structural-heavy": Object.freeze({
        structure: 4,
        roleTag: 1.5,
        classes: 0.25,
        visualBox: 1.5,
        textTokens: 0.5,
        semanticText: 0.8,
        href: 1,
        dataAttrs: 1.5,
        aria: 0.8,
        nthChild: 0.8
      }),
      "content-heavy": Object.freeze({
        textTokens: 3,
        semanticText: 3,
        href: 2,
        roleTag: 0.7,
        dataAttrs: 1.5,
        aria: 1.8,
        structure: 1,
        classes: 0.1,
        visualBox: 0.5,
        nthChild: 0.2
      })
    });
  }
});

// src/core/smart-cosmetic/smart-rule-parser.ts
var smart_rule_parser_exports = {};
__export(smart_rule_parser_exports, {
  extractRulesFromParsed: () => extractRulesFromParsed,
  parseSmartRules: () => parseSmartRules,
  parseYaml: () => parseYaml,
  parseYamlLines: () => parseYamlLines
});
function inferScalar(raw) {
  const trimmed = raw.trim();
  if (trimmed === "null" || trimmed === "~") return null;
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return trimmed.includes(".") ? parseFloat(trimmed) : parseInt(trimmed, 10);
  }
  return trimmed;
}
function unquote(raw) {
  const s = raw.trim();
  if (s.startsWith("'") && s.endsWith("'") || s.startsWith('"') && s.endsWith('"')) {
    return s.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'");
  }
  return s;
}
function getAssignableMap(top) {
  if (top.map) return top.map;
  if (top.list && top.list.length > 0) {
    const last = top.list[top.list.length - 1];
    if (typeof last === "object" && !Array.isArray(last) && last !== null) {
      return last;
    }
  }
  return null;
}
function parseYamlLines(lines) {
  const errors = [];
  const root = {};
  const stack = [{ indent: -1, parentKey: null, parent: null, map: root, list: null }];
  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    i++;
    const trimmed = raw.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;
    const indent2 = raw.length - raw.trimStart().length;
    while (stack.length > 1 && indent2 <= stack[stack.length - 1].indent) {
      stack.pop();
    }
    const top = stack[stack.length - 1];
    if (trimmed.startsWith("- ")) {
      const afterDash = trimmed.slice(2);
      if (top.list === null) {
        if (top.parent && top.parentKey && top.map) {
          const list = [];
          top.parent.map[top.parentKey] = list;
          top.map = null;
          top.list = list;
        } else {
          errors.push({ line: i, message: "List without parent key" });
          continue;
        }
      }
      const nestedColonIdx = afterDash.indexOf(":");
      const hasSpaceBeforeColon = afterDash.slice(0, nestedColonIdx).includes(" ");
      if (nestedColonIdx > 0 && !hasSpaceBeforeColon) {
        const itemKey = afterDash.slice(0, nestedColonIdx).trim();
        const itemVal = afterDash.slice(nestedColonIdx + 1).trim();
        if (itemVal === "") {
          const itemMap = {};
          top.list.push(itemMap);
          stack.push({ indent: indent2, parentKey: null, parent: top, map: itemMap, list: null });
        } else {
          const item = {};
          item[itemKey] = inferScalar(itemVal);
          top.list.push(item);
        }
      } else {
        top.list.push(inferScalar(afterDash));
      }
      continue;
    }
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) {
      errors.push({ line: i, message: `Expected key: value on line ${i}: "${trimmed}"` });
      continue;
    }
    const key = trimmed.slice(0, colonIdx).trim();
    const rest = trimmed.slice(colonIdx + 1).trim();
    const target = getAssignableMap(top);
    if (!target) {
      errors.push({ line: i, message: `Cannot assign key "${key}" in current context` });
      continue;
    }
    if (rest === "") {
      const childMap = {};
      target[key] = childMap;
      stack.push({ indent: indent2, parentKey: key, parent: top, map: childMap, list: null });
      continue;
    }
    if (rest.startsWith("|")) {
      const blockLines = [];
      while (i < lines.length) {
        const nextRaw = lines[i];
        const nextTrimmed = nextRaw.trim();
        if (nextTrimmed === "" || nextTrimmed.startsWith("#")) {
          i++;
          continue;
        }
        const nextIndent = nextRaw.length - nextRaw.trimStart().length;
        if (nextIndent <= indent2) break;
        blockLines.push(nextTrimmed);
        i++;
      }
      target[key] = blockLines.join("\n");
      continue;
    }
    if (rest.startsWith("[")) {
      const items = rest.slice(1, -1).split(",").map((s) => inferScalar(s.trim()));
      target[key] = items;
      continue;
    }
    if (rest.startsWith("'") || rest.startsWith('"')) {
      target[key] = unquote(rest);
      continue;
    }
    if (rest.startsWith("/") && rest.length > 1) {
      target[key] = rest;
      continue;
    }
    target[key] = inferScalar(rest);
  }
  return { value: root, errors };
}
function parseYaml(text) {
  return parseYamlLines(text.split(/\r?\n/));
}
function extractRulesFromParsed(parsed) {
  const errors = [];
  const rules = [];
  if (typeof parsed !== "object" || parsed === null) {
    errors.push({ line: 0, message: "Expected a mapping at root" });
    return { rules, errors };
  }
  const root = parsed;
  if ("ubr-smart-rules" in root || "ubrSmartRules" in root) {
    const container = root["ubr-smart-rules"] || root["ubrSmartRules"];
    if (container && typeof container === "object" && "rules" in container) {
      const items = container.rules;
      if (Array.isArray(items)) {
        for (const item of items) {
          if (typeof item !== "object" || item === null) continue;
          const obj = item;
          const ruleType = findRuleType(obj);
          if (ruleType) {
            rules.push({ type: ruleType, data: obj });
          } else {
            errors.push({ line: 0, message: "Rule object does not contain a recognized rule type" });
          }
        }
        return { rules, errors };
      }
    }
    return { rules, errors };
  }
  const singleType = findRuleType(root);
  if (singleType) {
    rules.push({ type: singleType, data: root });
    return { rules, errors };
  }
  errors.push({ line: 0, message: "No recognized rule type found in input" });
  return { rules, errors };
}
function findRuleType(obj) {
  for (const key of RULE_TYPE_KEYS) {
    if (key in obj) return key;
  }
  return null;
}
function parseTargets(raw) {
  if (!Array.isArray(raw)) return [];
  const targets = [];
  for (const item of raw) {
    if (typeof item === "object" && item !== null) {
      const obj = item;
      const form = Object.keys(obj)[0];
      const value = obj[form];
      if (form && typeof value === "string" && ["host", "domain", "entity", "regex"].includes(form)) {
        targets.push({ form, value });
      }
    }
  }
  if (targets.length === 0 && typeof raw[0] === "string") {
    for (const s of raw) {
      const colonIdx = s.indexOf(":");
      if (colonIdx > 0) {
        const form = s.slice(0, colonIdx);
        const value = s.slice(colonIdx + 1);
        if (["host", "domain", "entity", "regex"].includes(form)) {
          targets.push({ form, value });
        }
      }
    }
  }
  return targets;
}
function parsePaths(raw) {
  if (!Array.isArray(raw)) return void 0;
  const paths = [];
  for (const item of raw) {
    if (typeof item === "object" && item !== null) {
      const obj = item;
      const form = Object.keys(obj)[0];
      const value = obj[form];
      if (form && typeof value === "string" && ["exact", "glob", "regex"].includes(form)) {
        paths.push({ form, value });
      }
    } else if (typeof item === "string") {
      const colonIdx = item.indexOf(":");
      if (colonIdx > 0) {
        const form = item.slice(0, colonIdx);
        const value = item.slice(colonIdx + 1);
        if (["exact", "glob", "regex"].includes(form)) {
          paths.push({ form, value });
        } else {
          paths.push({ form: "glob", value: item });
        }
      } else {
        paths.push({ form: "glob", value: item });
      }
    }
  }
  return paths.length > 0 ? paths : void 0;
}
function parseCandidates(raw) {
  if (!Array.isArray(raw)) return void 0;
  const candidates = raw.filter((c) => typeof c === "string");
  return candidates.length > 0 ? candidates : void 0;
}
function parseScope(raw) {
  if (!Array.isArray(raw)) return void 0;
  const scope = raw.filter((s) => typeof s === "string");
  return scope.length > 0 ? scope : void 0;
}
function parseBoundary(data) {
  const mode = String(data.mode || DEFAULT_BOUNDARY.mode);
  const allowCrossScope = data.allowCrossScope === true;
  return {
    mode,
    maxDepth: typeof data.maxDepth === "number" ? data.maxDepth : DEFAULT_BOUNDARY.maxDepth,
    stopAtScope: allowCrossScope ? false : data.stopAtScope !== false,
    allowCrossScope,
    allowScopeRoot: data.allowScopeRoot === true,
    includeSelf: data.includeSelf === true,
    allowPageRoot: data.allowPageRoot === true,
    selector: typeof data.selector === "string" ? data.selector : void 0,
    depth: typeof data.depth === "number" ? data.depth : void 0
  };
}
function parseMatch(data) {
  if (!data) return void 0;
  const mode = String(data.mode || "none");
  const match = { mode };
  if (typeof data.threshold === "number") match.threshold = data.threshold;
  if (data.reference === "picked" || data.reference === "none") match.reference = data.reference;
  else if (typeof data.reference === "string") match.reference = data.reference;
  if (data.referenceSelection === "error" || data.referenceSelection === "first") match.referenceSelection = data.referenceSelection;
  if (data.weights && typeof data.weights === "string") match.weights = data.weights;
  return match;
}
function parseKeywords(data) {
  if (!data) return void 0;
  const kw = {
    matchMode: typeof data.matchMode === "string" ? data.matchMode : void 0,
    fields: Array.isArray(data.fields) ? data.fields.filter((f) => typeof f === "string") : ["text"]
  };
  const includeArr = data.includeAny;
  if (includeArr && Array.isArray(includeArr)) {
    kw.includeAny = includeArr.filter((i) => typeof i === "string");
  }
  const includeAllArr = data.includeAll;
  if (includeAllArr && Array.isArray(includeAllArr)) {
    kw.includeAll = includeAllArr.filter((i) => typeof i === "string");
  }
  const excludeArr = data.excludeAny;
  if (excludeArr && Array.isArray(excludeArr)) {
    kw.excludeAny = excludeArr.filter((i) => typeof i === "string");
  }
  const excludeAllArr = data.excludeAll;
  if (excludeAllArr && Array.isArray(excludeAllArr)) {
    kw.excludeAll = excludeAllArr.filter((i) => typeof i === "string");
  }
  if (typeof data.caseSensitive === "boolean") kw.caseSensitive = data.caseSensitive;
  if (typeof data.wordBoundary === "boolean") {
    kw.wordBoundary = data.wordBoundary;
  }
  return kw;
}
function parseWhere(data, key) {
  const val = data[key];
  if (!val) return void 0;
  if (typeof val === "object" && !Array.isArray(val) && val !== null) {
    return val;
  }
  return void 0;
}
function parseAction(raw) {
  if (typeof raw === "string") {
    if (raw === "unhide") return { action: "unhide" };
    return { action: "hide" };
  }
  if (typeof raw === "object" && raw !== null) {
    const obj = raw;
    const actionType = String(obj.action || "hide");
    const options = obj.options;
    const parsedOptions = options ? {
      important: options.important === true
    } : void 0;
    if (actionType === "style" && obj.style) {
      return { action: "style", style: String(obj.style), options: parsedOptions };
    }
    if (actionType === "unhide") return { action: "unhide", options: parsedOptions };
    if (actionType === "collapse") return { action: "collapse", options: parsedOptions };
    if (actionType === "remove") return { action: "remove", options: parsedOptions };
    if (actionType === "mark") return { action: "mark", options: parsedOptions };
    return { action: "hide", options: parsedOptions };
  }
  return { action: "hide" };
}
function normalizeKeys(obj) {
  const result = {};
  for (const key of Object.keys(obj)) {
    const camel = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const val = obj[key];
    if (val !== null && typeof val === "object" && !Array.isArray(val)) {
      result[camel] = normalizeKeys(val);
    } else {
      result[camel] = val;
    }
  }
  return result;
}
function parseLogicOptions(data) {
  if (!data) return void 0;
  const opts = { stopAtScopeForAncestor: data.stopAtScopeForAncestor !== false };
  return opts;
}
function parseFrames(data) {
  if (!data) return void 0;
  if (typeof data === "string") return { mode: data };
  const result = { mode: String(data.mode || "top-only") };
  if (typeof data.accounting === "string") result.accounting = data.accounting;
  if (typeof data.maxTotalMatches === "number") result.maxTotalMatches = data.maxTotalMatches;
  return result;
}
function parseShadowBlock(data) {
  if (!data) return void 0;
  if (typeof data === "string") return { mode: data };
  const result = { mode: String(data.mode || "none") };
  if (typeof data.allowHostAncestor === "boolean") result.allowHostAncestor = data.allowHostAncestor;
  if (typeof data.maxRootsPerCycle === "number") result.maxRootsPerCycle = data.maxRootsPerCycle;
  if (typeof data.observeMutations === "boolean") result.observeMutations = data.observeMutations;
  if (typeof data.observeRecursive === "boolean") result.observeRecursive = data.observeRecursive;
  return result;
}
function parseRuntimeBlock(data) {
  if (!data) return void 0;
  const result = {};
  if (typeof data.reEvaluateOnPathChange === "string") result.reEvaluateOnPathChange = data.reEvaluateOnPathChange;
  if (typeof data.observeSubtree === "boolean") result.observeSubtree = data.observeSubtree;
  if (data.observeAttributes === "auto") result.observeAttributes = "auto";
  else if (data.observeAttributes === true || data.observeAttributes === false) result.observeAttributes = data.observeAttributes;
  if (typeof data.observePathChanges === "boolean") result.observePathChanges = data.observePathChanges;
  if (typeof data.pathChangeDebounceMs === "number") result.pathChangeDebounceMs = data.pathChangeDebounceMs;
  if (typeof data.errorRecovery === "string") result.errorRecovery = data.errorRecovery;
  if (typeof data.onBudgetExceeded === "string") result.onBudgetExceeded = data.onBudgetExceeded;
  return Object.keys(result).length > 0 ? result : void 0;
}
function parseCacheBlock(data) {
  if (!data) return void 0;
  const result = {};
  if (typeof data.scope === "string") result.scope = data.scope;
  if (typeof data.maxEntries === "number") result.maxEntries = data.maxEntries;
  if (typeof data.maxAgeMs === "number") result.maxAgeMs = data.maxAgeMs;
  if (typeof data.evictionPolicy === "string") result.evictionPolicy = data.evictionPolicy;
  return Object.keys(result).length > 0 ? result : void 0;
}
function parsePerformanceBlock(data) {
  if (!data) return void 0;
  const result = {};
  if (typeof data.maxCandidates === "number") result.maxCandidates = data.maxCandidates;
  if (typeof data.maxEvaluationsPerCycle === "number") result.maxEvaluationsPerCycle = data.maxEvaluationsPerCycle;
  if (typeof data.maxAddedNodesPerCycle === "number") result.maxAddedNodesPerCycle = data.maxAddedNodesPerCycle;
  if (typeof data.maxRegexMsPerRuleCycle === "number") result.maxRegexMsPerRuleCycle = data.maxRegexMsPerRuleCycle;
  if (typeof data.dependencyPrefilter === "boolean") result.dependencyPrefilter = data.dependencyPrefilter;
  if (typeof data.dependencyDepth === "number") result.dependencyDepth = data.dependencyDepth;
  if (typeof data.debounceMs === "number") result.debounceMs = data.debounceMs;
  if (typeof data.preferCssPrefilter === "boolean") result.preferCssPrefilter = data.preferCssPrefilter;
  if (typeof data.maxRegexPatternLength === "number") result.maxRegexPatternLength = data.maxRegexPatternLength;
  if (typeof data.maxTextRegexInputChars === "number") result.maxTextRegexInputChars = data.maxTextRegexInputChars;
  if (typeof data.metrics === "string") {
    result.metrics = data.metrics;
  } else if (data.metrics && typeof data.metrics === "object" && !Array.isArray(data.metrics)) {
    const m = data.metrics;
    if (typeof m.metrics === "string") result.metrics = m.metrics;
    if (typeof m.sampleRate === "number") result.sampleRate = m.sampleRate;
  }
  if (typeof data.sampleRate === "number") result.sampleRate = data.sampleRate;
  return Object.keys(result).length > 0 ? result : void 0;
}
function parseSafetyBlock(data) {
  if (!data) return void 0;
  const result = {};
  if (typeof data.preview === "string") result.preview = data.preview;
  if (typeof data.maxMatches === "number") result.maxMatches = data.maxMatches;
  if (typeof data.maxPagePercent === "number") result.maxPagePercent = data.maxPagePercent;
  if (typeof data.maxViewportAreaPercent === "number") result.maxViewportAreaPercent = data.maxViewportAreaPercent;
  if (typeof data.minFeatures === "number") result.minFeatures = data.minFeatures;
  if (typeof data.minLogicMatches === "number") result.minLogicMatches = data.minLogicMatches;
  if (typeof data.allowPartialApply === "boolean") result.allowPartialApply = data.allowPartialApply;
  if (typeof data.maxConsecutivePartial === "number") result.maxConsecutivePartial = data.maxConsecutivePartial;
  if (typeof data.partialCycleCount === "number") result.partialCycleCount = data.partialCycleCount;
  if (typeof data.warnIfScopeIsBody === "boolean") result.warnIfScopeIsBody = data.warnIfScopeIsBody;
  if (typeof data.warnIfNoWhereLogic === "boolean") result.warnIfNoWhereLogic = data.warnIfNoWhereLogic;
  if (typeof data.warnIfActionRemove === "boolean") result.warnIfActionRemove = data.warnIfActionRemove;
  if (typeof data.confirmPageRoot === "boolean") result.confirmPageRoot = data.confirmPageRoot;
  if (typeof data.warnIfWeakExactReference === "boolean") result.warnIfWeakExactReference = data.warnIfWeakExactReference;
  return Object.keys(result).length > 0 ? result : void 0;
}
function parseRuleMetadata(data, now) {
  if (!data) return void 0;
  const meta = { createdAt: now };
  if (typeof data.createdAt === "string") meta.createdAt = data.createdAt;
  if (typeof data.updatedAt === "string") meta.updatedAt = data.updatedAt;
  if (typeof data.source === "string") meta.source = data.source;
  if (typeof data.title === "string") meta.title = data.title;
  if (typeof data.description === "string") meta.description = data.description;
  if (typeof data.createdBy === "string") meta.createdBy = data.createdBy;
  if (typeof data.originalSyntax === "string") meta.originalSyntax = data.originalSyntax;
  if (typeof data.originalId === "string") meta.originalId = data.originalId;
  if (typeof data.history === "object" && data.history !== null) {
    meta.history = Array.isArray(data.history) ? data.history : void 0;
  }
  return meta;
}
function parseProvenance(data) {
  if (!data) return void 0;
  const result = {};
  if (typeof data.createdBy === "string") result.createdBy = data.createdBy;
  if (typeof data.createdFromHost === "string") result.createdFromHost = data.createdFromHost;
  if (typeof data.createdFromPath === "string") result.createdFromPath = data.createdFromPath;
  if (typeof data.originalRuleText === "string") result.originalRuleText = data.originalRuleText;
  if (typeof data.originalSource === "string") result.originalSource = data.originalSource;
  if (typeof data.source === "string") result.source = data.source;
  if (typeof data.originalRuleId === "string") result.originalRuleId = data.originalRuleId;
  if (typeof data.importTimestamp === "string") result.importTimestamp = data.importTimestamp;
  return Object.keys(result).length > 0 ? result : void 0;
}
function parseActionOptions(data) {
  if (!data) return void 0;
  const result = {};
  if (typeof data.important === "boolean") result.important = data.important;
  return Object.keys(result).length > 0 ? result : void 0;
}
function parsePreviewBlock(data) {
  if (!data) return void 0;
  const rawStatus = String(data.status || "none");
  const validStatuses = ["none", "required", "previewed", "confirmed", "stale", "forced-by-policy"];
  const status = validStatuses.includes(rawStatus) ? rawStatus : "none";
  const result = { status };
  if (typeof data.confirmationHash === "string") result.confirmationHash = data.confirmationHash;
  if (typeof data.confirmedAt === "string") result.confirmedAt = data.confirmedAt;
  if (typeof data.relaxedCapsUsed === "boolean") result.relaxedCapsUsed = data.relaxedCapsUsed;
  return result;
}
function createRuleId() {
  const hex = () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0");
  const seg = (len) => Array.from({ length: len }, hex).join("");
  return `${RULE_ID_PREFIX}${seg(4)}-${seg(2)}-${seg(2)}-${seg(2)}-${seg(6)}`;
}
function intermediateToRule(intermediate) {
  const originalData = intermediate.data;
  const typeKey = intermediate.type;
  const camelKey = typeKey.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  let ruleBody;
  if (originalData && typeof originalData === "object") {
    if (typeKey in originalData && typeof originalData[typeKey] === "object" && originalData[typeKey] !== null) {
      ruleBody = originalData[typeKey];
    } else if (camelKey in originalData && typeof originalData[camelKey] === "object" && originalData[camelKey] !== null) {
      ruleBody = originalData[camelKey];
    } else {
      ruleBody = originalData;
    }
  } else {
    return null;
  }
  ruleBody = normalizeKeys(ruleBody);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const id = String(originalData && typeof originalData === "object" && "id" in originalData && typeof originalData["id"] === "string" ? originalData["id"] : ruleBody.id || createRuleId());
  const rawState = typeof ruleBody.state === "string" ? ruleBody.state : "";
  const state = rawState ? normalizeRuleState(rawState) : intermediate.type === "hide-exact" ? "active" : "needs-preview";
  const meta = parseRuleMetadata(ruleBody.metadata, now) || { createdAt: now };
  const provenance = ruleBody.provenance ? parseProvenance(ruleBody.provenance) : void 0;
  const targets = parseTargets(ruleBody.targets);
  if (targets.length === 0) return null;
  const priority = typeof ruleBody.priority === "number" ? ruleBody.priority : void 0;
  const actionObj = parseAction(ruleBody.action);
  const topLevelActionOptions = ruleBody.actionOptions ? parseActionOptions(ruleBody.actionOptions) : void 0;
  if (topLevelActionOptions && !actionObj.options) actionObj.options = topLevelActionOptions;
  const previewFromInput = ruleBody.preview ? parsePreviewBlock(ruleBody.preview) : void 0;
  const commonBlocks = () => ({
    priority,
    frames: ruleBody.frames ? parseFrames(ruleBody.frames) : void 0,
    shadow: ruleBody.shadow ? parseShadowBlock(ruleBody.shadow) : void 0,
    runtime: ruleBody.runtime ? parseRuntimeBlock(ruleBody.runtime) : void 0,
    cache: ruleBody.cache ? parseCacheBlock(ruleBody.cache) : void 0,
    performance: ruleBody.performance ? parsePerformanceBlock(ruleBody.performance) : void 0,
    safety: ruleBody.safety ? parseSafetyBlock(ruleBody.safety) : void 0,
    metadata: meta
  });
  switch (intermediate.type) {
    case "hide-exact": {
      const selector = String(ruleBody.selector || ruleBody.selectors || "");
      if (!selector) return null;
      const rule = {
        type: "hide-exact",
        id,
        syntaxVersion: 1,
        state,
        targets,
        selector,
        action: actionObj,
        preview: previewFromInput || { status: "confirmed" },
        ...commonBlocks()
      };
      if (ruleBody.paths) rule.paths = parsePaths(ruleBody.paths);
      if (ruleBody.scope) rule.scope = parseScope(ruleBody.scope);
      return rule;
    }
    case "hide-similar": {
      if (ruleBody.selector) return null;
      const rule = {
        type: "hide-similar",
        id,
        syntaxVersion: 1,
        state,
        targets,
        candidates: parseCandidates(ruleBody.candidates),
        boundary: ruleBody.boundary ? parseBoundary(ruleBody.boundary) : { ...DEFAULT_BOUNDARY, mode: "repeated-card" },
        match: parseMatch(ruleBody.match) || { mode: "similar" },
        action: actionObj,
        preview: previewFromInput || { status: "required" },
        ...commonBlocks()
      };
      if (ruleBody.paths) rule.paths = parsePaths(ruleBody.paths);
      if (ruleBody.scope) rule.scope = parseScope(ruleBody.scope);
      if (ruleBody.where) rule.where = parseWhere(ruleBody, "where");
      if (ruleBody.except) rule.except = parseWhere(ruleBody, "except");
      return rule;
    }
    case "smart-hide": {
      if (ruleBody.selector) return null;
      const candidates = parseCandidates(ruleBody.candidates);
      if (!candidates) return null;
      const rule = {
        type: "smart-hide",
        id,
        syntaxVersion: 1,
        state,
        targets,
        candidates,
        boundary: ruleBody.boundary ? parseBoundary(ruleBody.boundary) : { ...DEFAULT_BOUNDARY, mode: "repeated-card" },
        match: parseMatch(ruleBody.match),
        action: actionObj,
        preview: previewFromInput || { status: "required" },
        keywordMerge: ruleBody.keywordMerge === true,
        ...commonBlocks()
      };
      if (ruleBody.paths) rule.paths = parsePaths(ruleBody.paths);
      if (ruleBody.scope) rule.scope = parseScope(ruleBody.scope);
      if (ruleBody.where) rule.where = parseWhere(ruleBody, "where");
      if (ruleBody.except) rule.except = parseWhere(ruleBody, "except");
      if (ruleBody.keywords) rule.keywords = parseKeywords(ruleBody.keywords);
      return rule;
    }
    case "smart-allow": {
      if (ruleBody.selector) return null;
      if (topLevelActionOptions && !actionObj.options) actionObj.options = topLevelActionOptions;
      const rule = {
        type: "smart-allow",
        id,
        syntaxVersion: 1,
        state,
        targets,
        candidates: parseCandidates(ruleBody.candidates),
        boundary: ruleBody.boundary ? parseBoundary(ruleBody.boundary) : void 0,
        match: parseMatch(ruleBody.match) || { mode: "none" },
        allowBroad: ruleBody.allowBroad === true,
        logicOptions: ruleBody.logicOptions ? parseLogicOptions(ruleBody.logicOptions) : void 0,
        provenance,
        action: actionObj,
        preview: previewFromInput || { status: "confirmed" },
        ...commonBlocks()
      };
      if (ruleBody.paths) rule.paths = parsePaths(ruleBody.paths);
      if (ruleBody.scope) rule.scope = parseScope(ruleBody.scope);
      if (ruleBody.where) rule.where = parseWhere(ruleBody, "where");
      if (ruleBody.except) rule.except = parseWhere(ruleBody, "except");
      if (ruleBody.keywords) rule.keywords = parseKeywords(ruleBody.keywords);
      if (ruleBody.keywordMerge) rule.keywordMerge = ruleBody.keywordMerge === true;
      return rule;
    }
    default:
      return null;
  }
}
function parseSmartRules(yaml) {
  const errors = [];
  const parseResult = parseYaml(yaml);
  for (const pe of parseResult.errors) {
    errors.push(`Parse error near line ${pe.line}: ${pe.message}`);
  }
  const { rules: intermediates } = extractRulesFromParsed(parseResult.value);
  if (intermediates.length === 0) {
    errors.push("No rules found in YAML input");
    return { rules: [], errors };
  }
  const rules = [];
  for (const inter of intermediates) {
    const rule = intermediateToRule(inter);
    if (rule) {
      rules.push(rule);
    } else {
      errors.push(`Failed to parse rule: type=${inter.type}`);
    }
  }
  return { rules, errors };
}
var RULE_TYPE_KEYS;
var init_smart_rule_parser = __esm({
  "src/core/smart-cosmetic/smart-rule-parser.ts"() {
    init_smart_rule_schema();
    RULE_TYPE_KEYS = /* @__PURE__ */ new Set(["hide-exact", "hide-similar", "smart-hide", "smart-allow", "hideExact", "hideSimilar", "smartHide", "smartAllow"]);
  }
});

// src/core/smart-cosmetic/engine.ts
var engine_exports = {};
__export(engine_exports, {
  ConflictClass: () => ConflictClass,
  Engine: () => Engine,
  SmartEngine: () => engine_exports,
  exportAllRules: () => exportAllRules,
  getActionStrength: () => getActionStrength,
  hasHideLikeAction: () => hasHideLikeAction,
  parseSmartRules: () => parseSmartRules,
  seedDemoRules: () => seedDemoRules,
  smartEngine: () => smartEngine,
  smartRuleStore: () => smartRuleStore
});

// src/core/smart-cosmetic/smart-rule-store.ts
init_smart_rule_schema();

// src/core/smart-cosmetic/matcher.ts
init_smart_rule_schema();
var fingerprintCache = /* @__PURE__ */ new WeakMap();
function triggerFingerprintGC(activeSelectors) {
  if (typeof document === "undefined") return;
  if (activeSelectors && activeSelectors.length > 0) {
    gcFingerprintsNotInUse(activeSelectors);
  } else {
    invalidateFingerprintCache();
  }
}
function gcFingerprintsNotInUse(activeSelectors) {
  const inUse = /* @__PURE__ */ new Set();
  try {
    for (const sel of activeSelectors) {
      for (const el of document.querySelectorAll(sel)) {
        inUse.add(el);
      }
    }
  } catch (e) {
    console.warn("[uBR] matcher: gcFingerprintsNotInUse querySelectorAll failed", e);
  }
  const keys = [];
  try {
    for (const el of document.querySelectorAll("*")) {
      if (fingerprintCache.get(el) !== void 0 && !inUse.has(el)) {
        keys.push(el);
      }
      if (keys.length > 500) break;
    }
  } catch (e) {
    console.warn('[uBR] matcher: gcFingerprintsNotInUse querySelectorAll("*") failed', e);
  }
  for (const key of keys) {
    fingerprintCache.delete(key);
  }
}
function invalidateFingerprintCache() {
  const _wm = fingerprintCache;
  const keys = [];
  try {
    for (const el of document.querySelectorAll("*")) {
      const fv = fingerprintCache.get(el);
      if (fv !== void 0) {
        keys.push(el);
      }
      if (keys.length > 500) break;
    }
  } catch (e) {
    console.warn('[uBR] matcher: invalidateFingerprintCache querySelectorAll("*") failed', e);
  }
  for (const key of keys) {
    fingerprintCache.delete(key);
  }
}

// src/core/smart-cosmetic/smart-rule-diagnostics.ts
function diagnostic(code, message, severity = "error", hint) {
  return { code, message, severity, hint };
}
var DIAGNOSTIC_CODES = {
  TARGET_INVALID: "target-invalid",
  TARGET_REGEX_UNSAFE: "target-regex-unsafe",
  PATH_INVALID: "path-invalid",
  PATH_REGEX_UNSAFE: "path-regex-unsafe",
  MISSING_SCOPE: "missing-scope",
  UNSAFE_SCOPE_SELECTOR: "unsafe-scope-selector",
  CANDIDATE_UNSAFE_SELECTOR: "candidate-unsafe-selector",
  CANDIDATE_REQUIRED: "candidate-required",
  SCOPE_IS_BODY: "scope-is-body",
  BOUNDARY_INVALID: "boundary-invalid",
  BOUNDARY_MODE_MISMATCH: "boundary-mode-mismatch",
  BOUNDARY_CROSS_SCOPE_CONFLICT: "boundary-cross-scope-conflict",
  MATCH_MODE_NONE_WITH_THRESHOLD: "threshold-with-mode-none",
  MATCH_MODE_NONE_WITH_REFERENCE: "reference-with-mode-none",
  MATCH_MODE_NONE_WITH_WEIGHTS: "weights-with-mode-none",
  MATCH_MODE_EXACT_WITH_THRESHOLD: "threshold-with-exact-mode",
  MATCH_SIMILAR_WITHOUT_REFERENCE: "similar-without-reference",
  MATCH_STRUCTURAL_WITHOUT_REFERENCE: "structural-without-reference",
  MATCH_WEAK_EXACT_REFERENCE: "weak-exact-reference",
  MATCH_MISSING_REFERENCE: "missing-match-reference",
  WEIGHTS_INVALID_PROFILE: "weights-invalid-profile",
  ACTION_SMART_ALLOW_INVALID: "smart-allow-invalid-action",
  ACTION_REMOVE_WARNING: "action-remove-warning",
  WHERE_MISSING_SMART: "where-missing-smart",
  LOGIC_INVALID: "logic-invalid",
  KEYWORDS_INACTIVE: "keywords-inactive",
  KEYWORDS_IGNORED_BY_EXPLICIT_LOGIC: "keywords-ignored-by-explicit-logic",
  KEYWORD_MERGE_CONFLICT: "keyword-merge-conflict",
  REGEX_UNSUPPORTED_FLAG: "regex-unsupported-flag",
  REGEX_UNCOMPILABLE: "regex-uncompilable",
  REGEX_BUDGET_RISK: "regex-budget-risk",
  REGEX_BUDGET_EXCEEDED: "regex-budget-exceeded",
  REGEX_INPUT_TRUNCATED: "regex-input-truncated",
  UNSAFE_REGEX: "unsafe-regex",
  SAFETY_MIN_FEATURES_MODE_NONE: "min-features-mode-none",
  SAFETY_MIN_LOGIC_MATCHES_IMPOSSIBLE: "min-logic-matches-impossible",
  SAFETY_PREVIEW_REQUIRED: "preview-required",
  SAFETY_PREVIEW_NOT_CONFIRMED: "preview-not-confirmed",
  PERFORMANCE_INVALID: "performance-invalid",
  FRAMES_INVALID: "frames-invalid",
  SHADOW_INVALID: "shadow-invalid",
  UNSAFE_SHADOW_SELECTOR: "unsupported-shadow-selector",
  RUNTIME_INVALID: "runtime-invalid",
  BROAD_RULE_WARNING: "broad-rule-warning",
  BROAD_EXACT_SCOPE: "broad-exact-scope",
  ALLOW_BROAD_REQUIRED: "allow-broad-required",
  LOW_SIMILARITY_THRESHOLD: "low-similarity-threshold",
  EXACT_MODE_SELECTOR_REQUIRED: "exact-mode-selector-required",
  IMPORT_COLLISION: "import-collision",
  IMPORT_SYNTAX_VERSION_UNSUPPORTED: "syntax-version-unsupported",
  EXPORT_LOSS: "export-loss",
  DEPRECATED_FIELD: "deprecated-field",
  UNSUPPORTED_COMPOSITION: "unsupported-composition-field",
  BOUNDARY_REQUIRED: "boundary-required",
  EXACT_HIDE_BROAD_BOUNDARY: "exact-hide-broad-boundary",
  ORIGINAL_SYNTAX_MISMATCH: "original-syntax-mismatch",
  ALLOW_BROAD_EXPECTED: "allow-broad-expected",
  STYLE_VAR_NOT_ALLOWED: "style-var-not-allowed",
  REGEX_STATIC_REJECTED: "regex-static-rejected",
  REGEX_TOO_LONG: "regex-too-long",
  CATCH_ALL_ALLOW: "catch-all-allow",
  MISSING_CANDIDATES: "missing-candidates",
  MISSING_BOUNDARY: "missing-boundary",
  UNSAFE_CANDIDATE_SELECTOR: "unsafe-candidate-selector",
  AMBIGUOUS_REFERENCE_FIRST_USED: "ambiguous-reference-first-used",
  REFERENCE_SELECTION_UNUSED: "reference-selection-unused",
  EXTERNAL_FILTERS_NOT_SIMULATED: "external-filters-not-simulated",
  EXTERNAL_FILTER_OVERRIDE_SMART_ALLOW: "external-filter-overrode-smart-allow",
  WEAK_EXACT_REFERENCE_WARN: "weak-exact-reference-warn",
  ALLOW_PAGE_ROOT_WITHOUT_CONFIRM: "allow-page-root-without-confirm",
  INCLUDE_SELF_NOT_SELECTOR_MODE: "include-self-not-selector-mode",
  KEYWORD_WORD_BOUNDARY_IGNORED: "keyword-word-boundary-ignored",
  UNSUPPORTED_NEW_SYNTAX: "unsupported-new-syntax",
  CUSTOM_WEIGHTS_NOT_SUPPORTED_V1: "custom-weights-not-supported-v1",
  INVALID_RULE_ACTION_COMBINATION: "invalid-rule-action-combination",
  ALLOW_SCOPE_ROOT_WITHOUT_STOP: "allow-scope-root-without-stop",
  WORD_BOUNDARY_REDUNDANT: "word-boundary-redundant",
  STYLE_FILTER_PERCENTAGE: "style-filter-percentage",
  MATCH_MODE_NONE_NO_WHERE: "match-mode-none-no-where",
  MATCH_MODE_SMART_ALLOW_INVALID: "match-mode-smart-allow-invalid",
  INVALID_BOUNDARY_DEPTH: "invalid-boundary-depth",
  DEPENDENCY_DEPTH_MAY_MISS_DESCENDANT: "dependency-depth-may-miss-descendant",
  SCOPE_ROOT_TOO_LARGE: "scope-root-too-large",
  SELECTOR_BOUNDARY_NOT_FOUND: "selector-boundary-not-found",
  BOUNDARY_LOW_CONFIDENCE: "boundary-low-confidence",
  FRAME_INACCESSIBLE: "frame-inaccessible",
  PARTIAL_SHADOW_DISCOVERY: "partial-shadow-discovery",
  CANDIDATE_BUDGET_EXCEEDED: "candidate-budget-exceeded",
  EXTERNAL_REMOVE_NOT_RESTORABLE: "external-remove-not-restorable",
  IMPORTANT_IGNORED_FOR_BUILT_IN: "important-ignored-for-built-in",
  MIN_FEATURES_UNUSED_EXACT: "min-features-unused-exact",
  MIN_FEATURES_INVALID_WITH_NONE: "min-features-invalid-with-none",
  INVALID_KEYWORD_WORD_MODE: "invalid-keyword-word-mode",
  THRESHOLD_NOT_VALID_FOR_MODE_NONE: "threshold-not-valid-for-mode-none"
};

// src/core/smart-cosmetic/smart-rule-validator.ts
init_smart_rule_schema();
var UNSAFE_SELECTOR_PATTERNS = [
  /:has\(/,
  /:has-text\(/,
  /:contains\(/,
  /:matches-css\(/,
  /:matches-property\(/,
  /:upward\(/,
  /:xpath\(/,
  /:host-context\(/,
  /::(before|after|part|slotted)/,
  /\\b/
];
var ALLOWED_REGEX_FLAGS = /* @__PURE__ */ new Set(["i", "m", "u", "s", "g"]);
var REJECTED_REGEX_FLAGS = /* @__PURE__ */ new Set(["v", "y", "d"]);
function isSafeSelector(selector) {
  return !UNSAFE_SELECTOR_PATTERNS.some((p) => p.test(selector));
}
function validateRegexFlags(flags) {
  const errors = [];
  for (const f of flags) {
    if (REJECTED_REGEX_FLAGS.has(f)) {
      errors.push(`Regex flag '${f}' is not allowed`);
    }
    if (!ALLOWED_REGEX_FLAGS.has(f)) {
      errors.push(`Unknown regex flag '${f}'`);
    }
  }
  return errors;
}
var VALID_WEIGHT_PROFILES = /* @__PURE__ */ new Set(["default-card", "structural-heavy", "content-heavy"]);
var MAX_REGEX_PATTERN_LENGTH = 256;
var NESTED_QUANTIFIER_RE = /\([^)]+\)[?*+][?*+{]/;
var BACKREFERENCE_RE = /\\(\d+)/;
var NAMED_BACKREFERENCE_RE = /\\k<[^>]+>/;
var CATASTROPHIC_ALTERNATION_RE = /\(\s*[^)]+\|\s*[^)]+\|\s*[^)]*\)[+*]/;
var LOOKBEHIND_RE = /\(\?<[=!]/;
function hasStyleVar(style) {
  return /\bvar\(/.test(style);
}
var FILTER_FUNCTION_RE = /\bfilter\s*:\s*[^;]+/gi;
var FILTER_PERCENTAGE_RE = /([a-z-]+)\s*\(\s*\d+(\.\d+)?%/i;
function hasFilterPercentage(style) {
  const filterMatch = style.match(FILTER_FUNCTION_RE);
  if (!filterMatch) return false;
  return FILTER_PERCENTAGE_RE.test(style);
}
function isRegexPatternSafe(pattern) {
  if (pattern.length > MAX_REGEX_PATTERN_LENGTH) {
    return { safe: false, reason: `Pattern exceeds ${MAX_REGEX_PATTERN_LENGTH} characters` };
  }
  if (NESTED_QUANTIFIER_RE.test(pattern)) {
    return { safe: false, reason: "Nested quantifier detected (potential ReDoS)" };
  }
  if (BACKREFERENCE_RE.test(pattern)) {
    return { safe: false, reason: "Backreferences not allowed in static patterns" };
  }
  if (NAMED_BACKREFERENCE_RE.test(pattern)) {
    return { safe: false, reason: "Named backreferences not allowed" };
  }
  if (CATASTROPHIC_ALTERNATION_RE.test(pattern)) {
    return { safe: false, reason: "Ambiguous alternation with quantifier (potential ReDoS)" };
  }
  if (LOOKBEHIND_RE.test(pattern)) {
    return { safe: false, reason: "Lookbehind assertions are not allowed" };
  }
  const altBranches = pattern.match(/\|/g);
  if (altBranches && altBranches.length > 50) {
    return { safe: false, reason: "Pattern has more than 50 alternation branches" };
  }
  if (/\.\*\+?\s*\.\*\+?/.test(pattern)) {
    return { safe: false, reason: "Unbounded dot-star before another unbounded repeat (potential ReDoS)" };
  }
  return { safe: true };
}
function validateRule(rule) {
  const diagnostics = [];
  if (rule.syntaxVersion !== 1) {
    diagnostics.push(diagnostic(DIAGNOSTIC_CODES.UNSUPPORTED_NEW_SYNTAX, `Unsupported syntax version ${rule.syntaxVersion}`));
  }
  if (rule.priority !== void 0 && (rule.priority < -1e3 || rule.priority > 1e3)) {
    diagnostics.push(diagnostic(DIAGNOSTIC_CODES.DEPRECATED_FIELD, `priority ${rule.priority} is out of range (-1000 to 1000)`));
  }
  if (rule.action.action === "style" && "style" in rule.action) {
    const s = rule.action.style;
    if (typeof s === "string") {
      if (hasStyleVar(s)) {
        diagnostics.push(diagnostic(DIAGNOSTIC_CODES.STYLE_VAR_NOT_ALLOWED, "var() is not allowed in v1 style() values"));
      }
      if (hasFilterPercentage(s)) {
        diagnostics.push(diagnostic(DIAGNOSTIC_CODES.STYLE_FILTER_PERCENTAGE, "filter functions must use numeric decimals, not percentages"));
      }
      const declarations = s.split(";").map((d) => d.trim()).filter(Boolean);
      for (const decl of declarations) {
        const colonIdx = decl.indexOf(":");
        if (colonIdx === -1) {
          diagnostics.push(diagnostic(DIAGNOSTIC_CODES.STYLE_VAR_NOT_ALLOWED, `Malformed style declaration: "${decl}"`));
          continue;
        }
        const prop = decl.slice(0, colonIdx).trim();
        const _val = decl.slice(colonIdx + 1).trim();
        if (!SAFE_STYLE_PROPERTIES.has(prop.replace(/^-(webkit|moz)-/i, ""))) {
          diagnostics.push(diagnostic(DIAGNOSTIC_CODES.STYLE_VAR_NOT_ALLOWED, `Style property "${prop}" is not in the allowed list`));
        }
      }
    }
  }
  if ("performance" in rule && rule.performance?.sampleRate !== void 0) {
    const sr = rule.performance.sampleRate;
    if (sr < 0 || sr > 1) {
      diagnostics.push(diagnostic(DIAGNOSTIC_CODES.PERFORMANCE_INVALID, `sample-rate ${sr} is out of range (0.0 to 1.0)`));
    }
  }
  if (rule.safety?.minFeatures !== void 0 && (rule.safety.minFeatures < 0 || rule.safety.minFeatures > 10)) {
    diagnostics.push(diagnostic(DIAGNOSTIC_CODES.SAFETY_MIN_FEATURES_MODE_NONE, `min-features ${rule.safety.minFeatures} is out of range (0 to 10)`));
  }
  if (rule.targets.length === 0) {
    diagnostics.push(diagnostic(DIAGNOSTIC_CODES.TARGET_INVALID, "At least one target is required"));
  }
  if (rule.supersedes !== void 0) {
    diagnostics.push(diagnostic(DIAGNOSTIC_CODES.UNSUPPORTED_COMPOSITION, "supersedes is not supported in v1", "warning"));
  }
  if (rule.overrides !== void 0) {
    diagnostics.push(diagnostic(DIAGNOSTIC_CODES.UNSUPPORTED_COMPOSITION, "overrides is not supported in v1", "warning"));
  }
  if (rule.action.action === "style" && rule.action.options?.important) {
  }
  if (rule.action.action !== "style" && rule.action.options?.important) {
    diagnostics.push(diagnostic(DIAGNOSTIC_CODES.IMPORTANT_IGNORED_FOR_BUILT_IN, "actionOptions.important is ignored for non-style actions", "warning"));
  }
  validateSafety(rule.safety, diagnostics);
  validatePerformance(rule.performance, diagnostics);
  validateCache(rule.cache, diagnostics);
  switch (rule.type) {
    case "hide-exact":
      validateHideExact(rule, diagnostics);
      break;
    case "hide-similar":
      validateHideSimilar(rule, diagnostics);
      break;
    case "smart-hide":
      validateSmartHide(rule, diagnostics);
      break;
    case "smart-allow":
      validateSmartAllow(rule, diagnostics);
      break;
  }
  return {
    valid: diagnostics.every((d) => d.severity !== "error"),
    diagnostics
  };
}
function validateHideExact(rule, diag) {
  validateTargets(rule.targets, diag);
  validatePaths(rule.paths, diag);
  if (!rule.selector) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.EXACT_MODE_SELECTOR_REQUIRED, "hide-exact requires a selector"));
  }
  if (rule.match) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.INVALID_RULE_ACTION_COMBINATION, "hide-exact must not have a match block"));
  }
  if (rule.candidates) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.CANDIDATE_REQUIRED, "hide-exact must not have candidates"));
  }
  if (rule.boundary) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.BOUNDARY_REQUIRED, "hide-exact must not have a boundary block"));
  }
  if (rule.where) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.LOGIC_INVALID, "hide-exact must not have where logic"));
  }
  if (rule.except) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.LOGIC_INVALID, "hide-exact must not have except logic"));
  }
  if (rule.keywords) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.KEYWORDS_INACTIVE, "hide-exact must not have keywords"));
  }
  if (!rule.scope || rule.scope.length === 0) {
    const isUniqueId = rule.selector && rule.selector.startsWith("#") && !rule.selector.includes(" ") && !rule.selector.includes(">");
    if (!isUniqueId) {
      diag.push(diagnostic(DIAGNOSTIC_CODES.EXACT_HIDE_BROAD_BOUNDARY, "hide-exact without scope targets the full document", "warning"));
    }
  }
  if (rule.frames) validateFrames(rule.frames, diag);
  if (rule.runtime) validateRuntime(rule.runtime, diag);
  if (rule.shadow) validateShadow(rule.shadow, diag);
  if (rule.action.action === "unhide") {
    diag.push(diagnostic(DIAGNOSTIC_CODES.INVALID_RULE_ACTION_COMBINATION, "hide-exact does not support action: unhide"));
  }
  if (rule.action.action === "remove") {
    diag.push(diagnostic(DIAGNOSTIC_CODES.ACTION_REMOVE_WARNING, "action: remove can break page scripts", "warning"));
  }
  if (rule.metadata.originalSyntax && rule.metadata.originalSyntax !== rule.selector) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.ORIGINAL_SYNTAX_MISMATCH, "originalSyntax does not match compiled selector", "warning"));
  }
}
function validateHideSimilar(rule, diag) {
  validateTargets(rule.targets, diag);
  validatePaths(rule.paths, diag);
  if (!rule.scope || rule.scope.length === 0) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.MISSING_SCOPE, "hide-similar requires at least one scope selector"));
  }
  validateScope(rule.scope, diag, rule.safety?.warnIfScopeIsBody ?? true);
  if (!rule.candidates || rule.candidates.length === 0) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.MISSING_CANDIDATES, "hide-similar requires at least one candidate selector"));
  }
  validateCandidates(rule.candidates, diag);
  if (!rule.boundary) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.BOUNDARY_REQUIRED, "hide-similar requires a boundary block"));
  } else {
    validateBoundary(rule.boundary, diag);
  }
  if (rule.match) {
    const matchMode = rule.match.mode;
    if (matchMode === "none") {
      diag.push(diagnostic(DIAGNOSTIC_CODES.INVALID_RULE_ACTION_COMBINATION, "hide-similar does not support match.mode: none"));
    }
    validateMatch(rule.match, rule.type, rule.where, diag, rule.safety?.warnIfWeakExactReference ?? true);
    if (matchMode === "exact" && rule.scope?.some((s) => s === "body" || s === "html")) {
      diag.push(diagnostic(DIAGNOSTIC_CODES.BROAD_RULE_WARNING, "exact match with body/html scope may match too broadly", "warning"));
    }
  } else {
    diag.push(diagnostic(DIAGNOSTIC_CODES.MATCH_MISSING_REFERENCE, "hide-similar requires a match block with a reference"));
  }
  if (rule.frames) validateFrames(rule.frames, diag);
  if (rule.runtime) validateRuntime(rule.runtime, diag);
  if (rule.shadow) validateShadow(rule.shadow, diag);
  if (rule.where) validateRegexCondition(rule.where, diag, "where");
  if (rule.except) validateRegexCondition(rule.except, diag, "except");
  if (rule.action.action === "unhide") {
    diag.push(diagnostic(DIAGNOSTIC_CODES.INVALID_RULE_ACTION_COMBINATION, "hide-similar does not support action: unhide"));
  }
  const warnIfRemove = rule.safety?.warnIfActionRemove ?? true;
  if (rule.action.action === "remove" && warnIfRemove) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.ACTION_REMOVE_WARNING, "action: remove can break page scripts", "warning"));
  }
}
function validateSmartHide(rule, diag) {
  validateTargets(rule.targets, diag);
  validatePaths(rule.paths, diag);
  if (!rule.scope || rule.scope.length === 0) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.MISSING_SCOPE, "smart-hide requires at least one scope selector"));
  }
  validateScope(rule.scope, diag, rule.safety?.warnIfScopeIsBody ?? true);
  if (!rule.candidates || rule.candidates.length === 0) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.MISSING_CANDIDATES, "smart-hide requires at least one candidate selector"));
  }
  validateCandidates(rule.candidates, diag);
  if (!rule.boundary) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.BOUNDARY_REQUIRED, "smart-hide requires a boundary block"));
  } else {
    validateBoundary(rule.boundary, diag);
  }
  if (rule.match) {
    validateMatch(rule.match, rule.type, rule.where, diag, rule.safety?.warnIfWeakExactReference ?? true);
    if (rule.match.mode === "none" && rule.safety?.minFeatures !== void 0) {
      diag.push(diagnostic(DIAGNOSTIC_CODES.MIN_FEATURES_INVALID_WITH_NONE, "min-features is invalid with match mode none"));
    }
    if (rule.match.mode === "exact" && rule.safety?.minFeatures !== void 0) {
      diag.push(diagnostic(DIAGNOSTIC_CODES.MIN_FEATURES_UNUSED_EXACT, "min-features is unused with match mode exact", "warning"));
    }
    if (rule.match.mode === "exact" && rule.scope?.some((s) => s === "body" || s === "html")) {
      diag.push(diagnostic(DIAGNOSTIC_CODES.BROAD_RULE_WARNING, "exact match with body/html scope may match too broadly", "warning"));
    }
  }
  if (!rule.where && !rule.keywords) {
    const warnIfNoWhere = rule.safety?.warnIfNoWhereLogic ?? true;
    if (rule.match?.mode === "none" && rule.safety?.minLogicMatches !== 0) {
      diag.push(diagnostic(DIAGNOSTIC_CODES.MATCH_MODE_NONE_NO_WHERE, "match mode none without where logic or keywords is too broad; set safety.min-logic-matches: 0 to bypass"));
    } else if (warnIfNoWhere) {
      diag.push(diagnostic(DIAGNOSTIC_CODES.WHERE_MISSING_SMART, "smart-hide without where logic or keywords may be too broad", "warning"));
    }
  }
  if (rule.frames) validateFrames(rule.frames, diag);
  if (rule.runtime) validateRuntime(rule.runtime, diag);
  if (rule.shadow) validateShadow(rule.shadow, diag);
  if (rule.keywords?.wordBoundary && rule.keywords?.matchMode === "regex") {
    diag.push(diagnostic(DIAGNOSTIC_CODES.KEYWORD_WORD_BOUNDARY_IGNORED, "word-boundary is ignored for regex match mode", "warning"));
  }
  if (rule.keywords?.wordBoundary && rule.keywords?.matchMode === "word") {
    diag.push(diagnostic(DIAGNOSTIC_CODES.WORD_BOUNDARY_REDUNDANT, "word-boundary is redundant for word match mode", "warning"));
  }
  if (rule.keywords && !rule.keywords.matchMode) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.KEYWORDS_INACTIVE, "keywords block requires match-mode", "warning"));
  }
  const VALID_KEYWORD_MODES = /* @__PURE__ */ new Set(["phrase", "word", "regex"]);
  if (rule.keywords?.matchMode && !VALID_KEYWORD_MODES.has(rule.keywords.matchMode)) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.INVALID_KEYWORD_WORD_MODE, `Invalid keyword match-mode "${rule.keywords.matchMode}"`));
  }
  if (rule.keywords?.matchMode === "regex") {
    const allKw = [...rule.keywords.includeAny || [], ...rule.keywords.includeAll || [], ...rule.keywords.excludeAny || [], ...rule.keywords.excludeAll || []];
    for (const kw of allKw) {
      try {
        new RegExp(kw);
      } catch {
        diag.push(diagnostic(DIAGNOSTIC_CODES.REGEX_UNCOMPILABLE, `Invalid regex keyword: "${kw}"`));
      }
    }
  }
  if (rule.keywords?.matchMode === "word") {
    const allKw = [...rule.keywords.includeAny || [], ...rule.keywords.includeAll || [], ...rule.keywords.excludeAny || [], ...rule.keywords.excludeAll || []];
    for (const kw of allKw) {
      if (/[\s,.;:!?\-'"(){}\[\]/]/.test(kw)) {
        diag.push(diagnostic(DIAGNOSTIC_CODES.INVALID_KEYWORD_WORD_MODE, `Word-mode keyword "${kw}" contains whitespace or punctuation`, "warning"));
      }
    }
  }
  if (rule.boundary?.includeSelf && rule.boundary.mode !== "selector") {
    diag.push(diagnostic(DIAGNOSTIC_CODES.INCLUDE_SELF_NOT_SELECTOR_MODE, "includeSelf requires selector boundary mode"));
  }
  if (rule.boundary?.allowPageRoot && !rule.safety?.confirmPageRoot) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.ALLOW_PAGE_ROOT_WITHOUT_CONFIRM, "allowPageRoot requires safety.confirmPageRoot"));
  }
  if (rule.where) validateRegexCondition(rule.where, diag, "where");
  if (rule.except) validateRegexCondition(rule.except, diag, "except");
  if (rule.keywords && rule.where) {
    if (!rule.keywordMerge) {
      diag.push(diagnostic(DIAGNOSTIC_CODES.KEYWORDS_INACTIVE, "keywords block not merged because explicit where/except exists", "warning"));
    }
  }
  if (rule.keywordMerge && !rule.keywords) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.KEYWORD_MERGE_CONFLICT, "keywordMerge is true but no keywords block provided", "warning"));
  }
  if (rule.action.action === "unhide") {
    diag.push(diagnostic(DIAGNOSTIC_CODES.INVALID_RULE_ACTION_COMBINATION, "smart-hide does not support action: unhide"));
  }
  const warnIfRemove = rule.safety?.warnIfActionRemove ?? true;
  if (rule.action.action === "remove" && warnIfRemove) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.ACTION_REMOVE_WARNING, "action: remove can break page scripts", "warning"));
  }
}
function validateSmartAllow(rule, diag) {
  validateTargets(rule.targets, diag);
  validatePaths(rule.paths, diag);
  if (!rule.scope || rule.scope.length === 0) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.MISSING_SCOPE, "smart-allow requires at least one scope selector"));
  }
  validateScope(rule.scope, diag, rule.safety?.warnIfScopeIsBody ?? true);
  if (!rule.candidates || rule.candidates.length === 0) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.MISSING_CANDIDATES, "smart-allow requires at least one candidate selector"));
  }
  validateCandidates(rule.candidates, diag);
  if (!rule.boundary) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.MISSING_BOUNDARY, "smart-allow requires a boundary block"));
  } else {
    validateBoundary(rule.boundary, diag);
  }
  if (rule.action.action !== "unhide") {
    diag.push(diagnostic(DIAGNOSTIC_CODES.ACTION_SMART_ALLOW_INVALID, "smart-allow must use action: unhide"));
  }
  if (rule.match && rule.match.mode !== "none" && rule.match.mode !== "exact") {
    diag.push(diagnostic(DIAGNOSTIC_CODES.MATCH_MODE_SMART_ALLOW_INVALID, "smart-allow must use match mode none or exact"));
  }
  if (rule.match) validateMatch(rule.match, rule.type, rule.where, diag, rule.safety?.warnIfWeakExactReference ?? true);
  if (!rule.where && !rule.keywords && (!rule.match || rule.match.mode === "none")) {
    if (!rule.allowBroad) {
      diag.push(diagnostic(DIAGNOSTIC_CODES.CATCH_ALL_ALLOW, "smart-allow with no where/keywords and match mode none is a catch-all; requires allowBroad + enterprise + preview"));
    } else {
      diag.push(diagnostic(DIAGNOSTIC_CODES.ALLOW_BROAD_EXPECTED, "broad smart-allow with allowBroad requires enterprise policy", "warning"));
    }
  }
  if (rule.frames) validateFrames(rule.frames, diag);
  if (rule.runtime) validateRuntime(rule.runtime, diag);
  if (rule.shadow) validateShadow(rule.shadow, diag);
  if (rule.keywords?.wordBoundary && rule.keywords?.matchMode === "regex") {
    diag.push(diagnostic(DIAGNOSTIC_CODES.KEYWORD_WORD_BOUNDARY_IGNORED, "word-boundary is ignored for regex match mode", "warning"));
  }
  if (rule.keywords?.wordBoundary && rule.keywords?.matchMode === "word") {
    diag.push(diagnostic(DIAGNOSTIC_CODES.WORD_BOUNDARY_REDUNDANT, "word-boundary is redundant for word match mode", "warning"));
  }
  if (rule.keywords && !rule.keywords.matchMode) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.KEYWORDS_INACTIVE, "keywords block requires match-mode", "warning"));
  }
  const VALID_KEYWORD_MODES = /* @__PURE__ */ new Set(["phrase", "word", "regex"]);
  if (rule.keywords?.matchMode && !VALID_KEYWORD_MODES.has(rule.keywords.matchMode)) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.INVALID_KEYWORD_WORD_MODE, `Invalid keyword match-mode "${rule.keywords.matchMode}"`));
  }
  if (rule.keywords?.matchMode === "regex") {
    const allKw = [...rule.keywords.includeAny || [], ...rule.keywords.includeAll || [], ...rule.keywords.excludeAny || [], ...rule.keywords.excludeAll || []];
    for (const kw of allKw) {
      try {
        new RegExp(kw);
      } catch {
        diag.push(diagnostic(DIAGNOSTIC_CODES.REGEX_UNCOMPILABLE, `Invalid regex keyword: "${kw}"`));
      }
    }
  }
  if (rule.where) validateRegexCondition(rule.where, diag, "where");
  if (rule.except) validateRegexCondition(rule.except, diag, "except");
}
function validateRegexPattern(pattern, diag, context) {
  try {
    new RegExp(pattern);
  } catch (e) {
    console.warn("[uBR] smart-rule-validator: invalid regex in", context, pattern, e);
    diag.push(diagnostic(DIAGNOSTIC_CODES.REGEX_UNCOMPILABLE, `Invalid regex in ${context}: ${pattern}`));
    return;
  }
  const safe = isRegexPatternSafe(pattern);
  if (!safe.safe) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.REGEX_STATIC_REJECTED, `Unsafe regex in ${context}: ${safe.reason}`));
  }
}
function validateRegexCondition(expr, diag, context) {
  if ("condition" in expr && "operator" in expr.condition) {
    const cond = expr.condition;
    if (cond.operator === "regex" && cond.pattern) {
      validateRegexPattern(cond.pattern, diag, context);
      if (cond.flags) {
        for (const err of validateRegexFlags(cond.flags)) {
          diag.push(diagnostic(DIAGNOSTIC_CODES.REGEX_UNSUPPORTED_FLAG, err, "warning"));
        }
      }
    }
    return;
  }
  const group = expr;
  for (const key of ["all", "any", "none"]) {
    const arr = group[key];
    if (arr) {
      for (const child of arr) {
        validateRegexCondition(child, diag, context);
      }
    }
  }
}
var VALID_TARGET_FORMS = /* @__PURE__ */ new Set(["host", "domain", "entity", "regex"]);
var VALID_PATH_FORMS = /* @__PURE__ */ new Set(["exact", "glob", "regex"]);
function validateTargets(targets, diag) {
  for (const t of targets) {
    if (!VALID_TARGET_FORMS.has(t.form)) {
      diag.push(diagnostic(DIAGNOSTIC_CODES.TARGET_INVALID, `Invalid target form "${t.form}"`));
    }
    if (t.form === "regex") {
      validateRegexPattern(t.value, diag, `target ${t.value}`);
    }
  }
}
function validatePaths(paths, diag) {
  if (!paths) return;
  for (const p of paths) {
    if (!VALID_PATH_FORMS.has(p.form)) {
      diag.push(diagnostic(DIAGNOSTIC_CODES.PATH_INVALID, `Invalid path form "${p.form}"`));
    }
    if (p.form === "regex") {
      validateRegexPattern(p.value, diag, `path ${p.value}`);
    }
  }
}
function validateScope(scope, diag, warnIfScopeIsBody = true) {
  if (!scope) return;
  for (const s of scope) {
    if (s === "body" || s === "html") {
      if (warnIfScopeIsBody) {
        diag.push(diagnostic(DIAGNOSTIC_CODES.SCOPE_IS_BODY, `Scope "${s}" is risky for generalized rules`, "warning"));
      }
      diag.push(diagnostic(DIAGNOSTIC_CODES.BROAD_EXACT_SCOPE, `Scope "${s}" is broad`, "warning"));
    }
    if (!isSafeSelector(s)) {
      diag.push(diagnostic(DIAGNOSTIC_CODES.UNSAFE_SCOPE_SELECTOR, `Unsafe selector in scope: ${s}`));
    }
  }
}
function validateCandidates(candidates, diag) {
  if (!candidates) return;
  for (const c of candidates) {
    if (!isSafeSelector(c)) {
      diag.push(diagnostic(DIAGNOSTIC_CODES.UNSAFE_CANDIDATE_SELECTOR, `Unsafe candidate selector: ${c}`));
    }
  }
}
function validateBoundary(boundary, diag) {
  const validModes = /* @__PURE__ */ new Set(["exact", "nearest-card", "repeated-card", "semantic-block", "visual-block", "ancestor-depth", "selector"]);
  if (!validModes.has(boundary.mode)) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.BOUNDARY_INVALID, `Invalid boundary mode "${boundary.mode}"`));
  }
  if (boundary.stopAtScope !== false && boundary.allowCrossScope === true) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.BOUNDARY_CROSS_SCOPE_CONFLICT, "allow-cross-scope: true overrides stop-at-scope to false", "warning"));
  }
  if (boundary.mode === "ancestor-depth" && boundary.depth === void 0) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.BOUNDARY_MODE_MISMATCH, "ancestor-depth mode requires depth field", "error"));
  }
  if (boundary.mode === "selector" && !boundary.selector) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.BOUNDARY_MODE_MISMATCH, "selector mode requires a selector field", "error"));
  }
  if (boundary.depth !== void 0 && boundary.depth < 0) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.INVALID_BOUNDARY_DEPTH, "depth must not be negative"));
  }
  if (boundary.maxDepth !== void 0 && boundary.maxDepth < 1) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.BOUNDARY_INVALID, "maxDepth must be a positive integer"));
  }
  if (boundary.depth !== void 0 && boundary.maxDepth !== void 0 && boundary.depth >= boundary.maxDepth) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.INVALID_BOUNDARY_DEPTH, "depth must be less than maxDepth"));
  }
  if (boundary.mode === "exact") {
    if (boundary.selector || boundary.depth !== void 0 || boundary.maxDepth !== void 0) {
      diag.push(diagnostic(DIAGNOSTIC_CODES.BOUNDARY_MODE_MISMATCH, "exact boundary mode does not use selector, depth, or maxDepth"));
    }
  }
  if (boundary.allowScopeRoot === true && boundary.stopAtScope === void 0) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.ALLOW_SCOPE_ROOT_WITHOUT_STOP, "allow-scope-root requires explicit stop-at-scope: true"));
  }
  if (boundary.allowScopeRoot === true && boundary.stopAtScope === false) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.ALLOW_SCOPE_ROOT_WITHOUT_STOP, "allow-scope-root requires stop-at-scope: true"));
  }
}
function validateFrames(frames, diag) {
  if (!frames) return;
  const validModes = /* @__PURE__ */ new Set(["top-only", "same-origin", "accessible"]);
  if (!validModes.has(frames.mode)) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.FRAMES_INVALID, `Invalid frames mode "${frames.mode}"`));
  }
  if (frames.accounting && frames.accounting !== "per-frame" && frames.accounting !== "aggregate") {
    diag.push(diagnostic(DIAGNOSTIC_CODES.FRAMES_INVALID, `Invalid frames accounting "${frames.accounting}"`));
  }
  if (frames.maxTotalMatches !== void 0 && frames.maxTotalMatches < 1) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.FRAMES_INVALID, "maxTotalMatches must be a positive integer"));
  }
}
function validateRuntime(runtime, diag) {
  if (!runtime) return;
  if (runtime.reEvaluateOnPathChange && !["never", "always", "smart"].includes(runtime.reEvaluateOnPathChange)) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.RUNTIME_INVALID, `Invalid reEvaluateOnPathChange "${runtime.reEvaluateOnPathChange}"`));
  }
  if (runtime.errorRecovery && !["continue", "fail-safe"].includes(runtime.errorRecovery)) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.RUNTIME_INVALID, `Invalid errorRecovery "${runtime.errorRecovery}"`));
  }
  if (runtime.onBudgetExceeded && !["stop-cycle", "warn", "pause-rule"].includes(runtime.onBudgetExceeded)) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.RUNTIME_INVALID, `Invalid onBudgetExceeded "${runtime.onBudgetExceeded}"`));
  }
  if (runtime.onBudgetExceeded === "warn") {
    diag.push(diagnostic(DIAGNOSTIC_CODES.RUNTIME_INVALID, "onBudgetExceeded: warn is restricted to preview mode", "warning"));
  }
  if (runtime.observePathChanges !== void 0 && typeof runtime.observePathChanges !== "boolean") {
    diag.push(diagnostic(DIAGNOSTIC_CODES.RUNTIME_INVALID, "observePathChanges must be a boolean"));
  }
  if (runtime.observeSubtree !== void 0 && typeof runtime.observeSubtree !== "boolean") {
    diag.push(diagnostic(DIAGNOSTIC_CODES.RUNTIME_INVALID, "observeSubtree must be a boolean"));
  }
  if (runtime.observeAttributes !== void 0 && runtime.observeAttributes !== "auto" && runtime.observeAttributes !== true && runtime.observeAttributes !== false) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.RUNTIME_INVALID, "observeAttributes must be auto, true, or false"));
  }
  if (runtime.pathChangeDebounceMs !== void 0 && runtime.pathChangeDebounceMs < 0) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.RUNTIME_INVALID, "pathChangeDebounceMs must not be negative"));
  }
}
function validateShadow(shadow, diag) {
  const validModes = /* @__PURE__ */ new Set(["none", "open", "open-recursive"]);
  if (!validModes.has(shadow.mode)) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.UNSAFE_SHADOW_SELECTOR, `Invalid shadow mode "${shadow.mode}"`));
    return;
  }
  if (shadow.mode === "none") {
    if (shadow.observeRecursive === true) {
      diag.push(diagnostic(DIAGNOSTIC_CODES.SHADOW_INVALID, "observeRecursive is unused when shadow mode is none", "warning"));
    }
    if (shadow.allowHostAncestor === true) {
      diag.push(diagnostic(DIAGNOSTIC_CODES.SHADOW_INVALID, "allowHostAncestor is unused when shadow mode is none", "warning"));
    }
  }
  if (shadow.mode === "open-recursive" && shadow.observeRecursive === false) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.SHADOW_INVALID, "observeRecursive conflicts with open-recursive mode", "warning"));
  }
  if (shadow.mode !== "none" && shadow.mode !== "open-recursive" && shadow.observeRecursive === true) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.SHADOW_INVALID, "observeRecursive requires open-recursive mode", "warning"));
  }
  if (shadow.observeMutations !== void 0 && typeof shadow.observeMutations !== "boolean") {
    diag.push(diagnostic(DIAGNOSTIC_CODES.SHADOW_INVALID, "observeMutations must be a boolean"));
  }
  if (shadow.allowHostAncestor !== void 0 && typeof shadow.allowHostAncestor !== "boolean") {
    diag.push(diagnostic(DIAGNOSTIC_CODES.SHADOW_INVALID, "allowHostAncestor must be a boolean"));
  }
}
function validateCache(cache, diag) {
  if (!cache) return;
  if (cache.scope && cache.scope !== "per-rule" && cache.scope !== "per-page") {
    diag.push(diagnostic(DIAGNOSTIC_CODES.PERFORMANCE_INVALID, `Invalid cache scope "${cache.scope}"`));
  }
  if (cache.evictionPolicy && cache.evictionPolicy !== "LRU") {
    diag.push(diagnostic(DIAGNOSTIC_CODES.PERFORMANCE_INVALID, `Invalid cache evictionPolicy "${cache.evictionPolicy}"`));
  }
  if (cache.maxEntries !== void 0 && cache.maxEntries < 1) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.PERFORMANCE_INVALID, "cache maxEntries must be a positive integer"));
  }
  if (cache.maxAgeMs !== void 0 && cache.maxAgeMs < 0) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.PERFORMANCE_INVALID, "cache maxAgeMs must not be negative"));
  }
}
function validateSafety(safety, diag) {
  if (!safety) return;
  if (safety.preview && !["required", "recommended", "optional", "skip"].includes(safety.preview)) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.SAFETY_PREVIEW_REQUIRED, `Invalid safety preview "${safety.preview}"`));
  }
  if (safety.maxMatches !== void 0 && safety.maxMatches < 1) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.PERFORMANCE_INVALID, "safety maxMatches must be a positive integer"));
  }
  if (safety.maxPagePercent !== void 0 && (safety.maxPagePercent < 1 || safety.maxPagePercent > 100)) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.PERFORMANCE_INVALID, "safety maxPagePercent must be 1-100"));
  }
  if (safety.maxViewportAreaPercent !== void 0 && (safety.maxViewportAreaPercent < 1 || safety.maxViewportAreaPercent > 100)) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.PERFORMANCE_INVALID, "safety maxViewportAreaPercent must be 1-100"));
  }
  if (safety.minLogicMatches !== void 0 && safety.minLogicMatches < 0) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.SAFETY_MIN_LOGIC_MATCHES_IMPOSSIBLE, "safety minLogicMatches must not be negative"));
  }
}
function validatePerformance(performance, diag) {
  if (!performance) return;
  if (performance.maxCandidates !== void 0 && performance.maxCandidates < 1) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.PERFORMANCE_INVALID, "performance maxCandidates must be a positive integer"));
  }
  if (performance.maxEvaluationsPerCycle !== void 0 && performance.maxEvaluationsPerCycle < 1) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.PERFORMANCE_INVALID, "performance maxEvaluationsPerCycle must be a positive integer"));
  }
  if (performance.maxAddedNodesPerCycle !== void 0 && performance.maxAddedNodesPerCycle < 1) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.PERFORMANCE_INVALID, "performance maxAddedNodesPerCycle must be a positive integer"));
  }
  if (performance.maxRegexMsPerRuleCycle !== void 0 && performance.maxRegexMsPerRuleCycle < 0) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.PERFORMANCE_INVALID, "performance maxRegexMsPerRuleCycle must not be negative"));
  }
  if (performance.maxRegexPatternLength !== void 0 && performance.maxRegexPatternLength < 1) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.PERFORMANCE_INVALID, "performance maxRegexPatternLength must be a positive integer"));
  }
  if (performance.maxTextRegexInputChars !== void 0 && performance.maxTextRegexInputChars < 1) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.PERFORMANCE_INVALID, "performance maxTextRegexInputChars must be a positive integer"));
  }
  if (performance.debounceMs !== void 0 && performance.debounceMs < 0) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.PERFORMANCE_INVALID, "performance debounceMs must not be negative"));
  }
  if (performance.dependencyDepth !== void 0 && performance.dependencyDepth < 0) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.PERFORMANCE_INVALID, "performance dependencyDepth must not be negative"));
  }
  if (performance.metrics && !["none", "collect"].includes(performance.metrics)) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.PERFORMANCE_INVALID, `Invalid metrics mode "${performance.metrics}"`));
  }
}
function validateMatch(match, ruleType, where, diag, warnIfWeakExactReference = true) {
  if (match.mode === "none") {
    if (match.threshold !== void 0) {
      diag.push(diagnostic(DIAGNOSTIC_CODES.THRESHOLD_NOT_VALID_FOR_MODE_NONE, "match.mode: none must not have threshold"));
    }
    if (match.reference !== void 0 && match.reference !== "none") {
      diag.push(diagnostic(DIAGNOSTIC_CODES.MATCH_MODE_NONE_WITH_REFERENCE, "match.mode: none must not have reference"));
    }
    if (match.weights !== void 0) {
      diag.push(diagnostic(DIAGNOSTIC_CODES.MATCH_MODE_NONE_WITH_WEIGHTS, "match.mode: none must not have weights"));
    }
    return;
  }
  if (match.mode === "similar" || match.mode === "structural") {
    if (!match.reference || match.reference === "none") {
      diag.push(diagnostic(
        match.mode === "structural" ? DIAGNOSTIC_CODES.MATCH_STRUCTURAL_WITHOUT_REFERENCE : DIAGNOSTIC_CODES.MATCH_SIMILAR_WITHOUT_REFERENCE,
        `match.mode: ${match.mode} requires a reference`
      ));
    }
  }
  if (match.referenceSelection && (match.reference === "picked" || match.reference === "none" || typeof match.reference === "string" && match.reference.startsWith("fingerprint:"))) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.REFERENCE_SELECTION_UNUSED, "reference-selection is unused for this reference type", "warning"));
  }
  if (match.mode === "exact" && match.threshold !== void 0) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.MATCH_MODE_EXACT_WITH_THRESHOLD, "match.mode: exact must not have threshold"));
  }
  if (match.mode === "exact" && (!match.reference || match.reference === "none") && warnIfWeakExactReference) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.MATCH_WEAK_EXACT_REFERENCE, "exact match mode requires a reference (picked or custom selector)", "warning"));
  }
  if (match.weights && !VALID_WEIGHT_PROFILES.has(match.weights)) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.CUSTOM_WEIGHTS_NOT_SUPPORTED_V1, `Custom weight profile "${match.weights}" is not supported in v1`));
  }
  if (match.threshold !== void 0 && match.threshold < 0.65) {
    diag.push(diagnostic(DIAGNOSTIC_CODES.LOW_SIMILARITY_THRESHOLD, `Low similarity threshold ${match.threshold} requires preview`, "warning"));
  }
}

// src/core/smart-cosmetic/smart-rule-store.ts
var STORAGE_KEY_RULES = "smartCosmeticRules";
var STORAGE_KEY_COLLECTIONS = "smartCosmeticCollections";
var STORAGE_KEY_INDEX = "smartCosmeticIndex";
var STORAGE_KEY_MIGRATION = "cosmeticMigrationDone";
var USER_FILTERS_KEY = "user-filters";
async function migrateUserCosmeticFilters(storageApi) {
  const bin = await storageApi.get([STORAGE_KEY_MIGRATION, USER_FILTERS_KEY, STORAGE_KEY_RULES]);
  if (bin[STORAGE_KEY_MIGRATION] === true) return;
  const userFilters = bin[USER_FILTERS_KEY] || "";
  const lines = userFilters.split("\n");
  const cosmeticLines = [];
  const networkLines = [];
  for (const line of lines) {
    if (line.includes("##")) {
      cosmeticLines.push(line);
    } else {
      networkLines.push(line);
    }
  }
  if (cosmeticLines.length > 0) {
    const existingRules = bin[STORAGE_KEY_RULES] || {};
    for (const line of cosmeticLines) {
      const hashIdx = line.indexOf("##");
      const domainPart = hashIdx > 0 ? line.slice(0, hashIdx) : "*";
      const selector = line.slice(hashIdx + 2);
      if (!selector) continue;
      const id = `migrated:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      if (existingRules[id]) continue;
      const targets = domainPart === "*" ? [{ form: "host", value: "*" }] : domainPart.split(",").filter(Boolean).map((d) => ({ form: "host", value: d }));
      existingRules[id] = {
        type: "hide-exact",
        id,
        syntaxVersion: 1,
        state: "active",
        targets,
        selector,
        action: { action: "hide" },
        metadata: { createdAt: (/* @__PURE__ */ new Date()).toISOString(), source: "migration" },
        collectionId: "migrated-cosmetic"
      };
    }
    await storageApi.set({ [STORAGE_KEY_RULES]: existingRules, [USER_FILTERS_KEY]: networkLines.join("\n") });
  }
  await storageApi.set({ [STORAGE_KEY_MIGRATION]: true });
}
function migrateRule(raw) {
  if (!raw) return;
  if (raw.performance && typeof raw.performance.metrics === "object" && raw.performance.metrics !== null) {
    const nested = raw.performance.metrics;
    raw.performance.metrics = typeof nested.metrics === "string" ? nested.metrics : "collect";
    if (typeof nested.sampleRate === "number" && raw.performance.sampleRate === void 0) {
      raw.performance.sampleRate = nested.sampleRate;
    }
  }
  if (raw.performance?.metrics === "debug") {
    raw.performance.metrics = "collect";
  }
  if (raw.performance) {
    delete raw.performance.cacheFeatureVectors;
  }
  if (raw.action?.options) {
    delete raw.action.options.styleWhitelist;
    delete raw.action.options.markOutlineMerge;
  }
  if (raw.boundary) {
    delete raw.boundary.ancestorDepth;
    if (raw.boundary.allowCrossScope === true) {
      raw.boundary.stopAtScope = false;
    }
  }
  if (raw.shadow) {
    delete raw.shadow.observeSubtree;
  }
  if (raw.runtime) {
    delete raw.runtime.observeAttributesTree;
  }
}
var Store = class {
  constructor() {
    __publicField(this, "rules", /* @__PURE__ */ new Map());
    __publicField(this, "collections", /* @__PURE__ */ new Map());
    __publicField(this, "index", { byTarget: {}, byHost: {}, byType: {}, byCollection: {} });
    __publicField(this, "loaded", false);
    __publicField(this, "storageApi", typeof chrome !== "undefined" && chrome.storage?.local ? chrome.storage.local : { get: async () => ({}), set: async () => {
    }, remove: async () => {
    }, clear: async () => {
    } });
  }
  async load() {
    if (this.loaded) return;
    const { storageApi } = this;
    await migrateUserCosmeticFilters(storageApi);
    const bin = await storageApi.get([STORAGE_KEY_RULES, STORAGE_KEY_COLLECTIONS, STORAGE_KEY_INDEX]);
    const rawRules = bin[STORAGE_KEY_RULES] || {};
    for (const [id, raw] of Object.entries(rawRules)) {
      if (raw.state) raw.state = normalizeRuleState(raw.state);
      migrateRule(raw);
      this.rules.set(id, raw);
    }
    const rawCollections = bin[STORAGE_KEY_COLLECTIONS] || {};
    for (const [id, raw] of Object.entries(rawCollections)) {
      this.collections.set(id, raw);
    }
    this.index = bin[STORAGE_KEY_INDEX] || { byTarget: {}, byHost: {}, byType: {}, byCollection: {} };
    this.loaded = true;
  }
  assertLoaded() {
    if (!this.loaded) throw new Error("SmartRuleStore not loaded. Call load() first.");
  }
  async save() {
    return this.persist();
  }
  async persist() {
    const rules = {};
    this.rules.forEach((v, k) => {
      rules[k] = v;
    });
    const collections = {};
    this.collections.forEach((v, k) => {
      collections[k] = v;
    });
    await this.storageApi.set({
      [STORAGE_KEY_RULES]: rules,
      [STORAGE_KEY_COLLECTIONS]: collections,
      [STORAGE_KEY_INDEX]: this.index
    });
  }
  // --- Rule CRUD ---
  async addRule(rule) {
    this.assertLoaded();
    rule.state = normalizeRuleState(rule.state);
    const vr = validateRule(rule);
    if (!vr.valid) return { ok: false, validation: vr };
    if (this.rules.has(rule.id)) {
      return { ok: false, validation: { valid: false, diagnostics: [{ code: "rule-id-conflict", message: `Rule ${rule.id} already exists`, severity: "error" }] } };
    }
    this.rules.set(rule.id, rule);
    this.indexRule(rule);
    await this.persist();
    return { ok: true };
  }
  async updateRule(id, updates) {
    this.assertLoaded();
    const existing = this.rules.get(id);
    if (!existing) return { ok: false, validation: { valid: false, diagnostics: [{ code: "rule-not-found", message: `Rule ${id} not found`, severity: "error" }] } };
    const merged = { ...existing, ...updates, id };
    merged.state = normalizeRuleState(merged.state);
    const vr = validateRule(merged);
    if (!vr.valid) return { ok: false, validation: vr };
    this.unindexRule(existing);
    this.rules.set(id, merged);
    this.indexRule(merged);
    await this.persist();
    return { ok: true };
  }
  collectActiveSelectors() {
    const selectors = [];
    for (const rule of this.rules.values()) {
      if (rule.state !== "active") continue;
      const s = "selector" in rule ? rule.selector : void 0;
      if (s && typeof s === "string") selectors.push(s);
      const c = "candidates" in rule ? rule.candidates : void 0;
      if (Array.isArray(c)) selectors.push(...c);
    }
    return selectors;
  }
  async removeRule(id) {
    this.assertLoaded();
    const existing = this.rules.get(id);
    if (!existing) return false;
    this.unindexRule(existing);
    this.rules.delete(id);
    await this.persist();
    triggerFingerprintGC(this.collectActiveSelectors());
    return true;
  }
  async setRuleState(id, state) {
    this.assertLoaded();
    const rule = this.rules.get(id);
    if (!rule) return false;
    const fromState = normalizeRuleState(rule.state);
    const toState = normalizeRuleState(state);
    if (!isValidStateTransition(fromState, toState, rule)) return false;
    rule.state = toState;
    await this.persist();
    return true;
  }
  getRule(id) {
    this.assertLoaded();
    return this.rules.get(id);
  }
  getAllRules() {
    this.assertLoaded();
    return Array.from(this.rules.values());
  }
  getRulesByType(type) {
    this.assertLoaded();
    return (this.index.byType[type] || []).map((id) => this.rules.get(id)).filter((r) => r !== void 0);
  }
  getRulesByHost(hostname) {
    this.assertLoaded();
    const keys = /* @__PURE__ */ new Set();
    for (const h of [hostname, hostname.split(".").slice(-2).join("."), "*"]) {
      const ids = this.index.byHost[h] || [];
      for (const id of ids) keys.add(id);
    }
    return Array.from(keys).map((id) => this.rules.get(id)).filter((r) => r !== void 0);
  }
  getRulesByCollection(collectionId) {
    this.assertLoaded();
    return (this.index.byCollection[collectionId] || []).map((id) => this.rules.get(id)).filter((r) => r !== void 0);
  }
  // --- Collection CRUD ---
  async addCollection(collection) {
    this.assertLoaded();
    if (this.collections.has(collection.id)) return false;
    this.collections.set(collection.id, collection);
    await this.persist();
    return true;
  }
  async removeCollection(id) {
    this.assertLoaded();
    if (!this.collections.has(id)) return false;
    const ruleIds = this.index.byCollection[id] || [];
    for (const ruleId of ruleIds) {
      const rule = this.rules.get(ruleId);
      if (rule) {
        this.unindexRule(rule);
        this.rules.delete(ruleId);
      }
    }
    this.collections.delete(id);
    await this.persist();
    triggerFingerprintGC(this.collectActiveSelectors());
    return true;
  }
  async updateCollection(id, updates) {
    this.assertLoaded();
    const existing = this.collections.get(id);
    if (!existing) return false;
    this.collections.set(id, { ...existing, ...updates });
    await this.persist();
    return true;
  }
  getCollection(id) {
    this.assertLoaded();
    return this.collections.get(id);
  }
  getAllCollections() {
    this.assertLoaded();
    return Array.from(this.collections.values());
  }
  // --- Bulk operations ---
  async replaceCollectionRules(collectionId, rules, collection) {
    this.assertLoaded();
    const oldIds = [...this.index.byCollection[collectionId] || []];
    for (const id of oldIds) {
      const old = this.rules.get(id);
      if (old) this.unindexRule(old);
      this.rules.delete(id);
    }
    for (const rule of rules) {
      this.rules.set(rule.id, rule);
      this.indexRule(rule);
    }
    this.collections.set(collectionId, collection);
    await this.persist();
    triggerFingerprintGC(this.collectActiveSelectors());
  }
  async clearAll() {
    this.rules.clear();
    this.collections.clear();
    this.index = { byTarget: {}, byHost: {}, byType: {}, byCollection: {} };
    await this.persist();
    triggerFingerprintGC(this.collectActiveSelectors());
  }
  getStats() {
    this.assertLoaded();
    const byType = {};
    const byState = {};
    for (const rule of this.rules.values()) {
      byType[rule.type] = (byType[rule.type] || 0) + 1;
      byState[rule.state] = (byState[rule.state] || 0) + 1;
    }
    return { ruleCount: this.rules.size, collectionCount: this.collections.size, byType, byState };
  }
  // --- Indexing (internal) ---
  indexRule(rule) {
    for (const target of rule.targets) {
      const key = `${target.form}:${target.value}`;
      this.addToIndex(this.index.byTarget, key, rule.id);
      if (target.form === "host" || target.form === "domain") {
        this.addToIndex(this.index.byHost, target.value, rule.id);
      }
    }
    this.addToIndex(this.index.byType, rule.type, rule.id);
    if (rule.collectionId) {
      this.addToIndex(this.index.byCollection, rule.collectionId, rule.id);
    }
  }
  unindexRule(rule) {
    for (const target of rule.targets) {
      const key = `${target.form}:${target.value}`;
      this.removeFromIndex(this.index.byTarget, key, rule.id);
      if (target.form === "host" || target.form === "domain") {
        this.removeFromIndex(this.index.byHost, target.value, rule.id);
      }
    }
    this.removeFromIndex(this.index.byType, rule.type, rule.id);
    if (rule.collectionId) {
      this.removeFromIndex(this.index.byCollection, rule.collectionId, rule.id);
    }
  }
  addToIndex(idx, key, id) {
    if (!idx[key]) idx[key] = [];
    if (!idx[key].includes(id)) idx[key].push(id);
  }
  removeFromIndex(idx, key, id) {
    if (!idx[key]) return;
    const i = idx[key].indexOf(id);
    if (i !== -1) idx[key].splice(i, 1);
    if (idx[key].length === 0) delete idx[key];
  }
};
var smartRuleStore = new Store();

// src/core/smart-cosmetic/smart-rule-collection.ts
var SMART_RULE_COLLECTION_DEFAULTS = {
  updateIntervalMs: 24 * 60 * 60 * 1e3,
  retryDelayMs: 30 * 60 * 1e3,
  maxRetries: 3
};
var CollectionManager = class {
  constructor() {
    __publicField(this, "updateTimers", /* @__PURE__ */ new Map());
    __publicField(this, "pendingUpdates", /* @__PURE__ */ new Map());
  }
  async registerCollection(collection) {
    const exists = smartRuleStore.getCollection(collection.id);
    if (exists) return false;
    await smartRuleStore.addCollection(collection);
    return true;
  }
  async unregisterCollection(id) {
    this.clearUpdateTimer(id);
    this.pendingUpdates.delete(id);
    return smartRuleStore.removeCollection(id);
  }
  getCollection(id) {
    return smartRuleStore.getCollection(id);
  }
  getAllCollections() {
    return smartRuleStore.getAllCollections();
  }
  scheduleUpdate(collectionId, intervalMs = SMART_RULE_COLLECTION_DEFAULTS.updateIntervalMs) {
    this.clearUpdateTimer(collectionId);
    const timer = setTimeout(async () => {
      await this.updateCollection(collectionId);
    }, intervalMs);
    this.updateTimers.set(collectionId, timer);
  }
  clearUpdateTimer(collectionId) {
    const existing = this.updateTimers.get(collectionId);
    if (existing) {
      clearTimeout(existing);
      this.updateTimers.delete(collectionId);
    }
  }
  async updateCollection(collectionId) {
    const inFlight = this.pendingUpdates.get(collectionId);
    if (inFlight) return inFlight.then(() => true);
    const promise = this.doUpdateCollection(collectionId);
    this.pendingUpdates.set(collectionId, promise);
    try {
      return await promise;
    } finally {
      this.pendingUpdates.delete(collectionId);
    }
  }
  async doUpdateCollection(collectionId) {
    const collection = smartRuleStore.getCollection(collectionId);
    if (!collection) return false;
    if (!collection.sourceUrl) return false;
    const metadata = collection.metadata || { listId: collectionId, syntaxVersion: 1 };
    const { parseYaml: parseYaml2, extractRulesFromParsed: extractRulesFromParsed2 } = await Promise.resolve().then(() => (init_smart_rule_parser(), smart_rule_parser_exports));
    let lastError;
    for (let attempt = 0; attempt <= SMART_RULE_COLLECTION_DEFAULTS.maxRetries; attempt++) {
      try {
        const response = await fetch(collection.sourceUrl);
        if (!response.ok) {
          lastError = `HTTP ${response.status}`;
          if (attempt < SMART_RULE_COLLECTION_DEFAULTS.maxRetries) {
            await delay(SMART_RULE_COLLECTION_DEFAULTS.retryDelayMs * Math.pow(2, attempt));
          }
          continue;
        }
        const text = await response.text();
        const parsed = parseYaml2(text);
        if (parsed.errors.length > 0) {
          lastError = `Parse errors: ${parsed.errors.join(", ")}`;
          break;
        }
        const { rules: rawRules } = extractRulesFromParsed2(parsed.value);
        const convertedRules = rawRules.map((r) => ({
          ...r.data,
          id: r.data.id || `${collectionId}:${r.type}:${Math.random().toString(36).slice(2, 9)}`,
          type: r.type,
          syntaxVersion: collection.metadata?.syntaxVersion || 1,
          state: "active",
          metadata: { createdAt: (/* @__PURE__ */ new Date()).toISOString() },
          targets: r.data.targets || [],
          action: r.data.action || { action: "hide" },
          collectionId
        }));
        const updatedMeta = {
          ...metadata,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
          sourceEtag: response.headers.get("ETag") || void 0
        };
        const updatedCollection = {
          ...collection,
          metadata: updatedMeta,
          lastUpdateCheck: Date.now(),
          lastUpdateSuccess: Date.now(),
          updateError: void 0
        };
        await smartRuleStore.replaceCollectionRules(collectionId, convertedRules, updatedCollection);
        this.scheduleUpdate(collectionId);
        return true;
      } catch (err) {
        lastError = String(err);
        if (attempt < SMART_RULE_COLLECTION_DEFAULTS.maxRetries) {
          await delay(SMART_RULE_COLLECTION_DEFAULTS.retryDelayMs * Math.pow(2, attempt));
        }
      }
    }
    await smartRuleStore.updateCollection(collectionId, {
      lastUpdateCheck: Date.now(),
      updateError: lastError
    });
    this.scheduleUpdate(collectionId, SMART_RULE_COLLECTION_DEFAULTS.retryDelayMs);
    return false;
  }
  getRulesByCollection(collectionId) {
    return smartRuleStore.getRulesByCollection(collectionId);
  }
  getStats() {
    const collections = this.getAllCollections();
    const total = collections.length;
    const withErrors = collections.filter((c) => c.updateError).length;
    return { total, withErrors };
  }
};
var collectionManager = new CollectionManager();
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// src/core/smart-cosmetic/fetch-gateway.ts
var DEFAULT_FETCH_OPTIONS = {
  defaultUpdateIntervalMs: 24 * 60 * 60 * 1e3,
  retryDelayMs: 30 * 60 * 1e3,
  maxRetries: 3
};
var Gateway = class {
  constructor(_options = DEFAULT_FETCH_OPTIONS) {
    this._options = _options;
    __publicField(this, "etags", /* @__PURE__ */ new Map());
    __publicField(this, "cachedContents", /* @__PURE__ */ new Map());
    __publicField(this, "updateTimers", /* @__PURE__ */ new Map());
    __publicField(this, "activeFetches", /* @__PURE__ */ new Map());
  }
  async subscribe(url, collectionId) {
    const existing = await collectionManager.registerCollection({
      id: collectionId,
      sourceUrl: url,
      metadata: { listId: collectionId, syntaxVersion: 1 }
    });
    if (!existing) return false;
    this.scheduleNextUpdate(collectionId, 0);
    return true;
  }
  async unsubscribe(collectionId) {
    this.cancelTimer(collectionId);
    this.activeFetches.delete(collectionId);
    this.etags.delete(collectionId);
    this.cachedContents.delete(collectionId);
    return collectionManager.unregisterCollection(collectionId);
  }
  async fetchNow(collectionId) {
    const inFlight = this.activeFetches.get(collectionId);
    if (inFlight) return inFlight;
    const promise = this.doFetch(collectionId);
    this.activeFetches.set(collectionId, promise);
    try {
      return await promise;
    } finally {
      this.activeFetches.delete(collectionId);
    }
  }
  getCachedContent(collectionId) {
    return this.cachedContents.get(collectionId)?.content;
  }
  getEtag(collectionId) {
    return this.etags.get(collectionId);
  }
  async doFetch(collectionId) {
    const collection = smartRuleStore.getCollection(collectionId);
    if (!collection?.sourceUrl) {
      return { ok: false, error: "No source URL configured", collectionId };
    }
    const headers = {};
    const etag = this.etags.get(collectionId);
    if (etag) headers["If-None-Match"] = etag;
    let lastError;
    for (let attempt = 0; attempt <= this._options.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3e4);
        const response = await fetch(collection.sourceUrl, {
          headers,
          signal: controller.signal
        });
        clearTimeout(timeout);
        if (response.status === 304) {
          this.scheduleNextUpdate(collectionId);
          return { ok: true, status: 304, cached: true, collectionId };
        }
        if (!response.ok) {
          lastError = `HTTP ${response.status}`;
          if (attempt < this._options.maxRetries) {
            await delay2(this._options.retryDelayMs * Math.pow(2, attempt));
          }
          continue;
        }
        const text = await response.text();
        const newEtag = response.headers.get("ETag");
        if (newEtag) this.etags.set(collectionId, newEtag);
        this.cachedContents.set(collectionId, { content: text, fetchedAt: Date.now() });
        const { parseSmartRules: parseSmartRules2 } = await Promise.resolve().then(() => (init_smart_rule_parser(), smart_rule_parser_exports));
        const parsed = parseSmartRules2(text);
        if (parsed.errors.length > 0) {
          return { ok: false, error: `YAML parse errors: ${parsed.errors.join("; ")}`, collectionId };
        }
        const rules = parsed.rules.map((r) => ({ ...r, collectionId }));
        const updatedMeta = {
          ...collection.metadata,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
          sourceEtag: newEtag || void 0
        };
        const updatedCollection = {
          ...collection,
          metadata: updatedMeta,
          lastUpdateCheck: Date.now(),
          lastUpdateSuccess: Date.now(),
          updateError: void 0
        };
        await smartRuleStore.replaceCollectionRules(collectionId, rules, updatedCollection);
        this.scheduleNextUpdate(collectionId);
        return { ok: true, content: text, etag: newEtag || void 0, ruleCount: rules.length, collectionId };
      } catch (err) {
        console.warn("[uBR] fetch-gateway: fetch failed for collection", collectionId, err);
        lastError = String(err);
        if (attempt < this._options.maxRetries) {
          await delay2(this._options.retryDelayMs * Math.pow(2, attempt));
        }
      }
    }
    await smartRuleStore.updateCollection(collectionId, {
      lastUpdateCheck: Date.now(),
      updateError: lastError
    });
    this.scheduleNextUpdate(collectionId, this._options.retryDelayMs);
    return { ok: false, error: lastError, collectionId };
  }
  scheduleNextUpdate(collectionId, delayMs) {
    this.cancelTimer(collectionId);
    const interval = delayMs ?? this._options.defaultUpdateIntervalMs;
    const timer = setTimeout(() => {
      this.fetchNow(collectionId);
    }, interval);
    this.updateTimers.set(collectionId, timer);
  }
  cancelTimer(collectionId) {
    const existing = this.updateTimers.get(collectionId);
    if (existing) {
      clearTimeout(existing);
      this.updateTimers.delete(collectionId);
    }
  }
};
function delay2(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
var fetchGateway = new Gateway();

// src/core/smart-cosmetic/cosmetic-plan.ts
init_smart_rule_schema();

// src/core/smart-cosmetic/conflict.ts
var ConflictClass = /* @__PURE__ */ ((ConflictClass2) => {
  ConflictClass2["UserAllow"] = "A";
  ConflictClass2["UserExactHide"] = "B";
  ConflictClass2["UserSmartHide"] = "C";
  ConflictClass2["GenericCosmetic"] = "F";
  return ConflictClass2;
})(ConflictClass || {});
var ACTION_STRENGTH = {
  remove: 4,
  collapse: 3,
  hide: 2,
  mark: 1,
  unhide: 1
};
var TARGET_WEIGHTS = {
  host: 500,
  domain: 400,
  entity: 350,
  regex: 300
};
var PATH_WEIGHTS = {
  exact: 400,
  regex: 200
};
function getPathScore(paths) {
  if (!paths || paths.length === 0) return 100;
  let maxScore = 0;
  for (const p of paths) {
    if (p.form === "glob") {
      maxScore = Math.max(maxScore, p.value?.includes("**") ? 250 : 300);
    } else {
      maxScore = Math.max(maxScore, PATH_WEIGHTS[p.form] || 100);
    }
  }
  return maxScore || 100;
}
function getRuleIntentScore(rule) {
  if (rule.type === "hide-exact") return 500;
  if (rule.type === "smart-allow") return 100;
  if ("match" in rule && rule.match?.mode === "exact") return 475;
  if (rule.type === "hide-similar") {
    const threshold = ("match" in rule && rule.match?.threshold) ?? 0.82;
    return threshold >= 0.82 ? 425 : 400;
  }
  if (rule.type === "smart-hide") {
    const matchMode = "match" in rule && rule.match?.mode || "none";
    if (matchMode === "none") return 325;
    const hasStrongLogic = "where" in rule && rule.where !== void 0;
    if (matchMode === "similar" || matchMode === "structural") return hasStrongLogic ? 375 : 350;
  }
  if (rule.action.action === "mark") return 200;
  return 150;
}
function getSelectorScopeScore(rule) {
  if ("selector" in rule && rule.selector) return 150;
  const scope = "scope" in rule ? rule.scope : void 0;
  if (scope && scope.length > 0) {
    if (scope.some((s) => s === "body" || s === "html")) return 50;
    if (scope.some((s) => s === "div" || s === "section" || s === "article")) return 250;
    return 300;
  }
  return 50;
}
var BOUNDARY_SCORES = {
  exact: 300,
  selector: 275,
  "ancestor-depth": 250,
  "repeated-card": 225,
  "semantic-block": 200,
  "nearest-card": 175,
  "visual-block": 150
};
var MATCH_MODE_SCORES = {
  none: () => 100,
  exact: () => 300,
  similar: (t) => (t ?? 0.82) >= 0.82 ? 250 : 220,
  structural: (t) => (t ?? 0.8) >= 0.8 ? 240 : 220
};
function getLogicStrengthScore(rule) {
  const where = "where" in rule ? rule.where : void 0;
  const except = "except" in rule ? rule.except : void 0;
  if (!where) return 0;
  if (except) return 300;
  if (hasConditionType(where, "regex") || hasConditionType(where, "attribute")) return 250;
  if (hasConditionType(where, "text")) return 200;
  return 100;
}
function hasConditionType(expr, op) {
  if (!expr || typeof expr !== "object") return false;
  const e = expr;
  if ("condition" in e && typeof e.condition === "object" && e.condition !== null) {
    const c = e.condition;
    if (c.operator === op) return true;
  }
  const group = e;
  for (const key of ["all", "any", "none"]) {
    const arr = group[key];
    if (arr) {
      for (const child of arr) {
        if (hasConditionType(child, op)) return true;
      }
    }
  }
  return false;
}
var SOURCE_SPECIFICITY = {
  picker: 3,
  "manual-editor": 2,
  migration: 1
};
function getActionStrength(action) {
  return ACTION_STRENGTH[action.action] || 0;
}
function hasHideLikeAction(rule) {
  const a = rule.action.action;
  return a === "hide" || a === "collapse" || a === "remove" || a === "mark";
}
function getCreatedAt(rule) {
  return rule.metadata?.createdAt || "0";
}
function getConflictClass(rule) {
  if (rule.type === "smart-allow" && rule.action.action === "unhide") return "A" /* UserAllow */;
  if (rule.type === "hide-exact") return "B" /* UserExactHide */;
  if (rule.type === "smart-hide" || rule.type === "hide-similar") return "C" /* UserSmartHide */;
  return "F" /* GenericCosmetic */;
}
function getFullSpecificity(rule) {
  const targetScore = rule.targets.reduce((max, t) => Math.max(max, TARGET_WEIGHTS[t.form] || 100), 0);
  const pathScore = getPathScore(rule.paths);
  const ruleIntentScore = getRuleIntentScore(rule);
  const selectorScopeScore = getSelectorScopeScore(rule);
  let boundaryScore = 0;
  if ("boundary" in rule && rule.boundary) {
    boundaryScore = BOUNDARY_SCORES[rule.boundary.mode] || 0;
  }
  let matchScore = 0;
  if ("match" in rule && rule.match) {
    matchScore = (MATCH_MODE_SCORES[rule.match.mode] || MATCH_MODE_SCORES.none)(rule.match.threshold);
  }
  const logicStrengthScore = getLogicStrengthScore(rule);
  const sourceSpecificity = SOURCE_SPECIFICITY[rule.metadata?.source || ""] || 0;
  return {
    targetScore,
    pathScore,
    ruleIntentScore,
    selectorScopeScore,
    boundaryScore,
    matchScore,
    logicStrengthScore,
    sourceSpecificity
  };
}
var SPECIFICITY_DIMS = [
  "targetScore",
  "pathScore",
  "ruleIntentScore",
  "selectorScopeScore",
  "boundaryScore",
  "matchScore",
  "logicStrengthScore",
  "sourceSpecificity"
];
function compareSpecificityTuples(a, b) {
  for (const dim of SPECIFICITY_DIMS) {
    if (a[dim] !== b[dim]) return b[dim] - a[dim];
  }
  return 0;
}
function sortByConflictOrder(rules) {
  return [...rules].sort((a, b) => {
    const classA = getConflictClass(a);
    const classB = getConflictClass(b);
    if (classA !== classB) return classA.localeCompare(classB);
    const specDiff = compareSpecificityTuples(getFullSpecificity(a), getFullSpecificity(b));
    if (specDiff !== 0) return specDiff;
    const strengthA = getActionStrength(a.action);
    const strengthB = getActionStrength(b.action);
    if (strengthA !== strengthB) return strengthB - strengthA;
    const createdA = getCreatedAt(a);
    const createdB = getCreatedAt(b);
    if (createdA !== createdB) return createdA < createdB ? -1 : 1;
    return a.id.localeCompare(b.id);
  });
}

// src/core/smart-cosmetic/cosmetic-plan.ts
function compileCosmeticPlan(rules, url, _hostname) {
  const plan = {
    cssSelectors: [],
    smartRules: [],
    allows: [],
    classicRules: [],
    diagnostics: [],
    exportLoss: []
  };
  const enabled = rules.filter((r) => r.state === "active");
  const path = getPathFromUrl(url);
  for (const rule of enabled) {
    if (!pathMatches(rule.paths, path)) continue;
    plan.diagnostics.push(`rule ${rule.id}: added to plan`);
    if (rule.type === "smart-allow") {
      plan.allows.push(rule);
      plan.classicRules.push({ rule });
      plan.exportLoss.push("lossless");
      continue;
    }
    if (!hasHideLikeAction(rule)) continue;
    if (rule.type === "hide-exact") {
      if (rule.selector) {
        const lossless = isLosslessSelector(rule.selector);
        plan.cssSelectors.push(rule.selector);
        plan.diagnostics.push(`rule ${rule.id}: compiled as CSS selector`);
        plan.classicRules.push({ rule, losslessSelectorCompile: lossless });
        plan.exportLoss.push("lossless");
      }
      continue;
    }
    if (rule.type === "smart-hide" || rule.type === "hide-similar") {
      plan.diagnostics.push(`rule ${rule.id}: compiled as smart evaluation`);
      plan.exportLoss.push("not-possible");
      const safety = { ...DEFAULT_SAFETY, ...rule.safety };
      const performance = { ...DEFAULT_PERFORMANCE, ...rule.performance };
      const frames = { ...DEFAULT_FRAMES, ...rule.frames };
      const shadow = { ...DEFAULT_SHADOW, ...rule.shadow };
      const runtime = { ...DEFAULT_RUNTIME, ...rule.runtime };
      plan.smartRules.push({
        rule,
        boundary: rule.boundary ?? DEFAULT_BOUNDARY,
        match: rule.match,
        where: rule.where,
        except: rule.except,
        candidates: ("candidates" in rule ? rule.candidates : rule.candidates) ?? [],
        safety,
        performance,
        frames,
        shadow,
        runtime
      });
    }
  }
  plan.cssSelectors = applyConflictResolution(plan.cssSelectors, plan.allows);
  plan.allows = plan.allows.filter((a) => {
    const conflictClass = getConflictClass(a);
    return conflictClass === "A" /* UserAllow */;
  });
  return plan;
}
function getPathFromUrl(url) {
  try {
    const u = new URL(url);
    return u.pathname + u.search + u.hash;
  } catch (e) {
    console.warn("[uBR] cosmetic-plan: getPathFromUrl URL parse failed", url, e);
    return "";
  }
}
function pathMatches(paths, currentPath) {
  if (!paths || paths.length === 0) return true;
  if (!currentPath) return true;
  for (const entry of paths) {
    switch (entry.form) {
      case "exact":
        if (currentPath === entry.value) return true;
        break;
      case "glob": {
        const pattern = entry.value.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".");
        if (new RegExp(`^${pattern}$`).test(currentPath)) return true;
        break;
      }
      case "regex": {
        try {
          if (new RegExp(entry.value).test(currentPath)) return true;
        } catch (e) {
          console.warn("[uBR] cosmetic-plan: invalid regex in path match", entry.value, e);
        }
        break;
      }
    }
  }
  return false;
}
function isLosslessSelector(selector) {
  if (/::/.test(selector)) return false;
  if (/:has\(|:contains\(|:matches-property\(|:xpath\(/.test(selector)) return false;
  return true;
}
function applyConflictResolution(selectors, allows) {
  if (allows.length === 0 || selectors.length === 0) return selectors;
  const blocked = /* @__PURE__ */ new Set();
  for (const allow of allows) {
    if (allow.candidates) {
      for (const sel of allow.candidates) {
        blocked.add(sel);
      }
    }
  }
  return selectors.filter((s) => !blocked.has(s));
}

// src/core/smart-cosmetic/export.ts
function determineExportLoss(rule) {
  if (rule.type === "hide-exact") {
    if (rule.selector && rule.targets) {
      return { code: "lossless", reason: "Simple CSS selector with targets" };
    }
    return { code: "partial", reason: "Hide-exact without selector or targets", affectedRuleIds: [rule.id] };
  }
  if (rule.type === "smart-allow") {
    if (canExportSmartAllowLossless(rule)) {
      return { code: "lossless", reason: "Simple unhide with candidate selector" };
    }
    return { code: "partial", reason: "Smart-allow with complex semantics", affectedRuleIds: [rule.id] };
  }
  if (rule.type === "hide-similar") {
    if (rule.match?.mode === "exact" && !rule.where && !rule.except) {
      return { code: "lossless", reason: "Exact match without logic" };
    }
    return { code: "approximate", reason: "Similarity-based hide cannot be exactly represented in CSS", affectedRuleIds: [rule.id] };
  }
  if (rule.type === "smart-hide") {
    if (hasFieldUsage(rule, "own-text")) {
      return { code: "partial", reason: "own-text field used \u2014 cannot be exactly represented in classic CSS", affectedRuleIds: [rule.id] };
    }
    if (hasFieldUsage(rule, "semantic-text")) {
      return { code: "not-possible", reason: "semantic-text field used \u2014 cannot be represented in classic CSS", affectedRuleIds: [rule.id] };
    }
    if (!rule.where && !rule.except && !rule.keywords && (!rule.match || rule.match.mode === "none")) {
      return { code: "partial", reason: "Smart-hide without logic and no match mode" };
    }
    if (rule.where || rule.except || rule.keywords) {
      return { code: "approximate", reason: "Smart-hide with logic cannot be exactly represented in classic CSS" };
    }
    return { code: "approximate", reason: "Smart-hide with semantic matching", affectedRuleIds: [rule.id] };
  }
  const neverRule = rule;
  return { code: "not-possible", reason: "Unknown rule type", affectedRuleIds: [neverRule.id] };
}
function hasFieldUsage(rule, fieldName) {
  function scanExpr(expr) {
    if (!expr || typeof expr !== "object") return false;
    const e = expr;
    if ("condition" in e && typeof e.condition === "object" && e.condition !== null) {
      const c = e.condition;
      if (c.field === fieldName) return true;
    }
    const group = e;
    for (const key of ["all", "any", "none"]) {
      const arr = group[key];
      if (arr) {
        for (const child of arr) if (scanExpr(child)) return true;
      }
    }
    return false;
  }
  const where = "where" in rule ? rule.where : void 0;
  const except = "except" in rule ? rule.except : void 0;
  return scanExpr(where) || scanExpr(except);
}
function canExportSmartAllowLossless(rule) {
  if (rule.action.action !== "unhide") return false;
  if (rule.where || rule.except || rule.keywords) return false;
  if (rule.match && rule.match.mode !== "none") return false;
  if (!rule.candidates || rule.candidates.length !== 1) return false;
  return true;
}
function escapeYamlValue(value) {
  if (/[:{}[\],&*?|>!%@`#]/.test(value) || value.startsWith(" ") || value.endsWith(" ") || value === "" || value === "~" || value === "null" || value === "true" || value === "false") {
    return JSON.stringify(value);
  }
  return value;
}
function indent(level) {
  return "  ".repeat(level);
}
var SAFETY_FIELDS = [
  ["preview", "preview"],
  ["max-matches", "maxMatches"],
  ["max-page-percent", "maxPagePercent"],
  ["max-viewport-area-percent", "maxViewportAreaPercent"],
  ["min-features", "minFeatures"],
  ["min-logic-matches", "minLogicMatches"],
  ["allow-partial-apply", "allowPartialApply"],
  ["max-consecutive-partial", "maxConsecutivePartial"],
  ["partial-cycle-count", "partialCycleCount"],
  ["warn-if-scope-is-body", "warnIfScopeIsBody"],
  ["warn-if-no-where-logic", "warnIfNoWhereLogic"],
  ["warn-if-action-remove", "warnIfActionRemove"],
  ["confirm-page-root", "confirmPageRoot"],
  ["warn-if-weak-exact-reference", "warnIfWeakExactReference"]
];
var PERFORMANCE_FIELDS = [
  ["max-candidates", "maxCandidates"],
  ["max-evaluations-per-cycle", "maxEvaluationsPerCycle"],
  ["max-added-nodes-per-cycle", "maxAddedNodesPerCycle"],
  ["max-regex-ms-per-rule-cycle", "maxRegexMsPerRuleCycle"],
  ["max-regex-pattern-length", "maxRegexPatternLength"],
  ["max-text-regex-input-chars", "maxTextRegexInputChars"],
  ["debounce-ms", "debounceMs"],
  ["dependency-depth", "dependencyDepth"],
  ["dependency-prefilter", "dependencyPrefilter"],
  ["prefer-css-prefilter", "preferCssPrefilter"],
  ["metrics", "metrics"],
  ["sample-rate", "sampleRate"]
];
var FRAMES_FIELDS = [
  ["mode", "mode"],
  ["accounting", "accounting"],
  ["max-total-matches", "maxTotalMatches"]
];
var SHADOW_FIELDS = [
  ["mode", "mode"],
  ["observe-mutations", "observeMutations"],
  ["observe-recursive", "observeRecursive"],
  ["allow-host-ancestor", "allowHostAncestor"],
  ["max-roots-per-cycle", "maxRootsPerCycle"]
];
var RUNTIME_FIELDS = [
  ["observe-path-changes", "observePathChanges"],
  ["path-change-debounce-ms", "pathChangeDebounceMs"],
  ["re-evaluate-on-path-change", "reEvaluateOnPathChange"],
  ["observe-subtree", "observeSubtree"],
  ["observe-attributes", "observeAttributes"],
  ["error-recovery", "errorRecovery"],
  ["on-budget-exceeded", "onBudgetExceeded"],
  ["max-consecutive-partial-cycles", "maxConsecutivePartialCycles"]
];
var CACHE_FIELDS = [
  ["max-entries", "maxEntries"],
  ["max-age-ms", "maxAgeMs"],
  ["eviction-policy", "evictionPolicy"],
  ["scope", "scope"]
];
var METADATA_FIELDS = [
  ["source", "source"],
  ["created-at", "createdAt"],
  ["updated-at", "updatedAt"],
  ["title", "title"],
  ["description", "description"],
  ["created-by", "createdBy"],
  ["original-syntax", "originalSyntax"],
  ["original-id", "originalId"]
];
var PROVENANCE_FIELDS = [
  ["source", "source"],
  ["original-rule-id", "originalRuleId"],
  ["import-timestamp", "importTimestamp"],
  ["created-by", "createdBy"],
  ["created-from-host", "createdFromHost"],
  ["created-from-path", "createdFromPath"],
  ["original-rule-text", "originalRuleText"],
  ["original-source", "originalSource"]
];
function toKebab(s) {
  return s.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}
function serializeBlock(lines, level, blockName, block, fields) {
  if (!block) return;
  const hasValue = fields.some(([_yamlKey, key]) => block[key] !== void 0 && block[key] !== null);
  if (!hasValue) return;
  lines.push(`${indent(level)}${blockName}:`);
  for (const [yamlKey, key] of fields) {
    const val = block[key];
    if (val === void 0 || val === null) continue;
    if (typeof val === "string") {
      lines.push(`${indent(level + 1)}${yamlKey}: ${escapeYamlValue(val)}`);
    } else if (typeof val === "boolean") {
      lines.push(`${indent(level + 1)}${yamlKey}: ${val}`);
    } else if (typeof val === "number") {
      lines.push(`${indent(level + 1)}${yamlKey}: ${val}`);
    }
  }
}
function serializeActionBlock(lines, level, action) {
  const actionName = action.action;
  if (actionName === "style" && "style" in action) {
    lines.push(`${indent(level)}action: style`);
    lines.push(`${indent(level + 1)}style: ${escapeYamlValue(action.style)}`);
  } else {
    lines.push(`${indent(level)}action: ${actionName}`);
  }
  if (action.options) {
    if (action.options.important) {
      lines.push(`${indent(level + 1)}important: true`);
    }
  }
}
function serializeBoundaryBlock(lines, level, boundary) {
  if (!boundary) return;
  lines.push(`${indent(level)}boundary:`);
  lines.push(`${indent(level + 1)}mode: ${boundary.mode}`);
  for (const [yamlKey, key] of [["max-depth", "maxDepth"], ["selector", "selector"], ["depth", "depth"], ["stop-at-scope", "stopAtScope"], ["allow-cross-scope", "allowCrossScope"], ["allow-scope-root", "allowScopeRoot"], ["include-self", "includeSelf"], ["allow-page-root", "allowPageRoot"]]) {
    if (boundary[key] !== void 0 && boundary[key] !== null) {
      const val = boundary[key];
      if (typeof val === "boolean") {
        lines.push(`${indent(level + 1)}${yamlKey}: ${val}`);
      } else if (typeof val === "number") {
        lines.push(`${indent(level + 1)}${yamlKey}: ${val}`);
      } else if (typeof val === "string") {
        lines.push(`${indent(level + 1)}${yamlKey}: ${escapeYamlValue(val)}`);
      }
    }
  }
}
function serializeMatchBlock(lines, level, match) {
  if (!match) return;
  lines.push(`${indent(level)}match:`);
  lines.push(`${indent(level + 1)}mode: ${match.mode}`);
  for (const [yamlKey, key] of [["reference", "reference"], ["reference-selection", "referenceSelection"], ["threshold", "threshold"], ["weight-profile", "weights"]]) {
    if (match[key] !== void 0 && match[key] !== null) {
      const val = match[key];
      if (typeof val === "number") {
        lines.push(`${indent(level + 1)}${yamlKey}: ${val}`);
      } else if (typeof val === "string") {
        lines.push(`${indent(level + 1)}${yamlKey}: ${escapeYamlValue(val)}`);
      }
    }
  }
}
function serializeKeywordsBlock(lines, level, keywords) {
  if (!keywords) return;
  lines.push(`${indent(level)}keywords:`);
  if (keywords.matchMode) lines.push(`${indent(level + 1)}match-mode: ${keywords.matchMode}`);
  if (keywords.fields && keywords.fields.length > 0) lines.push(`${indent(level + 1)}fields: [${keywords.fields.join(", ")}]`);
  if (keywords.caseSensitive !== void 0) lines.push(`${indent(level + 1)}case-sensitive: ${keywords.caseSensitive}`);
  if (keywords.wordBoundary !== void 0) lines.push(`${indent(level + 1)}word-boundary: ${keywords.wordBoundary}`);
  for (const [yamlKey, arr] of [["include-any", "includeAny"], ["include-all", "includeAll"], ["exclude-any", "excludeAny"], ["exclude-all", "excludeAll"]]) {
    const items = keywords[arr];
    if (items && items.length > 0) {
      lines.push(`${indent(level + 1)}${yamlKey}:`);
      for (const item of items) lines.push(`${indent(level + 2)}- ${escapeYamlValue(item)}`);
    }
  }
}
function serializeCondition(lines, level, cond) {
  const c = cond;
  lines.push(`${indent(level)}condition:`);
  for (const key of ["field", "attr-name", "attr-family", "operator", "value", "pattern", "selector", "flags", "case-sensitive"]) {
    const yamlKey = toKebab(key);
    const val = c[key] ?? c[toKebab(key)];
    if (val !== void 0 && val !== null) {
      if (typeof val === "boolean") {
        lines.push(`${indent(level + 1)}${yamlKey}: ${val}`);
      } else {
        lines.push(`${indent(level + 1)}${yamlKey}: ${escapeYamlValue(String(val))}`);
      }
    }
  }
}
function serializeLogicExpression(lines, level, expr) {
  const group = expr;
  if (group.all || group.any || group.none) {
    for (const key of ["all", "any", "none"]) {
      const items = group[key];
      if (items && items.length > 0) {
        lines.push(`${indent(level)}${key}:`);
        for (const item of items) {
          lines.push(`${indent(level + 1)}-`);
          if (item.all || item.any || item.none) {
            serializeLogicExpression(lines, level + 2, item);
          } else {
            const expItem = item;
            serializeCondition(lines, level + 2, expItem.condition);
            if (expItem.label) lines.push(`${indent(level + 2)}label: ${escapeYamlValue(expItem.label)}`);
          }
        }
      }
    }
  } else {
    const expItem = expr;
    serializeCondition(lines, level, expItem.condition);
    if (expItem.label) lines.push(`${indent(level + 1)}label: ${escapeYamlValue(expItem.label)}`);
  }
}
function serializeWhereOrExcept(lines, level, key, expr) {
  if (!expr) return;
  lines.push(`${indent(level)}${key}:`);
  serializeLogicExpression(lines, level + 1, expr);
}
function serializeMetadata(lines, level, metadata) {
  if (!metadata) return;
  lines.push(`${indent(level)}metadata:`);
  for (const [yamlKey, key] of METADATA_FIELDS) {
    const val = metadata[key];
    if (val === void 0 || val === null) continue;
    if (typeof val === "string") {
      lines.push(`${indent(level + 1)}${yamlKey}: ${escapeYamlValue(val)}`);
    } else if (typeof val === "boolean") {
      lines.push(`${indent(level + 1)}${yamlKey}: ${val}`);
    } else if (typeof val === "number") {
      lines.push(`${indent(level + 1)}${yamlKey}: ${val}`);
    }
  }
  if (metadata.provenance) {
    serializeBlock(lines, level + 1, "provenance", metadata.provenance, PROVENANCE_FIELDS);
  }
}
function serializeLogicOptions(lines, level, logicOptions) {
  if (!logicOptions) return;
  lines.push(`${indent(level)}logic-options:`);
  if (logicOptions.stopAtScopeForAncestor !== void 0) {
    lines.push(`${indent(level + 1)}stop-at-scope-for-ancestor: ${logicOptions.stopAtScopeForAncestor}`);
  }
}
function serializeScope(lines, level, scope) {
  if (!scope || scope.length === 0) return;
  lines.push(`${indent(level)}scope:`);
  for (const s of scope) lines.push(`${indent(level + 1)}- ${escapeYamlValue(s)}`);
}
function serializeToYaml(rules) {
  const lines = [];
  lines.push("# uBR Smart Cosmetic Rules Export");
  lines.push(`# Generated: ${(/* @__PURE__ */ new Date()).toISOString()}`);
  lines.push(`# Total rules: ${rules.length}`);
  lines.push("");
  for (const rule of rules) {
    const loss = determineExportLoss(rule);
    lines.push(`# Export loss: ${loss.code}${loss.reason ? ` \u2014 ${loss.reason}` : ""}`);
    lines.push("");
    switch (rule.type) {
      case "hide-exact":
        serializeHideExact(lines, rule);
        break;
      case "hide-similar":
        serializeHideSimilar(lines, rule);
        break;
      case "smart-hide":
        serializeSmartHide(lines, rule);
        break;
      case "smart-allow":
        serializeSmartAllow(lines, rule);
        break;
    }
    lines.push("");
  }
  return lines.join("\n");
}
function serializeHideExact(lines, rule) {
  lines.push(`hide-exact:`);
  serializeTargets(lines, rule.targets);
  if (rule.paths) serializePaths(lines, rule.paths);
  lines.push(`${indent(1)}state: ${rule.state}`);
  serializeScope(lines, 1, rule.scope);
  lines.push(`${indent(1)}selector: ${escapeYamlValue(rule.selector)}`);
  serializeActionBlock(lines, 1, rule.action);
  serializeBlock(lines, 1, "safety", rule.safety, SAFETY_FIELDS);
  serializeBlock(lines, 1, "performance", rule.performance, PERFORMANCE_FIELDS);
  serializeBlock(lines, 1, "frames", rule.frames, FRAMES_FIELDS);
  serializeBlock(lines, 1, "shadow", rule.shadow, SHADOW_FIELDS);
  serializeBlock(lines, 1, "runtime", rule.runtime, RUNTIME_FIELDS);
  serializeBlock(lines, 1, "cache", rule.cache, CACHE_FIELDS);
  serializeMetadata(lines, 1, rule.metadata);
}
function serializeHideSimilar(lines, rule) {
  lines.push(`hide-similar:`);
  serializeTargets(lines, rule.targets);
  if (rule.paths) serializePaths(lines, rule.paths);
  lines.push(`${indent(1)}state: ${rule.state}`);
  serializeScope(lines, 1, rule.scope);
  serializeBoundaryBlock(lines, 1, rule.boundary);
  serializeMatchBlock(lines, 1, rule.match);
  serializeWhereOrExcept(lines, 1, "where", rule.where);
  serializeWhereOrExcept(lines, 1, "except", rule.except);
  if (rule.candidates && rule.candidates.length > 0) {
    lines.push(`${indent(1)}candidates:`);
    for (const c of rule.candidates) lines.push(`${indent(2)}- ${escapeYamlValue(c)}`);
  }
  serializeActionBlock(lines, 1, rule.action);
  serializeBlock(lines, 1, "safety", rule.safety, SAFETY_FIELDS);
  serializeBlock(lines, 1, "performance", rule.performance, PERFORMANCE_FIELDS);
  serializeBlock(lines, 1, "frames", rule.frames, FRAMES_FIELDS);
  serializeBlock(lines, 1, "shadow", rule.shadow, SHADOW_FIELDS);
  serializeBlock(lines, 1, "runtime", rule.runtime, RUNTIME_FIELDS);
  serializeBlock(lines, 1, "cache", rule.cache, CACHE_FIELDS);
  serializeMetadata(lines, 1, rule.metadata);
}
function serializeSmartHide(lines, rule) {
  lines.push(`smart-hide:`);
  serializeTargets(lines, rule.targets);
  if (rule.paths) serializePaths(lines, rule.paths);
  lines.push(`${indent(1)}state: ${rule.state}`);
  serializeScope(lines, 1, rule.scope);
  serializeBoundaryBlock(lines, 1, rule.boundary);
  serializeMatchBlock(lines, 1, rule.match);
  serializeWhereOrExcept(lines, 1, "where", rule.where);
  serializeWhereOrExcept(lines, 1, "except", rule.except);
  serializeKeywordsBlock(lines, 1, rule.keywords);
  if (rule.keywordMerge !== void 0) lines.push(`${indent(1)}keyword-merge: ${rule.keywordMerge}`);
  if (rule.candidates && rule.candidates.length > 0) {
    lines.push(`${indent(1)}candidates:`);
    for (const c of rule.candidates) lines.push(`${indent(2)}- ${escapeYamlValue(c)}`);
  }
  serializeActionBlock(lines, 1, rule.action);
  serializeBlock(lines, 1, "safety", rule.safety, SAFETY_FIELDS);
  serializeBlock(lines, 1, "performance", rule.performance, PERFORMANCE_FIELDS);
  serializeBlock(lines, 1, "frames", rule.frames, FRAMES_FIELDS);
  serializeBlock(lines, 1, "shadow", rule.shadow, SHADOW_FIELDS);
  serializeBlock(lines, 1, "runtime", rule.runtime, RUNTIME_FIELDS);
  serializeBlock(lines, 1, "cache", rule.cache, CACHE_FIELDS);
  serializeMetadata(lines, 1, rule.metadata);
}
function serializeSmartAllow(lines, rule) {
  lines.push(`smart-allow:`);
  serializeTargets(lines, rule.targets);
  if (rule.paths) serializePaths(lines, rule.paths);
  lines.push(`${indent(1)}state: ${rule.state}`);
  serializeScope(lines, 1, rule.scope);
  serializeBoundaryBlock(lines, 1, rule.boundary);
  serializeMatchBlock(lines, 1, rule.match);
  serializeWhereOrExcept(lines, 1, "where", rule.where);
  serializeWhereOrExcept(lines, 1, "except", rule.except);
  serializeKeywordsBlock(lines, 1, rule.keywords);
  if (rule.keywordMerge !== void 0) lines.push(`${indent(1)}keyword-merge: ${rule.keywordMerge}`);
  if (rule.allowBroad !== void 0) lines.push(`${indent(1)}allow-broad: ${rule.allowBroad}`);
  serializeLogicOptions(lines, 1, rule.logicOptions);
  if (rule.candidates && rule.candidates.length > 0) {
    lines.push(`${indent(1)}candidates:`);
    for (const c of rule.candidates) lines.push(`${indent(2)}- ${escapeYamlValue(c)}`);
  }
  serializeActionBlock(lines, 1, rule.action);
  serializeBlock(lines, 1, "safety", rule.safety, SAFETY_FIELDS);
  serializeBlock(lines, 1, "performance", rule.performance, PERFORMANCE_FIELDS);
  serializeBlock(lines, 1, "frames", rule.frames, FRAMES_FIELDS);
  serializeBlock(lines, 1, "shadow", rule.shadow, SHADOW_FIELDS);
  serializeBlock(lines, 1, "runtime", rule.runtime, RUNTIME_FIELDS);
  serializeBlock(lines, 1, "cache", rule.cache, CACHE_FIELDS);
  serializeMetadata(lines, 1, rule.metadata);
}
function serializeTargets(lines, targets) {
  if (targets.length > 0) {
    lines.push(`${indent(1)}targets:`);
    for (const t of targets) {
      lines.push(`${indent(2)}- ${t.form}: ${escapeYamlValue(t.value)}`);
    }
  }
}
function serializePaths(lines, paths) {
  lines.push(`${indent(1)}paths:`);
  for (const p of paths) {
    lines.push(`${indent(2)}- ${p.form}: ${escapeYamlValue(p.value)}`);
  }
}
async function exportAllRules() {
  const rules = smartRuleStore.getAllRules();
  const yaml = serializeToYaml(rules);
  const lossMetadata = [];
  for (const rule of rules) {
    const loss = determineExportLoss(rule);
    lossMetadata.push(loss);
  }
  return {
    yaml,
    classicLines: [],
    lossMetadata,
    totalRules: rules.length,
    losslessCount: lossMetadata.filter((l) => l.code === "lossless").length,
    partialCount: lossMetadata.filter((l) => l.code === "partial").length,
    approximateCount: lossMetadata.filter((l) => l.code === "approximate").length,
    notPossibleCount: lossMetadata.filter((l) => l.code === "not-possible").length
  };
}

// src/core/smart-cosmetic/engine.ts
init_smart_rule_parser();
var MAX_SELECTORS_PER_BATCH = 50;
var Engine = class {
  constructor() {
    __publicField(this, "tabs", /* @__PURE__ */ new Map());
    __publicField(this, "activeDownloads", /* @__PURE__ */ new Set());
    __publicField(this, "initialized", false);
    __publicField(this, "trustedHostnames", /* @__PURE__ */ new Set());
  }
  async init() {
    if (this.initialized) return;
    await smartRuleStore.load();
    this.initialized = true;
  }
  async refresh() {
    await smartRuleStore.load();
  }
  getRulesForTab(tabId) {
    const tab = this.tabs.get(tabId);
    if (!tab) return [];
    const allRules = smartRuleStore.getAllRules();
    const matching = allRules.filter((r) => {
      if (r.state !== "active") return false;
      return this.ruleMatchesHost(r, tab.hostname);
    });
    return sortByConflictOrder(matching);
  }
  getCosmeticPlanForTab(tabId, url) {
    const hostname = this.extractHostname(url);
    if (this.isSiteTrusted(url)) {
      return { matched: 0, hidden: 0, removed: 0, plan: compileCosmeticPlan([], url, hostname) };
    }
    let tab = this.tabs.get(tabId);
    if (!tab) {
      tab = { url, hostname, appliedSelectors: /* @__PURE__ */ new Set(), lastApply: 0 };
      this.tabs.set(tabId, tab);
    }
    tab.url = url;
    tab.hostname = hostname;
    tab.lastApply = Date.now();
    const rules = this.getRulesForTab(tabId);
    const plan = compileCosmeticPlan(rules, url, hostname);
    return {
      matched: plan.cssSelectors.length + plan.smartRules.length,
      hidden: plan.cssSelectors.length,
      removed: 0,
      plan
    };
  }
  applyRulesToTab(tabId, url) {
    const hostname = this.extractHostname(url);
    if (this.isSiteTrusted(url)) {
      return { matched: 0, hidden: 0, removed: 0, selectors: [] };
    }
    let tab = this.tabs.get(tabId);
    if (!tab) {
      tab = { url, hostname, appliedSelectors: /* @__PURE__ */ new Set(), lastApply: 0 };
      this.tabs.set(tabId, tab);
    }
    tab.url = url;
    tab.hostname = hostname;
    tab.lastApply = Date.now();
    const rules = this.getRulesForTab(tabId);
    const selectorSet = /* @__PURE__ */ new Set();
    const removedSelectors = /* @__PURE__ */ new Set();
    const hideRules = rules.filter((r) => r.type !== "smart-allow");
    const allowRules = rules.filter((r) => r.type === "smart-allow");
    for (const rule of hideRules) {
      if (!hasHideLikeAction(rule)) continue;
      const result = this.processRule(rule, tab);
      if (rule.action.action === "remove") {
        for (const sel of result.selectors) {
          removedSelectors.add(sel);
        }
      }
      for (const sel of result.selectors) {
        selectorSet.add(sel);
      }
    }
    for (const rule of allowRules) {
      const removed = this.processSmartAllowAgainst(rule, selectorSet);
      for (const sel of removed) {
        selectorSet.delete(sel);
        removedSelectors.add(sel);
      }
    }
    tab.appliedSelectors = /* @__PURE__ */ new Set([...selectorSet]);
    const selectors = Array.from(selectorSet);
    return {
      matched: selectors.length,
      hidden: selectors.length,
      removed: removedSelectors.size,
      selectors
    };
  }
  processSmartAllowAgainst(rule, currentSelectors) {
    if (currentSelectors.size === 0) return [];
    const removed = [];
    if (rule.candidates) {
      for (const sel of rule.candidates) {
        if (currentSelectors.has(sel)) {
          removed.push(sel);
        }
      }
    }
    if (rule.scope) {
      for (const sel of rule.scope) {
        if (currentSelectors.has(sel)) {
          removed.push(sel);
        }
      }
    }
    return removed;
  }
  processRule(rule, tab) {
    switch (rule.type) {
      case "hide-exact":
        return this.processHideExact(rule);
      case "hide-similar":
        return this.processHideSimilar(rule, tab);
      case "smart-hide":
        return this.processSmartHide(rule, tab);
      default:
        return { selectors: [] };
    }
  }
  processHideExact(rule) {
    if (!rule.selector) return { selectors: [] };
    return { selectors: [rule.selector] };
  }
  processHideSimilar(rule, _tab) {
    void _tab;
    const selectors = rule.candidates ? [...rule.candidates] : [];
    const safety = rule.safety;
    const cap = safety?.maxMatches ?? MAX_SELECTORS_PER_BATCH;
    return { selectors: selectors.slice(0, cap) };
  }
  processSmartHide(rule, _tab) {
    const selectors = rule.candidates ? [...rule.candidates] : [];
    const safety = rule.safety;
    const cap = safety?.maxMatches ?? MAX_SELECTORS_PER_BATCH;
    return { selectors: selectors.slice(0, cap) };
  }
  ruleMatchesHost(rule, hostname) {
    for (const target of rule.targets) {
      if (target.form === "host" && target.value === hostname) return true;
      if (target.form === "domain") {
        const parts = hostname.split(".");
        const registered = parts.slice(-2).join(".");
        if (registered === target.value) return true;
        if (hostname === target.value) return true;
      }
      if (target.form === "regex") {
        try {
          if (new RegExp(target.value).test(hostname)) return true;
        } catch (e) {
          console.warn("[uBR] engine: ruleMatchesHost regex test failed", target.value, e);
          return false;
        }
      }
      if (target.form === "entity") {
        const entityName = target.value.replace(/\.\*$/, "");
        if (hostname === entityName) return true;
        if (hostname.startsWith(`${entityName}.`)) return true;
        if (hostname.endsWith(`.${entityName}`)) return true;
        if (hostname.includes(`.${entityName}.`)) return true;
      }
      if (target.value === "*") {
        if (rule?.metadata?.scope === "test-only" || rule?.safety?.allowGlobal === true) {
          return true;
        }
        return false;
      }
    }
    return false;
  }
  async triggerUpdate(url) {
    const hostname = this.extractHostname(url);
    const rules = smartRuleStore.getRulesByHost(hostname);
    const collectionsToUpdate = /* @__PURE__ */ new Set();
    for (const rule of rules) {
      if (rule.collectionId && rule.state === "active") {
        const col = smartRuleStore.getCollection(rule.collectionId);
        if (col?.sourceUrl) {
          collectionsToUpdate.add(rule.collectionId);
        }
      }
    }
    for (const colId of collectionsToUpdate) {
      if (!this.activeDownloads.has(colId)) {
        this.activeDownloads.add(colId);
        fetchGateway.fetchNow(colId).finally(() => {
          this.activeDownloads.delete(colId);
        });
      }
    }
  }
  subscribeToCollection(url, collectionId) {
    return fetchGateway.subscribe(url, collectionId);
  }
  unsubscribeFromCollection(collectionId) {
    return fetchGateway.unsubscribe(collectionId);
  }
  removeTab(tabId) {
    this.tabs.delete(tabId);
  }
  getTabSelectors(tabId) {
    const tab = this.tabs.get(tabId);
    return tab ? Array.from(tab.appliedSelectors) : [];
  }
  getAllRules() {
    return smartRuleStore.getAllRules();
  }
  getStats() {
    const allRules = smartRuleStore.getAllRules();
    return {
      totalRules: allRules.length,
      enabledRules: allRules.filter((r) => r.state === "active").length,
      loadedCollections: smartRuleStore.getAllCollections().length,
      pendingFetches: this.activeDownloads.size,
      tabsActive: this.tabs.size
    };
  }
  extractHostname(url) {
    try {
      return new URL(url).hostname;
    } catch (e) {
      console.warn("[uBR] engine: extractHostname URL parse failed", url, e);
      return url;
    }
  }
  setTrustedHostnames(hostnames) {
    this.trustedHostnames = new Set(hostnames);
  }
  addTrustedHostname(hostname) {
    this.trustedHostnames.add(hostname);
  }
  isSiteTrusted(url) {
    const hostname = this.extractHostname(url);
    if (this.trustedHostnames.has(hostname)) return true;
    if (this.trustedHostnames.has(`*.${hostname.split(".").slice(-2).join(".")}`)) return true;
    return false;
  }
};
var smartEngine = new Engine();
async function seedDemoRules() {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const rules = [
    {
      type: "hide-exact",
      id: "demo:simple-ad",
      syntaxVersion: 1,
      state: "active",
      priority: 50,
      metadata: { createdAt: now, source: "migration" },
      preview: { status: "confirmed" },
      targets: [{ form: "host", value: "example.com" }],
      selector: ".ad, .ads, .advertisement",
      action: { action: "hide" }
    },
    {
      type: "smart-hide",
      id: "demo:smart-card",
      syntaxVersion: 1,
      state: "active",
      priority: 50,
      metadata: { createdAt: now, source: "migration" },
      preview: { status: "confirmed" },
      targets: [{ form: "host", value: "example.com" }],
      candidates: [".card", ".item", "article"],
      boundary: { mode: "repeated-card", maxDepth: 6 },
      match: { mode: "none" },
      where: { condition: { field: "text", operator: "contains", value: "sponsored" } },
      action: { action: "hide" }
    }
  ];
  for (const rule of rules) {
    await smartRuleStore.addRule(rule);
  }
}
export {
  ConflictClass,
  Engine,
  engine_exports as SmartEngine,
  exportAllRules,
  getActionStrength,
  hasHideLikeAction,
  parseSmartRules,
  seedDemoRules,
  smartEngine,
  smartRuleStore
};
