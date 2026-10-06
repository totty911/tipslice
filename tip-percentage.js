/* TipSlice — tip percentage comparison. Client-side only. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const form = $('pct-form');
  if (!form) return;

  const billEl = $('bill');
  const customEl = $('custom-pct');
  const errorEl = $('form-error');
  const tbody = $('pct-tbody');
  const RATES = [10, 15, 18, 20, 22, 25];

  const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  const fmt = (cents) => money.format(cents / 100);
  const MAX_BILL = 1e9;

  function parseNum(raw) {
    let s = String(raw).trim().replace(/[\s$%]/g, '');
    if (s === '') return null;
    if (/^\d+,\d{1,2}$/.test(s)) s = s.replace(',', '.');
    else s = s.replace(/,/g, '');
    if (!/^\d*\.?\d*$/.test(s) || s === '.') return NaN;
    return parseFloat(s);
  }

  function setInvalid(el, bad) {
    if (bad) el.setAttribute('aria-invalid', 'true');
    else el.removeAttribute('aria-invalid');
  }

  function row(rate, billC, highlight) {
    const tipC = Math.round(billC * rate / 100);
    const totalC = billC + tipC;
    const tr = document.createElement('tr');
    if (highlight) tr.className = 'hl';
    tr.innerHTML = '<td>' + rate + '%</td><td>' + fmt(tipC) + '</td><td>' + fmt(totalC) + '</td>';
    return tr;
  }

  function calculate() {
    const errors = [];
    let bill = parseNum(billEl.value);
    const billBad = Number.isNaN(bill) || (bill !== null && bill > MAX_BILL);
    if (billBad) errors.push('Enter the bill as a number, like 64.00.');
    setInvalid(billEl, billBad);
    if (bill === null || billBad) bill = 0;

    let custom = parseNum(customEl.value);
    const customBad = Number.isNaN(custom) || (custom !== null && (custom < 0 || custom > 100));
    if (customBad) errors.push('Custom percentage should be from 0 to 100.');
    setInvalid(customEl, customBad);
    if (customBad) custom = null;

    const billC = Math.round(bill * 100);
    tbody.replaceChildren();
    RATES.forEach((r) => tbody.appendChild(row(r, billC, false)));
    if (custom !== null && !RATES.includes(custom)) {
      tbody.appendChild(row(+custom.toFixed(2), billC, true));
    } else if (custom !== null && RATES.includes(custom)) {
      // Highlight the matching preset row
      const idx = RATES.indexOf(custom);
      tbody.children[idx].classList.add('hl');
    }

    errorEl.hidden = errors.length === 0;
    errorEl.textContent = errors.join(' ');
  }

  form.addEventListener('input', calculate);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    calculate();
    if (document.activeElement) document.activeElement.blur();
  });

  $('reset-btn').addEventListener('click', () => {
    form.reset();
    calculate();
    billEl.focus();
  });

  calculate();
})();
