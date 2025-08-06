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
const productModal = document.getElementById("product-modal");
const productModalContent = document.querySelector(".product-modal-content");

// Initialize the application
function init() {
  loadProducts();
  setupEventListeners();
  updateCartCount();
}

// Load products from both sources
async function loadProducts() {
  try {
    // Load JSON products
    const response = await fetch("products.json");
    const jsonProducts = await response.json();
    
    // Add ratings and descriptions if missing
    const enhancedProducts = jsonProducts.map(product => ({
      rating: product.rating || Math.floor(Math.random() * 2) + 4, // 4-5 stars
      description: product.description || `Premium ${product.name} crafted with the finest materials and attention to detail.`,
      ...product
    }));
    
    // Combine with admin products
    products = [...enhancedProducts, ...adminProducts];
    
    // Render products
    renderProducts();
    if (adminProductsContainer) renderAdminProducts();
  } catch (error) {
    console.error("Error loading products:", error);
  }
}

// Render products on main shop page
function renderProducts() {
  if (!productList) return;
  
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
          <i class="fas fa-star"></i>
          ${product.rating ? `${product.rating.toFixed(1)}/5.0` : '4.5/5.0'}
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
  if (!adminProductsContainer) return;
  
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

// Show product details modal
function showProductModal(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  productModalContent.innerHTML = `
    <div class="product-modal-image">
      <img src="${product.image}" alt="${product.name}" />
    </div>
    <div class="product-modal-details">
      <h3>${product.name}</h3>
      <div class="product-rating">
        ${generateStarRating(product.rating || 4.5)}
        <span>${product.rating ? product.rating.toFixed(1) : '4.5'}/5.0</span>
      </div>
      <p class="product-modal-price">$${product.price.toFixed(2)}</p>
      <p class="product-modal-description">${product.description}</p>
      
      <div class="product-options">
        <div class="form-group">
          <label>Color</label>
          <select class="color-select">
            ${product.colors.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
        
        <div class="form-group">
          <label>Size</label>
          <select class="size-select">
            <option value="S">Small</option>
            <option value="M">Medium</option>
            <option value="L">Large</option>
            <option value="XL">Extra Large</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Quantity</label>
          <div class="quantity-control">
            <button class="qty-decrease">-</button>
            <input type="number" class="qty-input" min="1" value="1">
            <button class="qty-increase">+</button>
          </div>
        </div>
      </div>
      
      <div class="product-modal-actions">
        <button class="add-to-cart-btn" onclick="addToCartFromModal(${product.id})">
          <i class="fas fa-cart-plus"></i> Add to Cart
        </button>
        <button class="wishlist-btn">
          <i class="fas fa-heart"></i> Wishlist
        </button>
      </div>
    </div>
  `;

  productModal.classList.add("show");
}

// Generate star rating HTML
function generateStarRating(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  let stars = '';
  for (let i = 0; i < fullStars; i++) {
    stars += '<i class="fas fa-star"></i>';
  }
  if (hasHalfStar) {
    stars += '<i class="fas fa-star-half-alt"></i>';
  }
  for (let i = 0; i < emptyStars; i++) {
    stars += '<i class="far fa-star"></i>';
  }
  return stars;
}

// Close product modal
function closeProductModal() {
  productModal.classList.remove("show");
}

// Add to cart from modal
function addToCartFromModal(productId) {
  const color = document.querySelector('.color-select').value;
  const size = document.querySelector('.size-select').value;
  const quantity = parseInt(document.querySelector('.qty-input').value);
  addToCart(productId, color, quantity, document.querySelector('.add-to-cart-btn'));
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
      const quantity = 1;
      addToCart(productId, color, quantity, button);
    }
    
    // Product card clicks (open modal)
    if (e.target.closest(".card") && !e.target.closest(".add-to-cart-btn")) {
      const card = e.target.closest(".card");
      const productId = parseInt(card.dataset.productId);
      showProductModal(productId);
    }
    
    // Quantity controls in modal
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
  
  // Product modal close
  if (productModal) {
    productModal.addEventListener("click", function(e) {
      if (e.target === productModal || e.target.closest(".close-modal")) {
        closeProductModal();
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
        colors: document.getElementById("colors").value.split(",").map(c => c.trim()),
        rating: parseFloat(document.getElementById("rating").value) || 4.5,
        description: document.getElementById("description").value.trim() || `Premium ${document.getElementById("name").value.trim()} crafted with the finest materials.`
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
  
  if (buttonElement) {
    const card = buttonElement.closest(".card");
    card.classList.add("added-to-cart");
    setTimeout(() => card.classList.remove("added-to-cart"), 1000);
  }
  
  // Get size if it exists (for modal additions)
  const size = document.querySelector('.size-select')?.value || 'M';
  
  const existingItem = cart.find(item => 
    item.id === productId && 
    item.color === color && 
    item.size === size
  );
  
  if (existingItem) {
    existingItem.qty += quantity;
  } else {
    cart.push({ 
      id: productId, 
      qty: quantity, 
      color, 
      size,
      price: product.price,
      name: product.name,
      image: product.image
    });
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
              <p>${item.color} • ${item.size} • ${item.qty}x $${product.price.toFixed(2)}</p>
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
  if (productCard) {
    productCard.style.transform = "scale(0.9)";
    productCard.style.opacity = "0";
    productCard.style.transition = "all 0.3s ease";
  }
  
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
  feedback.className = "feedback success";
  feedback.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
  document.body.appendChild(feedback);
  
  setTimeout(() => {
    feedback.classList.add("show");
    setTimeout(() => {
      feedback.classList.remove("show");
      setTimeout(() => feedback.remove(), 300);
    }, 2000);
  }, 10);
}
// ... (keep all previous code until the checkout function)

function checkout() {
  if (cart.length === 0) {
    showFeedback("Your cart is empty!");
    return;
  }

  // Show personal details form instead of immediately placing order
  showPersonalDetailsForm();
}

function showPersonalDetailsForm() {
  cartItems.innerHTML = `
    <div class="personal-details-form">
      <h3>Personal Details</h3>
      <form id="checkout-form">
        <div class="form-group">
          <label for="full-name">Full Name</label>
          <input type="text" id="full-name" required>
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" required>
        </div>
        <div class="form-group">
          <label for="phone">Phone Number</label>
          <input type="tel" id="phone" required>
        </div>
        <div class="form-group">
          <label for="address">Shipping Address</label>
          <textarea id="address" rows="3" required></textarea>
        </div>
        <div class="form-group">
          <label for="payment">Payment Method</label>
          <select id="payment" required>
            <option value="">Select payment method</option>
            <option value="credit-card">Credit Card</option>
            <option value="paypal">PayPal</option>
            <option value="cash-on-delivery">Cash on Delivery</option>
          </select>
        </div>
        <div class="form-actions">
          <button type="button" class="adde-to-cart-btn" onclick="showCart()">Back to Cart</button>
          <button type="submit" class="add-to-cart-btn">Place Order</button>
        </div>
      </form>
    </div>
  `;

  // Handle form submission
  document.getElementById('checkout-form').addEventListener('submit', function(e) {
    e.preventDefault();
    placeOrder();
  });
}

function placeOrder() {
  // Get form values
  const fullName = document.getElementById('full-name').value;
  const email = document.getElementById('email').value;
  const phone = document.getElementById('phone').value;
  const address = document.getElementById('address').value;
  const paymentMethod = document.getElementById('payment').value;

  // Validate form
  if (!fullName || !email || !phone || !address || !paymentMethod) {
    showFeedback("Please fill all required fields!");
    return;
  }

  // Create order object
  const order = {
    date: new Date().toISOString(),
    customer: { fullName, email, phone, address },
    paymentMethod,
    items: [...cart],
    total: cart.reduce((sum, item) => {
      const product = products.find(p => p.id === item.id);
      return sum + (product ? product.price * item.qty : 0);
    }, 0)
  };

  // Save order to localStorage (in a real app, you would send this to a server)
  const orders = JSON.parse(localStorage.getItem('orders')) || [];
  orders.push(order);
  localStorage.setItem('orders', JSON.stringify(orders));

  // Clear cart
  cart = [];
  localStorage.removeItem('cart');
  updateCartCount();

  // Show confirmation
  showOrderConfirmation(order);
}

function showOrderConfirmation(order) {
  cartItems.innerHTML = `
    <div class="order-confirmation">
      <div class="confirmation-icon">
        <i class="fas fa-check-circle"></i>
      </div>
      <h3>Order Placed Successfully!</h3>
      <p>Thank you for your purchase, ${order.customer.fullName}!</p>
      <div class="order-summary">
        <p><strong>Order Date:</strong> ${new Date(order.date).toLocaleDateString()}</p>
        <p><strong>Order Total:</strong> $${order.total.toFixed(2)}</p>
        <p><strong>Payment Method:</strong> ${formatPaymentMethod(order.paymentMethod)}</p>
        <p><strong>Shipping to:</strong> ${order.customer.address}</p>
      </div>
      <button class="add-to-cart-btn" onclick="closeCart(); showFeedback('Thank you for your order!')">
        Continue Shopping
      </button>
    </div>
  `;
}

function formatPaymentMethod(method) {
  switch(method) {
    case 'credit-card': return 'Credit Card';
    case 'paypal': return 'PayPal';
    case 'cash-on-delivery': return 'Cash on Delivery';
    default: return method;
  }
}

// ... (rest of the existing code)
function setupStyleAdvisor() {
  const steps = document.querySelectorAll('.advisor-step');
  const results = document.querySelector('.advisor-results');
  const restartBtn = document.getElementById('restart-advisor');
  const resultImage = document.querySelector('.result-image');
  const resultDetails = document.querySelector('.result-details');

  let currentStep = 1;
  let selections = {};

  // Handle option selection
  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const step = this.closest('.advisor-step');
      const stepNumber = parseInt(step.dataset.step);
      const option = this.dataset.option;

      // Store selection
      if (stepNumber === 1) selections.occasion = option;
      if (stepNumber === 2) selections.fit = option;
      if (stepNumber === 3) selections.fabric = option;

      // Add animation
      this.classList.add('selected');

      setTimeout(() => {
        this.classList.remove('selected');
        step.classList.remove('active');

        if (stepNumber < 3) {
          // Go to next step
          const nextStep = document.querySelector(`.advisor-step[data-step="${stepNumber + 1}"]`);
          if (nextStep) {
            nextStep.classList.add('active');
            currentStep = stepNumber + 1;
          }
        } else {
          // Show final result
          showResults();
        }
      }, 500);
    });
  });

  // Show recommendation based on selections
  function showResults() {
    let recommendation = {
      name: '',
      description: '',
      image: '',
      price: ''
    };

    const { occasion, fit, fabric } = selections;

    // Determine base recommendation
    if (occasion === 'formal') {
      if (fit === 'slim') {
        recommendation = {
          name: 'Executive Slim Fit',
          description: 'A sharp, modern silhouette perfect for the boardroom. Features a tapered waist, higher armholes, and narrow lapels for a contemporary professional look.',
          price: '$1295',
          image: 'black.jpg'
        };
      } else if (fit === 'classic') {
        recommendation = {
          name: 'Boardroom Classic',
          description: 'Timeless traditional fit with structured shoulders and a comfortable drape. The gold standard for conservative business environments.',
          price: '$1195',
          image: 'blue.jpg'
        };
      } else {
        recommendation = {
          name: 'Director Modern Fit',
          description: 'Balanced proportions with a slightly shaped waist. Ideal for executives who want a polished look with contemporary details.',
          price: '$1350',
          image: 'grey.jpg'
        };
      }
    } else if (occasion === 'wedding') {
      recommendation = {
        name: 'Tuxedo Collection',
        description: 'Our finest formalwear with satin lapel facings and jetted pockets. Perfect for the groom or wedding guests seeking timeless elegance.',
        price: '$1495',
        image: 'charcoal.png'
      };
    } else if (occasion === 'evening') {
      recommendation = {
        name: 'Midnight Velvet',
        description: 'Luxury black velvet dinner jacket with peak lapels. Makes a bold statement at any evening affair.',
        price: '$1650',
        image: 'suit.jpg'
      };
    } else {
      recommendation = {
        name: 'Cocktail Hour Blazer',
        description: 'Slim-fit unstructured blazer with minimal padding for effortless style at social gatherings.',
        price: '$895',
        image: 'excutive.jpg'
      };
    }

    // Adjust price and description based on fabric
    let basePrice = parseInt(recommendation.price.replace(/\D/g, '')) || 0;

    if (fabric === 'cashmere') {
      basePrice += 200;
      recommendation.description += ' Crafted from our premium cashmere-wool blend for exceptional softness and drape.';
    } else if (fabric === 'linen') {
      basePrice -= 100;
      recommendation.description += ' Made with our lightweight linen-wool blend for superior breathability.';
    } else {
      recommendation.description += ' Constructed from our signature Super 150s wool for year-round comfort.';
    }

    recommendation.price = `$${basePrice}`;

    // Update result UI
    resultImage.style.backgroundImage = `url(${recommendation.image})`;
    resultDetails.innerHTML = `
      <h4>${recommendation.name}</h4>
      <p>${recommendation.description}</p>
      <p><strong>Price:</strong> ${recommendation.price}</p>
      <p><strong>Best for:</strong> ${capitalize(occasion)} events</p>
      <p><strong>Fit:</strong> ${capitalize(fit)}</p>
      <p><strong>Fabric:</strong> ${capitalize(fabric)}</p>
    `;

    results.classList.add('active');
  }

  // Restart advisor
  restartBtn.addEventListener('click', function () {
    results.classList.remove('active');
    steps.forEach(step => step.classList.remove('active'));
    document.querySelector('.advisor-step[data-step="1"]').classList.add('active');
    currentStep = 1;
    selections = {};
  });

  // Helper to capitalize
  function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';
  }
}

// Initialize the advisor
setupStyleAdvisor();

// Initialize the app
init();