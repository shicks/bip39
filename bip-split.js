import {index, words} from './words.js';
import './bip-input.js';

const template = document.createElement('template');
template.innerHTML = `
<bip-input class="input" multi cols="80" rows="2"
           placeholder="Enter mnemonic to split"></bip-input>
Shares: <input class="count" type="text" value="3" size="2">
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
    this.update = this.update.bind(this);
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
  }

  disconnectedCallback() {
    this.input.removeEventListener('change', this.update);
    this.count.removeEventListener('change', this.update);
  }
}

customElements.define('bip-split', BipSplit);
