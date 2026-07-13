// GENERATED FILE. Do not edit directly.
// Source: src/js/smart-rules.ts
// Build command: npm run build
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // src/js/dom.ts
  var normalizeTarget = (target) => {
    if (typeof target === "string") {
      return Array.from(qsa$(target));
    }
    if (target instanceof Element) {
      return [target];
    }
    if (target === null) {
      return [];
    }
    if (Array.isArray(target)) {
      return target;
    }
    return Array.from(target);
  };
  var makeEventHandler = (selector, callback) => {
    return function(event) {
      const dispatcher = event.currentTarget;
      if (dispatcher instanceof HTMLElement === false || typeof dispatcher.querySelectorAll !== "function") {
        return;
      }
      const receiver = event.target;
      const ancestor = receiver?.closest(selector);
      if (ancestor === receiver && ancestor !== dispatcher && dispatcher.contains(ancestor)) {
        callback.call(receiver, event);
      }
    };
  };
  var dom = class {
    static attr(target, attr, value) {
      for (const elem of normalizeTarget(target)) {
        if (value === void 0) {
          return elem.getAttribute(attr);
        }
        if (value === null) {
          elem.removeAttribute(attr);
        } else {
          elem.setAttribute(attr, value);
        }
      }
      return void 0;
    }
    static clear(target) {
      for (const elem of normalizeTarget(target)) {
        while (elem.firstChild !== null) {
          elem.removeChild(elem.firstChild);
        }
      }
    }
    static clone(target) {
      const elements = normalizeTarget(target);
      if (elements.length === 0) {
        return null;
      }
      return elements[0].cloneNode(true);
    }
    static create(a) {
      if (typeof a === "string") {
        return document.createElement(a);
      }
      return void 0;
    }
    static prop(target, prop, value) {
      for (const elem of normalizeTarget(target)) {
        if (value === void 0) {
          return elem[prop];
        }
        elem[prop] = value;
      }
      return void 0;
    }
    static text(target, text) {
      const targets = normalizeTarget(target);
      if (text === void 0) {
        return targets.length !== 0 ? targets[0].textContent ?? void 0 : void 0;
      }
      for (const elem of targets) {
        elem.textContent = text;
      }
      return void 0;
    }
    static remove(target) {
      for (const elem of normalizeTarget(target)) {
        elem.remove();
      }
    }
    static empty(target) {
      for (const elem of normalizeTarget(target)) {
        while (elem.firstElementChild !== null) {
          elem.firstElementChild.remove();
        }
      }
    }
    // target, type, callback, [options]
    // target, type, subtarget, callback, [options]
    static on(target, type, subtarget, callback, options) {
      let actualCallback;
      let actualOptions;
      if (typeof subtarget === "function") {
        actualOptions = options;
        actualCallback = subtarget;
        subtarget = "";
        if (typeof actualOptions === "boolean") {
          actualOptions = { capture: true };
        }
      } else {
        actualCallback = makeEventHandler(subtarget, callback);
        if (actualOptions === void 0 || typeof actualOptions === "boolean") {
          actualOptions = { capture: true };
        } else {
          actualOptions.capture = true;
        }
      }
      const targets = target instanceof Window || target instanceof Document ? [target] : normalizeTarget(target);
      for (const elem of targets) {
        elem.addEventListener(type, actualCallback, actualOptions);
      }
    }
    static off(target, type, callback, options) {
      if (typeof callback !== "function") {
        return;
      }
      let actualOptions;
      if (typeof options === "boolean") {
        actualOptions = { capture: true };
      } else {
        actualOptions = options;
      }
      const targets = target instanceof Window || target instanceof Document ? [target] : normalizeTarget(target);
      for (const elem of targets) {
        elem.removeEventListener(type, callback, actualOptions);
      }
    }
    static onFirstShown(fn, elem) {
      let observer = new IntersectionObserver((entries) => {
        if (entries.every((a) => a.isIntersecting === false)) {
          return;
        }
        try {
          fn();
        } catch (e) {
          console.warn("[uBR] dom: onFirstShown callback failed", e);
        }
        observer?.disconnect();
        observer = void 0;
      });
      observer.observe(elem);
    }
  };
  __publicField(dom, "cl", null);
  __publicField(dom, "root", null);
  __publicField(dom, "html", null);
  __publicField(dom, "head", null);
  __publicField(dom, "body", null);
  dom.cl = class DomCl {
    static add(target, name) {
      for (const elem of normalizeTarget(target)) {
        elem.classList.add(name);
      }
    }
    static remove(target, ...names) {
      for (const elem of normalizeTarget(target)) {
        elem.classList.remove(...names);
      }
    }
    static toggle(target, name, state) {
      let r;
      for (const elem of normalizeTarget(target)) {
        r = elem.classList.toggle(name, state);
      }
      return r;
    }
    static has(target, name) {
      for (const elem of normalizeTarget(target)) {
        if (elem.classList.contains(name)) {
          return true;
        }
      }
      return false;
    }
  };
  function qs$(a, b) {
    if (typeof a === "string") {
      return document.querySelector(a);
    }
    if (a === null) {
      return null;
    }
    return a.querySelector(b ?? "");
  }
  function qsa$(a, b) {
    if (typeof a === "string") {
      return document.querySelectorAll(a);
    }
    if (a === null) {
      return [];
    }
    return a.querySelectorAll(b ?? "");
  }
  dom.root = qs$(":root");
  dom.html = document.documentElement;
  dom.head = document.head;
  dom.body = document.body;

  // src/js/smart-rules.ts
  var currentRules = [];
  var currentCollections = [];
  var editingRuleId = null;
  async function loadRules() {
    const response = await vAPI.messaging.send("dashboard", { what: "getSmartRules" });
    currentRules = response.rules || [];
    currentCollections = response.collections || [];
    renderRules();
    renderCollections();
    updateStats();
  }
  function renderRules(filter) {
    const list = qs$("#ruleList");
    const empty = qs$("#noRules");
    let items = currentRules;
    if (filter) {
      const lower = filter.toLowerCase();
      items = items.filter(
        (r) => r.selector?.toLowerCase().includes(lower) || r.targets.some((t) => t.value.includes(lower)) || r.type.includes(lower)
      );
    }
    if (items.length === 0) {
      list.innerHTML = "";
      dom.show(empty);
      return;
    }
    dom.hide(empty);
    list.innerHTML = items.map((r) => `
    <div class="rule-item state-${r.state}">
      <div class="rule-info">
        <div class="rule-type">${r.type}</div>
        <div class="rule-target">${r.targets.map((t) => `${t.form}:${t.value}`).join(", ")}</div>
        <div class="rule-selector">${r.selector || r.collectionId || ""}</div>
      </div>
      <div class="rule-actions">
        <button class="toggle-rule iconified" data-id="${r.id}" data-state="${r.state}" type="button">
          <span class="fa-icon">${r.state === "enabled" ? "toggle-on" : "toggle-off"}</span>
        </button>
        <button class="edit-rule iconified" data-id="${r.id}" type="button">
          <span class="fa-icon">pencil</span>
        </button>
        <button class="delete-rule iconified" data-id="${r.id}" type="button">
          <span class="fa-icon">trash</span>
        </button>
      </div>
    </div>
  `).join("");
  }
  function renderCollections() {
    const list = qs$("#collectionList");
    if (currentCollections.length === 0) {
      list.innerHTML = '<div class="empty-state" data-i18n="smartRulesNoCollections"></div>';
      return;
    }
    list.innerHTML = currentCollections.map((c) => `
    <div class="collection-item">
      <div class="col-header">
        <span class="col-name">${c.metadata?.listId || c.id}</span>
        <span class="col-status">${c.updateError ? "Error" : c.lastUpdateSuccess ? "Synced" : "Pending"}</span>
      </div>
      ${c.sourceUrl ? `<div class="col-source">${c.sourceUrl}</div>` : ""}
      ${c.updateError ? `<div class="col-error">${c.updateError}</div>` : ""}
      ${c.lastUpdateCheck ? `<div class="col-status">Last check: ${new Date(c.lastUpdateCheck).toLocaleString()}</div>` : ""}
    </div>
  `).join("");
  }
  function updateStats() {
    const enabled = currentRules.filter((r) => r.state === "enabled").length;
    const total = currentRules.length;
    qs$("#ruleStats").textContent = `${enabled}/${total} enabled, ${currentCollections.length} collections`;
  }
  async function toggleRule(id, currentState) {
    const newState = currentState === "enabled" ? "disabled" : "enabled";
    await vAPI.messaging.send("dashboard", { what: "setSmartRuleState", id, state: newState });
    await loadRules();
  }
  async function deleteRule(id) {
    await vAPI.messaging.send("dashboard", { what: "removeSmartRule", id });
    await loadRules();
  }
  function openEditor(rule) {
    editingRuleId = rule?.id || null;
    qs$("#editorTitle").textContent = rule ? "Edit Rule" : "Add Rule";
    qs$("#editorType").value = rule?.type || "hide-exact";
    qs$("#editorTargets").value = rule?.targets.map((t) => `${t.form}:${t.value}`).join(", ") || "";
    qs$("#editorSelector").value = rule?.selector || "";
    qs$("#editorState").value = rule?.state || "enabled";
    dom.show(qs$("#ruleEditor"));
  }
  function closeEditor() {
    dom.hide(qs$("#ruleEditor"));
    editingRuleId = null;
  }
  async function saveRule() {
    const type = qs$("#editorType").value;
    const targetsStr = qs$("#editorTargets").value;
    const selector = qs$("#editorSelector").value;
    const state = qs$("#editorState").value;
    const targets = targetsStr.split(",").map((s) => {
      const parts = s.trim().split(":");
      return parts.length === 2 ? { form: parts[0].trim(), value: parts[1].trim() } : { form: "host", value: s.trim() };
    }).filter((t) => t.value);
    if (targets.length === 0) return;
    const ruleData = {
      type,
      targets,
      selector: selector || void 0,
      state,
      syntaxVersion: 1,
      action: { action: type === "smart-allow" ? "unhide" : "hide" }
    };
    if (editingRuleId) {
      ruleData.id = editingRuleId;
      await vAPI.messaging.send("dashboard", { what: "updateSmartRule", rule: ruleData });
    } else {
      await vAPI.messaging.send("dashboard", { what: "addSmartRule", rule: ruleData });
    }
    closeEditor();
    await loadRules();
  }
  function initTabs() {
    const tabs = qsa$(".tab");
    for (const tab of tabs) {
      dom.on(tab, "click", () => {
        qsa$(".tab").forEach((t) => dom.cl.remove(t, "active"));
        dom.cl.add(tab, "active");
        qsa$(".pane").forEach((p) => dom.cl.remove(p, "active"));
        const paneId = `pane-${dom.attr(tab, "data-pane")}`;
        dom.cl.add(qs$(`#${paneId}`), "active");
      });
    }
  }
  function initSearch() {
    const input = qs$("#ruleSearch");
    if (!input) return;
    dom.on(input, "input", () => renderRules(input.value));
  }
  function initTester() {
    const btn = qs$("#testerBtn");
    const urlInput = qs$("#testerUrl");
    const results = qs$("#testerResults");
    dom.on(btn, "click", async () => {
      const url = urlInput.value;
      if (!url) return;
      const response = await vAPI.messaging.send("dashboard", {
        what: "testSmartRules",
        url
      });
      results.innerHTML = (response.selectors || []).map(
        (s) => `<div class="tester-result-item">${s}</div>`
      ).join("") || '<div data-i18n="smartRulesNoResults"></div>';
    });
  }
  function initImportExport() {
    const importBtn = qs$("#importBtn");
    const importYaml = qs$("#importYaml");
    const importStatus = qs$("#importStatus");
    dom.on(importBtn, "click", async () => {
      const yaml = importYaml.value.trim();
      if (!yaml) {
        importStatus.textContent = "Please paste YAML rules first.";
        importStatus.className = "import-status error";
        return;
      }
      importStatus.textContent = "Importing...";
      importStatus.className = "import-status";
      importBtn.setAttribute("disabled", "true");
      const response = await vAPI.messaging.send("dashboard", {
        what: "importSmartRules",
        yaml
      });
      importBtn.removeAttribute("disabled");
      if (response.ok) {
        importStatus.textContent = `Imported ${response.count} rule(s) successfully.`;
        importStatus.className = "import-status success";
        importYaml.value = "";
        await loadRules();
      } else {
        const errors = response.errors || ["Import failed"];
        importStatus.textContent = `Error: ${errors.join("; ")}`;
        importStatus.className = "import-status error";
      }
    });
    const exportYamlBtn = qs$("#exportYamlBtn");
    const exportClassicBtn = qs$("#exportClassicBtn");
    const exportOutput = qs$("#exportOutput");
    const exportStats = qs$("#exportStats");
    const copyBtn = qs$("#copyExportBtn");
    const copyStatus = qs$("#copyStatus");
    dom.on(exportYamlBtn, "click", async () => {
      const result = await vAPI.messaging.send("dashboard", { what: "exportSmartRules" });
      if (result.yaml) {
        exportOutput.value = result.yaml;
        exportStats.innerHTML = `Total: ${result.totalRules} rules | Lossless: ${result.losslessCount} | Partial: ${result.partialCount} | Approximate: ${result.approximateCount} | Not possible: ${result.notPossibleCount}`;
        copyStatus.textContent = "";
      } else {
        exportOutput.value = "No rules to export.";
      }
    });
    dom.on(exportClassicBtn, "click", async () => {
      const result = await vAPI.messaging.send("dashboard", { what: "exportSmartRulesToClassic" });
      if (result.classicLines && result.classicLines.length > 0) {
        exportOutput.value = result.classicLines.join("\n");
        const lossCount = result.lossMetadata.filter((l) => l.code !== "lossless").length;
        exportStats.innerHTML = `${result.classicLines.length} lines exported | ${lossCount} rule(s) with data loss`;
        copyStatus.textContent = "";
      } else {
        exportOutput.value = "No classic-compatible rules to export.";
        exportStats.innerHTML = "";
      }
    });
    dom.on(copyBtn, "click", async () => {
      const text = exportOutput.value;
      if (!text) {
        copyStatus.textContent = "Nothing to copy.";
        copyStatus.className = "copy-status error";
        return;
      }
      try {
        await navigator.clipboard.writeText(text);
        copyStatus.textContent = "Copied!";
        copyStatus.className = "copy-status success";
      } catch (e) {
        console.warn("[uBR] smart-rules: clipboard write failed", e);
        exportOutput.select();
        document.execCommand("copy");
        copyStatus.textContent = "Copied!";
        copyStatus.className = "copy-status success";
      }
    });
  }
  async function init() {
    initTabs();
    initSearch();
    initTester();
    initImportExport();
    dom.on(qs$("#addRuleBtn"), "click", () => openEditor());
    dom.on(qs$("#addCollectionBtn"), "click", async () => {
      const url = prompt("Collection URL:");
      if (!url) return;
      await vAPI.messaging.send("dashboard", { what: "subscribeSmartCollection", url });
      await loadRules();
    });
    dom.on(qs$("#refreshBtn"), "click", loadRules);
    dom.on(qs$("#editorSave"), "click", saveRule);
    dom.on(qs$("#editorCancel"), "click", closeEditor);
    dom.on(qs$("#editorClose"), "click", closeEditor);
    dom.on(document, "click", (e) => {
      const target = e.target;
      const btn = target.closest("[data-id]");
      if (!btn) return;
      if (dom.cl.has(btn, "toggle-rule")) {
        toggleRule(btn.dataset.id, btn.dataset.state);
      } else if (dom.cl.has(btn, "edit-rule")) {
        const rule = currentRules.find((r) => r.id === btn.dataset.id);
        if (rule) openEditor(rule);
      } else if (dom.cl.has(btn, "delete-rule")) {
        deleteRule(btn.dataset.id);
      }
    });
    await loadRules();
  }
  init();
})();
