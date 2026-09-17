
/* =====================================================================
   CONFIG — the restaurant owner can edit everything here
   ===================================================================== */
const CONFIG = {
  // WhatsApp number in INTERNATIONAL format (no +, no spaces): 0814 375 1471
  whatsappNumber: '2348143751471',

  // Delivery fee in Naira — change this single number any time (set 0 for free delivery)
  deliveryFee: 1000,

  // Restaurant address (used for pickup messaging)
  address: 'Gajambe Plaza, Talwawa, Dutse, Jigawa State',
  addressShort: 'Gajambe Plaza, Talwawa · Dutse'
};

/* =====================================================================
   MENU — exactly as printed on the flyer (no invented prices)
   ===================================================================== */
const MENU = [
  {
    id:'lunch', name:'Lunch Special', emoji:'🍛',
    priceNote:'Starting from', price:2500, unit:'per plate',
    tagline:'Fresh · Tasty · Satisfying!',
    desc:'Delicious meals, perfect for your lunch break — served hot, with all the flavour of home.',
    meta:'🍽️ Dine-in · Takeaway · Delivery'
  },
  {
    id:'family', name:'Family Package', emoji:'🥘',
    priceNote:'Only', price:18000, unit:'serves 4–6 people',
    tagline:'Made for sharing!',
    desc:'One generous pack with everything your family needs for a proper feast.',
    badge:'Best Value!', badgeGold:true,
    serves:'Serves approximately 4–6 people',
    includes:['Jollof Rice / Fried Rice','Chicken / Beef','Coleslaw','Plantain','Drinks']
  },
  {
    id:'shawarma', name:'Shawarma Special', emoji:'🌯',
    priceNote:'Now only', price:3000, unit:'each',
    tagline:'Juicy · Fresh · Bigger Filling',
    desc:'Juicy chicken, fresh veggies and our special sauce — wrapped fresh with a bigger filling.',
    chips:['Juicy Chicken','Fresh Veggies','Special Sauce','Bigger Filling'],
    ribbon:'BEST SHAWARMA IN TOWN!'
  },
  {
    id:'dinner', name:'Dinner Special', emoji:'🍖',
    priceNote:'Meals from', price:2500, unit:'per plate',
    tagline:'End your day with good food!',
    desc:'Tasty evening meals with great portions — made to order, just the way you like it.',
    chips:['Tasty Meals','Great Portions','Made to Order','Convenient Delivery']
  }
];

/* ============ Helpers & state ============ */
const $ = id => document.getElementById(id);
const fmt = n => '₦' + n.toLocaleString('en-NG');
let cart = {};
try { cart = JSON.parse(localStorage.getItem('nf-cart')) || {}; } catch(e) { cart = {}; }
const saveCart = () => { try { localStorage.setItem('nf-cart', JSON.stringify(cart)); } catch(e){} };
const menuById = id => MENU.find(m => m.id === id);
const cartEntries = () => Object.entries(cart).map(([id,qty]) => ({...menuById(id), qty})).filter(e => e.id && e.qty > 0);
const foodTotal = () => cartEntries().reduce((s,e) => s + e.price * e.qty, 0);
const cartCount = () => cartEntries().reduce((s,e) => s + e.qty, 0);

function toast(msg, icon='🛍️'){
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  $('toastWrap').appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 320); }, 2400);
}

/* ============ Render menu cards ============ */
function renderMenu(){
  $('menuGrid').innerHTML = MENU.map((item, i) => `
    <article class="menu-card reveal" style="transition-delay:${i*80}ms">
      <div class="card-media">
        ${item.badge ? `<span class="badge ${item.badgeGold ? 'gold' : ''}">${item.badge}</span>` : ''}
        <span class="corner-num">${i + 1}</span>
        <div class="plate-sm"><span>${item.emoji}</span></div>
      </div>
      <div class="card-body">
        <p class="card-tagline">${item.tagline}</p>
        <h3>${item.name}</h3>
        <p class="card-desc">${item.desc}</p>
        ${item.serves ? `<span class="serves">👨‍👩‍👧‍👦 ${item.serves}</span>` : ''}
        ${item.includes ? `<ul class="includes">${item.includes.map(x => `<li>${x}</li>`).join('')}</ul>` : ''}
        ${item.chips ? `<div class="chips">${item.chips.map(c => `<span>${c}</span>`).join('')}</div>` : ''}
        ${item.meta ? `<p class="meta-line">${item.meta}</p>` : ''}
        ${item.ribbon ? `<div class="ribbon">⭐ ${item.ribbon} ⭐</div>` : ''}
      </div>
      <div class="card-foot">
        <div class="price-row">
          <div><span class="price-label">${item.priceNote}</span><span class="price">${fmt(item.price)}</span></div>
          <span class="price-unit">${item.unit || ''}</span>
        </div>
        <div class="controls">
          <div class="stepper">
            <button type="button" class="step-minus" aria-label="Decrease quantity of ${item.name}">−</button>
            <output class="card-qty" aria-live="polite">1</output>
            <button type="button" class="step-plus" aria-label="Increase quantity of ${item.name}">+</button>
          </div>
          <button type="button" class="add-btn" data-id="${item.id}">＋ Add to Order</button>
        </div>
      </div>
    </article>`).join('');
}

