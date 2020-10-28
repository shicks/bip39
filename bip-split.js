import {index, words} from './words.js';
import {fixChecksum, splitMnemonic} from './seed.js';
import './bip-input.js';

const template = document.createElement('template');
template.innerHTML = `
<bip-input class="input" multi cols="80" rows="2"
           placeholder="Enter mnemonic to split"></bip-input>
<br/>
Words: <input class="words" type="text" value="24" size="2">
<input class="generate" type="submit" value="Generate">
<br/>
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
    this.fixButton = this.shadowRoot.querySelector('.fix');
    this.words = this.shadowRoot.querySelector('.words');
    this.genButton = this.shadowRoot.querySelector('.generate');
    this.output = this.shadowRoot.querySelector('.output');
    this.update = this.update.bind(this);
    this.fixChecksum = this.fixChecksum.bind(this);
    this.generate = this.generate.bind(this);
  }

  async fixChecksum() {
    this.input.words = await fixChecksum(this.input.words)
    this.update();
  }

  async generate() {
    const wordCount = Number(this.words.value);
    if (isNaN(wordCount)) return;
    const value = [];
    for (let i = 0; i < wordCount; i++) {
      value.push(words[Math.floor(Math.random() * 0x800)]);
    }
    this.input.words = value.join(' ');
    await this.fixChecksum();
  }

  update() {
    const num = Number(this.count.value);
    if (isNaN(num)) return;
    const shares = splitMnemonic(this.input.values, num);
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
