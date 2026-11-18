/* Stuti Singh — portfolio interactions. Small and dependency-free:
   reveals on scroll, the hero screen settling flat as you scroll, a gentle parallax on the
   secondary screen, the redaction replay, click-to-zoom on real screens, and nav state. */
(function () {
  'use strict';
  var html = document.documentElement, $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  html.classList.add('js');
  requestAnimationFrame(function () { requestAnimationFrame(function () { html.classList.add('ready'); }); });

  /* reveal on scroll */
  var revealables = $$('.reveal, .flow');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); if (e.target.querySelector('[data-redact]')) runRedact(); } });
    }, { rootMargin: '0px 0px -12% 0px', threshold: .05 });
    revealables.forEach(function (el) { io.observe(el); });
  } else revealables.forEach(function (el) { el.classList.add('in'); });
  // safety net: nothing stays hidden if an observer never fires
  setTimeout(function () { revealables.forEach(function (el) { if (el.getBoundingClientRect().top < innerHeight) el.classList.add('in'); }); }, 2500);

  /* redaction: strike each real value, then swap in its stable token */
  var box = $('[data-redact]'), redactTimers = [], redactDone = false;
  function resetRedact() {
    redactTimers.forEach(clearTimeout); redactTimers = [];
    $$('[data-r]', box).forEach(function (s) { if (s.dataset.orig) s.textContent = s.dataset.orig; s.classList.remove('hit', 'done'); });
    box.classList.remove('verified');
  }
  function runRedact() {
    if (!box || redactDone) return; redactDone = true;
    var spans = $$('[data-r]', box);
    if (reduce) { spans.forEach(function (s) { s.dataset.orig = s.textContent; s.textContent = s.dataset.r; s.classList.add('done'); }); box.classList.add('verified'); return; }
    spans.forEach(function (s, i) {
      s.dataset.orig = s.dataset.orig || s.textContent;
      redactTimers.push(setTimeout(function () { s.classList.add('hit'); }, 500 + i * 520));
      redactTimers.push(setTimeout(function () { s.textContent = s.dataset.r; s.classList.add('done'); }, 880 + i * 520));
    });
    redactTimers.push(setTimeout(function () { box.classList.add('verified'); }, 1100 + spans.length * 520));
  }
  var replay = $('[data-replay]');
  if (replay) replay.addEventListener('click', function () { resetRedact(); redactDone = false; runRedact(); });
  if (reduce || !('IntersectionObserver' in window)) runRedact();

  /* scroll-linked motion: hero screen settles flat, floating screen drifts, nav state */
  var heroWin = $('.hero__shot .win'), floatShot = $('.shot--float'), top = $('.top');
  var navLinks = $$('.top__nav a[href^="#"]').map(function (a) { return { a: a, el: document.getElementById(a.getAttribute('href').slice(1)) }; });
  var mx = 0, my = 0, ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.scrollY, H = window.innerHeight;
    top.classList.toggle('solid', y > 30);
    if (heroWin && !reduce && window.innerWidth > 960) {
      var t = Math.min(1, y / (H * .7));
      heroWin.style.transform = 'rotateY(' + ((-14 + mx * 4) * (1 - t)) + 'deg) rotateX(' + ((7 - my * 3) * (1 - t)) + 'deg) rotateZ(' + (1 - t) + 'deg) scale(' + (1 + t * .04) + ')';
    }
    if (floatShot && !reduce && window.innerWidth > 960) {
      var r = floatShot.parentNode.getBoundingClientRect(), p = (r.top + r.height / 2 - H / 2) / H;
      floatShot.style.setProperty('--py', (p * 70).toFixed(1) + 'px');
    }
    var act = null; navLinks.forEach(function (n) { if (n.el && n.el.getBoundingClientRect().top < H * .4) act = n.a; });
    navLinks.forEach(function (n) { n.a.classList.toggle('on', n.a === act); });
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }
  window.addEventListener('scroll', req, { passive: true });
  window.addEventListener('resize', req);
  window.addEventListener('mousemove', function (e) { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; if (window.scrollY < innerHeight) req(); }, { passive: true });
  onScroll();

  /* click a real screen to see it full size */
  var zoom = $('.zoom'), zimg = zoom && $('img', zoom);
  $$('img[data-zoom]').forEach(function (img) {
    img.addEventListener('click', function () { zimg.src = img.currentSrc || img.src; zimg.alt = img.alt; zoom.hidden = false; $('button', zoom).focus(); });
  });
  if (zoom) {
    zoom.addEventListener('click', function () { zoom.hidden = true; });
    window.addEventListener('keydown', function (e) { if (e.key === 'Escape') zoom.hidden = true; });
  }

  /* copy email */
  $$('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = b.getAttribute('data-copy'), orig = b.textContent;
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { b.textContent = 'Copied ✓'; }, function () { b.textContent = t; });
      setTimeout(function () { b.textContent = orig; }, 1800);
    });
  });
})();
