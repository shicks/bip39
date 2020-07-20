import {index, words} from './words.js';
import './bip-input.js';

const template = document.createElement('template');
template.innerHTML = `
<style>
bip-input {
  position: sticky;
  left: 0;
  top: 0;
  background: white;
  display: inline-block;
  margin-bottom: 1em;
}
table {
  border-collapse: collapse;
}
table tr:nth-child(even) {
  background-color: #ddd;
}
tr td:first-child {
  border-left: none !important;
}
tr td:nth-child(odd) {
  border-left: 2px solid black;
  font-weight: bold;
}
td {
  padding: .4em;
}
</style>
<bip-input class="word" multi cols="50" rows="1"></bip-input>
<table class="table">
</table>
`;

/** A bip-input together with a table for manual xor lookups. */
class BipXorTable extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.word = this.shadowRoot.querySelector('.word');
    this.table = this.shadowRoot.querySelector('.table');
    this.changeWord = this.changeWord.bind(this);
    this.keyup = this.keyup.bind(this);

    for (let i = 0; i < (words.length >> 3); i++) {
      const tr = document.createElement('tr');
      for (let col = 0; col < 8; col++) {
        const left = document.createElement('td');
        const right = document.createElement('td');
        left.textContent = right.textContent = words[col << 8 | i];
        tr.appendChild(left);
        tr.appendChild(right);
      }
      this.table.appendChild(tr);
    }
  }

  changeWord(e) {
    const base = this.word.values.reduce((a, b) => a ^ b, 0);
    for (let i = 0; i < words.length; i++) {
      const col = i >> 7 | 1;
      this.table.children[i & 0xff].children[col].textContent = words[i ^ base];
    }
  }

  keyup(e) {
    if (e.key === '/') this.word.focus();
  }

  connectedCallback() {
    this.word.addEventListener('change', this.changeWord);
    document.body.addEventListener('keyup', this.keyup);
  }

  disconnectedCallback() {
    this.word.removeEventListener('change', this.changeWord);
    document.body.removeEventListener('keyup', this.keyup);
  }
}

customElements.define('bip-xor-table', BipXorTable);
