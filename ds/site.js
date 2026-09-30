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

// Work page: previous/next buttons for the sideways project scroller
(function () {
  var row = document.querySelector('.hscroll');
  var btns = document.querySelectorAll('[data-hs]');
  if (!row || !btns.length) return;
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  btns.forEach(function (b) {
    b.addEventListener('click', function () {
      row.scrollBy({ left: Number(b.getAttribute('data-hs')) * row.clientWidth * 0.8, behavior: calm ? 'auto' : 'smooth' });
    });
  });
})();

// Contact page: turn the form into a ready-to-send email (no server needed)
(function () {
  var f = document.getElementById('brief');
  if (!f) return;
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = function (n) { return (f.elements[n] && f.elements[n].value || '').trim(); };
    var body = 'Name: ' + v('name') + '\nReply to: ' + v('email') + '\nInterested in: ' + v('topic') + '\n\n' + v('message');
    location.href = 'mailto:contact@envisionar.in?subject=' + encodeURIComponent('Project enquiry: ' + (v('topic') || 'Hello')) + '&body=' + encodeURIComponent(body);
  });
})();

// Mobile quick actions: contact menu (phone, email, social) and back-to-top
(function () {
  var fab = document.getElementById('fab');
  if (!fab) return;
  var btn = fab.querySelector('.fab-btn');
  var top = fab.querySelector('.fab-top');
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function set(open) { fab.classList.toggle('open', open); btn.setAttribute('aria-expanded', open); }
  btn.addEventListener('click', function (e) { e.stopPropagation(); set(!fab.classList.contains('open')); });
  document.addEventListener('click', function (e) { if (e.target === fab || !fab.contains(e.target)) set(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
  top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' }); });
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      top.classList.toggle('show', window.scrollY > window.innerHeight * 0.8);
      if (fab.classList.contains('open') && window.scrollY > 0) { /* keep open while scrolling */ }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
