// GENERATED FILE. Do not edit directly.
// Source: src/js/contentscript/fluid-player-ad-config-hardener-main.ts
// Build command: npm run build
(() => {
  // src/js/contentscript/fluid-player-ad-config-hardener-main.ts
  var pageWindow = window;
  var AD_CONFIG_KEYS = /* @__PURE__ */ new Set([
    "vastOptions",
    "adList",
    "vastTag",
    "fallbackAdList",
    "vpaid",
    "vpaidOptions",
    "allowVPAID",
    "htmlOnPauseBlock"
  ]);
  function sanitizeDeep(value, depth = 0) {
    if (value === null || typeof value !== "object") return value;
    if (depth > 5) return value;
    if (Array.isArray(value)) {
      for (const item of value) {
        sanitizeDeep(item, depth + 1);
      }
      return value;
    }
    const obj = value;
    for (const key of AD_CONFIG_KEYS) {
      if (key in obj) {
        delete obj[key];
      }
    }
    for (const key of Object.keys(obj)) {
      const lowered = key.toLowerCase();
      if (lowered.includes("vast") || lowered.includes("vpaid") || lowered === "adlist" || lowered === "ad_list" || lowered === "ads" || lowered === "advertising") {
        delete obj[key];
        continue;
      }
      sanitizeDeep(obj[key], depth + 1);
    }
    return obj;
  }
  function wrapFluidPlayer(original) {
    const existing = original;
    if (existing.__ubrWrapped) return original;
    const wrapped = function(...args) {
      if (args.length >= 2) {
        args[1] = sanitizeDeep(args[1]);
      }
      return original.apply(this, args);
    };
    wrapped.__ubrWrapped = true;
    return wrapped;
  }
  function suppressFluidPlayerAds() {
    if (pageWindow.__ubrFluidPlayerHardenerInstalled) return;
    pageWindow.__ubrFluidPlayerHardenerInstalled = true;
    let storedFluidPlayer = pageWindow.fluidPlayer;
    Object.defineProperty(pageWindow, "fluidPlayer", {
      configurable: true,
      enumerable: true,
      get() {
        return storedFluidPlayer;
      },
      set(nextValue) {
        storedFluidPlayer = typeof nextValue === "function" ? wrapFluidPlayer(nextValue) : nextValue;
      }
    });
    if (typeof storedFluidPlayer === "function") {
      pageWindow.fluidPlayer = storedFluidPlayer;
    }
  }
  if (typeof window === "object" && typeof document === "object") {
    const hostname = location.hostname;
    if (hostname === "youtube.com" || hostname.endsWith(".youtube.com") || hostname === "youtube-nocookie.com" || hostname.endsWith(".youtube-nocookie.com") || hostname === "youtu.be" || hostname.endsWith(".youtu.be") || hostname === "suno.com" || hostname.endsWith(".suno.com") || hostname === "chatgpt.com" || hostname.endsWith(".chatgpt.com")) {
    } else {
      suppressFluidPlayerAds();
    }
  }
})();
