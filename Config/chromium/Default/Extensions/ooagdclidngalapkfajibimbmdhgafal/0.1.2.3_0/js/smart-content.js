// GENERATED FILE. Do not edit directly.
// Source: src/js/smart-content.ts
// Build command: npm run build
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // src/core/smart-cosmetic/smart-rule-schema.ts
  var DEFAULT_BOUNDARY = Object.freeze({
    mode: "repeated-card",
    maxDepth: 8,
    stopAtScope: true,
    allowCrossScope: false,
    allowScopeRoot: false,
    includeSelf: false,
    allowPageRoot: false
  });
  var DEFAULT_SAFETY = Object.freeze({
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
  var DEFAULT_PERFORMANCE = Object.freeze({
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
  var DEFAULT_FRAMES = Object.freeze({
    mode: "top-only",
    accounting: "per-frame",
    maxTotalMatches: 150
  });
  var DEFAULT_SHADOW = Object.freeze({
    mode: "none",
    observeMutations: true,
    observeRecursive: false,
    allowHostAncestor: false,
    maxRootsPerCycle: 20
  });
  var DEFAULT_RUNTIME = Object.freeze({
    observePathChanges: true,
    pathChangeDebounceMs: 200,
    reEvaluateOnPathChange: "smart",
    observeSubtree: true,
    observeAttributes: "auto",
    errorRecovery: "continue",
    onBudgetExceeded: "stop-cycle",
    maxConsecutivePartialCycles: 3
  });
  var DEFAULT_CACHE = Object.freeze({
    maxEntries: 1e3,
    maxAgeMs: 6e4,
    evictionPolicy: "LRU",
    scope: "per-rule"
  });
  var DEFAULT_LOGIC_OPTIONS = Object.freeze({
    stopAtScopeForAncestor: true
  });
  var SAFE_STYLE_PROPERTIES = /* @__PURE__ */ new Set([
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
  var ALLOWED_DISPLAY_VALUES = /* @__PURE__ */ new Set([
    "none",
    "block",
    "inline",
    "inline-block",
    "flex",
    "grid",
    "revert"
  ]);
  var ALLOWED_VISIBILITY_VALUES = /* @__PURE__ */ new Set([
    "hidden",
    "visible",
    "collapse"
  ]);
  var DEFAULT_THRESHOLDS = Object.freeze({
    "hide-similar:similar:default-card": 0.82,
    "hide-similar:similar:": 0.82,
    "hide-similar:structural": 0.8,
    "smart-hide:similar:strong-logic": 0.74,
    "smart-hide:structural:strong-logic": 0.76,
    "smart-hide:similar:": 0.82,
    "smart-hide:similar:content-heavy": 0.78
  });
  var DEFAULT_WEIGHT_PROFILES = Object.freeze({
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

  // src/core/smart-cosmetic/logic-evaluator.ts
  var MAX_ANCESTOR_DEPTH = 100;
  function evaluateWhereExcept(element, where, except, options) {
    const diagnostics = [];
    let whereMatchedCount = 0;
    let wherePassed = true;
    let exceptPassed = false;
    const evalOpts = options ?? {};
    if (where) {
      const whereResult = evaluateLogicExpression(element, where, "where", diagnostics, evalOpts);
      wherePassed = whereResult.passed;
      whereMatchedCount = whereResult.matchedCount;
    }
    if (except) {
      const exceptResult = evaluateLogicExpression(element, except, "except", diagnostics, evalOpts);
      exceptPassed = exceptResult.passed;
    }
    const minMatches = options?.minLogicMatches ?? 1;
    const matchCountOk = whereMatchedCount >= minMatches || !where;
    const passed = wherePassed && matchCountOk && !exceptPassed;
    return { passed, matchedCount: whereMatchedCount, diagnostics };
  }
  function evaluateLogicExpression(element, expr, context, diagnostics, options) {
    if ("condition" in expr) {
      const item = expr;
      const result = evaluateCondition(element, item.condition, diagnostics, options);
      return { passed: result, matchedCount: result ? 1 : 0 };
    }
    const group = expr;
    if (group.all) {
      let count = 0;
      for (const sub of group.all) {
        const r = evaluateLogicExpression(element, sub, context, diagnostics, options);
        if (!r.passed) return { passed: false, matchedCount: count };
        count += r.matchedCount;
      }
      return { passed: true, matchedCount: count };
    }
    if (group.any) {
      let count = 0;
      let found = false;
      for (const sub of group.any) {
        const r = evaluateLogicExpression(element, sub, context, diagnostics, options);
        if (r.passed) found = true;
        if (found) count += r.matchedCount;
      }
      if (found) return { passed: true, matchedCount: count };
      return { passed: false, matchedCount: 0 };
    }
    if (group.none) {
      let count = 0;
      for (const sub of group.none) {
        const r = evaluateLogicExpression(element, sub, context, diagnostics, options);
        if (r.passed) return { passed: false, matchedCount: count };
        count += r.matchedCount;
      }
      return { passed: true, matchedCount: 0 };
    }
    return { passed: false, matchedCount: 0 };
  }
  function evaluateCondition(element, condition, diagnostics, options) {
    const start = performance.now();
    const timeout = DEFAULT_PERFORMANCE.maxRegexMsPerRuleCycle ?? 10;
    try {
      const result = doEvaluateCondition(element, condition, diagnostics, options);
      const elapsed = performance.now() - start;
      if (elapsed > timeout) {
        diagnostics.push({
          code: "LOGIC_TIMEOUT",
          message: `Condition evaluation exceeded ${timeout}ms (${elapsed.toFixed(0)}ms)`
        });
      }
      return result;
    } catch (e) {
      diagnostics.push({
        code: "LOGIC_ERROR",
        message: `Condition evaluation error: ${e instanceof Error ? e.message : String(e)}`
      });
      return false;
    }
  }
  function doEvaluateCondition(element, condition, diagnostics, options) {
    if ("attrName" in condition && !("operator" in condition)) {
      const c = condition;
      return evaluateAttributeCondition(element, c);
    }
    if ("attrFamily" in condition) {
      const c = condition;
      return evaluateAttributeFamilyCondition(element, c);
    }
    if ("field" in condition && "operator" in condition) {
      const op = condition.operator;
      if (op === ">=" || op === "<=" || op === ">" || op === "<" || op === "==") {
        return evaluateNumericCondition(element, condition);
      }
    }
    if ("operator" in condition) {
      if (condition.operator === "count") {
        try {
          return condition.value && element.querySelectorAll(condition.value).length > 0;
        } catch (e) {
          console.warn("[uBR] logic-evaluator: count querySelectorAll failed", e);
          return false;
        }
      }
      if (condition.operator === "density") {
        try {
          const total = element.children.length;
          if (total === 0) return false;
          const matching = element.querySelectorAll(condition.value).length;
          return matching / total > 0;
        } catch (e) {
          console.warn("[uBR] logic-evaluator: density querySelectorAll failed", e);
          return false;
        }
      }
      switch (condition.operator) {
        case "equals":
        case "not-equals":
        case "contains":
        case "starts-with":
        case "ends-with": {
          const c = condition;
          return evaluateSimpleCondition(element, c, condition.operator === "not-equals");
        }
        case "regex": {
          const c = condition;
          return evaluateRegexCondition(element, c, diagnostics);
        }
        case "exists":
        case "not-exists": {
          const c = condition;
          return evaluateExistenceCondition(element, c);
        }
        case "selector-matches": {
          const c = condition;
          return element.matches?.(c.selector) ?? false;
        }
        case "has-descendant": {
          const c = condition;
          return evaluateHasDescendant(element, c, diagnostics);
        }
        case "has-ancestor": {
          const c = condition;
          return evaluateHasAncestor(element, c, diagnostics, options?.scopeRoot, options?.stopAtScopeForAncestor);
        }
        default:
          return false;
      }
    }
    return false;
  }
  function getFieldValue(element, field) {
    switch (field) {
      case "text": {
        if (element.shadowRoot) {
          return (element.shadowRoot.textContent ?? "").trim();
        }
        return (element.textContent ?? "").trim();
      }
      case "all-text": {
        if (element.shadowRoot) {
          return element.shadowRoot.textContent ?? "";
        }
        return element.textContent ?? "";
      }
      case "own-text": {
        let text = "";
        for (const node of element.childNodes) {
          if (node.nodeType === Node.TEXT_NODE) {
            text += node.textContent ?? "";
          }
        }
        return text.trim();
      }
      case "semantic-text": {
        const clone = element.cloneNode(true);
        for (const el of clone.querySelectorAll('script, style, template, [aria-hidden="true"]')) {
          el.remove();
        }
        return (clone.textContent ?? "").trim();
      }
      case "aria-label":
        return element.getAttribute("aria-label") ?? "";
      case "alt":
        return element.getAttribute?.("alt") ?? "";
      case "href":
        return element.href ?? "";
      case "role":
        return element.getAttribute("role") ?? "";
      case "tag":
        return element.tagName.toLowerCase();
      default:
        if (field.startsWith("data-") || field.startsWith("aria-")) {
          return element.getAttribute(field) ?? "";
        }
        return element.getAttribute(field) ?? "";
    }
  }
  function getNumericFieldValue(element, field) {
    switch (field) {
      case "text-length":
        return (element.textContent ?? "").trim().length;
      case "link-count":
        return element.querySelectorAll("a[href]").length;
      case "link-density": {
        const textLen = (element.textContent ?? "").trim().length;
        if (textLen === 0) return 0;
        const linkTextLen = Array.from(element.querySelectorAll("a[href]")).reduce((s, a) => s + (a.textContent ?? "").trim().length, 0);
        return linkTextLen / textLen;
      }
      case "child-count":
        return element.children.length;
      default:
        return 0;
    }
  }
  function getAllMatchingAttributeValues(element, prefix) {
    const result = /* @__PURE__ */ new Map();
    const prefixLen = prefix.length;
    if (element.hasAttributes?.()) {
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        if (attr.name.startsWith(prefix) && attr.name.length > prefixLen) {
          result.set(attr.name, attr.value);
        }
      }
    }
    return result;
  }
  function evaluateSimpleCondition(element, cond, negate) {
    const value = getFieldValue(element, cond.field);
    if (cond.field === "all-text") {
      const match = applySimpleMatch(value, cond.operator, cond.value, cond.caseSensitive);
      return negate ? !match : match;
    }
    switch (cond.operator) {
      case "equals":
        return compareText(value, cond.value, !negate, cond.caseSensitive);
      case "contains":
        return compareTextContains(value, cond.value, !negate, cond.caseSensitive);
      case "starts-with":
        return compareTextStartsWith(value, cond.value, !negate, cond.caseSensitive);
      case "ends-with":
        return compareTextEndsWith(value, cond.value, !negate, cond.caseSensitive);
      default:
        return false;
    }
  }
  function applySimpleMatch(text, operator, value, caseSensitive) {
    const a = caseSensitive ? text : text.toLowerCase();
    const b = caseSensitive ? value : value.toLowerCase();
    switch (operator) {
      case "equals":
        return a === b;
      case "contains":
        return a.includes(b);
      case "starts-with":
        return a.startsWith(b);
      case "ends-with":
        return a.endsWith(b);
      default:
        return false;
    }
  }
  function compareText(value, expected, shouldEqual, caseSensitive) {
    const a = caseSensitive ? value : value.toLowerCase();
    const b = caseSensitive ? expected : expected.toLowerCase();
    return shouldEqual ? a === b : a !== b;
  }
  function compareTextContains(haystack, needle, shouldContain, caseSensitive) {
    const a = caseSensitive ? haystack : haystack.toLowerCase();
    const b = caseSensitive ? needle : needle.toLowerCase();
    return shouldContain ? a.includes(b) : !a.includes(b);
  }
  function compareTextStartsWith(text, prefix, shouldStart, caseSensitive) {
    const a = caseSensitive ? text : text.toLowerCase();
    const b = caseSensitive ? prefix : prefix.toLowerCase();
    return shouldStart ? a.startsWith(b) : !a.startsWith(b);
  }
  function compareTextEndsWith(text, suffix, shouldEnd, caseSensitive) {
    const a = caseSensitive ? text : text.toLowerCase();
    const b = caseSensitive ? suffix : suffix.toLowerCase();
    return shouldEnd ? a.endsWith(b) : !a.endsWith(b);
  }
  var MAX_TEXT_REGEX_INPUT_CHARS = 4096;
  function evaluateRegexCondition(element, cond, diagnostics) {
    let value = getFieldValue(element, cond.field);
    if (value.length > MAX_TEXT_REGEX_INPUT_CHARS) {
      value = value.slice(0, MAX_TEXT_REGEX_INPUT_CHARS);
      diagnostics.push({ code: "TEXT_TRUNCATED", message: `Regex input truncated to ${MAX_TEXT_REGEX_INPUT_CHARS} chars` });
    }
    try {
      const flags = cond.flags ?? "";
      const re = new RegExp(cond.pattern, flags.includes("i") ? "i" : "");
      return re.test(value);
    } catch (e) {
      console.warn("[uBR] logic-evaluator: regex test failed", cond.pattern, e);
      return false;
    }
  }
  function evaluateExistenceCondition(element, cond) {
    const value = getFieldValue(element, cond.field);
    const exists = value.length > 0;
    return cond.operator === "exists" ? exists : !exists;
  }
  function evaluateHasDescendant(element, cond, diagnostics) {
    try {
      const descendants = element.querySelectorAll(cond.selector);
      if (descendants.length > 0) return true;
      if (element.shadowRoot) {
        const shadowResult = element.shadowRoot.querySelector(cond.selector);
        if (shadowResult) return true;
      }
      return false;
    } catch {
      diagnostics.push({
        code: "INVALID_SELECTOR",
        message: `Invalid has-descendant selector: ${cond.selector}`
      });
      return false;
    }
  }
  function evaluateHasAncestor(element, cond, diagnostics, scopeRoot, stopAtScopeForAncestor) {
    let current = element.parentElement;
    let depth = 0;
    try {
      while (current && depth < MAX_ANCESTOR_DEPTH) {
        if (stopAtScopeForAncestor && scopeRoot && current === scopeRoot) return false;
        if (current.matches?.(cond.selector)) return true;
        current = current.parentElement;
        depth++;
      }
    } catch {
      diagnostics.push({
        code: "INVALID_SELECTOR",
        message: `Invalid has-ancestor selector: ${cond.selector}`
      });
    }
    return false;
  }
  function evaluateNumericCondition(element, cond) {
    const value = getNumericFieldValue(element, cond.field);
    switch (cond.operator) {
      case ">=":
        return value >= cond.value;
      case "<=":
        return value <= cond.value;
      case ">":
        return value > cond.value;
      case "<":
        return value < cond.value;
      case "==":
        return value === cond.value;
      default:
        return false;
    }
  }
  function evaluateAttributeCondition(element, cond) {
    const attrName = cond.attrName;
    if (cond.family === "data" || cond.family === "aria") {
      const prefix = cond.family === "data" ? "data-" : "aria-";
      const attrs = getAllMatchingAttributeValues(element, prefix);
      return attrs.size > 0;
    }
    const val = element.getAttribute(attrName) ?? "";
    return val.length > 0;
  }
  function applyAttributeValueMatch(value, operator, cond) {
    const pattern = cond.pattern;
    switch (operator) {
      case "equals":
        return value.toLowerCase() === pattern.toLowerCase();
      case "contains":
        return value.toLowerCase().includes(pattern.toLowerCase());
      case "regex": {
        try {
          return new RegExp(pattern, "i").test(value);
        } catch (e) {
          console.warn("[uBR] logic-evaluator: applyAttributeValueMatch regex failed", pattern, e);
          return false;
        }
      }
      default:
        return value.length > 0;
    }
  }
  function evaluateAttributeFamilyCondition(element, cond) {
    const prefix = cond.attrFamily === "data-*" ? "data-" : "aria-";
    const attrs = getAllMatchingAttributeValues(element, prefix);
    for (const [, val] of attrs) {
      if (applyAttributeValueMatch(val, cond.operator, cond)) return true;
    }
    return false;
  }
  function evaluateKeywordBlock(element, keywords) {
    const diagnostics = [];
    const fields = keywords.fields ?? ["text"];
    const text = fields.map((f) => getFieldValue(element, f)).join(" ").toLowerCase();
    const matchMode = keywords.matchMode ?? "phrase";
    const caseSensitive = keywords.caseSensitive ?? false;
    const wordBoundary = keywords.wordBoundary ?? false;
    let matchedCount = 0;
    function matchesKeyword(text2, keyword) {
      const t = caseSensitive ? text2 : text2.toLowerCase();
      const k = caseSensitive ? keyword : keyword.toLowerCase();
      switch (matchMode) {
        case "phrase":
          return t.includes(k);
        case "word": {
          const pattern = wordBoundary ? new RegExp(`\\b${escapeRegex(k)}\\b`, caseSensitive ? "" : "i") : new RegExp(escapeRegex(k), caseSensitive ? "" : "i");
          return pattern.test(t);
        }
        case "regex": {
          try {
            return new RegExp(keyword, caseSensitive ? "" : "i").test(text2);
          } catch (e) {
            console.warn("[uBR] logic-evaluator: matchesKeyword regex failed", keyword, e);
            return false;
          }
        }
        default:
          return false;
      }
    }
    if (keywords.includeAny && keywords.includeAny.length > 0) {
      const anyPass = keywords.includeAny.some((kw) => matchesKeyword(text, kw));
      if (!anyPass) {
        return { passed: false, matchedCount: 0, diagnostics };
      }
      matchedCount++;
    }
    if (keywords.includeAll && keywords.includeAll.length > 0) {
      const allPass = keywords.includeAll.every((kw) => matchesKeyword(text, kw));
      if (!allPass) {
        return { passed: false, matchedCount: 0, diagnostics };
      }
      matchedCount++;
    }
    if (keywords.excludeAny && keywords.excludeAny.length > 0) {
      const anyExcluded = keywords.excludeAny.some((kw) => matchesKeyword(text, kw));
      if (anyExcluded) {
        return { passed: false, matchedCount: 0, diagnostics };
      }
    }
    if (keywords.excludeAll && keywords.excludeAll.length > 0) {
      const allExcluded = keywords.excludeAll.every((kw) => matchesKeyword(text, kw));
      if (allExcluded) {
        return { passed: false, matchedCount: 0, diagnostics };
      }
    }
    return { passed: true, matchedCount, diagnostics };
  }
  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  function evaluateRuleLogic(element, rule) {
    const isSmartHide = rule.type === "smart-hide";
    const smartHide = isSmartHide ? rule : null;
    if (isSmartHide && smartHide.keywords) {
      if (smartHide.keywordMerge) {
        if (smartHide.where) {
          const whereResult = evaluateWhereExcept(element, smartHide.where);
          if (!whereResult.passed) return whereResult;
        }
        const kwResult2 = evaluateKeywordBlock(element, smartHide.keywords);
        if (!kwResult2.passed) return kwResult2;
        if (rule.except) {
          const exceptResult = evaluateWhereExcept(element, void 0, rule.except);
          if (exceptResult.passed) return { passed: false, matchedCount: 0, diagnostics: exceptResult.diagnostics };
        }
        return { passed: true, matchedCount: 1, diagnostics: [] };
      }
      if (smartHide.where) {
        return evaluateWhereExcept(element, smartHide.where, rule.except, { minLogicMatches: rule.safety?.minLogicMatches });
      }
      const kwResult = evaluateKeywordBlock(element, smartHide.keywords);
      if (!kwResult.passed) return kwResult;
      if (rule.except) {
        const exceptResult = evaluateWhereExcept(element, void 0, rule.except);
        if (exceptResult.passed) return { passed: false, matchedCount: 0, diagnostics: exceptResult.diagnostics };
      }
      return { passed: true, matchedCount: 1, diagnostics: [] };
    }
    return evaluateWhereExcept(
      element,
      rule.where,
      rule.except,
      { minLogicMatches: rule.safety?.minLogicMatches }
    );
  }

  // src/core/smart-cosmetic/scoper.ts
  var SEMANTIC_TAGS = /* @__PURE__ */ new Set(["article", "section", "li", "main", "aside", "nav"]);
  var SEMANTIC_ROLES = /* @__PURE__ */ new Set(["article", "listitem", "complementary", "main", "feed"]);
  var MEANINGFUL_DATA_KEYS = ["data-testid", "data-test", "data-uid", "data-component", "data-block", "data-card", "data-module"];
  var BOUNDARY_WEIGHTS = {
    semanticTagOrRole: 0.2,
    candidateSelectorMatch: 0.15,
    repeatedSibling: 0.25,
    selfContainedText: 0.1,
    geometryCompactness: 0.15,
    linkButtonCoherence: 0.05,
    stableAttributes: 0.1
  };
  var MODE_THRESHOLDS = {
    "nearest-card": { minScore: 0.55, extra: null },
    "repeated-card": { minScore: 0.65, extra: (_s) => _s.repeatedSibling >= 0.6 },
    "semantic-block": { minScore: 0.5, extra: (_s) => _s.semanticTagOrRole > 0 },
    "visual-block": { minScore: 0.6, extra: (_s) => _s.geometryCompactness >= 0.5 }
  };
  var boundaryCache = /* @__PURE__ */ new Map();
  var domGeneration = 0;
  function markDomGeneration() {
    domGeneration++;
    if (domGeneration > 1e3) {
      boundaryCache = /* @__PURE__ */ new Map();
      domGeneration = 0;
    }
  }
  function resolveBoundary(el, boundary, candidates) {
    if (!boundary || boundary.mode === "exact") return { element: el };
    if (!boundary.allowBroad) {
      const tag = el.tagName.toLowerCase();
      if (tag === "html" || tag === "body") return { element: el };
    }
    const cached = boundaryCache.get(el);
    if (cached && document.contains(el)) return cached;
    let ancestors = enumerateAncestors(el, boundary);
    if (ancestors.length === 0) return { element: el };
    if (boundary.includeSelf && boundary.mode === "selector") {
      ancestors = [el, ...ancestors];
    }
    const mode = boundary.mode;
    const threshold = MODE_THRESHOLDS[mode];
    const scored = ancestors.map((anc) => ({
      element: anc,
      depth: getDepth(el, anc),
      ...scoreBoundaryCandidate(anc, mode, candidates)
    }));
    scored.sort((a, b) => {
      if (Math.abs(b.score - a.score) > 0.03) return b.score - a.score;
      if (a.depth !== b.depth) return a.depth - b.depth;
      if (b.featureScores.semanticTagOrRole !== a.featureScores.semanticTagOrRole) {
        return b.featureScores.semanticTagOrRole - a.featureScores.semanticTagOrRole;
      }
      return compareDocumentPosition(a.element, b.element);
    });
    const best = threshold && scored[0]?.score >= threshold.minScore ? !threshold.extra || threshold.extra(scored[0].featureScores) ? scored[0].element : fallbackBoundary(scored, threshold) : el;
    const fallbackUsed = best !== (scored[0]?.element || el);
    const selectedDepth = ancestors.findIndex((a) => a === best) + 1 || 0;
    const maxDepth = boundary.maxDepth ?? 8;
    const stoppedEarly = ancestors.length >= maxDepth;
    const result = {
      element: best,
      diagnostic: {
        mode: boundary.mode,
        ancestorCount: ancestors.length,
        bestScore: scored[0]?.score ?? 0,
        features: scored[0]?.featureScores ?? {
          semanticTagOrRole: 0,
          candidateSelectorMatch: 0,
          repeatedSibling: 0,
          selfContainedText: 0,
          geometryCompactness: 0,
          linkButtonCoherence: 0,
          stableAttributes: 0
        },
        stoppedEarly,
        selectedDepth,
        fallbackUsed,
        allowBroad: boundary?.allowBroad ?? false
      }
    };
    boundaryCache.set(el, result);
    return result;
  }
  function fallbackBoundary(scored, threshold) {
    for (const s of scored) {
      if (s.score >= threshold.minScore && (!threshold.extra || threshold.extra(s.featureScores))) {
        return s.element;
      }
    }
    return scored[0]?.element;
  }
  function compareDocumentPosition(a, b) {
    const pos = a.compareDocumentPosition(b);
    return pos & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
  }
  function isScopeRootSentinel(el) {
    const tag = el.tagName.toLowerCase();
    if (tag === "body" || tag === "main") return true;
    const role = el.getAttribute("role");
    if (role === "main" || role === "feed") return true;
    if (tag === "ul" || tag === "ol") {
      const items = el.querySelectorAll(":scope > li");
      if (items.length >= 15) return true;
    }
    if (el.matches?.('[data-feed], [data-list], [role="list"]')) return true;
    if (el.classList.contains("feed") || el.id === "feed" || el.id.match?.(/feed|stream|timeline/i)) return true;
    return false;
  }
  function enumerateAncestors(el, boundary) {
    const ancestors = [];
    const maxDepth = boundary.maxDepth ?? 8;
    let current = el.parentElement;
    let depth = 0;
    while (current && depth < maxDepth) {
      const tag = current.tagName.toLowerCase();
      if (tag === "html" || tag === "body") {
        if (boundary.stopAtScope !== false && !boundary.allowPageRoot) break;
      }
      if (boundary.stopAtScope !== false && current.hasAttribute?.("data-ubr-scope-boundary")) break;
      if (!boundary.allowScopeRoot && isScopeRootSentinel(current)) break;
      if (boundary.allowCrossScope && current.hasAttribute?.("data-ubr-scope-cross")) {
        ancestors.push(current);
        current = current.parentElement;
        depth++;
        continue;
      }
      if (boundary.stopAtScope !== false) {
        ancestors.push(current);
        current = current.parentElement;
        depth++;
      } else {
        ancestors.push(current);
        current = current.parentElement;
        depth++;
      }
    }
    if (boundary.mode === "ancestor-depth" && boundary.depth !== void 0) {
      const target = ancestors[boundary.depth - 1];
      return target ? [target] : ancestors;
    }
    if (boundary.mode === "selector" && boundary.selector) {
      const matched = ancestors.find((a) => a.matches?.(boundary.selector));
      return matched ? [matched] : ancestors;
    }
    return ancestors;
  }
  function getDepth(from, to) {
    let depth = 0;
    let current = from;
    while (current && current !== to) {
      current = current.parentElement;
      depth++;
    }
    return depth;
  }
  function scoreBoundaryCandidate(el, mode, candidates) {
    const featureScores = {
      semanticTagOrRole: scoreSemanticTagOrRole(el),
      candidateSelectorMatch: candidates ? scoreCandidateSelectorMatch(el, candidates) : 0,
      repeatedSibling: scoreRepeatedSibling(el),
      selfContainedText: scoreSelfContainedText(el),
      geometryCompactness: scoreGeometryCompactness(el),
      linkButtonCoherence: scoreLinkButtonCoherence(el),
      stableAttributes: scoreStableAttributes(el)
    };
    let weightedSum = 0;
    let applicableWeight = 0;
    for (const [key, weight] of Object.entries(BOUNDARY_WEIGHTS)) {
      const score2 = featureScores[key];
      if (score2 >= 0) {
        weightedSum += weight * score2;
        applicableWeight += weight;
      }
    }
    const score = applicableWeight > 0 ? weightedSum / applicableWeight : 0;
    return { score, featureScores };
  }
  function scoreSemanticTagOrRole(el) {
    const tag = el.tagName.toLowerCase();
    const role = el.getAttribute("role");
    if (SEMANTIC_TAGS.has(tag) || role && SEMANTIC_ROLES.has(role)) return 1;
    if (tag === "div" || tag.startsWith("u")) {
      const meaningfulData = MEANINGFUL_DATA_KEYS.some((k) => el.hasAttribute(k));
      if (meaningfulData) {
        const label = el.getAttribute("aria-label") || el.getAttribute("aria-labelledby");
        if (label) return 0.75;
      }
    }
    if (tag === "div" || tag.startsWith("u")) {
      const hasData = Array.from(el.attributes).some((a) => a.name.startsWith("data-") && isMeaningfulDataValue(a.value));
      if (hasData) return 0.5;
    }
    return 0;
  }
  function scoreCandidateSelectorMatch(el, candidates) {
    for (const sel of candidates) {
      try {
        if (el.matches?.(sel)) return 1;
      } catch (e) {
        console.warn("[uBR] scoper: el.matches failed for candidate selector", sel, e);
      }
    }
    return 0;
  }
  function scoreRepeatedSibling(el) {
    const parent = el.parentElement;
    if (!parent) return 0;
    const siblings = Array.from(parent.children).filter((c) => c !== el);
    if (siblings.length < 2) return 0;
    let maxSimilarity = 0;
    for (const sibling of siblings) {
      const sim = computeSiblingSimilarity(el, sibling);
      if (sim > maxSimilarity) maxSimilarity = sim;
    }
    return Math.min(maxSimilarity, 1);
  }
  var MAJOR_TAGS = /* @__PURE__ */ new Set(["a", "button", "img", "video", "picture", "h1", "h2", "h3", "h4", "h5", "h6", "p", "span", "div", "ul", "ol", "li"]);
  function computeSiblingSimilarity(a, b) {
    const sigA = getSiblingSignature(a);
    const sigB = getSiblingSignature(b);
    let matches = 0;
    let total = 0;
    for (const [key, valA] of Object.entries(sigA)) {
      total++;
      const valB = sigB[key];
      if (valB !== void 0 && valA === valB) matches++;
    }
    return total > 0 ? matches / total : 0;
  }
  function getSiblingSignature(el) {
    const tag = el.tagName.toLowerCase();
    const role = el.getAttribute("role") || "";
    const meaningfulDataAttrs = Array.from(el.attributes).filter((a) => a.name.startsWith("data-") && isMeaningfulDataValue(a.value)).sort((a, b) => a.name.localeCompare(b.name)).map((a) => `${a.name}=${a.value.slice(0, 20)}`).join("|");
    const tagHistogram = {};
    for (const child of el.children) {
      const t = child.tagName.toLowerCase();
      if (MAJOR_TAGS.has(t)) {
        tagHistogram[t] = (tagHistogram[t] || 0) + 1;
      }
    }
    const childTagKeys = Array.from(new Set(Object.keys(tagHistogram))).sort();
    const childTagProfile = childTagKeys.map((k) => `${k}:${bucketCount(tagHistogram[k], [0, 1, 2, 4, 8, Infinity])}`).join("|");
    const text = (el.textContent || "").trim();
    const textLen = text.length;
    const links = el.querySelectorAll("a").length;
    const buttons = el.querySelectorAll("button").length;
    const images = el.querySelectorAll("img, picture").length;
    return {
      tag: tag.charCodeAt(0),
      role: role.length,
      dataAttrs: meaningfulDataAttrs.length,
      textLen: bucketCount(textLen, [0, 1, 39, 159, 399, 899, 1999, Infinity]),
      childTags: childTagProfile.length,
      links: bucketCount(links, [0, 1, 2, 4, 8, 16, Infinity]),
      buttons: bucketCount(buttons, [0, 1, 2, 4, 8, Infinity]),
      images: bucketCount(images, [0, 1, 2, 4, 8, Infinity])
    };
  }
  function bucketCount(value, buckets) {
    for (let i = 0; i < buckets.length; i++) {
      if (value <= buckets[i]) return i;
    }
    return buckets.length - 1;
  }
  function isMeaningfulDataValue(value) {
    if (value.length < 2 || value.length > 80) return false;
    if (isGeneratedClass(value)) return false;
    if (/(\w{20,})/.test(value)) return false;
    return true;
  }
  function isGeneratedClass(value) {
    if (value.length < 6) return false;
    let digitCount = 0;
    for (const ch of value) {
      if (ch >= "0" && ch <= "9") digitCount++;
    }
    return digitCount / value.length > 0.4;
  }
  var scopeRootCache = /* @__PURE__ */ new WeakMap();
  function findScopeRoot(el) {
    const cached = scopeRootCache.get(el);
    if (cached !== void 0) return cached;
    let root = null;
    let current = el;
    while (current) {
      if (current.hasAttribute?.("data-ubr-scope-boundary")) {
        root = current;
        break;
      }
      current = current.parentElement;
    }
    scopeRootCache.set(el, root);
    return root;
  }
  function scoreSelfContainedText(el) {
    const chars = normalizeTextLength(el);
    const scopeRoot = findScopeRoot(el);
    const scopeChars = scopeRoot ? normalizeTextLength(scopeRoot) : 0;
    if (scopeChars === 0) return 0;
    const ratio = chars / scopeChars;
    if (chars >= 40 && chars <= 1200 && ratio <= 0.35) return 1;
    if (chars >= 10 && chars < 40 || chars > 1200 && chars <= 2500) return 0.5;
    return 0;
  }
  function normalizeTextLength(el) {
    const clone = el.cloneNode(true);
    const scripts = clone.querySelectorAll("script, style, template");
    for (const s of scripts) s.remove();
    const text = (clone.textContent || "").replace(/\s+/g, " ").trim();
    return text.length;
  }
  function scoreGeometryCompactness(el) {
    let rect;
    try {
      rect = el.getBoundingClientRect();
    } catch (e) {
      console.warn("[uBR] scoper: getBoundingClientRect failed", e);
      return 0;
    }
    if (rect.width === 0 || rect.height === 0) return 0;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return 0;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const viewportArea = viewportW * viewportH;
    if (viewportArea === 0) return 0;
    const area = rect.width * rect.height;
    const areaRatio = area / viewportArea;
    const aspect = rect.width / Math.max(rect.height, 1);
    if (areaRatio >= 1e-3 && areaRatio <= 0.4 && aspect >= 0.2 && aspect <= 8) return 1;
    if (areaRatio <= 0.6) return 0.5;
    return 0;
  }
  function scoreLinkButtonCoherence(el) {
    const links = el.querySelectorAll("a").length;
    const buttons = el.querySelectorAll("button").length;
    const interactive = links + buttons;
    if (interactive >= 1 && interactive <= 8) return 1;
    if (interactive >= 9 && interactive <= 20) return 0.5;
    return 0;
  }
  function scoreStableAttributes(el) {
    const id = el.id;
    if (id && id.length > 0 && !/^[a-f0-9]{8,}$/i.test(id)) return 1;
    const hasStableData = Array.from(el.attributes).some(
      (a) => a.name.startsWith("data-") && isMeaningfulDataValue(a.value)
    );
    if (hasStableData) return 1;
    const hasAria = Array.from(el.attributes).some((a) => a.name.startsWith("aria-"));
    if (hasAria) return 1;
    const role = el.getAttribute("role");
    const tag = el.tagName.toLowerCase();
    if (role || SEMANTIC_TAGS.has(tag)) return 0.5;
    return 0;
  }

  // src/core/smart-cosmetic/applier.ts
  var MARK_COLORS = ["red", "orange", "blue"];
  var CosmeticApplier = class {
    constructor() {
      __publicField(this, "styleEl", null);
      __publicField(this, "hiddenElements", /* @__PURE__ */ new Map());
      __publicField(this, "removedElements", /* @__PURE__ */ new Map());
      __publicField(this, "ruleSelectors", /* @__PURE__ */ new Map());
      __publicField(this, "mutationObserver", null);
      __publicField(this, "pendingSelectors", []);
      __publicField(this, "appliedSelectors", []);
      __publicField(this, "applyTimer", null);
      __publicField(this, "active", false);
      __publicField(this, "ariaHiddenTracker", /* @__PURE__ */ new Map());
    }
    activate(selectors) {
      this.active = true;
      this.pendingSelectors = [...selectors];
      this.ensureStyleElement();
      this.injectStyles(selectors, true);
      this.observeMutations();
      this.pendingSelectors = [];
    }
    deactivate() {
      this.active = false;
      this.clearStyles();
      this.stopObserver();
    }
    updateSelectors(selectors) {
      const combined = [.../* @__PURE__ */ new Set([...selectors, ...this.pendingSelectors])];
      this.clearStyles();
      if (selectors.length > 0) {
        this.ensureStyleElement();
        this.injectStyles(combined, true);
      }
      this.pendingSelectors = [];
    }
    ensureStyleElement() {
      if (this.styleEl) return;
      this.styleEl = document.createElement("style");
      this.styleEl.id = "ubr-smart-cosmetic";
      this.styleEl.setAttribute("data-ubr", "smart-cosmetic");
      document.head?.appendChild(this.styleEl);
    }
    injectStyles(selectors, important = true) {
      if (!this.styleEl) return;
      this.appliedSelectors = [...selectors];
      const imp = important ? " !important" : "";
      const css = selectors.map((s) => `${s} { display: none${imp}; }`).join("\n");
      this.styleEl.textContent = css;
    }
    getAppliedSelectors() {
      return [...this.appliedSelectors];
    }
    setImportant(enabled) {
      if (this.appliedSelectors.length > 0) {
        this.injectStyles(this.appliedSelectors, enabled);
      }
    }
    clearStyles() {
      if (this.styleEl) {
        this.styleEl.textContent = "";
      }
    }
    removeStyleElement() {
      if (this.styleEl && this.styleEl.parentNode) {
        this.styleEl.parentNode.removeChild(this.styleEl);
      }
      this.styleEl = null;
    }
    observeMutations() {
      if (this.mutationObserver) return;
      this.mutationObserver = new MutationObserver((mutations) => {
        let needsReapply = false;
        for (const mutation of mutations) {
          if (mutation.addedNodes.length > 0) {
            needsReapply = true;
            break;
          }
        }
        if (needsReapply && this.active && this.pendingSelectors.length > 0) {
          this.debouncedReapply();
        }
      });
      this.mutationObserver.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
      });
    }
    stopObserver() {
      if (this.mutationObserver) {
        this.mutationObserver.disconnect();
        this.mutationObserver = null;
      }
    }
    debouncedReapply() {
      if (this.applyTimer) clearTimeout(this.applyTimer);
      this.applyTimer = setTimeout(() => {
        if (this.active && this.pendingSelectors.length > 0) {
          this.injectStyles(this.pendingSelectors, true);
        }
      }, 200);
    }
    executeActions(actions) {
      for (const action of actions) {
        this.executeAction(action);
        if (action.ruleId) {
          const selectors = this.ruleSelectors.get(action.ruleId) ?? /* @__PURE__ */ new Set();
          selectors.add(action.selector);
          this.ruleSelectors.set(action.ruleId, selectors);
        }
      }
    }
    executeAction(action) {
      try {
        const elements = document.querySelectorAll(action.selector);
        const priority = action.important !== false ? "important" : void 0;
        switch (action.type) {
          case "hide":
            for (const el of elements) {
              el.style.setProperty("display", "none", priority);
              this.setAriaHidden(el, action.ruleId);
              if (!this.hiddenElements.has(action.selector)) {
                this.hiddenElements.set(action.selector, []);
              }
              this.hiddenElements.get(action.selector).push(el);
            }
            break;
          case "collapse":
            for (const el of elements) {
              el.style.setProperty("display", "none", priority);
              el.style.setProperty("height", "0", priority);
              el.style.setProperty("overflow", "hidden", priority);
              this.setAriaHidden(el, action.ruleId);
              if (!this.hiddenElements.has(action.selector)) {
                this.hiddenElements.set(action.selector, []);
              }
              this.hiddenElements.get(action.selector).push(el);
            }
            break;
          case "remove":
            for (const el of elements) {
              this.setAriaHidden(el, action.ruleId);
              el.remove();
              if (!this.removedElements.has(action.selector)) {
                this.removedElements.set(action.selector, []);
              }
              this.removedElements.get(action.selector).push(el);
            }
            break;
          case "unhide":
            this.restoreHidden(action.selector);
            break;
          case "style":
            for (const el of elements) {
              if (action.style) {
                applySafeStyle(el, action.style, priority);
              }
            }
            break;
          case "mark":
            for (const el of elements) {
              el.setAttribute("data-ubr-marked", "true");
              const existing = parseInt(el.getAttribute("data-ubr-mark-count") || "0", 10);
              const count = existing + 1;
              el.setAttribute("data-ubr-mark-count", String(count));
              const color = MARK_COLORS[Math.min(count - 1, MARK_COLORS.length - 1)];
              const existingOutline = el.style.outline;
              const mergeOutline = action.ruleId ? this.ruleSelectors.get(action.ruleId)?.has(action.selector) : false;
              if (existingOutline && existingOutline !== "none" && mergeOutline) {
                el.style.setProperty("outline", `${existingOutline} double ${color}`, priority);
              } else {
                el.style.setProperty("outline", `3px solid ${color}`, priority);
              }
            }
            break;
        }
      } catch (e) {
        console.warn("[uBR] applier: executeAction style set failed", e);
      }
    }
    applyAction(action) {
      this.executeAction(action);
    }
    setAriaHidden(el, ruleId) {
      const existing = this.ariaHiddenTracker.get(el);
      if (existing) {
        existing.count++;
        return;
      }
      const originalValue = el.getAttribute("aria-hidden");
      this.ariaHiddenTracker.set(el, { originalValue, count: 1 });
      el.setAttribute("aria-hidden", "true");
      el.setAttribute("data-ubr-aria-hidden", ruleId ?? "");
    }
    restoreAriaHidden(el) {
      const tracked = this.ariaHiddenTracker.get(el);
      if (!tracked) return;
      tracked.count--;
      if (tracked.count > 0) return;
      this.ariaHiddenTracker.delete(el);
      el.removeAttribute("data-ubr-aria-hidden");
      if (tracked.originalValue === null) {
        el.removeAttribute("aria-hidden");
      } else {
        el.setAttribute("aria-hidden", tracked.originalValue);
      }
    }
    restoreHidden(selector) {
      const elements = this.hiddenElements.get(selector);
      if (elements) {
        for (const el of elements) {
          el.style.removeProperty("display");
          el.style.removeProperty("height");
          el.style.removeProperty("overflow");
          this.restoreAriaHidden(el);
        }
        this.hiddenElements.delete(selector);
      }
      const removed = this.removedElements.get(selector);
      if (removed) {
        this.removedElements.delete(selector);
      }
      const css = this.styleEl?.textContent || "";
      const regex = new RegExp(`${escapeRegex2(selector)}\\s*\\{[^}]+\\}`, "g");
      if (this.styleEl) {
        this.styleEl.textContent = css.replace(regex, "");
      }
    }
    destroy() {
      this.deactivate();
      this.removedElements.clear();
      this.hiddenElements.clear();
      this.ariaHiddenTracker.clear();
      this.pendingSelectors = [];
      if (this.applyTimer) clearTimeout(this.applyTimer);
    }
    cleanupRule(ruleId) {
      const selectors = this.ruleSelectors.get(ruleId);
      if (selectors) {
        for (const sel of selectors) {
          this.restoreHidden(sel);
        }
        this.ruleSelectors.delete(ruleId);
      }
    }
  };
  function applySafeStyle(el, styleStr, important = true) {
    const decls = styleStr.split(";").filter(Boolean);
    for (const decl of decls) {
      const colonIdx = decl.indexOf(":");
      if (colonIdx === -1) continue;
      const prop = decl.slice(0, colonIdx).trim().toLowerCase();
      const value = decl.slice(colonIdx + 1).trim();
      if (!SAFE_STYLE_PROPERTIES.has(prop)) continue;
      if (prop === "display" && !ALLOWED_DISPLAY_VALUES.has(value)) continue;
      if (prop === "visibility" && !ALLOWED_VISIBILITY_VALUES.has(value)) continue;
      if (prop === "filter" && (value.includes("%") || value.includes("url(") || value.includes("var("))) continue;
      el.style.setProperty(prop, value, important ? "important" : void 0);
    }
  }
  function escapeRegex2(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // src/core/smart-cosmetic/matcher.ts
  var TEXT_LENGTH_BUCKETS = [0, 1, 39, 159, 399, 899, 1999, Infinity];
  var LINK_BUCKETS = [0, 1, 2, 4, 8, 16, Infinity];
  var BUTTON_BUCKETS = [0, 1, 2, 4, 8, Infinity];
  var IMAGE_BUCKETS = [0, 1, 2, 4, 8, Infinity];
  var WIDTH_RATIO_BUCKETS = [0, 0.15, 0.35, 0.65, 0.95, Infinity];
  var HEIGHT_RATIO_BUCKETS = [0, 0.1, 0.25, 0.5, 0.9, Infinity];
  var AREA_RATIO_BUCKETS = [0, 1e-3, 0.01, 0.05, 0.15, 0.4, 0.6, Infinity];
  var ASPECT_BUCKETS = [0, 0.2, 0.5, 1.5, 3, 8, Infinity];
  function computeSimilarity(candidate, reference, profile = "default-card") {
    const weights = DEFAULT_WEIGHT_PROFILES[profile];
    const features = computeFeatureScores(candidate, reference);
    let availableWeight = 0;
    let weightedSum = 0;
    for (const [key, weight] of Object.entries(weights)) {
      const score2 = features[key];
      const avail = score2 >= 0 ? 1 : 0;
      availableWeight += weight * avail;
      weightedSum += weight * avail * score2;
    }
    const score = availableWeight > 0 ? weightedSum / availableWeight : 0;
    return {
      score,
      availableWeight,
      totalWeight: Object.values(weights).reduce((a, b) => a + b, 0),
      features
    };
  }
  function computeFeatureScores(a, b) {
    return {
      roleTag: computeRoleTagScore(a, b),
      textTokens: computeTextTokensScore(a, b),
      semanticText: computeSemanticTextScore(a, b),
      href: computeHrefScore(a, b),
      dataAttrs: computeDataAttrsScore(a, b),
      aria: computeAriaScore(a, b),
      structure: computeStructureScore(a, b),
      visualBox: computeVisualBoxScore(a, b),
      classes: computeClassesScore(a, b),
      nthChild: computeNthChildScore(a, b)
    };
  }
  function jaccard(a, b) {
    if (a.length === 0 && b.length === 0) return 1;
    const setA = new Set(a);
    const setB = new Set(b);
    let intersection = 0;
    for (const x of setA) if (setB.has(x)) intersection++;
    const union = (/* @__PURE__ */ new Set([...setA, ...setB])).size;
    return union > 0 ? intersection / union : 0;
  }
  function computeRoleTagScore(a, b) {
    if (a.tagName === b.tagName && a.role === b.role) return 1;
    if (a.role !== null && b.role !== null) {
      const compatible = isRoleCompatible(a.role, b.role);
      if (compatible) return 0.75;
    }
    if (a.tagName === b.tagName) return 0.5;
    return 0;
  }
  var COMPATIBLE_ROLES = {
    article: ["article", "complementary", "main"],
    listitem: ["listitem", "option", "menuitem"],
    complementary: ["complementary", "article"]
  };
  function isRoleCompatible(aRole, bRole) {
    if (aRole === bRole) return true;
    const aCompat = COMPATIBLE_ROLES[aRole];
    return aCompat ? aCompat.includes(bRole) : false;
  }
  function computeTextTokensScore(a, b) {
    const raw = jaccard(a.textTokens, b.textTokens);
    if (a.textTokens.length < 4 && b.textTokens.length < 4) return raw * 0.75;
    return raw;
  }
  function computeSemanticTextScore(a, b) {
    return jaccard(a.semanticTextTokens, b.semanticTextTokens);
  }
  function computeHrefScore(a, b) {
    const aHosts = new Set(a.descendantLinks.map((l) => l.host));
    const bHosts = new Set(b.descendantLinks.map((l) => l.host));
    const aPaths = new Set(a.descendantLinks.flatMap((l) => l.pathTokens));
    const bPaths = new Set(b.descendantLinks.flatMap((l) => l.pathTokens));
    const aKeys = new Set(a.descendantLinks.flatMap((l) => l.queryKeys));
    const bKeys = new Set(b.descendantLinks.flatMap((l) => l.queryKeys));
    const pathScore = jaccard([...aPaths], [...bPaths]) * 0.5;
    const hostScore = jaccard([...aHosts], [...bHosts]) * 0.3;
    const queryScore = jaccard([...aKeys], [...bKeys]) * 0.2;
    return pathScore + hostScore + queryScore;
  }
  function computeDataAttrsScore(a, b) {
    const aDataKeys = Object.keys(a.attributes).filter((k) => k.startsWith("data-") && isMeaningfulDataAttr(a.attributes[k]));
    const bDataKeys = Object.keys(b.attributes).filter((k) => k.startsWith("data-") && isMeaningfulDataAttr(b.attributes[k]));
    const nameOverlap = jaccard(aDataKeys, bDataKeys) * 0.5;
    const aTokens = aDataKeys.flatMap((k) => tokenizeAttrValue(a.attributes[k]));
    const bTokens = bDataKeys.flatMap((k) => tokenizeAttrValue(b.attributes[k]));
    const valueOverlap = jaccard(aTokens, bTokens) * 0.5;
    return nameOverlap + valueOverlap;
  }
  function isMeaningfulDataAttr(value) {
    if (value.length < 2 || value.length > 80) return false;
    if (/^[a-f0-9]{8,}$/i.test(value)) return false;
    if (/(\w{20,})/.test(value)) return false;
    return true;
  }
  function tokenizeAttrValue(value) {
    return value.split(/[-\s_:/.]+/).filter((t) => t.length > 0);
  }
  function computeAriaScore(a, b) {
    const aTokens = a.ariaValues.flatMap((v) => v.split(/\s+/).filter(Boolean));
    const bTokens = b.ariaValues.flatMap((v) => v.split(/\s+/).filter(Boolean));
    return jaccard(aTokens, bTokens);
  }
  function computeStructureScore(a, b) {
    const fields = [
      { a: a.childTagHistogramDepth1, b: b.childTagHistogramDepth1 },
      { a: a.childTagHistogramDepth2, b: b.childTagHistogramDepth2 }
    ];
    let totalSim = 0;
    let fieldCount = 0;
    for (const f of fields) {
      totalSim += histogramSimilarity(f.a, f.b);
      fieldCount++;
    }
    totalSim += bucketedSimilarity(a.linkCount, b.linkCount, LINK_BUCKETS);
    fieldCount++;
    totalSim += bucketedSimilarity(a.buttonCount, b.buttonCount, BUTTON_BUCKETS);
    fieldCount++;
    totalSim += bucketedSimilarity(a.imageCount, b.imageCount, IMAGE_BUCKETS);
    fieldCount++;
    totalSim += bucketedSimilarity(a.textLengthBucket, b.textLengthBucket, TEXT_LENGTH_BUCKETS.map((_, i) => i));
    fieldCount++;
    return fieldCount > 0 ? totalSim / fieldCount : 0;
  }
  function histogramSimilarity(a, b) {
    if (Object.keys(a).length === 0 && Object.keys(b).length === 0) return 1;
    const allKeys = /* @__PURE__ */ new Set([...Object.keys(a), ...Object.keys(b)]);
    let intersection = 0;
    for (const k of allKeys) {
      const va = a[k] || 0;
      const vb = b[k] || 0;
      if (va > 0 && vb > 0) intersection += Math.min(va, vb);
    }
    const union = Math.max(
      Object.values(a).reduce((s, v) => s + v, 0),
      Object.values(b).reduce((s, v) => s + v, 0),
      1
    );
    return union > 0 ? intersection / union : 0;
  }
  function bucketedSimilarity(a, b, buckets) {
    const idxA = bucketIndex(a, buckets);
    const idxB = bucketIndex(b, buckets);
    return idxA === idxB ? 1 : Math.abs(idxA - idxB) <= 1 ? 0.5 : 0;
  }
  function bucketIndex(value, buckets) {
    for (let i = 0; i < buckets.length; i++) {
      if (value <= buckets[i]) return i;
    }
    return buckets.length - 1;
  }
  function computeVisualBoxScore(a, b) {
    const comparisons = [
      compareBuckets(a.widthBucket, b.widthBucket),
      compareBuckets(a.heightBucket, b.heightBucket),
      compareBuckets(a.areaBucket, b.areaBucket),
      compareBuckets(a.aspectRatioBucket, b.aspectRatioBucket),
      a.hRegion === b.hRegion ? 1 : 0,
      a.vOrder === b.vOrder ? 1 : 0
    ];
    return comparisons.reduce((s, v) => s + v, 0) / comparisons.length;
  }
  function compareBuckets(a, b) {
    if (a === b) return 1;
    if (Math.abs(a - b) === 1) return 0.5;
    return 0;
  }
  function computeClassesScore(a, b) {
    const aStable = a.classList.filter((_, i) => !a.classIsGenerated[i]);
    const bStable = b.classList.filter((_, i) => !b.classIsGenerated[i]);
    return jaccard(aStable, bStable);
  }
  function computeNthChildScore(a, b) {
    const aBucket = coarsePositionBucket(a.nthChild);
    const bBucket = coarsePositionBucket(b.nthChild);
    return aBucket === bBucket ? 1 : 0;
  }
  function coarsePositionBucket(nth) {
    if (nth <= 1) return 0;
    if (nth <= 3) return 1;
    if (nth <= 6) return 2;
    return 3;
  }
  function isGeneratedToken(value) {
    if (value.length < 6) return false;
    let digitCount = 0;
    for (const ch of value) {
      if (ch >= "0" && ch <= "9") digitCount++;
    }
    return digitCount / value.length > 0.4;
  }
  function minFeaturesAvailable(result, min = 3) {
    const featureKeys = ["roleTag", "textTokens", "semanticText", "href", "dataAttrs", "aria", "structure", "visualBox", "classes", "nthChild"];
    let available = 0;
    for (const key of featureKeys) {
      if (result.features[key] >= 0) available++;
    }
    return available >= min;
  }
  function extractFeatureVector(element) {
    const tagName = element.tagName.toLowerCase();
    const role = element.getAttribute("role");
    const id = element.id || null;
    const classList = Array.from(element.classList);
    const classIsGenerated = classList.map((c) => isGeneratedToken(c) || /_\d+$/.test(c));
    const attributes = {};
    if (element.hasAttributes()) {
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        attributes[attr.name] = attr.value;
      }
    }
    const parent = element.parentElement;
    let nthChild = 1;
    if (parent) {
      const siblings = parent.children;
      for (let i = 0; i < siblings.length; i++) {
        if (siblings[i] === element) {
          nthChild = i + 1;
          break;
        }
      }
    }
    let depth = 0;
    let el = element;
    while (el = el.parentElement) depth++;
    const childCount = element.children.length;
    const textTokens = tokenizeText(element.textContent ?? "");
    const ownText = tokenizeText(
      Array.from(element.childNodes).filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent || "").join(" ")
    );
    const semanticTextTokens = extractSemanticTokens(element);
    const descendantLinks = extractLinks(element);
    const ariaValues = extractAriaValues(element);
    const childTags = element.children;
    const childTagHistogramDepth1 = {};
    const childTagHistogramDepth2 = {};
    for (let i = 0; i < childTags.length; i++) {
      const t = childTags[i].tagName.toLowerCase();
      childTagHistogramDepth1[t] = (childTagHistogramDepth1[t] || 0) + 1;
      for (let j = 0; j < childTags[i].children.length; j++) {
        const t2 = childTags[i].children[j].tagName.toLowerCase();
        childTagHistogramDepth2[t2] = (childTagHistogramDepth2[t2] || 0) + 1;
      }
    }
    const linkCount = element.querySelectorAll("a[href]").length;
    const buttonCount = element.querySelectorAll('button, [role="button"]').length;
    const imageCount = element.querySelectorAll('img, svg, [role="img"]').length;
    const text = (element.textContent ?? "").trim();
    const textLengthBucket = bucketIndex(text.length, TEXT_LENGTH_BUCKETS);
    const linkTextLen = Array.from(element.querySelectorAll("a[href]")).reduce((s, a) => s + (a.textContent ?? "").trim().length, 0);
    const linkDensityBucket = bucketIndex(text.length > 0 ? linkTextLen / text.length : 0, [0, 0.01, 0.05, 0.15, 0.4, 0.7, Infinity]);
    const rect = element.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const wRatio = vw > 0 ? rect.width / vw : 0;
    const hRatio = vh > 0 ? rect.height / vh : 0;
    const area = wRatio * hRatio;
    const widthBucket = bucketIndex(wRatio, WIDTH_RATIO_BUCKETS);
    const heightBucket = bucketIndex(hRatio, HEIGHT_RATIO_BUCKETS);
    const areaBucket = bucketIndex(area, AREA_RATIO_BUCKETS);
    const aspectRatioBucket = bucketIndex(rect.height > 0 ? rect.width / rect.height : 0, ASPECT_BUCKETS);
    const rectCenter = rect.left + rect.width / 2;
    const hRegion = rect.width >= vw * 0.95 ? "full" : rectCenter < vw * 0.33 ? "left" : rectCenter > vw * 0.66 ? "right" : "center";
    const vOrder = rect.top <= vh * 0.25 ? "first" : rect.top <= vh * 0.5 ? "q2" : rect.top <= vh * 0.75 ? "q3" : "q4";
    return {
      tagName,
      role,
      id,
      classList,
      classIsGenerated,
      attributes,
      nthChild,
      depth,
      childCount,
      textTokens,
      ownText,
      semanticTextTokens,
      descendantLinks,
      ariaValues,
      childTagHistogramDepth1,
      childTagHistogramDepth2,
      linkCount,
      buttonCount,
      imageCount,
      textLengthBucket,
      linkDensityBucket,
      widthBucket,
      heightBucket,
      areaBucket,
      aspectRatioBucket,
      hRegion,
      vOrder
    };
  }
  function tokenizeText(text) {
    return text.replace(/<[^>]+>/g, " ").replace(/[\s\n\r]+/g, " ").trim().toLowerCase().split(/[\s,.;:!?()\[\]{}"'\/\\|_@#$%^&*+=<>~`\-]+/).filter((t) => t.length > 0 && t.length < 100);
  }
  function extractSemanticTokens(element) {
    const clone = element.cloneNode(true);
    for (const el of clone.querySelectorAll('script, style, template, svg, [aria-hidden="true"]')) {
      el.remove();
    }
    return tokenizeText(clone.textContent ?? "");
  }
  function extractLinks(element) {
    const links = [];
    const seen = /* @__PURE__ */ new Set();
    for (const a of element.querySelectorAll("a[href]")) {
      try {
        const url = new URL(a.href);
        const key = url.hostname + url.pathname;
        if (seen.has(key)) continue;
        seen.add(key);
        links.push({
          host: url.hostname,
          pathTokens: url.pathname.split("/").filter(Boolean),
          queryKeys: [...url.searchParams.keys()]
        });
      } catch (e) {
        console.warn("[uBR] matcher: extractLinks URL parse failed", e);
      }
    }
    return links;
  }
  function extractAriaValues(element) {
    const values = [];
    for (const attr of ["aria-label", "aria-describedby", "aria-roledescription", "aria-valuetext"]) {
      const val = element.getAttribute(attr);
      if (val) values.push(val);
    }
    for (const child of element.querySelectorAll("[aria-label]")) {
      const val = child.getAttribute("aria-label");
      if (val) values.push(val);
    }
    return values;
  }

  // src/core/smart-cosmetic/smart-runtime.ts
  var SELF_MUTATION_MARKER = "data-ubr-applied";
  var SmartRuntime = class {
    constructor() {
      __publicField(this, "plan", null);
      __publicField(this, "applier", null);
      __publicField(this, "tabId", 0);
      __publicField(this, "currentUrl", "");
      __publicField(this, "hostname", "");
      __publicField(this, "initialized", false);
      __publicField(this, "observer", null);
      __publicField(this, "debounceTimer", null);
      __publicField(this, "currentCycle", 0);
      __publicField(this, "spaMode", false);
      __publicField(this, "mutationCycleCount", 0);
      __publicField(this, "dependencyPrefilterCache", /* @__PURE__ */ new WeakMap());
      __publicField(this, "frameAppliedCount", 0);
      __publicField(this, "frameAppliedLimit", 500);
      __publicField(this, "frameAppliedTotal", 0);
      __publicField(this, "aggregateFrameLimit", 1500);
      __publicField(this, "partialCycleCounters", /* @__PURE__ */ new Map());
      __publicField(this, "dependencyFallbackCounters", /* @__PURE__ */ new Map());
      __publicField(this, "ancestorIndex", /* @__PURE__ */ new Map());
      __publicField(this, "ancestorDependencySelectors", /* @__PURE__ */ new Map());
      __publicField(this, "ancestorAttributeNames", /* @__PURE__ */ new Map());
      __publicField(this, "ancestorIndexSize", 0);
      __publicField(this, "MAX_ANCESTOR_LINKS", 5e3);
      __publicField(this, "emitWarning");
      __publicField(this, "skipRuleIds", null);
      __publicField(this, "originalPushState", null);
      __publicField(this, "originalReplaceState", null);
      __publicField(this, "iframeObserver", null);
      __publicField(this, "shadowScanTimer", null);
      __publicField(this, "frameCounters", /* @__PURE__ */ new Map());
      __publicField(this, "perPageCaches", /* @__PURE__ */ new Map());
      __publicField(this, "onPathChange", () => {
        const newUrl = location.href;
        if (newUrl === this.currentUrl) return;
        this.currentUrl = newUrl;
        if (!this.plan) return;
        this.restartShadowScan();
        const hasNeverReEvaluate = this.plan.smartRules.some((s) => s.runtime?.reEvaluateOnPathChange === "never");
        if (hasNeverReEvaluate) {
          this.applier?.updateSelectors([]);
          const neverIds = new Set(this.plan.smartRules.filter((s) => s.runtime?.reEvaluateOnPathChange === "never").map((s) => s.rule.id));
          const reevaluating = this.plan.smartRules.filter((s) => !neverIds.has(s.rule.id));
          if (reevaluating.length === 0) return;
          this.skipRuleIds = neverIds;
          this.clearPerPageCaches();
          this.loadPlan(this.plan);
          this.skipRuleIds = null;
          return;
        }
        this.clearPerPageCaches();
        this.loadPlan(this.plan);
      });
    }
    async init(options) {
      if (this.initialized) return;
      this.tabId = options.tabId;
      this.currentUrl = options.url;
      this.hostname = options.hostname;
      this.initialized = true;
      this.applier = new CosmeticApplier();
      this.applier.activate([]);
      this.spaMode = !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__ || !!document.querySelector("[data-reactroot], [ng-version], #__next, [data-vue-root]");
      this.startIframeObserver();
      this.hookAttachShadow();
      this.startShadowScan();
      this.wrapHistoryAPI();
      window.addEventListener("popstate", this.onPathChange);
      window.addEventListener("hashchange", this.onPathChange);
    }
    async loadPlan(plan) {
      this.plan = plan;
      await this.executePlan();
      this.startMutationObserver();
    }
    async executePlan() {
      if (!this.plan || !this.applier) return;
      const cssSelectors = this.plan.cssSelectors;
      this.applier.updateSelectors(cssSelectors);
      let totalApplied = 0;
      const globalCap = 300;
      for (const smart of this.plan.smartRules) {
        if (this.skipRuleIds && smart.rule.id && this.skipRuleIds.has(smart.rule.id)) continue;
        if (totalApplied >= globalCap) break;
        const maxCandidates = smart.frames?.maxTotalMatches ?? 150;
        await this.evaluateSmartRule(smart, maxCandidates, globalCap - totalApplied);
        totalApplied += this.frameAppliedCount;
      }
    }
    shouldSkipSelfMutation(el) {
      if (el.hasAttribute?.(SELF_MUTATION_MARKER)) return true;
      return false;
    }
    buildAncestorIndex(el, smart) {
      const ruleId = smart.rule.id;
      if (!ruleId) return;
      if (this.ancestorIndex.has(ruleId)) return;
      const ancestors = [];
      let current = el.parentElement;
      const scopeSelector = smart.rule.scope?.[0];
      const depDepth = smart.performance?.dependencyDepth ?? Infinity;
      let depth = 0;
      while (current && depth < depDepth) {
        if (scopeSelector && current.matches?.(scopeSelector) && smart.rule.logicOptions?.stopAtScopeForAncestor !== false) break;
        ancestors.push(current);
        current = current.parentElement;
        depth++;
      }
      if (depth >= depDepth && current) {
        this.clearPerPageCaches();
        this.dependencyPrefilterCache = /* @__PURE__ */ new WeakMap();
        this.emitWarning?.("dependency-depth-fallback-scope-reeval");
        this.trackDependencyFallback(ruleId);
        return;
      }
      this.ancestorIndex.set(ruleId, ancestors);
      this.ancestorIndexSize += ancestors.length;
      const where = smart.rule.where;
      const except = smart.rule.except;
      const attrNames = /* @__PURE__ */ new Set();
      const depSelectors = [];
      if (where) this.collectAncestorDeps(where, attrNames, depSelectors);
      if (except) this.collectAncestorDeps(except, attrNames, depSelectors);
      this.ancestorDependencySelectors.set(ruleId, depSelectors);
      this.ancestorAttributeNames.set(ruleId, attrNames);
      if (this.ancestorIndexSize > this.MAX_ANCESTOR_LINKS) {
        this.ancestorIndex.delete(ruleId);
        this.ancestorIndexSize -= ancestors.length;
        this.emitWarning?.("ancestor-index-too-large-coarse-invalidation");
      }
    }
    collectAncestorDeps(expr, attrNames, depSelectors) {
      if (!expr || typeof expr !== "object") return;
      const e = expr;
      if ("condition" in e && typeof e.condition === "object" && e.condition !== null) {
        const c = e.condition;
        if (c.operator === "has-ancestor" && c.selector) {
          depSelectors.push(c.selector);
          const sel = c.selector;
          const attrMatch = sel.match(/\[(\w+)/);
          if (attrMatch) attrNames.add(attrMatch[1]);
        }
        return;
      }
      const group = e;
      for (const key of ["all", "any", "none"]) {
        const arr = group[key];
        if (arr) for (const child of arr) this.collectAncestorDeps(child, attrNames, depSelectors);
      }
    }
    checkAncestorMutationRelevance(mutation) {
      const target = mutation.target instanceof Element ? mutation.target : null;
      if (!target) return false;
      for (const [ruleId, ancestors] of this.ancestorIndex) {
        if (ancestors.includes(target)) {
          const attrNames = this.ancestorAttributeNames.get(ruleId);
          if (mutation.type === "childList") return true;
          if (mutation.type === "attributes" && attrNames && mutation.attributeName && attrNames.has(mutation.attributeName)) return true;
        }
      }
      return false;
    }
    extractPrefilter(sel) {
      const result = { attrs: [], classes: [], unsafe: false };
      if (/:(?:has|has-text|contains|matches-css|upward|xpath|host-context|not|is|where)/.test(sel)) {
        result.unsafe = true;
        return result;
      }
      const tagMatch = sel.match(/^(\w+)/);
      if (tagMatch) result.tag = tagMatch[1];
      const attrMatches = sel.matchAll(/\[(\w+)/g);
      for (const m of attrMatches) result.attrs.push(m[1]);
      const classMatches = sel.matchAll(/\.([\w-]+)/g);
      for (const m of classMatches) result.classes.push(m[1]);
      const idMatch = sel.match(/#([\w-]+)/);
      if (idMatch) result.id = idMatch[1];
      return result;
    }
    hasPrefilterDependencies(_el, smart) {
      const perf = smart.performance;
      if (!perf?.dependencyPrefilter) return true;
      const cached = this.dependencyPrefilterCache.get(_el);
      if (cached !== void 0) return cached;
      const deps = smart.candidates.slice(0, 3);
      for (const sel of deps) {
        const pf = this.extractPrefilter(sel);
        if (pf.unsafe) {
          this.dependencyPrefilterCache.set(_el, true);
          return true;
        }
        try {
          if (pf.tag && _el.tagName.toLowerCase() !== pf.tag) continue;
          if (pf.classes.length > 0 && !pf.classes.some((c) => _el.classList.contains(c))) continue;
          if (pf.id && _el.id !== pf.id) continue;
          if (pf.attrs.length > 0 && !pf.attrs.every((a) => _el.hasAttribute(a))) continue;
          if (_el.matches?.(sel)) {
            this.dependencyPrefilterCache.set(_el, true);
            return true;
          }
          if (_el.querySelector(sel)) {
            this.dependencyPrefilterCache.set(_el, true);
            return true;
          }
        } catch (e) {
          console.warn("[uBR] smart-runtime: dependency prefilter querySelector failed", sel, e);
          continue;
        }
      }
      const result = deps.length === 0;
      this.dependencyPrefilterCache.set(_el, result);
      return result;
    }
    async evaluateSmartRule(smart, perRuleCap = 150, remainingCap = 300) {
      const doc = document;
      if (!doc) return;
      const candidates = this.collectCandidates(smart.candidates);
      const performance2 = smart.performance;
      const maxCandidates = Math.min(performance2.maxCandidates ?? perRuleCap, remainingCap);
      let appliedCount = 0;
      const cap = Math.min(candidates.length, maxCandidates);
      const isPartial = candidates.length > cap;
      const safety = smart.safety;
      const allowPartial = safety?.allowPartialApply === true;
      const ruleId = smart.rule.id;
      if (isPartial) {
        const partialTracker = this.partialCycleCounters.get(ruleId) ?? 0;
        this.partialCycleCounters.set(ruleId, partialTracker + 1);
        const maxPartial = safety?.maxConsecutivePartial ?? 3;
        if (partialTracker >= maxPartial) {
          if (this.applier) this.applier.updateSelectors([]);
          return;
        }
      } else if (this.partialCycleCounters.has(ruleId)) {
        this.partialCycleCounters.delete(ruleId);
      }
      for (let i = 0; i < cap; i++) {
        const el = candidates[i];
        if (!el || !doc.contains(el)) continue;
        if (this.shouldSkipSelfMutation(el)) continue;
        if (!this.hasPrefilterDependencies(el, smart)) continue;
        if (this.frameAppliedCount >= this.frameAppliedLimit) break;
        if (this.frameAppliedTotal >= this.aggregateFrameLimit) break;
        if (smart.rule.scope && Array.isArray(smart.rule.scope)) {
          const scopeSelectors = smart.rule.scope;
          let inScope = false;
          for (const sel of scopeSelectors) {
            try {
              if (el.matches(sel) || el.closest(sel)) {
                inScope = true;
                break;
              }
            } catch (e) {
              console.warn("[uBR] smart-runtime: scope selector match failed", sel, e);
              continue;
            }
          }
          if (!inScope) continue;
        }
        const hostname = this.hostname;
        const _url = this.currentUrl;
        const rules = smart.rule;
        let targetMatch = false;
        if (rules.targets && Array.isArray(rules.targets)) {
          for (const t of rules.targets) {
            if (!t.form || !t.value) continue;
            if (t.form === "host" && t.value === hostname) {
              targetMatch = true;
              break;
            }
            if (t.form === "domain") {
              const parts = hostname.split(".");
              const registered = parts.slice(-2).join(".");
              if (registered === t.value || hostname === t.value) {
                targetMatch = true;
                break;
              }
            }
            if (t.form === "regex") {
              try {
                const re = new RegExp(t.value);
                if (re.test(hostname)) {
                  targetMatch = true;
                  break;
                }
              } catch (e) {
                console.warn("[uBR] smart-runtime: target regex compile failed", t.value, e);
              }
            }
            if (t.form === "entity") {
              if (hostname.endsWith(t.value) || hostname === t.value) {
                targetMatch = true;
                break;
              }
            }
            if (t.value === "*") {
              targetMatch = true;
              break;
            }
          }
        }
        if (!targetMatch) continue;
        const boundaryConfig = smart.boundary;
        const resolvedTarget = resolveBoundary(el, boundaryConfig);
        if (!resolvedTarget) continue;
        if (smart.performance?.dependencyPrefilter) {
          this.buildAncestorIndex(el, smart);
        }
        const frameMode = smart.frames?.mode ?? "top-only";
        const isFrame = window.top !== window.self;
        if (frameMode === "top-only" && isFrame) continue;
        if (frameMode === "same-origin" && isFrame) {
          try {
            if (window.top && window.top.location.origin !== location.origin) continue;
          } catch (e) {
            console.warn("[uBR] smart-runtime: same-origin check failed", e);
            continue;
          }
        }
        if (frameMode === "accessible" && isFrame) {
          try {
            if (window.top) {
              const canAccess = typeof window.top.document === "object";
              if (!canAccess) continue;
            }
          } catch (e) {
            console.warn("[uBR] smart-runtime: accessible check failed", e);
            continue;
          }
        }
        if (smart.frames?.accounting === "per-frame") {
          const frameKey = isFrame ? `frame:${window.location.href}` : "top";
          let fc = this.frameCounters.get(frameKey);
          if (!fc) {
            fc = { numerator: 0, denominator: smart.performance?.maxCandidates ?? 150 };
            this.frameCounters.set(frameKey, fc);
          }
          if (fc.numerator >= fc.denominator) continue;
          fc.numerator++;
        }
        const shadowMode = smart.shadow?.mode ?? "none";
        if (shadowMode !== "none") {
          this.traverseShadow(el, smart);
        }
        const safety2 = smart.safety;
        if (safety2?.preview === "required") {
          const status = this.getPreviewStatus(smart);
          if (status !== "confirmed" && status !== "active") continue;
        }
        const logicResult = evaluateRuleLogic(resolvedTarget.element, smart.rule);
        if (!logicResult.passed) continue;
        const match = smart.match;
        if (match && match.mode !== "none") {
          if (!this.checkSimilarity(resolvedTarget.element, match, smart.candidates)) continue;
        }
        if (this.applier) {
          if (isPartial && !allowPartial) continue;
          const selector = this.buildSelector(resolvedTarget.element);
          resolvedTarget.element.setAttribute(SELF_MUTATION_MARKER, "");
          this.applier.updateSelectors([...this.applier.getAppliedSelectors(), selector]);
          appliedCount++;
          this.frameAppliedCount++;
          this.frameAppliedTotal++;
        }
        if (appliedCount >= maxCandidates) break;
      }
    }
    getPreviewStatus(smart) {
      return smart.preview?.status ?? "none";
    }
    collectCandidates(selectors) {
      const elements = [];
      const seen = /* @__PURE__ */ new Set();
      for (const sel of selectors) {
        try {
          const found = document.querySelectorAll(sel);
          for (const el of found) {
            if (!seen.has(el)) {
              seen.add(el);
              elements.push(el);
            }
          }
        } catch (e) {
          console.warn("[uBR] smart-runtime: collectCandidates querySelectorAll failed", sel, e);
          continue;
        }
      }
      return elements;
    }
    checkSimilarity(element, match, candidates) {
      const refSelector = match.reference;
      const refSelection = match.referenceSelection;
      if (!refSelector || refSelector === "none") {
        if (refSelection === "first" && candidates && candidates.length > 0) {
          try {
            const firstEl = document.querySelector(candidates[0]);
            if (firstEl) return this.computeSimilarity(element, firstEl, match);
          } catch (e) {
            console.warn("[uBR] smart-runtime: checkSimilarity querySelector failed", e);
          }
        }
        return refSelection === "error" ? false : true;
      }
      const refEl = refSelector === "picked" ? null : document.querySelector(refSelector);
      if (!refEl) {
        if (refSelection === "error") return false;
        return true;
      }
      return this.computeSimilarity(element, refEl, match);
    }
    computeSimilarity(element, reference, match) {
      try {
        const candidateFV = extractFeatureVector(element);
        const referenceFV = extractFeatureVector(reference);
        const profile = match.weights ?? "default-card";
        const result = computeSimilarity(candidateFV, referenceFV, profile);
        const threshold = match.threshold ?? 0.74;
        const minFeat = 3;
        if (!minFeaturesAvailable(result, minFeat)) return false;
        return result.score >= threshold;
      } catch (e) {
        console.warn("[uBR] smart-runtime: computeSimilarity failed", e);
        return true;
      }
    }
    buildSelector(element) {
      if (element.id) return `#${CSS.escape(element.id)}`;
      const tag = element.tagName.toLowerCase();
      const classes = Array.from(element.classList).filter((c) => !isGeneratedToken(c) && !/_\d+$/.test(c)).map((c) => CSS.escape(c));
      if (classes.length > 0) return `${tag}.${classes.join(".")}`;
      return tag;
    }
    traverseShadow(root, smart) {
      if (!root.shadowRoot) {
        const maybeHost = root.querySelectorAll(":host-context(*), *");
        for (const el of maybeHost) {
          if (el.shadowRoot) {
            this.evaluateInShadow(el.shadowRoot, smart);
          }
        }
        return;
      }
      this.evaluateInShadow(root.shadowRoot, smart);
    }
    evaluateInShadow(shadowRoot, smart) {
      const candidates = shadowRoot.querySelectorAll(smart.candidates.join(","));
      for (const el of Array.from(candidates)) {
        if (this.shouldSkipSelfMutation(el)) continue;
        const logicResult = evaluateRuleLogic(el, smart.rule);
        if (logicResult.passed && this.applier) {
          const selector = this.buildSelector(el);
          el.setAttribute(SELF_MUTATION_MARKER, "");
          this.applier.updateSelectors([...this.applier.getAppliedSelectors(), selector]);
        }
      }
    }
    startMutationObserver() {
      if (this.observer) this.observer.disconnect();
      const observedAttrs = this.collectObservedAttributes();
      this.observer = new MutationObserver((mutations) => {
        this.mutationCycleCount++;
        if (this.mutationCycleCount > 100) {
          this.observer?.disconnect();
          return;
        }
        const hasRelevantChange = mutations.some(
          (m) => m.type === "childList" || m.type === "attributes" && observedAttrs.length > 0 && observedAttrs.some((a) => m.attributeName === a || a === "auto")
        );
        if (!hasRelevantChange) return;
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
          this.handleMutations(mutations);
        }, 100);
      });
      const observeConfig = {
        childList: true,
        subtree: true,
        attributes: observedAttrs.length > 0
      };
      if (observedAttrs.length > 0) {
        observeConfig.attributeFilter = observedAttrs.includes("auto") ? void 0 : observedAttrs;
      }
      this.observer.observe(document.documentElement, observeConfig);
    }
    collectObservedAttributes() {
      if (!this.plan) return [];
      const attrs = /* @__PURE__ */ new Set();
      for (const smart of this.plan.smartRules) {
        const runtime = smart.runtime;
        if (!runtime?.observeAttributes) continue;
        if (runtime.observeAttributes === "auto") {
          attrs.add("auto");
        } else if (runtime.observeAttributes === true) {
          attrs.add("all");
        }
      }
      return Array.from(attrs);
    }
    scheduleReEvaluation(_ruleId) {
      void _ruleId;
      this.clearPerPageCaches();
      this.dependencyPrefilterCache = /* @__PURE__ */ new WeakMap();
      this.executePlan();
    }
    handleMutations(mutations) {
      if (!this.plan) return;
      if (this.mutationCycleCount > 100) return;
      this.currentCycle++;
      markDomGeneration();
      const hasAncestorMutation = mutations.some((m) => this.checkAncestorMutationRelevance(m));
      if (hasAncestorMutation) {
        for (const [ruleId] of this.ancestorIndex) {
          this.scheduleReEvaluation(ruleId);
        }
      }
      for (const m of mutations) {
        for (const node of m.removedNodes) {
          if (node instanceof HTMLIFrameElement) {
            this.onFrameRemoved(node);
          }
        }
      }
      const nodeCount = mutations.reduce((sum, m) => sum + m.addedNodes.length, 0);
      const maxNodes = 150;
      if (nodeCount > maxNodes) {
        const priorityOrder = ["data-ubr-scope-boundary", "data-ubr-scope", "", "iframe", "shadow-host", ""];
        const relevant = mutations.filter((m) => {
          for (const node of m.addedNodes) {
            if (node instanceof Element) {
              const pri = priorityOrder.findIndex((p) => p && node.closest?.(`[${p}]`));
              if (pri >= 0 && pri < priorityOrder.length - 2) return true;
            }
          }
          return false;
        });
        if (relevant.length === 0) return;
      }
      this.executePlan();
    }
    wrapHistoryAPI() {
      try {
        this.originalPushState = history.pushState.bind(history);
        this.originalReplaceState = history.replaceState.bind(history);
        history.pushState = (...args) => {
          const result = this.originalPushState.apply(history, args);
          this.onPathChange();
          return result;
        };
        history.replaceState = function(...args) {
          const result = self.originalReplaceState.apply(history, args);
          self.onPathChange();
          return result;
        };
      } catch (e) {
        console.warn("[uBR] smart-runtime: History API wrapping failed", e);
      }
    }
    startIframeObserver() {
      if (this.iframeObserver) return;
      this.iframeObserver = new MutationObserver((mutations) => {
        for (const m of mutations) {
          for (const node of m.addedNodes) {
            if (node instanceof HTMLIFrameElement) {
              this.onFrameAdded(node);
            }
          }
        }
      });
      this.iframeObserver.observe(document.documentElement, { childList: true, subtree: true });
    }
    onFrameAdded(_iframe) {
      void _iframe;
      if (!this.plan || !this.applier) return;
      const hasFrameRules = this.plan.smartRules.some((s) => s.frames?.mode !== "top-only");
      if (!hasFrameRules) return;
      this.restartShadowScan();
      this.executePlan();
    }
    onFrameRemoved(iframe) {
      const frameKey = iframe.src || iframe.id || "";
      const counter = this.frameCounters.get(frameKey);
      if (counter) {
        this.frameCounters.delete(frameKey);
      }
    }
    hookAttachShadow() {
      if (typeof Element === "undefined" || !Element.prototype) return;
      const originalAttachShadow = Element.prototype.attachShadow;
      if (originalAttachShadow.__ubrHooked) return;
      const self2 = this;
      Element.prototype.attachShadow = function(init) {
        const shadowRoot = originalAttachShadow.call(this, init);
        if (self2.initialized && self2.plan) {
          for (const sr of self2.plan.smartRules) {
            if (sr.shadow?.mode !== "none") self2.traverseShadow(this, sr);
          }
        }
        return shadowRoot;
      };
      Element.prototype.attachShadow.__ubrHooked = true;
    }
    startShadowScan() {
      if (this.shadowScanTimer) return;
      let emptyScans = 0;
      this.shadowScanTimer = setInterval(() => {
        if (!this.plan || !this.applier) return;
        let found = false;
        const shadowHosts = document.querySelectorAll("*");
        for (const el of shadowHosts) {
          if (el.shadowRoot && !el.hasAttribute("data-ubr-shadow-scanned")) {
            el.setAttribute("data-ubr-shadow-scanned", "");
            found = true;
            for (const sr of this.plan.smartRules) {
              if (sr.shadow?.mode !== "none") this.traverseShadow(el, sr);
            }
          }
        }
        if (!found) {
          emptyScans++;
          if (emptyScans >= 3) {
            clearInterval(this.shadowScanTimer);
            this.shadowScanTimer = null;
          }
        } else {
          emptyScans = 0;
        }
      }, 2e3);
    }
    restartShadowScan() {
      if (this.shadowScanTimer) {
        clearInterval(this.shadowScanTimer);
        this.shadowScanTimer = null;
      }
      this.startShadowScan();
    }
    clearPerPageCaches() {
      this.perPageCaches.clear();
      this.dependencyPrefilterCache = /* @__PURE__ */ new WeakMap();
      this.perPageCaches.clear();
      this.dependencyPrefilterCache = /* @__PURE__ */ new WeakMap();
      this.ancestorIndex.clear();
      this.ancestorDependencySelectors.clear();
      this.ancestorAttributeNames.clear();
      this.ancestorIndexSize = 0;
    }
    trackDependencyFallback(ruleId) {
      const now = Date.now();
      const existing = this.dependencyFallbackCounters.get(ruleId);
      if (!existing) {
        this.dependencyFallbackCounters.set(ruleId, { count: 1, firstTime: now });
      } else {
        existing.count++;
        if (existing.count > 3 && now - existing.firstTime < 1e4) {
          this.emitWarning?.(`rule ${ruleId}: dependency-depth fallback triggered >3x in 10s; consider increasing dependency-depth or narrowing scope/candidates`);
        }
      }
    }
    destroy() {
      if (this.observer) this.observer.disconnect();
      if (this.iframeObserver) this.iframeObserver.disconnect();
      if (this.shadowScanTimer) clearInterval(this.shadowScanTimer);
      if (this.applier) this.applier.destroy();
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      window.removeEventListener("popstate", this.onPathChange);
      window.removeEventListener("hashchange", this.onPathChange);
      if (this.originalPushState) {
        history.pushState = this.originalPushState;
      }
      if (this.originalReplaceState) {
        history.replaceState = this.originalReplaceState;
      }
      document.querySelectorAll(`[${SELF_MUTATION_MARKER}]`).forEach((el) => el.removeAttribute(SELF_MUTATION_MARKER));
      this.initialized = false;
    }
  };

  // src/js/smart-content.ts
  var smartRuntime = new SmartRuntime();
  var initialized = false;
  async function getMyTabId() {
    if (typeof vAPI !== "object" || vAPI === null) {
      return 0;
    }
    try {
      const result = await vAPI.messaging.send("dashboard", { what: "getSmartTabId" });
      return result?.tabId ?? 0;
    } catch (e) {
      console.warn("[uBR] smart-content: getMyTabId failed", e);
      return 0;
    }
  }
  async function bootstrap() {
    if (initialized) return;
    if (typeof vAPI !== "object" || vAPI === null) {
      return;
    }
    const policy = typeof self !== "undefined" ? self.__uborPagePolicy : null;
    const cs = policy && typeof policy.contentScript === "object" ? policy.contentScript : {};
    const smartCosmeticAllowed = cs.loadSmartRuntime === true;
    if (!smartCosmeticAllowed) {
      console.log("[uBR] smart-content: disabled by policy (loadSmartRuntime=false)");
      return;
    }
    initialized = true;
    const url = location.href;
    const hostname = location.hostname;
    const tabId = await getMyTabId();
    await smartRuntime.init({ tabId, url, hostname });
    self.__ubrSmartRuntimeActive = true;
    const planDecision = { status: "skipped", reason: "no-plan" };
    try {
      const result = await vAPI.messaging.send("dashboard", {
        what: "getCosmeticPlanForDocument",
        url
      });
      if (result && result.plan) {
        const plan = result.plan;
        const planHost = plan.hostname || "";
        const isWildcard = planHost === "*" || planHost === "";
        const ruleCount = (plan.rules || []).length;
        if (isWildcard && hostname !== "" && !hostname.includes("google") && !hostname.includes("youtube")) {
          planDecision.status = "rejected";
          planDecision.reason = "wildcard-host";
          planDecision.wildcard = true;
          console.warn("[uBR] smart-content: rejecting wildcard plan for non-google host", hostname);
          return;
        }
        await smartRuntime.loadPlan(result.plan);
        planDecision.status = "accepted";
        planDecision.reason = "loaded";
        planDecision.ruleCount = ruleCount;
      } else {
        planDecision.status = "skipped";
        planDecision.reason = "no-plan-object";
      }
    } catch (e) {
      planDecision.status = "error";
      planDecision.reason = String(e);
      console.warn("[uBR] smart-content: bootstrap plan fetch failed", e);
    }
    try {
      await vAPI.messaging.send("dashboard", {
        what: "reportSmartCosmeticDecision",
        url,
        hostname,
        decision: planDecision
      }).catch(() => {
      });
    } catch (_) {
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }
})();
