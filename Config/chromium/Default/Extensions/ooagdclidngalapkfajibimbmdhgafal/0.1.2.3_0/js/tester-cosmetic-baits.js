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

  const BAITS = [
    "ad-banner",
    "adsbox",
    "advert",
    "ad-container",
    "google-ad",
    "sponsored-content",
    "adsbygoogle",
    "doubleclick-ad",
    "banner-advertisement",
    "textAd",
    "textad",

    "adunit",
    "ad-unit",
    "advertisement",
    "advertising",
    "banner",
    "300x250",
    "728x90",
  ];

  const lowerBaits = BAITS.map(s => s.toLowerCase());

  function markActive() {
    const root = document.documentElement || document.querySelector("html");
    if (root) {
      root.setAttribute("data-ubr-tester-cosmetic", "active-v2");
    }
  }

  function forceHide(el) {
    if (!(el instanceof Element)) return;

    el.style.setProperty("display", "none", "important");
    el.style.setProperty("visibility", "hidden", "important");
    el.style.setProperty("opacity", "0", "important");
    el.style.setProperty("pointer-events", "none", "important");
    el.style.setProperty("width", "0", "important");
    el.style.setProperty("height", "0", "important");
    el.style.setProperty("min-width", "0", "important");
    el.style.setProperty("min-height", "0", "important");
    el.style.setProperty("max-width", "0", "important");
    el.style.setProperty("max-height", "0", "important");
    el.style.setProperty("overflow", "hidden", "important");
    el.style.setProperty("clip-path", "inset(50%)", "important");
    el.style.setProperty("position", "absolute", "important");
    el.style.setProperty("left", "-10000px", "important");
    el.style.setProperty("top", "-10000px", "important");
    el.setAttribute("hidden", "");
    el.setAttribute("aria-hidden", "true");
    el.setAttribute("data-ubr-cosmetic-hidden", "true");

    window.__ubrCosmeticHits ||= [];
    window.__ubrCosmeticHits.push({
      tag: el.tagName,
      id: el.id,
      class: String(el.className),
      src: el.getAttribute("src"),
      data: el.getAttribute("data"),
      href: el.getAttribute("href"),
      text: el.textContent?.slice(0, 120),
    });
  }

  function elementLooksLikeBait(el) {
    if (!(el instanceof Element)) return false;

    const id = String(el.id || "").toLowerCase();
    const cls = String(el.className || "").toLowerCase();
    const name = String(el.getAttribute("name") || "").toLowerCase();
    const testid = String(el.getAttribute("data-testid") || "").toLowerCase();
    const bait = String(el.getAttribute("data-bait") || "").toLowerCase();
    const adtest = String(el.getAttribute("data-ad-test") || "").toLowerCase();
    const adblock = String(el.getAttribute("data-adblock") || "").toLowerCase();

    const combined = [id, cls, name, testid, bait, adtest, adblock].join(" ");

    return lowerBaits.some(token => combined.includes(token));
  }

  function resourceLooksLikeBait(el) {
    if (!(el instanceof Element)) return false;

    const value = ["src", "data", "href", "poster"]
      .map(attr => String(el.getAttribute(attr) || "").toLowerCase())
      .join(" ");

    return (
      value.includes("/banners/") ||
      value.includes("/ads/") ||
      value.includes("/ad/") ||
      value.includes("advertising") ||
      value.includes("ads_banner") ||
      value.includes("banner") ||
      value.includes("adsbygoogle") ||
      value.includes("doubleclick") ||
      value.includes("300x250") ||
      value.includes("728x90")
    );
  }

  function hideBaitContainer(el) {
    if (!(el instanceof Element)) return;

    forceHide(el);

    const wrapper =
      el.closest(".includeWrapper") ||
      el.closest(".include") ||
      el.closest('[class*="includeWrapper"]') ||
      el.closest('[class*="include"]');

    if (wrapper) {
      forceHide(wrapper);
    }

    const service =
      el.closest(".service") ||
      el.closest('[class*="service"]');

    if (service) {
      service.setAttribute("data-ubr-service-had-hidden-bait", "true");
    }
  }

  function scanTree(root) {
    markActive();

    if (!root) return;

    if (root instanceof Element) {
      if (elementLooksLikeBait(root) || resourceLooksLikeBait(root)) {
        hideBaitContainer(root);
      }
    }

    const all = root.querySelectorAll ? root.querySelectorAll("*") : [];
    for (const el of all) {
      if (elementLooksLikeBait(el) || resourceLooksLikeBait(el)) {
        hideBaitContainer(el);
      }
    }
  }

  function scanAll() {
    scanTree(document.documentElement);
    scanTree(document.body);

    // Open shadow roots if any tester creates bait inside web components.
    for (const el of document.querySelectorAll("*")) {
      if (el.shadowRoot) {
        scanTree(el.shadowRoot);
      }
    }
  }

  function collectPotentialAdNodes() {
    window.__ubrPotentialAdNodes = [...document.querySelectorAll("*")]
      .map(el => ({
        tag: el.tagName,
        id: el.id,
        class: String(el.className),
        src: el.getAttribute("src"),
        data: el.getAttribute("data"),
        href: el.getAttribute("href"),
        role: el.getAttribute("role"),
        aria: el.getAttribute("aria-label"),
        style: el.getAttribute("style"),
        text: el.textContent?.slice(0, 120),
        rect: (() => {
          const r = el.getBoundingClientRect();
          return { w: r.width, h: r.height, x: r.x, y: r.y };
        })(),
      }))
      .filter(x =>
        /ad|ads|advert|banner|sponsor|google|doubleclick|300x250|728x90/i.test(
          [x.id, x.class, x.src, x.data, x.href, x.aria, x.text].join(" ")
        )
      )
      .slice(0, 200);
  }

  setTimeout(collectPotentialAdNodes, 1500);

  markActive();
  scanAll();

  new MutationObserver(mutations => {
    markActive();

    for (const mutation of mutations) {
      if (mutation.type === "attributes") {
        if (elementLooksLikeBait(mutation.target) || resourceLooksLikeBait(mutation.target)) {
          hideBaitContainer(mutation.target);
        }
        continue;
      }

      for (const node of mutation.addedNodes) {
        if (node instanceof Element || node instanceof DocumentFragment) {
          scanTree(node);
        }
      }
    }
  }).observe(document, {
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

  document.addEventListener("DOMContentLoaded", scanAll, { once: true });
  setTimeout(scanAll, 0);
  setTimeout(scanAll, 50);
  setTimeout(scanAll, 250);
  setTimeout(scanAll, 1000);
  setInterval(scanAll, 1000);
})();
