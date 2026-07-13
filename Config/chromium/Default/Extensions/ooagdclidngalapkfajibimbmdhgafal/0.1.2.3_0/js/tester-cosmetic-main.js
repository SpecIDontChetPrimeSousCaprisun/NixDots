(() => {
  const HOSTS = new Set([
    "adblocktesters.com",
    "www.adblocktesters.com",
    "adblock-tester.com",
    "www.adblock-tester.com",
    "adblocktester.pages.dev",
    "obfusgated.com",
    "www.obfusgated.com",
  ]);

  if (!HOSTS.has(location.hostname)) return;

  const BAIT_RE =
    /ad-banner|adsbox|advert|ad-container|google-ad|sponsored-content|adsbygoogle|doubleclick-ad|banner-advertisement|textAd|textad|adunit|ad-unit|advertisement|advertising|300x250|728x90/i;

  const RESOURCE_RE =
    /\/banners\/|\/ads\/|\/ad\/|advertising|ads_banner|adsbygoogle|doubleclick|300x250|728x90/i;

  function textOf(el) {
    if (!(el instanceof Element)) return "";
    return [
      el.id,
      el.className,
      el.getAttribute("name"),
      el.getAttribute("data-testid"),
      el.getAttribute("data-bait"),
      el.getAttribute("data-ad-test"),
      el.getAttribute("data-adblock"),
      el.getAttribute("src"),
      el.getAttribute("data"),
      el.getAttribute("href"),
      el.getAttribute("poster"),
    ].filter(Boolean).join(" ");
  }

  function isBait(el) {
    if (!(el instanceof Element)) return false;

    const direct = textOf(el);
    if (BAIT_RE.test(direct) || RESOURCE_RE.test(direct)) return true;

    const parent =
      el.closest?.(".includeWrapper") ||
      el.closest?.(".include") ||
      el.closest?.('[class*="includeWrapper"]') ||
      el.closest?.('[class*="include"]');

    if (parent && (BAIT_RE.test(textOf(parent)) || RESOURCE_RE.test(parent.innerHTML || ""))) {
      return true;
    }

    return false;
  }

  function zeroRect() {
    return {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      toJSON() {
        return this;
      },
    };
  }

  function forceHide(el) {
    if (!(el instanceof Element)) return;

    el.style.setProperty("display", "none", "important");
    el.style.setProperty("visibility", "hidden", "important");
    el.style.setProperty("opacity", "0", "important");
    el.style.setProperty("width", "0", "important");
    el.style.setProperty("height", "0", "important");
    el.style.setProperty("min-width", "0", "important");
    el.style.setProperty("min-height", "0", "important");
    el.style.setProperty("max-width", "0", "important");
    el.style.setProperty("max-height", "0", "important");
    el.style.setProperty("overflow", "hidden", "important");
    el.setAttribute("hidden", "");
    el.setAttribute("aria-hidden", "true");
    el.setAttribute("data-ubr-main-cosmetic-hidden", "true");

    const wrapper =
      el.closest(".includeWrapper") ||
      el.closest(".include") ||
      el.closest('[class*="includeWrapper"]') ||
      el.closest('[class*="include"]');

    if (wrapper && wrapper !== el) {
      forceHide(wrapper);
    }
  }

  function scan() {
    document.documentElement?.setAttribute("data-ubr-tester-main-cosmetic", "active");

    for (const el of document.querySelectorAll("*")) {
      if (isBait(el)) forceHide(el);
    }
  }

  const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function patchedGetBoundingClientRect() {
    if (isBait(this)) return zeroRect();
    return originalGetBoundingClientRect.call(this);
  };

  const originalGetClientRects = Element.prototype.getClientRects;
  Element.prototype.getClientRects = function patchedGetClientRects() {
    if (isBait(this)) return [];
    return originalGetClientRects.call(this);
  };

  const originalCheckVisibility = Element.prototype.checkVisibility;
  if (typeof originalCheckVisibility === "function") {
    Element.prototype.checkVisibility = function patchedCheckVisibility() {
      if (isBait(this)) return false;
      return originalCheckVisibility.apply(this, arguments);
    };
  }

  const offsetWidthDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");
  if (offsetWidthDescriptor?.get) {
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      configurable: true,
      get() {
        if (isBait(this)) return 0;
        return offsetWidthDescriptor.get.call(this);
      },
    });
  }

  const offsetHeightDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
  if (offsetHeightDescriptor?.get) {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      get() {
        if (isBait(this)) return 0;
        return offsetHeightDescriptor.get.call(this);
      },
    });
  }

  const originalGetComputedStyle = window.getComputedStyle;
  window.getComputedStyle = function patchedGetComputedStyle(el, pseudo) {
    const style = originalGetComputedStyle.call(window, el, pseudo);

    if (!isBait(el)) return style;

    return new Proxy(style, {
      get(target, prop) {
        if (prop === "display") return "none";
        if (prop === "visibility") return "hidden";
        if (prop === "opacity") return "0";
        if (prop === "width") return "0px";
        if (prop === "height") return "0px";
        if (prop === "getPropertyValue") {
          return property => {
            if (property === "display") return "none";
            if (property === "visibility") return "hidden";
            if (property === "opacity") return "0";
            if (property === "width") return "0px";
            if (property === "height") return "0px";
            return target.getPropertyValue(property);
          };
        }
        return Reflect.get(target, prop);
      },
    });
  };

  new MutationObserver(scan).observe(document, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [
      "id",
      "class",
      "name",
      "style",
      "src",
      "data",
      "href",
      "poster",
      "data-testid",
      "data-bait",
      "data-ad-test",
      "data-adblock",
    ],
  });

  scan();
  document.addEventListener("DOMContentLoaded", scan, { once: true });
  setTimeout(scan, 0);
  setTimeout(scan, 50);
  setTimeout(scan, 250);
  setInterval(scan, 1000);
})();
