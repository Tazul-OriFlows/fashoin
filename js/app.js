/* ==========================================================================
   ORIFLOWS FASHION — SITE CONFIGURATION
   Edit the values below to configure the store. This is the ONLY place
   the WhatsApp number and delivery charges need to change.
   ========================================================================== */
window.ORIFLOWS_CONFIG = {
  // WhatsApp number in international format, digits only, no + or spaces.
  // Example for Bangladesh: "8801XXXXXXXXX"
  WHATSAPP_NUMBER: "8801700000000",

  CURRENCY_SYMBOL: "\u09F3", // ৳
  DELIVERY_CHARGE_DHAKA: 70,
  DELIVERY_CHARGE_OUTSIDE_DHAKA: 130,
  FREE_DELIVERY_THRESHOLD: 3000,

  SITE_NAME: "Oriflows Fashion",
  SITE_URL: "https://fashion.oriflows.com",

  // Where a future backend/order webhook would be called from cart.js.
  // See the "FUTURE AUTOMATION" note in js/cart.js.
  ORDER_WEBHOOK_URL: "" // e.g. "https://your-n8n-instance.com/webhook/oriflows-order"
};

/* ==========================================================================
   SHARED UTILITIES
   ========================================================================== */
const Oriflows = (function () {
  function formatPrice(amount) {
    const n = Number(amount) || 0;
    return window.ORIFLOWS_CONFIG.CURRENCY_SYMBOL + n.toLocaleString("en-BD");
  }

  function whatsappLink(message) {
    const number = window.ORIFLOWS_CONFIG.WHATSAPP_NUMBER;
    return "https://wa.me/" + number + "?text=" + encodeURIComponent(message);
  }

  function showToast(message) {
    let toast = document.querySelector(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove("is-visible"), 2400);
  }

  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  return { formatPrice, whatsappLink, showToast, qs, qsa };
})();

/* ==========================================================================
   NAVIGATION: mobile menu, search overlay, sticky header state
   ========================================================================== */
document.addEventListener("DOMContentLoaded", function () {
  const hamburger = document.querySelector("[data-hamburger]");
  const mobileMenu = document.querySelector("[data-mobile-menu]");
  const mobileMenuClose = document.querySelector("[data-mobile-menu-close]");

  function openMenu() {
    mobileMenu.classList.add("is-open");
    hamburger.classList.add("is-open");
    hamburger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }
  function closeMenu() {
    mobileMenu.classList.remove("is-open");
    hamburger.classList.remove("is-open");
    hamburger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }
  if (hamburger && mobileMenu) {
    hamburger.addEventListener("click", function () {
      mobileMenu.classList.contains("is-open") ? closeMenu() : openMenu();
    });
  }
  if (mobileMenuClose) mobileMenuClose.addEventListener("click", closeMenu);
  Oriflows.qsa(".mobile-menu-links a").forEach(a => a.addEventListener("click", closeMenu));

  /* Search overlay */
  const searchTriggers = Oriflows.qsa("[data-search-open]");
  const searchOverlay = document.querySelector("[data-search-overlay]");
  const searchClose = document.querySelector("[data-search-close]");
  const searchInput = document.querySelector("[data-search-input]");
  const searchResults = document.querySelector("[data-search-results]");

  function openSearch() {
    if (!searchOverlay) return;
    searchOverlay.classList.add("is-open");
    setTimeout(() => searchInput && searchInput.focus(), 50);
  }
  function closeSearch() {
    if (!searchOverlay) return;
    searchOverlay.classList.remove("is-open");
  }
  searchTriggers.forEach(btn => btn.addEventListener("click", openSearch));
  if (searchClose) searchClose.addEventListener("click", closeSearch);
  if (searchOverlay) {
    searchOverlay.addEventListener("click", function (e) {
      if (e.target === searchOverlay) closeSearch();
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeSearch(); closeMenu && closeMenu(); }
  });

  if (searchInput && searchResults) {
    let allProducts = [];
    fetch(getDataPath())
      .then(r => r.json())
      .then(data => { allProducts = data; })
      .catch(() => { allProducts = []; });

    searchInput.addEventListener("input", function () {
      const term = searchInput.value.trim().toLowerCase();
      if (!term) { searchResults.innerHTML = ""; return; }
      const matches = allProducts.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        p.color.toLowerCase().includes(term)
      ).slice(0, 6);

      if (matches.length === 0) {
        searchResults.innerHTML = '<p class="search-empty">No products found. Try "2 piece", "3 piece", or a color.</p>';
        return;
      }
      searchResults.innerHTML = matches.map(p => `
        <a class="search-result-item" href="${getProductLink(p.slug)}">
          <img src="${getAssetPath(p.images[0])}" alt="${p.name}" loading="lazy">
          <span>
            <strong>${p.name}</strong><br>
            <span style="color:var(--color-text-soft);font-size:0.8rem;">${Oriflows.formatPrice(p.price)}</span>
          </span>
        </a>
      `).join("");
    });
  }

  /* Update cart badge on every page load */
  if (window.OriflowsCart) {
    window.OriflowsCart.updateBadge();
  }

  /* Generic WhatsApp links (header, footer, floating button) */
  const genericMessage = "Hello Oriflows Fashion, I'd like to know more about your collection.";
  Oriflows.qsa("[data-whatsapp-hero]").forEach(function (el) {
    el.href = Oriflows.whatsappLink(genericMessage);
  });
});

/* Helper: resolve data/asset paths correctly whether we're at the root
   or inside a page that references relative paths the same way (this
   site keeps all HTML files at the root, so paths stay simple). */
function getDataPath() { return "data/products.json"; }
function getAssetPath(path) { return path; }
function getProductLink(slug) { return "product.html?slug=" + encodeURIComponent(slug); }
