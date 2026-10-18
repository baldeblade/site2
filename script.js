const CART_KEY = "cheerend-cart";
const FAV_KEY = "cheerend-fav";
const THEME_KEY = "cheerend-theme";
const PROMO_KEY = "cheerend-promo";

const FREE_SHIPPING_FROM = 5000;
const PROMO_CODES = { CHEER10: 10 };
const CATEGORY_NAMES = { top: "Верх", bottom: "Низ", outer: "Пальто", acc: "Аксессуары" };
const HEART_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5l-1.4-1.3C5.4 14.5 2 11.4 2 7.7 2 4.6 4.4 2.5 7.3 2.5c1.7 0 3.4.8 4.7 2.1 1.3-1.3 3-2.1 4.7-2.1 2.9 0 5.3 2.1 5.3 5.2 0 3.7-3.4 6.8-8.6 11.5L12 20.5z"/></svg>';

const $ = (selector) => document.querySelector(selector);

const header = $(".header");
const cartEl = $("#cart");
const menuEl = $("#menu");
const overlay = $("[data-overlay]");
const listEl = $("[data-cart-list]");
const emptyEl = $("[data-cart-empty]");
const footEl = $("[data-cart-foot]");
const doneEl = $("[data-cart-done]");
const totalEl = $("[data-cart-total]");
const countEl = $("[data-cart-count]");
const discountRow = $("[data-discount-row]");
const discountEl = $("[data-cart-discount]");
const shipText = $("[data-ship-text]");
const shipBar = $("[data-ship-bar]");
const promoForm = $("[data-promo]");
const promoMsg = $("[data-promo-msg]");
const favCount = $("[data-fav-count]");
const toastEl = $("[data-toast]");
const menuToggle = $(".menu-toggle");
const metaTheme = $('meta[name="theme-color"]');

const grid = $(".grid");
const cards = [...document.querySelectorAll(".card")];
const catalogEmpty = $("[data-catalog-empty]");
const searchInput = $("[data-search]");
const sortSelect = $("[data-sort]");

const qv = $("[data-qv]");
const qvImg = $("[data-qv-img]");
const qvName = $("[data-qv-name]");
const qvCat = $("[data-qv-cat]");
const qvPrice = $("[data-qv-price]");
const qvNote = $("[data-qv-note]");
const qvSizes = $("[data-qv-sizes]");
const qvFav = $("[data-qv-fav]");

let cart = load(CART_KEY, []);
let favs = load(FAV_KEY, []);
let promo = localStorage.getItem(PROMO_KEY) || "";
let currentFilter = "all";
let query = "";
let sortMode = "default";
let quickCard = null;

function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function store(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function rub(value) {
  return value.toLocaleString("ru-RU") + " ₽";
}

/* ---------- Корзина ---------- */

function render() {
  listEl.innerHTML = "";

  cart.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "cart-item";
    li.innerHTML = `
      <img src="${item.img}" alt="">
      <div>
        <p class="cart-item__name"></p>
        <p class="cart-item__meta">Размер ${item.size}</p>
        <div class="qty">
          <button type="button" data-dec="${index}" aria-label="Уменьшить">−</button>
          <span>${item.qty}</span>
          <button type="button" data-inc="${index}" aria-label="Увеличить">+</button>
        </div>
      </div>
      <div class="cart-item__side">
        <span>${rub(item.price * item.qty)}</span>
        <button type="button" class="remove" data-remove="${index}">Удалить</button>
      </div>
    `;
    li.querySelector(".cart-item__name").textContent = item.name;
    listEl.appendChild(li);
  });

  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.qty * item.price, 0);
  const percent = PROMO_CODES[promo] || 0;
  const discount = Math.round((subtotal * percent) / 100);

  countEl.textContent = count;
  totalEl.textContent = rub(subtotal - discount);
  discountRow.hidden = discount === 0;
  discountEl.textContent = "− " + rub(discount);

  const left = FREE_SHIPPING_FROM - subtotal;
  shipText.textContent =
    left > 0 ? `До бесплатной доставки ещё ${rub(left)}` : "Доставка будет бесплатной";
  shipBar.style.width = Math.min(subtotal / FREE_SHIPPING_FROM, 1) * 100 + "%";

  emptyEl.hidden = cart.length > 0;
  footEl.hidden = cart.length === 0;
}

