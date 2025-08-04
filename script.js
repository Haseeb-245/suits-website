document.addEventListener('DOMContentLoaded', function() {
  // Enhanced smooth scroll with transitions
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      // Skip non-section links
      if (this.getAttribute('href') === '#') return;
      
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        // Add transition class to target section
        targetElement.classList.add('scrolling-to');
        
        // Calculate position with header offset
        const headerHeight = document.querySelector('header')?.offsetHeight || 80;
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
        
        // Smooth scroll
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
        
        // Remove transition class after scroll completes
        setTimeout(() => {
          targetElement.classList.remove('scrolling-to');
        }, 1000);
        
        // Update URL
        history.pushState(null, null, targetId);
      }
    });
  });

  // Fade in page content
  document.body.style.opacity = '1';
  document.body.style.transition = 'opacity 0.3s ease';
});
let products = [];
let adminProducts = JSON.parse(localStorage.getItem("admin_products")) || [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// DOM elements
const productList = document.getElementById("product-list");
const adminProductsContainer = document.getElementById("admin-products");
const cartCounter = document.getElementById("cart-counter");
const cartModal = document.getElementById("cart-modal");
const cartItems = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const productForm = document.getElementById("product-form");

// Initialize the application
function init() {
  loadProducts();
  setupEventListeners();
}

// Load products from both sources
async function loadProducts() {
  try {
    // Load JSON products
    const response = await fetch("products.json");
    const jsonProducts = await response.json();
    
    // Combine with admin products
    products = [...jsonProducts, ...adminProducts];
    
    // Render products
    renderProducts();
    if (adminProductsContainer) renderAdminProducts();
    updateCartCount();
  } catch (error) {
    console.error("Error loading products:", error);
  }
}

// Render products on main shop page
function renderProducts() {
  productList.innerHTML = "";
  
  products.forEach((product, index) => {
    const productCard = document.createElement("div");
    productCard.className = "card";
    productCard.style.animationDelay = `${index * 0.1}s`;
    productCard.dataset.productId = product.id;
    
    productCard.innerHTML = `
      <img src="${product.image}" alt="${product.name}" />
      <h3>${product.name}</h3>
      <p>$${product.price.toFixed(2)}</p>
      <div class="product-meta">
        <label>
          <i class="fas fa-palette"></i>
          <span class="color-name">${product.colors && product.colors.length > 0 ? product.colors[0].trim() : "N/A"}</span>
        </label>
        <label>
          <i class="fas fa-sort-amount-up"></i>
          <div class="quantity-control">
            <button class="qty-decrease">-</button>
            <input type="number" class="qty-input" min="1" value="1">
            <button class="qty-increase">+</button>
          </div>
        </label>
      </div>
      <button class="add-to-cart-btn">
        <i class="fas fa-cart-plus"></i> Add to Cart
      </button>
    `;
    productList.appendChild(productCard);
  });
}

// Render products in admin panel
function renderAdminProducts() {
  adminProductsContainer.innerHTML = "";
  
  if (products.length === 0) {
    adminProductsContainer.innerHTML = '<div class="empty">No products available</div>';
    return;
  }
  
  products.forEach(product => {
    const isAdminProduct = adminProducts.some(p => p.id === product.id);
    const productCard = document.createElement("div");
    productCard.className = "product-card";
    productCard.innerHTML = `
      <div class="product-image">
        <img src="${product.image}" alt="${product.name}" />
      </div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <p class="price">$${product.price.toFixed(2)}</p>
        <div class="colors">
          ${product.colors.map(c => `<span class="color-badge">${c}</span>`).join("")}
        </div>
        <button class="delete-btn" data-product-id="${product.id}">
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>
    `;
    adminProductsContainer.appendChild(productCard);
  });
}

// Setup all event listeners
function setupEventListeners() {
  // Add to cart buttons
  document.addEventListener("click", function(e) {
    if (e.target.closest(".add-to-cart-btn")) {
      const button = e.target.closest(".add-to-cart-btn");
      const card = button.closest(".card");
      const productId = parseInt(card.dataset.productId);
      const color = card.querySelector(".color-name").textContent.trim();
      const quantity = parseInt(card.querySelector(".qty-input").value);
      addToCart(productId, color, quantity, button);
    }
    
    // Quantity controls
    if (e.target.classList.contains("qty-increase")) {
      const input = e.target.previousElementSibling;
      input.value = parseInt(input.value) + 1;
    }
    if (e.target.classList.contains("qty-decrease")) {
      const input = e.target.nextElementSibling;
      input.value = Math.max(1, parseInt(input.value) - 1);
    }
    
    // Delete buttons in admin
    if (e.target.closest(".delete-btn")) {
      const button = e.target.closest(".delete-btn");
      const productId = parseInt(button.dataset.product-id);
      deleteProduct(productId, button);
    }
  });
  
  // Cart counter click
  if (cartCounter) {
    cartCounter.addEventListener("click", showCart);
  }
  
  // Cart modal close
  if (cartModal) {
    cartModal.addEventListener("click", function(e) {
      if (e.target === cartModal) {
        closeCart();
      }
    });
  }
  
  // Product form submission
  if (productForm) {
    productForm.addEventListener("submit", function(e) {
      e.preventDefault();
      const product = {
        id: Date.now(),
        name: document.getElementById("name").value.trim(),
        price: parseFloat(document.getElementById("price").value),
        image: document.getElementById("image").value.trim(),
        colors: document.getElementById("colors").value.split(",").map(c => c.trim())
      };
      
      adminProducts.push(product);
      localStorage.setItem("admin_products", JSON.stringify(adminProducts));
      products = [...products, product];
      
      if (adminProductsContainer) {
        renderAdminProducts();
      } else {
        renderProducts();
      }
      
      showFeedback("Product added successfully!");
      productForm.reset();
    });
  }
}

// Cart functions
function addToCart(productId, color, quantity, buttonElement) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  
  const card = buttonElement.closest(".card");
  card.classList.add("added-to-cart");
  setTimeout(() => card.classList.remove("added-to-cart"), 1000);
  
  const existingItem = cart.find(item => item.id === productId && item.color === color);
  
  if (existingItem) {
    existingItem.qty += quantity;
  } else {
    cart.push({ id: productId, qty: quantity, color });
  }
  
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  showFeedback(`${quantity} ${product.name}(s) added to cart`);
}

