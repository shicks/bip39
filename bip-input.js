import {index, words} from './words.js';

const template = document.createElement('template');
template.innerHTML = `
<style>
input {
  padding: .6em;
  font-size: 120%;
  font-weight: bold;
}
.back {
  position: absolute;
  color: #888;
  pointer-events: none;
  z-index: -1;
  border: 1px solid transparent;
}
.front {
  background-color: transparent;
  border: 1px solid #555;
}
/* TODO - consider a little "x" icon on the right as well? */
.invalid .back {
  background-color: #fbb;
}
.invalid .front {
  color: red;
  border-color: red;
}
:host {
  display: inline-block;
}
</style>
<div>
  <input class="back">
  <input class="front">
</div>
`;

/** A pair of input elements that allows a simple autocomplete. */
class BipInput extends HTMLElement {
  constructor() {
    super();
    this._values = [-1];
    this.attachShadow({mode: 'open'});
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.front = this.shadowRoot.querySelector('.front');
    this.back = this.shadowRoot.querySelector('.back');
    this.wrapper = this.shadowRoot.querySelector('div');
    this.keydown = this.keydown.bind(this);
    this.keyup = this.keyup.bind(this);
    this.blur = this.blur.bind(this);
  }

  keydown(e) {
    if (this.hasAttribute('multi') && e.key === ' ') {
      this.front.value = this.back.value;
    }
  }

  keyup(e) {
    this.compute();
    if (e.key === 'Enter') this.front.blur();
  }

  blur() {
    this.compute();
    this.front.value = this.back.value;
  }

  focus() {
    this.front.focus();
  }

  connectedCallback() {
    this.front.addEventListener('keyup', this.keyup);
    this.front.addEventListener('keydown', this.keydown);
    this.front.addEventListener('blur', this.blur);
    if (!this.hasAttribute('value')) this.setAttribute('value', -1);
  }

  disconnectedCallback() {
    this.front.removeEventListener('keyup', this.keyup);
    this.front.removeEventListener('keydown', this.keydown);
    this.front.removeEventListener('blur', this.blur);
  }

  compute() {
    const texts =
        this.hasAttribute('multi') ?
            this.front.value.split(/\s+/g) : [this.front.value];
    let newTexts = [...texts];
    let remainder = '';
    let changed = false;
    this.wrapper.classList.remove('invalid');
    const values = [];
    for (let i = 0; i < texts.length; i++) {
      if (!texts[i]) continue;
      let val = index.get(texts[i]);
      if (val == null) {
        this.wrapper.classList.add('invalid');
        val = -1;
      } else if (words[val] !== texts[i] && i < texts.length - 1) {
        newTexts[i] = words[val];
      } else if (i === texts.length - 1) {
        remainder = words[val].substring(texts[i].length);
      }
      values.push(val);
      if (this._values[i] !== val) changed = true;
    }
    const newText = newTexts.join(' ');
    this.back.value = newText + remainder;
    if (newText !== this.front.value) this.front.value = newText;

    if (changed) {
      this._values = values;
      this.dispatchEvent(new Event('change'));
    }
  }

  static get observedAttributes() {
    return ['size'];
  }

  attributeChangedCallback(name, prev, next) {
    switch (name) {
    case 'size': return this.front.size = this.back.size = next;
    }
  }

  get value() {
    return this._values[0];
  }

  set value(value) {
    value = parseInt(value);
    const word = value === -1 ? '' : words[value];
    if (word == null) throw new Error(`invalid value: ${value}`);
    this.back.value = word;
    if (!this.computing) this.front.value = word;
    this.wrapper.classList.remove('invalid');
  }

  get values() {
    return [...this._values];
  }

  // TODO - set values?

  get word() {
    return back.value;
  }

  set word(word) {
    const i = index.get(word);
    if (i == null) throw new Error(`Invalid word: ${word}`);
    this.setValue(i);
  }

  // TODO - get/set words?
}

customElements.define('bip-input', BipInput);
