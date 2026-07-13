// GENERATED FILE. Do not edit directly.
// Source: src/js/dyna-rules.ts
// Build command: npm run build
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // src/js/codemirror/ubo-dynamic-filtering.ts
  var validSwitches = /* @__PURE__ */ new Set([
    "no-strict-blocking:",
    "no-popups:",
    "no-cosmetic-filtering:",
    "no-remote-fonts:",
    "no-large-media:",
    "no-csp-reports:",
    "no-scripting:"
  ]);
  var validSwitcheStates = /* @__PURE__ */ new Set([
    "true",
    "false"
  ]);
  var validHnRuleTypes = /* @__PURE__ */ new Set([
    "*",
    "3p",
    "image",
    "inline-script",
    "1p-script",
    "3p-script",
    "3p-frame"
  ]);
  var invalidURLRuleTypes = /* @__PURE__ */ new Set([
    "doc",
    "main_frame"
  ]);
  var validActions = /* @__PURE__ */ new Set([
    "block",
    "allow",
    "noop"
  ]);
  var hnValidator = new URL(self.location.href);
  var reBadHn = /[%]|^\.|\.$/;
  var slices = [];
  var sliceIndex = 0;
  var sliceCount = 0;
  var hostnameToDomainMap = /* @__PURE__ */ new Map();
  var psl;
  var isValidHostname = (hnin) => {
    if (hnin === "*") {
      return true;
    }
    hnValidator.hostname = "_";
    try {
      hnValidator.hostname = hnin;
    } catch (e) {
      console.warn("[uBR] ubo-dynamic-filtering: invalid hostname", hnin, e);
      return false;
    }
    const hnout = hnValidator.hostname;
    return hnout !== "_" && hnout !== "" && reBadHn.test(hnout) === false;
  };
  var addSlice = (len, style = null) => {
    const i = sliceCount;
    if (i === slices.length) {
      slices[i] = { len: 0, style: null };
    }
    const entry = slices[i];
    entry.len = len;
    entry.style = style;
    sliceCount += 1;
  };
  var addMatchSlice = (match, style = null) => {
    const len = match !== null ? match[0].length : 0;
    addSlice(len, style);
    return match !== null ? match.input.slice(len) : "";
  };
  var addMatchHnSlices = (match, style = null) => {
    const hn = match?.[0] ?? "";
    if (hn === "*") {
      return addMatchSlice(match, style);
    }
    let dn = hostnameToDomainMap.get(hn) || "";
    if (dn === "" && psl !== void 0) {
      dn = /(\d|\])$/.test(hn) ? hn : psl.getDomain(hn) || hn;
    }
    const entityBeg = hn.length - dn.length;
    if (entityBeg !== 0) {
      addSlice(entityBeg, style);
    }
    let entityEnd = dn.indexOf(".");
    if (entityEnd === -1) {
      entityEnd = dn.length;
    }
    addSlice(entityEnd, style !== null ? `${style} strong` : "strong");
    if (entityEnd < dn.length) {
      addSlice(dn.length - entityEnd, style);
    }
    return match?.input.slice(hn.length) ?? "";
  };
  var makeSlices = (stream, opts) => {
    sliceIndex = 0;
    sliceCount = 0;
    let { string } = stream;
    if (string === "...") {
      return;
    }
    const { sortType } = opts;
    const reNotToken = /^\s+/;
    const reToken = /^\S+/;
    const tokens = [];
    let match = reNotToken.exec(string);
    if (match !== null) {
      string = addMatchSlice(match);
    }
    match = reToken.exec(string);
    if (match === null) {
      return;
    }
    tokens.push(match[0]);
    const isSwitchRule = validSwitches.has(match[0]);
    if (isSwitchRule) {
      string = addMatchSlice(match, sortType === 0 ? "sortkey" : null);
    } else if (isValidHostname(match[0])) {
      if (sortType === 1) {
        string = addMatchHnSlices(match, "sortkey");
      } else {
        string = addMatchHnSlices(match, null);
      }
    } else {
      string = addMatchSlice(match, "error");
    }
    match = reNotToken.exec(string);
    if (match === null) {
      return;
    }
    string = addMatchSlice(match);
    match = reToken.exec(string);
    if (match === null) {
      return;
    }
    tokens.push(match[0]);
    const isURLRule = isSwitchRule === false && match[0].indexOf("://") > 0;
    if (isURLRule) {
      string = addMatchSlice(match, sortType === 2 ? "sortkey" : null);
    } else if (isValidHostname(match[0]) === false) {
      string = addMatchSlice(match, "error");
    } else if (sortType === 1 && isSwitchRule || sortType === 2) {
      string = addMatchHnSlices(match, "sortkey");
    } else {
      string = addMatchHnSlices(match, null);
    }
    match = reNotToken.exec(string);
    if (match === null) {
      return;
    }
    string = addMatchSlice(match);
    match = reToken.exec(string);
    if (match === null) {
      return;
    }
    tokens.push(match[0]);
    if (isSwitchRule) {
      string = validSwitcheStates.has(match[0]) ? addMatchSlice(match, match[0] === "true" ? "blockrule" : "allowrule") : addMatchSlice(match, "error");
    } else if (isURLRule) {
      string = invalidURLRuleTypes.has(match[0]) ? addMatchSlice(match, "error") : addMatchSlice(match);
    } else if (tokens[1] === "*") {
      string = validHnRuleTypes.has(match[0]) ? addMatchSlice(match) : addMatchSlice(match, "error");
    } else {
      string = match[0] === "*" ? addMatchSlice(match) : addMatchSlice(match, "error");
    }
    match = reNotToken.exec(string);
    if (match === null) {
      return;
    }
    string = addMatchSlice(match);
    match = reToken.exec(string);
    if (match === null) {
      return;
    }
    tokens.push(match[0]);
    string = isSwitchRule || validActions.has(match[0]) === false ? addMatchSlice(match, "error") : addMatchSlice(match, `${match[0]}rule`);
    match = reNotToken.exec(string);
    if (match === null) {
      return;
    }
    string = addMatchSlice(match);
    match = reToken.exec(string);
    if (match !== null) {
      string = addMatchSlice(null, "error");
    }
  };
  var token = function(stream) {
    if (stream.sol()) {
      makeSlices(stream, this);
    }
    if (sliceIndex >= sliceCount) {
      stream.skipToEnd(stream);
      return null;
    }
    const { len, style } = slices[sliceIndex++];
    if (len === 0) {
      stream.skipToEnd();
    } else {
      stream.pos += len;
    }
    return style ?? null;
  };
  CodeMirror.defineMode("ubo-dynamic-filtering", () => {
    return {
      token,
      sortType: 1,
      setHostnameToDomainMap: (a) => {
        hostnameToDomainMap = a;
      },
      setPSL: (a) => {
        psl = a;
      }
    };
  });

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

  // src/lib/publicsuffixlist/publicsuffixlist.js
  var publicsuffixlist_default = /* @__PURE__ */ (function() {
    const HOSTNAME_SLOT = 0;
    const LABEL_INDICES_SLOT = 256;
    const RULES_PTR_SLOT = 100;
    const SUFFIX_NOT_FOUND_SLOT = 399;
    const CHARDATA_PTR_SLOT = 101;
    const EMPTY_STRING = "";
    const SELFIE_MAGIC = 3;
    let wasmMemory;
    let pslBuffer32;
    let pslBuffer8;
    let pslByteLength = 0;
    let hostnameArg = EMPTY_STRING;
    const fireChangedEvent = function() {
      if (typeof window !== "object") {
        return;
      }
      if (window instanceof Object === false) {
        return;
      }
      if (window.dispatchEvent instanceof Function === false) {
        return;
      }
      if (window.CustomEvent instanceof Function === false) {
        return;
      }
      window.dispatchEvent(new CustomEvent("publicSuffixListChanged"));
    };
    const allocateBuffers = function(byteLength) {
      pslByteLength = byteLength + 3 & ~3;
      if (pslBuffer32 !== void 0 && pslBuffer32.byteLength >= pslByteLength) {
        return;
      }
      if (wasmMemory !== void 0) {
        const newPageCount = pslByteLength + 65535 >>> 16;
        const curPageCount = wasmMemory.buffer.byteLength >>> 16;
        const delta = newPageCount - curPageCount;
        if (delta > 0) {
          wasmMemory.grow(delta);
          pslBuffer32 = new Uint32Array(wasmMemory.buffer);
          pslBuffer8 = new Uint8Array(wasmMemory.buffer);
        }
      } else {
        pslBuffer8 = new Uint8Array(pslByteLength);
        pslBuffer32 = new Uint32Array(pslBuffer8.buffer);
      }
      hostnameArg = EMPTY_STRING;
      pslBuffer8[LABEL_INDICES_SLOT] = 0;
    };
    const parse = function(text, toAscii) {
      const rootRule = {
        l: EMPTY_STRING,
        // l => label
        f: 0,
        // f => flags
        c: void 0
        // c => children
      };
      {
        const compareLabels = function(a, b) {
          const n = a.length;
          let d = n - b.length;
          if (d !== 0) {
            return d;
          }
          for (let i = 0; i < n; i++) {
            d = a.charCodeAt(i) - b.charCodeAt(i);
            if (d !== 0) {
              return d;
            }
          }
          return 0;
        };
        const addToTree = function(rule, exception) {
          let node = rootRule;
          let end = rule.length;
          while (end > 0) {
            const beg = rule.lastIndexOf(".", end - 1);
            const label = rule.slice(beg + 1, end);
            end = beg;
            if (Array.isArray(node.c) === false) {
              const child = { l: label, f: 0, c: void 0 };
              node.c = [child];
              node = child;
              continue;
            }
            let left = 0;
            let right = node.c.length;
            while (left < right) {
              const i = left + right >>> 1;
              const d = compareLabels(label, node.c[i].l);
              if (d < 0) {
                right = i;
                if (right === left) {
                  const child = {
                    l: label,
                    f: 0,
                    c: void 0
                  };
                  node.c.splice(left, 0, child);
                  node = child;
                  break;
                }
                continue;
              }
              if (d > 0) {
                left = i + 1;
                if (left === right) {
                  const child = {
                    l: label,
                    f: 0,
                    c: void 0
                  };
                  node.c.splice(right, 0, child);
                  node = child;
                  break;
                }
                continue;
              }
              node = node.c[i];
              break;
            }
          }
          node.f |= 1;
          if (exception) {
            node.f |= 2;
          }
        };
        addToTree("*", false);
        const mustPunycode = /[^a-z0-9.-]/;
        const textEnd = text.length;
        let lineBeg = 0;
        while (lineBeg < textEnd) {
          let lineEnd = text.indexOf("\n", lineBeg);
          if (lineEnd === -1) {
            lineEnd = text.indexOf("\r", lineBeg);
            if (lineEnd === -1) {
              lineEnd = textEnd;
            }
          }
          let line = text.slice(lineBeg, lineEnd).trim();
          lineBeg = lineEnd + 1;
          const pos = line.indexOf("//");
          if (pos !== -1) {
            line = line.slice(0, pos);
          }
          line = line.trim();
          if (line.length === 0) {
            continue;
          }
          const exception = line.charCodeAt(0) === 33;
          if (exception) {
            line = line.slice(1);
          }
          if (mustPunycode.test(line)) {
            line = toAscii(line.toLowerCase());
          }
          addToTree(line, exception);
        }
      }
      {
        const labelToOffsetMap = /* @__PURE__ */ new Map();
        const treeData = [];
        const charData = [];
        const allocate = function(n) {
          const ibuf = treeData.length;
          for (let i = 0; i < n; i++) {
            treeData.push(0);
          }
          return ibuf;
        };
        const storeNode = function(ibuf, node) {
          const nChars = node.l.length;
          const nChildren = node.c !== void 0 ? node.c.length : 0;
          treeData[ibuf + 0] = nChildren << 16 | node.f << 8 | nChars;
          if (nChars <= 4) {
            let v = 0;
            if (nChars > 0) {
              v |= node.l.charCodeAt(0);
              if (nChars > 1) {
                v |= node.l.charCodeAt(1) << 8;
                if (nChars > 2) {
                  v |= node.l.charCodeAt(2) << 16;
                  if (nChars > 3) {
                    v |= node.l.charCodeAt(3) << 24;
                  }
                }
              }
            }
            treeData[ibuf + 1] = v;
          } else {
            let offset = labelToOffsetMap.get(node.l);
            if (offset === void 0) {
              offset = charData.length;
              for (let i = 0; i < nChars; i++) {
                charData.push(node.l.charCodeAt(i));
              }
              labelToOffsetMap.set(node.l, offset);
            }
            treeData[ibuf + 1] = offset;
          }
          if (Array.isArray(node.c) === false) {
            treeData[ibuf + 2] = 0;
            return;
          }
          const iarray = allocate(nChildren * 3);
          treeData[ibuf + 2] = iarray;
          for (let i = 0; i < nChildren; i++) {
            storeNode(iarray + i * 3, node.c[i]);
          }
        };
        allocate(512 >> 2);
        const iRootRule = allocate(3);
        storeNode(iRootRule, rootRule);
        treeData[RULES_PTR_SLOT] = iRootRule;
        const iCharData = treeData.length << 2;
        treeData[CHARDATA_PTR_SLOT] = iCharData;
        const byteLength = (treeData.length << 2) + (charData.length + 3 & ~3);
        allocateBuffers(byteLength);
        pslBuffer32.set(treeData);
        pslBuffer8.set(charData, treeData.length << 2);
      }
      fireChangedEvent();
    };
    const setHostnameArg = function(hostname) {
      const buf = pslBuffer8;
      if (hostname === hostnameArg) {
        return buf[LABEL_INDICES_SLOT];
      }
      if (hostname === null || hostname.length === 0) {
        hostnameArg = EMPTY_STRING;
        return buf[LABEL_INDICES_SLOT] = 0;
      }
      hostname = hostname.toLowerCase();
      hostnameArg = hostname;
      let n = hostname.length;
      if (n > 255) {
        n = 255;
      }
      buf[LABEL_INDICES_SLOT] = n;
      let i = n;
      let j = LABEL_INDICES_SLOT + 1;
      while (i--) {
        const c = hostname.charCodeAt(i);
        if (c === 46) {
          buf[j + 0] = i + 1;
          buf[j + 1] = i;
          j += 2;
        }
        buf[i] = c;
      }
      buf[j] = 0;
      return n;
    };
    const getPublicSuffixPosJS = function() {
      const buf8 = pslBuffer8;
      const buf32 = pslBuffer32;
      const iCharData = buf32[CHARDATA_PTR_SLOT];
      let iNode = pslBuffer32[RULES_PTR_SLOT];
      let cursorPos = -1;
      let iLabel = LABEL_INDICES_SLOT;
      for (; ; ) {
        const labelBeg = buf8[iLabel + 1];
        const labelLen = buf8[iLabel + 0] - labelBeg;
        let r = buf32[iNode + 0] >>> 16;
        if (r === 0) {
          break;
        }
        const iCandidates = buf32[iNode + 2];
        let l = 0;
        let iFound = 0;
        while (l < r) {
          const iCandidate = l + r >>> 1;
          const iCandidateNode = iCandidates + iCandidate + (iCandidate << 1);
          const candidateLen = buf32[iCandidateNode + 0] & 255;
          let d = labelLen - candidateLen;
          if (d === 0) {
            const iCandidateChar = candidateLen <= 4 ? iCandidateNode + 1 << 2 : iCharData + buf32[iCandidateNode + 1];
            for (let i = 0; i < labelLen; i++) {
              d = buf8[labelBeg + i] - buf8[iCandidateChar + i];
              if (d !== 0) {
                break;
              }
            }
          }
          if (d < 0) {
            r = iCandidate;
          } else if (d > 0) {
            l = iCandidate + 1;
          } else {
            iFound = iCandidateNode;
            break;
          }
        }
        if (iFound === 0) {
          if (buf32[iCandidates + 1] !== 42) {
            break;
          }
          buf8[SUFFIX_NOT_FOUND_SLOT] = 1;
          iFound = iCandidates;
        }
        iNode = iFound;
        if ((buf32[iNode + 0] & 512) !== 0) {
          if (iLabel > LABEL_INDICES_SLOT) {
            return iLabel - 2;
          }
          break;
        }
        if ((buf32[iNode + 0] & 256) !== 0) {
          cursorPos = iLabel;
        }
        if (labelBeg === 0) {
          break;
        }
        iLabel += 2;
      }
      return cursorPos;
    };
    let getPublicSuffixPosWASM;
    let getPublicSuffixPos = getPublicSuffixPosJS;
    const getPublicSuffix = function(hostname) {
      if (pslBuffer32 === void 0) {
        return EMPTY_STRING;
      }
      const hostnameLen = setHostnameArg(hostname);
      const buf8 = pslBuffer8;
      if (hostnameLen === 0 || buf8[0] === 46) {
        return EMPTY_STRING;
      }
      const cursorPos = getPublicSuffixPos();
      if (cursorPos === -1) {
        return EMPTY_STRING;
      }
      const beg = buf8[cursorPos + 1];
      return beg === 0 ? hostnameArg : hostnameArg.slice(beg);
    };
    const getDomain = function(hostname) {
      if (pslBuffer32 === void 0) {
        return EMPTY_STRING;
      }
      const hostnameLen = setHostnameArg(hostname);
      const buf8 = pslBuffer8;
      if (hostnameLen === 0 || buf8[0] === 46) {
        return EMPTY_STRING;
      }
      const cursorPos = getPublicSuffixPos();
      if (cursorPos === -1 || buf8[cursorPos + 1] === 0) {
        return EMPTY_STRING;
      }
      const beg = buf8[cursorPos + 3];
      return beg === 0 ? hostnameArg : hostnameArg.slice(beg);
    };
    const suffixInPSL = function(hostname) {
      if (pslBuffer32 === void 0) {
        return false;
      }
      const hostnameLen = setHostnameArg(hostname);
      const buf8 = pslBuffer8;
      if (hostnameLen === 0 || buf8[0] === 46) {
        return false;
      }
      buf8[SUFFIX_NOT_FOUND_SLOT] = 0;
      const cursorPos = getPublicSuffixPos();
      return cursorPos !== -1 && buf8[cursorPos + 1] === 0 && buf8[SUFFIX_NOT_FOUND_SLOT] !== 1;
    };
    const toSelfie = function(encoder) {
      if (pslBuffer8 === void 0) {
        return "";
      }
      if (encoder instanceof Object) {
        const bufferStr = encoder.encode(pslBuffer8.buffer, pslByteLength);
        return `${SELFIE_MAGIC}	${bufferStr}`;
      }
      return {
        magic: SELFIE_MAGIC,
        buf32: pslBuffer32.subarray(0, pslByteLength >> 2)
      };
    };
    const fromSelfie = function(selfie, decoder) {
      let byteLength = 0;
      if (typeof selfie === "string" && selfie.length !== 0 && decoder instanceof Object) {
        const pos = selfie.indexOf("	");
        if (pos === -1 || selfie.slice(0, pos) !== `${SELFIE_MAGIC}`) {
          return false;
        }
        const bufferStr = selfie.slice(pos + 1);
        byteLength = decoder.decodeSize(bufferStr);
        if (byteLength === 0) {
          return false;
        }
        allocateBuffers(byteLength);
        decoder.decode(bufferStr, pslBuffer8.buffer);
      } else if (selfie instanceof Object && selfie.magic === SELFIE_MAGIC && selfie.buf32 instanceof Uint32Array) {
        byteLength = selfie.buf32.length << 2;
        allocateBuffers(byteLength);
        pslBuffer32.set(selfie.buf32);
      } else {
        return false;
      }
      hostnameArg = EMPTY_STRING;
      pslBuffer8[LABEL_INDICES_SLOT] = 0;
      fireChangedEvent();
      return true;
    };
    const enableWASM = /* @__PURE__ */ (() => {
      let wasmPromise;
      const getWasmInstance = async function(wasmModuleFetcher, path) {
        if (typeof WebAssembly !== "object") {
          return false;
        }
        const uint32s = new Uint32Array(1);
        const uint8s = new Uint8Array(uint32s.buffer);
        uint32s[0] = 1;
        if (uint8s[0] !== 1) {
          return false;
        }
        try {
          const module = await wasmModuleFetcher(`${path}publicsuffixlist`);
          if (module instanceof WebAssembly.Module === false) {
            return false;
          }
          const pageCount = pslBuffer8 !== void 0 ? pslBuffer8.byteLength + 65535 >>> 16 : 1;
          const memory = new WebAssembly.Memory({ initial: pageCount });
          const instance = await WebAssembly.instantiate(module, {
            imports: { memory }
          });
          if (instance instanceof WebAssembly.Instance === false) {
            return false;
          }
          const curPageCount = memory.buffer.byteLength >>> 16;
          const newPageCount = pslBuffer8 !== void 0 ? pslBuffer8.byteLength + 65535 >>> 16 : 0;
          if (newPageCount > curPageCount) {
            memory.grow(newPageCount - curPageCount);
          }
          if (pslBuffer32 !== void 0) {
            const buf8 = new Uint8Array(memory.buffer);
            const buf32 = new Uint32Array(memory.buffer);
            buf32.set(pslBuffer32);
            pslBuffer8 = buf8;
            pslBuffer32 = buf32;
          }
          wasmMemory = memory;
          getPublicSuffixPosWASM = instance.exports.getPublicSuffixPos;
          getPublicSuffixPos = getPublicSuffixPosWASM;
          return true;
        } catch (reason) {
          console.info(reason);
        }
        return false;
      };
      return async function(wasmModuleFetcher, path) {
        if (getPublicSuffixPosWASM instanceof Function) {
          return true;
        }
        if (wasmPromise instanceof Promise === false) {
          wasmPromise = getWasmInstance(wasmModuleFetcher, path);
        }
        return wasmPromise;
      };
    })();
    const disableWASM = function() {
      if (getPublicSuffixPosWASM instanceof Function) {
        getPublicSuffixPos = getPublicSuffixPosJS;
        getPublicSuffixPosWASM = void 0;
      }
      if (wasmMemory === void 0) {
        return;
      }
      if (pslBuffer32 !== void 0) {
        const buf8 = new Uint8Array(pslByteLength);
        const buf32 = new Uint32Array(buf8.buffer);
        buf32.set(pslBuffer32);
        pslBuffer8 = buf8;
        pslBuffer32 = buf32;
      }
      wasmMemory = void 0;
    };
    return {
      version: "2.0",
      parse,
      getDomain,
      suffixInPSL,
      getPublicSuffix,
      toSelfie,
      fromSelfie,
      disableWASM,
      enableWASM
    };
  })();

  // src/lib/punycode.js
  var punycode_default = (function() {
    let punycode, maxInt = 2147483647, base = 36, tMin = 1, tMax = 26, skew = 38, damp = 700, initialBias = 72, initialN = 128, delimiter = "-", regexPunycode = /^xn--/, regexNonASCII = /[^\x20-\x7E]/, regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, errors = {
      "overflow": "Overflow: input needs wider integers to process",
      "not-basic": "Illegal input >= 0x80 (not a basic code point)",
      "invalid-input": "Invalid input"
    }, baseMinusTMin = base - tMin, floor = Math.floor, stringFromCharCode = String.fromCharCode, key;
    function error(type) {
      throw new RangeError(errors[type]);
    }
    function map(array, fn) {
      let length = array.length;
      const result = [];
      while (length--) {
        result[length] = fn(array[length]);
      }
      return result;
    }
    function mapDomain(string, fn) {
      const parts = string.split("@");
      let result = "";
      if (parts.length > 1) {
        result = `${parts[0]}@`;
        string = parts[1];
      }
      string = string.replace(regexSeparators, ".");
      const labels = string.split(".");
      const encoded = map(labels, fn).join(".");
      return result + encoded;
    }
    function ucs2decode(string) {
      let output = [], counter = 0, length = string.length, value, extra;
      while (counter < length) {
        value = string.charCodeAt(counter++);
        if (value >= 55296 && value <= 56319 && counter < length) {
          extra = string.charCodeAt(counter++);
          if ((extra & 64512) == 56320) {
            output.push(((value & 1023) << 10) + (extra & 1023) + 65536);
          } else {
            output.push(value);
            counter--;
          }
        } else {
          output.push(value);
        }
      }
      return output;
    }
    function ucs2encode(array) {
      return map(array, (value) => {
        let output = "";
        if (value > 65535) {
          value -= 65536;
          output += stringFromCharCode(value >>> 10 & 1023 | 55296);
          value = 56320 | value & 1023;
        }
        output += stringFromCharCode(value);
        return output;
      }).join("");
    }
    function basicToDigit(codePoint) {
      if (codePoint - 48 < 10) {
        return codePoint - 22;
      }
      if (codePoint - 65 < 26) {
        return codePoint - 65;
      }
      if (codePoint - 97 < 26) {
        return codePoint - 97;
      }
      return base;
    }
    function digitToBasic(digit, flag) {
      return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
    }
    function adapt(delta, numPoints, firstTime) {
      let k = 0;
      delta = firstTime ? floor(delta / damp) : delta >> 1;
      delta += floor(delta / numPoints);
      for (; delta > baseMinusTMin * tMax >> 1; k += base) {
        delta = floor(delta / baseMinusTMin);
      }
      return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
    }
    function decode(input) {
      let output = [], inputLength = input.length, out, i = 0, n = initialN, bias = initialBias, basic, j, index, oldi, w, k, digit, t, baseMinusT;
      basic = input.lastIndexOf(delimiter);
      if (basic < 0) {
        basic = 0;
      }
      for (j = 0; j < basic; ++j) {
        if (input.charCodeAt(j) >= 128) {
          error("not-basic");
        }
        output.push(input.charCodeAt(j));
      }
      for (index = basic > 0 ? basic + 1 : 0; index < inputLength; ) {
        for (oldi = i, w = 1, k = base; ; k += base) {
          if (index >= inputLength) {
            error("invalid-input");
          }
          digit = basicToDigit(input.charCodeAt(index++));
          if (digit >= base || digit > floor((maxInt - i) / w)) {
            error("overflow");
          }
          i += digit * w;
          t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
          if (digit < t) {
            break;
          }
          baseMinusT = base - t;
          if (w > floor(maxInt / baseMinusT)) {
            error("overflow");
          }
          w *= baseMinusT;
        }
        out = output.length + 1;
        bias = adapt(i - oldi, out, oldi == 0);
        if (floor(i / out) > maxInt - n) {
          error("overflow");
        }
        n += floor(i / out);
        i %= out;
        output.splice(i++, 0, n);
      }
      return ucs2encode(output);
    }
    function encode(input) {
      let n, delta, handledCPCount, basicLength, bias, j, m, q, k, t, currentValue, output = [], inputLength, handledCPCountPlusOne, baseMinusT, qMinusT;
      input = ucs2decode(input);
      inputLength = input.length;
      n = initialN;
      delta = 0;
      bias = initialBias;
      for (j = 0; j < inputLength; ++j) {
        currentValue = input[j];
        if (currentValue < 128) {
          output.push(stringFromCharCode(currentValue));
        }
      }
      handledCPCount = basicLength = output.length;
      if (basicLength) {
        output.push(delimiter);
      }
      while (handledCPCount < inputLength) {
        for (m = maxInt, j = 0; j < inputLength; ++j) {
          currentValue = input[j];
          if (currentValue >= n && currentValue < m) {
            m = currentValue;
          }
        }
        handledCPCountPlusOne = handledCPCount + 1;
        if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
          error("overflow");
        }
        delta += (m - n) * handledCPCountPlusOne;
        n = m;
        for (j = 0; j < inputLength; ++j) {
          currentValue = input[j];
          if (currentValue < n && ++delta > maxInt) {
            error("overflow");
          }
          if (currentValue == n) {
            for (q = delta, k = base; ; k += base) {
              t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
              if (q < t) {
                break;
              }
              qMinusT = q - t;
              baseMinusT = base - t;
              output.push(
                stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
              );
              q = floor(qMinusT / baseMinusT);
            }
            output.push(stringFromCharCode(digitToBasic(q, 0)));
            bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
            delta = 0;
            ++handledCPCount;
          }
        }
        ++delta;
        ++n;
      }
      return output.join("");
    }
    function toUnicode(input) {
      return mapDomain(input, (string) => {
        return regexPunycode.test(string) ? decode(string.slice(4).toLowerCase()) : string;
      });
    }
    function toASCII(input) {
      return mapDomain(input, (string) => {
        return regexNonASCII.test(string) ? `xn--${encode(string)}` : string;
      });
    }
    punycode = {
      /**
       * A string representing the current Punycode.js version number.
       * @memberOf punycode
       * @type String
       */
      "version": "1.3.2",
      /**
       * An object of methods to convert from JavaScript's internal character
       * representation (UCS-2) to Unicode code points, and back.
       * @see <https://mathiasbynens.be/notes/javascript-encoding>
       * @memberOf punycode
       * @type Object
       */
      "ucs2": {
        "decode": ucs2decode,
        "encode": ucs2encode
      },
      "decode": decode,
      "encode": encode,
      "toASCII": toASCII,
      "toUnicode": toUnicode
    };
    return punycode;
  })();

  // src/js/uri-utils.ts
  var reHostnameFromCommonURL = /^https:\/\/[0-9a-z._-]+[0-9a-z]\//;
  var reAuthorityFromURI = /^(?:[^:/?#]+:)?(\/\/[^/?#]+)/;
  var reHostFromNakedAuthority = /^[0-9a-z._-]+[0-9a-z]$/i;
  var reHostFromAuthority = /^(?:[^@]*@)?([^:]+)(?::\d*)?$/;
  var reIPv6FromAuthority = /^(?:[^@]*@)?(\[[0-9a-f:]+\])(?::\d*)?$/i;
  var reMustNormalizeHostname = /[^0-9a-z._-]/;
  function hostnameFromURI(uri) {
    let match = reHostnameFromCommonURL.exec(uri);
    if (match !== null) {
      return match[0].slice(8, -1);
    }
    match = reAuthorityFromURI.exec(uri);
    if (match === null) {
      return "";
    }
    const authority = match[1].slice(2);
    if (reHostFromNakedAuthority.test(authority)) {
      return authority.toLowerCase();
    }
    match = reHostFromAuthority.exec(authority);
    if (match === null) {
      match = reIPv6FromAuthority.exec(authority);
      if (match === null) {
        return "";
      }
    }
    let hostname = match[1];
    while (hostname.endsWith(".")) {
      hostname = hostname.slice(0, -1);
    }
    if (reMustNormalizeHostname.test(hostname)) {
      hostname = punycode_default.toASCII(hostname.toLowerCase());
    }
    return hostname;
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

  // src/js/dyna-rules.ts
  var hostnameToDomainMap2 = /* @__PURE__ */ new Map();
  var mergeView = new CodeMirror.MergeView(
    qs$(".codeMirrorMergeContainer"),
    {
      allowEditingOriginals: true,
      connect: "align",
      inputStyle: "contenteditable",
      lineNumbers: true,
      lineWrapping: false,
      origLeft: "",
      revertButtons: true,
      value: ""
    }
  );
  mergeView.editor().setOption("styleActiveLine", true);
  mergeView.editor().setOption("lineNumbers", false);
  mergeView.leftOriginal().setOption("readOnly", "nocursor");
  uBlockDashboard.patchCodeMirrorEditor(mergeView.editor());
  var thePanes = {
    orig: {
      doc: mergeView.leftOriginal(),
      original: [],
      modified: []
    },
    edit: {
      doc: mergeView.editor(),
      original: [],
      modified: []
    }
  };
  var cleanEditToken = 0;
  var cleanEditText = "";
  {
    const i18nCommitStr = i18n$("rulesCommit");
    const i18nRevertStr = i18n$("rulesRevert");
    const commitArrowSelector = `.CodeMirror-merge-copybuttons-left .CodeMirror-merge-copy-reverse:not([title="${i18nCommitStr}"])`;
    const revertArrowSelector = `.CodeMirror-merge-copybuttons-left .CodeMirror-merge-copy:not([title="${i18nRevertStr}"])`;
    dom.attr(".CodeMirror-merge-scrolllock", "title", i18n$("genericMergeViewScrollLock"));
    const translate = function() {
      let elems = qsa$(commitArrowSelector);
      for (const elem of elems) {
        dom.attr(elem, "title", i18nCommitStr);
      }
      elems = qsa$(revertArrowSelector);
      for (const elem of elems) {
        dom.attr(elem, "title", i18nRevertStr);
      }
    };
    const mergeGapObserver = new MutationObserver(translate);
    mergeGapObserver.observe(
      qs$(".CodeMirror-merge-copybuttons-left"),
      { attributes: true, attributeFilter: ["title"], subtree: true }
    );
  }
  var getDiffer = /* @__PURE__ */ (() => {
    let differ;
    return () => {
      if (differ === void 0) {
        differ = new diff_match_patch();
      }
      return differ;
    };
  })();
  var updateOverlay = /* @__PURE__ */ (() => {
    let reFilter;
    const mode = {
      token: function(stream) {
        if (reFilter !== void 0) {
          reFilter.lastIndex = stream.pos;
          const match = reFilter.exec(stream.string);
          if (match !== null) {
            if (match.index === stream.pos) {
              stream.pos += match[0].length || 1;
              return "searching";
            }
            stream.pos = match.index;
            return;
          }
        }
        stream.skipToEnd();
      }
    };
    return function() {
      const f = presentationState.filter;
      reFilter = typeof f === "string" && f !== "" ? new RegExp(f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi") : void 0;
      return mode;
    };
  })();
  var toggleOverlay = /* @__PURE__ */ (() => {
    let overlay = null;
    return function() {
      if (overlay !== null) {
        mergeView.leftOriginal().removeOverlay(overlay);
        mergeView.editor().removeOverlay(overlay);
        overlay = null;
      }
      if (presentationState.filter !== "") {
        overlay = updateOverlay();
        mergeView.leftOriginal().addOverlay(overlay);
        mergeView.editor().addOverlay(overlay);
      }
      rulesToDoc(true);
      savePresentationState();
    };
  })();
  function rulesToDoc(clearHistory) {
    const orig = thePanes.orig.doc;
    const edit = thePanes.edit.doc;
    orig.startOperation();
    edit.startOperation();
    for (const key in thePanes) {
      if (Object.hasOwn(thePanes, key) === false) {
        continue;
      }
      const doc = thePanes[key].doc;
      const rules = filterRules(key);
      if (clearHistory || doc.lineCount() === 1 && doc.getValue() === "" || rules.length === 0) {
        doc.setValue(rules.length !== 0 ? `${rules.join("\n")}
` : "");
        continue;
      }
      const beforeText = doc.getValue();
      let afterText = rules.join("\n").trim();
      if (afterText !== "") {
        afterText += "\n";
      }
      const diffs = getDiffer().diff_main(beforeText, afterText);
      let i = diffs.length;
      let iedit = beforeText.length;
      while (i--) {
        const diff = diffs[i];
        if (diff[0] === 0) {
          iedit -= diff[1].length;
          continue;
        }
        const end = doc.posFromIndex(iedit);
        if (diff[0] === 1) {
          doc.replaceRange(diff[1], end, end);
          continue;
        }
        iedit -= diff[1].length;
        const beg = doc.posFromIndex(iedit);
        doc.replaceRange("", beg, end);
      }
    }
    const marks = edit.getAllMarks();
    for (const mark of marks) {
      if (mark.uboEllipsis !== true) {
        continue;
      }
      mark.clear();
    }
    if (presentationState.isCollapsed) {
      for (let iline = 0, n = edit.lineCount(); iline < n; iline++) {
        if (edit.getLine(iline) !== "...") {
          continue;
        }
        const mark = edit.markText(
          { line: iline, ch: 0 },
          { line: iline + 1, ch: 0 },
          { atomic: true, readOnly: true }
        );
        mark.uboEllipsis = true;
      }
    }
    orig.endOperation();
    edit.endOperation();
    cleanEditText = mergeView.editor().getValue().trim();
    cleanEditToken = mergeView.editor().changeGeneration();
    if (clearHistory !== true) {
      return;
    }
    mergeView.editor().clearHistory();
    const chunks = mergeView.leftChunks();
    if (chunks.length === 0) {
      return;
    }
    const ldoc = thePanes.orig.doc;
    const { clientHeight } = ldoc.getScrollInfo();
    const line = Math.min(chunks[0].editFrom, chunks[0].origFrom);
    ldoc.setCursor(line, 0);
    ldoc.scrollIntoView(
      { line, ch: 0 },
      (clientHeight - ldoc.defaultTextHeight()) / 2
    );
  }
  function filterRules(key) {
    const filter = qs$("#ruleFilter input").value;
    const rules = thePanes[key].modified;
    if (filter === "") {
      return rules;
    }
    const out = [];
    for (const rule of rules) {
      if (rule.indexOf(filter) === -1) {
        continue;
      }
      out.push(rule);
    }
    return out;
  }
  async function applyDiff(permanent, toAdd, toRemove) {
    const details = await vAPI.messaging.send("dashboard", {
      what: "modifyRuleset",
      permanent,
      toAdd,
      toRemove
    });
    thePanes.orig.original = details.permanentRules;
    thePanes.edit.original = details.sessionRules;
    onPresentationChanged();
  }
  mergeView.options.revertChunk = function(mv, from, fromStart, fromEnd, to, toStart, toEnd) {
    if (dom.attr(dom.body, "dir") === "rtl") {
      let tmp = from;
      from = to;
      to = tmp;
      tmp = fromStart;
      fromStart = toStart;
      toStart = tmp;
      tmp = fromEnd;
      fromEnd = toEnd;
      toEnd = tmp;
    }
    if (typeof fromStart.ch !== "number") {
      fromStart.ch = 0;
    }
    if (fromEnd.ch !== 0) {
      fromEnd.line += 1;
    }
    const toAdd = from.getRange(
      { line: fromStart.line, ch: 0 },
      { line: fromEnd.line, ch: 0 }
    );
    if (typeof toStart.ch !== "number") {
      toStart.ch = 0;
    }
    if (toEnd.ch !== 0) {
      toEnd.line += 1;
    }
    const toRemove = to.getRange(
      { line: toStart.line, ch: 0 },
      { line: toEnd.line, ch: 0 }
    );
    applyDiff(from === mv.editor(), toAdd, toRemove);
  };
  function handleImportFilePicker() {
    const fileReaderOnLoadHandler = function() {
      if (typeof this.result !== "string" || this.result === "") {
        return;
      }
      let result = this.result;
      const matches = /\[origins-to-destinations\]([^[]+)/.exec(result);
      if (matches && matches.length === 2) {
        result = matches[1].trim().replace(/\|/g, " ").replace(/\n/g, " * noop\n");
      }
      applyDiff(false, result, "");
    };
    const file = this.files[0];
    if (file === void 0 || file.name === "") {
      return;
    }
    if (file.type.indexOf("text") !== 0) {
      return;
    }
    const fr = new FileReader();
    fr.onload = fileReaderOnLoadHandler;
    fr.readAsText(file);
  }
  function startImportFilePicker() {
    const input = qs$("#importFilePicker");
    input.value = "";
    input.click();
  }
  function exportUserRulesToFile() {
    const filename = i18n$("rulesDefaultFileName").replace("{{datetime}}", uBlockDashboard.dateNowToSensibleString()).replace(/ +/g, "_");
    vAPI.download({
      url: `data:text/plain,${encodeURIComponent(
        `${mergeView.leftOriginal().getValue().trim()}
`
      )}`,
      filename,
      saveAs: true
    });
  }
  {
    let timer;
    dom.on("#ruleFilter input", "input", () => {
      if (timer !== void 0) {
        self.cancelIdleCallback(timer);
      }
      timer = self.requestIdleCallback(() => {
        timer = void 0;
        if (mergeView.editor().isClean(cleanEditToken) === false) {
          return;
        }
        const filter = qs$("#ruleFilter input").value;
        if (filter === presentationState.filter) {
          return;
        }
        presentationState.filter = filter;
        toggleOverlay();
      }, { timeout: 773 });
    });
  }
  var onPresentationChanged = (() => {
    const reSwRule = /^([^/]+): ([^/ ]+) ([^ ]+)/;
    const reRule = /^([^ ]+) ([^/ ]+) ([^ ]+ [^ ]+)/;
    const reUrlRule = /^([^ ]+) ([^ ]+) ([^ ]+ [^ ]+)/;
    const sortNormalizeHn = function(hn) {
      let domain = hostnameToDomainMap2.get(hn);
      if (domain === void 0) {
        domain = /(\d|\])$/.test(hn) ? hn : publicsuffixlist_default.getDomain(hn);
        hostnameToDomainMap2.set(hn, domain);
      }
      let normalized = domain || hn;
      if (hn.length !== domain.length) {
        const subdomains = hn.slice(0, hn.length - domain.length - 1);
        normalized += `.${subdomains.includes(".") ? subdomains.split(".").reverse().join(".") : subdomains}`;
      }
      return normalized;
    };
    const slotFromRule = (rule) => {
      let type, srcHn, desHn, extra;
      let match = reSwRule.exec(rule);
      if (match !== null) {
        type = ` ${match[1]}`;
        srcHn = sortNormalizeHn(match[2]);
        desHn = srcHn;
        extra = match[3];
      } else if ((match = reRule.exec(rule)) !== null) {
        type = "FFFE";
        srcHn = sortNormalizeHn(match[1]);
        desHn = sortNormalizeHn(match[2]);
        extra = match[3];
      } else if ((match = reUrlRule.exec(rule)) !== null) {
        type = "FFFF";
        srcHn = sortNormalizeHn(match[1]);
        desHn = sortNormalizeHn(hostnameFromURI(match[2]));
        extra = match[3];
      }
      if (presentationState.sortType === 0) {
        return { rule, token: `${type} ${srcHn} ${desHn} ${extra}` };
      }
      if (presentationState.sortType === 1) {
        return { rule, token: `${srcHn} ${type} ${desHn} ${extra}` };
      }
      return { rule, token: `${desHn} ${type} ${srcHn} ${extra}` };
    };
    const sort = (rules) => {
      const slots = [];
      for (let i = 0; i < rules.length; i++) {
        slots.push(slotFromRule(rules[i], 1));
      }
      slots.sort((a, b) => a.token.localeCompare(b.token));
      for (let i = 0; i < rules.length; i++) {
        rules[i] = slots[i].rule;
      }
    };
    const collapse = () => {
      if (presentationState.isCollapsed !== true) {
        return;
      }
      const diffs = getDiffer().diff_main(
        thePanes.orig.modified.join("\n"),
        thePanes.edit.modified.join("\n")
      );
      const ll = [];
      let lellipsis = false;
      const rr = [];
      let rellipsis = false;
      for (let i = 0; i < diffs.length; i++) {
        const diff = diffs[i];
        if (diff[0] === 0) {
          lellipsis = rellipsis = true;
          continue;
        }
        if (diff[0] < 0) {
          if (lellipsis) {
            ll.push("...");
            if (rellipsis) {
              rr.push("...");
            }
            lellipsis = rellipsis = false;
          }
          ll.push(diff[1].trim());
          continue;
        }
        if (rellipsis) {
          rr.push("...");
          if (lellipsis) {
            ll.push("...");
          }
          lellipsis = rellipsis = false;
        }
        rr.push(diff[1].trim());
      }
      if (lellipsis) {
        ll.push("...");
      }
      if (rellipsis) {
        rr.push("...");
      }
      thePanes.orig.modified = ll;
      thePanes.edit.modified = rr;
    };
    dom.on("#ruleFilter select", "input", (ev) => {
      presentationState.sortType = parseInt(ev.target.value, 10) || 0;
      savePresentationState();
      onPresentationChanged(true);
    });
    dom.on("#ruleFilter #diffCollapse", "click", (ev) => {
      presentationState.isCollapsed = dom.cl.toggle(ev.target, "active");
      savePresentationState();
      onPresentationChanged(true);
    });
    return function onPresentationChanged2(clearHistory) {
      const origPane = thePanes.orig;
      const editPane = thePanes.edit;
      origPane.modified = origPane.original.slice();
      editPane.modified = editPane.original.slice();
      {
        const mode = origPane.doc.getMode();
        mode.sortType = presentationState.sortType;
        mode.setHostnameToDomainMap(hostnameToDomainMap2);
        mode.setPSL(publicsuffixlist_default);
      }
      {
        const mode = editPane.doc.getMode();
        mode.sortType = presentationState.sortType;
        mode.setHostnameToDomainMap(hostnameToDomainMap2);
        mode.setPSL(publicsuffixlist_default);
      }
      sort(origPane.modified);
      sort(editPane.modified);
      collapse();
      rulesToDoc(clearHistory);
      onTextChanged(clearHistory);
    };
  })();
  var onTextChanged = /* @__PURE__ */ (() => {
    let timer;
    const process = (details) => {
      timer = void 0;
      const diff = qs$("#diff");
      let isClean = mergeView.editor().isClean(cleanEditToken);
      if (details === void 0 && isClean === false && mergeView.editor().getValue().trim() === cleanEditText) {
        cleanEditToken = mergeView.editor().changeGeneration();
        isClean = true;
      }
      const isDirty = mergeView.leftChunks().length !== 0;
      dom.cl.toggle(dom.body, "editing", isClean === false);
      dom.cl.toggle(diff, "dirty", isDirty);
      dom.cl.toggle("#editSaveButton", "disabled", isClean);
      dom.cl.toggle("#exportButton,#importButton", "disabled", isClean === false);
      dom.cl.toggle("#revertButton,#commitButton", "disabled", isClean === false || isDirty === false);
      const input = qs$("#ruleFilter input");
      if (isClean) {
        dom.attr(input, "disabled", null);
        CodeMirror.commands.save = void 0;
      } else {
        dom.attr(input, "disabled", "");
        CodeMirror.commands.save = editSaveHandler;
      }
    };
    return function onTextChanged2(now) {
      if (timer !== void 0) {
        self.cancelIdleCallback(timer);
      }
      timer = now ? process() : self.requestIdleCallback(process, { timeout: 57 });
    };
  })();
  function revertAllHandler() {
    const toAdd = [], toRemove = [];
    const left = mergeView.leftOriginal();
    const edit = mergeView.editor();
    for (const chunk of mergeView.leftChunks()) {
      const addedLines = left.getRange(
        { line: chunk.origFrom, ch: 0 },
        { line: chunk.origTo, ch: 0 }
      );
      const removedLines = edit.getRange(
        { line: chunk.editFrom, ch: 0 },
        { line: chunk.editTo, ch: 0 }
      );
      toAdd.push(addedLines.trim());
      toRemove.push(removedLines.trim());
    }
    applyDiff(false, toAdd.join("\n"), toRemove.join("\n"));
  }
  function commitAllHandler() {
    const toAdd = [], toRemove = [];
    const left = mergeView.leftOriginal();
    const edit = mergeView.editor();
    for (const chunk of mergeView.leftChunks()) {
      const addedLines = edit.getRange(
        { line: chunk.editFrom, ch: 0 },
        { line: chunk.editTo, ch: 0 }
      );
      const removedLines = left.getRange(
        { line: chunk.origFrom, ch: 0 },
        { line: chunk.origTo, ch: 0 }
      );
      toAdd.push(addedLines.trim());
      toRemove.push(removedLines.trim());
    }
    applyDiff(true, toAdd.join("\n"), toRemove.join("\n"));
  }
  function editSaveHandler() {
    const editor = mergeView.editor();
    const editText = editor.getValue().trim();
    if (editText === cleanEditText) {
      onTextChanged(true);
      return;
    }
    const toAdd = [], toRemove = [];
    const diffs = getDiffer().diff_main(cleanEditText, editText);
    for (const diff of diffs) {
      if (diff[0] === 1) {
        toAdd.push(diff[1]);
      } else if (diff[0] === -1) {
        toRemove.push(diff[1]);
      }
    }
    applyDiff(false, toAdd.join(""), toRemove.join(""));
  }
  self.cloud.onPush = function() {
    return thePanes.orig.original.join("\n");
  };
  self.cloud.onPull = function(data, append) {
    if (typeof data !== "string") {
      return;
    }
    applyDiff(
      false,
      data,
      append ? "" : mergeView.editor().getValue().trim()
    );
  };
  self.hasUnsavedData = function() {
    return mergeView.editor().isClean(cleanEditToken) === false;
  };
  var presentationState = {
    sortType: 0,
    isCollapsed: false,
    filter: ""
  };
  var savePresentationState = () => {
    vAPI.localStorage.setItem("dynaRulesPresentationState", presentationState);
  };
  vAPI.localStorage.getItemAsync("dynaRulesPresentationState").then((details) => {
    if (details instanceof Object === false) {
      return;
    }
    if (typeof details.sortType === "number") {
      presentationState.sortType = details.sortType;
      qs$("#ruleFilter select").value = `${details.sortType}`;
    }
    if (typeof details.isCollapsed === "boolean") {
      presentationState.isCollapsed = details.isCollapsed;
      dom.cl.toggle("#ruleFilter #diffCollapse", "active", details.isCollapsed);
    }
    if (typeof details.filter === "string") {
      presentationState.filter = details.filter;
      qs$("#ruleFilter input").value = details.filter;
      toggleOverlay();
    }
  });
  function normalizePslSelfie(selfie) {
    if (selfie && typeof selfie === "object" && Array.isArray(selfie.buf32)) {
      selfie.buf32 = new Uint32Array(selfie.buf32);
    }
    return selfie;
  }
  async function loadPublicSuffixList() {
    try {
      const stored = await chrome.storage.local.get("pslSelfie");
      if (stored.pslSelfie) {
        if (publicsuffixlist_default.fromSelfie(normalizePslSelfie(stored.pslSelfie))) return;
      }
    } catch (e) {
      console.warn("[uBR] dyna-rules: PSL selfie load failed, falling back to SW fetch", e);
    }
    try {
      const result = await vAPI.messaging.send("dashboard", { what: "getPslSelfie" });
      if (result?.pslSelfie && publicsuffixlist_default.fromSelfie(normalizePslSelfie(result.pslSelfie))) return;
    } catch (e) {
      console.warn("[uBR] dyna-rules: SW PSL fetch failed", e);
    }
    try {
      const response = await fetch("https://publicsuffix.org/list/public_suffix_list.dat");
      if (response.ok) {
        publicsuffixlist_default.parse(await response.text(), punycode_default.toASCII);
      }
    } catch (e) {
      console.warn("[uBR] dyna-rules: PSL network fetch failed", e);
    }
  }
  vAPI.messaging.send("dashboard", {
    what: "getRules"
  }).then(async (details) => {
    thePanes.orig.original = details.permanentRules;
    thePanes.edit.original = details.sessionRules;
    if (!publicsuffixlist_default.fromSelfie(normalizePslSelfie(details.pslSelfie))) {
      await loadPublicSuffixList();
    }
    onPresentationChanged(true);
  });
  dom.on("#importButton", "click", startImportFilePicker);
  dom.on("#importFilePicker", "change", handleImportFilePicker);
  dom.on("#exportButton", "click", exportUserRulesToFile);
  dom.on("#revertButton", "click", revertAllHandler);
  dom.on("#commitButton", "click", commitAllHandler);
  dom.on("#editSaveButton", "click", editSaveHandler);
  mergeView.editor().on("updateDiff", () => {
    onTextChanged();
  });
})();
/*! Home: https://github.com/gorhill/publicsuffixlist.js -- GPLv3 APLv2 */
/*! https://mths.be/punycode v1.3.2 by @mathias */