function addToCart(card) {
  const size = card.querySelector(".size").value;
  const id = card.dataset.id;
  const existing = cart.find((item) => item.id === id && item.size === size);

  if (existing) {
    existing.qty = Math.min(existing.qty + 1, 10);
  } else {
    cart.push({
      id,
      size,
      name: card.dataset.name,
      price: Number(card.dataset.price),
      img: card.dataset.img,
      qty: 1,
    });
  }

  store(CART_KEY, cart);
  render();
  doneEl.hidden = true;

  countEl.classList.remove("bump");
  void countEl.offsetWidth;
  countEl.classList.add("bump");

  const btn = card.querySelector(".add");
  btn.classList.add("added");
  btn.textContent = "Добавлено";
  setTimeout(() => {
    btn.classList.remove("added");
    btn.textContent = "В корзину";
  }, 1400);

  showToast(`${card.dataset.name}, ${size} — в корзине`);
}

let toastTimer;
function showToast(text) {
  toastEl.textContent = text;
  toastEl.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 2200);
}

/* ---------- Панели ---------- */

function openPanel(panel) {
  closePanels();
  panel.classList.add("is-open");
  panel.setAttribute("aria-hidden", "false");
  if (panel === cartEl) overlay.hidden = false;
  if (panel === menuEl) menuToggle.setAttribute("aria-expanded", "true");
  document.body.classList.add("locked");
}

function closePanels() {
  [cartEl, menuEl].forEach((panel) => {
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
  });
  overlay.hidden = true;
  menuToggle.setAttribute("aria-expanded", "false");
  document.body.classList.remove("locked");
}

/* ---------- Каталог: фильтр, поиск, сортировка ---------- */

function updateCatalog() {
  const text = query.trim().toLowerCase();
  let shown = 0;

  document.querySelectorAll(".chip").forEach((chip) => {
    chip.classList.toggle("is-active", chip.dataset.filter === currentFilter);
  });

  cards.forEach((card) => {
    const inCategory =
      currentFilter === "all" ||
      (currentFilter === "fav"
        ? favs.includes(card.dataset.id)
        : card.dataset.cat === currentFilter);
    const haystack = (card.dataset.name + " " + card.querySelector(".card__note").textContent).toLowerCase();
    const visible = inCategory && (!text || haystack.includes(text));
    card.hidden = !visible;
    if (visible) shown += 1;
  });

  const sorted = [...cards];
  if (sortMode === "asc") sorted.sort((a, b) => a.dataset.price - b.dataset.price);
  if (sortMode === "desc") sorted.sort((a, b) => b.dataset.price - a.dataset.price);
  sorted.forEach((card) => grid.appendChild(card));

  catalogEmpty.hidden = shown > 0;
  catalogEmpty.textContent =
    currentFilter === "fav" && favs.length === 0
      ? "В избранном пока пусто. Нажмите на сердечко у вещи, которая понравилась."
      : "Ничего не нашли. Попробуйте другое слово.";
}

function applyFilter(value) {
  currentFilter = value;
  updateCatalog();
}

/* ---------- Избранное ---------- */

function renderFavs() {
  favCount.textContent = favs.length;
  favCount.hidden = favs.length === 0;
  document.querySelectorAll("[data-fav]").forEach((btn) => {
    const isOn = favs.includes(btn.dataset.fav);
    btn.classList.toggle("is-on", isOn);
    btn.setAttribute("aria-pressed", String(isOn));
  });
  if (currentFilter === "fav") updateCatalog();
}

function toggleFav(id) {
  const card = cards.find((item) => item.dataset.id === id);
  if (favs.includes(id)) {
    favs = favs.filter((favId) => favId !== id);
    showToast("Убрано из избранного");
  } else {
    favs.push(id);
    showToast(`${card.dataset.name} — в избранном`);
  }
  store(FAV_KEY, favs);
  renderFavs();
}

/* ---------- Быстрый просмотр ---------- */

function openQuickView(card) {
  quickCard = card;
  const select = card.querySelector(".size");

  qvImg.src = card.dataset.img;
  qvImg.alt = card.querySelector(".card__img img").alt;
  qvName.textContent = card.dataset.name;
  qvCat.textContent = CATEGORY_NAMES[card.dataset.cat] || "";
  qvPrice.textContent = rub(Number(card.dataset.price));
  qvNote.textContent = card.querySelector(".card__note").textContent;
  qvFav.dataset.fav = card.dataset.id;

  qvSizes.querySelectorAll(".size-pill").forEach((pill) => pill.remove());
  [...select.options].forEach((option) => {
    const pill = document.createElement("label");
    pill.className = "size-pill";
    pill.innerHTML = `<input type="radio" name="qv-size"><span></span>`;
    const input = pill.querySelector("input");
    input.value = option.value;
    input.checked = option.value === select.value;
    pill.querySelector("span").textContent = option.value;
    qvSizes.appendChild(pill);
  });

  renderFavs();
  qv.showModal();
  document.body.classList.add("locked");
}

$("[data-qv-add]").addEventListener("click", () => {
  const checked = qvSizes.querySelector("input:checked");
  if (checked) quickCard.querySelector(".size").value = checked.value;
  addToCart(quickCard);
  qv.close();
});

