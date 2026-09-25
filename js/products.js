/* ==========================================================================
   ORIFLOWS FASHION — PRODUCT RENDERING
   Reads data/products.json. To add, remove, or edit products, edit that
   file only — nothing here needs to change.
   ========================================================================== */

function fetchProducts() {
  return fetch("data/products.json").then(function (r) {
    if (!r.ok) throw new Error("Could not load products.json");
    return r.json();
  });
}

function productCardHTML(p) {
  const img = p.images[0];
  const showOld = p.oldPrice && p.oldPrice > p.price;
  let badge = "";
  if (!p.stock) badge = '<span class="badge badge-out">Out of Stock</span>';
  else if (p.discount > 0) badge = '<span class="badge">' + p.discount + '% OFF</span>';
  else if (p.newArrival) badge = '<span class="badge badge-new">New</span>';

  const waMessage = "Hello Oriflows Fashion,\nI want to order:\n\nProduct: " + p.name +
    "\nCode: " + p.id + "\nPrice: " + Oriflows.formatPrice(p.price) +
    "\n\nPlease provide order confirmation and delivery details.";

  return `
  <article class="product-card" data-id="${p.id}">
    <a href="product.html?slug=${p.slug}" class="product-card-media" aria-label="View ${p.name}">
      ${badge}
      <img src="${img}" alt="${p.name} — ${p.color} ${p.category}" loading="lazy">
      <button type="button" class="product-card-quick" data-quick-view="${p.slug}" onclick="event.preventDefault(); openQuickView('${p.slug}')">Quick View</button>
    </a>
    <div class="product-card-body">
      <span class="product-card-category">${p.category} &middot; ${p.color}</span>
      <a href="product.html?slug=${p.slug}"><h3 class="product-card-name">${p.name}</h3></a>
      <div class="product-card-price">
        <span class="price-current">${Oriflows.formatPrice(p.price)}</span>
        ${showOld ? '<span class="price-old">' + Oriflows.formatPrice(p.oldPrice) + '</span>' : ''}
      </div>
      <div class="product-card-actions">
        <button type="button" class="btn btn-outline" ${p.stock ? '' : 'disabled'} onclick="quickAddToCart('${p.slug}')">
          ${p.stock ? 'Add to Cart' : 'Sold Out'}
        </button>
        <a class="btn btn-whatsapp" href="${Oriflows.whatsappLink(waMessage)}" target="_blank" rel="noopener">WhatsApp</a>
      </div>
    </div>
  </article>`;
}

function quickAddToCart(slug) {
  fetchProducts().then(function (products) {
    const p = products.find(x => x.slug === slug);
    if (!p) return;
    window.OriflowsCart.addItem(p, p.sizes[0] || "Standard", 1);
    Oriflows.showToast(p.name + " added to cart");
  });
}