/* Menu card interactions (delegated) */
 $('menuGrid').addEventListener('click', e => {
  const plus = e.target.closest('.step-plus'), minus = e.target.closest('.step-minus'), add = e.target.closest('.add-btn');
  if (plus || minus){
    const out = e.target.closest('.stepper').querySelector('.card-qty');
    let q = parseInt(out.textContent, 10) + (plus ? 1 : -1);
    out.textContent = Math.min(99, Math.max(1, q));
  }
  if (add){
    const id = add.dataset.id;
    const qty = parseInt(add.closest('.card-foot').querySelector('.card-qty').textContent, 10);
    addToCart(id, qty);
    add.closest('.card-foot').querySelector('.card-qty').textContent = 1;
    const old = add.innerHTML;
    add.classList.add('added'); add.innerHTML = '✓ Added!';
    setTimeout(() => { add.classList.remove('added'); add.innerHTML = old; }, 1200);
  }
});

/* ============ Cart ============ */
function addToCart(id, qty){
  cart[id] = (cart[id] || 0) + qty;
  saveCart(); renderCart();
  toast(`${menuById(id).name} ×${qty} added to your order`);
}

function renderCart(){
  const entries = cartEntries(), count = cartCount(), food = foodTotal();

  // header badge
  const badge = $('cartCount');
  badge.hidden = count === 0;
  badge.textContent = count;
  badge.classList.remove('pop'); void badge.offsetWidth; badge.classList.add('pop');

  // drawer title
  $('cartTitleCount').textContent = count === 0 ? 'No items yet' : `${count} item${count > 1 ? 's' : ''}`;

  // items list
  $('cartItems').innerHTML = entries.length === 0
    ? `<div class="cart-empty"><span>🍽️</span><p>Your order is empty</p><p class="sub">Add something delicious from the menu.</p><button class="btn btn-green" id="browseBtn">Browse the Menu</button></div>`
    : entries.map(e => `
      <div class="cart-item">
        <div class="ci-thumb">${e.emoji}</div>
        <div>
          <p class="ci-name">${e.name}</p>
          <p class="ci-unit">${fmt(e.price)} each</p>
          <div class="stepper sm" data-id="${e.id}">
            <button class="step-minus" aria-label="Decrease ${e.name}">−</button>
            <output>${e.qty}</output>
            <button class="step-plus" aria-label="Increase ${e.name}">+</button>
          </div>
        </div>
        <div class="ci-right">
          <strong>${fmt(e.price * e.qty)}</strong>
          <button class="ci-remove" data-id="${e.id}" aria-label="Remove ${e.name}">✕ Remove</button>
        </div>
      </div>`).join('');

  $('cartFoodTotal').textContent = fmt(food);
  $('proceedBtn').disabled = entries.length === 0;

  // mobile floating bar
  $('mobileBarBtn').innerHTML = count > 0
    ? `🧺 View Order · ${count} item${count > 1 ? 's' : ''} · ${fmt(food)}`
    : '🍽️ ORDER NOW';

  updateDetailsTotals();
}

 $('cartItems').addEventListener('click', e => {
  if (e.target.closest('#browseBtn')){ closeDrawer(); document.getElementById('menu').scrollIntoView({behavior:'smooth'}); return; }
  const plus = e.target.closest('.step-plus'), minus = e.target.closest('.step-minus'), rem = e.target.closest('.ci-remove');
  if (plus || minus){
    const id = e.target.closest('.stepper').dataset.id;
    cart[id] = (cart[id] || 0) + (plus ? 1 : -1);
    if (cart[id] <= 0) delete cart[id];
    saveCart(); renderCart();
  }
  if (rem){
    const name = menuById(rem.dataset.id).name;
    delete cart[rem.dataset.id];
    saveCart(); renderCart();
    toast(`${name} removed from your order`, '🗑️');
  }
});

/* ============ Drawer / overlay / scroll lock ============ */
const drawer = $('cartDrawer'), modal = $('checkoutModal'), overlay = $('overlay');
const lock = on => document.body.classList.toggle('no-scroll', on);

