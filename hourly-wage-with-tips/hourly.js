/* TipSlice effective hourly rate from a cash wage, hours, and tips. */
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
    const wageMinor = toMinor(input.wage);
    const hours = Number(input.hours);
    const tips = toMinor(input.tips);
    const basePay = Math.round(wageMinor * hours);
    const gross = basePay + tips;
    const effective = Math.round(gross / hours);
    return { wageMinor: wageMinor, hours: hours, tips: tips, basePay: basePay, gross: gross, effective: effective };
  }

  function mount() {
    const form = document.getElementById('hourly-form');
    if (!form) return;
    const $ = (id) => document.getElementById(id);
    const wageEl = $('wage');
    const hoursEl = $('hours');
    const tipsEl = $('tips');
    const errorEl = $('form-error');

    function num(el) {
      const s = String(el.value || '').trim().replace(/[$,\s]/g, '');
      if (s === '') return null;
      if (!/^\d*\.?\d*$/.test(s) || s === '.') return NaN;
      return parseFloat(s);
    }
    function queryString() {
      const params = new URLSearchParams();
      if (wageEl.value.trim()) params.set('w', wageEl.value.trim());
      if (hoursEl.value.trim()) params.set('h', hoursEl.value.trim());
      if (tipsEl.value.trim()) params.set('t', tipsEl.value.trim());
      const qs = params.toString();
      return qs ? '?' + qs : '';
    }
    function calculate(silent) {
      const wage = num(wageEl);
      const hours = num(hoursEl);
      const tips = num(tipsEl);
      const errors = [];
      if (wage === null || Number.isNaN(wage) || wage < 0 || wage > 10000) errors.push('Enter the cash wage per hour as a number.');
      if (hours === null || Number.isNaN(hours) || hours <= 0 || hours > 400) errors.push('Enter hours as a number greater than 0, up to 400.');
      if (tips === null || Number.isNaN(tips) || tips < 0 || tips > 1e9) errors.push('Enter tips as a number. Use 0 if there were none.');
      if (errors.length) {
        if (!silent) {
          errorEl.hidden = false;
          errorEl.textContent = errors[0];
        }
        return;
      }
      errorEl.hidden = true;
      const math = compute({ wage: wage, hours: hours, tips: tips });
      $('out-base').textContent = formatUSD(math.basePay);
      $('out-tips').textContent = formatUSD(math.tips);
      $('out-gross').textContent = formatUSD(math.gross);
      $('out-rate').textContent = formatUSD(math.effective);
      $('out-note').textContent = 'Effective hourly rate is cash pay plus tips, divided by the hours you entered. It does not decide whether an employer owes more under the Fair Labor Standards Act.';
      const href = 'https://tipslice.com/hourly-wage-with-tips/' + queryString();
      const link = $('share-link');
      link.href = href;
      link.textContent = '/hourly-wage-with-tips/' + queryString();
      try { history.replaceState(null, '', location.pathname + queryString()); } catch (e) { /* ignore */ }
    }
    function readParams() {
      const q = new URLSearchParams(location.search);
      if (q.get('w')) wageEl.value = q.get('w');
      if (q.get('h')) hoursEl.value = q.get('h');
      if (q.get('t')) tipsEl.value = q.get('t');
    }
    form.addEventListener('submit', (e) => { e.preventDefault(); calculate(false); });
    form.addEventListener('input', () => calculate(true));
    $('copy-btn').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText('https://tipslice.com/hourly-wage-with-tips/' + queryString());
        $('copy-status').textContent = 'Link copied.';
      } catch (e) {
        $('copy-status').textContent = 'Copy failed. Select the link and copy it yourself.';
      }
    });
    readParams();
    if (wageEl.value && hoursEl.value && tipsEl.value !== '') calculate(true);
  }

  return { compute: compute, formatUSD: formatUSD, mount: mount };
});
