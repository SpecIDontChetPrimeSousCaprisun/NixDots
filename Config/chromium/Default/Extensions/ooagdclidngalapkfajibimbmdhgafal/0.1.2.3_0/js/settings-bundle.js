// GENERATED FILE. Do not edit directly.
// Source: src/js/settings.ts
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

  // src/js/theme.ts
  function getActualTheme(nominalTheme) {
    let theme = nominalTheme || "light";
    if (nominalTheme === "auto") {
      if (typeof self.matchMedia === "function") {
        const mql = self.matchMedia("(prefers-color-scheme: dark)");
        theme = mql instanceof Object && mql.matches === true ? "dark" : "light";
      } else {
        theme = "light";
      }
    }
    return theme;
  }
  function setTheme(theme, propagate = false) {
    theme = getActualTheme(theme);
    let w = self;
    for (; ; ) {
      const rootcl = w.document.documentElement.classList;
      if (theme === "dark") {
        rootcl.add("dark");
        rootcl.remove("light");
      } else {
        rootcl.add("light");
        rootcl.remove("dark");
      }
      if (propagate === false) {
        break;
      }
      if (w === w.parent) {
        break;
      }
      w = w.parent;
      try {
        void w.document;
      } catch (e) {
        console.warn("[uBR] theme: setTheme cross-origin access failed", e);
        return;
      }
    }
  }
  function setAccentColor(accentEnabled, accentColor, propagate, stylesheet = "") {
    if (accentEnabled && stylesheet === "" && self.hsluv !== void 0) {
      const toRGB = (hsl2) => self.hsluv.hsluvToRgb(hsl2).map((a) => Math.round(a * 255)).join(" ");
      const hsl = self.hsluv.hexToHsluv(accentColor);
      hsl[0] = Math.round(hsl[0] * 10) / 10;
      hsl[1] = Math.round(Math.min(100, Math.max(0, hsl[1])));
      const shades = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95];
      const text = [];
      text.push(":root.accented {");
      for (const shade of shades) {
        hsl[2] = shade;
        text.push(`   --primary-${shade}: ${toRGB(hsl)};`);
      }
      text.push("}");
      hsl[1] = Math.min(25, hsl[1]);
      hsl[2] = 80;
      text.push(
        ":root.light.accented {",
        `    --button-surface-rgb: ${toRGB(hsl)};`,
        "}"
      );
      hsl[2] = 30;
      text.push(
        ":root.dark.accented {",
        `    --button-surface-rgb: ${toRGB(hsl)};`,
        "}"
      );
      text.push("");
      stylesheet = text.join("\n");
      vAPI.messaging.send("dom", { what: "uiAccentStylesheet", stylesheet });
    }
    let w = self;
    for (; ; ) {
      const wdoc = w.document;
      let style = wdoc.querySelector("style#accentColors");
      if (style !== null) {
        style.remove();
      }
      if (accentEnabled) {
        style = wdoc.createElement("style");
        style.id = "accentColors";
        style.textContent = stylesheet;
        wdoc.head.append(style);
        wdoc.documentElement.classList.add("accented");
      } else {
        wdoc.documentElement.classList.remove("accented");
      }
      if (propagate === false) {
        break;
      }
      if (w === w.parent) {
        break;
      }
      w = w.parent;
      try {
        void w.document;
      } catch (e) {
        console.warn("[uBR] theme: setAccentColor cross-origin access failed", e);
        break;
      }
    }
  }
  {
    Promise.resolve(vAPI.messaging?.send?.("dom", { what: "uiStyles" })).then((response) => {
      if (typeof response !== "object" || response === null) {
        return;
      }
      const r = response;
      setTheme(r.uiTheme);
      if (r.uiAccentCustom) {
        setAccentColor(
          true,
          r.uiAccentCustom0,
          false,
          r.uiAccentStylesheet
        );
      }
      if (r.uiStyles !== "unset") {
        document.body.style.cssText = r.uiStyles;
      }
    }).catch((e) => {
      console.warn("[uBR] theme: uiStyles failed", e);
    });
    const rootcl = document.documentElement.classList;
    if (vAPI.webextFlavor.soup.has("mobile")) {
      rootcl.add("mobile");
    } else {
      rootcl.add("desktop");
    }
    if (window.matchMedia("(min-resolution: 150dpi)").matches) {
      rootcl.add("hidpi");
    }
  }

  // src/js/i18n.ts
  var i18n = null;
  if (typeof self.browser !== "undefined" && self.browser instanceof Object && !(self.browser instanceof Element)) {
    i18n = self.browser.i18n;
  } else if (typeof self.chrome !== "undefined" && self.chrome.i18n) {
    i18n = self.chrome.i18n;
  }
  if (!i18n) {
    i18n = {
      getMessage: function(key, _args) {
        return key;
      },
      safeTemplateToDOM: function(_id, _dict, parent) {
        if (parent === void 0) {
          return document.createDocumentFragment();
        }
        return parent;
      },
      render: function(_context) {
      },
      renderElapsedTimeToString: function(_tstamp) {
        return "";
      },
      patchUnicodeFlags: function(_text) {
        return document.createDocumentFragment();
      }
    };
  }
  var i18n$ = (...args) => i18n.getMessage(args[0], args.slice(1));
  var isBackgroundProcess = document.title === "uBlock Resurrected Background Page";
  if (isBackgroundProcess !== true) {
    document.body.setAttribute(
      "dir",
      ["ar", "he", "fa", "ps", "ur"].indexOf(i18n$("@@ui_locale")) !== -1 ? "rtl" : "ltr"
    );
    const allowedTags = /* @__PURE__ */ new Set([
      "a",
      "b",
      "code",
      "em",
      "i",
      "span",
      "u"
    ]);
    const expandHtmlEntities = /* @__PURE__ */ (() => {
      const entities = /* @__PURE__ */ new Map([
        ["&shy;", "\xAD"],
        ["&ldquo;", "\u201C"],
        ["&rdquo;", "\u201D"],
        ["&lsquo;", "\u2018"],
        ["&rsquo;", "\u2019"],
        ["&lt;", "<"],
        ["&gt;", ">"]
      ]);
      const decodeEntities = (match) => {
        return entities.get(match) || match;
      };
      return function(text) {
        if (text.indexOf("&") !== -1) {
          text = text.replace(/&[a-z]+;/g, decodeEntities);
        }
        return text;
      };
    })();
    const safeTextToTextNode = function(text) {
      return document.createTextNode(expandHtmlEntities(text));
    };
    const sanitizeElement = function(node) {
      if (allowedTags.has(node.localName) === false) {
        return null;
      }
      node.removeAttribute("style");
      let child = node.firstElementChild;
      while (child !== null) {
        const next = child.nextElementSibling;
        if (sanitizeElement(child) === null) {
          child.remove();
        }
        child = next;
      }
      return node;
    };
    const safeTextToDOM = function(text, parent) {
      if (text === "") {
        return;
      }
      const hasTemplate = text.indexOf("{{") !== -1;
      if (text.indexOf("<") === -1 && !hasTemplate) {
        const toInsert = safeTextToTextNode(text);
        if (parent.childNodes.length !== 0) {
          const toRemove = [];
          let child = parent.firstChild;
          while (child !== null) {
            const next = child.nextSibling;
            if (child.nodeType === 3 && child.nodeValue !== null) {
              toRemove.push(child);
            }
            child = next;
          }
          for (const node2 of toRemove) {
            node2.remove();
          }
        }
        parent.appendChild(toInsert);
        return;
      }
      text = text.replace(/^<p>|<\/p>/g, "").replace(/<p>/g, "\n\n");
      const domParser = new DOMParser();
      const parsedDoc = domParser.parseFromString(text, "text/html");
      if (parent.childNodes.length !== 0) {
        const toRemove = [];
        let child = parent.firstChild;
        while (child !== null) {
          const next = child.nextSibling;
          if (child.nodeType === 3 && child.nodeValue !== null) {
            toRemove.push(child);
          }
          child = next;
        }
        for (const node2 of toRemove) {
          node2.remove();
        }
      }
      let node = parsedDoc.body.firstChild;
      while (node !== null) {
        const next = node.nextSibling;
        switch (node.nodeType) {
          case 1:
            if (sanitizeElement(node) === null) {
              break;
            }
            parent.appendChild(node);
            break;
          case 3:
            parent.appendChild(node);
            break;
          default:
            break;
        }
        node = next;
      }
    };
    i18n.safeTemplateToDOM = function(id, dict, parent) {
      if (parent === void 0) {
        parent = document.createDocumentFragment();
      }
      let textin = i18n$(id);
      if (textin === "") {
        return parent;
      }
      if (textin.indexOf("{{") === -1) {
        safeTextToDOM(textin, parent);
        return parent;
      }
      const re = /\{\{\w+\}\}/g;
      let textout = "";
      for (; ; ) {
        const match = re.exec(textin);
        if (match === null) {
          textout += textin;
          break;
        }
        textout += textin.slice(0, match.index);
        const prop = match[0].slice(2, -2);
        if (Object.hasOwn(dict, prop)) {
          textout += dict[prop].replace(/</g, "&lt;").replace(/>/g, "&gt;");
        } else {
          textout += prop;
        }
        textin = textin.slice(re.lastIndex);
      }
      safeTextToDOM(textout, parent);
      return parent;
    };
    i18n.render = function(context) {
      const docu = document;
      const root = context || docu;
      const elems = root.querySelectorAll("[data-i18n]");
      for (let i = 0; i < elems.length; i++) {
        const elem = elems[i];
        const text = i18n$(elem.getAttribute("data-i18n") || "");
        if (!text) {
          continue;
        }
        if (text.indexOf("{{") === -1) {
          safeTextToDOM(text, elem);
          if (elem.tagName === "TITLE") {
            document.title = text;
          }
          continue;
        }
        const parts = text.split(/(\{\{[^}]+\}\})/);
        const fragment = document.createDocumentFragment();
        let textBefore = "";
        for (let j = 0; j < parts.length; j++) {
          const part = parts[j];
          if (part === "") {
            continue;
          }
          if (part.startsWith("{{") && part.endsWith("}}")) {
            const pos = part.indexOf(":");
            if (pos !== -1) {
              part.slice(0, pos) + part.slice(-2);
            }
            const selector = part.slice(2, -2);
            let node;
            if (selector.charCodeAt(0) !== 46) {
              node = elem.querySelector(`.${selector}`);
            }
            if (node instanceof Element === false) {
              node = elem.querySelector(selector);
            }
            if (node instanceof Element) {
              safeTextToDOM(textBefore, fragment);
              fragment.appendChild(node);
              textBefore = "";
              continue;
            }
          }
          textBefore += part;
        }
        if (textBefore !== "") {
          safeTextToDOM(textBefore, fragment);
        }
        elem.appendChild(fragment);
      }
      const elemsTitle = root.querySelectorAll("[data-i18n-title]");
      for (let i = 0; i < elemsTitle.length; i++) {
        const elem = elemsTitle[i];
        const text = i18n$(elem.getAttribute("data-i18n-title") || "");
        if (!text) {
          continue;
        }
        elem.setAttribute("title", expandHtmlEntities(text));
      }
      const elemsPlaceholder = root.querySelectorAll("[placeholder]");
      for (let i = 0; i < elemsPlaceholder.length; i++) {
        const elem = elemsPlaceholder[i];
        const text = i18n$(elem.getAttribute("placeholder") || "");
        if (text === "") {
          continue;
        }
        elem.setAttribute("placeholder", text);
      }
      const elemsTip = root.querySelectorAll("[data-i18n-tip]");
      for (let i = 0; i < elemsTip.length; i++) {
        const elem = elemsTip[i];
        const text = i18n$(elem.getAttribute("data-i18n-tip") || "").replace(/<br>/g, "\n").replace(/\n{3,}/g, "\n\n");
        elem.setAttribute("data-tip", text);
        if (elem.getAttribute("aria-label") === "data-tip") {
          elem.setAttribute("aria-label", text);
        }
      }
      const elemsLabel = root.querySelectorAll("[data-i18n-label]");
      for (let i = 0; i < elemsLabel.length; i++) {
        const elem = elemsLabel[i];
        const text = i18n$(elem.getAttribute("data-i18n-label") || "");
        elem.setAttribute("label", text);
      }
    };
    i18n.renderElapsedTimeToString = function(tstamp) {
      let value = (Date.now() - tstamp) / 6e4;
      if (value < 2) {
        return i18n$("elapsedOneMinuteAgo");
      }
      if (value < 60) {
        return i18n$("elapsedManyMinutesAgo").replace("{{value}}", Math.floor(value).toLocaleString());
      }
      value /= 60;
      if (value < 2) {
        return i18n$("elapsedOneHourAgo");
      }
      if (value < 24) {
        return i18n$("elapsedManyHoursAgo").replace("{{value}}", Math.floor(value).toLocaleString());
      }
      value /= 24;
      if (value < 2) {
        return i18n$("elapsedOneDayAgo");
      }
      return i18n$("elapsedManyDaysAgo").replace("{{value}}", Math.floor(value).toLocaleString());
    };
    const unicodeFlagToImageSrc = /* @__PURE__ */ new Map([
      ["\u{1F1E6}\u{1F1F1}", "al"],
      ["\u{1F1E6}\u{1F1F7}", "ar"],
      ["\u{1F1E6}\u{1F1F9}", "at"],
      ["\u{1F1E7}\u{1F1E6}", "ba"],
      ["\u{1F1E7}\u{1F1EA}", "be"],
      ["\u{1F1E7}\u{1F1EC}", "bg"],
      ["\u{1F1E7}\u{1F1F7}", "br"],
      ["\u{1F1E8}\u{1F1E6}", "ca"],
      ["\u{1F1E8}\u{1F1ED}", "ch"],
      ["\u{1F1E8}\u{1F1F3}", "cn"],
      ["\u{1F1E8}\u{1F1F4}", "co"],
      ["\u{1F1E8}\u{1F1FE}", "cy"],
      ["\u{1F1E8}\u{1F1FF}", "cz"],
      ["\u{1F1E9}\u{1F1EA}", "de"],
      ["\u{1F1E9}\u{1F1F0}", "dk"],
      ["\u{1F1E9}\u{1F1FF}", "dz"],
      ["\u{1F1EA}\u{1F1EA}", "ee"],
      ["\u{1F1EA}\u{1F1EC}", "eg"],
      ["\u{1F1EA}\u{1F1F8}", "es"],
      ["\u{1F1EB}\u{1F1EE}", "fi"],
      ["\u{1F1EB}\u{1F1F4}", "fo"],
      ["\u{1F1EB}\u{1F1F7}", "fr"],
      ["\u{1F1EC}\u{1F1F7}", "gr"],
      ["\u{1F1ED}\u{1F1F7}", "hr"],
      ["\u{1F1ED}\u{1F1FA}", "hu"],
      ["\u{1F1EE}\u{1F1E9}", "id"],
      ["\u{1F1EE}\u{1F1F1}", "il"],
      ["\u{1F1EE}\u{1F1F3}", "in"],
      ["\u{1F1EE}\u{1F1F7}", "ir"],
      ["\u{1F1EE}\u{1F1F8}", "is"],
      ["\u{1F1EE}\u{1F1F9}", "it"],
      ["\u{1F1EF}\u{1F1F5}", "jp"],
      ["\u{1F1F0}\u{1F1F7}", "kr"],
      ["\u{1F1F0}\u{1F1FF}", "kz"],
      ["\u{1F1F1}\u{1F1F0}", "lk"],
      ["\u{1F1F1}\u{1F1F9}", "lt"],
      ["\u{1F1F1}\u{1F1FB}", "lv"],
      ["\u{1F1F2}\u{1F1E6}", "ma"],
      ["\u{1F1F2}\u{1F1E9}", "md"],
      ["\u{1F1F2}\u{1F1F0}", "mk"],
      ["\u{1F1F2}\u{1F1FD}", "mx"],
      ["\u{1F1F2}\u{1F1FE}", "my"],
      ["\u{1F1F3}\u{1F1F1}", "nl"],
      ["\u{1F1F3}\u{1F1F4}", "no"],
      ["\u{1F1F3}\u{1F1F5}", "np"],
      ["\u{1F1F5}\u{1F1F1}", "pl"],
      ["\u{1F1F5}\u{1F1F9}", "pt"],
      ["\u{1F1F7}\u{1F1F4}", "ro"],
      ["\u{1F1F7}\u{1F1F8}", "rs"],
      ["\u{1F1F7}\u{1F1FA}", "ru"],
      ["\u{1F1F8}\u{1F1E6}", "sa"],
      ["\u{1F1F8}\u{1F1EE}", "si"],
      ["\u{1F1F8}\u{1F1F0}", "sk"],
      ["\u{1F1F8}\u{1F1EA}", "se"],
      ["\u{1F1F8}\u{1F1F7}", "sr"],
      ["\u{1F1F9}\u{1F1ED}", "th"],
      ["\u{1F1F9}\u{1F1EF}", "tj"],
      ["\u{1F1F9}\u{1F1FC}", "tw"],
      ["\u{1F1F9}\u{1F1F7}", "tr"],
      ["\u{1F1FA}\u{1F1E6}", "ua"],
      ["\u{1F1FA}\u{1F1FF}", "uz"],
      ["\u{1F1FB}\u{1F1F3}", "vn"],
      ["\u{1F1FD}\u{1F1F0}", "xk"]
    ]);
    const reUnicodeFlags = new RegExp(
      Array.from(unicodeFlagToImageSrc).map((a) => a[0]).join("|"),
      "gu"
    );
    i18n.patchUnicodeFlags = function(text) {
      const fragment = document.createDocumentFragment();
      let i = 0;
      for (; ; ) {
        const match = reUnicodeFlags.exec(text);
        if (match === null) {
          break;
        }
        if (match.index > i) {
          fragment.append(text.slice(i, match.index));
        }
        const img = document.createElement("img");
        const countryCode = unicodeFlagToImageSrc.get(match[0]);
        img.src = `/img/flags-of-the-world/${countryCode}.png`;
        img.title = countryCode;
        img.classList.add("countryFlag");
        fragment.append(img, "\u200A");
        i = reUnicodeFlags.lastIndex;
      }
      if (i < text.length) {
        fragment.append(text.slice(i));
      }
      return fragment;
    };
    i18n.render();
  }

  // src/js/settings.ts
  function handleImportFilePicker() {
    const file = this.files[0];
    if (file === void 0 || file.name === "") {
      return;
    }
    const reportError = () => {
      window.alert(i18n$("aboutRestoreDataError"));
    };
    const expectedFileTypes = [
      "text/plain",
      "application/json"
    ];
    if (expectedFileTypes.includes(file.type) === false) {
      return reportError();
    }
    const filename = file.name;
    const fr = new FileReader();
    fr.onload = function() {
      let userData;
      try {
        userData = JSON.parse(this.result);
        if (typeof userData !== "object") {
          throw "Invalid";
        }
        if (typeof userData.userSettings !== "object") {
          throw "Invalid";
        }
        if (Array.isArray(userData.whitelist) === false && typeof userData.netWhitelist !== "string") {
          throw "Invalid";
        }
        if (typeof userData.filterLists !== "object" && Array.isArray(userData.selectedFilterLists) === false) {
          throw "Invalid";
        }
      } catch (e) {
        console.warn("[uBR] settings: invalid userData", e);
        userData = void 0;
      }
      if (userData === void 0) {
        return reportError();
      }
      const time = new Date(userData.timeStamp);
      const msg = i18n$("aboutRestoreDataConfirm").replace("{{time}}", time.toLocaleString());
      const proceed = window.confirm(msg);
      if (proceed !== true) {
        return;
      }
      vAPI.messaging.send("dashboard", {
        what: "restoreUserData",
        userData,
        file: filename
      });
    };
    fr.readAsText(file);
  }
  function startImportFilePicker() {
    const input = qs$("#restoreFilePicker");
    input.value = "";
    input.click();
  }
  async function exportToFile() {
    const response = await vAPI.messaging.send("dashboard", {
      what: "backupUserData"
    });
    if (response instanceof Object === false || response.userData instanceof Object === false) {
      return;
    }
    vAPI.download({
      "url": `data:text/plain;charset=utf-8,${encodeURIComponent(JSON.stringify(response.userData, null, "  "))}`,
      "filename": response.localData.lastBackupFile
    });
    onLocalDataReceived(response.localData);
  }
  function onLocalDataReceived(details) {
    let v, unit;
    if (typeof details.storageUsed === "number") {
      v = details.storageUsed;
      if (v < 1e3) {
        unit = "genericBytes";
      } else if (v < 1e6) {
        v /= 1e3;
        unit = "KB";
      } else if (v < 1e9) {
        v /= 1e6;
        unit = "MB";
      } else {
        v /= 1e9;
        unit = "GB";
      }
    } else {
      v = "?";
      unit = "";
    }
    dom.text(
      "#storageUsed",
      i18n$("storageUsed").replace("{{value}}", v.toLocaleString(void 0, { maximumSignificantDigits: 3 })).replace("{{unit}}", unit && i18n$(unit) || "")
    );
    const timeOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      timeZoneName: "short"
    };
    const lastBackupFile = details.lastBackupFile || "";
    if (lastBackupFile !== "") {
      const dt = new Date(details.lastBackupTime);
      const text = i18n$("settingsLastBackupPrompt");
      const node = qs$("#settingsLastBackupPrompt");
      node.textContent = `${text}\xA0${dt.toLocaleString("fullwide", timeOptions)}`;
      node.style.display = "";
    }
    const lastRestoreFile = details.lastRestoreFile || "";
    if (lastRestoreFile !== "") {
      const dt = new Date(details.lastRestoreTime);
      const text = i18n$("settingsLastRestorePrompt");
      const node = qs$("#settingsLastRestorePrompt");
      node.textContent = `${text}\xA0${dt.toLocaleString("fullwide", timeOptions)}`;
      node.style.display = "";
    }
    if (details.cloudStorageSupported === false) {
      dom.attr('[data-setting-name="cloudStorageEnabled"]', "disabled", "");
      const el = qs$('[data-setting-name="cloudStorageEnabled"]');
      if (el) el.closest(".checkbox")?.setAttribute("disabled", "");
    }
    if (details.privacySettingsSupported === false) {
      dom.attr('[data-setting-name="prefetchingDisabled"]', "disabled", "");
      dom.attr('[data-setting-name="hyperlinkAuditingDisabled"]', "disabled", "");
      dom.attr('[data-setting-name="webrtcIPAddressHidden"]', "disabled", "");
      for (const name of ["prefetchingDisabled", "hyperlinkAuditingDisabled", "webrtcIPAddressHidden"]) {
        const el = qs$(`[data-setting-name="${name}"]`);
        if (el) el.closest(".checkbox")?.setAttribute("disabled", "");
      }
    }
  }
  function resetUserData() {
    const msg = i18n$("aboutResetDataConfirm");
    const proceed = window.confirm(msg);
    if (proceed !== true) {
      return;
    }
    vAPI.messaging.send("dashboard", {
      what: "resetUserData"
    });
  }
  function synchronizeDOM() {
    dom.cl.toggle(
      dom.body,
      "advancedUser",
      qs$('[data-setting-name="advancedUserEnabled"]').checked === true
    );
  }
  function changeUserSettings(name, value) {
    vAPI.messaging.send("dashboard", {
      what: "userSettings",
      name,
      value
    });
    switch (name) {
      case "uiTheme":
        setTheme(value, true);
        break;
      case "uiAccentCustom":
      case "uiAccentCustom0":
        setAccentColor(
          qs$('[data-setting-name="uiAccentCustom"]').checked,
          qs$('[data-setting-name="uiAccentCustom0"]').value,
          true
        );
        break;
      default:
        break;
    }
  }
  function onValueChanged(ev) {
    const input = ev.target;
    const name = dom.attr(input, "data-setting-name");
    let value = input.value;
    switch (name) {
      case "largeMediaSize":
        value = Math.min(Math.max(Math.floor(parseInt(value, 10) || 0), 0), 1e6);
        break;
      default:
        break;
    }
    if (value !== input.value) {
      input.value = value;
    }
    changeUserSettings(name, value);
  }
  function onUserSettingsReceived(details) {
    const checkboxes = qsa$('[data-setting-type="bool"]');
    const onchange = (ev) => {
      const checkbox = ev.target;
      const name = checkbox.dataset.settingName || "";
      changeUserSettings(name, checkbox.checked);
      synchronizeDOM();
    };
    for (const checkbox of checkboxes) {
      const name = dom.attr(checkbox, "data-setting-name") || "";
      if (details[name] === void 0) {
        dom.attr(checkbox.closest(".checkbox"), "disabled", "");
        dom.attr(checkbox, "disabled", "");
        continue;
      }
      checkbox.checked = details[name] === true;
      dom.on(checkbox, "change", onchange);
    }
    if (details.canLeakLocalIPAddresses === true) {
      qs$('[data-setting-name="webrtcIPAddressHidden"]').closest("div.li").style.display = "";
    }
    qsa$('[data-setting-type="value"]').forEach((elem) => {
      elem.value = details[dom.attr(elem, "data-setting-name")];
      dom.on(elem, "change", onValueChanged);
    });
    dom.on("#export", "click", () => {
      exportToFile();
    });
    dom.on("#import", "click", startImportFilePicker);
    dom.on("#reset", "click", resetUserData);
    dom.on("#restoreFilePicker", "change", handleImportFilePicker);
    synchronizeDOM();
  }
  self.hasUnsavedData = function() {
    return false;
  };
  vAPI.messaging.send("dashboard", { what: "userSettings" }).then((result) => {
    onUserSettingsReceived(result);
  });
  vAPI.messaging.send("dashboard", { what: "getLocalData" }).then((result) => {
    onLocalDataReceived(result);
  });
  dom.on(
    '[data-i18n-title="settingsAdvancedUserSettings"]',
    "click",
    self.uBlockDashboard.openOrSelectPage
  );
})();
