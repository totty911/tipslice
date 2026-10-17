/* TipSlice gratuity checker. A required line is not labeled a tip. */
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
    const subtotal = toMinor(input.subtotal);
    const charge = input.chargeMode === 'percent'
      ? Math.round(subtotal * Number(input.charge) / 100)
      : toMinor(input.charge);
    const target = Math.round(subtotal * Number(input.target) / 100);
    return {
      subtotal: subtotal,
      charge: charge,
      target: target,
      gap: target - charge,
      required: !!input.required
    };
  }

  function mount() {
    const form = document.getElementById('grat-form');
    if (!form) return;
    const $ = (id) => document.getElementById(id);
    const subEl = $('subtotal');
    const chargeEl = $('charge');
    const targetEl = $('target');
    const requiredEl = $('required');
    const errorEl = $('form-error');

    function num(el) {
      const s = String(el.value || '').trim().replace(/[$,%\s]/g, '');
      if (s === '') return null;
      if (!/^\d*\.?\d*$/.test(s) || s === '.') return NaN;
      return parseFloat(s);
    }
    function chargeMode() {
      const picked = form.querySelector('input[name="unit"]:checked');
      return picked ? picked.value : 'percent';
    }
    function queryString() {
      const params = new URLSearchParams();
      if (subEl.value.trim()) params.set('b', subEl.value.trim());
      if (chargeEl.value.trim()) params.set('c', chargeEl.value.trim());
      params.set('u', chargeMode());
      if (requiredEl.checked) params.set('r', '1');
      if (targetEl.value.trim()) params.set('t', targetEl.value.trim());
      const qs = params.toString();
      return qs ? '?' + qs : '';
    }
    function calculate(silent) {
      const subtotal = num(subEl);
      const charge = num(chargeEl);
      const target = num(targetEl);
      const errors = [];
      if (subtotal === null || Number.isNaN(subtotal) || subtotal < 0 || subtotal > 1e9) errors.push('Enter the subtotal as a number.');
      if (charge === null || Number.isNaN(charge) || charge < 0 || charge > 1e9) errors.push('Enter the service-charge line as a number.');
      if (chargeMode() === 'percent' && charge > 100) errors.push('A percent line should be from 0 to 100.');
      if (target === null || Number.isNaN(target) || target < 0 || target > 100) errors.push('Target percent should be from 0 to 100.');
      if (errors.length) {
        if (!silent) {
          errorEl.hidden = false;
          errorEl.textContent = errors[0];
        }
        return;
      }
      errorEl.hidden = true;
      const math = compute({
        subtotal: subtotal,
        charge: charge,
        chargeMode: chargeMode(),
        target: target,
        required: requiredEl.checked
      });
      $('out-sub').textContent = formatUSD(math.subtotal);
      $('out-charge').textContent = formatUSD(math.charge);
      $('out-target').textContent = formatUSD(math.target);
      const status = $('out-status');
      const extra = $('out-extra');
      if (math.required) {
        status.textContent = 'A tip is not included. A required automatic gratuity or service charge is not a tip under the IRS pages cited below. Only an extra amount the guest chooses is a tip.';
      } else {
        status.textContent = 'The line is treated as a tip the guest already chose, because you marked it as voluntary. A suggested percent the guest can change or leave blank is a tip, not a service charge.';
      }
      if (math.gap > 0) {
        extra.textContent = formatUSD(math.gap) + ' more, on top of the line already on the bill, brings the extra up to the target percent of the subtotal.';
      } else if (math.gap < 0) {
        extra.textContent = 'The line is already ' + formatUSD(-math.gap) + ' above the target percent of the subtotal. Nothing more is needed to reach that target.';
      } else {
        extra.textContent = 'The line already matches the target percent of the subtotal.';
      }
      const href = 'https://tipslice.com/gratuity-included-checker/' + queryString();
      const link = $('share-link');
      link.href = href;
      link.textContent = '/gratuity-included-checker/' + queryString();
      try { history.replaceState(null, '', location.pathname + queryString()); } catch (e) { /* ignore */ }
    }
    function readParams() {
      const q = new URLSearchParams(location.search);
      if (q.get('b')) subEl.value = q.get('b');
      if (q.get('c')) chargeEl.value = q.get('c');
      if (q.get('t')) targetEl.value = q.get('t');
      if (q.get('u') === 'amount' || q.get('u') === 'percent') {
        const radio = form.querySelector('input[name="unit"][value="' + q.get('u') + '"]');
        if (radio) radio.checked = true;
      }
      requiredEl.checked = q.get('r') === '1';
    }
    form.addEventListener('submit', (e) => { e.preventDefault(); calculate(false); });
    form.addEventListener('input', () => calculate(true));
    form.addEventListener('change', () => calculate(true));
    $('copy-btn').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText('https://tipslice.com/gratuity-included-checker/' + queryString());
        $('copy-status').textContent = 'Link copied.';
      } catch (e) {
        $('copy-status').textContent = 'Copy failed. Select the link and copy it yourself.';
      }
    });
    readParams();
    if (subEl.value) calculate(true);
  }

  return { compute: compute, formatUSD: formatUSD, mount: mount };
});
