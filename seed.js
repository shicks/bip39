// Utilities for converting a list of words to bits and from there to a seed.

import {words, index} from './words.js';
import {b64, utf8} from './codex.js';

export function xorWords(...lists) {
  // First make sure all the lists are the same length.
  const len = lists[0].length;
  for (const list of lists) {
    if (list.length !== len) throw new Error(`Mnemonics must be same length`);
  }
  // Compute the xor (if there are multiple).
  const result = [];
  for (let i = 0; i < len; i++) {
    let ind = 0;
    for (const list of lists) {
      const word = list[i];
      //const cur = index.get(word);
      if (!Number.isInteger(word)) throw new Error(`Bad mnemonic: ${word}`);
      ind ^= word;
    }
    result.push(words[ind]);
  }
  return result;
}

export async function verifyChecksum(list) {
  const len = list.length;
  if (len % 3) throw new Error(`Bad mnemonic length: ${len}`);
  const indices = list.map(word => {
    const ind = index.get(word);
    if (!Number.isInteger(ind)) throw new Error(`Bad mnemonic: ${word}`);
    return ind;
  });
  const bits = indices.map(i => i.toString(2).padStart(11, '0')).join('');
  // Last 4-8 bits form the checksum.
  const sumlen = Math.floor(bits.length / 32);
  const datalen = bits.length - sumlen;
  if (datalen % 8) throw new Error(`Bad mnemonic length: ${len}`);
  const suffix = bits.substring(datalen);
  const data = new Uint8Array(datalen >>> 3);
  for (let i = 0; i < data.length; i++) {
    data[i] = Number.parseInt(bits.substring(i << 3, (i + 1) << 3), 2);
  }
  // Compute and verify the checksum.
  const sum = new Uint8Array(await crypto.subtle.digest('SHA-256', data));
  const sumbits = Array.from(sum, x => x.toString(2).padStart(8, '0')).join('');
  return sumbits.startsWith(suffix);
}

// Returns the generated 512-bit seed as a length-64 Uint8Array.
export async function generateSeed(mnemonic, passphrase = '') {
  const key = await crypto.subtle.importKey(
      'raw', utf8.bytes(mnemonic.join(' ')),
      'PBKDF2', false, ['deriveBits', 'deriveKey']);
  const salt = concatBytes('mnemonic', passphrase);
  const derived = await crypto.subtle.deriveKey(
    {name: 'PBKDF2', iterations: 2048, hash: 'SHA-512', salt}, key,
    {'name': 'HMAC', 'hash': 'SHA-512', 'length': 512}, true, ['sign']);
  const exported = await crypto.subtle.exportKey('raw', derived);
  return new Uint8Array(exported);
}

export async function generateKey(mnemonic, passphrase = '') {
  const key = await crypto.subtle.importKey(
      'raw', utf8.bytes(mnemonic.join(' ')),
      'PBKDF2', false, ['deriveBits', 'deriveKey']);
  const salt = concatBytes('mnemonic', passphrase);
  const derived = await crypto.subtle.deriveKey(
    {name: 'PBKDF2', iterations: 2048, hash: 'SHA-512', salt}, key,
    {name: 'AES-GCM', length: 256}, false, ['encrypt', 'decrypt']);
  return derived;
}

// Basic approach: Derive a 512-bit seed using PBKDF2 using a random 256 bits
// salt as BIP-39 passphrase ("mnemonic" + salt + optional extra passphrase).
// The first 256 bits are used as an AES256-GCM key.  The next 96 bits are used
// as IV for encryption.  The final 160 bits are used as "additional data",
// and we keep a tag length of 128.
export async function encrypt(mnemonic, message, passphrase = '') {
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const seed = await generateSeed(mnemonic, concatBytes(salt, passphrase));
  const name = 'AES-GCM';
  const length = 256;
  const tagLength = 128;
  const key = await crypto.subtle.importKey(
      'raw', seed.slice(0, 32), {name, length}, false, ['encrypt']);
  const iv = seed.slice(32, 44);
  const additionalData = seed.slice(44);
  const cypherData = new Uint8Array(await crypto.subtle.encrypt(
      {name, iv, additionalData, tagLength}, key, utf8.bytes(message)));
  return `-----BEGIN ENCRYPTED MESSAGE-----
Salt: ${b64.string(salt)}

${breakLines(b64.string(cypherData), 64)}
-----END ENCRYPTED MESSAGE-----`;
}

// The message must contain a 'salt' header.
export async function decrypt(mnemonic, message, passphrase = '') {
  message =
      message.replace(/(^|\n)-+(BEGIN|END) ENCRYPTED MESSAGE-+(\n|$)/g, '');
  const [header, body, ...rest] = message.split(/\n\n+/);
  if (!body || rest.length) throw new Error(`Bad message format`);
  const match = /Salt: (.+)/.exec(header);
  if (!match) throw new Error(`Missing salt`);
  const salt = b64.bytes(match[1]);
  const seed = await generateSeed(mnemonic, concatBytes(salt, passphrase));
  const name = 'AES-GCM';
  const length = 256;
  const tagLength = 128;
  const key = await crypto.subtle.importKey(
      'raw', seed.slice(0, 32), {name, length}, false, ['decrypt']);
  const iv = seed.slice(32, 44);
  const additionalData = seed.slice(44);
  const clearData = new Uint8Array(await crypto.subtle.decrypt(
      {name, iv, additionalData, tagLength}, key, b64.bytes(body)));
  return utf8.string(clearData);
}

// Given UTF-8 strings and Uint8Arrays, concatenate them all together.
// Returns a Uint8Array.
export function concatBytes(...data) {
  const bytes = [];
  for (const item of data) {
    if (typeof item === 'string') {
      bytes.push(...utf8.bytes(item));
    } else if (Array.isArray(item) || item instanceof Uint8Array) {
      bytes.push(...item);
    } else {
      throw new Error(`Bad data: ${item}`);
    }
  }
  return Uint8Array.from(bytes);
}

export function breakLines(str, len) {
  const lines = Math.ceil(str.length / len);
  return new Array(lines).fill(0)
      .map((_, i) => str.substring(i * len, (i + 1) * len)).join('\n');
}
