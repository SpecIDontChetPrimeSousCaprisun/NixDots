// GENERATED FILE. Do not edit directly.
// Source: src/js/mv3/stealth-surrogates.ts
// Build command: npm run build
// src/js/mv3/sw-types.ts
var STEALTH_SURROGATE_RULE_ID_MIN = 88e5;
var STEALTH_SURROGATE_RULE_ID_MAX = 8800099;

// src/js/mv3/stealth-surrogates.ts
var STEALTH_MODE_SETTING = "stealthModeEnabled";
var STEALTH_SURROGATE_RULE_ID_BASE = STEALTH_SURROGATE_RULE_ID_MIN;
var STEALTH_SURROGATE_RULE_ID_LIMIT = STEALTH_SURROGATE_RULE_ID_MAX;
var STEALTH_SURROGATE_PRIORITY = 5e5;
var scriptSurrogates = [
  {
    urlFilter: "||pagead2.googlesyndication.com^",
    resourceTypes: ["script", "xmlhttprequest"],
    extensionPath: "/web_accessible_resources/googlesyndication_adsbygoogle.js"
  },
  {
    // Legacy AdSense embeds use this script and synchronously inspect the
    // height of the script's container. It requires a layout surrogate,
    // rather than the modern adsbygoogle API surrogate above.
    urlFilter: "||pagead2.googlesyndication.com/pagead/show_ads.js",
    resourceTypes: ["script"],
    extensionPath: "/web_accessible_resources/googlesyndication_show_ads.js",
    priority: STEALTH_SURROGATE_PRIORITY + 1
  },
  {
    urlFilter: "||securepubads.g.doubleclick.net^",
    resourceTypes: ["script", "xmlhttprequest"],
    extensionPath: "/web_accessible_resources/googletagservices_gpt.js"
  },
  {
    urlFilter: "||www.googletagmanager.com^",
    resourceTypes: ["script", "xmlhttprequest"],
    extensionPath: "/web_accessible_resources/googletagmanager_gtm.js"
  },
  {
    urlFilter: "||www.google-analytics.com^",
    resourceTypes: ["script", "xmlhttprequest"],
    extensionPath: "/web_accessible_resources/google-analytics_analytics.js"
  },
  {
    urlFilter: "||ssl.google-analytics.com^",
    resourceTypes: ["script", "xmlhttprequest"],
    extensionPath: "/web_accessible_resources/google-analytics_analytics.js"
  }
];
var imageSurrogates = [
  "widgets.outbrain.com",
  "www.googleadservices.com",
  "ad.doubleclick.net",
  "securepubads.g.doubleclick.net",
  "googleads.g.doubleclick.net",
  "c.amazon-adsystem.com",
  "s.amazon-adsystem.com",
  "adserver.adtech.de",
  "ads.pubmatic.com",
  "ib.adnxs.com",
  "tpc.googlesyndication.com",
  "adservice.google.com"
].map((domain) => ({
  urlFilter: `||${domain}^`,
  resourceTypes: ["image"],
  extensionPath: "/web_accessible_resources/2x2.png"
}));
var STEALTH_SURROGATES = [
  ...scriptSurrogates,
  ...imageSurrogates
];
var createStealthSurrogateRules = () => STEALTH_SURROGATES.map((surrogate, index) => ({
  id: STEALTH_SURROGATE_RULE_ID_BASE + index,
  priority: surrogate.priority ?? STEALTH_SURROGATE_PRIORITY,
  action: {
    type: "redirect",
    redirect: { extensionPath: surrogate.extensionPath }
  },
  condition: {
    urlFilter: surrogate.urlFilter,
    resourceTypes: [...surrogate.resourceTypes]
  }
}));
var isStealthSurrogateRuleId = (id) => Number.isInteger(id) && id >= STEALTH_SURROGATE_RULE_ID_BASE && id <= STEALTH_SURROGATE_RULE_ID_LIMIT;
var syncStealthSurrogateRules = async () => {
  if (chrome.declarativeNetRequest?.updateSessionRules === void 0) return;
  try {
    const existing = await chrome.declarativeNetRequest.getSessionRules();
    const removeRuleIds = existing.map((r) => r.id).filter(isStealthSurrogateRuleId);
    await chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds,
      addRules: createStealthSurrogateRules()
    });
  } catch (e) {
    console.warn("[uBR] syncStealthSurrogateRules failed", e);
  }
};
export {
  STEALTH_MODE_SETTING,
  STEALTH_SURROGATES,
  STEALTH_SURROGATE_PRIORITY,
  STEALTH_SURROGATE_RULE_ID_BASE,
  STEALTH_SURROGATE_RULE_ID_LIMIT,
  createStealthSurrogateRules,
  isStealthSurrogateRuleId,
  syncStealthSurrogateRules
};
