/* TipSlice Travel Tipper. City data is local. Rates, when needed, load in the browser. */
(function (factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof document !== 'undefined') api.mount();
})(function () {
  'use strict';

  const MAX_KM = 40;
  const MAX_BILL = 1e9;

  function compute(input) {
    const digits = input.digits == null ? 2 : input.digits;
    const factor = 10 ** digits;
    const billMinor = Math.round((Number(input.bill) + Number.EPSILON) * factor);
    const taxMinor = Math.round(billMinor * Number(input.taxPercent) / 100);
    const tipBase = input.tipOnTax ? billMinor + taxMinor : billMinor;
    const tipMinor = Math.round(tipBase * Number(input.tipPercent) / 100);
    const totalMinor = billMinor + taxMinor + tipMinor;
    const people = input.people;
    const shareMinor = Math.ceil(totalMinor / people);
    return {
      digits: digits,
      billMinor: billMinor,
      taxMinor: taxMinor,
      tipMinor: tipMinor,
      totalMinor: totalMinor,
      shareMinor: shareMinor,
      extraMinor: shareMinor * people - totalMinor
    };
  }

  function haversineKm(aLat, aLng, bLat, bLng) {
    const r = 6371;
    const dLat = (bLat - aLat) * Math.PI / 180;
    const dLng = (bLng - aLng) * Math.PI / 180;
    const s1 = Math.sin(dLat / 2);
    const s2 = Math.sin(dLng / 2);
    const h = s1 * s1 + Math.cos(aLat * Math.PI / 180) * Math.cos(bLat * Math.PI / 180) * s2 * s2;
    return 2 * r * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  function nearestPlace(places, lat, lng) {
    let best = null;
    places.forEach((place) => {
      const km = haversineKm(lat, lng, place.lat, place.lng);
      if (!best || km < best.km) best = { place: place, km: km };
    });
    return best;
  }

  function tipForNorm(norm) {
    if (!norm || norm.setsTip === false || norm.percent == null) return null;
    return norm.percent;
  }

  function mount() {
    const form = document.getElementById('tipper-form');
    const data = window.TRAVEL_TIPPER_DATA;
    const fx = window.TipSliceFx;
    if (!form || !data || !fx) return;

    const $ = (id) => document.getElementById(id);
    const cityInput = $('city');
    const cityList = $('city-list');
    const billEl = $('bill');
    const peopleEl = $('people');
    const tipEl = $('tip');
    const taxEl = $('tax');
    const tipOnTaxEl = $('tip-on-tax');
    const homeEl = $('home');
    const errorEl = $('form-error');
    const placeNote = $('place-note');
    const normAlert = $('norm-alert');
    const locStatus = $('loc-status');
    const rateStatus = $('rate-status');
    const outBill = $('out-bill');
    const outTax = $('out-tax');
    const outTip = $('out-tip');
    const outTotal = $('out-total');
    const outShare = $('out-share');
    const outShareNote = $('out-share-note');
    const homeBlock = $('home-block');
    const outHomeTotal = $('out-home-total');
    const outHomeShare = $('out-home-share');
    const outRate = $('out-rate');
    const sourceBox = $('source-box');
    const shareLink = $('share-link');
    const copyStatus = $('copy-status');

    let active = null;
    let table = null;
    let listIndex = -1;
    const places = data.places.slice().sort((a, b) => a.city.localeCompare(b.city) || a.region.localeCompare(b.region));

    function digitsFor(currency) {
      try { return fx.digitsFor(currency); } catch (e) { return 2; }
    }
    function money(minor, currency, digits) {
      const amount = minor / (10 ** digits);
      try { return fx.formatMoney(amount, currency); } catch (e) { return amount.toFixed(digits) + ' ' + currency; }
    }
    function parseNum(raw) { return fx.parseNum(raw); }

    function label(place) {
      return place.city + ', ' + place.region;
    }

    function showList(matches) {
      cityList.replaceChildren();
      matches.slice(0, 8).forEach((place, i) => {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('role', 'option');
        btn.dataset.id = place.id;
        btn.textContent = label(place) + ' · ' + place.country;
        if (i === listIndex) btn.setAttribute('aria-selected', 'true');
        btn.addEventListener('click', () => choose(place, 'list'));
        li.appendChild(btn);
        cityList.appendChild(li);
      });
      const open = matches.length > 0;
      cityList.hidden = !open;
      cityInput.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function matchesFor(query) {
      const q = query.trim().toLowerCase();
      if (!q) return places.slice(0, 8);
      return places.filter((place) => {
        const hay = (place.city + ' ' + place.region + ' ' + place.country).toLowerCase();
        return hay.indexOf(q) !== -1;
      });
    }

    function setTip(percent) {
      tipEl.value = String(percent);
      document.querySelectorAll('[data-tip]').forEach((btn) => {
        btn.setAttribute('aria-pressed', String(Number(btn.dataset.tip) === Number(percent)));
      });
    }

    function choose(place) {
      active = place;
      cityInput.value = label(place);
      cityList.hidden = true;
      cityInput.setAttribute('aria-expanded', 'false');
      taxEl.value = String(place.taxPercent);
      const nextTip = place.norm ? tipForNorm(data.norms[place.norm]) : null;
      if (nextTip != null) setTip(nextTip);
      renderPlaceNote();
      calculate({ silent: true });
    }

    function appendSources(parent, sources) {
      sources.forEach((src, i) => {
        if (i) parent.append(document.createTextNode(' '));
        const a = document.createElement('a');
        a.href = src.url;
        a.textContent = src.name;
        parent.append(a);
        parent.append(document.createTextNode('.'));
      });
    }

    const COUNTRY_GUIDES = {
      JP: ['/guides/tipping-in-japan/', 'Japan guide'],
      IT: ['/guides/tipping-in-italy/', 'Italy guide'],
      MX: ['/guides/tipping-in-mexico/', 'Mexico guide'],
      KR: ['/guides/tipping-in-south-korea/', 'South Korea guide'],
      GB: ['/guides/tipping-in-the-uk/', 'UK guide'],
      ES: ['/guides/tipping-in-spain/', 'Spain guide'],
      FR: ['/guides/tipping-in-france/', 'France guide']
    };

    function countryGuideParagraph() {
      if (!active || !COUNTRY_GUIDES[active.norm]) return null;
      const guide = COUNTRY_GUIDES[active.norm];
      const p = document.createElement('p');
      p.className = 'norm-sources';
      const a = document.createElement('a');
      a.href = guide[0];
      a.textContent = guide[1];
      p.append(document.createTextNode('Longer note: '), a, document.createTextNode('.'));
      return p;
    }

    function renderPlaceNote() {
      normAlert.replaceChildren();
      normAlert.className = 'norm-alert';
      if (!active) {
        placeNote.textContent = 'Pick a city to fill the tax rate or the country tipping note.';
        normAlert.hidden = true;
        return;
      }
      const norm = active.norm ? data.norms[active.norm] : null;
      if (active.countryCode === 'US') {
        placeNote.textContent = active.city + ' fills the tax field from the source below. Your tip percent stays what you set.';
      } else {
        placeNote.textContent = active.city + ' uses ' + active.currency + '. The tax field stays at 0% until you type a rate that is not already in the menu price.';
      }
      if (!norm) {
        normAlert.hidden = true;
        return;
      }
      normAlert.hidden = false;
      if (norm.status === 'not-customary') normAlert.classList.add('is-warning');
      else if (norm.status === 'service-included') normAlert.classList.add('is-service');
      const title = document.createElement('p');
      title.className = 'norm-title';
      const strong = document.createElement('strong');
      strong.textContent = norm.label + '. ';
      title.appendChild(strong);
      title.append(document.createTextNode(norm.text));
      const sources = document.createElement('p');
      sources.className = 'norm-sources';
      sources.append(document.createTextNode('Source: '));
      appendSources(sources, norm.sources);
      normAlert.append(title, sources);
      const guide = countryGuideParagraph();
      if (guide) normAlert.append(guide);
    }

    function writeSources(math) {
      sourceBox.replaceChildren();
      if (!active) return;
      const bits = [];
      if (active.tax) {
        bits.push(sourceLine('Sales tax', active.tax.name, active.tax.url, active.tax.asOfLabel + '. ' + active.tax.note));
      }
      if (active.norm && data.norms[active.norm]) {
        const norm = data.norms[active.norm];
        const wrap = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = 'Tipping: ' + norm.label + '. ';
        wrap.appendChild(strong);
        wrap.append(document.createTextNode(norm.text + ' '));
        appendSources(wrap, norm.sources);
        bits.push(wrap);
        const guide = countryGuideParagraph();
        if (guide) bits.push(guide);
      }
      bits.forEach((node) => sourceBox.appendChild(node));
      if (math && math.homeText) {
        const p = document.createElement('p');
        p.textContent = math.homeText;
        sourceBox.appendChild(p);
      }
    }

    function sourceLine(labelText, name, url, detail) {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = labelText + ': ';
      p.appendChild(strong);
      const a = document.createElement('a');
      a.href = url;
      a.textContent = name;
      p.appendChild(a);
      p.append(document.createTextNode('. ' + detail));
      return p;
    }

    function queryString() {
      const params = new URLSearchParams();
      if (active) params.set('c', active.id);
      if (billEl.value.trim()) params.set('b', billEl.value.trim());
      params.set('p', peopleEl.value.trim() || '1');
      if (tipEl.value.trim()) params.set('t', tipEl.value.trim());
      if (taxEl.value.trim()) params.set('x', taxEl.value.trim());
      if (tipOnTaxEl.checked) params.set('o', '1');
      if (homeEl.value) params.set('h', homeEl.value);
      const qs = params.toString();
      return qs ? '?' + qs : '';
    }

    function syncUrl() {
      const qs = queryString();
      const href = 'https://tipslice.com/travel-tipper/' + qs;
      shareLink.href = href;
      shareLink.textContent = '/travel-tipper/' + qs;
      try {
        const next = location.pathname + qs;
        if (next !== location.pathname + location.search) history.replaceState(null, '', next);
      } catch (e) { /* ignore */ }
    }

    function fillHome(codes) {
      const prev = homeEl.value || 'USD';
      homeEl.replaceChildren();
      const pinned = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'MXN', 'CHF'];
      const list = pinned.filter((c) => codes.includes(c)).concat(codes.filter((c) => pinned.indexOf(c) === -1).sort());
      list.forEach((code) => {
        const opt = document.createElement('option');
        opt.value = code;
        opt.textContent = code;
        homeEl.appendChild(opt);
      });
      if (codes.includes(prev)) homeEl.value = prev;
    }

    function calculate(opts) {
      const silent = opts && opts.silent;
      const bill = parseNum(billEl.value);
      const tip = parseNum(tipEl.value);
      const tax = parseNum(taxEl.value);
      let people = parseNum(peopleEl.value);
      const errors = [];
      if (billEl.value.trim() && (bill === null || Number.isNaN(bill) || bill < 0 || bill > MAX_BILL)) errors.push('Enter the bill as a number.');
      if (Number.isNaN(tip) || tip === null || tip < 0 || tip > 100) errors.push('Tip percent should be from 0 to 100.');
      if (Number.isNaN(tax) || tax === null || tax < 0 || tax > 30) errors.push('Tax percent should be from 0 to 30.');
      if (Number.isNaN(people) || people === null || people < 1 || people > 50 || Math.round(people) !== people) errors.push('People should be a whole number from 1 to 50.');
      if (errors.length) {
        if (!silent) {
          errorEl.hidden = false;
          errorEl.textContent = errors[0];
        }
        return;
      }
      errorEl.hidden = true;
      if (bill === null) {
        outBill.textContent = '—';
        outTax.textContent = '—';
        outTip.textContent = '—';
        outTotal.textContent = '—';
        outShare.textContent = '—';
        outShareNote.textContent = '';
        homeBlock.hidden = true;
        syncUrl();
        writeSources(null);
        return;
      }
      const currency = active ? active.currency : 'USD';
      const digits = digitsFor(currency);
      const math = compute({
        bill: bill,
        taxPercent: tax,
        tipPercent: tip,
        tipOnTax: tipOnTaxEl.checked,
        people: people,
        digits: digits
      });
      outBill.textContent = money(math.billMinor, currency, digits);
      outTax.textContent = money(math.taxMinor, currency, digits);
      outTip.textContent = money(math.tipMinor, currency, digits);
      outTotal.textContent = money(math.totalMinor, currency, digits);
      outShare.textContent = money(math.shareMinor, currency, digits);
      if (people > 1 && math.extraMinor > 0) {
        const covered = money(math.shareMinor * people, currency, digits);
        outShareNote.textContent = 'Each share is rounded up, so ' + people + ' shares come to ' + covered + '.';
      } else {
        outShareNote.textContent = people > 1 ? 'Split ' + people + ' ways.' : '';
      }

      const home = homeEl.value || 'USD';
      let homeText = '';
      if (currency !== home) {
        if (!table) {
          homeBlock.hidden = false;
          outHomeTotal.textContent = '—';
          outHomeShare.textContent = '—';
          outRate.textContent = 'Home-currency total needs a rate table. It did not load.';
        } else if (!table.rates[currency] || !table.rates[home]) {
          homeBlock.hidden = false;
          outHomeTotal.textContent = '—';
          outHomeShare.textContent = '—';
          outRate.textContent = 'That currency is not in the loaded table.';
        } else {
          const totalLocal = math.totalMinor / (10 ** digits);
          const shareLocal = math.shareMinor / (10 ** digits);
          const homeDigits = digitsFor(home);
          const homeTotal = fx.convert(totalLocal, currency, home, table.rates);
          const homeShare = fx.convert(shareLocal, currency, home, table.rates);
          homeBlock.hidden = false;
          outHomeTotal.textContent = fx.formatMoney(homeTotal, home);
          outHomeShare.textContent = fx.formatMoney(homeShare, home);
          const per = fx.convert(1, currency, home, table.rates);
          outRate.textContent = '1 ' + currency + ' = ' + fx.formatRate(per) + ' ' + home + '. ' + fx.sourceSentence(table, currency, home);
          homeText = 'Home-currency line: ' + fx.sourceSentence(table, currency, home);
        }
      } else {
        homeBlock.hidden = true;
      }
      writeSources({ homeText: homeText });
      syncUrl();
    }

    function readParams() {
      const q = new URLSearchParams(location.search);
      const place = places.find((p) => p.id === q.get('c'));
      if (q.get('b')) billEl.value = q.get('b');
      if (q.get('p')) peopleEl.value = q.get('p');
      if (q.get('t')) setTip(q.get('t'));
      if (q.get('h')) homeEl.value = q.get('h').toUpperCase();
      if (place) {
        active = place;
        cityInput.value = label(place);
        taxEl.value = q.get('x') != null ? q.get('x') : String(place.taxPercent);
        if (q.get('t') == null) {
          const nextTip = tipForNorm(data.norms[place.norm]);
          if (nextTip != null) setTip(nextTip);
        }
        renderPlaceNote();
      } else if (q.get('x') != null) {
        taxEl.value = q.get('x');
      }
      tipOnTaxEl.checked = q.get('o') === '1';
    }

    cityInput.addEventListener('input', () => {
      listIndex = -1;
      active = null;
      showList(matchesFor(cityInput.value));
      renderPlaceNote();
    });
    cityInput.addEventListener('focus', () => showList(matchesFor(cityInput.value)));
    cityInput.addEventListener('keydown', (e) => {
      const buttons = cityList.querySelectorAll('button');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        listIndex = Math.min(buttons.length - 1, listIndex + 1);
        showList(matchesFor(cityInput.value));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        listIndex = Math.max(0, listIndex - 1);
        showList(matchesFor(cityInput.value));
      } else if (e.key === 'Enter' && listIndex >= 0 && buttons[listIndex]) {
        e.preventDefault();
        buttons[listIndex].click();
      } else if (e.key === 'Escape') {
        cityList.hidden = true;
        cityInput.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('click', (e) => {
      if (!cityInput.closest('.combo').contains(e.target)) {
        cityList.hidden = true;
        cityInput.setAttribute('aria-expanded', 'false');
      }
    });

    document.querySelectorAll('[data-tip]').forEach((btn) => {
      btn.addEventListener('click', () => {
        setTip(btn.dataset.tip);
        calculate({ silent: true });
      });
    });
    ['input', 'change'].forEach((evt) => {
      billEl.addEventListener(evt, () => calculate({ silent: true }));
      tipEl.addEventListener(evt, () => calculate({ silent: true }));
      taxEl.addEventListener(evt, () => calculate({ silent: true }));
      peopleEl.addEventListener(evt, () => calculate({ silent: true }));
    });
    tipOnTaxEl.addEventListener('change', () => calculate({ silent: true }));
    homeEl.addEventListener('change', () => calculate({ silent: true }));
    $('people-dec').addEventListener('click', () => {
      const n = parseNum(peopleEl.value) || 1;
      peopleEl.value = String(Math.max(1, n - 1));
      calculate({ silent: true });
    });
    $('people-inc').addEventListener('click', () => {
      const n = parseNum(peopleEl.value) || 1;
      peopleEl.value = String(Math.min(50, n + 1));
      calculate({ silent: true });
    });
    $('locate-btn').addEventListener('click', () => {
      if (!navigator.geolocation) {
        locStatus.textContent = 'This browser does not share a location. Type a city instead.';
        return;
      }
      locStatus.textContent = 'Asking the browser for your location…';
      navigator.geolocation.getCurrentPosition((pos) => {
        const hit = nearestPlace(places, pos.coords.latitude, pos.coords.longitude);
        if (!hit || hit.km > MAX_KM) {
          const far = hit ? ' The nearest listed city is ' + hit.place.city + ', about ' + Math.round(hit.km) + ' km away.' : '';
          locStatus.textContent = 'No listed city is within 40 km.' + far + ' Coordinates stayed in this page and were not uploaded.';
          return;
        }
        choose(hit.place);
        locStatus.textContent = 'Nearest listed city is ' + hit.place.city + ', about ' + Math.max(1, Math.round(hit.km)) + ' km from the browser reading. Coordinates were not uploaded.';
      }, () => {
        locStatus.textContent = 'Location permission was blocked or timed out. Type a city. Nothing was sent.';
      }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
    });
    $('copy-btn').addEventListener('click', async () => {
      const href = 'https://tipslice.com/travel-tipper/' + queryString();
      try {
        await navigator.clipboard.writeText(href);
        copyStatus.textContent = 'Link copied.';
      } catch (e) {
        copyStatus.textContent = 'Copy failed. Select the link and copy it yourself.';
      }
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      calculate({ silent: false });
    });

    setTip(18);
    taxEl.value = '0';
    const pendingHome = (new URLSearchParams(location.search).get('h') || '').toUpperCase();
    readParams();
    rateStatus.textContent = 'Loading exchange rates for bills outside your home currency…';
    fx.fetchRateTable().then((next) => {
      next.cached = false;
      table = next;
      fillHome(Object.keys(next.rates));
      if (pendingHome && Array.from(homeEl.options).some((opt) => opt.value === pendingHome)) homeEl.value = pendingHome;
      rateStatus.textContent = fx.sourceSentence(next, active ? active.currency : 'USD', homeEl.value || 'USD');
      calculate({ silent: true });
    }).catch(() => {
      table = null;
      fillHome(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY']);
      if (pendingHome && Array.from(homeEl.options).some((opt) => opt.value === pendingHome)) homeEl.value = pendingHome;
      rateStatus.textContent = 'Exchange rates did not load. Local totals still work. The home-currency line stays blank until you reload the page.';
      calculate({ silent: true });
    });
  }

  return { compute: compute, haversineKm: haversineKm, nearestPlace: nearestPlace, tipForNorm: tipForNorm, mount: mount };
});
