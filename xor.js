import {words, index} from './words.js';

const word = document.getElementById('word');
const table = document.getElementById('table');

for (let i = 0; i < (words.length >> 3); i++) {
  const tr = document.createElement('tr');
  for (let col = 0; col < 8; col++) {
    const left = document.createElement('td');
    const right = document.createElement('td');
    left.textContent = right.textContent = words[col << 8 | i];
    tr.appendChild(left);
    tr.appendChild(right);
  }
  table.appendChild(tr);
}

word.addEventListener('change', () => {
  const base = word.values.reduce((a, b) => a ^ b, 0);
  for (let i = 0; i < words.length; i++) {
    const col = i >> 7 | 1;
    table.children[i & 0xff].children[col].textContent = words[i ^ base];
  }
});

document.body.addEventListener('keyup', (e) => {
  if (e.key === '/') word.focus();
});
