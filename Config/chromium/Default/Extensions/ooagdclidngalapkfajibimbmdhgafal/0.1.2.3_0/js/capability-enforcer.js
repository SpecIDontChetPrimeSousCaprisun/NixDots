/**
 * platform/chromium/js/capability-enforcer.js
 *
 * MAIN-world capability token gate.
 *
 * Injected by the service worker into every page that passes policy gating,
 * BEFORE any high-risk runtime layer loads.  Provides global
 * __ubrCapability.check(layer) and __ubrCapability.validate(layer, action).
 *
 * check(layer) — fast local check: token exists + revision matches.
 * validate(layer, action) — async SW-backed check for high-risk operations.
 */

(function() {
    "use strict";

    if (self.__ubrCapability) return;

    function _tokens() { return self.__uborTokens || {}; }
    function _revision() { return self.__uborPolicyRevision; }

    self.__ubrCapability = Object.freeze({
        isFresh(layer) {
            const tokens = _tokens();
            const token = tokens[layer];
            if (!token) return false;
            return token.revision === _revision();
        },
        check(layer) {
            return this.isFresh(layer);
        },
        getPagePolicy() {
            return self.__uborPagePolicy || null;
        },
        getToken(layer) {
            return _tokens()[layer] || undefined;
        },
        getPolicyRevision() {
            return _revision();
        },
        hasStaleTokens() {
            const rev = _revision();
            if (rev == null) return Object.keys(_tokens()).length > 0;
            const tokens = _tokens();
            for (const layer of Object.keys(tokens)) {
                if (tokens[layer].revision !== rev) return true;
            }
            return false;
        },
        async validate(layer, action) {
            const token = _tokens()[layer];
            if (!token) return false;
            if (token.revision !== _revision()) return false;
            if (!token.tokenId) return false;

            const requestId = Math.random().toString(36).slice(2);
            return new Promise((resolve) => {
                const handler = (event) => {
                    if (event.source !== window) return;
                    if (event.data?.what !== "validateTokenResponse") return;
                    if (event.data.requestId !== requestId) return;
                    window.removeEventListener("message", handler);
                    resolve(event.data.valid === true);
                };
                window.addEventListener("message", handler);
                window.postMessage({
                    what: "validateToken",
                    requestId,
                    tokenId: token.tokenId,
                    layer,
                    action,
                }, "*");
                // Timeout after 3 seconds to prevent hanging
                setTimeout(() => {
                    window.removeEventListener("message", handler);
                    resolve(false);
                }, 3000);
            });
        },
    });
})();
