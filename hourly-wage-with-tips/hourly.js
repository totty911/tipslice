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
  function moneyToMinor(dollars) {
    if (dollars === "" || dollars == null) return null;
    const n = Number(dollars);
    if (!isFinite(n)) return null;
    return toMinor(n);
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
  function evaluate(input, row) {
    const math = compute(input);
    const cashMin = moneyToMinor(row && row.cash);
    const combined = moneyToMinor(row && row.combined);
    const below = cashMin != null && math.wageMinor < cashMin;
    let shortfall = null;
    if (row && row.method === "credit" && combined != null) {
      const required = Math.round(combined * math.hours);
      shortfall = Math.max(0, required - math.gross);
    } else if (row && row.method === "full" && cashMin != null) {
      const required = Math.round(cashMin * math.hours);
      shortfall = Math.max(0, required - math.basePay);
    }
    return { math: math, below: below, shortfall: shortfall };
  }

  function mount() {
    const form = document.getElementById('hourly-form');
    if (!form) return;
    const $ = (id) => document.getElementById(id);
    const wageEl = $('wage');
    const hoursEl = $('hours');
    const tipsEl = $('tips');
    const stateEl = $('state');
    const errorEl = $('form-error');
    const table = window.TIPPED_WAGES;
    if (stateEl && table) {
      table.rows.forEach(function (row) {
        const opt = document.createElement('option');
        opt.value = row.id;
        opt.textContent = row.name;
        stateEl.appendChild(opt);
      });
    }
    function selectedRow() {
      if (!table || !stateEl) return null;
      return table.rows.filter(function (row) { return row.id === stateEl.value; })[0] || table.rows[0];
    }

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
      const row = selectedRow();
      const result = evaluate({ wage: wage, hours: hours, tips: tips }, row);
      const math = result.math;
      $('out-base').textContent = formatUSD(math.basePay);
      $('out-tips').textContent = formatUSD(math.tips);
      $('out-gross').textContent = formatUSD(math.gross);
      $('out-rate').textContent = formatUSD(math.effective);
      const rowLine = $('out-row');
      const shortLine = $('out-short');
      if (rowLine) {
        rowLine.textContent = row.name + ': combined ' + (row.combined || '—') +
          ', tip credit ' + (row.credit || '—') + ', cash wage $' + (row.cash || '—') +
          (row.tips ? ', tipped employee ' + row.tips : '') + '.';
      }
      let note = 'Effective hourly rate is cash pay plus tips, divided by hours. Source: U.S. DOL table revised July 1, 2026, checked October 19, 2026.';
      if (row.method === 'note') note += ' ' + row.note + ' No shortfall is calculated for this row.';
      else if (row.method === 'full') note += ' This row requires the full cash minimum before tips. Tips do not fill a cash-wage gap.';
      else note += ' The weekly check compares cash wages plus tips with the combined minimum times hours, the workweek test in Fact Sheet #15.';
      if (result.below) note += ' The cash wage you entered is below the minimum cash wage printed for this row.';
      if (result.shortfall != null) note += ' Employer make-up on these hours: ' + formatUSD(result.shortfall) + '.';
      if (row.note && row.method !== 'note') note += ' ' + row.note;
      note += ' Overtime is not calculated here. Fact Sheet #15 says overtime is based on the full minimum wage, not the reduced cash wage.';
      if (shortLine) shortLine.textContent = result.shortfall == null ? "—" : formatUSD(result.shortfall);
      $('out-note').textContent = note;
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
      if (q.get('s') && stateEl) stateEl.value = q.get('s');
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

  return { compute: compute, evaluate: evaluate, formatUSD: formatUSD, mount: mount };
});