function openDrawer(){ renderCart(); drawer.classList.add('open'); overlay.classList.add('show'); lock(true); $('closeCartBtn').focus(); }
function closeDrawer(unlock = true){ drawer.classList.remove('open'); if (unlock && modal.hidden){ overlay.classList.remove('show'); lock(false); } }
function openCheckout(){ modal.hidden = false; overlay.classList.add('show'); lock(true); showStep('details'); $('custName').focus(); }
function closeCheckout(){ modal.hidden = true; overlay.classList.remove('show'); lock(false); }

 $('cartOpenBtn').addEventListener('click', openDrawer);
 $('closeCartBtn').addEventListener('click', () => closeDrawer());
 $('proceedBtn').addEventListener('click', () => { closeDrawer(false); openCheckout(); });
 $('closeCheckoutBtn').addEventListener('click', closeCheckout);
 $('newOrderBtn').addEventListener('click', closeCheckout);
overlay.addEventListener('click', () => { if (!modal.hidden) closeCheckout(); else closeDrawer(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape'){ if (!modal.hidden) closeCheckout(); else if (drawer.classList.contains('open')) closeDrawer(); } });

 $('mobileBarBtn').addEventListener('click', () => {
  if (cartCount() > 0) openDrawer();
  else document.getElementById('menu').scrollIntoView({behavior:'smooth'});
});

/* ============ Checkout: details step ============ */
function getSelectedType(){
  const r = document.querySelector('input[name="orderType"]:checked');
  return r ? r.value : null;
}

function updateDetailsTotals(){
  const food = foodTotal(), type = getSelectedType();
  const fee = type === 'delivery' ? CONFIG.deliveryFee : type === 'pickup' ? 0 : null;
  $('tFood').textContent = fmt(food);
  $('tFee').textContent = fee === null ? '—' : fmt(fee);
  $('tGrand').textContent = fee === null ? fmt(food) : fmt(food + fee);
  $('feeTagDelivery').textContent = `+ ${fmt(CONFIG.deliveryFee)} fee`;
  const hint = $('typeHint');
  if (type === 'delivery') hint.innerHTML = `🚚 <b>Delivery selected</b> — a flat fee of <b>${fmt(CONFIG.deliveryFee)}</b> is added to your food total.`;
  else if (type === 'pickup') hint.innerHTML = `🏪 <b>Pickup selected</b> — <b>no delivery charge!</b> Collect your order at ${CONFIG.address}.`;
  else hint.innerHTML = '👆 Choose <b>Delivery</b> or <b>Pickup</b> above to see your full total.';
}

document.querySelectorAll('input[name="orderType"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const type = getSelectedType();
    $('typeCardDelivery').classList.toggle('selected', type === 'delivery');
    $('typeCardPickup').classList.toggle('selected', type === 'pickup');
    $('fAddress').hidden = type !== 'delivery';
    $('fType').classList.remove('error');
    updateDetailsTotals();
  });
});

function setError(fieldId, on){ $(fieldId).classList.toggle('error', on); }

 $('checkoutForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('custName').value.trim();
  const phone = $('custPhone').value.trim();
  const type = getSelectedType();
  const address = $('custAddress').value.trim();

  const phoneOk = /^(?:\+?234|0)[789]\d{9}$/.test(phone.replace(/[\s\-()+.]/g, ''));
  const nameOk = name.length >= 2;
  const addrOk = type !== 'delivery' || address.length >= 6;

  setError('fName', !nameOk);
  setError('fPhone', !phoneOk);
  setError('fAddress', !addrOk);
  $('fType').classList.toggle('error', !type);
  $('typeErr').classList.toggle('show', !type);

  if (!nameOk){ $('custName').focus(); return; }
  if (!phoneOk){ $('custPhone').focus(); return; }
  if (!type){ $('typeCardDelivery').scrollIntoView({behavior:'smooth', block:'center'}); return; }
  if (!addrOk){ $('custAddress').focus(); return; }

  renderReview();
  showStep('review');
});

 $('editDetailsBtn').addEventListener('click', () => showStep('details'));

/* ============ Checkout: review step ============ */
function renderReview(){
  const entries = cartEntries(), food = foodTotal(), type = getSelectedType();
  const fee = type === 'delivery' ? CONFIG.deliveryFee : 0;
  const grand = food + fee;
  const name = $('custName').value.trim();
  const phone = $('custPhone').value.trim();
  const address = $('custAddress').value.trim();
  const note = $('custNote').value.trim();

  $('reviewBody').innerHTML = `
    <p class="sum-head">NEW ORDER – NORTHERN FLAVOURS</p>
    ${entries.map(e => `<div class="sum-row"><span>${e.qty} × ${e.name}</span><strong>${fmt(e.price * e.qty)}</strong></div>`).join('')}
    <div class="sum-row total"><span>Food Total</span><strong>${fmt(food)}</strong></div>
    <div class="sum-type">
      ${type === 'delivery'
        ? `<p class="sum-type-head">🚚 Order Type: DELIVERY</p><p class="sum-addr">📍 ${address}</p>`
        : `<p class="sum-type-head">🏪 Order Type: PICKUP</p><p class="sum-addr">No delivery charge — collect at ${CONFIG.address}</p>`}
    </div>
    <div class="sum-row"><span>🚚 Delivery Fee</span><strong>${type === 'pickup' ? '₦0' : fmt(CONFIG.deliveryFee)}</strong></div>
    <div class="sum-row grand"><span>💵 Grand Total</span><strong>${fmt(grand)}</strong></div>
    <div class="sum-customer">
      <span>👤 Customer: <b>${name}</b></span>
      <span>📞 Phone: <b>${phone}</b></span>
      ${note ? `<span>📝 Note: ${note}</span>` : ''}
    </div>`;
}

