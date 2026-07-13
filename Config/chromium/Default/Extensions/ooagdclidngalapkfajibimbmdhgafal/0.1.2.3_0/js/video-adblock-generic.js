// GENERATED FILE. Do not edit directly.
// Source: src/js/video-adblock/index.ts
// Build command: npm run build
(() => {
  // src/js/video-adblock/diagnostics.ts
  var debugEnabled = false;
  function debugLog(...args) {
    if (debugEnabled) {
      console.log("[uBR-video-adblock]", ...args);
    }
  }
  function warnLog(...args) {
    console.warn("[uBR-video-adblock]", ...args);
  }

  // src/js/video-adblock/breakage-guard.ts
  var KNOWN_VIDEO_ADAPTER_HOSTS = /* @__PURE__ */ new Set([
    "youtube.com",
    "youtu.be",
    "youtube-nocookie.com",
    "yandex.com",
    "yandex.ru",
    "rutube.ru",
    "vkvideo.ru"
  ]);
  var engineDisabled = false;
  function isKnownVideoAdapterHost(hostname) {
    const host = hostname.toLowerCase();
    if (KNOWN_VIDEO_ADAPTER_HOSTS.has(host)) return true;
    for (const known of KNOWN_VIDEO_ADAPTER_HOSTS) {
      if (host.endsWith(`.${known}`)) return true;
    }
    return false;
  }
  function shouldEnableGenericVideoEngine(document2, hostname) {
    if (!isKnownVideoAdapterHost(hostname)) return false;
    const videos = Array.from(document2.querySelectorAll("video"));
    if (videos.length === 0) return false;
    return videos.some((video) => {
      const rect = video.getBoundingClientRect();
      return rect.width >= 320 && rect.height >= 180;
    });
  }
  function markEngineDisabled(reason) {
    engineDisabled = true;
    debugLog("Video ad engine disabled:", reason);
  }
  function isEngineDisabled() {
    return engineDisabled;
  }

  // src/js/video-adblock/video-detector.ts
  var PLAYER_CONTAINER_CLASSES = [
    "player",
    "video",
    "media",
    "jwplayer",
    "plyr",
    "vjs",
    "ima",
    "vast",
    "stream"
  ];
  var MIN_VIDEO_WIDTH = 200;
  var MIN_VIDEO_HEIGHT = 100;
  function findVideoElements(root = document) {
    return Array.from(root.querySelectorAll("video"));
  }
  function isLikelyPrimaryVideo(video) {
    if (!video.isConnected) return false;
    const rect = video.getBoundingClientRect();
    if (rect.width < MIN_VIDEO_WIDTH || rect.height < MIN_VIDEO_HEIGHT) return false;
    const style = getComputedStyle(video);
    if (style.display === "none" || style.visibility === "hidden") return false;
    return true;
  }
  function getLikelyVideoContainer(video) {
    let current = video.parentElement;
    let depth = 0;
    while (current && depth < 8) {
      const cls = (current.className || "").toLowerCase();
      const id = (current.id || "").toLowerCase();
      const combined = `${cls} ${id}`;
      for (const keyword of PLAYER_CONTAINER_CLASSES) {
        if (combined.includes(keyword)) {
          return current;
        }
      }
      current = current.parentElement;
      depth++;
    }
    return null;
  }

  // src/js/video-adblock/video-ad-signatures.ts
  var VIDEO_AD_SIGNATURES = [
    {
      id: "yandex-vas",
      containerSelectors: [
        '[data-testid="advert"]',
        "#raichu_yasdk_container",
        '[class*="yandex-advert-module"]'
      ],
      videoSelectors: [
        'video[data-testid="advert-video"]',
        "video.raichu-adver-tag",
        'video[class*="yandex-advert-module__SDKVideo"]'
      ],
      urlHints: [
        "strm.yandex.ru",
        "xVASx",
        "vas-bundles"
      ],
      confidence: "high"
    },
    {
      id: "videojs-vast",
      containerSelectors: [
        "#vast_wrapper",
        ".vast-btns.vdd-addtext",
        ".vast-btns.vdd-countdown",
        ".vast-btns.vdd-skip"
      ],
      videoSelectors: [],
      urlHints: [
        "vast.yomeno.xyz",
        "roomgome.com",
        "syndication.realsrv.com",
        "v.scurra.space",
        "markreptiloid.com/alpha",
        "markreptiloid.com/beta",
        "markreptiloid.com",
        "serve.7kprtners.com",
        "cenoobi.run",
        "deductgreedyheadroom.com",
        "s.magsrv.com",
        "s.magsrv.com/v1/vast.php",
        "rtb.tsyndicate.com",
        "vacdn.rtb.tsyndicate.com",
        "mode=vast"
      ],
      confidence: "high"
    },
    {
      id: "jwplayer-vast",
      containerSelectors: [
        "#player_box_vast",
        ".jw-plugin-vast",
        ".jwplayer.jw-flag-ads",
        ".jw-skip",
        ".jw-skiptext",
        ".afs_ads.ad-placement"
      ],
      videoSelectors: [],
      urlHints: [
        "s.magsrv.com",
        "tsyndicate.com",
        "kintg.site",
        "clammyendearedkeg.com",
        "vast"
      ],
      confidence: "high"
    },
    {
      id: "kt-player-ad",
      containerSelectors: [
        ".spot-box",
        ".fp-ui-block",
        ".fp-ui-skip-ad",
        ".fp-play-ad",
        ".kt-player.is-ad-visible",
        ".kt-player.is-ad-paused",
        'a[href*="s.magsrv.com"]',
        'a[href*="foxiceberg.com"]',
        'a[href*="btsar.space"]'
      ],
      videoSelectors: [],
      urlHints: [
        "s.magsrv.com",
        "foxiceberg.com",
        "btsar.space",
        "bxcdn.net"
      ],
      confidence: "high"
    }
  ];
  function getVideoAdSignature(id) {
    return VIDEO_AD_SIGNATURES.find((s) => s.id === id);
  }
  function matchesAnySelector(element, selectors) {
    for (const sel of selectors) {
      if (element.matches(sel)) return true;
    }
    return false;
  }
  function findClosestContainer(video, signature) {
    for (const sel of signature.containerSelectors) {
      const el = video.closest(sel);
      if (el) return el;
    }
    return video.parentElement ?? void 0;
  }
  function hasUrlHint(src, hints) {
    const lower = src.toLowerCase();
    for (const hint of hints) {
      if (lower.includes(hint.toLowerCase())) return true;
    }
    return false;
  }
  function detectKnownVideoAdSignature(document2, video, allowedSignatureIds) {
    const signatures = allowedSignatureIds ? VIDEO_AD_SIGNATURES.filter((s) => allowedSignatureIds.includes(s.id)) : VIDEO_AD_SIGNATURES;
    for (const sig of signatures) {
      const src = (video.currentSrc || video.src || "").toLowerCase();
      const videoMatches = matchesAnySelector(video, sig.videoSelectors);
      const urlMatches = hasUrlHint(src, sig.urlHints);
      const container = findClosestContainer(video, sig);
      const containerMatches = container ? matchesAnySelector(container, sig.containerSelectors) : false;
      if (videoMatches || urlMatches || containerMatches) {
        return {
          signature: sig,
          confidence: sig.confidence,
          reason: `${sig.id}-${videoMatches ? "video-selector" : urlMatches ? "url-hint" : "container-selector"}`,
          video,
          container
        };
      }
    }
    return null;
  }

  // src/js/video-adblock/video-overlay-detector.ts
  var AD_TEXT_SIGNALS = [
    "ad",
    "ads",
    "advert",
    "advertisement",
    "sponsor",
    "sponsored",
    "preroll",
    "midroll",
    "postroll",
    "vast",
    "vmap",
    "ima",
    "promo",
    "banner",
    "popunder",
    "popup"
  ];
  var SAFE_TAGS = /* @__PURE__ */ new Set(["video", "source", "track"]);
  function rectOverlapRatio(a, b) {
    const left = Math.max(a.left, b.left);
    const right = Math.min(a.right, b.right);
    const top = Math.max(a.top, b.top);
    const bottom = Math.min(a.bottom, b.bottom);
    const width = Math.max(0, right - left);
    const height = Math.max(0, bottom - top);
    const overlap = width * height;
    const base = Math.max(1, a.width * a.height);
    return overlap / base;
  }
  function hasAdLikeText(element) {
    const cls = typeof element.className === "string" ? element.className : "";
    const id = element.id || "";
    const aria = element.getAttribute("aria-label") || "";
    const title = element.getAttribute("title") || "";
    const src = element instanceof HTMLIFrameElement ? element.src : "";
    const href = element instanceof HTMLAnchorElement ? element.href : "";
    const combined = `${cls} ${id} ${aria} ${title} ${src} ${href}`.toLowerCase();
    return AD_TEXT_SIGNALS.some((signal) => combined.includes(signal));
  }
  function isClickableOverlay(element) {
    if (element instanceof HTMLAnchorElement) return true;
    if (element instanceof HTMLButtonElement) return true;
    if (element.getAttribute("role") === "button") return true;
    if (element.querySelector("a,button,[role='button'],iframe")) return true;
    return false;
  }
  function isExtensionOwnedElement(element) {
    if (element.hasAttribute("data-ubol-overlay")) return true;
    if (element.hasAttribute("data-ubol-overlay-dialog")) return true;
    if (element.hasAttribute("data-ubr-extension-ui")) return true;
    const src = element.getAttribute("src") || "";
    if (src.startsWith("chrome-extension://") && (src.includes("/picker-ui.html") || src.includes("/zapper-ui.html"))) return true;
    return false;
  }
  function isProtectedSiteUi(element) {
    const host = location.hostname.toLowerCase();
    if (host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtube-nocookie.com" || host.endsWith(".youtube-nocookie.com") || host === "youtu.be" || host.endsWith(".youtu.be")) {
      if (element.closest("ytd-masthead") || element.closest("#masthead") || element.closest("#search") || element.closest("ytd-searchbox") || element.closest("#center") || element.closest("#container.ytd-masthead")) {
        return true;
      }
    }
    return false;
  }
  function findVideoOverlayCandidates(video, root) {
    const videoRect = video.getBoundingClientRect();
    const candidates = [];
    if (videoRect.width < 200 || videoRect.height < 100) return candidates;
    const elements = Array.from(root.querySelectorAll("*"));
    for (const element of elements) {
      const tag = element.tagName.toLowerCase();
      if (SAFE_TAGS.has(tag)) continue;
      if (element === video) continue;
      if (element.contains(video)) continue;
      if (isExtensionOwnedElement(element)) continue;
      if (isProtectedSiteUi(element)) continue;
      const rect = element.getBoundingClientRect();
      if (rect.width < 40 || rect.height < 20) continue;
      const overlap = rectOverlapRatio(videoRect, rect);
      if (overlap < 0.35) continue;
      const style = getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden") continue;
      const z = Number.parseInt(style.zIndex || "0", 10);
      const positioned = ["absolute", "fixed", "sticky"].includes(style.position);
      const adLike = hasAdLikeText(element);
      const clickable = isClickableOverlay(element);
      if (overlap >= 0.7 && adLike && clickable) {
        candidates.push({
          element,
          confidence: "high",
          reason: "ad-like-clickable-overlay-over-video"
        });
        continue;
      }
      if (overlap >= 0.5 && adLike && (positioned || z > 1)) {
        candidates.push({
          element,
          confidence: "medium",
          reason: "ad-like-positioned-overlay-over-video"
        });
        continue;
      }
      if (overlap >= 0.8 && clickable && positioned && z > 10 && adLike) {
        candidates.push({
          element,
          confidence: "medium",
          reason: "clickable-high-z-overlay-over-video"
        });
      }
    }
    return candidates;
  }
  function isUnsafeRemovalTarget(element, video) {
    const tag = element.tagName.toLowerCase();
    if (tag === "video" || tag === "source" || tag === "track") return true;
    if (tag === "body" || tag === "html") return true;
    if (element === video) return true;
    if (element.contains(video)) return true;
    return false;
  }
  function dedupeOverlayCandidates(candidates) {
    const seen = /* @__PURE__ */ new Set();
    const out = [];
    for (const candidate of candidates) {
      if (seen.has(candidate.element)) continue;
      seen.add(candidate.element);
      out.push(candidate);
    }
    return out;
  }
  function findDocumentWideVideoOverlayCandidates(video, document2) {
    const candidates = [];
    const roots = /* @__PURE__ */ new Set();
    roots.add(document2.body);
    let current = video.parentElement;
    let depth = 0;
    while (current && depth < 8) {
      roots.add(current);
      current = current.parentElement;
      depth++;
    }
    for (const root of roots) {
      for (const candidate of findVideoOverlayCandidates(video, root)) {
        if (!isUnsafeRemovalTarget(candidate.element, video)) {
          candidates.push(candidate);
        }
      }
    }
    return dedupeOverlayCandidates(candidates);
  }
  function findTopLayerVideoOverlays(video, document2) {
    const rect = video.getBoundingClientRect();
    const candidates = [];
    if (rect.width < 200 || rect.height < 100) return candidates;
    const points = [
      [0.2, 0.2],
      [0.5, 0.2],
      [0.8, 0.2],
      [0.2, 0.5],
      [0.5, 0.5],
      [0.8, 0.5],
      [0.2, 0.8],
      [0.5, 0.8],
      [0.8, 0.8]
    ];
    const hits = /* @__PURE__ */ new Map();
    for (const [px, py] of points) {
      const x = rect.left + rect.width * px;
      const y = rect.top + rect.height * py;
      const top = document2.elementFromPoint(x, y);
      if (!top) continue;
      if (top === video) continue;
      if (top.tagName.toLowerCase() === "video") continue;
      if (isExtensionOwnedElement(top)) continue;
      if (isProtectedSiteUi(top)) continue;
      let candidate = top;
      let climb = 0;
      while (candidate && climb < 4) {
        if (candidate === video) break;
        if (candidate.contains(video)) break;
        const style = getComputedStyle(candidate);
        const positioned = ["absolute", "fixed", "sticky"].includes(style.position);
        const z = Number.parseInt(style.zIndex || "0", 10);
        const pointerActive = style.pointerEvents !== "none";
        if (pointerActive && (positioned || z > 1 || isClickableOverlay(candidate))) {
          if (!hasAdLikeText(candidate)) {
            const hasVisibleContent = (candidate.textContent ?? "").trim().length > 0 || candidate.querySelector("svg, img, canvas") !== null || candidate.getAttribute("aria-label") !== null;
            if (hasVisibleContent) {
              break;
            }
          }
          hits.set(candidate, (hits.get(candidate) ?? 0) + 1);
          break;
        }
        candidate = candidate.parentElement;
        climb++;
      }
    }
    for (const [element, count] of hits) {
      if (count >= 3) {
        candidates.push({
          element,
          confidence: count >= 5 ? "high" : "medium",
          reason: `top-layer-clickable-overlay:${count}/9`
        });
      }
    }
    return candidates;
  }

  // src/js/video-adblock/site-adapters/aggressive-video-generic.ts
  var aggressiveVideoGenericAdapter = {
    id: "aggressive-video-generic",
    domains: ["*"],
    mainWorldHooksAllowed: false,
    matches(hostname) {
      const host = hostname.toLowerCase();
      return !isKnownVideoAdapterHost(host);
    },
    detectPlayer(document2) {
      return findVideoElements(document2).filter((v) => isLikelyPrimaryVideo(v));
    },
    detectAdState(document2, video) {
      const sigMatch = detectKnownVideoAdSignature(document2, video);
      if (sigMatch) {
        return {
          isAd: true,
          confidence: sigMatch.confidence,
          reason: sigMatch.reason,
          video,
          container: sigMatch.container
        };
      }
      const overlays = [
        ...findDocumentWideVideoOverlayCandidates(video, document2),
        ...findTopLayerVideoOverlays(video, document2)
      ];
      const high = overlays.find((o) => o.confidence === "high");
      if (high) {
        return {
          isAd: true,
          confidence: "high",
          reason: high.reason,
          video,
          container: high.element
        };
      }
      const medium = overlays.find((o) => o.confidence === "medium");
      if (medium) {
        return {
          isAd: true,
          confidence: "medium",
          reason: medium.reason,
          video,
          container: medium.element
        };
      }
      return {
        isAd: false,
        confidence: "none",
        reason: "no-aggressive-video-ad-overlay"
      };
    },
    getSafeActions(document2, detection) {
      if (!detection.isAd || !detection.container || detection.confidence !== "high") {
        return {
          hideSelectors: [],
          removeSelectors: [],
          markSelectors: [],
          hideElements: [],
          removeElements: [],
          neutralizeClickElements: [],
          blockRequestHints: [],
          mainWorldHooksAllowed: false,
          reason: detection.confidence !== "high" ? "low-confidence-no-action" : "no-ad"
        };
      }
      return {
        hideSelectors: [],
        removeSelectors: [],
        markSelectors: [],
        hideElements: [detection.container],
        removeElements: [],
        neutralizeClickElements: [detection.container],
        blockRequestHints: [],
        mainWorldHooksAllowed: false,
        reason: detection.reason
      };
    },
    shouldDisableForBreakage(document2) {
      return false;
    }
  };

  // src/js/video-adblock/vast-detector.ts
  var VAST_SIGNALS = [
    "vast",
    "vmap",
    "adtag",
    "ad_tag",
    "adTagUrl",
    "adserver",
    "pubads",
    "ima3",
    "imasdk",
    "googleads",
    "doubleclick",
    "preroll",
    "midroll",
    "postroll"
  ];
  var MEDIA_EXTENSIONS = [
    ".m3u8",
    ".mpd",
    ".ts",
    ".m4s",
    ".mp4",
    ".webm",
    ".mov"
  ];
  function looksLikeVideoAdRequest(url) {
    const lower = url.toLowerCase();
    if (MEDIA_EXTENSIONS.some((ext) => lower.includes(ext))) return false;
    return VAST_SIGNALS.some((signal) => lower.includes(signal));
  }

  // src/js/video-adblock/site-adapters/generic-html5.ts
  var AD_CONTAINER_CLASSES = [
    "advert",
    "sponsor",
    "preroll",
    "midroll",
    "postroll",
    "vast",
    "vmap",
    "ima"
  ];
  function hasAdToken(combined, token) {
    return new RegExp(`(^|[^a-z0-9])${token}([^a-z0-9]|$)`, "i").test(combined);
  }
  function hostMatches(hostname) {
    const host = hostname.toLowerCase();
    if (isKnownVideoAdapterHost(host)) return false;
    return true;
  }
  function containerLooksLikeAd(container) {
    if (!container) return { isAd: false, confidence: "none", reason: "no-container" };
    const cls = (container.className || "").toLowerCase();
    const id = (container.id || "").toLowerCase();
    const combined = `${cls} ${id}`;
    const nearIframes = Array.from(container.querySelectorAll("iframe"));
    for (const iframe of nearIframes) {
      const src = (iframe.src || "").toLowerCase();
      if (looksLikeVideoAdRequest(src)) {
        return { isAd: true, confidence: "high", reason: `iframe-src:${src.slice(0, 100)}` };
      }
    }
    for (const keyword of AD_CONTAINER_CLASSES) {
      if (hasAdToken(combined, keyword)) {
        return { isAd: true, confidence: "medium", reason: `container-class:${keyword}` };
      }
    }
    return { isAd: false, confidence: "none", reason: "no-ad-signals" };
  }
  var genericHtml5Adapter = {
    id: "generic-html5",
    domains: ["*"],
    mainWorldHooksAllowed: false,
    matches(hostname) {
      return hostMatches(hostname);
    },
    detectPlayer(document2) {
      const videos = findVideoElements(document2);
      return videos.filter((v) => isLikelyPrimaryVideo(v));
    },
    detectAdState(document2, video) {
      const container = getLikelyVideoContainer(video) || video.parentElement;
      const result = containerLooksLikeAd(container);
      if (result.isAd) {
        return {
          isAd: true,
          confidence: result.confidence,
          reason: result.reason,
          video,
          container: container || void 0
        };
      }
      return {
        isAd: false,
        confidence: "none",
        reason: "no-ad-signals"
      };
    },
    getSafeActions(document2, detection) {
      if (!detection.isAd || detection.confidence !== "high") {
        return { hideSelectors: [], removeSelectors: [], markSelectors: [], hideElements: [], removeElements: [], blockRequestHints: [], mainWorldHooksAllowed: false, reason: "low-confidence-no-action" };
      }
      const selectors = [];
      if (detection.container) {
        const container = detection.container;
        const id = container.id ? `#${CSS.escape(container.id)}` : "";
        const cls = container.className ? container.className.split(/\s+/).map((c) => `.${CSS.escape(c)}`).join("") : "";
        if (id || cls) {
          selectors.push(id || cls);
        }
      }
      return {
        hideSelectors: selectors,
        removeSelectors: [],
        markSelectors: [],
        hideElements: detection.container ? [detection.container] : [],
        removeElements: [],
        blockRequestHints: [],
        mainWorldHooksAllowed: false,
        reason: detection.reason
      };
    },
    shouldDisableForBreakage(document2) {
      return false;
    }
  };

  // src/js/video-adblock/site-adapters/youtube.ts
  function hostMatches2(hostname, domain) {
    return hostname === domain || hostname.endsWith(`.${domain}`);
  }
  var youtubeAdapter = {
    id: "youtube",
    domains: ["youtube.com", "youtu.be", "youtube-nocookie.com"],
    mainWorldHooksAllowed: true,
    matches(hostname) {
      const host = hostname.toLowerCase();
      return this.domains.some((domain) => hostMatches2(host, domain));
    },
    detectPlayer() {
      return [];
    },
    detectAdState() {
      return {
        isAd: false,
        confidence: "none",
        reason: "handled-by-existing-youtube-subsystem"
      };
    },
    getSafeActions() {
      return {
        hideSelectors: [],
        removeSelectors: [],
        markSelectors: [],
        blockRequestHints: [],
        mainWorldHooksAllowed: true,
        reason: "handled-by-existing-youtube-subsystem"
      };
    },
    shouldDisableForBreakage() {
      return false;
    }
  };

  // src/js/video-adblock/preroll-skip-detector.ts
  var SKIP_TEXT_PATTERNS = [
    /\bskip\b/i,
    /skip\s+ad/i,
    /skip\s+ads/i,
    /skip\s+in/i,
    /ad\s+ends/i,
    /seconds?/i,
    /sec\.?/i,
    /überspringen/i,
    /anzeige\s+überspringen/i,
    /werbung\s+überspringen/i,
    /weiter/i,
    /continue/i,
    /saltar/i,
    /omitir/i,
    /ignorar/i,
    /passer/i,
    /passer\s+l['']annonce/i,
    /salta/i,
    /preskoč/i,
    /přeskočit/i,
    /preskocit/i,
    /^skip$/i,
    /^skip\s*>$/i
  ];
  var SKIP_CLASS_ID_SIGNALS = [
    "skip",
    "skipad",
    "skip-ad",
    "adskip",
    "ad-skip",
    "vast-skip",
    "ima-skip",
    "preroll-skip",
    "video-ad-skip"
  ];
  var AD_STATE_SIGNALS = [
    "ad",
    "ads",
    "advert",
    "advertisement",
    "preroll",
    "midroll",
    "postroll",
    "vast",
    "vmap",
    "ima",
    "sponsor",
    "sponsored"
  ];
  function looksLikeCountdownOnly(el) {
    const text = [
      el.textContent || "",
      el.getAttribute("aria-label") || "",
      el.getAttribute("title") || ""
    ].join(" ").trim().toLowerCase();
    if (/^\d+$/.test(text)) return true;
    if (/skip\s+in\s+\d+/.test(text)) return true;
    if (/\d+\s*(s|sec|seconds)/.test(text) && /skip|ad|wait/.test(text)) return true;
    return false;
  }
  function visibleEnough(el) {
    if (!el.isConnected) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width < 20 || rect.height < 10) return false;
    const style = getComputedStyle(el);
    if (style.display === "none") return false;
    if (style.visibility === "hidden") return false;
    if (style.pointerEvents === "none") return false;
    if (Number(style.opacity || "1") < 0.1) return false;
    return true;
  }
  function classOrIdLooksDisabled(el) {
    const cls = typeof el.className === "string" ? el.className : "";
    const id = el.id || "";
    const aria = el.getAttribute("aria-label") || "";
    const title = el.getAttribute("title") || "";
    const combined = `${cls} ${id} ${aria} ${title}`.toLowerCase().replace(/_/g, "-");
    return combined.includes("disabled") || combined.includes("disable") || combined.includes("inactive") || combined.includes("not-ready") || combined.includes("notready") || combined.includes("countdown") || combined.includes("wait");
  }
  function enabledEnough(el) {
    if (el.hasAttribute("disabled")) return false;
    if (el.getAttribute("aria-disabled") === "true") return false;
    if (el.classList.contains("disabled")) return false;
    if (classOrIdLooksDisabled(el)) return false;
    return true;
  }
  function textLooksLikeSkip(el) {
    const text = [
      el.textContent || "",
      el.getAttribute("aria-label") || "",
      el.getAttribute("title") || "",
      el.getAttribute("value") || ""
    ].join(" ").trim();
    return SKIP_TEXT_PATTERNS.some((re) => re.test(text));
  }
  function classOrIdLooksLikeSkip(el) {
    const cls = typeof el.className === "string" ? el.className : "";
    const id = el.id || "";
    const combined = `${cls} ${id}`.toLowerCase().replace(/_/g, "-");
    return SKIP_CLASS_ID_SIGNALS.some((signal) => combined.includes(signal));
  }
  function elementNearVideo(el, video) {
    const er = el.getBoundingClientRect();
    const vr = video.getBoundingClientRect();
    if (vr.width < 200 || vr.height < 100) return false;
    const padX = vr.width * 0.45;
    const padY = vr.height * 0.45;
    const left = vr.left - padX;
    const right = vr.right + padX;
    const top = vr.top - padY;
    const bottom = vr.bottom + padY;
    return er.right >= left && er.left <= right && er.bottom >= top && er.top <= bottom;
  }
  function playerLooksAdLike(video) {
    let current = video.parentElement;
    let depth = 0;
    while (current && depth < 8) {
      const cls = typeof current.className === "string" ? current.className : "";
      const id = current.id || "";
      const aria = current.getAttribute("aria-label") || "";
      const combined = `${cls} ${id} ${aria}`.toLowerCase();
      if (AD_STATE_SIGNALS.some((signal) => combined.includes(signal))) return true;
      current = current.parentElement;
      depth++;
    }
    return false;
  }
  function findVisibleSkipControlsForVideo(video, doc) {
    const candidates = [];
    const controls = Array.from(
      doc.querySelectorAll(
        "button, a, [role='button'], .skip, [class*='skip'], [id*='skip'], [aria-label*='skip' i]"
      )
    );
    for (const el of controls) {
      if (!visibleEnough(el)) continue;
      if (!enabledEnough(el)) continue;
      if (!elementNearVideo(el, video)) continue;
      if (looksLikeCountdownOnly(el)) continue;
      const textSkip = textLooksLikeSkip(el);
      const classSkip = classOrIdLooksLikeSkip(el);
      const adLikePlayer = playerLooksAdLike(video);
      if (textSkip && classSkip) {
        candidates.push({
          element: el,
          confidence: "high",
          reason: "visible-enabled-skip-control-text-and-class"
        });
        continue;
      }
      if (textSkip && adLikePlayer) {
        candidates.push({
          element: el,
          confidence: "high",
          reason: "visible-enabled-skip-control-in-ad-like-player"
        });
        continue;
      }
      if (textSkip || classSkip) {
        candidates.push({
          element: el,
          confidence: "medium",
          reason: "visible-enabled-skip-control-near-video"
        });
      }
    }
    return candidates;
  }

  // src/js/video-adblock/site-adapters/generic-preroll-skipper.ts
  var genericPrerollSkipperAdapter = {
    id: "generic-preroll-skipper",
    domains: ["*"],
    mainWorldHooksAllowed: false,
    matches(hostname) {
      const host = hostname.toLowerCase();
      return !isKnownVideoAdapterHost(host);
    },
    detectPlayer(document2) {
      return findVideoElements(document2).filter((v) => isLikelyPrimaryVideo(v));
    },
    detectAdState(document2, video) {
      const skipControls = findVisibleSkipControlsForVideo(video, document2);
      const high = skipControls.find((c) => c.confidence === "high");
      const medium = skipControls.find((c) => c.confidence === "medium");
      const candidate = high || medium;
      if (!candidate) {
        return {
          isAd: false,
          confidence: "none",
          reason: "no-visible-preroll-skip-control"
        };
      }
      return {
        isAd: true,
        confidence: candidate.confidence,
        reason: candidate.reason,
        video,
        container: candidate.element,
        skipControl: candidate.element
      };
    },
    getSafeActions(_document, detection) {
      if (!detection.isAd || !detection.skipControl || detection.confidence !== "high") {
        return {
          hideSelectors: [],
          removeSelectors: [],
          markSelectors: [],
          hideElements: [],
          removeElements: [],
          neutralizeClickElements: [],
          skipClickElements: [],
          blockRequestHints: [],
          mainWorldHooksAllowed: false,
          reason: "low-confidence-no-action"
        };
      }
      return {
        hideSelectors: [],
        removeSelectors: [],
        markSelectors: [],
        hideElements: [],
        removeElements: [],
        neutralizeClickElements: [],
        skipClickElements: [detection.skipControl],
        blockRequestHints: [],
        mainWorldHooksAllowed: false,
        reason: detection.reason
      };
    },
    shouldDisableForBreakage(_document) {
      return false;
    }
  };

  // src/js/video-adblock/site-adapters/rutube-yandex-vas.ts
  function isRutubeHost(hostname) {
    const host = hostname.toLowerCase();
    return host === "rutube.ru" || host.endsWith(".rutube.ru");
  }
  var rutubeYandexVasAdapter = {
    id: "rutube-yandex-vas",
    domains: ["rutube.ru"],
    mainWorldHooksAllowed: false,
    matches(hostname) {
      return isRutubeHost(hostname);
    },
    detectPlayer(document2) {
      const sig = getVideoAdSignature("yandex-vas");
      if (!sig) return [];
      const results = [];
      for (const sel of sig.videoSelectors) {
        for (const el of document2.querySelectorAll(sel)) {
          results.push(el);
        }
      }
      return Array.from(new Set(results));
    },
    detectAdState(document2, video) {
      const match = detectKnownVideoAdSignature(document2, video, ["yandex-vas"]);
      if (match) {
        return {
          isAd: true,
          confidence: match.confidence,
          reason: match.reason,
          video,
          container: match.container
        };
      }
      return {
        isAd: false,
        confidence: "none",
        reason: "no-rutube-yandex-vas-signal"
      };
    },
    getSafeActions(document2, detection) {
      if (!detection.isAd || detection.confidence === "none") {
        return {
          hideSelectors: [],
          removeSelectors: [],
          markSelectors: [],
          hideElements: [],
          removeElements: [],
          neutralizeClickElements: [],
          skipClickElements: [],
          blockRequestHints: [],
          mainWorldHooksAllowed: false,
          reason: "no-ad"
        };
      }
      return {
        hideSelectors: [
          '[data-testid="advert"]',
          "#raichu_yasdk_container",
          '[class*="yandex-advert-module__SDKWrapper"]'
        ],
        removeSelectors: [],
        markSelectors: [],
        hideElements: detection.container ? [detection.container] : [],
        removeElements: [],
        neutralizeClickElements: [],
        skipClickElements: [],
        blockRequestHints: [
          "strm.yandex.ru/*xVASx",
          "yastatic.net/partner-code-bundles/*/vas-bundles"
        ],
        mainWorldHooksAllowed: false,
        reason: detection.reason
      };
    },
    shouldDisableForBreakage(document2) {
      return false;
    }
  };

  // src/js/video-adblock/site-adapters/embed-player-videojs-vast.ts
  var VIDEOJS_VAST_EMBED_HOSTS = [
    "embed-player.space",
    "semyana.top"
  ];
  var VIDEOJS_VAST_CONTENT_HOST_HINTS = [
    "embed-player.space",
    "cf-cdn.embed-player.space",
    "semyana.website",
    "cf-cdn.semyana.website"
  ];
  var VIDEOJS_VAST_AD_REQUEST_HINTS = [
    "vast.yomeno.xyz",
    "roomgome.com",
    "syndication.realsrv.com",
    "v.scurra.space",
    "markreptiloid.com",
    "serve.7kprtners.com",
    "cenoobi.run",
    "deductgreedyheadroom.com",
    "s.magsrv.com",
    "rtb.tsyndicate.com"
  ];
  var VIDEOJS_VAST_AD_MEDIA_PATTERNS = [
    /^https:\/\/cs\d+\.roomgome\.com\/content\/\d+\/\d+_\d+\.mp4/i,
    /^https:\/\/vacdn\.rtb\.tsyndicate\.com\/videos\/.+\.mp4/i
  ];
  function hostMatches3(hostname, knownHost) {
    const host = hostname.toLowerCase();
    return host === knownHost || host.endsWith(`.${knownHost}`);
  }
  function isVideojsVastEmbedHost(hostname) {
    return VIDEOJS_VAST_EMBED_HOSTS.some((knownHost) => hostMatches3(hostname, knownHost));
  }
  function hasVastSignals(document2) {
    return {
      hasVastOverlay: document2.querySelector("#vast_wrapper") !== null,
      hasVideoJsAdState: document2.querySelector(".video-js.vjs-ad-playing") !== null,
      hasVastControl: document2.querySelector(".vast-btns, .vdd-skip, .vdd-countdown") !== null
    };
  }
  function sourceHasContentHostHint(source) {
    const src = source.src || "";
    return VIDEOJS_VAST_CONTENT_HOST_HINTS.some((hint) => src.includes(hint));
  }
  function isKnownVideojsVastAdMediaUrl(src) {
    return VIDEOJS_VAST_AD_MEDIA_PATTERNS.some((pattern) => pattern.test(src));
  }
  function isLikelyVideojsVastMediaAd(video) {
    const src = video.currentSrc || video.src || "";
    if (!src) return false;
    const player = video.closest(".video-js");
    if (!player?.classList.contains("vjs-ad-playing")) return false;
    const hasContentSource = Array.from(video.querySelectorAll("source")).some(sourceHasContentHostHint);
    if (!hasContentSource) return false;
    return isKnownVideojsVastAdMediaUrl(src);
  }
  var embedPlayerVideojsVastAdapter = {
    id: "videojs-vast-embed",
    domains: VIDEOJS_VAST_EMBED_HOSTS,
    mainWorldHooksAllowed: false,
    matches(hostname) {
      return isVideojsVastEmbedHost(hostname);
    },
    detectPlayer(document2) {
      return Array.from(
        document2.querySelectorAll("video.vjs-tech, .video-js video")
      );
    },
    detectAdState(document2, video) {
      const match = detectKnownVideoAdSignature(document2, video, ["videojs-vast"]);
      const signals = hasVastSignals(document2);
      const isMediaAd = isLikelyVideojsVastMediaAd(video);
      if (match || signals.hasVastOverlay || signals.hasVideoJsAdState && signals.hasVastControl || isMediaAd) {
        const container = document2.querySelector("#vast_wrapper") ?? void 0;
        return {
          isAd: true,
          confidence: "high",
          reason: match?.reason || (isMediaAd ? "videojs-vast-media-ad-state" : signals.hasVastOverlay ? "vast-overlay-found" : "videojs-ad-state-with-vast-control"),
          video,
          container
        };
      }
      return {
        isAd: false,
        confidence: "none",
        reason: "no-videojs-vast-signal"
      };
    },
    getSafeActions(document2, detection) {
      if (!detection.isAd || detection.confidence === "none") {
        return {
          hideSelectors: [],
          removeSelectors: [],
          markSelectors: [],
          hideElements: [],
          removeElements: [],
          neutralizeClickElements: [],
          skipClickElements: [],
          blockRequestHints: [],
          mainWorldHooksAllowed: false,
          reason: "no-ad"
        };
      }
      return {
        hideSelectors: [
          ".vast-btns.vdd-addtext",
          ".vast-btns.vdd-countdown"
        ],
        removeSelectors: [],
        markSelectors: [],
        hideElements: [],
        removeElements: [],
        neutralizeClickElements: [],
        skipClickElements: Array.from(
          document2.querySelectorAll(".vast-btns.vdd-skip")
        ),
        blockRequestHints: VIDEOJS_VAST_AD_REQUEST_HINTS,
        mainWorldHooksAllowed: false,
        reason: detection.reason
      };
    },
    shouldDisableForBreakage(document2) {
      return false;
    }
  };

  // src/js/video-adblock/site-adapters/jwplayer-vast.ts
  var JWPLAYER_VAST_HOSTS = [
    "noodlemagazine.net",
    "nmcorp.video"
  ];
  var JWPLAYER_VAST_AD_REQUEST_HINTS = [
    "s.magsrv.com",
    "tsyndicate.com",
    "kintg.site",
    "clammyendearedkeg.com"
  ];
  function hostMatches4(hostname, knownHost) {
    const host = hostname.toLowerCase();
    return host === knownHost || host.endsWith(`.${knownHost}`);
  }
  var JWPLAYER_CONTENT_HOST_HINTS = [
    "pvvstream.pro",
    "cdn.pvvstream.pro",
    "cdn2.pvvstream.pro"
  ];
  var JWPLAYER_AD_MEDIA_HINTS = [
    "video.sacdnssedge.com/video/ol_"
  ];
  function isJwplayerVastHost(hostname) {
    return JWPLAYER_VAST_HOSTS.some((knownHost) => hostMatches4(hostname, knownHost));
  }
  function hasJwplayerVastSignals(document2) {
    return {
      hasJwPlayerAdState: document2.querySelector(".jwplayer.jw-flag-ads") !== null,
      hasVastPlugin: document2.querySelector("#player_box_vast, .jw-plugin-vast") !== null,
      hasSkipControl: document2.querySelector(".jw-skip, .jw-skiptext") !== null,
      hasAdPlacementProbe: document2.querySelector(".afs_ads.ad-placement") !== null
    };
  }
  function isLikelyJwplayerVastMediaAd(video) {
    const src = video.currentSrc || video.src || "";
    if (!src) return false;
    const player = video.closest(".jwplayer");
    if (!player?.classList.contains("jw-flag-ads")) return false;
    const hasContentSource = Array.from(video.querySelectorAll("source")).some((source) => {
      const sourceSrc = source.src || "";
      return JWPLAYER_CONTENT_HOST_HINTS.some((hint) => sourceSrc.includes(hint));
    });
    const looksLikeAdMedia = JWPLAYER_AD_MEDIA_HINTS.some((hint) => src.includes(hint));
    return hasContentSource && looksLikeAdMedia;
  }
  var jwplayerVastAdapter = {
    id: "jwplayer-vast",
    domains: JWPLAYER_VAST_HOSTS,
    mainWorldHooksAllowed: false,
    matches(hostname) {
      return isJwplayerVastHost(hostname);
    },
    detectPlayer(document2) {
      return Array.from(
        document2.querySelectorAll("video.jw-video, .jwplayer video")
      );
    },
    detectAdState(document2, video) {
      const match = detectKnownVideoAdSignature(document2, video, ["jwplayer-vast"]);
      const signals = hasJwplayerVastSignals(document2);
      const isMediaAd = isLikelyJwplayerVastMediaAd(video);
      if (match || signals.hasVastPlugin || signals.hasAdPlacementProbe || signals.hasJwPlayerAdState && signals.hasSkipControl || isMediaAd) {
        const container = document2.querySelector("#player_box_vast") || document2.querySelector(".jw-plugin-vast") || document2.querySelector(".jw-skip") || void 0;
        return {
          isAd: true,
          confidence: "high",
          reason: match?.reason || (isMediaAd ? "jwplayer-vast-media-ad-state" : signals.hasVastPlugin ? "jwplayer-vast-plugin-found" : signals.hasAdPlacementProbe ? "jwplayer-ad-placement-probe-found" : "jwplayer-ad-state-with-skip-control"),
          video,
          container
        };
      }
      return {
        isAd: false,
        confidence: "none",
        reason: "no-jwplayer-vast-signal"
      };
    },
    getSafeActions(document2, detection) {
      if (!detection.isAd || detection.confidence === "none") {
        return {
          hideSelectors: [],
          removeSelectors: [],
          markSelectors: [],
          hideElements: [],
          removeElements: [],
          neutralizeClickElements: [],
          skipClickElements: [],
          blockRequestHints: [],
          mainWorldHooksAllowed: false,
          reason: "no-ad"
        };
      }
      const neutralizeTargets = Array.from(
        document2.querySelectorAll(
          "#player_box_vast, .jw-plugin-vast, .afs_ads.ad-placement"
        )
      );
      return {
        hideSelectors: [
          "#player_box_vast",
          ".jw-plugin-vast",
          ".afs_ads.ad-placement"
        ],
        removeSelectors: [],
        markSelectors: [],
        hideElements: [],
        removeElements: [],
        neutralizeClickElements: neutralizeTargets,
        skipClickElements: Array.from(
          document2.querySelectorAll(".jw-skip, .jw-skiptext")
        ),
        blockRequestHints: JWPLAYER_VAST_AD_REQUEST_HINTS,
        mainWorldHooksAllowed: false,
        reason: detection.reason
      };
    },
    shouldDisableForBreakage(document2) {
      return false;
    }
  };

  // src/js/video-adblock/site-adapters/kt-player-ad.ts
  var KT_PLAYER_HOSTS = [
    "ppembed.com",
    "p0sembed.com"
  ];
  var KT_PLAYER_AD_REQUEST_HINTS = [
    "s.magsrv.com",
    "foxiceberg.com",
    "btsar.space"
  ];
  function hostMatches5(hostname, knownHost) {
    const host = hostname.toLowerCase();
    return host === knownHost || host.endsWith(`.${knownHost}`);
  }
  function isKtPlayerHost(hostname) {
    return KT_PLAYER_HOSTS.some((knownHost) => hostMatches5(hostname, knownHost));
  }
  function hasKtPlayerAdSignals(document2) {
    return {
      hasKtPlayerAdState: document2.querySelector("#kt_player.kt-player.is-ad-visible, #kt_player.kt-player.is-ad-paused") !== null,
      hasSpotOverlay: document2.querySelector(".spot-box") !== null,
      hasFlowplayerAdBlock: document2.querySelector(".fp-ui-block") !== null,
      hasSkipControl: document2.querySelector(".fp-ui-skip-ad, .fp-play-ad") !== null,
      hasAdClickLayer: document2.querySelector(
        'a[href*="s.magsrv.com"], a[href*="foxiceberg.com"], a[href*="btsar.space"]'
      ) !== null,
      hasExternalAdVideo: document2.querySelector(
        '.fp-ui-block video[src*="bxcdn.net"], #kt_player video[src*="bxcdn.net"], .spot-box video'
      ) !== null
    };
  }
  var ktPlayerAdAdapter = {
    id: "kt-player-ad",
    domains: KT_PLAYER_HOSTS,
    mainWorldHooksAllowed: false,
    matches(hostname) {
      return isKtPlayerHost(hostname);
    },
    detectPlayer(document2) {
      return Array.from(
        document2.querySelectorAll("#kt_player video.fp-engine, .kt-player video.fp-engine")
      );
    },
    detectAdState(document2, video) {
      const match = detectKnownVideoAdSignature(document2, video, ["kt-player-ad"]);
      const signals = hasKtPlayerAdSignals(document2);
      if (match || signals.hasSpotOverlay || signals.hasExternalAdVideo || signals.hasAdClickLayer || signals.hasKtPlayerAdState && (signals.hasFlowplayerAdBlock || signals.hasSkipControl)) {
        const container = document2.querySelector(".spot-box") || document2.querySelector(".fp-ui-block") || document2.querySelector('a[href*="s.magsrv.com"], a[href*="foxiceberg.com"], a[href*="btsar.space"]') || void 0;
        return {
          isAd: true,
          confidence: "high",
          reason: match?.reason || (signals.hasExternalAdVideo ? "kt-player-external-ad-video" : signals.hasSpotOverlay ? "kt-player-spot-overlay" : signals.hasAdClickLayer ? "kt-player-ad-click-layer" : "kt-player-ad-state"),
          video,
          container
        };
      }
      return {
        isAd: false,
        confidence: "none",
        reason: "no-kt-player-ad-signal"
      };
    },
    getSafeActions(document2, detection) {
      if (!detection.isAd || detection.confidence === "none") {
        return {
          hideSelectors: [],
          removeSelectors: [],
          hideElements: [],
          removeElements: [],
          neutralizeClickElements: [],
          skipClickElements: [],
          blockRequestHints: [],
          mainWorldHooksAllowed: false,
          reason: "no-ad"
        };
      }
      return {
        hideSelectors: [
          ".spot-box .spot-label",
          ".spot-box .wrap > div[id]",
          '.spot-box a[href*="foxiceberg.com"]',
          '.spot-box a[href*="s.magsrv.com"]',
          '.spot-box a[href*="btsar.space"]',
          '.fp-ui-block > a[href*="s.magsrv.com"]',
          '.fp-ui-block > a[href*="foxiceberg.com"]',
          '.fp-ui-block > a[href*="btsar.space"]',
          ".fp-ui-block"
        ],
        removeSelectors: [],
        hideElements: [],
        removeElements: [],
        neutralizeClickElements: Array.from(
          document2.querySelectorAll(
            '.spot-box a[href*="foxiceberg.com"], .spot-box a[href*="s.magsrv.com"], .spot-box a[href*="btsar.space"], .fp-ui-block > a[href*="s.magsrv.com"], .fp-ui-block > a[href*="foxiceberg.com"], .fp-ui-block > a[href*="btsar.space"]'
          )
        ),
        skipClickElements: Array.from(
          document2.querySelectorAll(
            ".fp-ui-skip-ad, .fp-play-ad, .spot-box .close-box"
          )
        ),
        blockRequestHints: KT_PLAYER_AD_REQUEST_HINTS,
        mainWorldHooksAllowed: false,
        reason: detection.reason
      };
    },
    shouldDisableForBreakage(document2) {
      return false;
    }
  };

  // src/js/video-adblock/site-adapters/index.ts
  var VIDEO_SITE_ADAPTERS = [
    youtubeAdapter,
    rutubeYandexVasAdapter,
    embedPlayerVideojsVastAdapter,
    jwplayerVastAdapter,
    ktPlayerAdAdapter,
    genericPrerollSkipperAdapter,
    aggressiveVideoGenericAdapter,
    genericHtml5Adapter
  ];
  function isGenericAdapter(adapter) {
    return adapter.domains.includes("*");
  }
  function selectVideoSiteAdapters(hostname) {
    const host = hostname.toLowerCase();
    const matching = VIDEO_SITE_ADAPTERS.filter((adapter) => adapter.matches(host));
    const siteSpecific = matching.filter((adapter) => !isGenericAdapter(adapter));
    if (siteSpecific.length > 0) {
      return siteSpecific;
    }
    return matching;
  }

  // src/js/video-adblock/safe-actions.ts
  var FULL_MUTATION_CAPABILITIES = {
    hideElement: true,
    removeElement: true,
    neutralizeClick: true,
    skipClick: true,
    domMarking: true
  };
  var currentCapabilities = { ...FULL_MUTATION_CAPABILITIES };
  function setMutationCapabilities(caps) {
    currentCapabilities = { ...currentCapabilities, ...caps };
  }
  var mutationLedger = [];
  var cssInjectionInventory = /* @__PURE__ */ new Map();
  function recordCssInjection(selector, layer) {
    cssInjectionInventory.set(selector + "|" + layer, { selector, layer, timestamp: Date.now() });
  }
  function getCssInjectionInventory() {
    return Array.from(cssInjectionInventory.values());
  }
  function clearCssInjectionsForLayer(layer) {
    for (const [key, record] of cssInjectionInventory) {
      if (record.layer === layer) cssInjectionInventory.delete(key);
    }
  }
  function getMutationLedger() {
    return mutationLedger;
  }
  function authorizeMutation(action, element, reason) {
    if (!currentCapabilities) return false;
    switch (action) {
      case "hide":
        return currentCapabilities.hideElement !== false;
      case "remove":
        return currentCapabilities.removeElement !== false;
      case "neutralize-click":
        return currentCapabilities.neutralizeClick !== false;
      case "skip-click":
        return currentCapabilities.skipClick !== false;
      case "mark":
        return currentCapabilities.domMarking !== false;
      default:
        return false;
    }
  }
  function recordMutation(action, element, reason, revert) {
    const token = captureDomToken(element);
    mutationLedger.push({ element, action, reason, timestamp: Date.now(), revert, token });
    if (mutationLedger.length > 1e3) mutationLedger.shift();
  }
  var HIDDEN_ATTR = "data-ubr-video-ad-hidden";
  var PREV_STYLE_ATTR = "data-ubr-video-ad-prev-style";
  var RESTORE_BATCH = [];
  var CLICK_NEUTRALIZED_ATTR = "data-ubr-video-ad-click-neutralized";
  var clickNeutralized = /* @__PURE__ */ new WeakSet();
  var PROTECTED_SELECTORS = [
    "html",
    "body",
    "form",
    "input",
    "textarea",
    "select",
    "button",
    "[contenteditable]",
    "[role=dialog]",
    "[role=alertdialog]",
    "[role=form]",
    "[role=alert]",
    "[role=status]",
    "[role=log]",
    "[role=marquee]",
    "[role=progressbar]",
    "[role=timer]",
    "[aria-live]",
    "[aria-atomic=true]",
    "[aria-relevant]",
    "[autocomplete]",
    // Auth / payment / shell roots
    "[class*=login]",
    "[class*=signin]",
    "[class*=signup]",
    "[class*=auth]",
    "[class*=register]",
    "[class*=password]",
    "[class*=checkout]",
    "[class*=payment]",
    "[class*=cart]",
    "[id*=login]",
    "[id*=signin]",
    "[id*=signup]",
    "[id*=auth]",
    "[id*=checkout]",
    "[id*=payment]",
    "[id*=cart]",
    // Navigation
    "nav",
    "[role=navigation]",
    "[role=menubar]",
    "[role=tablist]",
    // Shell
    "#app",
    "#root",
    "#__next",
    "#__nuxt"
  ];
  function isInsideClosedShadowRoot(element) {
    let el = element;
    const doc = element.ownerDocument;
    while (el && el !== doc) {
      const root = el.getRootNode ? el.getRootNode() : null;
      if (root instanceof ShadowRoot && root.mode === "closed") return true;
      el = el.parentNode || (root instanceof ShadowRoot ? root.host : null);
    }
    return false;
  }
  function isProtectedSiteUi2(element) {
    if (isInsideClosedShadowRoot(element)) return true;
    for (const sel of PROTECTED_SELECTORS) {
      if (element.matches(sel)) return true;
    }
    const host = location.hostname.toLowerCase();
    if (host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtube-nocookie.com" || host.endsWith(".youtube-nocookie.com") || host === "youtu.be" || host.endsWith(".youtu.be")) {
      if (element.closest("ytd-masthead") || element.closest("#masthead") || element.closest("#search") || element.closest("ytd-searchbox") || element.closest("#center") || element.closest("#container.ytd-masthead")) {
        return true;
      }
    }
    return false;
  }
  function isExtensionOwnedElement2(element) {
    if (element.hasAttribute("data-ubol-overlay")) return true;
    if (element.hasAttribute("data-ubol-overlay-dialog")) return true;
    if (element.hasAttribute("data-ubr-extension-ui")) return true;
    const src = element.getAttribute("src") || "";
    if (src.startsWith("chrome-extension://") && (src.includes("/picker-ui.html") || src.includes("/zapper-ui.html"))) return true;
    return false;
  }
  function isActiveOrFocusedElement(element) {
    return element === document.activeElement || element.contains(document.activeElement) || element.getAttribute("aria-live") === "assertive" || element.getAttribute("role") === "alert" || element.getAttribute("role") === "status";
  }
  function hasAccessibleName(element) {
    if (element.hasAttribute("aria-label") && element.getAttribute("aria-label").trim()) return true;
    if (element.hasAttribute("aria-labelledby")) return true;
    if (element.hasAttribute("aria-describedby")) return true;
    return false;
  }
  function hasPointerTrapRisk(element) {
    const style = element instanceof HTMLElement ? getComputedStyle(element) : null;
    if (!style) return false;
    const zIndex = parseInt(style.zIndex || "0", 10);
    if (zIndex > 1e4) return true;
    if (style.position === "fixed" || style.position === "absolute") {
      const rect = element.getBoundingClientRect();
      if (rect.width > window.innerWidth * 0.8 || rect.height > window.innerHeight * 0.8) {
        return true;
      }
    }
    return false;
  }
  function hasContrastRisk(element) {
    const style = element instanceof HTMLElement ? getComputedStyle(element) : null;
    if (!style) return false;
    if (style.forcedColorAdjust !== void 0 && style.forcedColorAdjust !== "auto") return true;
    if (style.backgroundColor === "transparent" && element.querySelector("video, img, canvas, [role=img]")) {
      return true;
    }
    return false;
  }
  function isVirtualizedContainer(element) {
    const role = element.getAttribute("role");
    if (role === "list" || role === "listbox" || role === "grid" || role === "row") {
      const children = element.children;
      if (children.length > 5) {
        const tagSet = /* @__PURE__ */ new Set();
        for (let i = 0; i < Math.min(children.length, 20); i++) {
          tagSet.add(children[i].tagName);
        }
        if (tagSet.size <= 2) return true;
      }
    }
    return false;
  }
  function isShadowDomComponent(element) {
    const tagName = element.tagName || "";
    if (tagName.includes("-")) return true;
    const root = element.getRootNode ? element.getRootNode() : null;
    if (root instanceof ShadowRoot) return true;
    return false;
  }
  function hasExcessiveLayoutShift(element) {
    if (!(element instanceof HTMLElement)) return false;
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;
    const parent = element.parentElement;
    if (!parent) return false;
    const parentRect = parent.getBoundingClientRect();
    if (parentRect.width === 0 || parentRect.height === 0) return false;
    const ratio = rect.width * rect.height / (parentRect.width * parentRect.height);
    return ratio > 0.3;
  }
  function isHostileDomElement(element) {
    const style = element instanceof HTMLElement ? getComputedStyle(element) : null;
    if (!style) return false;
    if (style.position === "fixed" && style.zIndex !== "auto" && Number(style.zIndex) > 9999) {
      if (element.matches(":empty") || element.children.length === 0 && (element.textContent || "").trim() === "") {
        return true;
      }
    }
    return false;
  }
  function captureDomToken(element) {
    const parent = element.parentElement;
    const siblings = parent ? Array.from(parent.children) : [];
    return {
      id: element.id || "",
      tag: element.tagName.toLowerCase(),
      className: element.className && typeof element.className === "string" ? element.className : "",
      anchorId: parent?.id || parent?.getAttribute("data-ubr-anchor") || "",
      depth: 0,
      siblingIndex: parent ? siblings.indexOf(element) : -1,
      capturedAt: Date.now()
    };
  }
  function safelyHideElement(element, reason) {
    if (!(element instanceof Element)) return false;
    if (!authorizeMutation("hide", element, reason)) return false;
    if (isExtensionOwnedElement2(element)) return false;
    if (isProtectedSiteUi2(element)) return false;
    if (isActiveOrFocusedElement(element)) return false;
    if (hasPointerTrapRisk(element)) return false;
    if (hasContrastRisk(element)) return false;
    if (hasAccessibleName(element)) return false;
    if (isHostileDomElement(element)) return false;
    if (isVirtualizedContainer(element)) return false;
    if (isShadowDomComponent(element)) return false;
    if (hasExcessiveLayoutShift(element)) return false;
    const tag = element.tagName.toLowerCase();
    if (tag === "video" || tag === "body" || tag === "html") return false;
    if (element.hasAttribute(HIDDEN_ATTR)) return true;
    const el = element;
    const prevStyle = element.getAttribute("style") || "";
    element.setAttribute(PREV_STYLE_ATTR, prevStyle);
    el.style.setProperty("display", "none", "important");
    element.setAttribute(HIDDEN_ATTR, "true");
    RESTORE_BATCH.push(element);
    recordMutation("hide", element, reason, () => {
      el.style.display = "";
      element.removeAttribute(HIDDEN_ATTR);
      element.removeAttribute(PREV_STYLE_ATTR);
    });
    recordCssInjection(`#${element.id || el.className || el.tagName}`, "video-adblock");
    debugLog("Hid element:", element.tagName, "#" + element.id, reason);
    return true;
  }
  function safelyRemoveElement(element, reason) {
    if (!(element instanceof Element)) return false;
    if (!authorizeMutation("remove", element, reason)) return false;
    if (isExtensionOwnedElement2(element)) return false;
    if (isProtectedSiteUi2(element)) return false;
    if (isActiveOrFocusedElement(element)) return false;
    if (hasPointerTrapRisk(element)) return false;
    if (hasContrastRisk(element)) return false;
    if (hasAccessibleName(element)) return false;
    if (isHostileDomElement(element)) return false;
    if (isVirtualizedContainer(element)) return false;
    if (isShadowDomComponent(element)) return false;
    if (hasExcessiveLayoutShift(element)) return false;
    const tag = element.tagName.toLowerCase();
    if (tag === "video" || tag === "body" || tag === "html") return false;
    if (element.querySelector("video")) return false;
    const parent = element.parentNode;
    const next = element.nextSibling;
    element.remove();
    recordMutation("remove", element, reason, () => {
      if (parent && next) parent.insertBefore(element, next);
      else if (parent) parent.appendChild(element);
    });
    debugLog("Removed element:", element.tagName, "#" + element.id, reason);
    return true;
  }
  function safelyNeutralizeClickElement(element, reason) {
    if (!(element instanceof Element)) return false;
    if (!authorizeMutation("neutralize-click", element, reason)) return false;
    if (isExtensionOwnedElement2(element)) return false;
    if (isProtectedSiteUi2(element)) return false;
    const tag = element.tagName.toLowerCase();
    if (tag === "video" || tag === "body" || tag === "html") return false;
    if (element.contains(document.querySelector("video"))) return false;
    if (clickNeutralized.has(element)) return true;
    clickNeutralized.add(element);
    element.setAttribute(CLICK_NEUTRALIZED_ATTR, "true");
    const handler = (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      debugLog("Neutralized video-ad overlay click:", reason);
    };
    element.addEventListener("pointerdown", handler, true);
    element.addEventListener("mousedown", handler, true);
    element.addEventListener("click", handler, true);
    return true;
  }
  var SKIP_CLICKED_ATTR = "data-ubr-video-ad-skip-clicked";
  var SKIP_RECLICK_COOLDOWN_MS = 1500;
  var skipClickState = /* @__PURE__ */ new WeakMap();
  function classOrIdLooksDisabled2(element) {
    const cls = typeof element.className === "string" ? element.className : "";
    const id = element.id || "";
    const aria = element.getAttribute("aria-label") || "";
    const title = element.getAttribute("title") || "";
    const combined = `${cls} ${id} ${aria} ${title}`.toLowerCase().replace(/_/g, "-");
    return combined.includes("disabled") || combined.includes("disable") || combined.includes("inactive") || combined.includes("not-ready") || combined.includes("notready") || combined.includes("countdown") || combined.includes("wait");
  }
  function safelyClickVisibleSkipControl(element, reason) {
    if (!(element instanceof HTMLElement)) return false;
    if (!authorizeMutation("skip-click", element, reason)) return false;
    if (isInsideClosedShadowRoot(element)) return false;
    if (element.closest("ytd-masthead")) return false;
    const tag = element.tagName.toLowerCase();
    if (tag === "video" || tag === "body" || tag === "html") return false;
    if (element.hasAttribute("disabled")) return false;
    if (element.getAttribute("aria-disabled") === "true") return false;
    if (classOrIdLooksDisabled2(element)) return false;
    const now = Date.now();
    const prior = skipClickState.get(element);
    if (prior && now - prior.lastClickedAt < SKIP_RECLICK_COOLDOWN_MS && prior.lastReason === reason) {
      return true;
    }
    const rect = element.getBoundingClientRect();
    if (rect.width < 20 || rect.height < 10) return false;
    const style = getComputedStyle(element);
    if (style.display === "none") return false;
    if (style.visibility === "hidden") return false;
    if (style.pointerEvents === "none") return false;
    if (Number(style.opacity || "1") < 0.1) return false;
    skipClickState.set(element, {
      lastClickedAt: now,
      lastReason: reason
    });
    element.setAttribute(SKIP_CLICKED_ATTR, "true");
    debugLog("Clicking visible video-ad skip control:", reason);
    element.click();
    return true;
  }
  var MARKED_ATTR = "data-ubr-ad-marker";
  var MARKER_CLASS_BASE = "ubr-ad-marker";
  var MARKER_CLASS_SUFFIX = Math.random().toString(36).slice(2, 8);
  var MARKED_CLASS = MARKER_CLASS_BASE + MARKER_CLASS_SUFFIX;
  function safelyMarkElement(element, reason) {
    if (!(element instanceof Element)) return false;
    if (isExtensionOwnedElement2(element)) return false;
    if (isProtectedSiteUi2(element)) return false;
    if (isInsideClosedShadowRoot(element)) return false;
    if (element.hasAttribute(MARKED_ATTR)) return true;
    element.setAttribute(MARKED_ATTR, "true");
    element.classList.add(MARKED_CLASS);
    debugLog("Marked element:", element.tagName, reason);
    return true;
  }
  function restoreHiddenVideoAds(root) {
    const elements = root ? Array.from(root.querySelectorAll(`[${HIDDEN_ATTR}]`)) : RESTORE_BATCH.slice();
    for (const el of elements) {
      if (!(el instanceof HTMLElement)) continue;
      const prevStyle = el.getAttribute(PREV_STYLE_ATTR);
      if (prevStyle !== null && prevStyle !== "") {
        el.setAttribute("style", prevStyle);
      } else {
        el.style.removeProperty("display");
      }
      el.removeAttribute(HIDDEN_ATTR);
      el.removeAttribute(PREV_STYLE_ATTR);
    }
    debugLog(`Restored ${elements.length} hidden elements`);
  }
  function restoreAll() {
    const ledgerCopy = [...mutationLedger];
    for (let i = ledgerCopy.length - 1; i >= 0; i--) {
      const record = ledgerCopy[i];
      if (record.revert) {
        try {
          record.revert();
        } catch (e) {
          console.warn("[uBR] restoreAll revert failed:", e);
        }
      }
    }
    mutationLedger.length = 0;
    clearCssInjectionsForLayer("all");
    debugLog("Restored all mutations");
  }
  function applySafeActionPlan(plan, capabilities, root, dryRun) {
    const caps = capabilities ?? currentCapabilities;
    const doc = root || document;
    const result = {
      hidden: 0,
      removed: 0,
      marked: 0,
      neutralizedClicks: 0,
      clickedSkips: 0
    };
    if (dryRun) {
      debugLog("[dry-run] SafeActionPlan:", plan.reason, "hide:", (plan.hideSelectors || []).length, "remove:", (plan.removeSelectors || []).length, "mark:", (plan.markSelectors || []).length);
      return result;
    }
    if (caps.domMarking) {
      for (const el of plan.markElements ?? []) {
        if (safelyMarkElement(el, plan.reason)) result.marked++;
      }
    }
    if (caps.hideElement) {
      for (const el of plan.hideElements ?? []) {
        if (safelyHideElement(el, plan.reason)) result.hidden++;
      }
    }
    if (caps.removeElement) {
      for (const el of plan.removeElements ?? []) {
        if (safelyRemoveElement(el, plan.reason)) result.removed++;
      }
    }
    if (caps.neutralizeClick) {
      for (const el of plan.neutralizeClickElements ?? []) {
        if (safelyNeutralizeClickElement(el, plan.reason)) result.neutralizedClicks++;
      }
    }
    if (caps.skipClick) {
      for (const el of plan.skipClickElements ?? []) {
        if (safelyClickVisibleSkipControl(el, plan.reason)) result.clickedSkips++;
      }
    }
    if (caps.domMarking) {
      for (const selector of plan.markSelectors ?? []) {
        try {
          const elements = doc.querySelectorAll(selector);
          for (const el of elements) {
            if (safelyMarkElement(el, plan.reason)) result.marked++;
          }
        } catch {
        }
      }
    }
    if (caps.hideElement) {
      for (const selector of plan.hideSelectors ?? []) {
        try {
          const elements = doc.querySelectorAll(selector);
          for (const el of elements) {
            if (safelyHideElement(el, plan.reason)) result.hidden++;
          }
        } catch {
        }
      }
    }
    if (caps.removeElement) {
      for (const selector of plan.removeSelectors ?? []) {
        try {
          const elements = doc.querySelectorAll(selector);
          for (const el of elements) {
            if (safelyRemoveElement(el, plan.reason)) result.removed++;
          }
        } catch {
        }
      }
    }
    return result;
  }

  // src/js/video-adblock/video-ad-lifecycle.ts
  var lifecycles = /* @__PURE__ */ new WeakMap();
  function getVideoAdLifecycle(video) {
    let state = lifecycles.get(video);
    if (!state) {
      state = {
        state: "idle",
        lastPlayAt: 0,
        lastAdSignalAt: 0,
        lastSkipClickAt: 0,
        lastContentSignalAt: 0,
        lastSrc: video.currentSrc || video.src || "",
        lastCurrentTime: 0,
        stableContentTicks: 0,
        adBreakIndex: 0,
        lastUserGestureAt: 0,
        armedUntil: 0
      };
      lifecycles.set(video, state);
    }
    return state;
  }
  function markVideoPlay(video) {
    const s = getVideoAdLifecycle(video);
    s.lastPlayAt = Date.now();
    if (s.state === "idle") {
      s.state = "content-candidate";
    }
  }
  function markAdSignal(video, _reason) {
    const s = getVideoAdLifecycle(video);
    const now = Date.now();
    s.lastAdSignalAt = now;
    if (s.state === "content-playing") {
      s.state = "ad-reinjected";
      s.adBreakIndex++;
      return;
    }
    if (s.state !== "skip-clicked" && s.state !== "post-skip-verifying") {
      s.state = "ad-candidate";
    }
  }
  function markSkipClicked(video) {
    const s = getVideoAdLifecycle(video);
    s.lastSkipClickAt = Date.now();
    s.state = "skip-clicked";
  }
  function markContentTick(video) {
    const s = getVideoAdLifecycle(video);
    const now = Date.now();
    const currentSrc = video.currentSrc || video.src || "";
    const currentTime = Number.isFinite(video.currentTime) ? video.currentTime : 0;
    if (currentSrc !== s.lastSrc) {
      s.lastSrc = currentSrc;
      s.stableContentTicks = 0;
      if (s.state === "content-playing") {
        s.state = "ad-reinjected";
        s.adBreakIndex++;
      }
      return;
    }
    if (currentTime > s.lastCurrentTime + 0.25 && !video.paused) {
      s.stableContentTicks++;
      s.lastContentSignalAt = now;
    }
    s.lastCurrentTime = currentTime;
    if ((s.state === "skip-clicked" || s.state === "post-skip-verifying" || s.state === "content-candidate") && s.stableContentTicks >= 3) {
      s.state = "content-playing";
    }
  }
  var USER_GESTURE_ARM_WINDOW_MS = 2e4;
  function markUserPlayGesture(video) {
    const s = getVideoAdLifecycle(video);
    const now = Date.now();
    s.lastUserGestureAt = now;
    s.armedUntil = now + USER_GESTURE_ARM_WINDOW_MS;
    if (s.state === "idle" || s.state === "content-playing") {
      s.state = "content-candidate";
    }
  }
  function shouldKeepScanningAggressively(video) {
    const s = getVideoAdLifecycle(video);
    const now = Date.now();
    return now < s.armedUntil || s.state === "ad-candidate" || s.state === "skip-waiting" || s.state === "skip-clicked" || s.state === "post-skip-verifying" || s.state === "ad-reinjected" || now - s.lastPlayAt < 15e3 || now - s.lastAdSignalAt < 15e3;
  }

  // src/js/video-adblock/player-gesture-arm.ts
  var installed = false;
  var lastArmedAt = 0;
  var armHandler = null;
  function isEditableTarget(target) {
    if (!(target instanceof Element)) return false;
    const tag = target.tagName.toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return true;
    if (target.isContentEditable) return true;
    return false;
  }
  function rectContainsPoint(rect, x, y) {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }
  function expandedRectContainsPoint(rect, x, y) {
    const padX = rect.width * 0.35;
    const padY = rect.height * 0.35;
    return x >= rect.left - padX && x <= rect.right + padX && y >= rect.top - padY && y <= rect.bottom + padY;
  }
  function videoContainsGesture(video, x, y) {
    const rect = video.getBoundingClientRect();
    if (rect.width < 200 || rect.height < 100) return false;
    if (rectContainsPoint(rect, x, y)) return true;
    const container = getLikelyVideoContainer(video) || video.parentElement;
    if (container) {
      const cr = container.getBoundingClientRect();
      if (expandedRectContainsPoint(cr, x, y)) return true;
    }
    return false;
  }
  function findVideoForGesture(event, knownVideos) {
    const x = event.clientX;
    const y = event.clientY;
    for (const video of knownVideos) {
      if (!video.isConnected) continue;
      if (videoContainsGesture(video, x, y)) return video;
    }
    const currentVideos = findVideoElements(document).filter((v) => isLikelyPrimaryVideo(v));
    for (const video of currentVideos) {
      if (videoContainsGesture(video, x, y)) return video;
    }
    return null;
  }
  function shouldIgnoreGesture(event) {
    if (event.defaultPrevented) return true;
    if (isEditableTarget(event.target)) return true;
    if (event instanceof MouseEvent && event.button !== 0) return true;
    const target = event.target;
    if (target instanceof Element) {
      if (target.closest("[data-ubr-extension-ui]")) return true;
      if (target.closest("[data-ubol-overlay]")) return true;
      if (target.closest("[data-ubol-overlay-dialog]")) return true;
    }
    return false;
  }
  function installPlayerGestureArm(options) {
    if (installed) return;
    installed = true;
    armHandler = (event) => {
      if (!(event instanceof MouseEvent) && !(event instanceof PointerEvent)) return;
      if (shouldIgnoreGesture(event)) return;
      const now = Date.now();
      if (now - lastArmedAt < 500) return;
      const video = findVideoForGesture(event, options.getVideos());
      if (!video) return;
      lastArmedAt = now;
      options.onArmed(video, "trusted-player-region-gesture");
    };
    document.addEventListener("pointerdown", armHandler, true);
    document.addEventListener("mousedown", armHandler, true);
    document.addEventListener("click", armHandler, true);
  }

  // src/js/video-adblock/video-engine.ts
  var SCAN_INTERVAL = 250;
  var MAX_NODES_PER_SCAN = 150;
  var MAX_ERRORS = 5;
  var MAX_EMPTY_SCANS_BEFORE_BACKOFF = 40;
  var SLOW_SCAN_INTERVAL = 1500;
  var observer = null;
  var scanTimer = null;
  var errorCount = 0;
  var emptyScanCount = 0;
  var currentScanInterval = SCAN_INTERVAL;
  var instrumentedVideos = /* @__PURE__ */ new WeakSet();
  var fastScanTimer = null;
  var lastKnownPlayers = [];
  function stopEngine(reason) {
    markEngineDisabled(reason);
    restoreHiddenVideoAds();
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (scanTimer) {
      clearTimeout(scanTimer);
      scanTimer = null;
    }
    if (fastScanTimer) {
      clearInterval(fastScanTimer);
      fastScanTimer = null;
    }
    debugLog("Engine stopped:", reason);
  }
  function instrumentVideo(video) {
    if (instrumentedVideos.has(video)) return;
    instrumentedVideos.add(video);
    video.addEventListener("play", () => {
      markVideoPlay(video);
      ensureFastScanLoop();
    }, true);
    video.addEventListener("playing", () => {
      markContentTick(video);
      ensureFastScanLoop();
    }, true);
    video.addEventListener("timeupdate", () => {
      markContentTick(video);
    }, true);
    video.addEventListener("loadedmetadata", () => {
      ensureFastScanLoop();
    }, true);
    video.addEventListener("durationchange", () => {
      ensureFastScanLoop();
    }, true);
    video.addEventListener("waiting", () => {
      ensureFastScanLoop();
    }, true);
    video.addEventListener("pause", () => {
      ensureFastScanLoop();
    }, true);
  }
  function ensureFastScanLoop() {
    if (fastScanTimer !== null) return;
    fastScanTimer = window.setInterval(() => {
      const active = lastKnownPlayers.some(
        (video) => video.isConnected && shouldKeepScanningAggressively(video)
      );
      if (!active) {
        if (fastScanTimer !== null) {
          clearInterval(fastScanTimer);
          fastScanTimer = null;
        }
        return;
      }
      try {
        scan();
      } catch (err) {
        warnLog("Fast scan error:", err);
      }
    }, 250);
  }
  function scan() {
    if (isEngineDisabled()) return;
    const hostname = location.hostname.toLowerCase();
    if (!isKnownVideoAdapterHost(hostname)) {
      stopEngine("unknown-host");
      return;
    }
    if (!shouldEnableGenericVideoEngine(document, hostname)) {
      emptyScanCount++;
      if (emptyScanCount >= MAX_EMPTY_SCANS_BEFORE_BACKOFF) {
        currentScanInterval = SLOW_SCAN_INTERVAL;
      }
      debugLog("No video found yet; keeping observer alive");
      return;
    }
    const adapters = selectVideoSiteAdapters(hostname);
    if (adapters.length === 0) {
      stopEngine("no-adapter");
      return;
    }
    const activeAdapters = adapters.filter((adapter) => !adapter.shouldDisableForBreakage(document));
    if (activeAdapters.length === 0) {
      stopEngine("all-adapters-requested-disable");
      return;
    }
    const players = Array.from(
      new Set(activeAdapters.flatMap((adapter) => adapter.detectPlayer(document)))
    );
    if (players.length === 0) {
      emptyScanCount++;
      if (emptyScanCount >= MAX_EMPTY_SCANS_BEFORE_BACKOFF) {
        currentScanInterval = SLOW_SCAN_INTERVAL;
      }
      debugLog("No primary video players found yet; keeping observer alive");
      return;
    }
    lastKnownPlayers = players;
    for (const video of players) {
      instrumentVideo(video);
    }
    emptyScanCount = 0;
    currentScanInterval = SCAN_INTERVAL;
    if (players.length > MAX_NODES_PER_SCAN) {
      markEngineDisabled("too-many-videos");
      return;
    }
    for (const video of players) {
      for (const adapter of activeAdapters) {
        const detection = adapter.detectAdState(document, video);
        if (!detection.isAd || detection.confidence === "none") continue;
        markAdSignal(video, detection.reason);
        const plan = adapter.getSafeActions(document, detection);
        const actionResult = applySafeActionPlan(plan);
        if (actionResult.clickedSkips > 0) {
          markSkipClicked(video);
        }
        debugLog("Applied action for:", adapter.id, detection.reason);
        if (detection.confidence === "high") break;
      }
    }
  }
  function startVideoAdBlocker() {
    if (isEngineDisabled()) return;
    debugLog("Starting video ad blocker");
    scan();
    try {
      observer = new MutationObserver(() => {
        if (scanTimer !== null) return;
        scanTimer = setTimeout(() => {
          scanTimer = null;
          try {
            scan();
          } catch (err) {
            errorCount++;
            warnLog("Scan error:", err);
            if (errorCount >= MAX_ERRORS) {
              stopEngine("too-many-errors");
            }
          }
        }, currentScanInterval);
      });
      observer.observe(document, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
        attributeFilter: ["src", "class", "id", "style", "disabled", "aria-disabled", "aria-label", "title"]
      });
    } catch (err) {
      warnLog("Failed to start observer:", err);
      stopEngine("observer-failed");
    }
    installPlayerGestureArm({
      getVideos: () => lastKnownPlayers.filter((video) => video.isConnected),
      onArmed: (video, reason) => {
        markUserPlayGesture(video);
        ensureFastScanLoop();
      }
    });
  }

  // src/js/video-adblock/index.ts
  (async () => {
    try {
      let policy = self.__uborPagePolicy ?? (typeof vAPI === "object" && vAPI !== null ? await vAPI.messaging.send("contentscript", {
        what: "getPagePolicy",
        url: location.href,
        hostname: location.hostname
      }).catch(() => null) : null);
      if (!policy) {
        policy = await new Promise((resolve) => {
          const handler = (event) => {
            if (event.source !== window) return;
            if (event.data?.ubrPolicyResponse?.policy) {
              window.removeEventListener("message", handler);
              resolve(event.data.ubrPolicyResponse.policy);
            }
          };
          window.addEventListener("message", handler);
          window.postMessage({ ubrPolicyRequest: true }, "*");
          setTimeout(() => {
            window.removeEventListener("message", handler);
            resolve(null);
          }, 2e3);
        });
      }
      if (!policy || policy.genericVideo === "off") {
        return;
      }
      if (policy.video) {
        setMutationCapabilities({
          hideElement: policy.video.allowMutation === true,
          removeElement: policy.video.allowMutation === true,
          neutralizeClick: policy.video.allowMutation === true,
          skipClick: policy.video.allowSkipClick === true
        });
      }
      try {
        chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
          if (msg.what === "getMutationLedger") {
            sendResponse({ ledger: getMutationLedger() });
          }
          if (msg.what === "getCssInjectionInventory") {
            sendResponse({ inventory: getCssInjectionInventory() });
          }
          if (msg.what === "rollbackMutations") {
            restoreAll();
            sendResponse({ ok: true });
          }
        });
      } catch (e) {
      }
      try {
        const channel = new BroadcastChannel("uBR");
        channel.onmessage = (event) => {
          const msg = event.data || {};
          if (msg.what === "rollbackMutations") {
            restoreAll();
          }
        };
      } catch (e) {
      }
      startVideoAdBlocker();
      self.__ubrVideoRuntimeActive = true;
    } catch (error) {
      console.warn("[uBR] video-adblock failed to start", error);
    }
  })();
})();
