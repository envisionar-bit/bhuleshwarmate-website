(function () {
  var doc = document;

  // Menu overlay
  var btn = doc.querySelector('.menu-btn');
  var overlay = doc.getElementById('menu');
  function setMenu(open) {
    overlay.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
    btn.textContent = open ? 'Close' : 'Menu';
    doc.body.style.overflow = open ? 'hidden' : '';
    if (open) overlay.querySelector('a').focus();
  }
  btn.addEventListener('click', function () { setMenu(!overlay.classList.contains('open')); });
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('open')) { setMenu(false); btn.focus(); }
  });
  overlay.addEventListener('click', function (e) {
    if (e.target.closest('a[href^="#"]')) setMenu(false);
  });

  // Reveal on scroll
  var items = doc.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  // Endless work strip (skipped for reduced motion; falls back to a scrollable row)
  var strip = doc.querySelector('.strip');
  var track = strip && strip.querySelector('.track');
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (track && !calm) {
    Array.prototype.slice.call(track.children).forEach(function (n) {
      var c = n.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      c.tabIndex = -1;
      track.appendChild(c);
    });
    strip.classList.add('is-anim');
    doc.documentElement.classList.add('is-anim');
  }
})();
