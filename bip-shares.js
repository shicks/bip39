import './bip-input.js';
import {xorWords, verifyChecksum} from './seed.js';

const template = document.createElement('template');
template.innerHTML = `
<style>
bip-input {
  background: white;
  display: block;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}
.add-share.visible {
  display: block;
}
.add-share {
  display: none;
  margin-bottom: 0.5em;
}
</style>
<div class="inputs">
  <bip-input multi rows="2" cols="80" placeholder="Enter mnemonic"></bip-input>
</div>
<input type="text" class="add-share" placeholder="Add mnemonic share">
`;

/** A set of bip-input elements for an XOR-based share. */
class BipShares extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.inputs = this.shadowRoot.querySelector('.inputs');
    this.add = this.shadowRoot.querySelector('.add-share');
    this.addShare = this.addShare.bind(this);
    this.inputChange = this.inputChange.bind(this);
    this.inputBlur = this.inputBlur.bind(this);
  }

  addShare() {
    // When the 'add-share' input focuses, turn it into a new bip-input
    // and focus it.
    const input = document.createElement('bip-input');
    input.multi = true;
    input.rows = '2';
    input.cols = '80';
    this.inputs.appendChild(input);
    input.focus();
    this.add.classList.remove('visible');
  }

  inputBlur() {
    for (const input of this.inputs.children) {
      if (!input.values.length && this.inputs.children.length > 1) {
        input.remove();
      }
    }
    this.inputChange();
  }

  inputChange() {
    const visible = [...this.inputs.children].every(c => c.values.length);
    this.add.classList.toggle('visible', visible);
  }

  connectedCallback() {
    this.add.addEventListener('focus', this.addShare);
    this.inputs.addEventListener('focusout', this.inputBlur);
    this.inputs.addEventListener('change', this.inputChange);
  }

  disconnectedCallback() {
    this.add.removeEventListener('focus', this.addShare);
    this.inputs.removeEventListener('focusout', this.inputBlur);
    this.inputs.removeEventListener('change', this.inputChange);
  }

  // Returns a new array of strings, or throws.  Verifies checksum.
  async mnemonic() {
    const values = [];
    for (const input of this.inputs.children) {
      values.push(input.values);
    }
    const xored = xorWords(...values);
    if (!await verifyChecksum(xored)) throw new Error(`Bad mnemonic checksum`);
    return xored;
  }
}

customElements.define('bip-shares', BipShares);
