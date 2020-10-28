import {index, words} from './words.js';
import {randomWords} from './seed.js';

const template = document.createElement('template');
template.innerHTML = `
<style>
textarea {
  padding: .6em;
  font-size: 120%;
  font-weight: bold;
  resize: none;
}
.back {
  color: #888;
  pointer-events: none;
  xz-index: -1;
  border: 1px solid transparent;
}
.front {
  position: absolute;
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
  <textarea class="front"></textarea>
  <textarea class="back"></textarea>
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
    this.scroll = this.scroll.bind(this);
    this.blur = this.blur.bind(this);
    this.tabLen = 0;
  }

  keydown(e) {
    // Tab gets special treatment to cycle forward (or backward with shift).
    if (this.front.selectionStart !== this.front.value.length) return;
    if (e.key === 'Tab') {
      if (!this.front.value) return;
      e.preventDefault();
    }
  }

  keyup(e) {
    if ((e.altKey || e.metaKey) && /^[1-9]$/.test(e.key)) {
      // generate N random words.
      this.front.value = randomWords(Number.parseInt(e.key)).join(' ');
    }
    if (this.front.selectionStart !== this.front.value.length) {
      this.compute();
      return;
    }
    if (e.key === 'Shift') return;
    if (this.hasAttribute('multi') && e.key === ' ') {
      this.front.value = this.back.value;
      if (!this.front.value.endsWith(' ')) this.front.value += ' ';
    }
    if (e.key === 'Tab') {
      if (this.tabLen) {
        const split = this.back.value.split(' ');
        while (split.length && !split[split.length - 1]) split.pop();
        const last = split.pop();
        if (!last) return;
        const prefix = last.substring(0, this.tabLen);
        const lastIndex = index.get(last) || 0;
        let next = words[lastIndex + (e.shiftKey ? -1 : 1)] || '';
        if (next.substring(0, this.tabLen) !== prefix) {
          if (e.shiftKey) {
            let i = index.get(prefix);
            while (words[i].substring(0, this.tabLen) === prefix) i++;
            next = words[i - 1];
          } else {
            next = words[index.get(prefix) || 0];
          }
        }
        split.push(next);
        this.front.value = (this.back.value = split.join(' ')) + ' ';
      } else {
        this.tabLen = (this.front.value.split(' ').pop() || '').length;
        this.front.value = this.back.value + ' ';
      }
    } else {
      this.tabLen = 0;
    }
    this.compute();
    if (e.key === 'Enter') this.front.blur();
  }

  scroll() {
    this.back.scrollTo(this.front.scrollLeft, this.front.scrollTop);
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
    this.front.addEventListener('scroll', this.scroll);
    if (!this.hasAttribute('value')) this.setAttribute('value', -1);
  }

  disconnectedCallback() {
    this.front.removeEventListener('keyup', this.keyup);
    this.front.removeEventListener('keydown', this.keydown);
    this.front.removeEventListener('blur', this.blur);
    this.front.removeEventListener('scroll', this.scroll);
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
    if (this._values.length !== values.length) changed = true;

    if (changed) {
      this._values = values;
      // TODO - do it instantly, make the handler delayed?
      setTimeout(() => {
        this.dispatchEvent(new CustomEvent('change', {bubbles: true}));
      }, 15);
    }
    this.scroll();
  }

  static get observedAttributes() {
    return ['cols', 'rows', 'multi', 'placeholder'];
  }

  attributeChangedCallback(name, prev, next) {
    switch (name) {
    case 'cols': return this.front.cols = this.back.cols = next;
    case 'rows': return this.front.rows = this.back.rows = next;
    case 'placeholder': return this.front.placeholder = next;
    }
  }

  get value() {
    return this._values[0] || 0;
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
    //if (!this.front.value) return [];
    return [...this._values];
  }

  // TODO - set values?

  get words() {
    return this.values.map(v => words[v]);
  }

  set words(array) {
    for (const word of array) {
      if (index.get(word) == null) throw new Error(`Invalid word: ${word}`);
    }
    this.front.value = array.join(' ');
    this.compute();
  }

  get word() {
    return this.back.value;
  }

  set word(word) {
    const i = index.get(word);
    if (i == null) throw new Error(`Invalid word: ${word}`);
    this.front.value = word;
    this.compute();
  }

  // TODO - get/set words?

  set multi(multi) {
    this.setAttribute('multi', multi);
  }

  set rows(rows) {
    this.setAttribute('rows', rows);
  }

  set cols(cols) {
    this.setAttribute('cols', cols);
  }

  set placeholder(text) {
    this.setAttribute('placeholder', text);
  }
}

customElements.define('bip-input', BipInput);
