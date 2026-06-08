/* didiplay — self-contained UI effects (reveal, countup, carousel, toasts, rings,
   before/after slider, FAQ search, sticky ATC). No cart/localStorage dependency. */
(function () {
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- reveal on scroll ----
  var rev = $$('.reveal');
  if (rev.length) {
    var rio = new IntersectionObserver(function (es) {
      es.forEach(function (e, i) { if (e.isIntersecting) { setTimeout(function () { e.target.classList.add('in'); }, i * 60); rio.unobserve(e.target); } });
    }, { threshold: 0.08 });
    rev.forEach(function (el) { rio.observe(el); });
    // failsafe: never leave content invisible (e.g. if observer doesn't fire)
    setTimeout(function () { rev.forEach(function (el) { el.classList.add('in'); }); }, 1200);
    window.addEventListener('load', function () { rev.forEach(function (el) { el.classList.add('in'); }); });
  }

  // ---- count up ----
  $$('.countup').forEach(function (el) {
    var target = parseFloat(el.dataset.target);
    var dec = parseInt(el.dataset.decimals || '0', 10);
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        if (reduce) { el.textContent = dec ? target.toFixed(dec) : target.toLocaleString(); io.unobserve(el); return; }
        var t0 = performance.now(), dur = 1500;
        (function step(now) {
          var p = Math.min((now - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3), v = target * e;
          el.textContent = dec ? v.toFixed(dec) : Math.floor(v).toLocaleString();
          if (p < 1) requestAnimationFrame(step); else el.textContent = dec ? target.toFixed(dec) : target.toLocaleString();
        })(performance.now());
        io.unobserve(el);
      });
    }, { threshold: 0.4 });
    io.observe(el);
  });

  // ---- review carousel ----
  var carousel = document.getElementById('reviewCarousel');
  if (carousel) {
    var track = carousel.querySelector('.carousel-track');
    var reviews = carousel.querySelectorAll('.review');
    var dots = document.getElementById('reviewDots');
    var idx = 0, timer = null;
    if (dots) reviews.forEach(function (_, i) {
      var b = document.createElement('button');
      b.setAttribute('aria-label', 'Go to review ' + (i + 1));
      if (i === 0) b.classList.add('active');
      b.addEventListener('click', function () { go(i); restart(); });
      dots.appendChild(b);
    });
    function go(i) {
      idx = (i + reviews.length) % reviews.length;
      if (track) track.style.transform = 'translateX(-' + idx * 100 + '%)';
      if (dots) $$('button', dots).forEach(function (d, di) { d.classList.toggle('active', di === idx); });
    }
    function next() { go(idx + 1); } function prev() { go(idx - 1); }
    function start() { if (!reduce) timer = setInterval(next, 5000); } function stop() { clearInterval(timer); }
    function restart() { stop(); start(); }
    var nb = carousel.querySelector('.next'), pb = carousel.querySelector('.prev');
    if (nb) nb.addEventListener('click', function () { next(); restart(); });
    if (pb) pb.addEventListener('click', function () { prev(); restart(); });
    carousel.addEventListener('mouseenter', stop); carousel.addEventListener('mouseleave', start);
    var tx = 0;
    carousel.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    carousel.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 40) { dx < 0 ? next() : prev(); restart(); } });
    start();
  }

  // ---- progress rings ----
  $$('.ring').forEach(function (ring) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        var pct = parseInt(ring.dataset.pct, 10);
        var fg = ring.querySelector('.ring-fg'), pe = ring.querySelector('.ring-pct');
        if (fg) fg.style.strokeDashoffset = 314 - (314 * pct / 100);
        if (reduce) { if (pe) pe.textContent = pct + '%'; io.unobserve(ring); return; }
        var t0 = performance.now(), dur = 1500;
        (function step(now) {
          var p = Math.min((now - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
          if (pe) pe.textContent = Math.floor(pct * e) + '%';
          if (p < 1) requestAnimationFrame(step); else if (pe) pe.textContent = pct + '%';
        })(performance.now());
        io.unobserve(ring);
      });
    }, { threshold: 0.4 });
    io.observe(ring);
  });

  // ---- before / after slider ----
  var ba = document.getElementById('baCompare');
  if (ba) {
    var clip = document.getElementById('baClip'), handle = document.getElementById('baHandle'), drag = false;
    function setPos(x) {
      var r = ba.getBoundingClientRect(); var pct = Math.max(0, Math.min(100, ((x - r.left) / r.width) * 100));
      if (clip) clip.style.width = pct + '%'; if (handle) handle.style.left = pct + '%';
    }
    ba.addEventListener('mousedown', function (e) { drag = true; setPos(e.clientX); });
    window.addEventListener('mousemove', function (e) { if (drag) setPos(e.clientX); });
    window.addEventListener('mouseup', function () { drag = false; });
    ba.addEventListener('touchstart', function (e) { drag = true; setPos(e.touches[0].clientX); }, { passive: true });
    ba.addEventListener('touchmove', function (e) { if (drag) setPos(e.touches[0].clientX); }, { passive: true });
    ba.addEventListener('touchend', function () { drag = false; });
  }

  // ---- FAQ search ----
  var fs = document.getElementById('faqSearch');
  if (fs) {
    var items = $$('.faq-item'), empty = document.getElementById('faqEmpty');
    fs.addEventListener('input', function () {
      var q = fs.value.toLowerCase().trim(), shown = 0;
      items.forEach(function (it) { var m = !q || it.textContent.toLowerCase().indexOf(q) > -1; it.style.display = m ? '' : 'none'; if (m) shown++; });
      if (empty) empty.style.display = shown === 0 ? 'block' : 'none';
    });
  }

  // ---- order toasts ----
  var toast = document.getElementById('orderToast');
  if (toast) {
    var ORDERS = [['Olivia','Chicago'],['Liam','London'],['Sofia','Madrid'],['Akira','Tokyo'],['Noah','Toronto'],['Aiden','Sydney'],['Emma','Berlin'],['Mateo','Mexico City'],['Zoe','Amsterdam'],['Leo','Paris'],['Hannah','Stockholm'],['Min-jun','Seoul'],['Priya','Mumbai'],['Lucas','São Paulo']];
    var tt = null;
    function show() {
      var o = ORDERS[Math.floor(Math.random() * ORDERS.length)], mins = Math.floor(Math.random() * 12) + 1;
      var av = toast.querySelector('.av'); if (av) av.src = 'https://i.pravatar.cc/80?img=' + (Math.floor(Math.random() * 70) + 1);
      var b = toast.querySelector('.t-body'); if (b) b.innerHTML = '<strong>' + o[0] + ' from ' + o[1] + '</strong> just ordered the Drawing Robot 🎨<div class="t-time">' + mins + ' minute' + (mins > 1 ? 's' : '') + ' ago</div>';
      toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(function () { toast.classList.remove('show'); }, 5000);
    }
    setTimeout(function () { show(); setInterval(show, 17000); }, 6000);
  }

  // ---- sticky ATC visibility ----
  var sticky = document.getElementById('stickyAtc');
  var buy = document.getElementById('buySection');
  if (sticky && buy) {
    new IntersectionObserver(function (es) {
      es.forEach(function (en) { sticky.classList.toggle('show', !en.isIntersecting); });
    }, { threshold: 0, rootMargin: '0px 0px -100px 0px' }).observe(buy);
  }
})();
