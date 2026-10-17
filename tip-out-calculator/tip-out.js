/* TipSlice tip-out calculator. Percents are what you type, not a legal standard. */
(function (factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof document !== 'undefined') api.mount();
})(function () {
  'use strict';

  function toMinor(amount) {
    return Math.round((Number(amount) + Number.EPSILON) * 100);
  }

  function formatUSD(minor) {
    const sign = minor < 0 ? '-' : '';
    return sign + '$' + (Math.abs(minor) / 100).toFixed(2);
  }

  function compute(input) {
    const sales = toMinor(input.sales);
    const tips = toMinor(input.tips);
    const base = input.mode === 'tips' ? tips : sales;
    function share(pct) {
      return Math.round(base * Number(pct) / 100);
    }
    const busser = share(input.busser);
    const bartender = share(input.bartender);
    const host = share(input.host);
    const out = busser + bartender + host;
    return {
      sales: sales,
      tips: tips,
      base: base,
      busser: busser,
      bartender: bartender,
      host: host,
      out: out,
      net: tips - out
    };
  }

  function mount() {
    const form = document.getElementById('tipout-form');
    if (!form) return;
    const $ = (id) => document.getElementById(id);
    const salesEl = $('sales');
    const tipsEl = $('tips');
    const busserEl = $('busser');
    const bartenderEl = $('bartender');
    const hostEl = $('host');
    const errorEl = $('form-error');

    function num(el) {
      const s = String(el.value || '').trim().replace(/[$,%\s]/g, '');
      if (s === '') return null;
      if (!/^\d*\.?\d*$/.test(s) || s === '.') return NaN;
      return parseFloat(s);
    }
    function mode() {
      const picked = form.querySelector('input[name="mode"]:checked');
      return picked ? picked.value : 'sales';
    }
    function queryString() {
      const params = new URLSearchParams();
      if (salesEl.value.trim()) params.set('s', salesEl.value.trim());
      if (tipsEl.value.trim()) params.set('i', tipsEl.value.trim());
      params.set('m', mode());
      params.set('bu', busserEl.value.trim() || '0');
      params.set('ba', bartenderEl.value.trim() || '0');
      params.set('ho', hostEl.value.trim() || '0');
      const qs = params.toString();
      return qs ? '?' + qs : '';
    }
    function calculate(silent) {
      const sales = num(salesEl);
      const tips = num(tipsEl);
      const busser = num(busserEl);
      const bartender = num(bartenderEl);
      const host = num(hostEl);
      const errors = [];
      if (sales === null || Number.isNaN(sales) || sales < 0 || sales > 1e9) errors.push('Enter sales as a number.');
      if (tips === null || Number.isNaN(tips) || tips < 0 || tips > 1e9) errors.push('Enter the tips you collected as a number.');
      [busser, bartender, host].forEach((pct) => {
        if (pct === null || Number.isNaN(pct) || pct < 0 || pct > 100) errors.push('Each tip-out percent should be from 0 to 100.');
      });
      if (errors.length) {
        if (!silent) {
          errorEl.hidden = false;
          errorEl.textContent = errors[0];
        }
        return;
      }
      errorEl.hidden = true;
      const math = compute({
        sales: sales,
        tips: tips,
        mode: mode(),
        busser: busser,
        bartender: bartender,
        host: host
      });
      $('out-base-label').textContent = mode() === 'tips' ? 'Tip-out base (your tips)' : 'Tip-out base (sales)';
      $('out-base').textContent = formatUSD(math.base);
      $('out-busser').textContent = formatUSD(math.busser);
      $('out-bartender').textContent = formatUSD(math.bartender);
      $('out-host').textContent = formatUSD(math.host);
      $('out-total').textContent = formatUSD(math.out);
      $('out-tips').textContent = formatUSD(math.tips);
      $('out-net').textContent = formatUSD(math.net);
      $('out-note').textContent = math.net < 0
        ? 'The tip-out is larger than the tips you entered. Check the percents and whether they apply to sales or to tips.'
        : 'Net is the tips you entered minus the three shares. This is your worksheet, not a house rule.';
      const href = 'https://tipslice.com/tip-out-calculator/' + queryString();
      const link = $('share-link');
      link.href = href;
      link.textContent = '/tip-out-calculator/' + queryString();
      try { history.replaceState(null, '', location.pathname + queryString()); } catch (e) { /* ignore */ }
    }
    function readParams() {
      const q = new URLSearchParams(location.search);
      if (q.get('s')) salesEl.value = q.get('s');
      if (q.get('i')) tipsEl.value = q.get('i');
      if (q.get('bu')) busserEl.value = q.get('bu');
      if (q.get('ba')) bartenderEl.value = q.get('ba');
      if (q.get('ho')) hostEl.value = q.get('ho');
      if (q.get('m') === 'tips' || q.get('m') === 'sales') {
        const radio = form.querySelector('input[name="mode"][value="' + q.get('m') + '"]');
        if (radio) radio.checked = true;
      }
    }
    form.addEventListener('submit', (e) => { e.preventDefault(); calculate(false); });
    form.addEventListener('input', () => calculate(true));
    form.addEventListener('change', () => calculate(true));
    $('copy-btn').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText('https://tipslice.com/tip-out-calculator/' + queryString());
        $('copy-status').textContent = 'Link copied.';
      } catch (e) {
        $('copy-status').textContent = 'Copy failed. Select the link and copy it yourself.';
      }
    });
    readParams();
    if (salesEl.value || tipsEl.value) calculate(true);
  }

  return { compute: compute, formatUSD: formatUSD, mount: mount };
});
