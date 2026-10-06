/* TipSlice — bill splitter. Client-side only. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const form = $('split-form');
  if (!form) return;

  const billEl = $('bill');
  const tipEl = $('tip');
  const peopleEl = $('people');
  const taxToggle = $('tax-toggle');
  const taxFields = $('tax-fields');
  const taxEl = $('tax');
  const tipOnTaxEl = $('tip-on-tax');
  const errorEl = $('form-error');

  const out = {
    each: $('out-each'),
    tipEach: $('out-tip-each'),
    bill: $('out-bill'),
    tax: $('out-tax'),
    rowTax: $('row-tax'),
    tip: $('out-tip'),
    total: $('out-total'),
    note: $('out-note')
  };

  const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  const fmt = (cents) => money.format(cents / 100);
  const MAX_PEOPLE = 100;
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

  function calculate() {
    const errors = [];
    let bill = parseNum(billEl.value);
    const billBad = Number.isNaN(bill) || (bill !== null && bill > MAX_BILL);
    if (billBad) errors.push('Enter the bill as a number, like 96.40.');
    setInvalid(billEl, billBad);
    if (bill === null || billBad) bill = 0;

    let tipRate = parseNum(tipEl.value);
    const tipBad = Number.isNaN(tipRate) || (tipRate !== null && tipRate > 100);
    if (tipBad) errors.push('Tip should be a number from 0 to 100.');
    setInvalid(tipEl, tipBad);
    if (tipRate === null || tipBad) tipRate = 0;

    let people = parseNum(peopleEl.value);
    const peopleBad = Number.isNaN(people) || (people !== null && (people < 1 || people > MAX_PEOPLE || !Number.isInteger(people)));
    if (peopleBad) errors.push('People should be a whole number from 1 to ' + MAX_PEOPLE + '.');
    setInvalid(peopleEl, peopleBad);
    if (people === null || peopleBad) people = 1;

    let taxRate = 0;
    const taxOn = taxToggle.checked;
    if (taxOn) {
      const t = parseNum(taxEl.value);
      const taxBad = Number.isNaN(t) || (t !== null && t > 50);
      if (taxBad) errors.push('Tax rate should be a number from 0 to 50.');
      setInvalid(taxEl, taxBad);
      taxRate = (t === null || taxBad) ? 0 : t;
    } else {
      setInvalid(taxEl, false);
    }

    const billC = Math.round(bill * 100);
    const taxC = Math.round(billC * taxRate / 100);
    const tipBaseC = (taxOn && tipOnTaxEl.checked) ? billC + taxC : billC;
    const tipC = Math.round(tipBaseC * tipRate / 100);
    const totalC = billC + taxC + tipC;
    const eachC = Math.ceil(totalC / people);
    const tipEachC = Math.round(tipC / people);

    out.bill.textContent = fmt(billC);
    out.tax.textContent = fmt(taxC);
    out.rowTax.hidden = !taxOn;
    out.tip.textContent = fmt(tipC);
    out.total.textContent = fmt(totalC);
    out.each.textContent = fmt(eachC);
    out.tipEach.textContent = fmt(tipEachC);

    let note = '';
    if (people > 1 && totalC > 0) {
      const diff = eachC * people - totalC;
      note = 'Split evenly ' + people + ' ways.';
      if (diff !== 0) {
        note += ' Each share is rounded up so the group covers the bill (' +
          Math.abs(diff) + '¢ ' + (diff > 0 ? 'over' : 'under') + ' combined).';
      }
    }
    out.note.textContent = note;
    errorEl.hidden = errors.length === 0;
    errorEl.textContent = errors.join(' ');
  }

  form.addEventListener('input', calculate);
  form.addEventListener('change', (e) => {
    if (e.target === taxToggle) {
      taxFields.hidden = !taxToggle.checked;
      if (taxToggle.checked) taxEl.focus();
    }
    calculate();
  });

  form.querySelectorAll('.step').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cur = parseNum(peopleEl.value);
      const base = Number.isFinite(cur) ? Math.round(cur) : 1;
      peopleEl.value = String(Math.min(MAX_PEOPLE, Math.max(1, base + Number(btn.dataset.step))));
      calculate();
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    calculate();
    if (document.activeElement) document.activeElement.blur();
    const results = $('results');
    const r = results.getBoundingClientRect();
    if (r.top < 0 || r.bottom > window.innerHeight) {
      results.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }
  });

  $('reset-btn').addEventListener('click', () => {
    form.reset();
    peopleEl.value = '2';
    tipEl.value = '18';
    taxFields.hidden = true;
    calculate();
    billEl.focus();
  });

  taxFields.hidden = !taxToggle.checked;
  calculate();
})();
