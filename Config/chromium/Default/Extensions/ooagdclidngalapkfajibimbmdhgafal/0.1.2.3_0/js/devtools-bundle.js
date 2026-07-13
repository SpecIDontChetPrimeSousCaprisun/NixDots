// GENERATED FILE. Do not edit directly.
// Source: src/js/devtools.ts
// Build command: npm run build
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // src/js/s14e-serializer.ts
  var VERSION = 1;
  var SEPARATORCHAR = " ";
  var SEPARATORCHARCODE = SEPARATORCHAR.charCodeAt(0);
  var SENTINELCHAR = "!";
  var SENTINELCHARCODE = SENTINELCHAR.charCodeAt(0);
  var MAGICPREFIX = `UOSC_${VERSION}${SEPARATORCHAR}`;
  var MAGICLZ4PREFIX = `UOSC/lz4_${VERSION}${SEPARATORCHAR}`;
  var FAILMARK = Number.MAX_SAFE_INTEGER;
  var SAFECHARS = "&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopqrstuvwxyz{|}~";
  var NUMSAFECHARS = SAFECHARS.length;
  var BITS_PER_SAFECHARS = Math.log2(NUMSAFECHARS);
  var { intToChar, intToCharCode, charCodeToInt } = (() => {
    const intToChar2 = [];
    const intToCharCode2 = [];
    const charCodeToInt2 = [];
    for (let i = 0; i < NUMSAFECHARS; i++) {
      intToChar2[i] = SAFECHARS.charAt(i);
      intToCharCode2[i] = SAFECHARS.charCodeAt(i);
      charCodeToInt2[i] = 0;
    }
    for (let i = NUMSAFECHARS; i < 128; i++) {
      intToChar2[i] = "";
      intToCharCode2[i] = 0;
      charCodeToInt2[i] = 0;
    }
    for (let i = 0; i < SAFECHARS.length; i++) {
      charCodeToInt2[SAFECHARS.charCodeAt(i)] = i;
    }
    return { intToChar: intToChar2, intToCharCode: intToCharCode2, charCodeToInt: charCodeToInt2 };
  })();
  var iota = 1;
  var I_STRING_SMALL = iota++;
  var I_STRING_LARGE = iota++;
  var I_ZERO = iota++;
  var I_INTEGER_SMALL_POS = iota++;
  var I_INTEGER_SMALL_NEG = iota++;
  var I_INTEGER_LARGE_POS = iota++;
  var I_INTEGER_LARGE_NEG = iota++;
  var I_BOOL_FALSE = iota++;
  var I_BOOL_TRUE = iota++;
  var I_NULL = iota++;
  var I_UNDEFINED = iota++;
  var I_FLOAT = iota++;
  var I_REGEXP = iota++;
  var I_DATE = iota++;
  var I_REFERENCE = iota++;
  var I_OBJECT_SMALL = iota++;
  var I_OBJECT_LARGE = iota++;
  var I_ARRAY_SMALL = iota++;
  var I_ARRAY_LARGE = iota++;
  var I_SET_SMALL = iota++;
  var I_SET_LARGE = iota++;
  var I_MAP_SMALL = iota++;
  var I_MAP_LARGE = iota++;
  var I_ARRAYBUFFER = iota++;
  var I_INT8ARRAY = iota++;
  var I_UINT8ARRAY = iota++;
  var I_UINT8CLAMPEDARRAY = iota++;
  var I_INT16ARRAY = iota++;
  var I_UINT16ARRAY = iota++;
  var I_INT32ARRAY = iota++;
  var I_UINT32ARRAY = iota++;
  var I_FLOAT32ARRAY = iota++;
  var I_FLOAT64ARRAY = iota++;
  var I_DATAVIEW = iota++;
  var C_STRING_SMALL = intToChar[I_STRING_SMALL];
  var C_STRING_LARGE = intToChar[I_STRING_LARGE];
  var C_ZERO = intToChar[I_ZERO];
  var C_INTEGER_SMALL_POS = intToChar[I_INTEGER_SMALL_POS];
  var C_INTEGER_SMALL_NEG = intToChar[I_INTEGER_SMALL_NEG];
  var C_INTEGER_LARGE_POS = intToChar[I_INTEGER_LARGE_POS];
  var C_INTEGER_LARGE_NEG = intToChar[I_INTEGER_LARGE_NEG];
  var C_BOOL_FALSE = intToChar[I_BOOL_FALSE];
  var C_BOOL_TRUE = intToChar[I_BOOL_TRUE];
  var C_NULL = intToChar[I_NULL];
  var C_UNDEFINED = intToChar[I_UNDEFINED];
  var C_FLOAT = intToChar[I_FLOAT];
  var C_REGEXP = intToChar[I_REGEXP];
  var C_DATE = intToChar[I_DATE];
  var C_REFERENCE = intToChar[I_REFERENCE];
  var C_OBJECT_SMALL = intToChar[I_OBJECT_SMALL];
  var C_OBJECT_LARGE = intToChar[I_OBJECT_LARGE];
  var C_ARRAY_SMALL = intToChar[I_ARRAY_SMALL];
  var C_ARRAY_LARGE = intToChar[I_ARRAY_LARGE];
  var C_SET_SMALL = intToChar[I_SET_SMALL];
  var C_SET_LARGE = intToChar[I_SET_LARGE];
  var C_MAP_SMALL = intToChar[I_MAP_SMALL];
  var C_MAP_LARGE = intToChar[I_MAP_LARGE];
  var C_ARRAYBUFFER = intToChar[I_ARRAYBUFFER];
  var C_INT8ARRAY = intToChar[I_INT8ARRAY];
  var C_UINT8ARRAY = intToChar[I_UINT8ARRAY];
  var C_UINT8CLAMPEDARRAY = intToChar[I_UINT8CLAMPEDARRAY];
  var C_INT16ARRAY = intToChar[I_INT16ARRAY];
  var C_UINT16ARRAY = intToChar[I_UINT16ARRAY];
  var C_INT32ARRAY = intToChar[I_INT32ARRAY];
  var C_UINT32ARRAY = intToChar[I_UINT32ARRAY];
  var C_FLOAT32ARRAY = intToChar[I_FLOAT32ARRAY];
  var C_FLOAT64ARRAY = intToChar[I_FLOAT64ARRAY];
  var C_DATAVIEW = intToChar[I_DATAVIEW];
  var toArrayBufferViewConstructor = {
    [`${I_INT8ARRAY}`]: Int8Array,
    [`${I_UINT8ARRAY}`]: Uint8Array,
    [`${I_UINT8CLAMPEDARRAY}`]: Uint8ClampedArray,
    [`${I_INT16ARRAY}`]: Int16Array,
    [`${I_UINT16ARRAY}`]: Uint16Array,
    [`${I_INT32ARRAY}`]: Int32Array,
    [`${I_UINT32ARRAY}`]: Uint32Array,
    [`${I_FLOAT32ARRAY}`]: Float32Array,
    [`${I_FLOAT64ARRAY}`]: Float64Array,
    [`${I_DATAVIEW}`]: DataView
  };
  var textCodec = {
    decoder: null,
    encoder: null,
    decode(...args) {
      if (this.decoder === null) {
        this.decoder = new globalThis.TextDecoder();
      }
      return this.decoder.decode(...args);
    },
    encode(...args) {
      if (this.encoder === null) {
        this.encoder = new globalThis.TextEncoder();
      }
      return this.encoder.encode(...args);
    },
    encodeInto(...args) {
      if (this.encoder === null) {
        this.encoder = new globalThis.TextEncoder();
      }
      return this.encoder.encodeInto(...args);
    }
  };
  var isInteger = Number.isInteger;
  var readRefs = /* @__PURE__ */ new Map();
  var readStr = "";
  var readPtr = 0;
  var readEnd = 0;
  var refCounter = 1;
  var uint8Input = null;
  var uint8InputFromAsciiStr = (s) => {
    if (uint8Input === null || uint8Input.length < s.length) {
      uint8Input = new Uint8Array(s.length + 1023 & ~1023);
    }
    textCodec.encodeInto(s, uint8Input);
    return uint8Input;
  };
  var isInstanceOf = (o, s) => {
    return typeof o === "object" && o !== null && (s === "Object" || Object.prototype.toString.call(o) === `[object ${s}]`);
  };
  var deserializeLargeUint = () => {
    let c = readStr.charCodeAt(readPtr++);
    let n = charCodeToInt[c];
    let m = 1;
    while ((c = readStr.charCodeAt(readPtr++)) !== SEPARATORCHARCODE) {
      m *= NUMSAFECHARS;
      n += m * charCodeToInt[c];
    }
    return n;
  };
  var BASE88_POW1 = NUMSAFECHARS;
  var BASE88_POW2 = NUMSAFECHARS * BASE88_POW1;
  var BASE88_POW3 = NUMSAFECHARS * BASE88_POW2;
  var BASE88_POW4 = NUMSAFECHARS * BASE88_POW3;
  var denseArrayBufferFromStr = (denseStr, arrbuf) => {
    const input = uint8InputFromAsciiStr(denseStr);
    const end = denseStr.length;
    const m = end % 5;
    const n = end - m;
    const uin32len = n / 5 * 4 >>> 2;
    const uint32arr = new Uint32Array(arrbuf, 0, uin32len);
    let j = 0, v = 0;
    for (let i = 0; i < n; i += 5) {
      v = charCodeToInt[input[i + 0]];
      v += charCodeToInt[input[i + 1]] * BASE88_POW1;
      v += charCodeToInt[input[i + 2]] * BASE88_POW2;
      v += charCodeToInt[input[i + 3]] * BASE88_POW3;
      v += charCodeToInt[input[i + 4]] * BASE88_POW4;
      uint32arr[j++] = v;
    }
    if (m === 0) {
      return;
    }
    v = charCodeToInt[input[n + 0]] + charCodeToInt[input[n + 1]] * BASE88_POW1;
    if (m > 2) {
      v += charCodeToInt[input[n + 2]] * BASE88_POW2;
      if (m > 3) {
        v += charCodeToInt[input[n + 3]] * BASE88_POW3;
      }
    }
    const uint8arr = new Uint8Array(arrbuf, j << 2);
    uint8arr[0] = v & 255;
    if (v !== 0) {
      v >>>= 8;
      uint8arr[1] = v & 255;
      if (v !== 0) {
        v >>>= 8;
        uint8arr[2] = v & 255;
      }
    }
  };
  var sparseArrayBufferFromStr = (sparseStr, arrbuf) => {
    const sparseLen = sparseStr.length;
    const input = uint8InputFromAsciiStr(sparseStr);
    const end = arrbuf.byteLength;
    const uint32len = end >>> 2;
    const uint32arr = new Uint32Array(arrbuf, 0, uint32len);
    let i = 0, j = 0, c = 0, n = 0, m = 0;
    for (; j < sparseLen; i++) {
      c = input[j++];
      if (c === SEPARATORCHARCODE) {
        continue;
      }
      if (c === SENTINELCHARCODE) {
        break;
      }
      n = charCodeToInt[c];
      m = 1;
      for (; ; ) {
        c = input[j++];
        if (c === SEPARATORCHARCODE) {
          break;
        }
        m *= NUMSAFECHARS;
        n += m * charCodeToInt[c];
      }
      uint32arr[i] = n;
    }
    if (c === SENTINELCHARCODE) {
      i <<= 2;
      const uint8arr = new Uint8Array(arrbuf, i);
      for (; j < sparseLen; i++) {
        c = input[j++];
        if (c === SEPARATORCHARCODE) {
          continue;
        }
        n = charCodeToInt[c];
        m = 1;
        for (; ; ) {
          c = input[j++];
          if (c === SEPARATORCHARCODE) {
            break;
          }
          m *= NUMSAFECHARS;
          n += m * charCodeToInt[c];
        }
        uint8arr[i] = n;
      }
    }
  };
  var _deserialize = () => {
    if (readPtr >= readEnd) {
      return;
    }
    const type = charCodeToInt[readStr.charCodeAt(readPtr++)];
    switch (type) {
      // Primitive types
      case I_STRING_SMALL:
      case I_STRING_LARGE: {
        const size = type === I_STRING_SMALL ? charCodeToInt[readStr.charCodeAt(readPtr++)] : deserializeLargeUint();
        const beg = readPtr;
        readPtr += size;
        return readStr.slice(beg, readPtr);
      }
      case I_ZERO:
        return 0;
      case I_INTEGER_SMALL_POS:
        return charCodeToInt[readStr.charCodeAt(readPtr++)];
      case I_INTEGER_SMALL_NEG:
        return -charCodeToInt[readStr.charCodeAt(readPtr++)];
      case I_INTEGER_LARGE_POS:
        return deserializeLargeUint();
      case I_INTEGER_LARGE_NEG:
        return -deserializeLargeUint();
      case I_BOOL_FALSE:
        return false;
      case I_BOOL_TRUE:
        return true;
      case I_NULL:
        return null;
      case I_UNDEFINED:
        return;
      case I_FLOAT: {
        const size = deserializeLargeUint();
        const beg = readPtr;
        readPtr += size;
        return parseFloat(readStr.slice(beg, readPtr));
      }
      case I_REGEXP: {
        const source = _deserialize();
        const flags = _deserialize();
        return new RegExp(source, flags);
      }
      case I_DATE: {
        const time = _deserialize();
        return new Date(time);
      }
      case I_REFERENCE: {
        const ref = deserializeLargeUint();
        return readRefs.get(ref);
      }
      case I_OBJECT_SMALL:
      case I_OBJECT_LARGE: {
        const out = {};
        readRefs.set(refCounter++, out);
        const entries = [];
        const size = type === I_OBJECT_SMALL ? charCodeToInt[readStr.charCodeAt(readPtr++)] : deserializeLargeUint();
        for (let i = 0; i < size; i++) {
          const k = _deserialize();
          const v = _deserialize();
          entries.push([k, v]);
        }
        Object.assign(out, Object.fromEntries(entries));
        return out;
      }
      case I_ARRAY_SMALL:
      case I_ARRAY_LARGE: {
        const out = [];
        readRefs.set(refCounter++, out);
        const size = type === I_ARRAY_SMALL ? charCodeToInt[readStr.charCodeAt(readPtr++)] : deserializeLargeUint();
        for (let i = 0; i < size; i++) {
          out.push(_deserialize());
        }
        return out;
      }
      case I_SET_SMALL:
      case I_SET_LARGE: {
        const out = /* @__PURE__ */ new Set();
        readRefs.set(refCounter++, out);
        const size = type === I_SET_SMALL ? charCodeToInt[readStr.charCodeAt(readPtr++)] : deserializeLargeUint();
        for (let i = 0; i < size; i++) {
          out.add(_deserialize());
        }
        return out;
      }
      case I_MAP_SMALL:
      case I_MAP_LARGE: {
        const out = /* @__PURE__ */ new Map();
        readRefs.set(refCounter++, out);
        const size = type === I_MAP_SMALL ? charCodeToInt[readStr.charCodeAt(readPtr++)] : deserializeLargeUint();
        for (let i = 0; i < size; i++) {
          const k = _deserialize();
          const v = _deserialize();
          out.set(k, v);
        }
        return out;
      }
      case I_ARRAYBUFFER: {
        const byteLength = deserializeLargeUint();
        const maxByteLength = _deserialize();
        let options;
        if (maxByteLength !== 0 && maxByteLength !== byteLength) {
          options = { maxByteLength };
        }
        const arrbuf = new ArrayBuffer(byteLength, options);
        const dense = _deserialize();
        const str = _deserialize();
        if (dense) {
          denseArrayBufferFromStr(str, arrbuf);
        } else {
          sparseArrayBufferFromStr(str, arrbuf);
        }
        readRefs.set(refCounter++, arrbuf);
        return arrbuf;
      }
      case I_INT8ARRAY:
      case I_UINT8ARRAY:
      case I_UINT8CLAMPEDARRAY:
      case I_INT16ARRAY:
      case I_UINT16ARRAY:
      case I_INT32ARRAY:
      case I_UINT32ARRAY:
      case I_FLOAT32ARRAY:
      case I_FLOAT64ARRAY:
      case I_DATAVIEW: {
        const byteOffset = deserializeLargeUint();
        const length = deserializeLargeUint();
        const ref = refCounter++;
        const arrayBuffer = _deserialize();
        const ctor = toArrayBufferViewConstructor[`${type}`];
        const out = new ctor(arrayBuffer, byteOffset, length);
        readRefs.set(ref, out);
        return out;
      }
      default:
        break;
    }
    readPtr = FAILMARK;
  };
  var LZ4BlockJS = class {
    constructor() {
      this.hashTable = void 0;
      this.outputBuffer = void 0;
    }
    reset() {
      this.hashTable = void 0;
      this.outputBuffer = void 0;
    }
    growOutputBuffer(size) {
      if (this.outputBuffer !== void 0) {
        if (this.outputBuffer.byteLength >= size) {
          return;
        }
      }
      this.outputBuffer = new ArrayBuffer(size + 65535 & 2147418112);
    }
    encodeBound(size) {
      return size > 2113929216 ? 0 : size + (size / 255 | 0) + 16;
    }
    encodeBlock(iBuf, oOffset) {
      const iLen = iBuf.byteLength;
      if (iLen >= 2113929216) {
        throw new RangeError();
      }
      const lastMatchPos = iLen - 12;
      const lastLiteralPos = iLen - 5;
      if (this.hashTable === void 0) {
        this.hashTable = new Int32Array(65536);
      }
      this.hashTable.fill(-65536);
      if (isInstanceOf(iBuf, "ArrayBuffer")) {
        iBuf = new Uint8Array(iBuf);
      }
      const oLen = oOffset + this.encodeBound(iLen);
      this.growOutputBuffer(oLen);
      const oBuf = new Uint8Array(this.outputBuffer, 0, oLen);
      let iPos = 0;
      let oPos = oOffset;
      let anchorPos = 0;
      for (; ; ) {
        let refPos;
        let mOffset;
        let sequence = iBuf[iPos] << 8 | iBuf[iPos + 1] << 16 | iBuf[iPos + 2] << 24;
        while (iPos <= lastMatchPos) {
          sequence = sequence >>> 8 | iBuf[iPos + 3] << 24;
          const hash = (sequence * 40503 & 65535) + (sequence * 31153 >>> 16) & 65535;
          refPos = this.hashTable[hash];
          this.hashTable[hash] = iPos;
          mOffset = iPos - refPos;
          if (mOffset < 65536 && iBuf[refPos + 0] === (sequence & 255) && iBuf[refPos + 1] === (sequence >>> 8 & 255) && iBuf[refPos + 2] === (sequence >>> 16 & 255) && iBuf[refPos + 3] === (sequence >>> 24 & 255)) {
            break;
          }
          iPos += 1;
        }
        if (iPos > lastMatchPos) {
          break;
        }
        let lLen2 = iPos - anchorPos;
        let mLen = iPos;
        iPos += 4;
        refPos += 4;
        while (iPos < lastLiteralPos && iBuf[iPos] === iBuf[refPos]) {
          iPos += 1;
          refPos += 1;
        }
        mLen = iPos - mLen;
        const token = mLen < 19 ? mLen - 4 : 15;
        if (lLen2 >= 15) {
          oBuf[oPos++] = 240 | token;
          let l = lLen2 - 15;
          while (l >= 255) {
            oBuf[oPos++] = 255;
            l -= 255;
          }
          oBuf[oPos++] = l;
        } else {
          oBuf[oPos++] = lLen2 << 4 | token;
        }
        while (lLen2--) {
          oBuf[oPos++] = iBuf[anchorPos++];
        }
        if (mLen === 0) {
          break;
        }
        oBuf[oPos + 0] = mOffset;
        oBuf[oPos + 1] = mOffset >>> 8;
        oPos += 2;
        if (mLen >= 19) {
          let l = mLen - 19;
          while (l >= 255) {
            oBuf[oPos++] = 255;
            l -= 255;
          }
          oBuf[oPos++] = l;
        }
        anchorPos = iPos;
      }
      let lLen = iLen - anchorPos;
      if (lLen >= 15) {
        oBuf[oPos++] = 240;
        let l = lLen - 15;
        while (l >= 255) {
          oBuf[oPos++] = 255;
          l -= 255;
        }
        oBuf[oPos++] = l;
      } else {
        oBuf[oPos++] = lLen << 4;
      }
      while (lLen--) {
        oBuf[oPos++] = iBuf[anchorPos++];
      }
      return new Uint8Array(oBuf.buffer, 0, oPos);
    }
    decodeBlock(iBuf, iOffset, oLen) {
      const iLen = iBuf.byteLength;
      this.growOutputBuffer(oLen);
      const oBuf = new Uint8Array(this.outputBuffer, 0, oLen);
      let iPos = iOffset, oPos = 0;
      while (iPos < iLen) {
        const token = iBuf[iPos++];
        let clen = token >>> 4;
        if (clen !== 0) {
          if (clen === 15) {
            let l;
            for (; ; ) {
              l = iBuf[iPos++];
              if (l !== 255) {
                break;
              }
              clen += 255;
            }
            clen += l;
          }
          const end2 = iPos + clen;
          while (iPos < end2) {
            oBuf[oPos++] = iBuf[iPos++];
          }
          if (iPos === iLen) {
            break;
          }
        }
        const mOffset = iBuf[iPos + 0] | iBuf[iPos + 1] << 8;
        if (mOffset === 0 || mOffset > oPos) {
          return;
        }
        iPos += 2;
        clen = (token & 15) + 4;
        if (clen === 19) {
          let l;
          for (; ; ) {
            l = iBuf[iPos++];
            if (l !== 255) {
              break;
            }
            clen += 255;
          }
          clen += l;
        }
        const end = oPos + clen;
        let mPos = oPos - mOffset;
        while (oPos < end) {
          oBuf[oPos++] = oBuf[mPos++];
        }
      }
      return oBuf;
    }
    encode(input, outputOffset) {
      if (isInstanceOf(input, "ArrayBuffer")) {
        input = new Uint8Array(input);
      } else if (isInstanceOf(input, "Uint8Array") === false) {
        throw new TypeError();
      }
      return this.encodeBlock(input, outputOffset);
    }
    decode(input, inputOffset, outputSize) {
      if (isInstanceOf(input, "ArrayBuffer")) {
        input = new Uint8Array(input);
      } else if (isInstanceOf(input, "Uint8Array") === false) {
        throw new TypeError();
      }
      return this.decodeBlock(input, inputOffset, outputSize);
    }
  };
  var deserializeById = (blockid, s) => {
    refCounter = 1;
    readStr = s;
    readEnd = s.length;
    readPtr = blockid.length;
    const data = _deserialize();
    readRefs.clear();
    readStr = "";
    if (readPtr === FAILMARK) {
      return;
    }
    return data;
  };
  var deserialize = (s) => {
    if (s.startsWith(MAGICLZ4PREFIX)) {
      const lz4 = deserializeById(MAGICLZ4PREFIX, s);
      if (lz4) {
        const lz4Util = new LZ4BlockJS();
        const uint8ArrayAfter = lz4Util.decode(lz4.data, 0, lz4.size);
        if (uint8ArrayAfter) {
          s = textCodec.decode(new Uint8Array(uint8ArrayAfter));
        }
      }
    }
    const data = s.startsWith(MAGICPREFIX) ? deserializeById(MAGICPREFIX, s) : void 0;
    uint8Input = null;
    return data;
  };

  // src/js/dom.ts
  var normalizeTarget = (target) => {
    if (typeof target === "string") {
      return Array.from(qsa$(target));
    }
    if (target instanceof Element) {
      return [target];
    }
    if (target === null) {
      return [];
    }
    if (Array.isArray(target)) {
      return target;
    }
    return Array.from(target);
  };
  var makeEventHandler = (selector, callback) => {
    return function(event) {
      const dispatcher = event.currentTarget;
      if (dispatcher instanceof HTMLElement === false || typeof dispatcher.querySelectorAll !== "function") {
        return;
      }
      const receiver = event.target;
      const ancestor = receiver?.closest(selector);
      if (ancestor === receiver && ancestor !== dispatcher && dispatcher.contains(ancestor)) {
        callback.call(receiver, event);
      }
    };
  };
  var dom = class {
    static attr(target, attr, value) {
      for (const elem of normalizeTarget(target)) {
        if (value === void 0) {
          return elem.getAttribute(attr);
        }
        if (value === null) {
          elem.removeAttribute(attr);
        } else {
          elem.setAttribute(attr, value);
        }
      }
      return void 0;
    }
    static clear(target) {
      for (const elem of normalizeTarget(target)) {
        while (elem.firstChild !== null) {
          elem.removeChild(elem.firstChild);
        }
      }
    }
    static clone(target) {
      const elements = normalizeTarget(target);
      if (elements.length === 0) {
        return null;
      }
      return elements[0].cloneNode(true);
    }
    static create(a) {
      if (typeof a === "string") {
        return document.createElement(a);
      }
      return void 0;
    }
    static prop(target, prop, value) {
      for (const elem of normalizeTarget(target)) {
        if (value === void 0) {
          return elem[prop];
        }
        elem[prop] = value;
      }
      return void 0;
    }
    static text(target, text) {
      const targets = normalizeTarget(target);
      if (text === void 0) {
        return targets.length !== 0 ? targets[0].textContent ?? void 0 : void 0;
      }
      for (const elem of targets) {
        elem.textContent = text;
      }
      return void 0;
    }
    static remove(target) {
      for (const elem of normalizeTarget(target)) {
        elem.remove();
      }
    }
    static empty(target) {
      for (const elem of normalizeTarget(target)) {
        while (elem.firstElementChild !== null) {
          elem.firstElementChild.remove();
        }
      }
    }
    // target, type, callback, [options]
    // target, type, subtarget, callback, [options]
    static on(target, type, subtarget, callback, options) {
      let actualCallback;
      let actualOptions;
      if (typeof subtarget === "function") {
        actualOptions = options;
        actualCallback = subtarget;
        subtarget = "";
        if (typeof actualOptions === "boolean") {
          actualOptions = { capture: true };
        }
      } else {
        actualCallback = makeEventHandler(subtarget, callback);
        if (actualOptions === void 0 || typeof actualOptions === "boolean") {
          actualOptions = { capture: true };
        } else {
          actualOptions.capture = true;
        }
      }
      const targets = target instanceof Window || target instanceof Document ? [target] : normalizeTarget(target);
      for (const elem of targets) {
        elem.addEventListener(type, actualCallback, actualOptions);
      }
    }
    static off(target, type, callback, options) {
      if (typeof callback !== "function") {
        return;
      }
      let actualOptions;
      if (typeof options === "boolean") {
        actualOptions = { capture: true };
      } else {
        actualOptions = options;
      }
      const targets = target instanceof Window || target instanceof Document ? [target] : normalizeTarget(target);
      for (const elem of targets) {
        elem.removeEventListener(type, callback, actualOptions);
      }
    }
    static onFirstShown(fn, elem) {
      let observer = new IntersectionObserver((entries) => {
        if (entries.every((a) => a.isIntersecting === false)) {
          return;
        }
        try {
          fn();
        } catch (e) {
          console.warn("[uBR] dom: onFirstShown callback failed", e);
        }
        observer?.disconnect();
        observer = void 0;
      });
      observer.observe(elem);
    }
  };
  __publicField(dom, "cl", null);
  __publicField(dom, "root", null);
  __publicField(dom, "html", null);
  __publicField(dom, "head", null);
  __publicField(dom, "body", null);
  dom.cl = class DomCl {
    static add(target, name) {
      for (const elem of normalizeTarget(target)) {
        elem.classList.add(name);
      }
    }
    static remove(target, ...names) {
      for (const elem of normalizeTarget(target)) {
        elem.classList.remove(...names);
      }
    }
    static toggle(target, name, state) {
      let r;
      for (const elem of normalizeTarget(target)) {
        r = elem.classList.toggle(name, state);
      }
      return r;
    }
    static has(target, name) {
      for (const elem of normalizeTarget(target)) {
        if (elem.classList.contains(name)) {
          return true;
        }
      }
      return false;
    }
  };
  function qs$(a, b) {
    if (typeof a === "string") {
      return document.querySelector(a);
    }
    if (a === null) {
      return null;
    }
    return a.querySelector(b ?? "");
  }
  function qsa$(a, b) {
    if (typeof a === "string") {
      return document.querySelectorAll(a);
    }
    if (a === null) {
      return [];
    }
    return a.querySelectorAll(b ?? "");
  }
  dom.root = qs$(":root");
  dom.html = document.documentElement;
  dom.head = document.head;
  dom.body = document.body;

  // src/js/devtools.ts
  var reFoldable = /^ *(?=\+ \S)/;
  CodeMirror.registerGlobalHelper(
    "fold",
    "ubo-dump",
    () => true,
    (cm, start) => {
      const startLineNo = start.line;
      const startLine = cm.getLine(startLineNo);
      let endLineNo = startLineNo;
      let endLine = startLine;
      const match = reFoldable.exec(startLine);
      if (match === null) {
        return;
      }
      const foldCandidate = `  ${match[0]}`;
      const lastLineNo = cm.lastLine();
      let nextLineNo = startLineNo + 1;
      while (nextLineNo < lastLineNo) {
        const nextLine = cm.getLine(nextLineNo);
        if (nextLine.startsWith(foldCandidate) === false && nextLine !== "]") {
          if (startLineNo >= endLineNo) {
            return;
          }
          return {
            from: CodeMirror.Pos(startLineNo, startLine.length),
            to: CodeMirror.Pos(endLineNo, endLine.length)
          };
        }
        endLine = nextLine;
        endLineNo = nextLineNo;
        nextLineNo += 1;
      }
    }
  );
  var cmEditor = new CodeMirror(qs$("#console"), {
    autofocus: true,
    foldGutter: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
    lineNumbers: true,
    lineWrapping: true,
    mode: "ubo-dump",
    styleActiveLine: true,
    undoDepth: 5
  });
  uBlockDashboard.patchCodeMirrorEditor(cmEditor);
  function log(text) {
    cmEditor.replaceRange(`${text.trim()}

`, { line: 0, ch: 0 });
  }
  function toDNRText(raw) {
    const result = deserialize(raw);
    if (typeof result === "string") {
      return result;
    }
    const { network } = result;
    const replacer = (k, v) => {
      if (k.startsWith("__")) {
        return;
      }
      if (Array.isArray(v)) {
        return v.sort();
      }
      if (v instanceof Object) {
        const sorted = {};
        for (const kk of Object.keys(v).sort()) {
          sorted[kk] = v[kk];
        }
        return sorted;
      }
      return v;
    };
    const isUnsupported = (rule) => rule._error !== void 0;
    const isRegex = (rule) => rule.condition !== void 0 && rule.condition.regexFilter !== void 0;
    const isRedirect = (rule) => rule.action !== void 0 && rule.action.type === "redirect" && rule.action.redirect.extensionPath !== void 0;
    const isCsp = (rule) => rule.action !== void 0 && rule.action.type === "modifyHeaders";
    const isRemoveparam = (rule) => rule.action !== void 0 && rule.action.type === "redirect" && rule.action.redirect.transform !== void 0;
    const { ruleset } = network;
    const good = ruleset.filter(
      (rule) => isUnsupported(rule) === false && isRegex(rule) === false && isRedirect(rule) === false && isCsp(rule) === false && isRemoveparam(rule) === false
    );
    const unsupported = ruleset.filter(
      (rule) => isUnsupported(rule)
    );
    const regexes = ruleset.filter(
      (rule) => isUnsupported(rule) === false && isRegex(rule) && isRedirect(rule) === false && isCsp(rule) === false && isRemoveparam(rule) === false
    );
    const redirects = ruleset.filter(
      (rule) => isUnsupported(rule) === false && isRedirect(rule)
    );
    const headers = ruleset.filter(
      (rule) => isUnsupported(rule) === false && isCsp(rule)
    );
    const removeparams = ruleset.filter(
      (rule) => isUnsupported(rule) === false && isRemoveparam(rule)
    );
    const out = [
      `dnrRulesetFromRawLists(${JSON.stringify(result.listNames, null, 2)})`,
      `Run time: ${result.runtime} ms`,
      `Filters count: ${network.filterCount}`,
      `Accepted filter count: ${network.acceptedFilterCount}`,
      `Rejected filter count: ${network.rejectedFilterCount}`,
      `Un-DNR-able filter count: ${unsupported.length}`,
      `Resulting DNR rule count: ${ruleset.length}`
    ];
    out.push(`+ Good filters (${good.length}): ${JSON.stringify(good, replacer, 2)}`);
    out.push(`+ Regex-based filters (${regexes.length}): ${JSON.stringify(regexes, replacer, 2)}`);
    out.push(`+ 'redirect=' filters (${redirects.length}): ${JSON.stringify(redirects, replacer, 2)}`);
    out.push(`+ 'csp=' filters (${headers.length}): ${JSON.stringify(headers, replacer, 2)}`);
    out.push(`+ 'removeparam=' filters (${removeparams.length}): ${JSON.stringify(removeparams, replacer, 2)}`);
    out.push(`+ Unsupported filters (${unsupported.length}): ${JSON.stringify(unsupported, replacer, 2)}`);
    out.push(`+ generichide exclusions (${network.generichideExclusions.length}): ${JSON.stringify(network.generichideExclusions, replacer, 2)}`);
    if (result.specificCosmetic) {
      out.push(`+ Cosmetic filters: ${result.specificCosmetic.size}`);
      for (const details of result.specificCosmetic) {
        out.push(`    ${JSON.stringify(details)}`);
      }
    } else {
      out.push("  Cosmetic filters: 0");
    }
    return out.join("\n");
  }
  dom.on("#console-clear", "click", () => {
    cmEditor.setValue("");
  });
  dom.on("#console-fold", "click", () => {
    const unfolded = [];
    let maxUnfolded = -1;
    cmEditor.eachLine((handle) => {
      const match = reFoldable.exec(handle.text);
      if (match === null) {
        return;
      }
      const depth = match[0].length;
      const line = handle.lineNo();
      const isFolded = cmEditor.isFolded({ line, ch: handle.text.length });
      if (isFolded === true) {
        return;
      }
      unfolded.push({ line, depth });
      maxUnfolded = Math.max(maxUnfolded, depth);
    });
    if (maxUnfolded === -1) {
      return;
    }
    cmEditor.startOperation();
    for (const details of unfolded) {
      if (details.depth !== maxUnfolded) {
        continue;
      }
      cmEditor.foldCode(details.line, null, "fold");
    }
    cmEditor.endOperation();
  });
  dom.on("#console-unfold", "click", () => {
    const folded = [];
    let minFolded = Number.MAX_SAFE_INTEGER;
    cmEditor.eachLine((handle) => {
      const match = reFoldable.exec(handle.text);
      if (match === null) {
        return;
      }
      const depth = match[0].length;
      const line = handle.lineNo();
      const isFolded = cmEditor.isFolded({ line, ch: handle.text.length });
      if (isFolded !== true) {
        return;
      }
      folded.push({ line, depth });
      minFolded = Math.min(minFolded, depth);
    });
    if (minFolded === Number.MAX_SAFE_INTEGER) {
      return;
    }
    cmEditor.startOperation();
    for (const details of folded) {
      if (details.depth !== minFolded) {
        continue;
      }
      cmEditor.foldCode(details.line, null, "unfold");
    }
    cmEditor.endOperation();
  });
  dom.on("#snfe-dump", "click", (ev) => {
    const button = ev.target;
    dom.attr(button, "disabled", "");
    vAPI.messaging.send("devTools", {
      what: "snfeDump"
    }).then((result) => {
      log(result);
      dom.attr(button, "disabled", null);
    });
  });
  dom.on("#snfe-todnr", "click", (ev) => {
    const button = ev.target;
    dom.attr(button, "disabled", "");
    vAPI.messaging.send("devTools", {
      what: "snfeToDNR"
    }).then((result) => {
      log(toDNRText(result));
      dom.attr(button, "disabled", null);
    });
  });
  dom.on("#cfe-dump", "click", (ev) => {
    const button = ev.target;
    dom.attr(button, "disabled", "");
    vAPI.messaging.send("devTools", {
      what: "cfeDump"
    }).then((result) => {
      log(result);
      dom.attr(button, "disabled", null);
    });
  });
  dom.on("#purge-all-caches", "click", () => {
    vAPI.messaging.send("devTools", {
      what: "purgeAllCaches"
    }).then((result) => {
      log(result);
    });
  });
  vAPI.messaging.send("dashboard", {
    what: "getAppData"
  }).then((appData) => {
    if (appData.canBenchmark !== true) {
      return;
    }
    dom.attr("#snfe-benchmark", "disabled", null);
    dom.on("#snfe-benchmark", "click", (ev) => {
      const button = ev.target;
      dom.attr(button, "disabled", "");
      vAPI.messaging.send("devTools", {
        what: "snfeBenchmark"
      }).then((result) => {
        log(result);
        dom.attr(button, "disabled", null);
      });
    });
    dom.attr("#cfe-benchmark", "disabled", null);
    dom.on("#cfe-benchmark", "click", (ev) => {
      const button = ev.target;
      dom.attr(button, "disabled", "");
      vAPI.messaging.send("devTools", {
        what: "cfeBenchmark"
      }).then((result) => {
        log(result);
        dom.attr(button, "disabled", null);
      });
    });
    dom.attr("#sfe-benchmark", "disabled", null);
    dom.on("#sfe-benchmark", "click", (ev) => {
      const button = ev.target;
      dom.attr(button, "disabled", "");
      vAPI.messaging.send("devTools", {
        what: "sfeBenchmark"
      }).then((result) => {
        log(result);
        dom.attr(button, "disabled", null);
      });
    });
  });
  async function snfeQuery(lineNo, query) {
    const doc = cmEditor.getDoc();
    const lineHandle = doc.getLineHandle(lineNo);
    const result = await vAPI.messaging.send("devTools", {
      what: "snfeQuery",
      query
    });
    if (typeof result !== "string") {
      return;
    }
    cmEditor.startOperation();
    const nextLineNo = doc.getLineNumber(lineHandle) + 1;
    doc.replaceRange(`${result}
`, { line: nextLineNo, ch: 0 });
    cmEditor.endOperation();
  }
  cmEditor.on("beforeChange", (cm, details) => {
    if (details.origin !== "+input") {
      return;
    }
    if (details.text.length !== 2) {
      return;
    }
    if (details.text[1] !== "") {
      return;
    }
    const lineNo = details.from.line;
    const line = cm.getLine(lineNo);
    if (details.from.ch !== line.length) {
      return;
    }
    if (line.startsWith("snfe?") === false) {
      return;
    }
    const fields = line.slice(5).split(/\s+/);
    const query = {};
    for (const field of fields) {
      if (field === "") {
        continue;
      }
      if (/[/.]/.test(field)) {
        if (query.url === void 0) {
          query.url = field;
        } else if (query.from === void 0) {
          query.from = field;
        }
      } else if (query.type === void 0) {
        query.type = field;
      }
    }
    if (query.url === void 0) {
      return;
    }
    snfeQuery(lineNo, query);
  });
})();