qv.addEventListener("click", (event) => {
  if (event.target === qv || event.target.closest("[data-qv-close]")) qv.close();
});

qv.addEventListener("close", () => document.body.classList.remove("locked"));

/* ---------- Тема ---------- */

function syncThemeColor() {
  const isDark = document.documentElement.dataset.theme === "dark";
  metaTheme.setAttribute("content", isDark ? "#151816" : "#f2eee8");
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem(THEME_KEY, next);
  syncThemeColor();
}

/* ---------- Клики ---------- */

document.addEventListener("click", (event) => {
  const target = event.target;

  const addBtn = target.closest(".add");
  if (addBtn) addToCart(addBtn.closest(".card"));

  const favBtn = target.closest("[data-fav]");
  if (favBtn && favBtn.dataset.fav) toggleFav(favBtn.dataset.fav);

  const quickBtn = target.closest("[data-qv-open]");
  if (quickBtn) openQuickView(quickBtn.closest(".card"));

  if (target.closest("[data-fav-open]")) {
    applyFilter("fav");
    document.getElementById("catalog").scrollIntoView({ behavior: "smooth" });
  }

  if (target.closest("[data-theme-toggle]")) toggleTheme();

  if (target.closest(".cart-btn")) openPanel(cartEl);
  if (target.closest(".menu-toggle")) openPanel(menuEl);
  if (target.closest("[data-close]") || target === overlay) closePanels();

  const chip = target.closest("[data-filter]");
  if (chip) applyFilter(chip.dataset.filter);

  const filterLink = target.closest("[data-filter-link]");
  if (filterLink) {
    applyFilter(filterLink.dataset.filterLink);
    closePanels();
  }

  if (target.closest(".menu__foot a")) closePanels();

  const { inc, dec, remove } = target.dataset;
  if (inc !== undefined) {
    cart[inc].qty = Math.min(cart[inc].qty + 1, 10);
  }
  if (dec !== undefined) {
    cart[dec].qty -= 1;
    if (cart[dec].qty <= 0) cart.splice(dec, 1);
  }
  if (remove !== undefined) {
    cart.splice(remove, 1);
  }
  if (inc !== undefined || dec !== undefined || remove !== undefined) {
    store(CART_KEY, cart);
    render();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closePanels();
});

searchInput.addEventListener("input", () => {
  query = searchInput.value;
  updateCatalog();
});

sortSelect.addEventListener("change", () => {
  sortMode = sortSelect.value;
  updateCatalog();
});

window.addEventListener(
  "scroll",
  () => header.classList.toggle("is-scrolled", window.scrollY > 8),
  { passive: true }
);

/* ---------- Формы ---------- */

promoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const code = promoForm.promo.value.trim().toUpperCase();

  if (PROMO_CODES[code]) {
    promo = code;
    localStorage.setItem(PROMO_KEY, code);
    promoMsg.textContent = `Промокод применён: −${PROMO_CODES[code]}%`;
    promoMsg.className = "promo__msg is-ok";
  } else {
    promoMsg.textContent = "Такого промокода нет";
    promoMsg.className = "promo__msg is-err";
  }
  render();
});

$("[data-checkout]").addEventListener("submit", (event) => {
  event.preventDefault();
  cart = [];
  promo = "";
  store(CART_KEY, cart);
  localStorage.removeItem(PROMO_KEY);
  promoMsg.textContent = "";
  render();
  event.target.reset();
  emptyEl.hidden = true;
  doneEl.hidden = false;
});

$("[data-news]").addEventListener("submit", (event) => {
  event.preventDefault();
  event.target.innerHTML = '<p class="news__done">Готово! Первое письмо придёт в начале месяца.</p>';
});

/* ---------- Запуск ---------- */

cards.forEach((card) => {
  card.querySelector(".card__img").insertAdjacentHTML(
    "beforeend",
    `<button class="fav" type="button" data-fav="${card.dataset.id}" aria-pressed="false" aria-label="В избранное: ${card.dataset.name}">${HEART_ICON}</button>
     <button class="qv-open" type="button" data-qv-open>Быстрый просмотр</button>`
  );
});

if (promo) {
  promoForm.promo.value = promo;
  promoMsg.textContent = `Промокод применён: −${PROMO_CODES[promo]}%`;
  promoMsg.className = "promo__msg is-ok";
}

if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  document
    .querySelectorAll(".hero__text, .hero__img, .card, .about, .info > div, .faq, .news")
    .forEach((el, index) => {
      el.classList.add("reveal");
      if (el.classList.contains("card")) el.style.transitionDelay = (index % 3) * 80 + "ms";
      observer.observe(el);
    });
}

syncThemeColor();
render();
renderFavs();
updateCatalog();
