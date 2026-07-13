// GENERATED FILE. Do not edit directly.
// Source: src/js/about.ts
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

  // src/js/about.ts
  (async () => {
    const appData = await vAPI.messaging.send("dashboard", {
      what: "getAppData"
    });
    dom.text("#aboutNameVer", `${appData.name} ${appData.version}`);
  })();
})();
