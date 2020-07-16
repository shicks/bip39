import './bip-shares.js';
import {encrypt, decrypt} from './seed.js';

const template = document.createElement('template');
template.innerHTML = `
<style>
textarea {
  white-space: pre;
  font-family: monospace;
  padding: .6em;
  font-size: 120%;
}
.action {
  display: block;
  margin-top: 0.5em;
}
.error {
  color: red;
  white-space: pre;
  font-family: monospace;
}
</style>
<bip-shares class="mnemonic"></bip-shares>
<textarea class="text" rows="20" cols="80"></textarea>
<input class="action" type="submit" value="Encrypt">
<div class="error"></div>
`;

/** A pair of input elements that allows a simple autocomplete. */
class BipEncrypt extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.mnemonic = this.shadowRoot.querySelector('.mnemonic');
    this.text = this.shadowRoot.querySelector('.text');
    this.error = this.shadowRoot.querySelector('.error');
    this.action = this.shadowRoot.querySelector('.action');
    this.clickAction = this.clickAction.bind(this);
    this.changeText = this.changeText.bind(this);
  }

  async clickAction() {
    this.error.textContent = '';
    try {
      const f = this.action.value === 'Encrypt' ? encrypt : decrypt;
      this.text.value =
          await f(await this.mnemonic.mnemonic(), this.text.value);
      this.changeText();
    } catch (err) {
      this.error.textContent = err.message || this.action.value + 'ion failed.';
    }
  }

  changeText() {
    const encrypted = /ENCRYPTED MESSAGE/.test(this.text.value);
    this.action.value = encrypted ? 'Decrypt' : 'Encrypt';
  }

  connectedCallback() {
    this.action.addEventListener('click', this.clickAction);
    this.text.addEventListener('change', this.changeText);
    this.text.addEventListener('keyup', this.changeText);
    if (this.textContent) {
      this.text.value = this.textContent.replace(/^\s*|\s*$/g, '');
    }
    this.changeText();
  }

  disconnectedCallback() {
    this.action.removeEventListener('click', this.clickAction);
    this.text.removeEventListener('change', this.changeText);
    this.text.removeEventListener('keyup', this.changeText);
  }
}

customElements.define('bip-encrypt', BipEncrypt);
