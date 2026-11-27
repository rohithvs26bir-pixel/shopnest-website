// ---------- Product data (edit this list to add your own products) ----------
const products = [
  { id: 1, name: "Wireless Headphones", price: 2499, category: "Electronics", icon: "🎧" },
  { id: 2, name: "Smart Watch",         price: 3999, category: "Electronics", icon: "⌚" },
  { id: 3, name: "Digital Camera",      price: 18999, category: "Electronics", icon: "📷" },
  { id: 4, name: "Running Shoes",       price: 2199, category: "Fashion",     icon: "👟" },
  { id: 5, name: "Backpack",            price: 1299, category: "Fashion",     icon: "🎒" },
  { id: 6, name: "Sunglasses",          price: 899,  category: "Fashion",     icon: "🕶️" },
  { id: 7, name: "Coffee Mug",          price: 349,  category: "Home",        icon: "☕" },
  { id: 8, name: "Table Lamp",          price: 1199, category: "Home",        icon: "💡" }
];

// ---------- Saved state ----------
function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function save() {
  try {
    localStorage.setItem("cart", JSON.stringify(cart));
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
  } catch {
    // Storage is blocked: the site still works until the page is closed
  }
}

let cart = load("cart", {});          // { productId: quantity }
let wishlist = load("wishlist", []);  // [productId, ...]

// ---------- Helpers ----------
const $ = (id) => document.getElementById(id);
const money = (n) => "₹" + n.toLocaleString("en-IN");
const findProduct = (id) => products.find((p) => p.id === Number(id));

let toastTimer;
function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.remove("show"), 1800);
}

function emptyState(message) {
  return `<div class="empty"><p>${message}</p><a href="#products" class="btn">Browse products</a></div>`;
}

function productCard(p) {
  const liked = wishlist.includes(p.id);
  return `
    <article class="card">
      <button class="heart ${liked ? "active" : ""}" data-action="wish" data-id="${p.id}"
        aria-label="${liked ? "Remove from" : "Add to"} wishlist">♥</button>
      <div class="thumb">${p.icon}</div>
      <span class="cat">${p.category}</span>
      <h3>${p.name}</h3>
      <p class="price">${money(p.price)}</p>
      <button class="btn" data-action="add" data-id="${p.id}">Add to cart</button>
    </article>`;
}

// ---------- Rendering ----------
function renderFeatured() {
  $("featured").innerHTML = products.slice(0, 4).map(productCard).join("");
}

function renderProducts() {
  const term = $("search").value.trim().toLowerCase();
  const category = $("category").value;
  const sort = $("sort").value;

  const list = products.filter((p) =>
    p.name.toLowerCase().includes(term) && (category === "all" || p.category === category));

  if (sort === "low") list.sort((a, b) => a.price - b.price);
  if (sort === "high") list.sort((a, b) => b.price - a.price);

  $("productList").innerHTML = list.length
    ? list.map(productCard).join("")
    : `<p class="empty">No products found.</p>`;
}

function renderCart() {
  const items = Object.entries(cart)
    .map(([id, qty]) => ({ product: findProduct(id), qty }))
    .filter((item) => item.product);

  if (!items.length) {
    $("cartItems").innerHTML = emptyState("Your cart is empty.");
    return;
  }

  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.qty, 0);
  const delivery = subtotal >= 999 ? 0 : 79;

  $("cartItems").innerHTML = items.map(({ product: p, qty }) => `
    <div class="cart-row">
      <div class="thumb">${p.icon}</div>
      <div class="cart-info"><h3>${p.name}</h3><p>${money(p.price)}</p></div>
      <div class="qty">
        <button data-action="decrease" data-id="${p.id}" aria-label="Decrease quantity">−</button>
        <span>${qty}</span>
        <button data-action="add" data-id="${p.id}" aria-label="Increase quantity">+</button>
      </div>
      <strong>${money(p.price * qty)}</strong>
      <button class="remove" data-action="remove" data-id="${p.id}">Remove</button>
    </div>`).join("") + `
    <div class="summary">
      <p><span>Subtotal</span><span>${money(subtotal)}</span></p>
      <p><span>Delivery</span><span>${delivery ? money(delivery) : "Free"}</span></p>
      <p class="total"><span>Total</span><span>${money(subtotal + delivery)}</span></p>
      <button class="btn" data-action="checkout">Checkout</button>
    </div>`;
}

function renderWishlist() {
  const items = wishlist.map(findProduct).filter(Boolean);
  $("wishlistItems").innerHTML = items.length
    ? items.map(productCard).join("")
    : emptyState("Your wishlist is empty.");
}

function render() {
  renderFeatured();
  renderProducts();
  renderCart();
  renderWishlist();
  $("cartCount").textContent = Object.values(cart).reduce((a, b) => a + b, 0);
  $("wishCount").textContent = wishlist.length;
}

// ---------- Button actions ----------
document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const { action } = button.dataset;
  const id = Number(button.dataset.id);

  if (action === "add") {
    cart[id] = (cart[id] || 0) + 1;
    toast("Added to cart");
  } else if (action === "decrease") {
    cart[id] -= 1;
    if (cart[id] <= 0) delete cart[id];
  } else if (action === "remove") {
    delete cart[id];
    toast("Removed from cart");
  } else if (action === "wish") {
    const liked = wishlist.includes(id);
    wishlist = liked ? wishlist.filter((x) => x !== id) : [...wishlist, id];
    toast(liked ? "Removed from wishlist" : "Added to wishlist");
  } else if (action === "checkout") {
    // Demo only: no payment is taken
    toast("Demo store: checkout is not connected yet");
  }

  save();
  render();
});

["search", "category", "sort"].forEach((id) => $(id).addEventListener("input", renderProducts));

// ---------- Page navigation ----------
function showPage() {
  const pages = ["home", "products", "cart", "wishlist"];
  const hash = location.hash.slice(1);
  const current = pages.includes(hash) ? hash : "home";

  pages.forEach((page) => $(page).classList.toggle("active", page === current));
  document.querySelectorAll("[data-link]").forEach((link) =>
    link.classList.toggle("active", link.dataset.link === current));
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", showPage);
render();
showPage();
