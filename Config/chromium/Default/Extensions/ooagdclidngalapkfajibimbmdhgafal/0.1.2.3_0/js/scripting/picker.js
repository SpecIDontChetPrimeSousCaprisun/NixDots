/*******************************************************************************

    uBlock Resurrected - Picker Content Script
    Handles element picking and selector generation

    This script runs in the page context via scripting.executeScript

*******************************************************************************/

(function() {
    

    const ubolOverlay = self.ubolOverlay;
    if (!ubolOverlay) { return; }
    if (ubolOverlay.file === '/picker-ui.html') { return; }

    let previewedSelector = '';
    let previewedCSS = '';
    let previewSavedElements = [];
    const ignoredClassNames = new Set([
        'login-required',
    ]);
    const genericContainerTags = new Set([
        'article',
        'aside',
        'div',
        'footer',
        'header',
        'main',
        'nav',
        'section',
    ]);
    const ignorablePickedTags = new Set([
        'B',
        'CODE',
        'EM',
        'H1',
        'H2',
        'H3',
        'H4',
        'H5',
        'H6',
        'I',
        'P',
        'SMALL',
        'SPAN',
        'STRONG',
    ]);
    const classCache = new WeakMap();
    const attrCache = new WeakMap();

    function clearPickerCache() {
        classCache.delete(document.body);
        classCache.delete(document.documentElement);
        attrCache.delete(document.body);
        attrCache.delete(document.documentElement);
    }

    function qsa(node, selector) {
        if ( ubolOverlay.qsa ) {
            return ubolOverlay.qsa(node, selector);
        }
        if (node === null) { return []; }
        selector = selector.replace(/::[^:]+$/, '');
        try {
            return Array.from(node.querySelectorAll(selector));
        } catch (e) {
            return [];
        }
    }

    function filterToSelector(filter) {
        if ( typeof filter !== 'string' ) { return ''; }
        filter = filter.trim();
        const parts = filter.split('|');
        if (
            (parts[0] === 'hide' || parts[0] === 'unhide') &&
            parts.length >= 2
        ) {
            return parts[parts.length - 1];
        }
        const cosmeticIdx = filter.indexOf('##');
        if ( cosmeticIdx !== -1 ) {
            return filter.slice(cosmeticIdx + 2);
        }
        return filter;
    }

    function scopeCosmeticFilter(filter) {
        const separator = filter.indexOf('##');
        if ( separator === -1 || self.location.hostname === '' ) {
            return filter;
        }
        return `${self.location.hostname}${filter.slice(separator)}`;
    }

    function escapeClassNames(classList) {
        return classList.map((name) => {
            return `.${  CSS.escape(name)}`;
        }).join('');
    }

    function nthOfTypeIndex(elem) {
        let index = 1;
        let prev = elem.previousElementSibling;
        while ( prev ) {
            if ( prev.localName === elem.localName ) {
                index += 1;
            }
            prev = prev.previousElementSibling;
        }
        return index;
    }

    function filterClasses(elem) {
        if (classCache.has(elem)) { return classCache.get(elem); }
        const classAttr = typeof elem.getAttribute === 'function'
            ? elem.getAttribute('class') || ''
            : '';
        const seen = new Set();
        const classes = classAttr.split(/\s+/).filter((name) => {
            if ( name === '' ) { return false; }
            if ( seen.has(name) ) { return false; }
            seen.add(name);
            if ( ignoredClassNames.has(name) ) { return false; }
            if ( name.indexOf('__') !== -1 ) { return false; }
            return true;
        });
        const classCounts = new Map();
        for ( let i = 0; i < classes.length; i++ ) {
            classCounts.set(classes[i], selectorCount(`.${CSS.escape(classes[i])}`));
        }
        classes.sort((a, b) => {
            const countDelta = classCounts.get(a) - classCounts.get(b);
            if ( countDelta !== 0 ) { return countDelta; }
            return b.length - a.length;
        });
        classCache.set(elem, classes);
        return classes;
    }

    function filterDataAttributes(elem) {
        const attrs = [];
        if (typeof elem.getAttribute !== 'function') { return attrs; }
        
        const dataAttrs = ['data-id', 'data-href-url', 'data-event-action', 'data-outbound-url', 'data-outbound-expiration'];
        
        for (let i = 0; i < dataAttrs.length; i++) {
            const value = elem.getAttribute(dataAttrs[i]);
            if (value && value.length > 0) {
                attrs.push({ name: dataAttrs[i], value: value });
            }
        }
        
        if (attrs.length === 0) {
            const allAttrs = elem.attributes;
            if (allAttrs) {
                for (let j = 0; j < allAttrs.length; j++) {
                    const attrName = allAttrs[j].name;
                    if (attrName.startsWith('data-') && allAttrs[j].value) {
                        attrs.push({ name: attrName, value: allAttrs[j].value });
                    }
                }
            }
        }
        
        return attrs;
    }

    function buildAttrSelector(attrs) {
        if (!attrs || attrs.length === 0) { return ''; }
        
        const parts = [];
        for (let i = 0; i < attrs.length; i++) {
            // Use full attribute value, not truncated - critical for uniqueness
            const escapedValue = CSS.escape(attrs[i].value);
            parts.push(`[${  attrs[i].name  }="${  escapedValue  }"]`);
        }
        return parts.join('');
    }

    function filterAllAttributes(elem) {
        if (attrCache.has(elem)) { return attrCache.get(elem); }
        const attrs = [];
        if (typeof elem.getAttribute !== 'function' || !elem.attributes) { return attrs; }
        
        const importantAttrs = [
            'href', 'src', 'title', 'alt', 'name', 'value', 'placeholder',
            'role', 'type', 'lang', 'rel', 'id', 'class'
        ];
        const importantDataAttrs = [
            'data-id', 'data-href-url', 'data-event-action', 'data-outbound-url',
            'data-outbound-expiration', 'data-action', 'data-url', 'data-target',
            'data-src', 'data-title', 'data-text', 'data-post-id', 'data-fullname'
        ];
        
        const seen = new Set();
        
        for (let i = 0; i < elem.attributes.length; i++) {
            const attr = elem.attributes[i];
            const name = attr.name;
            const value = attr.value;
            
            if (!value || seen.has(name)) { continue; }
            seen.add(name);
            
            if (importantAttrs.indexOf(name) !== -1 || name.startsWith('data-') || name.startsWith('aria-')) {
                if (name === 'class' || name === 'id') { continue; }
                attrs.push({ name: name, value: value });
            }
        }
        
        attrCache.set(elem, attrs);
        return attrs;
    }

    function buildPathSelector(elem, targetElem, maxDepth) {
        const parts = [];
        let current = elem;
        let depth = 0;
        
        while (current && current !== document.body && depth < maxDepth) {
            const tagName = CSS.escape(current.localName);
            const classes = filterClasses(current);
            const attrs = filterAllAttributes(current);
            const id = current.id;
            
            let part = tagName;
            
            if (id) {
                part += `#${  CSS.escape(id)}`;
            }
            
            if (classes.length > 0) {
                part += escapeClassNames(classes.slice(0, 2));
            }
            
            if (attrs.length > 0) {
                const attrParts = [];
                for (let i = 0; i < Math.min(attrs.length, 2); i++) {
                    // Use full value for uniqueness
                    attrParts.push(`[${  attrs[i].name  }="${  CSS.escape(attrs[i].value)  }"]`);
                }
                part += attrParts.join('');
            }
            
            parts.unshift(part);
            current = current.parentElement;
            depth++;
        }
        
        return parts.join(' > ');
    }

    function generateAttributeSelectors(elem) {
        const selectors = [];
        const attrs = filterAllAttributes(elem);
        const tagName = CSS.escape(elem.localName);
        const classes = filterClasses(elem);
        
        if (attrs.length === 0 && classes.length === 0) { return selectors; }
        
        // Generate selectors with ALL classes combined (most specific)
        if (classes.length > 0) {
            const allClasses = escapeClassNames(classes);
            selectors.push(`##${  tagName  }${allClasses}`);
            selectors.push(`##${  allClasses}`);
        }
        
        // Generate selectors with individual attributes
        for (let i = 0; i < attrs.length; i++) {
            // Use full value, not truncated - this is critical for uniqueness
            const attrStr = `[${  attrs[i].name  }="${  CSS.escape(attrs[i].value)  }"]`;
            selectors.push(`##${  tagName  }${attrStr}`);
            selectors.push(`##${  attrStr}`);
        }
        
        // Generate selectors with multiple attributes combined
        if (attrs.length >= 2) {
            let combinedAttrs = '';
            for (let j = 0; j < attrs.length; j++) {
                combinedAttrs += `[${  attrs[j].name  }="${  CSS.escape(attrs[j].value)  }"]`;
            }
            selectors.push(`##${  tagName  }${combinedAttrs}`);
            selectors.push(`##${  combinedAttrs}`);
        }
        
        // Generate selectors combining classes and attributes
        if (classes.length > 0 && attrs.length > 0) {
            const classPart = escapeClassNames(classes);
            let attrPart = '';
            for (let k = 0; k < Math.min(attrs.length, 2); k++) {
                attrPart += `[${  attrs[k].name  }="${  CSS.escape(attrs[k].value)  }"]`;
            }
            selectors.push(`##${  tagName  }${classPart  }${attrPart}`);
            selectors.push(`##${  classPart  }${attrPart}`);
        }
        
        return selectors;
    }

    function normalizePickedElement(elem) {
        while ( elem && elem.parentElement ) {
            if ( ignorablePickedTags.has(elem.tagName) === false ) {
                break;
            }
            if ( typeof elem.id === 'string' && elem.id !== '' ) {
                break;
            }
            if ( filterClasses(elem).length !== 0 ) {
                break;
            }
            elem = elem.parentElement;
        }
        return elem;
    }

    function getSelectorInfo(selector, targetElem) {
        try {
            const elems = qsa(document, selector);
            const count = Array.isArray(elems) ? elems.length : 0;
            return {
                count,
                isUnique: count === 1 && Array.isArray(elems) && elems[0] === targetElem,
            };
        } catch (e) {
            return { count: 0, isUnique: false };
        }
    }

    function selectorCount(selector) {
        return getSelectorInfo(selector).count;
    }

    function isUniqueSelector(selector, targetElem) {
        return getSelectorInfo(selector, targetElem).isUnique;
    }

    function filterRank(filter, targetElem) {
        const selector = filterToSelector(filter);
        let score = 0;
        const tagMatch = /^[a-z][a-z0-9-]*/i.exec(selector);
        const tagName = tagMatch ? tagMatch[0].toLowerCase() : '';
        
        const info = targetElem ? getSelectorInfo(selector, targetElem) : null;
        if (info) {
            if (info.count > 1) {
                score -= 500 + (info.count * 10);
            }
            if (info.isUnique) {
                score += 300;
            }
        }
        
        if ( selector.startsWith('#') ) {
            score -= 200;
        } else if ( selector.startsWith('.') ) {
            const classCount = (selector.match(/\./g) || []).length;
            if ( classCount >= 2 ) {
                score -= 120;
            } else {
                score += 20;
            }
        }
        if ( selector.indexOf(':nth-of-type(') !== -1 ) {
            score -= 20;
        }
        if ( genericContainerTags.has(tagName) ) {
            score += 40;
        }
        if ( selector.indexOf('[') !== -1 ) {
            score += 20;
        }
        if ( /^[a-z]/i.test(selector) ) {
            score += 10;
        }
        score += selector.length / 1000;
        return score;
    }

    function buildGroupCandidates(elem) {
        const tagName = CSS.escape(elem.localName);
        const classes = filterClasses(elem);
        const dataAttrs = filterDataAttributes(elem);
        const attrSelector = buildAttrSelector(dataAttrs);
        const allAttrs = filterAllAttributes(elem);
        let filters = [];

        // 1. Generate attribute-based selectors (all attributes, not just data-*)
        const attrBasedSelectors = generateAttributeSelectors(elem);
        filters = filters.concat(attrBasedSelectors);

        // 2. Generate combinations using data attributes (highest priority - most unique)
        if (dataAttrs.length > 0) {
            // Tag + data attributes
            if (classes.length > 0) {
                filters.push(`##${  tagName  }${escapeClassNames(classes)  }${attrSelector}`);
                filters.push(`##${  escapeClassNames(classes)  }${attrSelector}`);
            }
            // Tag + data attributes (without classes)
            filters.push(`##${  tagName  }${attrSelector}`);
            filters.push(`##${  attrSelector}`);
            
            // Individual data attributes
            for (let i = 0; i < dataAttrs.length; i++) {
                const singleAttr = `[${  dataAttrs[i].name  }="${  CSS.escape(dataAttrs[i].value)  }"]`;
                filters.push(`##${  tagName  }${singleAttr}`);
                filters.push(`##${  singleAttr}`);
            }
        }

        // 3. Generate combinations using ALL classes (not just subsets)
        if (classes.length >= 1) {
            // All classes combined (highest specificity)
            const allClasses = escapeClassNames(classes);
            filters.push(`##${  tagName  }${allClasses}`);
            filters.push(`##${  allClasses}`);
            
            // Tag + single class
            for (let j = 0; j < classes.length; j++) {
                const singleClass = `.${  CSS.escape(classes[j])}`;
                filters.push(`##${  tagName  }${singleClass}`);
                filters.push(`##${  singleClass}`);
            }
        }

        // 4. ID-based selectors (highest priority when available)
        if ( typeof elem.id === 'string' && elem.id !== '' ) {
            filters.push(`###${  CSS.escape(elem.id)}`);
            filters.push(`##${  tagName  }#${  CSS.escape(elem.id)}`);
            // ID + data attributes
            if (dataAttrs.length > 0) {
                filters.push(`##${  tagName  }#${  CSS.escape(elem.id)  }${attrSelector}`);
            }
        }

        // 5. Generate hierarchical path-based selectors (walk up DOM tree)
        let current = elem;
        let ancestorCount = 0;
        while (current && current.parentElement && current !== document.body && ancestorCount < 5) {
            const parent = current.parentElement;
            if (parent) {
                const parentTagName = CSS.escape(parent.localName);
                const parentClasses = filterClasses(parent);
                const parentId = parent.id;
                const parentAttrs = filterAllAttributes(parent);
                
                // Build parent part of selector
                let parentPart = parentTagName;
                if (parentId) {
                    parentPart += `#${  CSS.escape(parentId)}`;
                } else if (parentClasses.length > 0) {
                    parentPart += escapeClassNames(parentClasses.slice(0, 1));
                }
                
                // Build full path selector
                let tagPart = tagName;
                if (classes.length > 0) {
                    tagPart += escapeClassNames(classes.slice(0, 1));
                } else if (allAttrs.length > 0) {
                    tagPart += `[${  allAttrs[0].name  }="${  CSS.escape(allAttrs[0].value.slice(0, 30))  }"]`;
                }
                
                const pathSelector = `##${  parentPart  } > ${  tagPart}`;
                if (filters.indexOf(pathSelector) === -1) {
                    filters.push(pathSelector);
                }
                
                // Try with more parent context
                if (ancestorCount > 0) {
                    const deeperPath = buildPathSelector(elem, elem, ancestorCount + 2);
                    if (deeperPath && filters.indexOf(`##${  deeperPath}`) === -1) {
                        filters.push(`##${  deeperPath}`);
                    }
                }
            }
            current = parent;
            ancestorCount++;
        }

        // 6. Tag-based selectors as fallback
        const tagSelector = `##${  tagName}`;
        const nthSelector = `##${  tagName  }:nth-of-type(${  nthOfTypeIndex(elem)  })`;
        filters.push(nthSelector);
        filters.push(tagSelector);

        if ( filters.length === 0 ) {
            return null;
        }

        // Deduplicate and evaluate each filter ONCE with getSelectorInfo
        const seenFilters = new Set();
        const evaluated = [];

        for ( let i = 0; i < filters.length; i++ ) {
            const filter = filters[i];
            if ( seenFilters.has(filter) ) { continue; }
            seenFilters.add(filter);

            const selector = filterToSelector(filter);
            const info = getSelectorInfo(selector, elem);
            if ( info.count === 0 ) { continue; }

            evaluated.push({ filter, selector, info });
        }

        if ( evaluated.length === 0 ) {
            return null;
        }

        // Sort: unique first, then by match count, then by rank
        evaluated.sort((a, b) => {
            if ( a.info.isUnique && !b.info.isUnique ) { return -1; }
            if ( !a.info.isUnique && b.info.isUnique ) { return 1; }
            const countDelta = a.info.count - b.info.count;
            if ( countDelta !== 0 ) { return countDelta; }
            const rankDelta = filterRank(a.filter, elem) - filterRank(b.filter, elem);
            if ( rankDelta !== 0 ) { return rankDelta; }
            return 0;
        });

        const scopedFilters = evaluated.map(e => scopeCosmeticFilter(e.filter));
        return {
            label: scopedFilters[0],
            filters: scopedFilters,
        };
    }

    function bestSpecificityForGroup(group) {
        if ( group instanceof Object === false || Array.isArray(group.filters) === false ) {
            return 0;
        }
        for ( let i = 0; i < group.filters.length; i++ ) {
            const filter = group.filters[i];
            const selector = filterToSelector(filter);
            if ( getSelectorInfo(selector).count === 1 ) {
                return i;
            }
        }
        return 0;
    }

    function candidatesAtPoint(x, y, options) {
        options = options || {};
        let elem = null;
        if (typeof x === 'number') {
            elem = ubolOverlay.elementFromPoint(x, y);
        } else if (x instanceof HTMLElement) {
            elem = x;
        }

        if (!elem) { return; }
        if ( options.preserveExact !== true ) {
            elem = normalizePickedElement(elem);
        }

        clearPickerCache();
        const groups = [];
        while (elem && elem !== document.body && elem !== document.documentElement) {
            const group = buildGroupCandidates(elem);
            if ( group !== null ) {
                groups.push(group);
            }
            elem = elem.parentElement;
        }

        if ( groups.length === 0 ) { return; }

        // Keep the initial selection anchored to the picked element.
        // Ancestors stay available through the depth slider instead of
        // overriding the initial choice.
        let bestSlot = 0;
        while ( bestSlot < groups.length ) {
            if ( Array.isArray(groups[bestSlot].filters) && groups[bestSlot].filters.length !== 0 ) {
                break;
            }
            bestSlot += 1;
        }
        if ( bestSlot >= groups.length ) { bestSlot = 0; }
        const bestSpecificity = bestSpecificityForGroup(groups[bestSlot]);

        return {
            cosmeticFilters: groups,
            filter: {
                slot: bestSlot,
                specificity: bestSpecificity,
            }
        };
    }

    function elementFromTargetSpec(target) {
        if ( typeof target !== 'string' || target === '' ) { return null; }
        const pos = target.indexOf('\t');
        if ( pos === -1 ) { return null; }

        const tagName = target.slice(0, pos).toLowerCase();
        const url = target.slice(pos + 1);
        const attr = {
            a: 'href',
            audio: 'src',
            iframe: 'src',
            img: 'src',
            video: 'src',
        }[tagName];
        if ( !attr ) { return null; }

        const elems = document.getElementsByTagName(tagName);
        for ( let i = 0; i < elems.length; i++ ) {
            const elem = elems[i];
            if ( elem === ubolOverlay.frame ) { continue; }
            let value = '';
            try {
                value = elem.getAttribute(attr) || elem[attr] || '';
            } catch (e) {
                console.warn('[uBR] picker: getAttribute failed', e);
            }
            if ( value === url ) {
                return elem;
            }
        }
        return null;
    }

    function elementFromExactTarget(target) {
        if ( target instanceof Object === false ) { return null; }
        if ( typeof target.selector !== 'string' || target.selector === '' ) { return null; }
        const elems = qsa(document, target.selector);
        if ( Array.isArray(elems) === false || elems.length === 0 ) { return null; }
        return elems[0];
    }

    function consumeBootSelection() {
        const boot = self.__ubrPickerBoot;
        if ( boot instanceof Object === false ) { return; }
        self.__ubrPickerBoot = undefined;

        const exactElem = elementFromExactTarget(boot.exactTarget);
        if ( exactElem !== null ) {
            ubolOverlay.highlightElements([ exactElem ]);
            return {
                primed: true,
                highlighted: true,
            };
        }

        const point = boot.initialPoint;
        if (
            point instanceof Object &&
            typeof point.x === 'number' &&
            typeof point.y === 'number'
        ) {
            const pointElem = ubolOverlay.elementFromPoint(point.x, point.y);
            if ( pointElem ) {
                ubolOverlay.highlightElements([ pointElem ]);
                return {
                    primed: true,
                    highlighted: true,
                };
            }
        }

        const elem = elementFromTargetSpec(boot.target);
        if ( elem !== null ) {
            ubolOverlay.highlightElements([ elem ]);
            return {
                primed: true,
                highlighted: true,
            };
        }
    }

    function previewSelector(selector) {
        if (selector === previewedSelector) { return; }
        if (previewedSelector !== '') {
            if (previewedCSS !== '') {
                var style = document.getElementById('picker-preview-style');
                if (style) { style.remove(); }
                previewedCSS = '';
            }
            if (previewSavedElements.length > 0) {
                ubolOverlay.highlightElements(previewSavedElements);
                previewSavedElements = [];
            }
        }
        previewedSelector = selector || '';
        if (selector === '') { return; }

        if (ubolOverlay.highlightedElements.length > 0) {
            previewSavedElements = ubolOverlay.highlightedElements.slice();
        }
        ubolOverlay.highlightElements([]);

        if (!selector.startsWith('{')) {
            const css = `${selector  } { display: none !important; }`;
            var style = document.createElement('style');
            style.id = 'picker-preview-style';
            style.textContent = css;
            document.head.appendChild(style);
            previewedCSS = selector;
        }
    }

    function removeElementsFromSelector(selector) {
        const fromSelector = typeof ubolOverlay.elementsFromSelector === 'function'
            ? ubolOverlay.elementsFromSelector(selector)
            : { elems: qsa(document, selector), error: undefined };
        const elems = Array.isArray(fromSelector.elems) ? fromSelector.elems.slice() : [];
        for ( let i = 0; i < elems.length; i++ ) {
            if ( elems[i] && typeof elems[i].remove === 'function' ) {
                elems[i].remove();
            }
        }
        ubolOverlay.highlightElements([]);
        return {
            count: elems.length,
            error: fromSelector.error || null,
        };
    }

    function confirmSelection(filter) {
        if ( typeof filter !== 'string' || filter.trim() === '' ) {
            return Promise.resolve({ count: 0, error: 'No filter selected' });
        }
        const normalizedFilter = filter.trim();
        const selector = filterToSelector(normalizedFilter);
        const removal = removeElementsFromSelector(selector);
        return Promise.resolve().then(() => {
            previewSelector('');
            return removal;
        }).catch((error) => {
            return {
                count: removal.count,
                error: error instanceof Error ? error.message : String(error),
            };
        });
    }

    function highlightFromSelector(selector) {
        const result = { count: 0, error: null };

        if (!selector) {
            ubolOverlay.highlightElements([]);
            return result;
        }

        const fromSelector = typeof ubolOverlay.elementsFromSelector === 'function'
            ? ubolOverlay.elementsFromSelector(selector)
            : { elems: qsa(document, selector), error: undefined };
        const elems = fromSelector.elems;
        if (elems.length === 0) {
            result.error = fromSelector.error || 'No elements found';
        } else {
            result.count = elems.length;
        }

        ubolOverlay.highlightElements(elems);
        return result;
    }

    function onMessage(msg) {
        switch (msg.what) {
        case 'startTool':
            return consumeBootSelection();
        case 'quitTool':
            previewSelector('');
            ubolOverlay.stop();
            break;
        case 'startCustomFilters':
            return ubolOverlay.sendMessage({ what: 'startCustomFilters' });
        case 'terminateCustomFilters':
            return ubolOverlay.sendMessage({ what: 'terminateCustomFilters' });
        case 'candidatesAtPoint':
            return candidatesAtPoint(msg.mx, msg.my);
        case 'highlightFromSelector':
            return highlightFromSelector(msg.selector);
        case 'previewSelector':
            previewSelector(msg.selector);
            break;
        case 'createUserFilter':
            return ubolOverlay.sendMessage({
                channel: 'elementPicker',
                msg: {
                    what: 'elementPickerCreateFilter',
                    filters: msg.filter,
                    docURL: self.location.href,
                },
            });
        case 'confirmSelection':
            return confirmSelection(msg.filter);
        case 'unhighlight':
            ubolOverlay.highlightElements([]);
            break;
        case 'highlightElementAtPoint':
            var elem = ubolOverlay.elementFromPoint(msg.mx, msg.my);
            if (elem) {
                ubolOverlay.highlightElements([elem]);
            }
            break;
        }
    }

    ubolOverlay.install('/picker-ui.html', onMessage);

})();
