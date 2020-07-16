// interface Codex {
//   string(arr: Uint8Array|number[]): string;
//   bytes(str: string): Uint8Array;
// }

export const hex = {
  string(array) {
    return Array.from(array, x => x.toString(16).padStart(2, '0')).join('');
  },
  bytes(str) {
    return Uint8Array.from(new Array(str.length >>> 1).fill(0).map((_, i) => {
      const digits = str.substring(i << 1, (i + 1) << 1);
      const byte = Number.parseInt(digits, 16);
      if (isNaN(bytes)) throw new Error(`Invalid hex digits: ${digits}`);
      return byte;
    }));
  },
};

export const utf8 = {
  string(array) {
    if (Array.isArray(array)) array = Uint8Array.from(array);
    return new TextDecoder('utf-8').decode(array);
  },
  bytes(str) {
    return new TextEncoder('utf-8').encode(str);
  },
};

export const b64 = {
  string(array) {
    return btoa(String.fromCharCode(...array));
  },
  bytes(str) {
    const bin = atob(str);
    return Uint8Array.from(
        new Array(bin.length).fill(0).map((_, i) => bin.charCodeAt(i)));
  },
};

