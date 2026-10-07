/* TipSlice — share a split from the page URL. Nothing is posted.
 * Query keys: b bill, p people, t tip %, x tax % (present = tax on), o=1 tip on after-tax total.
 */
(function () {
  'use strict';

  var KEYS = ['b', 'p', 't', 'x', 'o'];
  var money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  function compact(n, decimals) {
    if (!isFinite(n)) return '';
    return Number(n).toFixed(decimals).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  }

  function readAmount(raw, max, decimals) {
    if (raw == null) return null;
    var s = String(raw).trim();
    if (!/^\d{1,12}(\.\d{1,6})?$/.test(s)) return null;
    var n = Number(s);
    if (!isFinite(n) || n < 0 || n > max) return null;
    var factor = Math.pow(10, decimals);
    return Math.round(n * factor) / factor;
  }

  function readPeople(raw, maxPeople) {
    if (raw == null) return null;
    var s = String(raw).trim();
    if (!/^\d{1,3}$/.test(s)) return null;
    var n = Number(s);
    if (!isFinite(n) || n < 1 || n > maxPeople || Math.floor(n) !== n) return null;
    return n;
  }

  function readState(maxBill, maxPeople) {
    var q = new URLSearchParams(location.search);
    var tax = readAmount(q.get('x'), 50, 3);
    return {
      bill: readAmount(q.get('b'), maxBill, 2),
      people: readPeople(q.get('p'), maxPeople),
      tip: readAmount(q.get('t'), 100, 2),
      tax: tax,
      tipOnTax: tax !== null && String(q.get('o') == null ? '' : q.get('o')).trim() === '1'
    };
  }

  function queryFromState(state) {
    if (!state || !state.include) return '';
    var q = new URLSearchParams();
    if (state.bill > 0) q.set('b', compact(state.bill, 2));
    q.set('p', String(state.people));
    q.set('t', compact(state.tipRate, 2));
    if (state.taxOn) {
      q.set('x', compact(state.tax || 0, 3));
      if (state.tipOnTax) q.set('o', '1');
    }
    var s = q.toString();
    return s ? '?' + s : '';
  }

  function syncUrl(state) {
    var params = queryFromState(state);
    var url;
    try {
      url = new URL(location.href);
    } catch (err) {
      return params;
    }
    KEYS.forEach(function (k) { url.searchParams.delete(k); });
    if (params) {
      new URLSearchParams(params.slice(1)).forEach(function (v, k) {
        url.searchParams.append(k, v);
      });
    }
    var next = url.pathname + url.search + url.hash;
    var current = location.pathname + location.search + location.hash;
    if (next !== current) {
      try { history.replaceState(null, '', next); } catch (err) { /* file:// and some embeds */ }
    }
    return params;
  }

  function publicUrl(pathname, state) {
    var path = pathname || '/';
    if (path === '/index.html') path = '/';
    var search = queryFromState(state);
    if (path === '/') return 'https://tipslice.com/' + search;
    return 'https://tipslice.com' + path + search;
  }

  function formatSummary(state, url) {
    var total = money.format(state.totalPPC / 100);
    var tip = money.format(state.tipPPC / 100);
    var baseCents = state.totalPPC - state.tipPPC;
    var msg = 'Our total per person is ' + total;
    if (state.tipPPC > 0 && baseCents >= 0) {
      var baseLabel = (state.taxOn && state.tax > 0) ? 'bill/tax' : 'bill';
      msg += ' (' + money.format(baseCents / 100) + ' ' + baseLabel + ' + ' + tip + ' tip)';
    }
    var extra = [];
    if (state.tipRate > 0) extra.push(compact(state.tipRate, 2) + '% tip');
    if (state.people > 1) extra.push(state.people + ' people');
    if (extra.length) msg += '. ' + extra.join(', ');
    return msg + '. Split with TipSlice: ' + url;
  }

  function fallbackCopy(text) {
    var active = document.activeElement;
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;padding:0;border:0;opacity:0;';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { ta.setSelectionRange(0, text.length); } catch (err) { /* older browsers */ }
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    document.body.removeChild(ta);
    if (active && active !== ta && active.focus) {
      try { active.focus(); } catch (err) { /* ignore */ }
    }
    return ok;
  }

  function copyText(text) {
    return new Promise(function (resolve) {
      var settled = false;
      function finish(ok) {
        if (settled) return;
        settled = true;
        resolve(!!ok);
      }
      var timer = setTimeout(function () { finish(fallbackCopy(text)); }, 350);
      var clip = null;
      try {
        if (navigator.clipboard && window.isSecureContext && navigator.clipboard.writeText) {
          clip = navigator.clipboard.writeText(text);
        }
      } catch (err) {
        clip = Promise.reject(err);
      }
      if (!clip) {
        clearTimeout(timer);
        finish(fallbackCopy(text));
        return;
      }
      Promise.resolve(clip).then(function () {
        clearTimeout(timer);
        finish(true);
      }, function () {
        clearTimeout(timer);
        finish(fallbackCopy(text));
      });
    });
  }

  function wire(opts) {
    var copyBtn = opts.copyButton;
    var shareBtn = opts.shareButton;
    var statusEl = opts.statusEl;
    var label = copyBtn ? copyBtn.textContent : 'Copy split summary';
    var timer = 0;

    function clearFeedback() {
      if (timer) { clearTimeout(timer); timer = 0; }
      if (copyBtn) copyBtn.textContent = label;
      if (!statusEl) return;
      statusEl.textContent = '';
      statusEl.classList.remove('is-error');
    }

    function showStatus(message, isError) {
      if (!statusEl) return;
      statusEl.textContent = message;
      statusEl.classList.toggle('is-error', !!isError);
    }

    function showCopied(ok, text) {
      if (timer) { clearTimeout(timer); timer = 0; }
      if (ok) {
        if (copyBtn) copyBtn.textContent = 'Copied';
        showStatus('Copied split summary.', false);
        timer = setTimeout(clearFeedback, 2500);
      } else {
        if (copyBtn) copyBtn.textContent = label;
        showStatus('Could not copy automatically. Select this summary: ' + text, true);
      }
    }

    function payloadOrExplain() {
      var payload = opts.getPayload();
      if (!payload || payload.error || !payload.text || !payload.url) {
        showStatus((payload && payload.error) || 'Enter a bill amount first.', true);
        return null;
      }
      return payload;
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var payload = payloadOrExplain();
        if (!payload) return;
        // Confirm in this turn so a clipboard promise that never settles
        // still changes the button. Revert only if the copy actually fails.
        showCopied(true, payload.text);
        var pending;
        try { pending = copyText(payload.text); }
        catch (err) { pending = Promise.resolve(fallbackCopy(payload.text)); }
        Promise.resolve(pending).then(function (ok) {
          if (!ok) showCopied(false, payload.text);
        }, function () {
          showCopied(false, payload.text);
        });
      });
    }

    if (shareBtn && typeof navigator.share === 'function') {
      shareBtn.hidden = false;
      shareBtn.addEventListener('click', function () {
        var payload = payloadOrExplain();
        if (!payload) return;
        var data = { title: 'TipSlice split', text: payload.text, url: payload.url };
        if (typeof navigator.canShare === 'function' && !navigator.canShare(data)) {
          copyText(payload.text).then(function (ok) { showCopied(ok, payload.text); });
          return;
        }
        navigator.share(data).then(function () {
          if (timer) { clearTimeout(timer); timer = 0; }
          showStatus('Shared.', false);
          timer = setTimeout(clearFeedback, 2500);
        }, function (err) {
          if (err && err.name === 'AbortError') return;
          copyText(payload.text).then(function (ok) { showCopied(ok, payload.text); });
        });
      });
    }

    return { clearFeedback: clearFeedback };
  }

  window.TipSliceShare = {
    compact: compact,
    readState: readState,
    queryFromState: queryFromState,
    syncUrl: syncUrl,
    publicUrl: publicUrl,
    formatSummary: formatSummary,
    copyText: copyText,
    wire: wire
  };
})();
