/* GENERATED FILE — DO NOT EDIT. Source: src/js/contentscript/contentscript.ts */
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // src/js/contentscript/01-vapi-extensions.ts
  if (typeof vAPI !== "undefined") {
    {
      let context = self;
      try {
        while (context !== self.top && (context.location.href.startsWith("about:blank") || context.location.href === "about:srcdoc") && context.parent.location.href) {
          context = context.parent;
        }
      } catch (_) {
      }
      vAPI.effectiveSelf = context;
    }
    vAPI.userStylesheet = {
      added: /* @__PURE__ */ new Set(),
      removed: /* @__PURE__ */ new Set(),
      apply(callback) {
        if (this.added.size === 0 && this.removed.size === 0) {
          return;
        }
        vAPI.messaging.send("vapi", {
          what: "userCSS",
          add: Array.from(this.added),
          remove: Array.from(this.removed)
        }).then(() => {
          if (typeof callback !== "function") {
            return;
          }
          callback();
        });
        this.added.clear();
        this.removed.clear();
      },
      add(cssText, now) {
        if (cssText === "") {
          return;
        }
        this.added.add(cssText);
        if (now) {
          this.apply();
        }
      },
      remove(cssText, now) {
        if (cssText === "") {
          return;
        }
        this.removed.add(cssText);
        if (now) {
          this.apply();
        }
      }
    };
    vAPI.SafeAnimationFrame = class SafeAnimationFrame {
      constructor(callback) {
        __publicField(this, "fid");
        __publicField(this, "tid");
        __publicField(this, "callback");
        this.fid = void 0;
        this.tid = void 0;
        this.callback = callback;
      }
      start(delay) {
        if (vAPI instanceof Object === false) {
          return;
        }
        if (delay === void 0) {
          if (this.fid === void 0) {
            this.fid = requestAnimationFrame(() => {
              this.onRAF();
            });
          }
          if (this.tid === void 0) {
            this.tid = vAPI.setTimeout(() => {
              this.onSTO();
            }, 2e4);
          }
          return;
        }
        if (this.fid === void 0 && this.tid === void 0) {
          this.tid = vAPI.setTimeout(() => {
            this.macroToMicro();
          }, delay);
        }
      }
      clear() {
        if (this.fid !== void 0) {
          cancelAnimationFrame(this.fid);
          this.fid = void 0;
        }
        if (this.tid !== void 0) {
          clearTimeout(this.tid);
          this.tid = void 0;
        }
      }
      macroToMicro() {
        this.tid = void 0;
        this.start();
      }
      onRAF() {
        if (this.tid !== void 0) {
          clearTimeout(this.tid);
          this.tid = void 0;
        }
        this.fid = void 0;
        this.callback();
      }
      onSTO() {
        if (this.fid !== void 0) {
          cancelAnimationFrame(this.fid);
          this.fid = void 0;
        }
        this.tid = void 0;
        this.callback();
      }
    };
  }

  // src/js/contentscript/universal-ad-interceptor.ts
  ((self2) => {
    const DEBUG = false;
    const LOG_PREFIX = "[UAi] Universal Ad Interceptor:";
    const log = (...args) => {
      if (DEBUG) {
        console.log(LOG_PREFIX, ...args);
      }
    };
    const CONFIG = {
      // Known ad network domains (partial matches)
      adDomains: [
        "doubleclick.net",
        "googlesyndication.com",
        "googleadservices.com",
        "googleads.g.doubleclick.net",
        "adsense.google.com",
        "adnxs.com",
        "adnexus.net",
        "adnxs.org",
        "amazon-adsystem.com",
        "amazonadsystem.com",
        "advertising.com",
        "adtech.com",
        "adtechus.com",
        "adform.net",
        "adform.com",
        "pubmatic.com",
        "pubmatic.io",
        "rubiconproject.com",
        "rubicon.com",
        "openx.net",
        "openx.com",
        "indexexchange.com",
        "indexexchange.io",
        "criteo.com",
        "criteo.fr",
        "taboola.com",
        "taboola.com.cn",
        "outbrain.com",
        "outbrainimg.com",
        "mgid.com",
        "adsrvr.org",
        "adsrvr.com",
        "adcolony.com",
        "admob.com",
        "unity3d.com/ads",
        "unityads.unity3d.com",
        "moatads.com",
        "moat.com",
        "scorecardresearch.com",
        "quantserve.com",
        "adform.net",
        "adtech.de",
        "bidswitch.net",
        "casalemedia.com",
        "contextweb.com",
        "conversantmedia.com",
        "demdex.net",
        "exelator.com",
        "eyeota.net",
        "krxd.net",
        "lijit.com",
        "liveramp.com",
        "mathtag.com",
        "mediamath.com",
        "mxptint.net",
        "nativo.com",
        "openx.net",
        "pardot.com",
        "rfihub.com",
        "richrelevance.com",
        "rfihub.com",
        "rlcdn.com",
        "rubiconproject.com",
        "sharethrough.com",
        "simpli.fi",
        "sitescout.com",
        "smartadserver.com",
        "spotxchange.com",
        "stackadapt.com",
        "steelhousemedia.com",
        "stickyadstv.com",
        "taboola.com",
        "teads.tv",
        "tribalfusion.com",
        "triplelift.com",
        "turn.com",
        "undertone.com",
        "yahoo.com/ads",
        "yieldmo.com",
        "zeotap.com",
        // Video ads
        "ima3.js",
        "googlevideo.com/ad",
        "vast",
        "vmgcp",
        // Social ads
        "facebook.com/tr",
        "facebook.com/ads",
        "connect.facebook.net",
        "linkedin.com/ads",
        "twitter.com/ads"
      ],
      // URL patterns that indicate ad requests
      adUrlPatterns: [
        /\/ads\//i,
        /\/ad\/ /i,
        /\/advert/i,
        /\/adview/i,
        /\/adclick/i,
        /\/adframe/i,
        /\/adbanner/i,
        /\/sponsor/i,
        /\/promoted/i,
        /\/api\/ads/i,
        /\/api\/ad/i,
        /\/ads\/api/i,
        /\/adservice/i,
        /\/ad-serving/i,
        /\/adsense/i,
        /\/dfp\//i,
        /\/gpt\//i,
        /pagead/i,
        /\/pagead2\//i,
        /\/pubads\//i,
        /\/cmad/i,
        /bid/i,
        /\/bidder/i,
        /\/bids/i,
        /prebid/i,
        /rubicon/i,
        /\/vast\//i,
        /\/vmap\//i,
        /\/syndication\//i
      ],
      // JSON keys that indicate ad data
      adJSONKeys: [
        "adPlacements",
        "playerAds",
        "adSlots",
        "adBreakHeartbeatParams",
        "adServerLogger",
        "adSlotId",
        "adSlotId",
        "adUnitId",
        "ads",
        "advertisements",
        "advertising",
        "sponsored",
        "sponsoredContent",
        "sponsoredLinks",
        "promoted",
        "promotedContent",
        "isAd",
        "isAdvertisement",
        "isSponsored",
        "adMetadata",
        "adData",
        "adContext",
        "adTracking",
        "adImpressions",
        "googleAds",
        "dfpAds",
        "gptAds"
      ],
      // Tracking parameter patterns
      trackingParams: [
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_term",
        "utm_content",
        "fbclid",
        "gclid",
        "gclsrc",
        "dclid",
        "msclkid",
        "mc_eid",
        "mc_cid",
        "ref",
        "ref_src",
        "ref_url",
        "_hsenc",
        "_hsmi",
        "vero_id",
        "vero_conv",
        "wickedid",
        "wbraid",
        "gbraid"
      ],
      // Whitelist - known non-ad domains that might trigger heuristics
      whitelist: [
        "google.com",
        "googleapis.com",
        "googletagmanager.com",
        "facebook.com",
        "facebook.net",
        "connect.facebook.net",
        "twitter.com",
        "linkedin.com",
        "instagram.com",
        "github.com",
        "github.io",
        "githubusercontent.com",
        "cdn.jsdelivr.net",
        "unpkg.com",
        "raw.githubusercontent.com",
        "reddit.com",
        "redditstatic.com",
        "wikipedia.org",
        "wikimedia.org",
        "cloudflare.com",
        "cloudfront.net"
      ],
      // DOM selectors for common ad containers (for cosmetic filtering)
      adContainerSelectors: [
        // Generic
        '[class*="ad-"]',
        '[class*="-ad"]',
        '[class*="advert"]',
        '[id*="ad-"]',
        '[id*="-ad"]',
        '[id*="advert"]',
        "[data-ad]",
        "[data-ad-slot]",
        "[data-ad-client]",
        // Google
        ".adsbygoogle",
        "ins.adsbygoogle",
        '[id^="google_ads"]',
        '[id^="div-gpt-ad"]',
        ".dfp-ad",
        // Common ad networks
        ".taboola",
        "#taboola",
        '[id*="taboola"]',
        ".outbrain",
        "#outbrain",
        '[id*="outbrain"]',
        ".mgid",
        "#mgid",
        // Generic ad containers
        ".ad-container",
        ".ad-wrapper",
        ".ad-box",
        ".ad-banner",
        ".ad-slot",
        ".ad-unit",
        ".advertisement",
        ".sponsored-content",
        'iframe[src*="ads"]',
        'iframe[src*="doubleclick"]',
        'iframe[src*="googlesyndication"]'
      ]
    };
    class HeuristicScorer {
      constructor(config) {
        this.config = config;
      }
      scoreUrl(url) {
        if (!url) return 0;
        const urlLower = url.toLowerCase();
        let score = 0;
        for (const domain of this.config.adDomains) {
          if (urlLower.includes(domain.toLowerCase())) {
            score += 0.5;
            break;
          }
        }
        for (const pattern of this.config.adUrlPatterns) {
          if (pattern.test(url)) {
            score += 0.3;
            break;
          }
        }
        if (/\d{4,}/.test(url)) score += 0.1;
        if (/[?&](ad|ads)=/.test(url)) score += 0.2;
        return Math.min(score, 1);
      }
      isWhitelisted(url) {
        if (!url) return false;
        const urlLower = url.toLowerCase();
        return this.config.whitelist.some(
          (domain) => urlLower.includes(domain.toLowerCase())
        );
      }
    }
    class AdDataStripper {
      constructor(config) {
        this.config = config;
      }
      shouldStripKey(key) {
        return this.config.adJSONKeys.some(
          (adKey) => key.toLowerCase().includes(adKey.toLowerCase())
        );
      }
      strip(obj) {
        if (obj === null || obj === void 0) return obj;
        if (typeof obj !== "object") return obj;
        const isArray = Array.isArray(obj);
        const result = isArray ? [] : {};
        for (const key of Object.keys(obj)) {
          if (this.shouldStripKey(key)) {
            log("Stripping ad key:", key);
            continue;
          }
          try {
            result[key] = this.strip(obj[key]);
          } catch (e) {
            result[key] = obj[key];
          }
        }
        return result;
      }
      parseAndStrip(text) {
        try {
          const json = JSON.parse(text);
          const stripped = this.strip(json);
          return JSON.stringify(stripped);
        } catch (e) {
          return text;
        }
      }
    }
    class UniversalAdInterceptor {
      constructor() {
        this.scorer = new HeuristicScorer(CONFIG);
        this.stripper = new AdDataStripper(CONFIG);
        this._registry = {
          originalFetch: null,
          originalXHROpen: null,
          originalXHRSend: null,
          nativeFetchBaseline: null,
          nativeXHROpenBaseline: null,
          nativeXHRSendBaseline: null,
          fetchWrapper: null,
          xhrOpenWrapper: null,
          xhrSendWrapper: null,
          observers: [],
          policyRevision: null,
          hasHooks: false,
          _listenersAttached: false,
        };
      }
      get hasActiveHooks() {
        return this._registry.hasHooks;
      }
      async activate() {
        if (this.hasActiveHooks) return;
        if (typeof self.__ubrCapability === "undefined" || !self.__ubrCapability.check("interceptors")) return;
        const policy = typeof self2 !== "undefined" ? self2.__uborPagePolicy : null;
        const cs = policy && policy.contentScript ? policy.contentScript : {};
        const fetchWrapping = cs.fetchWrapping === true;
        const xhrMutation = cs.xhrMutation === true;
        const domMarking = cs.domMarking === true;
        this._registry.policyRevision = typeof self.__ubrCapability !== "undefined" ? self.__ubrCapability.getPolicyRevision() : null;
        let installed = false;
        if (fetchWrapping) installed = await this._installFetchInterceptor() || installed;
        if (xhrMutation) installed = await this._installXHRInterceptor() || installed;
        if (domMarking) installed = await this._initDOMObserver() || installed;
        if (!installed) {
          this._registry.hasHooks = false;
          return;
        }
        this._registry.hasHooks = true;
        log("Universal Ad Interceptor activated (fetch:", fetchWrapping, "xhr:", xhrMutation, "domMark:", domMarking, ")");
      }
      init() {
        this.activate();
        this._attachLifecycleListeners();
      }
      _attachLifecycleListeners() {
        if (this._registry._listenersAttached) return;
        this._registry._listenersAttached = true;
        self2.addEventListener("pagehide", () => {
          this.restoreAllInterceptors("pagehide");
        });
        self2.addEventListener("message", (event) => {
          if (event.data && event.data.type === "ubor:deactivate") {
            this.restoreAllInterceptors("sw-deactivate");
          }
        });
      }
      destroy() {
        this.restoreAllInterceptors("destroy");
      }
      restoreAllInterceptors(reason) {
        this.restoreFetch();
        this.restoreXHR();
        this.disconnectDomObservers();
        this._registry.hasHooks = false;
        this._registry.policyRevision = null;
        log("Universal Ad Interceptor hooks restored (reason:", reason, ")");
      }
      restoreFetch() {
        const r = this._registry;
        if (r.fetchWrapper && self2.fetch === r.fetchWrapper) {
          self2.fetch = r.originalFetch;
        }
        r.originalFetch = null;
        r.fetchWrapper = null;
      }
      restoreXHR() {
        const r = this._registry;
        if (r.xhrOpenWrapper && XMLHttpRequest.prototype.open === r.xhrOpenWrapper) {
          XMLHttpRequest.prototype.open = r.originalXHROpen;
        }
        if (r.xhrSendWrapper && XMLHttpRequest.prototype.send === r.xhrSendWrapper) {
          XMLHttpRequest.prototype.send = r.originalXHRSend;
        }
        r.originalXHROpen = null;
        r.originalXHRSend = null;
        r.xhrOpenWrapper = null;
        r.xhrSendWrapper = null;
      }
      disconnectDomObservers() {
        for (const obs of this._registry.observers) {
          try { obs.disconnect(); } catch (_) {}
        }
        this._registry.observers = [];
      }
      _checkLease() {
        if (typeof self.__ubrCapability === "undefined") return false;
        if (self.__ubrCapability.hasStaleTokens()) return false;
        const rev = self.__ubrCapability.getPolicyRevision();
        if (rev != null && this._registry.policyRevision != null && rev !== this._registry.policyRevision) return false;
        if (!self.__ubrCapability.check("interceptors")) return false;
        return true;
      }
      async _installFetchInterceptor() {
        if (typeof self.__ubrCapability === "undefined") return false;
        const ok = await self.__ubrCapability.validate("interceptors", "fetch-wrap");
        if (!ok) return false;
        const r = this._registry;
        r.nativeFetchBaseline = self2.fetch;
        r.originalFetch = self2.fetch;
        self2.fetch = async function(...args) {
          const r = interceptor._registry;
          const originalFetch = r.originalFetch;
          if (!originalFetch) return r.nativeFetchBaseline.apply(this, args);
          if (!interceptor._checkLease()) {
            interceptor.restoreAllInterceptors("lease-failed");
            return originalFetch.apply(this, args);
          }
          const [resource, options] = args;
          const url = typeof resource === "string" ? resource : resource?.url;
          if (url && interceptor.scorer.isWhitelisted(url)) {
            return originalFetch.apply(this, args);
          }
          const score = interceptor.scorer.scoreUrl(url);
          const shouldIntercept = score > 0.4;
          if (shouldIntercept) {
            log("Fetch to potential ad URL:", url, "score:", score);
          }
          const response = await originalFetch.apply(this, args);
          if (shouldIntercept && response.ok) {
            try {
              const clone = response.clone();
              const contentType = clone.headers.get("content-type") || "";
              if (contentType.includes("application/json") || contentType.includes("text/") || url.includes("player") || url.includes("ads") || url.includes("api")) {
                const text = await clone.text();
                const stripped = interceptor.stripper.parseAndStrip(text);
                if (stripped !== text) {
                  log("Stripped ad data from fetch response:", url);
                  if (typeof self.__ubrCapability === "undefined") return response;
                  const mutateOk = await self.__ubrCapability.validate("interceptors", "mutate-fetch-response");
                  if (!mutateOk) return response;
                  return new Response(stripped, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: new Headers(response.headers)
                  });
                }
              }
            } catch (e) {
            }
          }
          return response;
        };
        r.fetchWrapper = self2.fetch;
        log("Fetch interceptor installed");
        return true;
      }
      async _installXHRInterceptor() {
        if (typeof self.__ubrCapability === "undefined") return false;
        const ok = await self.__ubrCapability.validate("interceptors", "xhr-wrap");
        if (!ok) return false;
        const r = this._registry;
        r.nativeXHROpenBaseline = XMLHttpRequest.prototype.open;
        r.nativeXHRSendBaseline = XMLHttpRequest.prototype.send;
        r.originalXHROpen = XMLHttpRequest.prototype.open;
        r.originalXHRSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.open = function(method, url, ...rest) {
          const r = interceptor._registry;
          const originalOpen = r.originalXHROpen;
          if (!originalOpen) return r.nativeXHROpenBaseline.apply(this, [method, url, ...rest]);
          if (!interceptor._checkLease()) {
            interceptor.restoreAllInterceptors("lease-failed");
            return originalOpen.apply(this, [method, url, ...rest]);
          }
          this._ubor_url = url;
          this._ubor_score = url ? interceptor.scorer.scoreUrl(url) : 0;
          this._ubor_shouldIntercept = this._ubor_score > 0.4;
          if (this._ubor_shouldIntercept && !interceptor.scorer.isWhitelisted(url)) {
            log("XHR to potential ad URL:", url, "score:", this._ubor_score);
          }
          return originalOpen.apply(this, [method, url, ...rest]);
        };
        XMLHttpRequest.prototype.send = function(...args) {
          const r = interceptor._registry;
          const originalSend = r.originalXHRSend;
          if (!originalSend) return r.nativeXHRSendBaseline.apply(this, args);
          if (!interceptor._checkLease()) {
            interceptor.restoreAllInterceptors("lease-failed");
            return originalSend.apply(this, args);
          }
          if (this._ubor_shouldIntercept && !interceptor.scorer.isWhitelisted(this._ubor_url)) {
            this.addEventListener("load", async function() {
              if (typeof self.__ubrCapability === "undefined") return;
              if (typeof self.__ubrCapability.validate !== "function") return;
              if (!interceptor._checkLease()) return;
              const ok = await self.__ubrCapability.validate("interceptors", "mutate-xhr-response");
              if (!ok) return;
              if (this.status >= 200 && this.status < 300) {
                const contentType = this.getResponseHeader("content-type") || "";
                if (contentType.includes("application/json") || contentType.includes("text/") || this._ubor_url?.includes("player") || this._ubor_url?.includes("ads") || this._ubor_url?.includes("api")) {
                  try {
                    const stripped = interceptor.stripper.parseAndStrip(this.responseText);
                    if (stripped !== this.responseText) {
                      log("Stripped ad data from XHR response:", this._ubor_url);
                      Object.defineProperty(this, "responseText", {
                        value: stripped,
                        writable: false
                      });
                      if (this.response !== void 0) {
                        try {
                          Object.defineProperty(this, "response", {
                            value: stripped,
                            writable: false
                          });
                        } catch (e) {
                          console.warn("[uBR] universal-ad-interceptor: response defineProperty failed", e);
                        }
                      }
                    }
                  } catch (e) {
                    console.warn("[uBR] universal-ad-interceptor: ad stripping failed for", this._ubor_url, e);
                  }
                }
              }
            });
          }
          return originalSend.apply(this, args);
        };
        r.xhrOpenWrapper = XMLHttpRequest.prototype.open;
        r.xhrSendWrapper = XMLHttpRequest.prototype.send;
        log("XHR interceptor installed");
        return true;
      }
      async _initDOMObserver() {
        if (typeof self.__ubrCapability === "undefined") return false;
        const ok = await self.__ubrCapability.validate("interceptors", "observe-dom");
        if (!ok) return false;
        const r = this._registry;
        const observer = new MutationObserver((mutations) => {
          if (DEBUG) {
            for (const mutation of mutations) {
              for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  for (const selector of CONFIG.adContainerSelectors) {
                    if (node.matches && node.matches(selector)) {
                      log("Found potential ad container:", selector);
                      break;
                    }
                  }
                }
              }
            }
          }
        });
        r.observers.push(observer);
        if (document.body) {
          if (!this._checkLease()) {
            this.restoreAllInterceptors("lease-failed");
            return false;
          }
          observer.observe(document.body, { childList: true, subtree: true });
        } else {
          document.addEventListener("DOMContentLoaded", () => {
            if (document.body) {
              if (!interceptor._checkLease()) {
                interceptor.restoreAllInterceptors("lease-failed");
                return;
              }
              observer.observe(document.body, { childList: true, subtree: true });
            }
          });
        }
        log("DOM observer initialized (cosmetic filtering handled separately)");
        return true;
      }
    }
    const interceptor = new UniversalAdInterceptor();
    self2.__uborHeuristicInterceptor = interceptor;
    log("Universal Ad Interceptor ready (inactive, capabilities resolved at activate time)");
  })(typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : self);

  // src/js/contentscript/first-party-ad-detector.ts
  ((self2) => {
    const DEBUG = false;
    const LOG_PREFIX = "[FPAD] First-Party Ad Detector:";
    const log = (...args) => {
      if (DEBUG) {
        console.log(LOG_PREFIX, ...args);
      }
    };
    const CONFIG = {
      // Attributes that indicate ad containers
      adAttributes: [
        "data-ad",
        "data-ad-slot",
        "data-ad-client",
        "data-ad-unit",
        "data-advertisement",
        "data-advert",
        "data-ads",
        "data-ad-id",
        "data-google-query-id",
        "data-ad-status",
        "data-slot",
        "data-adunit",
        "data-dfp",
        "data-gpt"
      ],
      // ID patterns for ad containers
      adIdPatterns: [
        /^ad[-_]/i,
        /^ads[-_]/i,
        /^advert/i,
        /^sponsor/i,
        /[-_]ad$/i,
        /[-_]ads$/i,
        /[-_]advert/i,
        /^div[-_]gpt/i,
        /^google_ads/i,
        /^dfp[-_]/i,
        /adunit/i,
        /adslot/i,
        /adcontainer/i
      ],
      // Class patterns for ad containers
      adClassPatterns: [
        /^ad[-_]/i,
        /^ads[-_]/i,
        /^advert/i,
        /^sponsor/i,
        /[-_]ad$/i,
        /[-_]ads$/i,
        /[-_]advert/i,
        /ad[-_]?container/i,
        /ad[-_]?wrapper/i,
        /ad[-_]?box/i,
        /ad[-_]?banner/i,
        /ad[-_]?slot/i,
        /ad[-_]?unit/i,
        /ad[-_]?placeholder/i,
        /advertisement/i,
        /dfp[-_]/i,
        /gpt[-_]/i,
        /google[-_]?ads/i,
        /sponsored[-_]?content/i,
        /promoted[-_]?content/i
      ],
      // Known ad network iframe patterns
      adIframePatterns: [
        /doubleclick\.net/i,
        /googlesyndication/i,
        /googleadservices/i,
        /adnxs/i,
        /criteo/i,
        /taboola/i,
        /outbrain/i,
        /amazon-adsystem/i,
        /pubmatic/i,
        /rubicon/i,
        /facebook\.com\/ads/i,
        /linkedin/i,
        /twitter/i
      ],
      // Text patterns that indicate ad content
      adTextPatterns: [
        // English
        "advertisement",
        "sponsored",
        "promoted",
        "ad",
        "ads",
        "advert",
        // German
        "anzeige",
        "werbung",
        "gesponsert",
        "anzeigen",
        // French
        "publicit\xE9",
        "annonce",
        "sponsoris\xE9",
        "promu",
        // Spanish
        "anuncio",
        "publicidad",
        "patrocinado",
        "promocionado",
        // Italian
        "pubblicit\xE0",
        "annuncio",
        "sponsorizzato",
        "promosso",
        // Portuguese
        "an\xFAncio",
        "publicidade",
        "patrocinado",
        "promovido",
        // Dutch
        "advertentie",
        "reclame",
        "gesponsord",
        "bevorderd",
        // Russian (transliterated)
        "reklama",
        "reklamny",
        "sponsor",
        // Japanese (common loanwords)
        "koukoku",
        "\u5E83\u544A",
        "supons\u0101do",
        // Chinese
        "\u5E7F\u544A",
        "\u8D5E\u52A9",
        "\u63A8\u5E7F",
        // Korean
        "gwang-go",
        "\uAD11\uACE0",
        "jehwi"
      ],
      // Elements commonly used for ads
      adElementTypes: [
        "ins",
        // Google AdSense
        "iframe"
        // Ad iframes
      ],
      // Mutation observer config
      observerConfig: {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["id", "class", "data-ad", "data-ads"]
      },
      // Debounce delay for mutation processing
      debounceMs: 100,
      // Scan budget
      scanBudgetMaxNodes: 5e3,
      scanBudgetMaxMs: 50
    };
    class FirstPartyAdDetector {
      constructor(policy) {
        this.policy = policy || {};
        this.observer = null;
        this.pendingNodes = /* @__PURE__ */ new Set();
        this.debounceTimer = null;
        this.scanCount = 0;
        this.budgetTerminated = false;
      }
      start() {
        if (this.policy.firstPartyDomDetection !== true) return;
        if (document.body) {
          this.startObserver();
        } else {
          document.addEventListener("DOMContentLoaded", () => this.startObserver());
        }
        this.scanDocument();
        log("First-party ad detector started");
      }
      startObserver() {
        this.observer = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            if (mutation.type === "childList") {
              for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                  this.queueNode(node);
                }
              }
            } else if (mutation.type === "attributes") {
              if (mutation.target.nodeType === Node.ELEMENT_NODE) {
                this.queueNode(mutation.target);
              }
            }
          }
          this.scheduleProcessing();
        });
        this.observer.observe(document.documentElement, CONFIG.observerConfig);
        log("Mutation observer started");
      }
      queueNode(node) {
        this.pendingNodes.add(node);
      }
      scheduleProcessing() {
        if (this.debounceTimer) {
          clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = setTimeout(() => {
          this.processPendingNodes();
        }, CONFIG.debounceMs);
      }
      processPendingNodes() {
        const nodes = Array.from(this.pendingNodes);
        this.pendingNodes.clear();
        for (const node of nodes) {
          this.analyzeNode(node);
        }
      }
      analyzeNode(node) {
        if (!node || node.nodeType !== Node.ELEMENT_NODE) return;
        const tagName = node.tagName?.toLowerCase() || "";
        if (CONFIG.adElementTypes.includes(tagName)) {
          log("Found ad element type:", tagName);
          this.handleAdElement(node);
          return;
        }
        const id = node.getAttribute("id") || "";
        for (const pattern of CONFIG.adIdPatterns) {
          if (pattern.test(id)) {
            log("Found ad by ID pattern:", id);
            this.handleAdElement(node);
            return;
          }
        }
        const className = node.getAttribute("class") || "";
        for (const pattern of CONFIG.adClassPatterns) {
          if (pattern.test(className)) {
            log("Found ad by class pattern:", className.substring(0, 50));
            this.handleAdElement(node);
            return;
          }
        }
        for (const attr of CONFIG.adAttributes) {
          if (node.hasAttribute(attr)) {
            log("Found ad by attribute:", attr);
            this.handleAdElement(node);
            return;
          }
        }
        if (tagName === "iframe") {
          const src = node.getAttribute("src") || "";
          for (const pattern of CONFIG.adIframePatterns) {
            if (pattern.test(src)) {
              log("Found ad iframe by src pattern");
              this.handleAdElement(node);
              return;
            }
          }
        }
      }
      handleAdElement(node) {
        if (!node || node.nodeType !== Node.ELEMENT_NODE) return;
        if (node.classList.contains("ubor-ad-detected")) return;
        node.classList.add("ubor-ad-detected");
        if (node instanceof HTMLElement) {
          node.style.setProperty("isolation", "isolate", "important");
        }
        log("Detected ad element:", node.tagName, node.getAttribute("id") ? "(id)" : "(class)");
      }
      scanDocument() {
        const allElements = document.querySelectorAll("*");
        this.scanCount = 0;
        this.budgetTerminated = false;
        const startTime = performance.now();
        for (const el of allElements) {
          if (this.scanCount >= CONFIG.scanBudgetMaxNodes) {
            this.budgetTerminated = true;
            break;
          }
          if (performance.now() - startTime > CONFIG.scanBudgetMaxMs) {
            this.budgetTerminated = true;
            break;
          }
          this.analyzeNode(el);
          this.scanCount++;
        }
        log("Scanned", this.scanCount, "elements (budgeted)", this.budgetTerminated ? "[TERMINATED]" : "[OK]");
      }
      // Check if element contains "sponsored" or similar text
      // Privacy: returns boolean only, never exposes text content
      containsAdText(element) {
        const text = element.textContent?.toLowerCase() || "";
        for (const pattern of CONFIG.adTextPatterns) {
          if (text.includes(pattern.toLowerCase())) {
            return true;
          }
        }
        return false;
      }
      destroy() {
        if (this.observer) {
          this.observer.disconnect();
        }
        if (this.debounceTimer) {
          clearTimeout(this.debounceTimer);
        }
        log("Detector destroyed");
      }
    }
    self2.__uborFirstPartyAdDetectorFactory = (policy) => {
      const detector = new FirstPartyAdDetector(policy);
      detector.start();
      return detector;
    };
  })(typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : self);

  // src/js/contentscript/04-dom-filterer.ts
  var DOMFilterer = class {
    constructor() {
      __publicField(this, "commitTimer");
      __publicField(this, "disabled");
      __publicField(this, "listeners");
      __publicField(this, "stylesheets");
      __publicField(this, "exceptedCSSRules");
      __publicField(this, "exceptions");
      __publicField(this, "convertedProceduralFilters");
      __publicField(this, "proceduralFilterer");
      this.commitTimer = new vAPI.SafeAnimationFrame(
        () => {
          this.commitNow();
        }
      );
      this.disabled = false;
      this.listeners = [];
      this.stylesheets = [];
      this.exceptedCSSRules = [];
      this.exceptions = [];
      this.convertedProceduralFilters = [];
      this.proceduralFilterer = null;
    }
    explodeCSS(css) {
      const out = [];
      const cssHide = `{${vAPI.hideStyle}}`;
      const blocks = css.trim().split(/\n\n+/);
      for (const block of blocks) {
        if (block.endsWith(cssHide) === false) {
          continue;
        }
        out.push(block.slice(0, -cssHide.length).trim());
      }
      return out;
    }
    addCSS(css, details = {}) {
      if (typeof css !== "string" || css.length === 0) {
        return;
      }
      if (this.stylesheets.includes(css)) {
        return;
      }
      this.stylesheets.push(css);
      if (details.mustInject && this.disabled === false) {
        vAPI.userStylesheet.add(css);
      }
      if (this.hasListeners() === false) {
        return;
      }
      if (details.silent) {
        return;
      }
      this.triggerListeners({ declarative: this.explodeCSS(css) });
    }
    exceptCSSRules(exceptions) {
      if (exceptions.length === 0) {
        return;
      }
      this.exceptedCSSRules.push(...exceptions);
      if (this.hasListeners()) {
        this.triggerListeners({ exceptions });
      }
    }
    addListener(listener) {
      if (this.listeners.indexOf(listener) !== -1) {
        return;
      }
      this.listeners.push(listener);
    }
    removeListener(listener) {
      const pos = this.listeners.indexOf(listener);
      if (pos === -1) {
        return;
      }
      this.listeners.splice(pos, 1);
    }
    hasListeners() {
      return this.listeners.length !== 0;
    }
    triggerListeners(changes) {
      for (const listener of this.listeners) {
        listener.onFiltersetChanged(changes);
      }
    }
    toggle(state, callback) {
      if (state === void 0) {
        state = this.disabled;
      }
      if (state !== this.disabled) {
        return;
      }
      this.disabled = !state;
      const uss = vAPI.userStylesheet;
      for (const css of this.stylesheets) {
        if (this.disabled) {
          uss.remove(css);
        } else {
          uss.add(css);
        }
      }
      uss.apply(callback);
    }
    commitNow() {
      this.commitTimer.clear();
      if (vAPI instanceof Object === false) {
        return;
      }
      vAPI.userStylesheet.apply();
      if (this.proceduralFilterer instanceof Object) {
        this.proceduralFilterer.commitNow();
      }
    }
    commit(commitNow) {
      if (commitNow) {
        this.commitTimer.clear();
        this.commitNow();
      } else {
        this.commitTimer.start();
      }
    }
    proceduralFiltererInstance() {
      if (this.proceduralFilterer instanceof Object === false) {
        if (vAPI.DOMProceduralFilterer instanceof Object === false) {
          return null;
        }
        this.proceduralFilterer = new vAPI.DOMProceduralFilterer(this);
      }
      return this.proceduralFilterer;
    }
    addProceduralSelectors(selectors) {
      const procedurals = [];
      const sanitized = typeof vAPI.sanitizeProceduralSelectorsForPage === "function" ? vAPI.sanitizeProceduralSelectorsForPage(selectors) : selectors;
      for (const raw of sanitized) {
        procedurals.push(JSON.parse(raw));
      }
      if (procedurals.length === 0) {
        return;
      }
      const pfilterer = this.proceduralFiltererInstance();
      if (pfilterer !== null) {
        pfilterer.addProceduralSelectors(procedurals);
      }
    }
    createProceduralFilter(o) {
      const pfilterer = this.proceduralFiltererInstance();
      if (pfilterer === null) {
        return;
      }
      return pfilterer.createProceduralFilter(o);
    }
    getAllSelectors(bits = 0) {
      const out = {
        declarative: [],
        exceptions: this.exceptedCSSRules
      };
      const hasProcedural = this.proceduralFilterer instanceof Object;
      const includePrivateSelectors = (bits & 1) !== 0;
      const masterToken = hasProcedural ? `[${this.proceduralFilterer.masterToken}]` : void 0;
      for (const css of this.stylesheets) {
        for (const block of this.explodeCSS(css)) {
          if (includePrivateSelectors === false && masterToken !== void 0 && block.startsWith(masterToken)) {
            continue;
          }
          out.declarative.push(block);
        }
      }
      const excludeProcedurals = (bits & 2) !== 0;
      if (excludeProcedurals === false) {
        out.procedural = [];
        if (hasProcedural) {
          out.procedural.push(
            ...this.proceduralFilterer.selectors.values()
          );
        }
        const proceduralFilterer = this.proceduralFiltererInstance();
        if (proceduralFilterer !== null) {
          for (const json of this.convertedProceduralFilters) {
            const pfilter = proceduralFilterer.createProceduralFilter(json);
            pfilter.converted = true;
            out.procedural.push(pfilter);
          }
        }
      }
      return out;
    }
    getAllExceptionSelectors() {
      return this.exceptions.join(",\n");
    }
  };
  function initDOMFilterer() {
    vAPI.hideStyle = "display:none!important;";
    vAPI.DOMFilterer = DOMFilterer;
    return vAPI.DOMFilterer;
  }

  // src/js/contentscript/02-csp-listener.ts
  function initCSPlistener() {
    const newEvents = /* @__PURE__ */ new Set();
    const allEvents = /* @__PURE__ */ new Set();
    let timer;
    const send = function() {
      if (vAPI instanceof Object === false) {
        return;
      }
      Promise.resolve(vAPI.messaging?.send?.("scriptlets", {
        what: "securityPolicyViolation",
        type: "net",
        docURL: document.location.href,
        violations: Array.from(newEvents)
      })).then((response) => {
        if (response === true) {
          return;
        }
        stop();
      }).catch((e) => {
        console.warn("[uBR] csp-listener: securityPolicyViolation send failed", e);
      });
      for (const event of newEvents) {
        allEvents.add(event);
      }
      newEvents.clear();
    };
    const sendAsync = function() {
      if (timer !== void 0) {
        return;
      }
      timer = self.requestIdleCallback(
        () => {
          timer = void 0;
          send();
        },
        { timeout: 2063 }
      );
    };
    const listener = function(ev) {
      const cspEv = ev;
      if (cspEv.isTrusted !== true) {
        return;
      }
      if (cspEv.disposition !== "enforce") {
        return;
      }
      const json = JSON.stringify({
        url: cspEv.blockedURL || cspEv.blockedURI,
        policy: cspEv.originalPolicy,
        directive: cspEv.effectiveDirective || cspEv.violatedDirective
      });
      if (allEvents.has(json)) {
        return;
      }
      newEvents.add(json);
      sendAsync();
    };
    const stop = function() {
      newEvents.clear();
      allEvents.clear();
      if (timer !== void 0) {
        self.cancelIdleCallback(timer);
        timer = void 0;
      }
      document.removeEventListener("securitypolicyviolation", listener);
      if (vAPI?.shutdown?.remove instanceof Function) {
        vAPI.shutdown.remove(stop);
      }
    };
    document.addEventListener("securitypolicyviolation", listener);
    if (vAPI?.shutdown?.add instanceof Function) {
      vAPI.shutdown.add(stop);
    }
    sendAsync();
  }

  // src/js/contentscript/03-dom-watcher.ts
  function initDOMWatcher(afterInit) {
    vAPI.domMutationTime = Date.now();
    const addedNodeLists = [];
    const removedNodeLists = [];
    const addedNodes = [];
    const ignoreTags = /* @__PURE__ */ new Set(["br", "head", "link", "meta", "script", "style"]);
    const listeners = [];
    let domLayoutObserver;
    let listenerIterator = [];
    let listenerIteratorDirty = false;
    let removedNodes = false;
    let safeObserverHandlerTimer;
    const safeObserverHandler = function() {
      let i = addedNodeLists.length;
      while (i--) {
        const nodeList = addedNodeLists[i];
        let iNode = nodeList.length;
        while (iNode--) {
          const node = nodeList[iNode];
          if (node.nodeType !== 1) {
            continue;
          }
          if (ignoreTags.has(node.localName)) {
            continue;
          }
          if (node.parentElement === null) {
            continue;
          }
          addedNodes.push(node);
        }
      }
      addedNodeLists.length = 0;
      i = removedNodeLists.length;
      while (i-- && removedNodes === false) {
        const nodeList = removedNodeLists[i];
        let iNode = nodeList.length;
        while (iNode--) {
          if (nodeList[iNode].nodeType !== 1) {
            continue;
          }
          removedNodes = true;
          break;
        }
      }
      removedNodeLists.length = 0;
      if (addedNodes.length === 0 && removedNodes === false) {
        return;
      }
      for (const listener of getListenerIterator()) {
        try {
          listener.onDOMChanged(addedNodes, removedNodes);
        } catch (e) {
          console.warn("[uBR] dom-watcher: onDOMChanged listener failed", e);
        }
      }
      addedNodes.length = 0;
      removedNodes = false;
      vAPI.domMutationTime = Date.now();
    };
    const observerHandler = function(mutations) {
      let i = mutations.length;
      while (i--) {
        const mutation = mutations[i];
        if (mutation.addedNodes.length !== 0) {
          addedNodeLists.push(mutation.addedNodes);
        }
        if (mutation.removedNodes.length !== 0) {
          removedNodeLists.push(mutation.removedNodes);
        }
      }
      if (addedNodeLists.length !== 0 || removedNodeLists.length !== 0) {
        safeObserverHandlerTimer.start(
          addedNodeLists.length < 100 ? 1 : void 0
        );
      }
    };
    const startMutationObserver = function() {
      if (domLayoutObserver !== void 0) {
        return;
      }
      domLayoutObserver = new MutationObserver(observerHandler);
      domLayoutObserver.observe(document, {
        childList: true,
        subtree: true
      });
      safeObserverHandlerTimer = new vAPI.SafeAnimationFrame(safeObserverHandler);
      if (vAPI?.shutdown?.add instanceof Function) {
        vAPI.shutdown.add(cleanup);
      }
    };
    const stopMutationObserver = function() {
      if (domLayoutObserver === void 0) {
        return;
      }
      cleanup();
      if (vAPI?.shutdown?.remove instanceof Function) {
        vAPI.shutdown.remove(cleanup);
      }
    };
    const getListenerIterator = function() {
      if (listenerIteratorDirty) {
        listenerIterator = listeners.slice();
        listenerIteratorDirty = false;
      }
      return listenerIterator;
    };
    const addListener = function(listener) {
      if (listeners.indexOf(listener) !== -1) {
        return;
      }
      listeners.push(listener);
      listenerIteratorDirty = true;
      if (domLayoutObserver === void 0) {
        return;
      }
      try {
        listener.onDOMCreated();
      } catch (e) {
        console.warn("[uBR] dom-watcher: addListener onDOMCreated failed", e);
      }
      startMutationObserver();
    };
    const removeListener = function(listener) {
      const pos = listeners.indexOf(listener);
      if (pos === -1) {
        return;
      }
      listeners.splice(pos, 1);
      listenerIteratorDirty = true;
      if (listeners.length === 0) {
        stopMutationObserver();
      }
    };
    const cleanup = function() {
      if (domLayoutObserver !== void 0) {
        domLayoutObserver.disconnect();
        domLayoutObserver = void 0;
      }
      if (safeObserverHandlerTimer !== void 0) {
        safeObserverHandlerTimer.clear();
        safeObserverHandlerTimer = void 0;
      }
    };
    const start = function() {
      for (const listener of getListenerIterator()) {
        try {
          listener.onDOMCreated();
        } catch (e) {
          console.warn("[uBR] dom-watcher: start onDOMCreated failed", e);
        }
      }
      startMutationObserver();
    };
    initCSPlistener();
    vAPI.domWatcher = { start, addListener, removeListener };
    if (typeof afterInit === "function") {
      afterInit();
    }
  }

  // src/js/contentscript/05-dom-collapser.ts
  function initDOMCollapser() {
    const messaging = vAPI.messaging;
    const toCollapse = /* @__PURE__ */ new Map();
    const src1stProps = {
      audio: "currentSrc",
      embed: "src",
      iframe: "src",
      img: "currentSrc",
      object: "data",
      video: "currentSrc"
    };
    const src2ndProps = {
      audio: "src",
      img: "src",
      video: "src"
    };
    const tagToTypeMap = {
      audio: "media",
      embed: "object",
      iframe: "sub_frame",
      img: "image",
      object: "object",
      video: "media"
    };
    let requestIdGenerator = 1;
    let processTimer;
    let cachedBlockedSet;
    let cachedBlockedSetHash;
    let cachedBlockedSetTimer;
    let toProcess = [];
    let toFilter = [];
    let netSelectorCacheCount = 0;
    const cachedBlockedSetClear = function() {
      cachedBlockedSet = void 0;
      cachedBlockedSetHash = void 0;
      cachedBlockedSetTimer = void 0;
    };
    let collapseToken;
    const getCollapseToken = () => {
      if (collapseToken === void 0) {
        collapseToken = vAPI.randomToken();
        vAPI.userStylesheet.add(
          `[${collapseToken}]
{display:none!important;}`,
          true
        );
      }
      return collapseToken;
    };
    const onProcessed = function(response) {
      if (response instanceof Object === false) {
        toCollapse.clear();
        return;
      }
      const res = response;
      const targets = toCollapse.get(res.id);
      if (targets === void 0) {
        return;
      }
      toCollapse.delete(res.id);
      if (cachedBlockedSetHash !== res.hash) {
        cachedBlockedSet = new Set(res.blockedResources);
        cachedBlockedSetHash = res.hash;
        if (cachedBlockedSetTimer !== void 0) {
          clearTimeout(cachedBlockedSetTimer);
        }
        cachedBlockedSetTimer = vAPI.setTimeout(cachedBlockedSetClear, 3e4);
      }
      if (cachedBlockedSet === void 0 || cachedBlockedSet.size === 0) {
        return;
      }
      const selectors = [];
      const netSelectorCacheCountMax = 0;
      for (const target of targets) {
        const tag = target.localName;
        if (tag === void 0) continue;
        let prop = src1stProps[tag];
        if (prop === void 0) {
          continue;
        }
        let src = target[prop];
        if (typeof src !== "string" || src.length === 0) {
          prop = src2ndProps[tag];
          if (prop === void 0) {
            continue;
          }
          src = target[prop];
          if (typeof src !== "string" || src.length === 0) {
            continue;
          }
        }
        if (cachedBlockedSet.has(`${tagToTypeMap[tag]} ${src}`) === false) {
          continue;
        }
        target.setAttribute(getCollapseToken(), "");
        if (netSelectorCacheCount > netSelectorCacheCountMax) {
          continue;
        }
        const value = target.getAttribute(prop);
        if (value) {
          selectors.push(`${tag}[${prop}="${CSS.escape(value)}"]`);
          netSelectorCacheCount += 1;
        }
      }
      if (selectors.length === 0) {
        return;
      }
      messaging.send("contentscript", {
        what: "cosmeticFiltersInjected",
        type: "net",
        hostname: window.location.hostname,
        selectors
      });
    };
    const send = function() {
      processTimer = void 0;
      toCollapse.set(requestIdGenerator, toProcess);
      messaging.send("contentscript", {
        what: "getCollapsibleBlockedRequests",
        id: requestIdGenerator,
        frameURL: window.location.href,
        resources: toFilter,
        hash: cachedBlockedSetHash
      }).then((response) => {
        onProcessed(response);
      });
      toProcess = [];
      toFilter = [];
      requestIdGenerator += 1;
    };
    const process = function(delay) {
      if (toProcess.length === 0) {
        return;
      }
      if (delay === 0) {
        if (processTimer !== void 0) {
          clearTimeout(processTimer);
        }
        send();
      } else if (processTimer === void 0) {
        processTimer = vAPI.setTimeout(send, delay || 20);
      }
    };
    const add = function(target) {
      toProcess[toProcess.length] = target;
    };
    const addMany = function(targets) {
      for (const target of targets) {
        add(target);
      }
    };
    const iframeSourceModified = function(mutations) {
      for (const mutation of mutations) {
        addIFrame(mutation.target, true);
      }
      process();
    };
    const iframeSourceObserver = new MutationObserver(iframeSourceModified);
    const iframeSourceObserverOptions = {
      attributes: true,
      attributeFilter: ["src"]
    };
    const addIFrame = function(iframe, dontObserve) {
      if (dontObserve !== true) {
        iframeSourceObserver.observe(iframe, iframeSourceObserverOptions);
      }
      const src = iframe.src;
      if (typeof src !== "string" || src === "") {
        return;
      }
      if (src.startsWith("http") === false) {
        return;
      }
      toFilter.push({ type: "sub_frame", url: iframe.src });
      add(iframe);
    };
    const addIFrames = function(iframes) {
      for (const iframe of iframes) {
        addIFrame(iframe);
      }
    };
    const onResourceFailed = function(ev) {
      const target = ev.target;
      if (target && tagToTypeMap[target.localName] !== void 0) {
        add(target);
        process();
      }
    };
    const stop = function() {
      document.removeEventListener("error", onResourceFailed, true);
      if (processTimer !== void 0) {
        clearTimeout(processTimer);
      }
      if (vAPI.domWatcher instanceof Object) {
        vAPI.domWatcher.removeListener(domWatcherInterface);
      }
      vAPI.shutdown.remove(stop);
      vAPI.domCollapser = null;
    };
    const start = function() {
      if (vAPI.domWatcher instanceof Object) {
        vAPI.domWatcher.addListener(domWatcherInterface);
      }
    };
    const domWatcherInterface = {
      onDOMCreated() {
        if (vAPI instanceof Object === false) {
          return;
        }
        if (vAPI.domCollapser instanceof Object === false) {
          if (vAPI.domWatcher instanceof Object) {
            vAPI.domWatcher.removeListener(domWatcherInterface);
          }
          return;
        }
        const elems = document.images || document.getElementsByTagName("img");
        for (const elem of elems) {
          if (elem.complete) {
            add(elem);
          }
        }
        const embeds = document.embeds || document.getElementsByTagName("embed");
        addMany(Array.from(embeds));
        addMany(Array.from(document.getElementsByTagName("object")));
        addIFrames(document.getElementsByTagName("iframe"));
        process(0);
        document.addEventListener("error", onResourceFailed, true);
        vAPI.shutdown.add(stop);
      },
      onDOMChanged(addedNodes) {
        if (addedNodes.length === 0) {
          return;
        }
        for (const node of addedNodes) {
          const elem = node;
          if (elem.localName === "iframe") {
            addIFrame(elem);
          }
          if (elem.firstElementChild === null) {
            continue;
          }
          const iframes = elem.getElementsByTagName("iframe");
          if (iframes.length !== 0) {
            addIFrames(iframes);
          }
        }
        process();
      }
    };
    vAPI.domCollapser = { start };
  }

  // src/js/contentscript/06-dom-surveyor.ts
  function initDOMSurveyor() {
    const queriedHashes = /* @__PURE__ */ new Set();
    const newHashes = /* @__PURE__ */ new Set();
    const maxSurveyNodes = 65536;
    const pendingLists = [];
    const pendingNodes = [];
    const processedSet = /* @__PURE__ */ new Set();
    const ignoreTags = Object.assign(/* @__PURE__ */ Object.create(null), {
      br: 1,
      head: 1,
      link: 1,
      meta: 1,
      script: 1,
      style: 1
    });
    let domObserver;
    let domFilterer;
    let hostname = "";
    let domChanged = false;
    let scannedCount = 0;
    let stopped = false;
    const hashFromStr = (type, s) => {
      const len = s.length;
      const step = len + 7 >>> 3;
      let hash = (type << 5) + type ^ len;
      for (let i = 0; i < len; i += step) {
        hash = (hash << 5) + hash ^ s.charCodeAt(i);
      }
      return hash & 16777215;
    };
    const addHashes = (hashes) => {
      for (const hash of hashes) {
        queriedHashes.add(hash);
      }
    };
    const qsa = (context, selector) => Array.from(context.querySelectorAll(selector));
    const addPendingList = (list) => {
      if (list.length === 0) {
        return;
      }
      pendingLists.push(list);
    };
    const nextPendingNodes = () => {
      if (pendingLists.length === 0) {
        return 0;
      }
      const bufferSize = 256;
      let j = 0;
      do {
        const nodeList = pendingLists[0];
        let n = bufferSize - j;
        if (n > nodeList.length) {
          n = nodeList.length;
        }
        for (let i = 0; i < n; i++) {
          pendingNodes[j + i] = nodeList[i];
        }
        j += n;
        if (n !== nodeList.length) {
          pendingLists[0] = nodeList.slice(n);
          break;
        }
        pendingLists.shift();
      } while (j < bufferSize && pendingLists.length !== 0);
      return j;
    };
    const hasPendingNodes = () => {
      return pendingLists.length !== 0 || newHashes.size !== 0;
    };
    const idFromNode = (node) => {
      const raw = node.id;
      if (typeof raw !== "string" || raw.length === 0) {
        return;
      }
      const hash = hashFromStr(35, raw.trim());
      if (queriedHashes.has(hash)) {
        return;
      }
      queriedHashes.add(hash);
      newHashes.add(hash);
    };
    const classesFromNode = (node) => {
      const s = node.getAttribute("class");
      if (typeof s !== "string") {
        return;
      }
      const len = s.length;
      for (let beg = 0, end = 0; beg < len; beg += 1) {
        end = s.indexOf(" ", beg);
        if (end === beg) {
          continue;
        }
        if (end === -1) {
          end = len;
        }
        const token = s.slice(beg, end).trimEnd();
        beg = end;
        if (token.length === 0) {
          continue;
        }
        const hash = hashFromStr(46, token);
        if (queriedHashes.has(hash)) {
          continue;
        }
        queriedHashes.add(hash);
        newHashes.add(hash);
      }
    };
    const getSurveyResults = (safeOnly) => {
      if (vAPI?.messaging === void 0) {
        return stop();
      }
      const promise = newHashes.size === 0 ? Promise.resolve(null) : vAPI.messaging.send("contentscript", {
        what: "retrieveGenericCosmeticSelectors",
        hostname,
        hashes: Array.from(newHashes),
        exceptions: domFilterer.exceptions,
        safeOnly
      });
      promise.then((response) => {
        processSurveyResults(response);
      });
      newHashes.clear();
    };
    const doSurvey = () => {
      const t0 = performance.now();
      const nodes = pendingNodes;
      const deadline = t0 + 4;
      let scanned = 0;
      for (; ; ) {
        const n = nextPendingNodes();
        if (n === 0) {
          break;
        }
        for (let i = 0; i < n; i++) {
          const node = nodes[i];
          nodes[i] = null;
          if (domChanged) {
            if (processedSet.has(node)) {
              continue;
            }
            processedSet.add(node);
          }
          idFromNode(node);
          classesFromNode(node);
          scanned += 1;
        }
        if (performance.now() >= deadline) {
          break;
        }
      }
      scannedCount += scanned;
      if (scannedCount >= maxSurveyNodes) {
        stop();
      }
      processedSet.clear();
      getSurveyResults(false);
    };
    const surveyTimer = new vAPI.SafeAnimationFrame(doSurvey);
    let canShutdownAfter = Date.now() + 3e5;
    let surveyResultMissCount = 0;
    const processSurveyResults = (response) => {
      if (stopped) {
        return;
      }
      const res = response;
      const result = res && res.result;
      let mustCommit = false;
      if (result) {
        const css = result.injectedCSS;
        if (typeof css === "string" && css.length !== 0) {
          const sanitizedCSS = typeof vAPI.sanitizeCosmeticCSSForPage === "function" ? vAPI.sanitizeCosmeticCSSForPage(css) : css;
          if (sanitizedCSS.length !== 0) {
            domFilterer.addCSS(sanitizedCSS);
            mustCommit = true;
          }
        }
        const selectors = result.excepted;
        if (Array.isArray(selectors) && selectors.length !== 0) {
          domFilterer.exceptCSSRules(selectors);
        }
      }
      if (hasPendingNodes()) {
        surveyTimer.start(1);
      }
      if (mustCommit) {
        surveyResultMissCount = 0;
        canShutdownAfter = Date.now() + 3e5;
        return;
      }
      surveyResultMissCount += 1;
      if (surveyResultMissCount < 256 || Date.now() < canShutdownAfter) {
        return;
      }
      stop();
      vAPI.messaging.send("contentscript", {
        what: "disableGenericCosmeticFilteringSurveyor",
        hostname
      });
    };
    const onDomChanged = (mutations) => {
      domChanged = true;
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          const { addedNodes } = mutation;
          if (addedNodes.length === 0) {
            continue;
          }
          for (const node of addedNodes) {
            if (node.nodeType !== 1) {
              continue;
            }
            const elem = node;
            if (ignoreTags[elem.localName]) {
              continue;
            }
            if (elem.parentElement === null) {
              continue;
            }
            addPendingList([elem]);
            if (elem.firstElementChild === null) {
              continue;
            }
            addPendingList(qsa(elem, "[id],[class]"));
          }
        } else if (mutation.attributeName === "class") {
          classesFromNode(mutation.target);
        } else {
          idFromNode(mutation.target);
        }
      }
      if (hasPendingNodes()) {
        surveyTimer.start();
      }
    };
    const start = (details) => {
      if (vAPI?.domFilterer === void 0) {
        return stop();
      }
      hostname = details.hostname;
      domFilterer = vAPI.domFilterer;
      if (document.documentElement !== null) {
        idFromNode(document.documentElement);
        classesFromNode(document.documentElement);
      }
      if (document.body !== null) {
        idFromNode(document.body);
        classesFromNode(document.body);
      }
      if (newHashes.size !== 0) {
        getSurveyResults(true);
      }
      addPendingList(qsa(document, "[id],[class]"));
      if (hasPendingNodes()) {
        surveyTimer.start();
      }
      domObserver = new MutationObserver(onDomChanged);
      domObserver.observe(document, {
        attributeFilter: ["class", "id"],
        attributes: true,
        childList: true,
        subtree: true
      });
    };
    const stop = () => {
      stopped = true;
      pendingLists.length = 0;
      surveyTimer.clear();
      if (domObserver) {
        domObserver.disconnect();
        domObserver = void 0;
      }
      if (vAPI?.domSurveyor) {
        vAPI.domSurveyor = null;
      }
    };
    vAPI.domSurveyor = { start, addHashes };
  }

  // src/js/contentscript/07-bootstrap.ts
  var blockLikeTags = /* @__PURE__ */ new Set([
    "article",
    "aside",
    "div",
    "li",
    "main",
    "section"
  ]);
  var userFilterStyleId = "ublock-resurrected-user-filters";
  var reportStoredUserCosmeticBlockCount = (selectors, clear = false) => {
    const matched = /* @__PURE__ */ new Set();
    for (const selector of selectors) {
      try {
        for (const element of document.querySelectorAll(selector)) {
          matched.add(element);
        }
      } catch (e) {
        console.warn("[uBR] bootstrap: querySelectorAll failed for selector", selector, e);
      }
    }
    try {
      void vAPI.messaging.send("contentscript", {
        what: "cosmeticBlockCount",
        count: matched.size,
        clear
      });
    } catch (e) {
      console.warn("[uBR] bootstrap: cosmeticBlockCount send failed", e);
    }
  };
  var authorizeCosmetic = async (action) => {
    if (typeof self.__ubrCapability === "undefined") return false;
    if (!self.__ubrCapability.check("cosmetic")) return false;
    return await self.__ubrCapability.validate("cosmetic", action);
  };
  var removeStoredUserFilterStyle = async () => {
    if (!await authorizeCosmetic("remove-style")) return;
    document.getElementById(userFilterStyleId)?.remove();
    reportStoredUserCosmeticBlockCount([], true);
  };
  var storageGet = (keys) => {
    const browserAPI = globalThis.browser;
    if (browserAPI?.storage?.local?.get instanceof Function) {
      return browserAPI.storage.local.get(keys);
    }
    const chromeAPI = globalThis.chrome;
    if (chromeAPI?.storage?.local?.get instanceof Function) {
      return new Promise((resolve) => {
        chromeAPI.storage.local.get(
          keys,
          (bin) => resolve(bin || {})
        );
      });
    }
    return Promise.resolve({});
  };
  var storageSet = (items) => {
    const browserAPI = globalThis.browser;
    if (browserAPI?.storage?.local?.set instanceof Function) {
      return browserAPI.storage.local.set(items);
    }
    const chromeAPI = globalThis.chrome;
    if (chromeAPI?.storage?.local?.set instanceof Function) {
      return new Promise((resolve) => {
        chromeAPI.storage.local.set(items, () => resolve());
      });
    }
    return Promise.resolve();
  };
  var storageRemove = (keys) => {
    const browserAPI = globalThis.browser;
    if (browserAPI?.storage?.local?.remove instanceof Function) {
      return browserAPI.storage.local.remove(keys);
    }
    const chromeAPI = globalThis.chrome;
    if (chromeAPI?.storage?.local?.remove instanceof Function) {
      return new Promise((resolve) => {
        chromeAPI.storage.local.remove(keys, () => resolve());
      });
    }
    return Promise.resolve();
  };
  var youtubeUIProtectedIds = [
    "container",
    "center",
    "start",
    "end",
    "guide-button",
    "logo",
    "search-button-narrow",
    "voice-search-button"
  ];
  var isYouTubeHostname = (hostname) => hostname === "youtube.com" || hostname.endsWith(".youtube.com") || hostname === "youtu.be";
  var youtubeProtectedProbeElements;
  var getYouTubeProtectedProbeElements = () => {
    if (youtubeProtectedProbeElements !== void 0) {
      return youtubeProtectedProbeElements;
    }
    const probeDocument = document.implementation.createHTMLDocument("");
    const masthead = document.createElement("ytd-masthead");
    masthead.className = "style-scope ytd-app";
    const container = document.createElement("div");
    container.id = "container";
    container.className = "style-scope ytd-masthead";
    const start = document.createElement("div");
    start.id = "start";
    start.className = "style-scope ytd-masthead";
    const center = document.createElement("div");
    center.id = "center";
    center.className = "style-scope ytd-masthead";
    const end = document.createElement("div");
    end.id = "end";
    end.className = "style-scope ytd-masthead";
    const searchbox = document.createElement("yt-searchbox");
    searchbox.className = "ytSearchboxComponentHost ytd-masthead";
    const guideButton = document.createElement("yt-icon-button");
    guideButton.id = "guide-button";
    guideButton.className = "style-scope ytd-masthead";
    const logo = document.createElement("ytd-topbar-logo-renderer");
    logo.id = "logo";
    logo.className = "style-scope ytd-masthead";
    const narrowSearch = document.createElement("yt-icon-button");
    narrowSearch.id = "search-button-narrow";
    narrowSearch.className = "style-scope ytd-masthead";
    const voiceSearch = document.createElement("div");
    voiceSearch.id = "voice-search-button";
    voiceSearch.className = "style-scope ytd-masthead";
    center.append(searchbox, narrowSearch, voiceSearch);
    start.append(guideButton, logo);
    container.append(start, center, end);
    masthead.append(container);
    probeDocument.body.append(masthead);
    youtubeProtectedProbeElements = [
      masthead,
      container,
      start,
      center,
      end,
      searchbox,
      guideButton,
      logo,
      narrowSearch,
      voiceSearch
    ];
    return youtubeProtectedProbeElements;
  };
  var selectorMatchesAny = (selector, elements) => {
    for (const element of elements) {
      try {
        if (element.matches(selector)) {
          return true;
        }
      } catch {
        return false;
      }
    }
    return false;
  };
  var selectorMatchesYouTubeProtectedUI = (selector) => {
    const actual = Array.from(
      document.querySelectorAll(
        [
          "ytd-masthead",
          "ytd-masthead #container",
          "ytd-masthead #start",
          "ytd-masthead #center",
          "ytd-masthead #end",
          "ytd-masthead yt-searchbox",
          "ytd-masthead #guide-button",
          "ytd-masthead #logo",
          "ytd-masthead #search-button-narrow",
          "ytd-masthead #voice-search-button"
        ].join(",")
      )
    );
    return selectorMatchesAny(selector, actual) || selectorMatchesAny(selector, getYouTubeProtectedProbeElements());
  };
  var selectorTargetsYouTubeMasthead = (selector) => {
    const normalized = selector.toLowerCase();
    const compact = normalized.replace(/\s+/g, "");
    if (normalized.includes("ytd-masthead") || normalized.includes("ytd-topbar") || normalized.includes("yt-searchbox")) {
      return true;
    }
    if (compact === ".style-scope" || compact === "*.style-scope" || compact === "div.style-scope" || /\[class[*~|^$]?=(["'])?style-scope\1?\]/.test(compact)) {
      return true;
    }
    const idGroup = youtubeUIProtectedIds.join("|");
    return new RegExp(`(^|[^\\w-])#(?:${idGroup})(?:$|[^\\w-])`).test(normalized) || new RegExp(`\\[id\\s*=\\s*["']?(?:${idGroup})["']?\\]`).test(normalized) || selectorMatchesYouTubeProtectedUI(selector);
  };
  var removeStaleYouTubeMastheadRules = (text, _pageHostname) => ({
    content: text.trimEnd(),
    removed: []
  });
  var cleanupStoredYouTubeMastheadFilters = async (bin, pageHostname) => {
    if (isYouTubeHostname(pageHostname) === false) {
      return [];
    }
    const sources = [
      typeof bin.userFilters === "string" ? bin.userFilters : "",
      typeof bin["user-filters"] === "string" ? bin["user-filters"] : ""
    ].filter((value) => value !== "");
    if (sources.length === 0) {
      return [];
    }
    const removed = [];
    const seen = /* @__PURE__ */ new Set();
    const mergedLines = [];
    for (const source of sources) {
      const cleaned = removeStaleYouTubeMastheadRules(source, pageHostname);
      removed.push(...cleaned.removed);
      for (const line of cleaned.content.split(/\r?\n/)) {
        const key = line.trim();
        if (key === "" || seen.has(key)) {
          continue;
        }
        seen.add(key);
        mergedLines.push(line);
      }
    }
    if (removed.length === 0) {
      return [];
    }
    const content = mergedLines.join("\n").trimEnd();
    bin.userFilters = content;
    bin["user-filters"] = content;
    await storageSet({
      userFilters: content,
      "user-filters": content
    });
    await storageRemove("cosmeticFiltersData");
    try {
      new BroadcastChannel("uBR").postMessage({ what: "userFiltersUpdated" });
    } catch (e) {
      console.warn("[uBR] bootstrap: BroadcastChannel userFiltersUpdated failed", e);
    }
    return removed;
  };
  var splitSelectorList = (selectorList) => {
    const selectors = [];
    let current = "";
    let quote = "";
    let escape = false;
    let depth = 0;
    for (const char of selectorList) {
      if (escape) {
        current += char;
        escape = false;
        continue;
      }
      if (char === "\\") {
        current += char;
        escape = true;
        continue;
      }
      if (quote !== "") {
        current += char;
        if (char === quote) {
          quote = "";
        }
        continue;
      }
      if (char === '"' || char === "'") {
        current += char;
        quote = char;
        continue;
      }
      if (char === "(" || char === "[") {
        depth += 1;
        current += char;
        continue;
      }
      if ((char === ")" || char === "]") && depth > 0) {
        depth -= 1;
        current += char;
        continue;
      }
      if (char === "," && depth === 0) {
        const selector2 = current.trim();
        if (selector2 !== "") {
          selectors.push(selector2);
        }
        current = "";
        continue;
      }
      current += char;
    }
    const selector = current.trim();
    if (selector !== "") {
      selectors.push(selector);
    }
    return selectors;
  };
  var watchStoredUserFilters = () => {
    const onChanged = globalThis.chrome?.storage?.onChanged;
    if (onChanged?.addListener instanceof Function === false) {
      return;
    }
    const listener = (changes, areaName) => {
      if (areaName !== "local" || [
        "userFilters",
        "user-filters",
        "selectedFilterLists",
        "perSiteFiltering",
        "hostnameSwitches"
      ].some((key) => Object.hasOwn(changes, key)) === false) {
        return;
      }
      void applyStoredUserFilters();
    };
    onChanged.addListener(listener);
    vAPI.shutdown.add(() => onChanged.removeListener(listener));
  };
  var sanitizeYouTubeCosmeticCSS = (css, pageHostname) => {
    if (isYouTubeHostname(pageHostname) === false || css.trim() === "") {
      return { css, removed: [] };
    }
    const blockStart = css.lastIndexOf("{");
    const blockEnd = css.lastIndexOf("}");
    if (blockStart === -1 || blockEnd === -1 || blockEnd < blockStart) {
      return { css, removed: [] };
    }
    const body = css.slice(blockStart, blockEnd + 1);
    if (/display\s*:\s*none\s*!important/i.test(body) === false) {
      return { css, removed: [] };
    }
    const kept = [];
    const removed = [];
    for (const selector of splitSelectorList(css.slice(0, blockStart))) {
      if (selectorTargetsYouTubeMasthead(selector)) {
        removed.push(selector);
      } else {
        kept.push(selector);
      }
    }
    return {
      css: kept.length === 0 ? "" : `${kept.join(",\n")}
${body}`,
      removed
    };
  };
  var proceduralSelectorTargetsYouTubeMasthead = (raw) => {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.warn("[uBR] bootstrap: JSON.parse stored cosmetic data failed", e);
      return selectorTargetsYouTubeMasthead(raw);
    }
    const selectors = [
      typeof parsed.selector === "string" ? parsed.selector : "",
      typeof parsed.raw === "string" ? parsed.raw : ""
    ];
    if (Array.isArray(parsed.tasks)) {
      for (const task of parsed.tasks) {
        if (Array.isArray(task) && typeof task[1] === "string") {
          selectors.push(task[1]);
        }
        if (Array.isArray(task) && task[1] !== null && typeof task[1] === "object" && typeof task[1].selector === "string") {
          selectors.push(task[1].selector);
        }
      }
    }
    return selectors.some(
      (selector) => selector !== "" && selectorTargetsYouTubeMasthead(selector)
    );
  };
  var sanitizeYouTubeProceduralSelectors = (selectors, pageHostname) => {
    if (isYouTubeHostname(pageHostname) === false || selectors.length === 0) {
      return { selectors, removed: [] };
    }
    const kept = [];
    const removed = [];
    for (const selector of selectors) {
      if (proceduralSelectorTargetsYouTubeMasthead(selector)) {
        removed.push(selector);
      } else {
        kept.push(selector);
      }
    }
    return { selectors: kept, removed };
  };
  var cosmeticCacheEntrySelector = (entry) => {
    if (typeof entry === "string") {
      return entry;
    }
    if (Array.isArray(entry)) {
      return typeof entry[0] === "string" ? entry[0] : "";
    }
    if (entry !== null && typeof entry === "object" && typeof entry.selector === "string") {
      return entry.selector;
    }
    return "";
  };
  var scrubStoredCosmeticCacheSelectors = async (selectors) => {
    const removeSet = new Set(selectors);
    if (removeSet.size === 0) {
      return;
    }
    const stored = await storageGet(["cosmeticFiltersData"]);
    if (typeof stored.cosmeticFiltersData !== "string" || stored.cosmeticFiltersData === "") {
      return;
    }
    let data;
    try {
      data = JSON.parse(stored.cosmeticFiltersData);
    } catch (e) {
      console.warn("[uBR] bootstrap: JSON.parse cosmeticFiltersData failed", e);
      return;
    }
    const generic = Array.isArray(data.genericCosmeticFilters) ? data.genericCosmeticFilters : [];
    const specific = Array.isArray(data.specificCosmeticFilters) ? data.specificCosmeticFilters : [];
    const nextGeneric = generic.filter(
      (entry) => removeSet.has(cosmeticCacheEntrySelector(entry)) === false
    );
    const nextSpecific = specific.filter(
      (entry) => removeSet.has(cosmeticCacheEntrySelector(entry)) === false
    );
    if (nextGeneric.length === generic.length && nextSpecific.length === specific.length) {
      return;
    }
    await storageSet({
      cosmeticFiltersData: JSON.stringify({
        ...data,
        genericCosmeticFilters: nextGeneric,
        specificCosmeticFilters: nextSpecific
      })
    });
    try {
      new BroadcastChannel("uBR").postMessage({ what: "userFiltersUpdated" });
    } catch (e) {
      console.warn("[uBR] bootstrap: BroadcastChannel userFiltersUpdated failed", e);
    }
  };
  if (typeof vAPI === "object") {
    vAPI.sanitizeCosmeticCSSForPage = (css) => {
      const sanitized = sanitizeYouTubeCosmeticCSS(css, self.location.hostname);
      if (sanitized.removed.length !== 0) {
        void scrubStoredCosmeticCacheSelectors(sanitized.removed);
      }
      return sanitized.css;
    };
    vAPI.sanitizeProceduralSelectorsForPage = (selectors) => {
      const sanitized = sanitizeYouTubeProceduralSelectors(
        selectors,
        self.location.hostname
      );
      if (sanitized.removed.length !== 0) {
        void scrubStoredCosmeticCacheSelectors(sanitized.removed);
      }
      return sanitized.selectors;
    };
  }
  var cleanupOwnedYouTubeMastheadStyles = async () => {
    if (!await authorizeCosmetic("remove-style")) return;
    if (isYouTubeHostname(self.location.hostname) === false) {
      return;
    }
    const ownedStyles = document.querySelectorAll(
      `style[data-ubr-cosmetic], style#${userFilterStyleId}`
    );
    for (const style of ownedStyles) {
      const sanitized = sanitizeYouTubeCosmeticCSS(
        style.textContent || "",
        self.location.hostname
      );
      if (sanitized.removed.length === 0) {
        continue;
      }
      void scrubStoredCosmeticCacheSelectors(sanitized.removed);
      if (sanitized.css === "") {
        if (!await authorizeCosmetic("remove-style")) continue;
        style.remove();
      } else {
        if (!await authorizeCosmetic("inject-css")) continue;
        style.textContent = sanitized.css;
      }
    }
  };
  var collectStoredCosmeticSelectors = (_rawFilters, _pageHostname) => [];
  var cssEscape = (value) => {
    if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
      return CSS.escape(value);
    }
    return value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  };
  var nthOfTypeIndex = (elem) => {
    let index = 1;
    let prev = elem.previousElementSibling;
    while (prev !== null) {
      if (prev.localName === elem.localName) {
        index += 1;
      }
      prev = prev.previousElementSibling;
    }
    return index;
  };
  var distanceToAncestor = (start, matcher) => {
    let current = start;
    let distance = 0;
    while (current !== null && current !== document.documentElement) {
      if (current.matches(matcher)) {
        return { element: current, distance };
      }
      current = current.parentElement;
      distance += 1;
    }
  };
  var buildContextMenuTargetSelector = (elem) => {
    if (elem === null) {
      return "";
    }
    const parts = [];
    let current = elem;
    let depth = 0;
    while (current !== null && current !== document.documentElement && depth < 5) {
      let part = current.localName || "*";
      const id = current.getAttribute("id") || "";
      if (id !== "") {
        part += `#${cssEscape(id)}`;
        parts.unshift(part);
        break;
      }
      const classAttr = current.getAttribute("class") || "";
      const classes = classAttr.split(/\s+/).map((token) => token.trim()).filter(Boolean).slice(0, 6);
      if (classes.length !== 0) {
        part += classes.map((name) => `.${cssEscape(name)}`).join("");
      }
      const href = current.getAttribute("href");
      if (href) {
        part += `[href="${cssEscape(href)}"]`;
      }
      const src = current.getAttribute("src");
      if (src) {
        part += `[src="${cssEscape(src)}"]`;
      }
      const eventAction = current.getAttribute("data-event-action");
      if (eventAction) {
        part += `[data-event-action="${cssEscape(eventAction)}"]`;
      }
      if (classes.length === 0 && !href && !src && !eventAction) {
        part += `:nth-of-type(${nthOfTypeIndex(current)})`;
      }
      parts.unshift(part);
      current = current.parentElement;
      depth += 1;
    }
    return parts.join(" > ");
  };
  var getContextMenuTargetDetails = (ev) => {
    const rawTarget = ev.target;
    const element = rawTarget instanceof Element ? rawTarget : rawTarget instanceof Node ? rawTarget.parentElement : null;
    if (element === null) {
      return;
    }
    const actionable = distanceToAncestor(
      element,
      "a[href], img[src], iframe[src], video[src], audio[src], [data-event-action], [href], [src]"
    );
    const identifiable = distanceToAncestor(element, "[id]");
    const actionableElement = actionable?.element;
    const actionableTag = actionableElement?.localName || "";
    const actionableEvent = actionableElement?.getAttribute("data-event-action") || "";
    const identifiableElement = identifiable?.element;
    const identifiableTag = identifiableElement?.localName || "";
    const preferred = identifiable?.distance === 0 ? identifiable.element : actionableEvent === "title" ? actionableElement : identifiable && actionable ? actionableTag === "a" && blockLikeTags.has(identifiableTag) && identifiable.distance <= actionable.distance + 2 ? identifiable.element : identifiable.distance <= actionable.distance + 1 ? identifiable.element : actionable.element : actionable?.element || identifiable?.element || element.closest("[class]") || element;
    const selector = buildContextMenuTargetSelector(preferred);
    if (selector === "") {
      return;
    }
    return { selector };
  };
  var applyStoredUserFilters = async () => {
    if (!await authorizeCosmetic("inject-css")) return;
    const pageHostname = self.location.hostname;
    if (pageHostname === "") {
      return;
    }
    cleanupOwnedYouTubeMastheadStyles();
    const bin = await storageGet([
      "userFilters",
      "user-filters",
      "selectedFilterLists",
      "perSiteFiltering",
      "hostnameSwitches"
    ]);
    const perSiteFiltering = bin.perSiteFiltering || {};
    const hostnameSwitches = bin.hostnameSwitches || {};
    const pageURL = self.location.href;
    const pageScopeKey = `${pageHostname}:${pageURL}`;
    const netFilteringEnabled = perSiteFiltering[pageScopeKey] ?? perSiteFiltering[pageHostname] ?? true;
    if (netFilteringEnabled === false) {
      removeStoredUserFilterStyle();
      return;
    }
    const hostnameSwitchState = hostnameSwitches[pageHostname] || {};
    if (hostnameSwitchState["no-cosmetic-filtering"] === true) {
      removeStoredUserFilterStyle();
      return;
    }
    if (hostnameSwitchState["no-large-media"] === true) {
      await applyImmediateHostnameSwitchState("no-large-media", true);
    }
    if (hostnameSwitchState["no-remote-fonts"] === true) {
      await applyImmediateHostnameSwitchState("no-remote-fonts", true);
    }
    if (Array.isArray(bin.selectedFilterLists) === false) {
      removeStoredUserFilterStyle();
      return;
    }
    if (bin.selectedFilterLists.includes("user-filters") === false) {
      removeStoredUserFilterStyle();
      return;
    }
    await cleanupStoredYouTubeMastheadFilters(bin, pageHostname);
    let userFilters = typeof bin["user-filters"] === "string" ? bin["user-filters"] : typeof bin.userFilters === "string" ? bin.userFilters : "";
    if (userFilters.trim() === "" && bin.selectedFilterLists.includes("user-filters") && typeof vAPI?.messaging?.send === "function") {
      try {
        const liveDetails = await vAPI.messaging.send("dashboard", {
          what: "readUserFilters"
        });
        if (typeof liveDetails?.content === "string") {
          userFilters = liveDetails.content;
        }
      } catch (e) {
        console.warn("[uBR] bootstrap: readUserFilters failed", e);
      }
    }
    if (userFilters.trim() === "") {
      removeStoredUserFilterStyle();
      return;
    }
    const selectors = collectStoredCosmeticSelectors(
      userFilters,
      pageHostname
    );
    if (selectors.length === 0) {
      removeStoredUserFilterStyle();
      return;
    }
    let style = document.getElementById(
      userFilterStyleId
    );
    if (style === null) {
      style = document.createElement("style");
      style.id = userFilterStyleId;
      (document.head || document.documentElement).append(style);
    }
    style.textContent = selectors.map((selector) => `${selector}
{display:none!important;}`).join("\n");
    const report = () => {
      reportStoredUserCosmeticBlockCount(selectors);
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", report, { once: true });
    } else {
      requestAnimationFrame(report);
    }
  };
  var applyImmediatePowerSwitchState = async (enabled) => {
    const style = document.getElementById(userFilterStyleId);
    if (enabled) {
      if (!await authorizeCosmetic("inject-css")) return;
      await applyStoredUserFilters();
      vAPI.domFilterer?.toggle?.(true);
      vAPI.domFilterer?.commitNow?.();
      return;
    }
    if (!await authorizeCosmetic("remove-style")) return;
    style?.remove();
    vAPI.domFilterer?.toggle?.(false);
    vAPI.domFilterer?.commitNow?.();
  };
  var hostnameSwitchStyleIds = {
    "no-large-media": "ublock-resurrected-no-large-media",
    "no-remote-fonts": "ublock-resurrected-no-remote-fonts"
  };
  var upsertStyle = async (id, css, enabled) => {
    let style = document.getElementById(id);
    if (enabled) {
      if (!await authorizeCosmetic("inject-css")) return;
      if (style === null) {
        style = document.createElement("style");
        style.id = id;
        (document.head || document.documentElement).append(style);
      }
      style.textContent = css;
      return;
    }
    if (!await authorizeCosmetic("remove-style")) return;
    style?.remove();
  };
  var applyImmediateHostnameSwitchState = async (name, enabled) => {
    switch (name) {
      case "no-cosmetic-filtering":
        await applyImmediatePowerSwitchState(!enabled);
        break;
      case "no-large-media":
        await upsertStyle(
          hostnameSwitchStyleIds["no-large-media"],
          "video, audio { display: none !important; }",
          enabled
        );
        break;
      case "no-remote-fonts":
        await upsertStyle(
          hostnameSwitchStyleIds["no-remote-fonts"],
          "html, body, body * { font-family: system-ui, sans-serif !important; }",
          enabled
        );
        break;
      default:
        break;
    }
  };
  function initBootstrap(policy) {
    watchStoredUserFilters();
    const activePolicy = policy || {};
    const onDomReady = () => {
      if (window.location === null) {
        return;
      }
      if (vAPI instanceof Object === false) {
        return;
      }
      vAPI.messaging.send("contentscript", {
        what: "shouldRenderNoscriptTags"
      });
      if (vAPI.domFilterer instanceof Object) {
        vAPI.domFilterer.commitNow();
      }
      if (vAPI.domWatcher instanceof Object) {
        vAPI.domWatcher.start();
      }
      if (window !== window.top || vAPI.domFilterer instanceof Object === false) {
        return;
      }
      vAPI.mouseClick = { x: -1, y: -1 };
      const onMouseClick = function(ev) {
        if (ev.isTrusted === false) {
          return;
        }
        vAPI.mouseClick.x = ev.clientX;
        vAPI.mouseClick.y = ev.clientY;
        const elem = ev.target?.closest("a[href]");
        if (elem === null || typeof elem.href !== "string") {
          return;
        }
        vAPI.messaging.send("contentscript", {
          what: "maybeGoodPopup",
          url: elem.href || ""
        });
      };
      const onContextMenu = function(ev) {
        if (ev.isTrusted === false) {
          return;
        }
        if (chrome?.runtime?.sendMessage instanceof Function === false) {
          return;
        }
        vAPI.mouseClick.x = ev.clientX;
        vAPI.mouseClick.y = ev.clientY;
        const target = getContextMenuTargetDetails(ev);
        const result = chrome.runtime.sendMessage({
          topic: "pickerContextMenuPoint",
          payload: {
            x: ev.clientX,
            y: ev.clientY,
            pageURL: window.location.href,
            target
          }
        });
        result?.catch((e) => {
          console.warn("[uBR] bootstrap: pickerContextMenuPoint sendMessage failed", e);
        });
      };
      document.addEventListener("mousedown", onMouseClick, true);
      document.addEventListener("contextmenu", onContextMenu, true);
      vAPI.shutdown.add(() => {
        document.removeEventListener("mousedown", onMouseClick, true);
        document.removeEventListener("contextmenu", onContextMenu, true);
      });
    };
    const onResponseReady = (response) => {
      if (response instanceof Object === false) {
        return;
      }
      vAPI.bootstrap = void 0;
      cleanupOwnedYouTubeMastheadStyles().catch(() => {});
      const h = self.__uborHeuristicInterceptor;
      if (h && response.experimentalHeuristicInterceptorsEnabled === true) {
        h.activate();
      }
      const res = response;
      const cfeDetails = res && res.specificCosmeticFilters;
      if (!cfeDetails || !cfeDetails.ready) {
        vAPI.domWatcher = null;
        vAPI.domCollapser = null;
        vAPI.domFilterer = null;
        vAPI.domSurveyor = null;
        vAPI.domIsLoaded = null;
        return;
      }
      vAPI.domCollapser.start();
      const { noSpecificCosmeticFiltering, noGenericCosmeticFiltering } = res;
      vAPI.noSpecificCosmeticFiltering = noSpecificCosmeticFiltering || false;
      vAPI.noGenericCosmeticFiltering = noGenericCosmeticFiltering || false;
      if (noSpecificCosmeticFiltering && noGenericCosmeticFiltering) {
        vAPI.domFilterer = null;
        vAPI.domSurveyor = null;
      } else {
        const domFilterer = new vAPI.DOMFilterer();
        vAPI.domFilterer = domFilterer;
        if (noGenericCosmeticFiltering || cfeDetails.disableSurveyor) {
          vAPI.domSurveyor = null;
        }
        const sanitized = sanitizeYouTubeCosmeticCSS(
          cfeDetails.injectedCSS || "",
          self.location.hostname
        );
        if (sanitized.removed.length !== 0) {
          cfeDetails.injectedCSS = sanitized.css;
          void scrubStoredCosmeticCacheSelectors(sanitized.removed);
        }
        const sanitizedProcedural = sanitizeYouTubeProceduralSelectors(
          cfeDetails.proceduralFilters || [],
          self.location.hostname
        );
        if (sanitizedProcedural.removed.length !== 0) {
          cfeDetails.proceduralFilters = sanitizedProcedural.selectors;
          void scrubStoredCosmeticCacheSelectors(sanitizedProcedural.removed);
        }
        domFilterer.exceptions = cfeDetails.exceptionFilters || [];
        domFilterer.addCSS(cfeDetails.injectedCSS || "", { mustInject: true });
        domFilterer.addProceduralSelectors(cfeDetails.proceduralFilters || []);
        domFilterer.exceptCSSRules(cfeDetails.exceptedFilters || []);
        domFilterer.convertedProceduralFilters = cfeDetails.convertedProceduralFilters || [];
        vAPI.userStylesheet.apply();
      }
      if (vAPI.domSurveyor) {
        if (Array.isArray(cfeDetails.genericCosmeticHashes)) {
          vAPI.domSurveyor.addHashes(cfeDetails.genericCosmeticHashes);
        }
        vAPI.domSurveyor.start(cfeDetails);
      }
      const readyState = document.readyState;
      if (readyState === "interactive" || readyState === "complete") {
        return onDomReady();
      }
      document.addEventListener("DOMContentLoaded", onDomReady, { once: true });
    };
    vAPI.bootstrap = function() {
      console.log("########################################");
      console.log("[MV3-CS] \u2605\u2605\u2605 BOOTSTRAP STARTING \u2605\u2605\u2605");
      console.log("[MV3-CS] Page URL:", vAPI.effectiveSelf.location.href);
      console.log("[MV3-CS] Policy:", JSON.stringify(activePolicy));
      if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
        chrome.runtime.onMessage.addListener(
          (message, _sender, sendResponse) => {
            const msg = message;
            console.log("[MV3-CS] Message received:", msg?.topic);
            if (msg?.topic === "pickerActivate") {
              console.log("[MV3-CS] pickerActivate received, launching picker");
              launchPickerInContentScript();
            }
            if (msg?.topic === "pickerDeactivate") {
              console.log("[MV3-CS] pickerDeactivate received");
            }
            if (msg?.topic === "zapperActivate") {
              console.log("[MV3-CS] zapperActivate received, launching zapper");
              launchPickerInContentScript();
            }
            if (msg?.topic === "zapperDeactivate") {
              console.log("[MV3-CS] zapperDeactivate received");
            }
            if (msg?.topic === "uBlockPowerSwitch") {
              const enabled = msg.payload?.enabled === true;
              void applyImmediatePowerSwitchState(enabled);
            }
            if (msg?.topic === "uBlockHostnameSwitch") {
              const payload = msg.payload || {};
              if (typeof payload.name === "string") {
                void applyImmediateHostnameSwitchState(
                  payload.name,
                  payload.enabled === true
                );
              }
            }
            if (typeof sendResponse === "function") {
              try {
                sendResponse({ ok: true });
              } catch (e) {
                console.warn("[uBR] bootstrap: sendResponse failed", e);
              }
            }
            return;
          }
        );
      }
      const cs = activePolicy.contentScript || {};
      const network = activePolicy.network || {};
      const cosmeticAllowed = (activePolicy.cosmetic || {}).specific !== false;
      applyStoredUserFilters().catch((err) => {
        console.error("[MV3-CS] Stored user filters error:", err);
      }).finally(() => {
        if (cosmeticAllowed) {
          vAPI.messaging.send("contentscript", {
            what: "retrieveContentScriptParameters",
            url: vAPI.effectiveSelf.location.href,
            needScriptlets: self.uBR_scriptletsInjected === void 0
          }).then((response) => {
            if (response && response.specificCosmeticFilters) {
              const scf = response.specificCosmeticFilters;
              if (scf.injectedCSS && scf.injectedCSS.length > 0) {
              }
            }
            onResponseReady(response);
          }).catch((err) => {
            console.error("[MV3-CS] Promise error:", err);
          });
        }
      });
    };
    const launchPickerInContentScript = async () => {
      console.log("[MV3-CS] launchPickerInContentScript called");
      if (typeof self.__ubrCapability === "undefined" || !await authorizeCosmetic("picker-launch")) return;
      try {
        const pickerBootArgs = await vAPI.messaging.send("elementPicker", {
          what: "elementPickerArguments"
        });
        if (!pickerBootArgs || typeof pickerBootArgs !== "object") {
          console.error("[MV3-CS] No pickerBootArgs received");
          return;
        }
        console.log("[MV3-CS] pickerBootArgs received:", pickerBootArgs);
        const pickerUniqueId = vAPI.randomToken();
        let pickerURL = pickerBootArgs.pickerURL || "/web_accessible_resources/epicker-ui.html";
        if (pickerBootArgs.zap) {
          pickerURL += `${pickerURL.includes("?") ? "&" : "?"}zap=1`;
        }
        const epickerUrl = chrome.runtime.getURL(pickerURL);
        console.log("[MV3-CS] epicker URL:", epickerUrl);
        const iframe = document.createElement("iframe");
        iframe.setAttribute(pickerUniqueId, "");
        iframe.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 2147483647;
        border: none;
        background: transparent;
      `;
        const channel = new MessageChannel();
        const port1 = channel.port1;
        const port2 = channel.port2;
        port1.onmessage = async (ev) => {
          const msg = ev.data;
          console.log("[MV3-CS] Picker message received:", msg);
          if (msg.what === "pickerCreateFilter") {
            if (typeof self.__ubrCapability === "undefined" || !await authorizeCosmetic("picker-create-filter")) return;
            await vAPI.messaging.send("elementPicker", {
              ...msg,
              what: "elementPickerCreateFilter"
            });
          } else if (msg.what === "pickerQuit") {
            port1.close();
            iframe.remove();
          }
        };
        (document.documentElement || document.head || document.body)?.appendChild(
          iframe
        );
        iframe.addEventListener(
          "load",
          () => {
            console.log("[MV3-CS] epicker iframe loaded");
            iframe.contentWindow?.postMessage(
              {
                what: "epickerStart",
                eprom: pickerBootArgs.eprom
              },
              "*",
              [port2]
            );
          },
          { once: true }
        );
        iframe.src = epickerUrl;
        console.log("[MV3-CS] Picker iframe created and navigated");
      } catch (e) {
        console.error("[MV3-CS] Error launching picker:", e);
      }
    };
  }
  function startBootstrap() {
    vAPI.bootstrap?.();
  }

  // src/js/contentscript/contentscript-entry.ts
  if (typeof vAPI !== "object") {
  } else {
    vAPI.contentScript = true;
    void (async () => {
      let policy = self.__uborPagePolicy;
      if (!policy) {
        // Wait for DOM to be ready before collecting page signals.
        // At document_start, <body> elements are not yet parsed, so
        // queries like input[type="password"] or <video> return null.
        if (document.readyState === "loading") {
          await new Promise((r) => document.addEventListener("DOMContentLoaded", r, { once: true }));
        }
        const pageSignals = {
          hasContentEditable: document.querySelector("[contenteditable]") !== null,
          hasLargeAppRoot: document.querySelector("#root, #app, #__next, main, .shell") !== null,
          hasAuthForm: document.querySelector('input[type="password"], form[action*="login"], form[action*="auth"]') !== null,
          hasPaymentForm: document.querySelector('input[autocomplete="cc-number"]') !== null,
          isArticle: document.querySelector("article") !== null || document.querySelector('[role="article"]') !== null,
          isVideoPage: document.querySelector("video") !== null && document.querySelector("video").clientWidth >= 320,
          metaViewport: document.querySelector('meta[name="viewport"]') !== null,
        };
        try {
          const raw = await vAPI.messaging.send("contentscript", {
            what: "getPageActivation",
            url: location.href,
            hostname: location.hostname,
            pageSignals
          });
          policy = raw && raw.policy ? raw.policy : raw;
        } catch (_) {
        }
      }
      if (!policy) {
        return;
      }
      self.__uborPagePolicy = policy;
      const cs = typeof policy.contentScript === "object" ? policy.contentScript : {};
      const contentScriptMode = typeof policy.contentScript === "string" ? policy.contentScript : policy.contentScriptMode || "full";
      const cosmetic = typeof policy.cosmetic === "object" ? policy.cosmetic : { specific: policy.cosmetic !== "off", generic: policy.genericCosmetic === true };
      const video = typeof policy.video === "object" ? policy.video : { mode: policy.genericVideo || "off" };
      const cosmeticAllowed = cosmetic.specific !== false || cosmetic.generic === true;
      const cosmeticSpecific = cosmetic.specific !== false;
      const cosmeticGeneric = cosmetic.generic === true;
      const videoPolicyAllowed = video.mode !== "off";
      const smartCosmeticAllowed = cs.loadSmartRuntime === true;
      const interceptorAllowed = cs.loadInterceptors === true;
      if (cosmeticAllowed) {
        initDOMFilterer();
        initDOMCollapser();
        initDOMSurveyor();
      }
      if (cosmeticAllowed || videoPolicyAllowed || interceptorAllowed) {
        initBootstrap(policy);
        initDOMWatcher();
        startBootstrap();
      }

      // Runtime execution probe — captured by e2e tests
      // Delay to allow async SW response to populate vAPI.domFilterer
      setTimeout(() => {
        console.log("[UBR-RUNTIME] layers: " + JSON.stringify({
          profileId: policy.profileId || "unknown",
          cosmeticFilterer: typeof vAPI.domFilterer !== "undefined",
          domWatcher: typeof vAPI.domWatcher !== "undefined",
          domCollapser: typeof vAPI.domCollapser !== "undefined",
          domSurveyor: typeof vAPI.domSurveyor !== "undefined",
          cosmeticAllowed,
          videoPolicyAllowed,
          smartCosmeticAllowed,
          interceptorAllowed,
          cosmeticInjectedCSS: document.querySelectorAll("style[data-ubr-cosmetic]").length,
          cosmeticHiddenElements: document.querySelectorAll("[data-ubr-cosmetic-hidden]").length,
        }));
      }, 2000);

      window.addEventListener("beforeunload", () => {
        const i = self.__uborHeuristicInterceptor;
        if (i && typeof i.destroy === "function") i.destroy();
        const d = self.__uborFirstPartyDetector;
        if (d && typeof d.destroy === "function") d.destroy();
      });
    })();
  }
})();
