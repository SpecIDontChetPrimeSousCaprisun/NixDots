// GENERATED FILE. Do not edit directly.
// Source: src/js/contentscript/youtube-adblock-main.ts
// Build command: npm run build
(() => {
  // src/js/contentscript/youtube-adblock-main.ts
  var YOUTUBE_PLAYER_ENDPOINTS = [
    "/youtubei/v1/player",
    "/youtubei/v1/next",
    "/youtubei/v1/browse",
    "/youtubei/v1/reel"
  ];
  var adResponseKeys = /* @__PURE__ */ new Set([
    "adbreakheartbeatparams",
    "adbreakparams",
    "adbreaks",
    "ad3module",
    "adclient",
    "adimpression",
    "adinfo",
    "adloggingdata",
    "adplacements",
    "adparams",
    "adpreview",
    "adsignalsinfo",
    "adslotmetadata",
    "adslots",
    "adtag",
    "adtagparameters",
    "adtagurl",
    "adurl",
    "advideoid",
    "companionads",
    "companionslots",
    "displayadrenderer",
    "infeedadlayoutrenderer",
    "playerads",
    "promoteditemsectionrenderer",
    "promotedsparkleswebrenderer",
    "promotedvideorenderer"
  ]);
  var embeddedJSONKeys = /* @__PURE__ */ new Set([
    "initialplayerresponse",
    "playerresponse",
    "rawplayerresponse"
  ]);
  var isRecord = (value) => typeof value === "object" && value !== null && Array.isArray(value) === false;
  var playerResponseShapeKeys = /* @__PURE__ */ new Set([
    "playabilitystatus",
    "streamingdata",
    "videodetails"
  ]);
  var hasYouTubePlayerPayloadShape = (value, depth = 0) => {
    if (isRecord(value) === false) {
      return false;
    }
    const keys = Object.keys(value).map((key) => key.toLowerCase().replace(/[^a-z0-9]/g, ""));
    if (keys.some((key) => playerResponseShapeKeys.has(key))) {
      return true;
    }
    if (depth >= 3) {
      return false;
    }
    return Object.values(value).some((child) => hasYouTubePlayerPayloadShape(child, depth + 1));
  };
  var sanitizeYouTubeAdPayload = (payload, seen = /* @__PURE__ */ new WeakSet()) => {
    if (payload === null || typeof payload !== "object") {
      return false;
    }
    if (seen.has(payload)) {
      return false;
    }
    seen.add(payload);
    let changed = false;
    if (Array.isArray(payload)) {
      for (const item of payload) {
        changed = sanitizeYouTubeAdPayload(item, seen) || changed;
      }
      return changed;
    }
    for (const key of Object.keys(payload)) {
      const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (adResponseKeys.has(normalizedKey)) {
        delete payload[key];
        changed = true;
        continue;
      }
      const value = payload[key];
      if (embeddedJSONKeys.has(normalizedKey) && typeof value === "string") {
        const sanitized = sanitizeYouTubeAdJSON(value);
        if (sanitized.changed) {
          payload[key] = sanitized.text;
          changed = true;
        }
        continue;
      }
      changed = sanitizeYouTubeAdPayload(value, seen) || changed;
    }
    return changed;
  };
  var sanitizeYouTubeAdJSON = (text) => {
    try {
      const xssiPrefix = /^(?:\)\]\}'|for\s*\(;;\);|while\s*\(1\);)(?:\r?\n)?/.exec(text)?.[0] || "";
      const payload = JSON.parse(text.slice(xssiPrefix.length));
      if (sanitizeYouTubeAdPayload(payload) === false) {
        return { text, changed: false };
      }
      return { text: `${xssiPrefix}${JSON.stringify(payload)}`, changed: true };
    } catch (e) {
      console.warn("[uBR] catch:", e);
      return { text, changed: false };
    }
  };
  var mayContainYouTubeAdPayload = (text) => text.includes("adPlacements") || text.includes("ad_placements") || text.includes("playerAds") || text.includes("player_ads") || text.includes("ad3_module") || text.includes("adSlots") || text.includes("adBreak");
  var installJSONParseGuard = () => {
    const originalJSONParse = JSON.parse;
    JSON.parse = function(text, reviver) {
      const payload = originalJSONParse.call(JSON, text, reviver);
      if (mayContainYouTubeAdPayload(text) && hasYouTubePlayerPayloadShape(payload)) {
        sanitizeYouTubeAdPayload(payload);
      }
      return payload;
    };
  };
  var isYouTubePlayerRequest = (url, baseURL) => {
    try {
      const target = new URL(url, baseURL);
      const hostname = target.hostname;
      const isYouTubeHost = hostname === "youtube.com" || hostname.endsWith(".youtube.com") || hostname === "youtube-nocookie.com" || hostname.endsWith(".youtube-nocookie.com");
      return isYouTubeHost && YOUTUBE_PLAYER_ENDPOINTS.some((path) => target.pathname === path);
    } catch (e) {
      console.warn("[uBR] catch:", e);
      return false;
    }
  };
  var requestURL = (input) => {
    if (typeof input === "string") {
      return input;
    }
    if (input instanceof URL) {
      return input.href;
    }
    return input.url;
  };
  var nativeResponseText = Response.prototype.text;
  var sanitizeResponse = async (response) => {
    const contentType = response.headers.get("content-type") || "";
    if (response.type === "opaque" || contentType.includes("json") === false) {
      return response;
    }
    try {
      const sanitized = sanitizeYouTubeAdJSON(await nativeResponseText.call(response.clone()));
      if (sanitized.changed === false) {
        return response;
      }
      const headers = new Headers(response.headers);
      headers.delete("content-length");
      return new Response(sanitized.text, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    } catch (e) {
      console.warn("[uBR] catch:", e);
      return response;
    }
  };
  var installFetchGuard = () => {
    const originalFetch = window.fetch;
    window.fetch = async function(input, init) {
      const response = await originalFetch.call(this, input, init);
      if (isYouTubePlayerRequest(requestURL(input), location.href) === false) {
        return response;
      }
      return sanitizeResponse(response);
    };
  };
  var installResponseConsumptionGuard = () => {
    const originalJSON = Response.prototype.json;
    Response.prototype.json = async function() {
      const payload = await originalJSON.call(this);
      if (isYouTubePlayerRequest(this.url, location.href)) {
        sanitizeYouTubeAdPayload(payload);
      }
      return payload;
    };
    const originalText = Response.prototype.text;
    Response.prototype.text = async function() {
      const text = await originalText.call(this);
      if (isYouTubePlayerRequest(this.url, location.href) === false) {
        return text;
      }
      return sanitizeYouTubeAdJSON(text).text;
    };
  };
  var installXHRGuard = () => {
    const requestURLs = /* @__PURE__ */ new WeakMap();
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, async, username, password) {
      requestURLs.set(this, String(url));
      originalOpen.call(this, method, url, async, username, password);
    };
    const sanitizeXHRValue = (xhr, value) => {
      if (isYouTubePlayerRequest(requestURLs.get(xhr) || "", location.href) === false) {
        return value;
      }
      if (typeof value === "string") {
        return sanitizeYouTubeAdJSON(value).text;
      }
      sanitizeYouTubeAdPayload(value);
      return value;
    };
    for (const property of ["response", "responseText"]) {
      const descriptor = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, property);
      if (descriptor?.get === void 0 || descriptor.configurable === false) {
        continue;
      }
      Object.defineProperty(XMLHttpRequest.prototype, property, {
        ...descriptor,
        get() {
          return sanitizeXHRValue(this, descriptor.get.call(this));
        }
      });
    }
  };
  var playerSkipButtonSelector = [
    ".ytp-ad-skip-button",
    ".ytp-ad-skip-button-modern",
    ".ytp-ad-skip-button-container button",
    ".ytp-ad-skip-button-slot button",
    ".videoAdUiSkipButton"
  ].join(",");
  var playerIsShowingAd = (player) => {
    if (player.classList.contains("ad-showing") || player.classList.contains("ad-interrupting")) {
      return true;
    }
    try {
      return player.getVideoData?.().isAd === true;
    } catch (e) {
      console.warn("[uBR] catch:", e);
      return false;
    }
  };
  var skipActivePlayerAd = (player, skipAttemptedPlayer, skipControlClickedPlayer) => {
    if (player === null || playerIsShowingAd(player) === false) {
      skipAttemptedPlayer.value = null;
      skipControlClickedPlayer.value = null;
      return false;
    }
    if (skipAttemptedPlayer.value !== player) {
      skipAttemptedPlayer.value = player;
      try {
        player.skipAd?.();
      } catch (e) {
        console.warn("[uBR] youtube-adblock-main: player.skipAd failed", e);
      }
    }
    if (skipControlClickedPlayer.value === player) {
      return true;
    }
    const buttons = player.querySelectorAll(playerSkipButtonSelector);
    if (buttons.length === 0) {
      return true;
    }
    for (const button of buttons) {
      try {
        button.click();
      } catch (e) {
        console.warn("[uBR] youtube-adblock-main: button.click failed", e);
      }
    }
    skipControlClickedPlayer.value = player;
    return true;
  };
  var installPlayerAdSkipper = () => {
    const skipAttemptedPlayer = { value: null };
    const skipControlClickedPlayer = { value: null };
    let activePlayer = null;
    let playerObserver;
    let playerDiscoveryObserver;
    let skipControlObserver;
    const stopWatchingSkipControl = () => {
      skipControlObserver?.disconnect();
      skipControlObserver = void 0;
    };
    const nodeContainsSkipControl = (node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return false;
      }
      const element = node;
      return element.matches(playerSkipButtonSelector) || element.querySelector(playerSkipButtonSelector) !== null;
    };
    const mutationMayRevealSkipControl = (mutation) => {
      if (mutation.type === "childList") {
        return Array.from(mutation.addedNodes).some(nodeContainsSkipControl);
      }
      const target = mutation.target;
      return target.matches(playerSkipButtonSelector) || target.closest(playerSkipButtonSelector) !== null;
    };
    const watchForSkipControl = () => {
      if (activePlayer === null || skipControlClickedPlayer.value === activePlayer || skipControlObserver !== void 0) {
        return;
      }
      skipControlObserver = new MutationObserver((records) => {
        if (records.some(mutationMayRevealSkipControl) === false) {
          return;
        }
        skipActivePlayerAd(activePlayer, skipAttemptedPlayer, skipControlClickedPlayer);
        if (skipControlClickedPlayer.value === activePlayer) {
          stopWatchingSkipControl();
        }
      });
      skipControlObserver.observe(activePlayer, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ["class", "disabled", "aria-hidden"]
      });
    };
    const observePlayer = () => {
      if (skipActivePlayerAd(
        activePlayer,
        skipAttemptedPlayer,
        skipControlClickedPlayer
      ) === false) {
        stopWatchingSkipControl();
        return;
      }
      if (skipControlClickedPlayer.value === activePlayer) {
        stopWatchingSkipControl();
        return;
      }
      watchForSkipControl();
    };
    const attachPlayerObserver = () => {
      const player = document.querySelector("#movie_player");
      if (player === activePlayer) {
        observePlayer();
        return;
      }
      playerObserver?.disconnect();
      stopWatchingSkipControl();
      activePlayer = player;
      skipAttemptedPlayer.value = null;
      skipControlClickedPlayer.value = null;
      if (player === null) {
        watchForPlayer();
        return;
      }
      playerDiscoveryObserver?.disconnect();
      playerDiscoveryObserver = void 0;
      playerObserver = new MutationObserver(observePlayer);
      playerObserver.observe(player, {
        attributes: true,
        attributeFilter: ["class"]
      });
      observePlayer();
    };
    const nodeContainsPlayer = (node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return false;
      }
      const element = node;
      return element.id === "movie_player" || element.querySelector("#movie_player") !== null;
    };
    const watchForPlayer = () => {
      if (playerDiscoveryObserver !== void 0) {
        return;
      }
      playerDiscoveryObserver = new MutationObserver((records) => {
        if (records.some(
          (record) => Array.from(record.addedNodes).some(nodeContainsPlayer)
        )) {
          attachPlayerObserver();
        }
      });
      playerDiscoveryObserver.observe(document, {
        childList: true,
        subtree: true
      });
    };
    const timers = [0, 50, 250, 1e3, 3e3].map(
      (delay) => window.setTimeout(attachPlayerObserver, delay)
    );
    document.addEventListener("yt-navigate-finish", attachPlayerObserver, true);
    document.addEventListener("yt-page-data-updated", attachPlayerObserver, true);
    window.addEventListener("pagehide", () => {
      playerObserver?.disconnect();
      playerDiscoveryObserver?.disconnect();
      stopWatchingSkipControl();
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    }, { once: true });
    attachPlayerObserver();
  };
  var sanitizeGlobalPlayerState = () => {
    const pageWindow = window;
    sanitizeYouTubeAdPayload(pageWindow.ytInitialPlayerResponse);
    sanitizeYouTubeAdPayload(pageWindow.ytInitialData);
    sanitizeYouTubeAdPayload(pageWindow.ytplayer);
    sanitizeYouTubeAdPayload(pageWindow.ytcfg);
    const args = pageWindow.ytplayer?.config?.args;
    if (args === void 0) {
      return;
    }
    sanitizeYouTubeAdPayload(args);
  };
  var hookGlobalPayload = (name) => {
    const descriptor = Object.getOwnPropertyDescriptor(window, name);
    if (descriptor?.configurable === false) {
      return;
    }
    let value = descriptor?.get?.call(window) ?? descriptor?.value;
    sanitizeYouTubeAdPayload(value);
    Object.defineProperty(window, name, {
      configurable: true,
      enumerable: descriptor?.enumerable ?? true,
      get() {
        return descriptor?.get?.call(window) ?? value;
      },
      set(nextValue) {
        sanitizeYouTubeAdPayload(nextValue);
        if (descriptor?.set !== void 0) {
          descriptor.set.call(window, nextValue);
        } else {
          value = nextValue;
        }
      }
    });
  };
  var installYouTubeAdblock = () => {
    const pageWindow = window;
    if (pageWindow.__ubrYouTubeAdblockInstalled) {
      return;
    }
    pageWindow.__ubrYouTubeAdblockInstalled = true;
    hookGlobalPayload("ytInitialData");
    hookGlobalPayload("ytInitialPlayerResponse");
    hookGlobalPayload("ytplayer");
    hookGlobalPayload("ytcfg");
    installJSONParseGuard();
    installFetchGuard();
    installResponseConsumptionGuard();
    installXHRGuard();
    installPlayerAdSkipper();
    sanitizeGlobalPlayerState();
    for (const delay of [0, 50, 250, 1e3, 3e3]) {
      window.setTimeout(sanitizeGlobalPlayerState, delay);
    }
    document.addEventListener("yt-navigate-finish", sanitizeGlobalPlayerState, true);
    document.addEventListener("yt-page-data-updated", sanitizeGlobalPlayerState, true);
  };
  if (typeof window === "object" && typeof document === "object") {
    const hostname = location.hostname;
    if (hostname === "youtube.com" || hostname.endsWith(".youtube.com") || hostname === "youtube-nocookie.com" || hostname.endsWith(".youtube-nocookie.com")) {
      installYouTubeAdblock();
    }
  }
})();
