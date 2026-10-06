/* TipSlice — AdSense config + year stamp. Loaded on every page.
 * Publisher ID is set (Matt / Joe verified). Auto Ads load with the client ID alone.
 * Optionally add ad-unit slot IDs from AdSense (Ads > By ad unit) to fill the reserved zones.
 */
const ADSENSE_CLIENT_ID = 'ca-pub-5833914188606567';
const ADSENSE_SLOTS = {
  leaderboard: '', // display ad unit under the header (e.g. '1234567890')
  rectangle: ''    // display ad unit below the results
};

(function () {
  'use strict';
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  function initAds() {
    const client = (ADSENSE_CLIENT_ID || '').trim();
    if (!/^ca-pub-\d{10,20}$/.test(client)) return;

    const s = document.createElement('script');
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(client);
    document.head.appendChild(s);

    document.querySelectorAll('.ad-slot[data-ad-zone]').forEach((slotEl) => {
      const slotId = (ADSENSE_SLOTS[slotEl.dataset.adZone] || '').trim();
      if (!slotId) return;
      const ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.display = 'block';
      ins.setAttribute('data-ad-client', client);
      ins.setAttribute('data-ad-slot', slotId);
      ins.setAttribute('data-ad-format', slotEl.dataset.adZone === 'rectangle' ? 'rectangle' : 'horizontal');
      ins.setAttribute('data-full-width-responsive', 'true');
      slotEl.appendChild(ins);
      slotEl.classList.add('ad-live');
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    });
  }
  initAds();
})();
