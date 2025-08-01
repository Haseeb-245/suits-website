let adminProducts = JSON.parse(localStorage.getItem("admin_products")) || [];
let jsonProducts = [];

// Load both product sources
Promise.all([
    fetch("products.json").then(res => res.json()),
    JSON.parse(localStorage.getItem("admin_products")) || []
])
.then(([jsonData, adminData]) => {
    jsonProducts = jsonData;
    adminProducts = adminData;
    renderAdminProducts();
});
// Form submission
document.getElementById("product-form").onsubmit = e => {
    e.preventDefault();
    const product = {
        id: Date.now(),
        name: document.getElementById("name").value,
        price: +document.getElementById("price").value,
        image: document.getElementById("image").value,
        colors: document.getElementById("colors").value.split(",").map(c => c.trim())
    };
    adminProducts.push(product);
    localStorage.setItem("admin_products", JSON.stringify(adminProducts));
    renderAdminProducts();
    e.target.reset();
    
    // Show success feedback
    const button = e.target.querySelector("button");
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> Product Added!';
    button.style.background = "var(--success)";
    
    setTimeout(() => {
        button.innerHTML = originalText;
        button.style.background = "";
    }, 2000);
};

function renderAdminProducts() {
    const list = document.getElementById("admin-products");
    list.innerHTML = "";
    
    // Combine both product sources
    const allProducts = [...jsonProducts, ...adminProducts];
    
    if (allProducts.length === 0) {
        list.innerHTML = '<div class="empty">No products available</div>';
        return;
    }
    
    allProducts.forEach(product => {
        const productCard = document.createElement("div");
        productCard.className = "product-card";
        productCard.innerHTML = `
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" onerror="this.onerror=null;this.src='https://via.placeholder.com/200?text=No+Image'">
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="price">$${product.price.toFixed(2)}</p>
                <div class="colors">
                    ${product.colors.map(color => `
                        <span class="color-badge">${color}</span>
                    `).join("")}
                </div>
                ${product.source === 'json' ? 
                    '<p class="source">(Default Product)</p>' : 
                    `<button onclick="deleteProduct(${product.id}, this)" class="delete-btn">
                        <i class="fas fa-trash"></i> Delete
                    </button>`}
            </div>
        `;
        list.appendChild(productCard);
    });
}

function deleteProduct(id, element) {
    if (!confirm("Are you sure you want to delete this product?")) return;
    
    // Only allow deletion of admin-added products
    adminProducts = adminProducts.filter(p => p.id !== id);
    localStorage.setItem("admin_products", JSON.stringify(adminProducts));

    function deleteProduct(id) {
    if (!confirm("Are you sure you want to delete this product?")) return;
    
    // Filter out the product to delete
    adminProducts = adminProducts.filter(product => product.id !== id);
    
    // Update localStorage
    localStorage.setItem("admin_products", JSON.stringify(adminProducts));
    
    // Re-render products
    renderAdminProducts();
    
    // Show feedback
    alert("Product deleted successfully!");
}
    
    // Add animation to removed item
    const productCard = element.closest(".product-card");
    productCard.style.transform = "scale(0.9)";
    productCard.style.opacity = "0";
    productCard.style.transition = "all 0.3s ease";
    
    setTimeout(() => {
        renderAdminProducts();
    }, 300);
}

// Initial render
renderAdminProducts();