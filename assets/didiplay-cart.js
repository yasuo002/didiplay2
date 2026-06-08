/* didiplay — Shopify-wired cart drawer.
   Real Ajax Cart API. Handles add (with quantity), line qty change, remove,
   shipping-protection toggle, cross-sell, and the badge. */
(function () {
  var drawer  = document.getElementById('didiCartDrawer');
  var scrim   = document.getElementById('didiCartScrim');
  var itemsEl = document.getElementById('didiCartItems');
  var emptyEl = document.getElementById('didiCartEmpty');
  var subEl   = document.getElementById('didiCartSubtotal');
  var totEl   = document.getElementById('didiCartTotal');
  var badge   = document.getElementById('didiCartBadge');
  var protBox = document.getElementById('didiProtection');
  var protToggle = document.getElementById('didiProtToggle');
  var protVariant = protBox ? protBox.getAttribute('data-prot-variant') : '';

  function money(cents) {
    try {
      var c = (window.Shopify && Shopify.currency && Shopify.currency.active) || 'USD';
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: c }).format((cents || 0) / 100);
    } catch (e) { return '$' + ((cents || 0) / 100).toFixed(2); }
  }
  function openCart() {
    if (!drawer) { window.location.href = '/cart'; return; }
    drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false');
    if (scrim) scrim.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
  function closeCart() {
    if (!drawer) return;
    drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true');
    if (scrim) scrim.classList.remove('show');
    document.body.style.overflow = '';
  }
  window.didiOpenCart = openCart;
  window.theme = window.theme || {};
  window.theme.openCartDrawer = openCart;

  function render(cart) {
    if (!cart) return;
    if (badge) { badge.textContent = cart.item_count; badge.style.display = cart.item_count > 0 ? '' : 'none'; }
    if (subEl) subEl.textContent = money(cart.items_subtotal_price);
    if (totEl) totEl.textContent = money(cart.total_price);

    // reflect protection toggle state from cart contents
    if (protToggle && protVariant) {
      var hasProt = cart.items.some(function (it) { return String(it.variant_id) === String(protVariant); });
      protToggle.classList.toggle('on', hasProt);
      protToggle.setAttribute('aria-checked', hasProt ? 'true' : 'false');
    }

    if (!itemsEl) return;
    if (!cart.items.length) {
      itemsEl.innerHTML = '';
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }
    if (emptyEl) emptyEl.style.display = 'none';

    itemsEl.innerHTML = cart.items.map(function (it, i) {
      // hide the protection product from the visible item list (it's controlled by the toggle)
      if (protVariant && String(it.variant_id) === String(protVariant)) return '';
      var line = i + 1; // 1-based line index for /cart/change.js
      var img = it.image
        ? '<img src="' + it.image.replace(/(\.[^.?]+)(\?|$)/, '_120x$1$2') + '" alt="" width="64" height="64" style="border-radius:12px;object-fit:cover">'
        : '<div style="width:64px;height:64px;border-radius:12px;background:var(--pink-wash)"></div>';
      var variant = (it.variant_title && it.variant_title !== 'Default Title')
        ? '<div class="ci-variant">' + it.variant_title + '</div>' : '';
      return '<div class="cart-item" data-line="' + line + '">' +
          img +
          '<div class="ci-info"><div class="ci-name">' + it.product_title + '</div>' + variant +
            '<div class="ci-qty">' +
              '<button type="button" class="qd" data-line="' + line + '" data-qty="' + (it.quantity - 1) + '" aria-label="Decrease">&minus;</button>' +
              '<span>' + it.quantity + '</span>' +
              '<button type="button" class="qi" data-line="' + line + '" data-qty="' + (it.quantity + 1) + '" aria-label="Increase">+</button>' +
            '</div>' +
          '</div>' +
          '<div class="ci-right">' +
            '<button type="button" class="ci-remove" data-line="' + line + '" data-qty="0" aria-label="Remove">&times;</button>' +
            '<div class="ci-price">' + money(it.final_line_price) + '</div>' +
          '</div>' +
        '</div>';
    }).join('');
  }

  function getCart() {
    return fetch('/cart.js', { headers: { 'Accept': 'application/json' } }).then(function (r) { return r.json(); });
  }
  function refresh() { getCart().then(render).catch(function () {}); }
  window.didiRefreshCart = refresh;

  function addItems(items, openAfter) {
    return fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ items: items })
    }).then(function (r) { if (!r.ok) throw new Error('add'); return r.json(); })
      .then(function () { return getCart(); })
      .then(function (c) { render(c); if (openAfter) openCart(); })
      .catch(function () { window.location.href = '/cart'; });
  }
  window.didiAddToCart = function (id, qty) { return addItems([{ id: id, quantity: qty || 1 }], true); };

  function changeLine(line, qty) {
    return fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ line: line, quantity: qty })
    }).then(function (r) { if (!r.ok) throw new Error('change'); return r.json(); })
      .then(render).catch(function () {});
  }

  // delegated clicks
  document.addEventListener('click', function (e) {
    var add = e.target.closest('[data-didi-add]');
    if (add) { e.preventDefault(); addItems([{ id: add.getAttribute('data-didi-add'), quantity: parseInt(add.getAttribute('data-qty') || '1', 10) }], true); return; }

    var lineBtn = e.target.closest('[data-line][data-qty]');
    if (lineBtn && itemsEl && itemsEl.contains(lineBtn)) {
      e.preventDefault();
      changeLine(parseInt(lineBtn.getAttribute('data-line'), 10), parseInt(lineBtn.getAttribute('data-qty'), 10));
      return;
    }

    if (e.target.id === 'didiCartClose' || e.target.id === 'didiCartScrim' || e.target.id === 'didiContinue') {
      e.preventDefault(); closeCart(); return;
    }
  });

  // shipping protection toggle
  if (protToggle) {
    protToggle.addEventListener('click', function () {
      if (!protVariant) {
        // no product configured — just flip the visual switch (no charge)
        protToggle.classList.toggle('on');
        protToggle.setAttribute('aria-checked', protToggle.classList.contains('on') ? 'true' : 'false');
        return;
      }
      getCart().then(function (cart) {
        var existing = null, idx = 0;
        cart.items.forEach(function (it, i) { if (String(it.variant_id) === String(protVariant)) { existing = it; idx = i + 1; } });
        if (existing) { return changeLine(idx, 0); }      // remove
        return addItems([{ id: protVariant, quantity: 1 }], false); // add
      });
    });
  }

  // reservation countdown (cosmetic)
  var t = document.getElementById('didiResTimer');
  if (t) {
    var secs = 4 * 60 + 26;
    setInterval(function () {
      if (secs <= 0) secs = 4 * 60 + 26;
      t.textContent = String(Math.floor(secs / 60)).padStart(2, '0') + ':' + String(secs % 60).padStart(2, '0');
      secs--;
    }, 1000);
  }

  refresh();
})();
