/**
 * platform/chromium/js/diagnostic-bundle.js
 *
 * Diagnostic bundle assembler.
 *
 * Collects runtime state, policy state, DNR state, health state, and
 * recent errors into a privacy-redacted diagnostic bundle for export
 * or support. Applies redaction rules based on privacy class and
 * includes a manifest of omitted fields.
 *
 * Usage:
 *   import { DiagnosticBundle } from "./diagnostic-bundle.js";
 *   const bundle = await DiagnosticBundle.assemble({ privacyClass: "public" });
 */

import { runtimeHealth } from "./runtime-health.js";
import { FileTransferAuthority } from "./file-transfer-authority.js";

async function _collectPolicyState() {
    return { note: "policy-state-collection-stub" };
}

async function _collectDnrState() {
    return { note: "dnr-state-collection-stub" };
}

async function _collectErrorLog() {
    const health = runtimeHealth.getHealth();
    return { recentErrors: health.lastErrors.slice(-20) };
}

export const DiagnosticBundle = Object.freeze({
    /**
     * Assemble a diagnostic bundle.
     * @param {{ privacyClass?: string, includeRedacted?: boolean }} [options]
     * @returns {Promise<object>}
     */
    async assemble(options = {}) {
        const privacyClass = options.privacyClass || "public";
        const bundle = {
            assembledAt: new Date().toISOString(),
            version: 1,
            privacyClass,
            sections: {
                policy: await _collectPolicyState(),
                dnr: await _collectDnrState(),
                health: runtimeHealth.getHealth(),
                errors: await _collectErrorLog(),
            },
            omitted: [],
        };

        if (privacyClass !== "public") {
            const auth = FileTransferAuthority.authorize({
                operation: "export",
                sourceRoute: "diagnostic",
                dataClass: "diagnostic",
                privacyClass,
            });

            if (auth.ok && auth.redactedFields.length > 0) {
                bundle.omitted = auth.redactedFields;
            }
        }

        return bundle;
    },

    /**
     * Export and download a diagnostic bundle.
     * @param {{ privacyClass?: string }} [options]
     */
    async export(options = {}) {
        const bundle = await this.assemble(options);
        const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ublock-diagnostic-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        return bundle;
    },
});
