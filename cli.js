import * as crypto from 'crypto';
import * as fs from 'fs';
import atob from 'atob';
import btoa from 'btoa';
import getopts from 'getopts';
import * as seed from './seed.js';
import * as words from './words.js';

// Make sure we have crypto.subtle available as a global!
//(globalThis.crypto || (globalThis.crypto = {})).subtle = SubtleCrypto;
globalThis.crypto = crypto.webcrypto;
globalThis.atob = atob;
globalThis.btoa = btoa;

main(...process.argv.slice(2)).then((exit) => {
  process.exitCode = exit || 0;
}, (err) => {
  console.error(`An error occurred: ${err.stack}`);
  process.exitCode = 1;
});

async function main(directive, ...args) {
  // Check for a directive.
  if (directive === 'split') {
    // Usage: bip39-share split [--count=3] "word1 word2 word3..."
    return await split(args);
  } else if (directive === 'encrypt') {
    // Usage: bip39-share encrypt [--key="word1 word2..."]... < message
    return await crypt(args, seed.encrypt);
  } else if (directive === 'decrypt') {
    // Usage: bip39-share decrypt [--key="word1 word2..."]... < encrypted
    return await crypt(args, seed.decrypt);
  } else {
    usage();
    return 1;
  }
}

function usage() {
  console.log(`Usage: bip39-share COMMAND [OPTION]...

Summary: a simple tool for dealing with XOR-based N-of-N key shares

Key Splitting: bip39-share split [OPTION]...
   Generates a mnemonic (or splits an existing one)

   Options:
      -c, --count=NUM       split the given [default 3]
      -w, --words=NUM       number of words to generate [default 24]
      -k, --key=MNEMONIC    provides the mnemonic to split

Encryption: bip39-share (encrypt|decrypt) [OPTION]...
   Encrypts/decrypts a message read from stdin

   Options:
      -k, --key=MNEMONIC    the key to use for encrypting
                            split keys may be given by passing this flag
                            repeatedly (-k 'key one' -k 'key two')`);
}

function splitWords(str) {
  return str.trim().split(/\s+/g);
}

async function split(args) {
  const opts = getopts(args, {
    string: ['k'],
    alias: {'key': 'k', 'count': 'c', 'words': 'w'},
    default: {'words': 24, 'count': 3},
  });
  const key =
      splitWords(
          opts['k'] ||
          (await seed.fixChecksum(seed.randomWords(opts['w']))).join(' '));
  if (!opts['k']) console.log(`Key: ${key.join(' ')}`);
  const count = Number(opts['c']);
  if (isNaN(count)) throw new Error(`Expected count to be a number: ${count}`);
  const shares = seed.splitMnemonic(key, count);
  for (let i = 0; i < count; i++) {
    console.log(`Share ${i + 1}: ${shares[i].join(' ')}`);
  }
}

async function crypt(args, func) {
  const opts = getopts(args, {string: ['k'], alias: {'key': 'k'}});
  const keys = Array.isArray(opts['k']) ? opts['k'] : [opts['k']];
  const key = seed.xorWords(...keys.map(splitWords));
  if (!await seed.verifyChecksum(key)) throw new Error(`Bad mnemonic checksum`);
  const message = fs.readFileSync(0, 'utf-8');
  console.log(await func(key, message));
}
