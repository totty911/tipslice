/* TipSlice — tip calculator. Everything runs in the browser; nothing is sent anywhere.
 * AdSense config lives in ads.js so one paste turns ads on for every page.
 */

(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const form = $('tip-form');
  if (!form) return;

  const billEl = $('bill');
  const customEl = $('custom-tip');
  const customWrap = $('custom-tip-wrap');
  const peopleEl = $('people');
  const taxToggle = $('tax-toggle');
  const taxFields = $('tax-fields');
  const taxEl = $('tax');
  const tipOnTaxEl = $('tip-on-tax');
  const errorEl = $('form-error');

  const out = {
    totalPP: $('out-total-pp'),
    tipPP: $('out-tip-pp'),
    bill: $('out-bill'),
    tax: $('out-tax'),
    rowTax: $('row-tax'),
    tip: $('out-tip'),
    tipRate: $('out-tip-rate'),
    total: $('out-total'),
    note: $('out-note')
  };

  const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  const fmt = (cents) => money.format(cents / 100);

  const MAX_PEOPLE = 100;
  const MAX_BILL = 1e9;
  const DEFAULT_PEOPLE = 1;
  const DEFAULT_TIP = 18;
  const SHARE_PATH = '/';
  const PRESET_TIPS = [10, 15, 18, 20, 25];
  let shareState = null;
  let shareUi = null;

  /** Parse a user-typed number. Returns NaN for invalid input, null for empty. */
  function parseNum(raw) {
    let s = String(raw).trim().replace(/[\s$%]/g, '');
    if (s === '') return null;
    if (/^\d+,\d{1,2}$/.test(s)) s = s.replace(',', '.');
    else s = s.replace(/,/g, '');
    if (!/^\d*\.?\d*$/.test(s) || s === '.') return NaN;
    return parseFloat(s);
  }

  function selectedTip() {
    const checked = form.querySelector('input[name="tip"]:checked');
    if (!checked) return { rate: 0, custom: false };
    if (checked.value === 'custom') return { rate: parseNum(customEl.value), custom: true };
    return { rate: Number(checked.value), custom: false };
  }

  function setInvalid(el, bad) {
    if (bad) el.setAttribute('aria-invalid', 'true');
    else el.removeAttribute('aria-invalid');
  }

  function sharePayload() {
    if (!shareState || shareState.errors || !(shareState.totalC > 0)) {
      return {
        error: shareState && shareState.errors
          ? 'Fix the highlighted fields, then copy the summary.'
          : 'Enter a bill amount first.'
      };
    }
    const url = TipSliceShare.publicUrl(SHARE_PATH, shareState);
    return { text: TipSliceShare.formatSummary(shareState, url), url: url };
  }

  function applySharedState() {
    if (!window.TipSliceShare) return;
    const s = TipSliceShare.readState(MAX_BILL, MAX_PEOPLE);
    if (s.bill !== null) billEl.value = TipSliceShare.compact(s.bill, 2);
    if (s.people !== null) peopleEl.value = String(s.people);
    if (s.tip !== null) {
      if (PRESET_TIPS.indexOf(s.tip) !== -1) {
        const radio = form.querySelector('input[name="tip"][value="' + s.tip + '"]');
        if (radio) radio.checked = true;
        customEl.value = '';
      } else {
        $('tip-custom-radio').checked = true;
        customEl.value = TipSliceShare.compact(s.tip, 2);
      }
    }
    if (s.tax !== null) {
      taxToggle.checked = true;
      taxEl.value = TipSliceShare.compact(s.tax, 3);
      tipOnTaxEl.checked = s.tipOnTax;
    }
  }

  function calculate() {
    if (shareUi) shareUi.clearFeedback();
    const errors = [];

    let bill = parseNum(billEl.value);
    const billBad = Number.isNaN(bill) || (bill !== null && bill > MAX_BILL);
    if (billBad) errors.push('Enter the bill as a number, like 48.50.');
    setInvalid(billEl, billBad);
    if (bill === null || billBad) bill = 0;

    const tipSel = selectedTip();
    let tipRate = tipSel.rate;
    const tipBad = tipSel.custom && (Number.isNaN(tipRate) || (tipRate !== null && tipRate > 100));
    if (tipBad) errors.push('Custom tip should be a number from 0 to 100.');
    setInvalid(customEl, tipBad);
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

    // Work in integer cents to avoid floating-point drift.
    const billC = Math.round(bill * 100);
    const taxC = Math.round(billC * taxRate / 100);
    const tipBaseC = (taxOn && tipOnTaxEl.checked) ? billC + taxC : billC;
    const tipC = Math.round(tipBaseC * tipRate / 100);
    const totalC = billC + taxC + tipC;
    const totalPPC = Math.ceil(totalC / people); // round up so shares always cover the bill
    const tipPPC = Math.round(tipC / people);

    out.bill.textContent = fmt(billC);
    out.tax.textContent = fmt(taxC);
    out.rowTax.hidden = !taxOn;
    out.tip.textContent = fmt(tipC);
    out.tipRate.textContent = String(+tipRate.toFixed(2));
    out.total.textContent = fmt(totalC);
    out.totalPP.textContent = fmt(totalPPC);
    out.tipPP.textContent = fmt(tipPPC);

    let note = '';
    if (people > 1 && totalC > 0) {
      const diff = totalPPC * people - totalC;
      note = 'Split ' + people + ' ways.';
      if (diff !== 0) {
        note += ' Shares are rounded up to the cent, so together they come to ' + fmt(totalPPC * people) + ', ' +
          Math.abs(diff) + '¢ ' + (diff > 0 ? 'over' : 'under') + ' the total.';
      }
    }
    out.note.textContent = note;

    errorEl.hidden = errors.length === 0;
    errorEl.textContent = errors.join(' ');

    shareState = {
      include: errors.length === 0 && (billC > 0 || people !== DEFAULT_PEOPLE || tipRate !== DEFAULT_TIP || taxOn),
      errors: errors.length > 0,
      bill: billC / 100,
      people: people,
      tipRate: tipRate,
      taxOn: taxOn,
      tax: taxRate,
      tipOnTax: taxOn && tipOnTaxEl.checked,
      totalC: totalC,
      totalPPC: totalPPC,
      tipPPC: tipPPC
    };
    if (window.TipSliceShare && errors.length === 0) TipSliceShare.syncUrl(shareState);
  }

  function syncCustomVisibility(focus) {
    const isCustom = $('tip-custom-radio').checked;
    customWrap.hidden = !isCustom;
    if (isCustom && focus) customEl.focus();
  }

  form.addEventListener('input', calculate);
  form.addEventListener('change', (e) => {
    if (e.target.name === 'tip') syncCustomVisibility(true);
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
      const next = Math.min(MAX_PEOPLE, Math.max(1, base + Number(btn.dataset.step)));
      peopleEl.value = String(next);
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
    peopleEl.value = '1';
    taxFields.hidden = true;
    syncCustomVisibility(false);
    calculate();
    billEl.focus();
  });

  applySharedState();
  syncCustomVisibility(false);
  taxFields.hidden = !taxToggle.checked;
  if (window.TipSliceShare && $('copy-split')) {
    shareUi = TipSliceShare.wire({
      copyButton: $('copy-split'),
      shareButton: $('share-split'),
      statusEl: $('share-status'),
      getPayload: sharePayload
    });
  }
  calculate();
})();