/* ---------- Quick View modal (shared across home + shop) ---------- */
function ensureQuickViewModal() {
  if (document.querySelector("[data-quick-view-modal]")) return;
  const wrap = document.createElement("div");
  wrap.setAttribute("data-quick-view-modal", "");
  wrap.style.cssText = "position:fixed;inset:0;z-index:180;display:none;align-items:center;justify-content:center;background:rgba(42,33,29,0.55);padding:20px;";
  wrap.innerHTML = `
    <div style="background:var(--color-secondary-alt);border-radius:8px;max-width:560px;width:100%;max-height:88vh;overflow-y:auto;padding:24px;position:relative;">
      <button type="button" aria-label="Close quick view" data-qv-close style="position:absolute;top:14px;right:14px;font-size:1.3rem;width:32px;height:32px;">&times;</button>
      <div data-qv-content></div>
    </div>`;
  document.body.appendChild(wrap);
  wrap.addEventListener("click", function (e) { if (e.target === wrap) closeQuickView(); });
  wrap.querySelector("[data-qv-close]").addEventListener("click", closeQuickView);
}
function closeQuickView() {
  const modal = document.querySelector("[data-quick-view-modal]");
  if (modal) modal.style.display = "none";
}
function openQuickView(slug) {
  ensureQuickViewModal();
  fetchProducts().then(function (products) {
    const p = products.find(x => x.slug === slug);
    if (!p) return;
    const modal = document.querySelector("[data-quick-view-modal]");
    const content = modal.querySelector("[data-qv-content]");
    content.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr;gap:16px;">
        <div style="aspect-ratio:4/5;border-radius:4px;overflow:hidden;background:var(--color-secondary);">
          <img src="${p.images[0]}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;">
        </div>
        <div>
          <span class="product-card-category">${p.category} &middot; ${p.color}</span>
          <h3 class="font-heading" style="font-size:1.3rem;margin:6px 0 10px;">${p.name}</h3>
          <p class="price-current" style="font-size:1.1rem;">${Oriflows.formatPrice(p.price)}</p>
          <p style="color:var(--color-text-soft);font-size:0.9rem;margin:10px 0 16px;">${p.description}</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <a class="btn btn-primary" href="product.html?slug=${p.slug}">View Full Details</a>
            <button type="button" class="btn btn-outline" onclick="quickAddToCart('${p.slug}'); closeQuickView();" ${p.stock ? '' : 'disabled'}>Add to Cart</button>
          </div>
        </div>
      </div>`;
    modal.style.display = "flex";
  });
}

/* ==========================================================================
   HOME PAGE
   ========================================================================== */
function initHomeProducts() {
  const featuredEl = document.querySelector("[data-featured-products]");
  const newEl = document.querySelector("[data-new-products]");
  const bestEl = document.querySelector("[data-bestseller-products]");
  if (!featuredEl && !newEl && !bestEl) return;

  fetchProducts().then(function (products) {
    if (featuredEl) {
      const list = products.filter(p => p.featured).slice(0, 4);
      featuredEl.innerHTML = list.map(productCardHTML).join("");
    }
    if (newEl) {
      const list = products.filter(p => p.newArrival).slice(0, 4);
      newEl.innerHTML = list.map(productCardHTML).join("");
    }
    if (bestEl) {
      // Demo ranking: highest-discount in-stock pieces stand in for
      // best sellers until real order data is connected.
      const list = products.filter(p => p.stock).sort((a, b) => b.discount - a.discount).slice(0, 4);
      bestEl.innerHTML = list.map(productCardHTML).join("");
    }
  });
}

/* ==========================================================================
   SHOP PAGE
   ========================================================================== */
function initShopPage() {
  const grid = document.querySelector("[data-shop-grid]");
  if (!grid) return;

  const resultCount = document.querySelector("[data-result-count]");
  const emptyState = document.querySelector("[data-shop-empty]");
  const sortSelect = document.querySelector("[data-sort-select]");
  const categoryChips = Oriflows.qsa("[data-category-chip]");
  const priceRange = document.querySelector("[data-price-range]");
  const priceRangeValue = document.querySelector("[data-price-range-value]");
  const clearBtn = document.querySelector("[data-clear-filters]");
  const filterToggle = document.querySelector("[data-filter-toggle]");
  const filterPanel = document.querySelector("[data-filter-panel]");

  let allProducts = [];
  let state = { category: "All", sort: "featured", maxPrice: 5000 };

  const params = new URLSearchParams(window.location.search);
  if (params.get("category")) state.category = params.get("category");

  function applyAndRender() {
    let list = allProducts.slice();
    if (state.category !== "All") list = list.filter(p => p.category === state.category);
    list = list.filter(p => p.price <= state.maxPrice);

    switch (state.sort) {
      case "newest": list.sort((a, b) => (b.newArrival === a.newArrival) ? 0 : b.newArrival ? 1 : -1); break;
      case "price-asc": list.sort((a, b) => a.price - b.price); break;
      case "price-desc": list.sort((a, b) => b.price - a.price); break;
      default: list.sort((a, b) => (b.featured === a.featured) ? 0 : b.featured ? 1 : -1);
    }

    grid.innerHTML = list.map(productCardHTML).join("");
    if (resultCount) resultCount.textContent = list.length + (list.length === 1 ? " item" : " items");
    if (emptyState) emptyState.style.display = list.length === 0 ? "block" : "none";
  }

  fetchProducts().then(function (products) {
    allProducts = products;
    applyAndRender();
  });

  categoryChips.forEach(chip => chip.addEventListener("click", function () {
    state.category = chip.getAttribute("data-category-chip");
    categoryChips.forEach(c => c.setAttribute("aria-pressed", "false"));
    chip.setAttribute("aria-pressed", "true");
    applyAndRender();
  }));

  if (sortSelect) sortSelect.addEventListener("change", function () {
    state.sort = sortSelect.value;
    applyAndRender();
  });

  if (priceRange) priceRange.addEventListener("input", function () {
    state.maxPrice = Number(priceRange.value);
    if (priceRangeValue) priceRangeValue.textContent = Oriflows.formatPrice(state.maxPrice);
    applyAndRender();
  });

  if (clearBtn) clearBtn.addEventListener("click", function () {
    state = { category: "All", sort: "featured", maxPrice: 5000 };
    categoryChips.forEach(c => c.setAttribute("aria-pressed", c.getAttribute("data-category-chip") === "All" ? "true" : "false"));
    if (sortSelect) sortSelect.value = "featured";
    if (priceRange) { priceRange.value = 5000; if (priceRangeValue) priceRangeValue.textContent = Oriflows.formatPrice(5000); }
    applyAndRender();
  });

  if (filterToggle && filterPanel) {
    filterToggle.addEventListener("click", function () {
      filterPanel.classList.toggle("is-open");
    });
  }
}

/* ==========================================================================
   PRODUCT DETAIL PAGE
   ========================================================================== */
function initProductDetailPage() {
  const root = document.querySelector("[data-pdp-root]");
  if (!root) return;

  const slug = new URLSearchParams(window.location.search).get("slug");

  fetchProducts().then(function (products) {
    const p = products.find(x => x.slug === slug) || products[0];
    if (!p) return;

    document.title = p.name + " | Oriflows Fashion";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", p.description.slice(0, 155));

    document.querySelector("[data-pdp-breadcrumb]").textContent = p.name;
    document.querySelector("[data-pdp-category]").textContent = p.category + " \u00B7 " + p.color;
    document.querySelector("[data-pdp-name]").textContent = p.name;
    document.querySelector("[data-pdp-price]").textContent = Oriflows.formatPrice(p.price);

    const oldPriceEl = document.querySelector("[data-pdp-old-price]");
    if (p.oldPrice && p.oldPrice > p.price) {
      oldPriceEl.textContent = Oriflows.formatPrice(p.oldPrice);
      oldPriceEl.style.display = "inline";
    } else {
      oldPriceEl.style.display = "none";
    }

    const stockEl = document.querySelector("[data-pdp-stock]");
    stockEl.textContent = p.stock ? "In Stock — ready to ship" : "Currently Out of Stock";
    stockEl.className = "pdp-stock " + (p.stock ? "in" : "out");

    document.querySelector("[data-pdp-desc]").textContent = p.description;
    document.querySelector("[data-pdp-code]").textContent = p.id;
    document.querySelector("[data-pdp-fabric]").textContent = p.fabric;
    document.querySelector("[data-pdp-color]").textContent = p.color;
    document.querySelector("[data-pdp-category-cell]").textContent = p.category;

    /* Gallery */
    const mainImg = document.querySelector("[data-pdp-main-image]");
    mainImg.src = p.images[0];
    mainImg.alt = p.name;
    const thumbsWrap = document.querySelector("[data-pdp-thumbs]");
    thumbsWrap.innerHTML = p.images.map((img, i) => `
      <button type="button" class="${i === 0 ? 'is-active' : ''}" data-thumb="${img}">
        <img src="${img}" alt="${p.name} view ${i + 1}">
      </button>`).join("");
    Oriflows.qsa("[data-thumb]", thumbsWrap).forEach(btn => {
      btn.addEventListener("click", function () {
        mainImg.src = btn.getAttribute("data-thumb");
        Oriflows.qsa("[data-thumb]", thumbsWrap).forEach(b => b.classList.remove("is-active"));
        btn.classList.add("is-active");
      });
    });

    /* Sizes */
    const sizeRow = document.querySelector("[data-pdp-sizes]");
    let selectedSize = p.sizes[0] || "Standard";
    sizeRow.innerHTML = p.sizes.map((s, i) => `
      <button type="button" class="size-chip" aria-pressed="${i === 0}" data-size="${s}">${s}</button>`).join("");
    Oriflows.qsa("[data-size]", sizeRow).forEach(btn => {
      btn.addEventListener("click", function () {
        selectedSize = btn.getAttribute("data-size");
        Oriflows.qsa("[data-size]", sizeRow).forEach(b => b.setAttribute("aria-pressed", "false"));
        btn.setAttribute("aria-pressed", "true");
      });
    });

    /* Quantity */
    const qtyInput = document.querySelector("[data-pdp-qty]");
    document.querySelector("[data-qty-minus]").addEventListener("click", function () {
      qtyInput.value = Math.max(1, Number(qtyInput.value) - 1);
    });
    document.querySelector("[data-qty-plus]").addEventListener("click", function () {
      qtyInput.value = Math.min(10, Number(qtyInput.value) + 1);
    });

    /* Add to cart */
    const addBtn = document.querySelector("[data-pdp-add-cart]");
    if (!p.stock) { addBtn.setAttribute("disabled", "disabled"); addBtn.textContent = "Sold Out"; }
    addBtn.addEventListener("click", function () {
      window.OriflowsCart.addItem(p, selectedSize, Number(qtyInput.value));
      Oriflows.showToast(p.name + " added to cart");
    });

    /* WhatsApp order button */
    const waBtn = document.querySelector("[data-pdp-whatsapp]");
    function buildMessage() {
      return "Hello Oriflows Fashion,\nI want to order:\n\nProduct: " + p.name +
        "\nCode: " + p.id + "\nPrice: " + Oriflows.formatPrice(p.price) +
        "\nSize: " + selectedSize + "\nQuantity: " + qtyInput.value +
        "\n\nPlease provide order confirmation and delivery details.";
    }
    waBtn.addEventListener("click", function () {
      waBtn.href = Oriflows.whatsappLink(buildMessage());
    });
    waBtn.href = Oriflows.whatsappLink(buildMessage());

    /* Related products */
    const relatedEl = document.querySelector("[data-related-products]");
    if (relatedEl) {
      const related = products.filter(x => x.category === p.category && x.slug !== p.slug).slice(0, 4);
      relatedEl.innerHTML = related.map(productCardHTML).join("");
    }

    /* JSON-LD structured data */
    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.textContent = JSON.stringify({
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": p.name,
      "image": p.images.map(i => window.ORIFLOWS_CONFIG.SITE_URL + "/" + i),
      "description": p.description,
      "sku": p.id,
      "offers": {
        "@type": "Offer",
        "priceCurrency": "BDT",
        "price": p.price,
        "availability": p.stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "url": window.ORIFLOWS_CONFIG.SITE_URL + "/product.html?slug=" + p.slug
      }
    });
    document.head.appendChild(ld);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  initHomeProducts();
  initShopPage();
  initProductDetailPage();
});