/* ============ WhatsApp ============ */
function buildMessage(){
  const entries = cartEntries(), food = foodTotal(), type = getSelectedType();
  const fee = type === 'delivery' ? CONFIG.deliveryFee : 0;
  const grand = food + fee;
  const name = $('custName').value.trim();
  const phone = $('custPhone').value.trim();
  const address = $('custAddress').value.trim();
  const note = $('custNote').value.trim();

  const L = [];
  L.push('🛍️ NEW ORDER – NORTHERN FLAVOURS');
  L.push('');
  L.push('Order Items:');
  entries.forEach(e => L.push(`• ${e.qty} × ${e.name} — ${fmt(e.price * e.qty)}`));
  L.push('');
  L.push(`💰 Food Total: ${fmt(food)}`);
  if (type === 'delivery'){
    L.push('🚚 Order Type: DELIVERY');
    L.push(`📍 Address: ${address}`);
    L.push(`🚚 Delivery Fee: ${fmt(CONFIG.deliveryFee)}`);
  } else {
    L.push('🏪 Order Type: PICKUP');
    L.push('🚚 Delivery Fee: ₦0');
  }
  L.push(`💵 Grand Total: ${fmt(grand)}`);
  L.push('');
  L.push(`👤 Customer: ${name}`);
  L.push(`📞 Phone: ${phone}`);
  if (note) L.push(`📝 Note: ${note}`);
  L.push('');
  L.push(type === 'delivery' ? 'Please confirm my order. Thank you.' : 'Please prepare my order for pickup. Thank you.');
  return L.join('\n');
}

 $('confirmSendBtn').addEventListener('click', () => {
  const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(buildMessage())}`;
  $('waFallback').href = url;
  window.open(url, '_blank', 'noopener');          // opens WhatsApp with the order pre-filled — customer presses SEND
  cart = {}; saveCart(); renderCart();             // empty the tray once the order is handed to WhatsApp
  showStep('success');
  toast('Order sent to WhatsApp — press SEND there!', '✅');
});

/* ============ Steps & UI plumbing ============ */
function showStep(step){
  $('stepDetails').hidden = step !== 'details';
  $('stepReview').hidden = step !== 'review';
  $('stepSuccess').hidden = step !== 'success';
  $('modalTitle').textContent = step === 'details' ? 'Your Details' : step === 'review' ? 'Review Your Order' : 'Order Sent';
  ['dot1','dot2','dot3'].forEach((d, i) => $(d).classList.toggle('on',
    (step === 'details' && i === 0) || (step === 'review' && i === 1) || (step === 'success' && i === 2)));
  $('checkoutModal .modal-card').scrollTop = 0;
}

/* Hamburger */
const header = $('siteHeader');
 $('hamburgerBtn').addEventListener('click', () => {
  const open = header.classList.toggle('nav-open');
  $('hamburgerBtn').setAttribute('aria-expanded', open);
});
document.querySelectorAll('.main-nav a').forEach(a =>
  a.addEventListener('click', () => { header.classList.remove('nav-open'); $('hamburgerBtn').setAttribute('aria-expanded', 'false'); }));

/* Scroll spy */
const navLinks = [...document.querySelectorAll('.main-nav a')];
const spy = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting)
      navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
['home','menu','how','about','contact'].forEach(id => spy.observe(document.getElementById(id)));

/* Reveal on scroll */
const io = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting){
      en.target.classList.add('in');
      setTimeout(() => en.target.style.transitionDelay = '0ms', 900);
      io.unobserve(en.target);
    }
  });
}, { threshold: 0.12 });

/* Init */
renderMenu();
document.querySelectorAll('.reveal').forEach(el => io.observe(el));
document.querySelectorAll('.cfg-addr').forEach(el => el.textContent = CONFIG.address);
document.querySelectorAll('.cfg-addr-short').forEach(el => el.textContent = CONFIG.addressShort);
 $('year').textContent = new Date().getFullYear();
renderCart();