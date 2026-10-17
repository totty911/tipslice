/* TipSlice — currency converter. Rates are fetched in the browser. Amounts are not uploaded. */
(function (factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof document !== 'undefined') api.mount();
})(function () {
  'use strict';

  const ER_URL = 'https://open.er-api.com/v6/latest/USD';
  const FRANKFURTER_URL = 'https://api.frankfurter.dev/v2/rates?base=USD';
  const CACHE_KEY = 'tipslice-fx-v1';
  const MAX_AMOUNT = 1e12;
  const PINNED = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'MXN', 'CHF', 'CNY', 'INR', 'THB', 'KRW', 'SGD', 'HKD', 'NZD', 'SEK', 'NOK', 'DKK', 'BRL', 'ZAR'];

  const $ = (id) => document.getElementById(id);

  function parseNum(raw) {
    let s = String(raw == null ? '' : raw).trim().replace(/[\s$€£¥%]/g, '');
    if (s === '') return null;
    if (/^\d+,\d{1,6}$/.test(s)) s = s.replace(',', '.');
    else s = s.replace(/,/g, '');
    if (!/^\d*\.?\d*$/.test(s) || s === '.') return NaN;
    return parseFloat(s);
  }

  function digitsFor(currency) {
    try {
      const n = new Intl.NumberFormat('en-US', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits;
      return Number.isFinite(n) ? n : 2;
    } catch (e) {
      return 2;
    }
  }

  function toMinor(amount, currency) {
    const digits = digitsFor(currency);
    const f = 10 ** digits;
    return Math.round((amount + Number.EPSILON) * f);
  }

  function fromMinor(minor, currency) {
    return minor / (10 ** digitsFor(currency));
  }

  function formatMoney(amount, currency) {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
    } catch (e) {
      return amount.toFixed(2) + ' ' + currency;
    }
  }

  function formatRate(n) {
    if (!Number.isFinite(n)) return '—';
    return new Intl.NumberFormat('en-US', { maximumSignificantDigits: 6 }).format(n);
  }

  function labelFor(code) {
    try {
      const name = new Intl.DisplayNames(['en'], { type: 'currency' }).of(code);
      if (name && name.toUpperCase() !== code) return name + ' (' + code + ')';
    } catch (e) { /* code only */ }
    return code;
  }

  function cleanRates(raw) {
    const rates = {};
    if (!raw || typeof raw !== 'object') return rates;
    Object.keys(raw).forEach((code) => {
      const n = raw[code];
      if (typeof code === 'string' && /^[A-Z]{3}$/.test(code) && typeof n === 'number' && n > 0 && Number.isFinite(n)) {
        rates[code] = n;
      }
    });
    if (!rates.USD) rates.USD = 1;
    return rates;
  }

  function normalizeEr(data) {
    if (!data || data.result !== 'success' || data.base_code !== 'USD') {
      throw new Error('ExchangeRate-API returned an unexpected table.');
    }
    const rates = cleanRates(data.rates);
    if (Object.keys(rates).length < 10) throw new Error('ExchangeRate-API table was incomplete.');
    return {
      provider: 'er-api',
      sourceName: 'ExchangeRate-API',
      sourceUrl: 'https://www.exchangerate-api.com',
      endpoint: ER_URL,
      asOf: String(data.time_last_update_utc || ''),
      pairDates: null,
      base: 'USD',
      rates: rates
    };
  }

  function normalizeFrankfurter(rows) {
    if (!Array.isArray(rows)) throw new Error('Frankfurter returned an unexpected table.');
    const rates = { USD: 1 };
    const pairDates = {};
    rows.forEach((row) => {
      if (!row || row.base !== 'USD' || typeof row.rate !== 'number' || row.rate <= 0) return;
      if (typeof row.quote !== 'string' || !/^[A-Z]{3}$/.test(row.quote)) return;
      rates[row.quote] = row.rate;
      if (typeof row.date === 'string') pairDates[row.quote] = row.date;
    });
    if (Object.keys(rates).length < 10) throw new Error('Frankfurter table was incomplete.');
    const dates = Object.keys(pairDates).map((k) => pairDates[k]).sort();
    return {
      provider: 'frankfurter',
      sourceName: 'Frankfurter',
      sourceUrl: 'https://www.frankfurter.app',
      endpoint: FRANKFURTER_URL,
      asOf: dates.length ? dates[dates.length - 1] : '',
      pairDates: pairDates,
      base: 'USD',
      rates: rates
    };
  }

  /* rates are units of that currency per 1 USD. */
  function convert(amount, from, to, rates) {
    if (from === to) return amount;
    const fromPerUsd = from === 'USD' ? 1 : rates[from];
    const toPerUsd = to === 'USD' ? 1 : rates[to];
    if (!fromPerUsd || !toPerUsd) return NaN;
    return amount / fromPerUsd * toPerUsd;
  }

  function unitsPerOne(from, to, rates) {
    if (from === to) return 1;
    const one = convert(1, from, to, rates);
    return one;
  }

  function timeoutSignal(ms) {
    if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') return AbortSignal.timeout(ms);
    if (typeof AbortController === 'undefined') return undefined;
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
  }

  async function fetchJson(url) {
    const res = await fetch(url, { cache: 'no-store', signal: timeoutSignal(8000) });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const saved = JSON.parse(raw);
      if (!saved || !saved.rates || !saved.sourceName) return null;
      saved.rates = cleanRates(saved.rates);
      if (Object.keys(saved.rates).length < 10) return null;
      saved.cached = true;
      return saved;
    } catch (e) {
      return null;
    }
  }

  function writeCache(table) {
    try {
      const copy = {
        provider: table.provider,
        sourceName: table.sourceName,
        sourceUrl: table.sourceUrl,
        endpoint: table.endpoint,
        asOf: table.asOf,
        pairDates: table.pairDates,
        base: table.base,
        rates: table.rates
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(copy));
    } catch (e) { /* private mode */ }
  }

  function formatAsOf(asOf) {
    if (!asOf) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(asOf)) {
      const day = new Date(asOf + 'T00:00:00Z');
      if (!Number.isNaN(day.getTime())) {
        return new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(day);
      }
    }
    const parsed = new Date(asOf);
    if (Number.isNaN(parsed.getTime())) return asOf;
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(parsed) + ' UTC';
  }

  function sourceSentence(table, from, to) {
    if (!table) return '';
    if (table.manual) return 'Rate you typed. The live table was not used.';
    const name = table.sourceName;
    if (table.provider === 'frankfurter' && table.pairDates) {
      const bits = [];
      [from, to].forEach((code) => {
        if (code !== 'USD' && table.pairDates[code]) bits.push(code + ' dated ' + formatAsOf(table.pairDates[code]));
      });
      const pair = bits.length ? bits.join(', ') : 'dated ' + table.asOf;
      const prefix = table.cached ? 'Saved in this browser from Frankfurter' : 'Frankfurter';
      const via = table.fallback ? ' ExchangeRate-API did not load, so this table is the fallback.' : '';
      return prefix + ', via USD. ' + pair + '.' + via;
    }
    const when = table.asOf ? ' As of ' + formatAsOf(table.asOf) + '.' : '';
    if (table.cached) return 'Saved in this browser from ' + name + '.' + when + ' Live rates did not load.';
    return name + ' open USD table.' + when;
  }

  function mount() {
    const form = $('fx-form');
    if (!form) return;

    const amountEl = $('amount');
    const fromEl = $('from');
    const toEl = $('to');
    const tipBlock = $('tip-block');
    const tipInput = $('tip');
    const customTip = $('custom-tip');
    const manualToggle = $('use-manual');
    const manualFields = $('manual-fields');
    const manualRate = $('manual-rate');
    const manualHint = $('manual-pair');
    const errorEl = $('form-error');
    const statusEl = $('rate-status');
    const rateError = $('rate-error');
    const rateActions = $('rate-actions');
    const retryBtn = $('retry-btn');
    const savedBtn = $('use-saved-btn');
    const outPrimaryLabel = $('out-primary-label');
    const outPrimary = $('out-primary');
    const outSecondaryWrap = $('out-secondary-wrap');
    const outSecondaryLabel = $('out-secondary-label');
    const outSecondary = $('out-secondary');
    const outBill = $('out-bill');
    const outBillRow = $('out-bill-row');
    const outTip = $('out-tip');
    const outTipRow = $('out-tip-row');
    const outRate = $('out-rate');
    const outInverse = $('out-inverse');
    const outSource = $('out-source');
    const submitBtn = $('submit-btn');

    let table = null;
    let saved = readCache();
    let seeded = false;

    function setInvalid(el, bad) {
      if (!el) return;
      if (bad) el.setAttribute('aria-invalid', 'true');
      else el.removeAttribute('aria-invalid');
    }

    function mode() {
      return document.getElementById('mode-tip').checked ? 'tip' : 'convert';
    }

    function selectedTip() {
      const picked = form.querySelector('input[name="tip-preset"]:checked');
      if (!picked || picked.value === 'custom') {
        const n = parseNum(tipInput.value);
        return n;
      }
      return parseNum(picked.value);
    }

    function fillSelect(select, codes, preferred) {
      const prev = preferred || select.value;
      select.replaceChildren();
      const pinned = codes.filter((c) => PINNED.includes(c));
      const rest = codes.filter((c) => !PINNED.includes(c));
      const byLabel = (a, b) => labelFor(a).localeCompare(labelFor(b));
      pinned.sort((a, b) => PINNED.indexOf(a) - PINNED.indexOf(b));
      rest.sort(byLabel);
      function group(label, list) {
        if (!list.length) return;
        const og = document.createElement('optgroup');
        og.label = label;
        list.forEach((code) => {
          const opt = document.createElement('option');
          opt.value = code;
          opt.textContent = labelFor(code);
          og.appendChild(opt);
        });
        select.appendChild(og);
      }
      group('Common', pinned);
      group('All currencies', rest);
      if (codes.includes(prev)) select.value = prev;
      else if (codes.includes('USD')) select.value = 'USD';
    }

    function applyTable(next, opts) {
      table = next;
      const codes = Object.keys(next.rates).sort();
      const params = new URLSearchParams(location.search);
      const fromPref = !seeded && params.get('from') ? params.get('from').toUpperCase() : (fromEl.value || 'EUR');
      const toPref = !seeded && params.get('to') ? params.get('to').toUpperCase() : (toEl.value || 'USD');
      seeded = true;
      fillSelect(fromEl, codes, fromPref);
      fillSelect(toEl, codes, toPref);
      statusEl.textContent = sourceSentence(next, fromEl.value, toEl.value);
      rateError.hidden = true;
      if (!opts || !opts.keepActions) rateActions.hidden = !next.cached;
      submitBtn.disabled = false;
      if (next.cached) savedBtn.hidden = false;
    }

    function showRateFailure(message) {
      table = null;
      submitBtn.disabled = !manualToggle.checked;
      statusEl.textContent = 'No live rate is loaded.';
      rateError.hidden = false;
      rateError.textContent = message;
      rateActions.hidden = false;
      savedBtn.hidden = !saved;
      if (!manualToggle.checked) clearOutputs();
    }

    async function loadRates() {
      statusEl.textContent = 'Loading rates…';
      rateError.hidden = true;
      retryBtn.disabled = true;
      try {
        let next;
        let fallbackNote = false;
        try {
          next = normalizeEr(await fetchJson(ER_URL));
        } catch (primaryErr) {
          next = normalizeFrankfurter(await fetchJson(FRANKFURTER_URL));
          next.fallback = true;
          fallbackNote = true;
        }
        next.cached = false;
        writeCache(next);
        saved = readCache();
        applyTable(next);
        if (fallbackNote) {
          rateError.hidden = false;
          rateError.textContent = 'ExchangeRate-API did not load. Showing Frankfurter rates instead. The line above names the date on the pair you picked.';
          rateActions.hidden = false;
        }
        calculate({ silent: true });
      } catch (e) {
        showRateFailure('Live rates did not load from ExchangeRate-API or Frankfurter. Check your connection and press Retry, use rates saved in this browser, or type a rate below. Nothing was converted with a guessed number.');
      } finally {
        retryBtn.disabled = false;
      }
    }

    function syncMode() {
      const tipping = mode() === 'tip';
      tipBlock.hidden = !tipping;
      const picked = form.querySelector('input[name="tip-preset"]:checked');
      customTip.hidden = !tipping || !picked || picked.value !== 'custom';
    }

    function syncManual() {
      manualFields.hidden = !manualToggle.checked;
      manualHint.textContent = '1 ' + (fromEl.value || '…') + ' equals this many ' + (toEl.value || '…') + '.';
      if (manualToggle.checked) submitBtn.disabled = false;
      else if (!table) submitBtn.disabled = true;
    }

    function readParams() {
      const params = new URLSearchParams(location.search);
      const amount = params.get('a');
      if (amount) amountEl.value = amount;
      const m = params.get('m');
      if (m === 'tip') document.getElementById('mode-tip').checked = true;
      if (m === 'convert') document.getElementById('mode-convert').checked = true;
      const t = params.get('t');
      if (t != null && t !== '') {
        const preset = form.querySelector('input[name="tip-preset"][value="' + t + '"]');
        if (preset) preset.checked = true;
        else {
          const custom = form.querySelector('input[name="tip-preset"][value="custom"]');
          if (custom) custom.checked = true;
          tipInput.value = t;
        }
      }
      syncMode();
    }

    function writeParams() {
      const params = new URLSearchParams();
      if (amountEl.value.trim()) params.set('a', amountEl.value.trim());
      params.set('from', fromEl.value);
      params.set('to', toEl.value);
      params.set('m', mode());
      if (mode() === 'tip') {
        const picked = form.querySelector('input[name="tip-preset"]:checked');
        if (picked && picked.value !== 'custom') params.set('t', picked.value);
        else if (tipInput.value.trim()) params.set('t', tipInput.value.trim());
      }
      const qs = params.toString();
      const next = qs ? location.pathname + '?' + qs : location.pathname;
      history.replaceState(null, '', next);
    }

    function clearOutputs() {
      outPrimary.textContent = '—';
      outSecondary.textContent = '—';
      outBill.textContent = '—';
      outTip.textContent = '—';
      outRate.textContent = '—';
      outInverse.textContent = '—';
      outSource.textContent = '—';
    }

    function calculate(opts) {
      const silent = opts && opts.silent;
      const errors = [];
      const amount = parseNum(amountEl.value);
      const amountBad = Number.isNaN(amount) || (amount !== null && (amount < 0 || amount > MAX_AMOUNT));
      if (amountBad) errors.push('Enter the amount as a number, like 48 or 48.50.');
      if (!silent && (amount === null || amount === 0) && amountEl.value.trim() === '') {
        errors.push('Enter the amount on the bill.');
      }
      setInvalid(amountEl, amountBad);

      const from = fromEl.value;
      const to = toEl.value;
      if (!from || !to) errors.push('Choose both currencies.');

      let tip = 0;
      if (mode() === 'tip') {
        tip = selectedTip();
        const tipBad = Number.isNaN(tip) || tip === null || tip < 0 || tip > 100;
        if (tipBad) errors.push('Tip percent should be a number from 0 to 100.');
        setInvalid(tipInput, tipBad && (!form.querySelector('input[name="tip-preset"]:checked') || form.querySelector('input[name="tip-preset"]:checked').value === 'custom'));
        if (tipBad) tip = 0;
      } else {
        setInvalid(tipInput, false);
      }

      let manual = null;
      if (manualToggle.checked) {
        manual = parseNum(manualRate.value);
        const manualBad = Number.isNaN(manual) || manual === null || manual <= 0 || manual > 1e9;
        if (manualBad) errors.push('Type how many units of the home currency equal 1 unit of the local currency.');
        setInvalid(manualRate, manualBad);
      } else {
        setInvalid(manualRate, false);
        if (!table) errors.push('Rates are not loaded yet.');
        else if (from !== to && (!table.rates[from] || !table.rates[to])) errors.push('That currency is not in the loaded table.');
      }

      if (errors.length && !(silent && amountEl.value.trim() === '')) {
        if (!silent) {
          errorEl.hidden = false;
          errorEl.textContent = errors[0];
        }
        if (errors.length) {
          if (!(silent && amount === null)) clearOutputs();
          return;
        }
      }
      if (amount === null) {
        if (!silent) {
          errorEl.hidden = false;
          errorEl.textContent = 'Enter the amount on the bill.';
        }
        return;
      }

      errorEl.hidden = true;
      const active = manualToggle.checked
        ? { manual: true, sourceName: 'Rate you typed', sourceUrl: '', asOf: '', rates: null }
        : table;

      const homeRaw = manualToggle.checked ? amount * manual : convert(amount, from, to, table.rates);
      if (!Number.isFinite(homeRaw)) {
        errorEl.hidden = false;
        errorEl.textContent = 'That pair could not be converted with the loaded table.';
        clearOutputs();
        return;
      }

      const billMinor = toMinor(homeRaw, to);
      const bill = fromMinor(billMinor, to);
      let tipMinor = 0;
      if (mode() === 'tip' && tip > 0) tipMinor = Math.round(billMinor * tip / 100);
      const tipMoney = fromMinor(tipMinor, to);
      const total = fromMinor(billMinor + tipMinor, to);

      const per = manualToggle.checked ? manual : unitsPerOne(from, to, table.rates);
      const inv = per ? 1 / per : NaN;

      if (mode() === 'tip') {
        outPrimaryLabel.textContent = 'Total in ' + to + ', with tip';
        outPrimary.textContent = formatMoney(total, to);
        outSecondaryWrap.hidden = false;
        outSecondaryLabel.textContent = 'Tip in ' + to;
        outSecondary.textContent = formatMoney(tipMoney, to);
        outBillRow.hidden = false;
        outTipRow.hidden = false;
        outBill.textContent = formatMoney(bill, to);
        outTip.textContent = formatMoney(tipMoney, to) + ' (' + String(tip) + '%)';
      } else {
        outPrimaryLabel.textContent = 'Converted amount';
        outPrimary.textContent = formatMoney(bill, to);
        outSecondaryWrap.hidden = true;
        outBillRow.hidden = true;
        outTipRow.hidden = true;
      }

      outRate.textContent = '1 ' + from + ' = ' + formatRate(per) + ' ' + to;
      outInverse.textContent = '1 ' + to + ' = ' + formatRate(inv) + ' ' + from;
      if (manualToggle.checked) {
        outSource.textContent = 'Rate you typed. Not a live quote.';
      } else {
        const link = active.sourceUrl
          ? active.sourceName + ' (' + active.sourceUrl.replace(/^https:\/\//, '') + ')'
          : active.sourceName;
        outSource.textContent = sourceSentence(active, from, to).replace(active.sourceName, link);
        statusEl.textContent = sourceSentence(active, from, to);
      }
      writeParams();
    }

    document.querySelectorAll('input[name="mode"]').forEach((el) => {
      el.addEventListener('change', () => { syncMode(); calculate({ silent: true }); });
    });
    form.querySelectorAll('input[name="tip-preset"]').forEach((el) => {
      el.addEventListener('change', () => { syncMode(); calculate({ silent: true }); });
    });
    amountEl.addEventListener('input', () => calculate({ silent: true }));
    tipInput.addEventListener('input', () => calculate({ silent: true }));
    manualRate.addEventListener('input', () => calculate({ silent: true }));
    fromEl.addEventListener('change', () => { syncManual(); calculate({ silent: true }); });
    toEl.addEventListener('change', () => { syncManual(); calculate({ silent: true }); });
    manualToggle.addEventListener('change', () => { syncManual(); calculate({ silent: true }); });
    $('swap-btn').addEventListener('click', () => {
      const a = fromEl.value;
      fromEl.value = toEl.value;
      toEl.value = a;
      if (manualToggle.checked) {
        const n = parseNum(manualRate.value);
        if (n && n > 0) manualRate.value = String(Math.round((1 / n) * 1e8) / 1e8);
      }
      syncManual();
      calculate({ silent: true });
    });
    retryBtn.addEventListener('click', loadRates);
    savedBtn.addEventListener('click', () => {
      if (!saved) return;
      saved.cached = true;
      applyTable(saved);
      rateError.hidden = false;
      rateError.textContent = 'These are saved rates, not a new download. Press Retry before you rely on them for a payment.';
      calculate({ silent: true });
    });
    $('reset-btn').addEventListener('click', () => {
      form.reset();
      document.getElementById('mode-convert').checked = true;
      const ten = form.querySelector('input[name="tip-preset"][value="10"]');
      if (ten) ten.checked = true;
      manualToggle.checked = false;
      errorEl.hidden = true;
      syncMode();
      syncManual();
      clearOutputs();
      outPrimaryLabel.textContent = 'Converted amount';
      outSecondaryWrap.hidden = true;
      outBillRow.hidden = true;
      outTipRow.hidden = true;
      if (table) {
        fillSelect(fromEl, Object.keys(table.rates), 'EUR');
        fillSelect(toEl, Object.keys(table.rates), 'USD');
      }
      history.replaceState(null, '', location.pathname);
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      calculate({ silent: false });
    });

    readParams();
    syncManual();
    clearOutputs();
    loadRates();
  }

  return {
    parseNum: parseNum,
    digitsFor: digitsFor,
    toMinor: toMinor,
    fromMinor: fromMinor,
    convert: convert,
    normalizeEr: normalizeEr,
    normalizeFrankfurter: normalizeFrankfurter,
    formatMoney: formatMoney,
    mount: mount
  };
});