function updateCartCount() {
  const total = cart.reduce((sum, item) => sum + item.qty, 0);
  if (cartCounter) {
    cartCounter.querySelector("span").textContent = total;
    cartCounter.style.transform = total > 0 ? "scale(1.1)" : "scale(1)";
  }
}

function showCart() {
  cartItems.innerHTML = "";
  let totalPrice = 0;
  
  if (cart.length === 0) {
    cartItems.innerHTML = "<li class='empty-cart'>Your cart is empty</li>";
  } else {
    cart.forEach(item => {
      const product = products.find(p => p.id === item.id);
      if (!product) return;
      
      const itemTotal = product.price * item.qty;
      totalPrice += itemTotal;
      
      cartItems.innerHTML += `
        <li>
          <div class="cart-item-info">
            <img src="${product.image}" alt="${product.name}" />
            <div>
              <h4>${product.name}</h4>
              <p>${item.color} • ${item.qty}x $${product.price.toFixed(2)}</p>
            </div>
          </div>
          <div class="cart-item-price">$${itemTotal.toFixed(2)}</div>
        </li>
      `;
    });
  }
  
  cartTotal.textContent = `Total: $${totalPrice.toFixed(2)}`;
  cartModal.classList.add("show");
}

function closeCart() {
  cartModal.classList.remove("show");
}

function checkout() {
  if (cart.length === 0) {
    showFeedback("Your cart is empty!");
    return;
  }
  
  showFeedback("Order placed successfully! Thank you for your purchase.");
  cart = [];
  localStorage.removeItem("cart");
  updateCartCount();
  closeCart();
}

// Product management
function deleteProduct(productId, buttonElement) {
  if (!confirm("Are you sure you want to delete this product?")) return;
  
  // Remove from admin products
  adminProducts = adminProducts.filter(p => p.id !== productId);
  localStorage.setItem("admin_products", JSON.stringify(adminProducts));
  
  // Remove from products array
  products = products.filter(p => p.id !== productId);
  
  // Animate removal
  const productCard = buttonElement.closest(".product-card");
  productCard.style.transform = "scale(0.9)";
  productCard.style.opacity = "0";
  productCard.style.transition = "all 0.3s ease";
  
  setTimeout(() => {
    if (adminProductsContainer) {
      renderAdminProducts();
    } else {
      renderProducts();
    }
    showFeedback("Product deleted successfully");
  }, 300);
}

// Utility functions
function showFeedback(message) {
  const feedback = document.createElement("div");
  feedback.className = "feedback";
  feedback.textContent = message;
  document.body.appendChild(feedback);
  
  setTimeout(() => {
    feedback.classList.add("show");
    setTimeout(() => {
      feedback.classList.remove("show");
      setTimeout(() => feedback.remove(), 300);
    }, 2000);
  }, 10);
}

// Initialize the app
init();