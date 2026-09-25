/* ==========================================================================
   ORIFLOWS FASHION — CART
   Client-side cart stored in localStorage. No payment gateway yet —
   checkout hands the order to WhatsApp for manual confirmation.

   FUTURE AUTOMATION:
   When ready to connect bKash / Nagad / SSLCommerz / a database / n8n,
   this is the file to extend. `placeOrder()` below is the single place
   that should eventually POST to window.ORIFLOWS_CONFIG.ORDER_WEBHOOK_URL
   instead of (or alongside) opening WhatsApp.
   ========================================================================== */

const OriflowsCart = (function () {
  const STORAGE_KEY = "oriflows_cart_v1";

  function getCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    updateBadge();
  }

  function addItem(product, size, qty) {
    const items = getCart();
    const existing = items.find(i => i.id === product.id && i.size === size);
    if (existing) {
      existing.qty = Math.min(10, existing.qty + qty);
    } else {
      items.push({
        id: product.id,
        slug: product.slug,
        name: product.name,
        image: product.images[0],
        price: product.price,
        size: size,
        qty: qty
      });
    }
    saveCart(items);
  }

  function removeItem(id, size) {
    saveCart(getCart().filter(i => !(i.id === id && i.size === size)));
  }

  function updateQty(id, size, qty) {
    const items = getCart();
    const item = items.find(i => i.id === id && i.size === size);
    if (item) {
      item.qty = Math.max(1, Math.min(10, qty));
      saveCart(items);
    }
  }

  function clearCart() { saveCart([]); }

  function subtotal() {
    return getCart().reduce((sum, i) => sum + i.price * i.qty, 0);
  }

  function itemCount() {
    return getCart().reduce((sum, i) => sum + i.qty, 0);
  }

  function updateBadge() {
    Oriflows && Oriflows.qsa("[data-cart-count]").forEach(function (el) {
      const count = itemCount();
      el.textContent = count;
      el.setAttribute("data-count", count);
    });
  }

  return { getCart, saveCart, addItem, removeItem, updateQty, clearCart, subtotal, itemCount, updateBadge };
})();
window.OriflowsCart = OriflowsCart;

/* ==========================================================================
   CART PAGE RENDERING
   ========================================================================== */
function estimateDelivery(subtotalAmount) {
  const cfg = window.ORIFLOWS_CONFIG;
  if (subtotalAmount >= cfg.FREE_DELIVERY_THRESHOLD) return 0;
  return null; // unknown until the customer picks a delivery area
}

function renderCartPage() {
  const listEl = document.querySelector("[data-cart-list]");
  if (!listEl) return;

  const emptyEl = document.querySelector("[data-cart-empty]");
  const layoutEl = document.querySelector("[data-cart-layout]");
  const subtotalEl = document.querySelector("[data-cart-subtotal]");
  const deliveryNoteEl = document.querySelector("[data-cart-delivery-note]");
  const whatsappBtn = document.querySelector("[data-cart-whatsapp]");

  function render() {
    const items = OriflowsCart.getCart();

    if (items.length === 0) {
      if (emptyEl) emptyEl.style.display = "block";
      if (layoutEl) layoutEl.style.display = "none";
      return;
    }
    if (emptyEl) emptyEl.style.display = "none";
    if (layoutEl) layoutEl.style.display = "";

    listEl.innerHTML = items.map(function (item) {
      return `
      <div class="cart-item" data-cart-item data-id="${item.id}" data-size="${item.size}">
        <img src="${item.image}" alt="${item.name}">
        <div>
          <div class="cart-item-row">
            <span class="cart-item-name">${item.name}</span>
            <span class="price-current">${Oriflows.formatPrice(item.price * item.qty)}</span>
          </div>
          <div class="cart-item-meta">Size: ${item.size} &middot; ${Oriflows.formatPrice(item.price)} each</div>
          <div class="cart-item-row">
            <div class="qty-row">
              <button type="button" aria-label="Decrease quantity" data-cart-minus>&minus;</button>
              <input type="text" inputmode="numeric" value="${item.qty}" readonly aria-label="Quantity">
              <button type="button" aria-label="Increase quantity" data-cart-plus>+</button>
            </div>
            <button type="button" class="cart-item-remove" data-cart-remove>Remove</button>
          </div>
        </div>
      </div>`;
    }).join("");

    const subtotalAmount = OriflowsCart.subtotal();
    if (subtotalEl) subtotalEl.textContent = Oriflows.formatPrice(subtotalAmount);
    const totalEl = document.querySelector("[data-cart-total]");
    if (totalEl) totalEl.textContent = Oriflows.formatPrice(subtotalAmount);

    const cfg = window.ORIFLOWS_CONFIG;
    if (deliveryNoteEl) {
      if (subtotalAmount >= cfg.FREE_DELIVERY_THRESHOLD) {
        deliveryNoteEl.textContent = "Free delivery unlocked on this order.";
      } else {
        const remaining = cfg.FREE_DELIVERY_THRESHOLD - subtotalAmount;
        deliveryNoteEl.textContent = "Add " + Oriflows.formatPrice(remaining) + " more for free delivery. Dhaka: " +
          Oriflows.formatPrice(cfg.DELIVERY_CHARGE_DHAKA) + " · Outside Dhaka: " + Oriflows.formatPrice(cfg.DELIVERY_CHARGE_OUTSIDE_DHAKA);
      }
    }

    if (whatsappBtn) whatsappBtn.href = Oriflows.whatsappLink(buildOrderMessage(items, subtotalAmount));

    Oriflows.qsa("[data-cart-item]", listEl).forEach(function (row) {
      const id = row.getAttribute("data-id");
      const size = row.getAttribute("data-size");
      const item = items.find(i => i.id === id && i.size === size);
      row.querySelector("[data-cart-minus]").addEventListener("click", function () {
        OriflowsCart.updateQty(id, size, item.qty - 1); render();
      });
      row.querySelector("[data-cart-plus]").addEventListener("click", function () {
        OriflowsCart.updateQty(id, size, item.qty + 1); render();
      });
      row.querySelector("[data-cart-remove]").addEventListener("click", function () {
        OriflowsCart.removeItem(id, size); render();
        Oriflows.showToast("Removed from cart");
      });
    });
  }

  const clearBtn = document.querySelector("[data-cart-clear]");
  if (clearBtn) clearBtn.addEventListener("click", function () {
    if (confirm("Remove all items from your cart?")) { OriflowsCart.clearCart(); render(); }
  });

  render();
}

function buildOrderMessage(items, subtotalAmount) {
  const lines = items.map(i => "- " + i.name + " (Code: " + i.id + ", Size: " + i.size + ", Qty: " + i.qty + ") — " + Oriflows.formatPrice(i.price * i.qty));
  return "Hello Oriflows Fashion,\nI want to order:\n\n" + lines.join("\n") +
    "\n\nSubtotal: " + Oriflows.formatPrice(subtotalAmount) +
    "\n\nPlease provide order confirmation and delivery details.";
}

/* Placeholder for a future backend order call — see file header note. */
function placeOrder(items) {
  const cfg = window.ORIFLOWS_CONFIG;
  if (!cfg.ORDER_WEBHOOK_URL) return Promise.resolve({ ok: false, reason: "no_webhook_configured" });
  return fetch(cfg.ORDER_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: items, subtotal: OriflowsCart.subtotal(), createdAt: new Date().toISOString() })
  });
}

document.addEventListener("DOMContentLoaded", renderCartPage);
