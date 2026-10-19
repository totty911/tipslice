/* TipSlice — AdSense Auto Ads + year stamp. Loaded on every page.
 * Auto Ads use the publisher client ID. Manual slot IDs are not set, and pages
 * do not reserve empty advertisement boxes.
 */
const ADSENSE_CLIENT_ID = 'ca-pub-5833914188606567';

(function () {
  'use strict';
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const client = (ADSENSE_CLIENT_ID || '').trim();
  if (!/^ca-pub-\d{10,20}$/.test(client)) return;
  if (document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]')) return;

  const s = document.createElement('script');
  s.async = true;
  s.crossOrigin = 'anonymous';
  s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(client);
  document.head.appendChild(s);
})();
