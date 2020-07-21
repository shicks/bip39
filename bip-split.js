import {index, words} from './words.js';
import {computeChecksum} from './seed.js';
import './bip-input.js';

const template = document.createElement('template');
template.innerHTML = `
<bip-input class="input" multi cols="80" rows="2"
           placeholder="Enter mnemonic to split"></bip-input>
Shares: <input class="count" type="text" value="3" size="2">
<input class="fix" type="submit" value="Fix">
<div class="output"></div>
`;

/** A bip-input with an output field for split shares. */
class BipSplit extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.input = this.shadowRoot.querySelector('.input');
    this.count = this.shadowRoot.querySelector('.count');
    this.output = this.shadowRoot.querySelector('.output');
    this.fixButton = this.shadowRoot.querySelector('.fix');
    this.update = this.update.bind(this);
    this.fixChecksum = this.fixChecksum.bind(this);
  }

  async fixChecksum() {
    const values = [...this.input.words];
    const checksum = await computeChecksum(values);
    const sumlen = checksum.length;
    const last = values[values.length - 1];
    const mask = (1 << sumlen) - 1;
    const word =
        words[(index.get(last) & ~mask) | Number.parseInt(checksum, 2)];
    const split = [...this.input.words];
    while (!split[split.length - 1]) split.pop();
    split[split.length - 1] = word;
    this.input.words = split;
    this.update();
  }

  update() {
    const num = Number(this.count.value);
    if (isNaN(num)) return;
    const need = this.input.values.length * (num - 1);
    const rand = [...crypto.getRandomValues(new Uint16Array(need))];
    const shares = new Array(num).fill(0).map(() => []);
    for (let value of this.input.values) {
      for (let i = 1; i < num; i++) {
        const term = rand.pop() & 0x7ff;
        value ^= term;
        shares[i].push(words[term]);
      }
      shares[0].push(words[value]);
    }
    while (this.output.firstChild) this.output.firstChild.remove();
    for (let i = 0; i < num; i++) {
      const share = document.createElement('div');
      share.textContent = `Share ${i + 1}: ${shares[i].join(' ')}`;
      this.output.appendChild(share);
    }
  }

  connectedCallback() {
    this.input.addEventListener('change', this.update);
    this.count.addEventListener('change', this.update);
    this.fixButton.addEventListener('click', this.fixChecksum);
  }

  disconnectedCallback() {
    this.input.removeEventListener('change', this.update);
    this.count.removeEventListener('change', this.update);
    this.fixButton.removeEventListener('click', this.fixChecksum);
  }
}

customElements.define('bip-split', BipSplit);
