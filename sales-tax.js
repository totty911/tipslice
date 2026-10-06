/* TipSlice — sales tax calculator. Client-side only. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const form = $('tax-form');
  if (!form) return;

  const amountEl = $('amount');
  const rateEl = $('rate');
  const errorEl = $('form-error');
  const labelAmount = $('label-amount');
  const outPre = $('out-pre');
  const outTax = $('out-tax');
  const outTotal = $('out-total');
  const outNote = $('out-note');
  const modePre = $('mode-pre');
  const modePost = $('mode-post');

  const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  const fmt = (cents) => money.format(cents / 100);
  const MAX_AMOUNT = 1e9;

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

  function isReverse() {
    return modePost.checked;
  }

  function syncLabel() {
    labelAmount.textContent = isReverse() ? 'Total including tax' : 'Price before tax';
  }

  function calculate() {
    const errors = [];
    let amount = parseNum(amountEl.value);
    const amountBad = Number.isNaN(amount) || (amount !== null && amount > MAX_AMOUNT);
    if (amountBad) errors.push('Enter an amount as a number, like 40.00.');
    setInvalid(amountEl, amountBad);
    if (amount === null || amountBad) amount = 0;

    let rate = parseNum(rateEl.value);
    const rateBad = Number.isNaN(rate) || (rate !== null && rate > 50);
    if (rateBad) errors.push('Tax rate should be a number from 0 to 50.');
    setInvalid(rateEl, rateBad);
    if (rate === null || rateBad) rate = 0;

    let preC, taxC, totalC;
    if (isReverse()) {
      // amount is total with tax; reverse out the pre-tax price
      totalC = Math.round(amount * 100);
      preC = rate === 0 ? totalC : Math.round(totalC / (1 + rate / 100));
      taxC = totalC - preC;
      outNote.textContent = rate > 0 && amount > 0
        ? 'Backed out the pre-tax price from a tax-inclusive total at ' + (+rate.toFixed(2)) + '%.'
        : '';
    } else {
      preC = Math.round(amount * 100);
      taxC = Math.round(preC * rate / 100);
      totalC = preC + taxC;
      outNote.textContent = '';
    }

    outPre.textContent = fmt(preC);
    outTax.textContent = fmt(taxC);
    outTotal.textContent = fmt(totalC);
    errorEl.hidden = errors.length === 0;
    errorEl.textContent = errors.join(' ');
  }

  form.addEventListener('input', calculate);
  form.addEventListener('change', (e) => {
    if (e.target.name === 'mode') {
      syncLabel();
      calculate();
      amountEl.focus();
    }
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    calculate();
    if (document.activeElement) document.activeElement.blur();
  });

  $('reset-btn').addEventListener('click', () => {
    form.reset();
    modePre.checked = true;
    syncLabel();
    calculate();
    amountEl.focus();
  });

  syncLabel();
  calculate();
})();
