// Global State
let cartItems = [];
let wishlistItems = []; 
let currentProductId = 100; // Starting ID for dynamic products
let currentHeroSlide = 0;
const totalHeroSlides = 3;
// Global IntersectionObserver for scroll reveal so rendering functions can access it
let observer; 
const offerMessages = [
    "✨ FLASH SALE: Get 25% off all electronics today!",
    "🚚 FREE SHIPPING on all orders over $50. Shop now!",
    "🥕 Fresh Produce Deals: Up to 40% off vegetables and fruits!",
    "🎁 Exclusive Loyalty Rewards: Log in to see your special discount!"
];
let currentOfferIndex = 0;
let countdownInterval;
let currentAccountView = 'dashboard'; // Default view for account page

// DOM Element caches (assigned inside DOMContentLoaded for safety)
let cartCountElement;
let wishlistCountElement;
let cartItemsContainer;
let emptyCartMessage;
let toastNotification;
let toastProductName;
let logoutModal;
let pdpContentContainer;
let toastTimeout;

// --- Bulk Pricing Utilities ---
function ensureBulkPricing(product) {
    const defaultTiers = [
        { minQuantity: 1, discountPercent: 0 },
        { minQuantity: 5, discountPercent: 10 },
        { minQuantity: 10, discountPercent: 15 },
        { minQuantity: 25, discountPercent: 20 }
    ];
    if (!product) return defaultTiers;
    if (!product.bulkPricing || !Array.isArray(product.bulkPricing) || product.bulkPricing.length === 0) {
        product.bulkPricing = defaultTiers;
    }
    // Sort tiers ascending by minQuantity to ensure correct evaluation
    product.bulkPricing.sort((a, b) => a.minQuantity - b.minQuantity);
    return product.bulkPricing;
}

function enrichBulkPricingData() {
    // Apply default bulkPricing to all products if missing
    getAllProducts().forEach(p => ensureBulkPricing(p));
    // Deal products may not be part of getAllProducts; enrich separately
    if (Array.isArray(dealProducts)) {
        dealProducts.forEach(p => ensureBulkPricing(p));
    }
}

function getBulkDiscountPercent(product, quantity) {
    const tiers = ensureBulkPricing(product);
    let percent = 0;
    for (const tier of tiers) {
        if (quantity >= tier.minQuantity) {
            percent = tier.discountPercent || 0;
        } else {
            break;
        }
    }
    return percent;
}

function calculateBulkPrice(product, quantity) {
    const qty = Math.max(1, parseInt(quantity || 1, 10));
    const unitPrice = product.price || product.oldPrice || 0;
    const discount = getBulkDiscountPercent(product, qty);
    const discountedUnit = unitPrice * (1 - discount / 100);
    return +(discountedUnit * qty).toFixed(2);
}


// --- Simulated Product Data (Now uses real image URLs) ---
const categoryProducts = {
    vegetables: [
        // 💡 Image URLs added here
        { id: currentProductId++, name: "Organic Kale Bunch", price: 3.99, unit: "bunch", imageUrl: "https://images.unsplash.com/photo-1582145722842-3c8ce65b79b3?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8b3JhbmdlJTIwa2FsZSUyMGJ1bmNofGVufDB8fDB8fHww", imageColor: "10B981", tag: "FRESH", brand: "Farm Fresh", rating: 5 },

        { id: currentProductId++, name: "Red Potatoes", price: 4.50, unit: "2kg bag", imageUrl: "https://images.unsplash.com/photo-1709963421370-98407fa9126e?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8cmVkJTIwcG90YXRvZXN8ZW58MHx8MHx8fDA%3D", imageColor: "FF5733", tag: "SALE", brand: "Green Harvest", rating: 4 },
        { id: currentProductId++, name: "Bell Pepper Mix", price: 6.99, unit: "pack", imageUrl: "https://images.unsplash.com/photo-1629265286250-eb8cbc60e357?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8YmVsbCUyMHBlcHBlciUyMG1peHxlbnwwfHwwfHx8MA%3D%3D", imageColor: "FFC300", tag: "NEW", brand: "Local Produce", rating: 5 },
        { id: currentProductId++, name: "Zucchini Squash", price: 1.25, unit: "ea", imageUrl: "https://images.unsplash.com/photo-1634467525024-928e5427a8e4?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8enVjaGlubml8ZW58MHx8MHx8fDA%3D", imageColor: "A8C64E", tag: "", brand: "Farm Fresh", rating: 3 },
        { id: currentProductId++, name: "Carrot Sticks", price: 2.50, unit: "bag", imageUrl: "https://images.unsplash.com/photo-1742887214150-31a6c3d8acb8?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGNhcnJvdCUyMHN0aWNrc3xlbnwwfHwwfHx8MA%3D%3D", imageColor: "FF8C00", tag: "", brand: "Green Harvest", rating: 4 },
        { id: currentProductId++, name: "Arugula Leaves", price: 4.20, unit: "bag", imageUrl: "https://images.unsplash.com/photo-1566109659994-49335cc6f070?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fGFydWgsbm9sYSUyMGxlYXZlc3xlbnwwfHwwfHx8MA%3D%3D", imageColor: "006400", tag: "NEW", brand: "Local Produce", rating: 5 }
    ],
    fruits: [
        { id: currentProductId++, name: "Organic Banana", price: 0.79, unit: "lb", imageUrl: "https://images.unsplash.com/photo-1668762924684-a9753a0a887c?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8b3JnYW5pYyUyMGJhbmFuYXxlbnwwfHwwfHx8MA%3D%3D", imageColor: "FACC15", tag: "FRESH", brand: "Farm Fresh", rating: 4 },
        { id: currentProductId++, name: "Hass Avocados", price: 2.99, unit: "ea", imageUrl: "https://images.unsplash.com/photo-1616485828923-2640a1ee48b4?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YXZhY2Fkb3N8ZW58MHx8MHx8fDA%3D", imageColor: "386641", tag: "HOT", brand: "Tropical Delights", rating: 5 },
        { id: currentProductId++, name: "Strawberries", price: 5.49, unit: "box", imageUrl: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8c3RyYXdiZXJyaWVzfGVufDB8fDB8fHww", imageColor: "DC2626", tag: "SALE", brand: "Berry Good", rating: 4 },
        { id: currentProductId++, name: "Green Grapes", price: 3.80, unit: "lb", imageUrl: "https://images.unsplash.com/photo-1660139890961-b1ea4738cf16?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Z3JlZW4lMjBncmFwZXN8ZW58MHx8MHx8fDA%3D", imageColor: "4CAF50", tag: "", brand: "Tropical Delights", rating: 3 }
    ],
    dairy: [
        { id: currentProductId++, name: "Almond Milk", price: 3.49, unit: "carton", imageUrl: "https://images.unsplash.com/photo-1601436423474-51738541c1b1?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YWxtb25kJTIwbWlsa3xlbnwwfHwwfHx8MA%3D%3D", imageColor: "60A5FA", tag: "NEW", brand: "Dairy Co", rating: 5 },
        { id: currentProductId++, name: "Farm Fresh Eggs", price: 4.99, unit: "dozen", imageUrl: "https://images.unsplash.com/photo-1664339307400-9c22e5f44496?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8ZmFybSUyMGZyZXNoJTIwZWdnc3xlbnwwfHwwfHx8MA%3D%3D", imageColor: "FCD34D", tag: "", brand: "Farm Fresh", rating: 4 },
        { id: currentProductId++, name: "Greek Yogurt", price: 1.25, unit: "ea", imageUrl: "https://images.unsplash.com/photo-1562114808-b4b33cf60f4f?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8Z3JlZWslMjB5b2d1cnR8ZW58MHx8MHx8fDA%3D", imageColor: "E0F2F1", tag: "BEST SELLER", brand: "Yogurt Plus", rating: 5 }
    ],
    fashion: [
        { id: currentProductId++, name: "Men's Slim-Fit Jeans", price: 49.99, unit: "ea", imageUrl: null, imageColor: "1E3A8A", tag: "POPULAR", brand: "StyleCraft", rating: 4 },
        { id: currentProductId++, name: "Summer Floral Dress", price: 75.00, unit: "ea", imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=300&fit=crop&crop=center", imageColor: "EC4899", tag: "NEW", brand: "Chic Wear", rating: 5 },
        { id: currentProductId++, name: "Leather Boots", price: 120.00, unit: "pair", imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=300&fit=crop&crop=center", imageColor: "57534E", tag: "", brand: "Footwear Pro", rating: 4 },
        { id: currentProductId++, name: "Sportswear Tee", price: 29.50, unit: "ea", imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop&crop=center", imageColor: "06B6D4", tag: "20% OFF", brand: "ActiveFit", rating: 3 }
    ],
    electronics: [
        { id: currentProductId++, name: "4K Smart TV 55\"", price: 799.00, unit: "ea", imageUrl: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=300&fit=crop&crop=center", imageColor: "374151", tag: "DEAL", brand: "TechGiant", rating: 5 },
        { id: currentProductId++, name: "Noise Cancelling Earbuds", price: 89.99, unit: "pair", imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=300&fit=crop&crop=center", imageColor: "6366F1", tag: "BEST SELLER", brand: "SoundBliss", rating: 5 },
        { id: currentProductId++, name: "Portable Bluetooth Speaker", price: 55.00, unit: "ea", imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=300&fit=crop&crop=center", imageColor: "FBBF24", tag: "NEW", brand: "AudioLux", rating: 4 },
        { id: currentProductId++, name: "Ergonomic Mouse", price: 35.99, unit: "ea", imageUrl: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=300&fit=crop&crop=center", imageColor: "10B981", tag: "", brand: "PC Essentials", rating: 4 }
    ],
    household: [
        { id: currentProductId++, name: "Detergent Pods", price: 18.99, unit: "pack", imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&crop=center", imageColor: "F472B6", tag: "SALE", brand: "Clean Home", rating: 4 },
        { id: currentProductId++, name: "All-Purpose Cleaner", price: 6.50, unit: "bottle", imageUrl: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400&h=300&fit=crop&crop=center", imageColor: "33B5E5", tag: "FRESH", brand: "Green Clean", rating: 5 },
        { id: currentProductId++, name: "Paper Towel Roll", price: 9.99, unit: "pack", imageUrl: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400&h=300&fit=crop&crop=center", imageColor: "F0F0F0", tag: "", brand: "Paper Goods Inc", rating: 3 }
    ]
};
const categoryNames = {
    vegetables: "Fresh Vegetables & Greens",
    fruits: "Fresh Fruits & Berries",
    dairy: "Milk, Eggs & Dairy",
    fashion: "Apparel & Accessories",
    electronics: "Consumer Electronics",
    household: "Household Essentials"
};

// --- Simulated Deals Data ---
const dealProducts = [
    { id: 901, name: "Luxury Winter Coat", oldPrice: 199.99, price: 129.99, discount: 35, imageUrl: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400&h=300&fit=crop&crop=center", imageColor: "6B7280", category: "Fashion", brand: "StyleCraft", rating: 4 },
    { id: 902, name: "Smart Coffee Maker", oldPrice: 89.00, price: 59.99, discount: 32, imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop&crop=center", imageColor: "D1D5DB", category: "Electronics", brand: "HomeTech", rating: 5 },
    { id: 903, name: "Organic Honey Jar", oldPrice: 15.50, price: 9.99, discount: 35, imageUrl: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=300&fit=crop&crop=center", imageColor: "FBBF24", category: "Groceries", brand: "Farm Fresh", rating: 5 },
    { id: 904, name: "Yoga Mat Pro", oldPrice: 45.00, price: 29.99, discount: 33, imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop&crop=center", imageColor: "A78BFA", category: "Household", brand: "ActiveFit", rating: 4 },
    { id: 905, name: "4-Piece Towel Set", oldPrice: 35.00, price: 21.00, discount: 40, imageUrl: "https://images.unsplash.com/photo-1631889993959-41b4e9c6e3c5?w=400&h=300&fit=crop&crop=center", imageColor: "06B6D4", category: "Household", brand: "Clean Home", rating: 4 },
    { id: 906, name: "Bluetooth Speaker Mini", oldPrice: 39.99, price: 24.99, discount: 38, imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=300&fit=crop&crop=center", imageColor: "1F2937", category: "Electronics", brand: "AudioLux", rating: 5 }
];

// --- Data Enrichment: marginPercent (simulated 20-50%) ---
function enrichMarginData() {
    // Add marginPercent to category products
    for (const key in categoryProducts) {
        const arr = categoryProducts[key] || [];
        arr.forEach(p => {
            if (typeof p.marginPercent !== 'number') {
                p.marginPercent = Math.floor(20 + Math.random() * 31); // 20-50
            }
        });
    }
    // Add marginPercent to deal products
    dealProducts.forEach(p => {
        if (typeof p.marginPercent !== 'number') {
            p.marginPercent = Math.floor(20 + Math.random() * 31); // 20-50
        }
    });
}

// --- Filtered Product Collections ---
function getAllProducts() {
    const all = [];
    for (const key in categoryProducts) {
        const arr = categoryProducts[key] || [];
        arr.forEach(p => all.push({ ...p, source: 'category', categoryKey: key, category: categoryNames[key] || key }));
    }
    dealProducts.forEach(p => all.push({ ...p, source: 'deal', categoryKey: (p.category || '').toLowerCase(), category: p.category }));
    return all;
}

// Deterministic simulated salesCount using product id
function computeSalesCount(product) {
    const id = product.id || 0;
    return 30 + (id % 120);
}

const bestSellerProducts = getAllProducts().filter(p => (p.rating || 0) >= 4.5);
const topRatedProducts = getAllProducts()
    .map(p => ({ ...p, salesCount: computeSalesCount(p) }))
    .filter(p => (p.rating || 0) >= 4 && p.salesCount >= 50);

// --- Utility Functions ---

function formatCurrency(amount) {
    return `$${amount.toFixed(2)}`;
}

function updateWishlistCount() {
    if (wishlistCountElement) {
        wishlistCountElement.textContent = wishlistItems.length;
        if (wishlistItems.length > 0) {
            wishlistCountElement.classList.remove('scale-90');
            wishlistCountElement.classList.add('scale-105');
        } else {
            wishlistCountElement.classList.remove('scale-105');
            wishlistCountElement.classList.add('scale-90');
        }
    }
}

function updateCartCount() {
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCountElement) {
        cartCountElement.textContent = totalItems;
        if (totalItems > 0) {
            cartCountElement.classList.add('scale-150');
        } else {
            cartCountElement.classList.remove('scale-150');
        }
        setTimeout(() => {
            cartCountElement.classList.remove('scale-150');
        }, 300);
    }
    return totalItems;
}

// ... (Rest of utility functions: startOfferCarousel, startHeroCarousel, startDealsCountdown) ...

function showToast(title, message, isError = false) {
    if (toastTimeout) {
        clearTimeout(toastTimeout);
    }
    if (toastNotification) {
        toastNotification.classList.remove('bg-primary', 'bg-accent', 'bg-secondary-accent');
        if (isError) {
            toastNotification.classList.add('bg-secondary-accent');
        } else {
            toastNotification.classList.add('bg-accent');
        }

        toastNotification.querySelector('p:first-child').textContent = title;
        toastProductName.textContent = message;
        
        toastNotification.classList.remove('hidden', 'toast-exit-active', 'toast-exit');
        toastNotification.classList.add('toast-enter-active');

        toastTimeout = setTimeout(() => {
            hideToast();
        }, 3000);
    }
}

function hideToast() {
    if (toastNotification) {
        toastNotification.classList.add('toast-exit-active');
        toastNotification.classList.remove('toast-enter-active');

        setTimeout(() => {
            toastNotification.classList.add('hidden');
            toastNotification.classList.remove('toast-exit-active');
        }, 500);
    }
}

function toggleWishlist(productId) {
    const button = document.querySelector(`[onclick="toggleWishlist(${productId})"]`);
    const productCard = document.getElementById(`product-card-${productId}`);
    let productName = "Item"; 
    
    if (productCard) {
        const titleElement = productCard.querySelector('h4');
        productName = titleElement ? titleElement.textContent.trim() : productName;
    }
    
    const index = wishlistItems.indexOf(productId);
    if (index > -1) {
        wishlistItems.splice(index, 1);
        if (button) button.classList.remove('wishlist-active');
        showToast("Removed from Wishlist", productName);
    } else {
        wishlistItems.push(productId);
        if (button) button.classList.add('wishlist-active');
        showToast("Added to Wishlist!", productName);
    }
    
    updateWishlistCount();
}

function addToCart(arg1, arg2, arg3) {
    // New signature: (productId:number, quantity:number)
    // Legacy signature: (productName:string, price:number) or (productName:string, price:number, quantity:number)
    let product = null;
    let quantity = 1;
    if (typeof arg1 === 'number') {
        const productId = arg1;
        quantity = Math.max(1, parseInt(arg2 || 1, 10));
        product = findProductById(productId);
    } else if (typeof arg1 === 'string') {
        const productName = arg1;
        quantity = Math.max(1, parseInt(arg3 || 1, 10));
        // Try to find by name; fallback builds a lightweight product
        product = findProductByName ? findProductByName(productName) : null;
        if (!product) {
            product = { id: Date.now(), name: productName, price: arg2 || 0, unit: '', imageUrl: '', imageColor: (arg2 || 0) > 50 ? '212529' : '00B894' };
        }
    }

    if (!product) {
        console.error('addToCart: product not found or invalid');
        return;
    }

    enrichBulkPricingData();
    const totalPrice = calculateBulkPrice(product, quantity);
    const effectiveUnit = +(totalPrice / quantity).toFixed(2);

    // Cart item keying by product id when available; fallback to name
    let item = cartItems.find(i => (product.id ? i.productId === product.id : i.name === product.name));
    
    if (item) {
        item.quantity += quantity;
        // Re-evaluate unit price based on new quantity
        const updatedTotal = calculateBulkPrice(product, item.quantity);
        item.price = +(updatedTotal / item.quantity).toFixed(2);
    } else {
        cartItems.push({ 
            id: Date.now(), 
            productId: product.id || null,
            name: product.name, 
            price: effectiveUnit, 
            quantity: quantity,
            unit: product.unit || '',
            imageUrl: product.imageUrl || '',
            imageColor: product.imageColor || ((effectiveUnit > 50) ? '212529' : '00B894')
        });
    }
    
    updateCartCount();
    showToast("Item Added to Cart!", `${quantity} x ${product.name}`);
    renderCart();
}

// Update quantity for a cart item and recompute pricing with bulk tiers
function setCartItemQuantity(itemId, newQuantity) {
    const qty = Math.max(0, Math.min(500, parseInt(newQuantity || '1', 10)));
    const idx = cartItems.findIndex(i => i.id === itemId);
    if (idx === -1) return;
    if (qty === 0) {
        cartItems.splice(idx, 1);
    } else {
        const item = cartItems[idx];
        const baseProduct = item.productId ? findProductById(item.productId) : (findProductByName ? findProductByName(item.name) : null);
        const product = baseProduct || { id: item.productId || null, name: item.name, price: item.price, unit: item.unit, imageUrl: item.imageUrl, imageColor: item.imageColor };
        enrichBulkPricingData();
        const total = calculateBulkPrice(product, qty);
        item.quantity = qty;
        item.price = +(total / qty).toFixed(2);
    }
    updateCartCount();
    renderCart();
}

function incCartItem(itemId) {
    const input = document.getElementById(`cart-qty-${itemId}`);
    const current = parseInt((input && input.value) || '1', 10);
    const next = Math.min(500, (isNaN(current) ? 1 : current) + 1);
    setCartItemQuantity(itemId, next);
}

function decCartItem(itemId) {
    const input = document.getElementById(`cart-qty-${itemId}`);
    const current = parseInt((input && input.value) || '1', 10);
    const next = Math.max(0, (isNaN(current) ? 1 : current) - 1);
    setCartItemQuantity(itemId, next);
}

function removeFromCart(itemId) {
    const idx = cartItems.findIndex(i => i.id === itemId);
    if (idx > -1) {
        const name = cartItems[idx].name;
        cartItems.splice(idx, 1);
        showToast('Removed from Cart', name);
        updateCartCount();
        renderCart();
    }
}

function renderCart() {
    if (!cartItemsContainer || !emptyCartMessage) return;
    const hasItems = cartItems.length > 0;
    emptyCartMessage.classList.toggle('hidden', hasItems);
    cartItemsContainer.innerHTML = hasItems ? '' : emptyCartMessage.outerHTML;

    if (!hasItems) {
        const summaryCount = document.getElementById('summary-item-count');
        const summarySubtotal = document.getElementById('summary-subtotal');
        if (summaryCount) summaryCount.textContent = '0';
        if (summarySubtotal) summarySubtotal.textContent = formatCurrency(0);
        lucide.createIcons();
        return;
    }

    enrichBulkPricingData();
    const itemCards = cartItems.map(item => {
        const colorHex = (item.imageColor ? `#${item.imageColor}` : '#e5e7eb');
        const imageMarkup = item.imageUrl
            ? `<img src="${item.imageUrl}" alt="${item.name}" class="w-20 h-20 object-cover rounded-lg" onerror="this.onerror=null; this.outerHTML='\x3cdiv class=\x22w-20 h-20 rounded-lg\x22 style=\x22background-color:${colorHex}\x22\x3e\x3c/div\x3e'" />`
            : `<div class="w-20 h-20 rounded-lg" style="background-color:${colorHex}"></div>`;
        const subtotal = +(item.price * item.quantity).toFixed(2);
        return `
        <div class="bg-white p-4 rounded-xl shadow-lg border border-card-border flex items-center justify-between">
            <div class="flex items-center space-x-4">
                ${imageMarkup}
                <div>
                    <h4 class="font-semibold text-primary">${item.name}</h4>
                    <p class="text-sm text-gray-500">Per-unit: ${formatCurrency(item.price)}</p>
                </div>
            </div>
            <div class="flex items-center space-x-4">
                <div class="flex items-center space-x-2">
                    <button class="w-8 h-8 rounded-full bg-gray-200 text-primary font-bold" onclick="decCartItem(${item.id})">-</button>
                    <input id="cart-qty-${item.id}" type="number" min="1" max="500" value="${item.quantity}" class="w-16 p-2 border rounded-md text-center" oninput="setCartItemQuantity(${item.id}, this.value)" />
                    <button class="w-8 h-8 rounded-full bg-gray-200 text-primary font-bold" onclick="incCartItem(${item.id})">+</button>
                </div>
                <div class="text-right">
                    <p class="font-semibold text-primary">${formatCurrency(subtotal)}</p>
                    <button class="text-sm text-secondary-accent hover:text-red-700" onclick="removeFromCart(${item.id})">Remove</button>
                </div>
            </div>
        </div>`;
    }).join('');

    cartItemsContainer.innerHTML = itemCards;

    // Update order summary
    const summaryCount = document.getElementById('summary-item-count');
    const summarySubtotal = document.getElementById('summary-subtotal');
    const totalQty = cartItems.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = cartItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    if (summaryCount) summaryCount.textContent = String(totalQty);
    if (summarySubtotal) summarySubtotal.textContent = formatCurrency(subtotal);

    lucide.createIcons();
}

function findProductById(productId) {
    for (const category in categoryProducts) {
        const product = categoryProducts[category].find(p => p.id === productId);
        if (product) return { ...product, category: categoryNames[category] || category };
    }
    const dealProduct = dealProducts.find(p => p.id === productId);
    if (dealProduct) return { ...dealProduct, category: dealProduct.category };
    
    // Check placeholder products for images on the home page (if product wasn't found by ID)
    if (productId === 1000) return { id: 1000, name: "Fresh Mango", price: 99, imageColor: "FFD700", brand: "Tropical Delights", category: "Fresh Fruits", rating: 5, oldPrice: 120, imageUrl: "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?q=80&w=1035&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" };
    if (productId === 1001) return { id: 1001, name: "Fresh Orange", price: 29, imageColor: "FFA500", brand: "Tropical Delights", category: "Fresh Fruits", rating: 4, oldPrice: 40, imageUrl: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8b3JhbmdlfGVufDB8fDB8fHww" };
    if (productId === 1002) return { id: 1002, name: "Sweet Pineapple", price: 56, imageColor: "8B4513", brand: "Tropical Delights", category: "Fresh Fruits", rating: 5, oldPrice: 65, imageUrl: "https://images.unsplash.com/photo-1550828520-4cb496926fc9?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8cGluZWFwcGxlfGVufDB8fDB8fHww" };
    if (productId === 1003) return { id: 1003, name: "Juicy Blueberry", price: 19, imageColor: "4682B4", brand: "Berry Good", category: "Fresh Fruits", rating: 4, oldPrice: 22, imageUrl: "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Ymx1ZWJlcnJ5fGVufDB8fDB8fHww" };
    if (productId === 1004) return { id: 1004, name: "Healthy Lychee", price: 25, imageColor: "FFC0CB", brand: "Tropical Delights", category: "Fresh Fruits", rating: 5, oldPrice: 30, imageUrl: "https://plus.unsplash.com/premium_photo-1722961407854-fcc0004b4929?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8bHljaGVlfGVufDB8fDB8fHww" };

    return null;
}

function findProductByName(productName) {
    const name = (productName || '').toLowerCase();
    for (const category in categoryProducts) {
        const product = categoryProducts[category].find(p => (p.name || '').toLowerCase() === name);
        if (product) return { ...product, category: categoryNames[category] || category };
    }
    const dealProduct = dealProducts.find(p => (p.name || '').toLowerCase() === name);
    if (dealProduct) return { ...dealProduct, category: dealProduct.category };
    return null;
}

function generateStarRating(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += `<i data-lucide="star" class="w-4 h-4 fill-yellow-400 text-yellow-400"></i>`;
        } else {
            stars += `<i data-lucide="star" class="w-4 h-4 text-gray-300"></i>`;
        }
    }
    return stars;
}

function renderProductPage(productName) {
    const product = findProductByName(productName);
    if (product) {
        navigateTo('pdp', product.id);
    } else {
        console.error(`Product not found: ${productName}`);
    }
}

function addToCartFromPDP(productName, price) {
    // Legacy handler: redirect to new addToCart using product lookup
    const product = findProductByName(productName);
    const quantityInput = document.getElementById('pdp-quantity');
    const quantity = quantityInput ? Math.max(1, parseInt(quantityInput.value, 10)) : 1;
    if (!product) {
        console.error('addToCartFromPDP: product not found');
        return;
    }
    addToCart(product.id, quantity);
}

// ... (Rest of Account Management Functions: showLogoutModal, hideLogoutModal, logoutUser, confirmLogout, setAccountView) ...

function renderCategoryPage(categoryKey) {
    const container = document.getElementById('category-products-container');
    const header = document.getElementById('category-page-header');
    const banner = document.getElementById('category-banner-container');
    
    if (!container || !header || !banner) return; 

    const products = categoryProducts[categoryKey] || [];
    const categoryName = categoryNames[categoryKey] || categoryKey.toUpperCase();
    
    header.innerHTML = `
        <h2 class="text-3xl font-bold text-primary">${categoryName} (${products.length} items)</h2>
        <div class="flex justify-end items-center text-sm text-gray-600 space-x-4 mt-2">
            <span>Sort By: </span>
            <select class="p-2 border border-card-border rounded-md">
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Best Rating</option>
                <option>Newest Arrivals</option>
            </select>
        </div>
    `;
    
    banner.innerHTML = `
        <div class="p-8 bg-white rounded-xl shadow-lg border-2 border-accent">
            <p class="text-2xl font-bold text-primary">Explore our exclusive selection of <span class="text-accent">${categoryName}</span>!</p>
            <p class="text-gray-600 mt-2">Hand-picked items with our quality guarantee.</p>
        </div>
    `;

    // Generate product cards with original category-specific styling
    enrichBulkPricingData();
    container.innerHTML = products.map((p, i) => {
        ensureBulkPricing(p);
        const colorHex = p.imageColor ? `#${p.imageColor}` : '#e5e7eb';
        const imageElement = p.imageUrl 
            ? `<img src="${p.imageUrl}" alt="${p.name}" class="w-full h-48 object-cover rounded-lg" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-full h-48 rounded-lg\\' style=\\'background-color:${colorHex}\\'></div>'" />`
            : `<div class="w-full h-48 rounded-lg" style="background-color:${colorHex}"></div>`;
        
        return `
            <div class="bg-white p-4 rounded-xl shadow-lg border border-card-border reveal">
                <div class="relative">
                    ${imageElement}
                    ${p.tag ? `<span class="absolute top-2 left-2 bg-accent text-white text-xs px-2 py-1 rounded-full">${p.tag}</span>` : ''}
                    <button class="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center ${wishlistItems.includes(p.id) ? 'wishlist-active' : ''}" onclick="toggleWishlist(${p.id})">
                        <i data-lucide="heart" class="w-4 h-4"></i>
                    </button>
                </div>
                <div class="mt-4">
                    <h4 class="font-semibold text-primary">${p.name}</h4>
                    <p class="text-sm text-gray-500">${p.brand || 'Brand'}</p>
                    <div class="flex items-center mt-2">
                        ${generateStarRating(p.rating || 4)}
                        <span class="text-sm text-gray-500 ml-2">(${computeSalesCount(p)})</span>
                    </div>
                    <div class="flex items-center justify-between mt-4">
                        <div>
                            <span class="text-lg font-bold text-primary">${formatCurrency(p.price)}</span>
                            <span class="text-sm text-gray-500">/${p.unit || 'ea'}</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <button class="w-8 h-8 rounded-full bg-gray-200 text-primary font-bold" onclick="decCategoryQty(${p.id})">-</button>
                            <input id="category-qty-${p.id}" type="number" min="1" max="500" value="1" class="w-16 p-2 border rounded-md text-center" oninput="onCategoryQtyChange(${p.id}, this.value)" />
                            <button class="w-8 h-8 rounded-full bg-gray-200 text-primary font-bold" onclick="incCategoryQty(${p.id})">+</button>
                            <button class="bg-accent text-white px-4 py-2 rounded-lg hover:bg-secondary-accent transition-colors" onclick="addCategoryToCart(${p.id})">
                                <i data-lucide="shopping-cart" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    // Re-initialize icons and observer for dynamic content
    lucide.createIcons();
    // Safely observe newly added elements if observer is ready
    if (observer) {
        document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
    }
}

function onCategoryQtyChange(productId, qty) {
    const product = findProductById(productId);
    const quantity = Math.max(1, parseInt(qty || '1', 10));
    const total = calculateBulkPrice(product, quantity);
    const unit = +(total / quantity).toFixed(2);
    const priceEl = document.getElementById(`cat-price-${productId}`);
    if (priceEl) priceEl.textContent = formatCurrency(unit);
}

function addCategoryToCart(productId) {
    const input = document.getElementById(`cat-qty-input-${productId}`);
    const qty = Math.max(1, parseInt((input && input.value) || '1', 10));
    addToCart(productId, qty);
}

function incCategoryQty(productId) {
    const input = document.getElementById(`cat-qty-input-${productId}`);
    const current = Math.max(1, parseInt((input && input.value) || '1', 10));
    const next = current + 1;
    if (input) input.value = next;
    onCategoryQtyChange(productId, next);
}

function decCategoryQty(productId) {
    const input = document.getElementById(`cat-qty-input-${productId}`);
    const current = Math.max(1, parseInt((input && input.value) || '1', 10));
    const next = Math.max(1, current - 1);
    if (input) input.value = next;
    onCategoryQtyChange(productId, next);
}

// --- Filtered Page Quantity Controls ---
function addFilteredToCart(productId) {
    addToCart(productId, 1, 'filtered');
}

function incFilteredQty(productId) {
    const product = findProductById(productId);
    if (product) {
        addToCart(productId, 1, 'filtered');
    }
}

function decFilteredQty(productId) {
    const cartItem = cartItems.find(item => item.id === productId);
    if (cartItem && cartItem.quantity > 1) {
        setCartItemQuantity(productId, cartItem.quantity - 1);
    } else if (cartItem) {
        removeFromCart(productId);
    }
}

// --- Homepage: New Sections Rendering ---
function renderNewHomepageSections() {
    // Ensure margin data present
    enrichMarginData();
    enrichBulkPricingData();

    const arrivalsRow = document.getElementById('new-arrivals-cards');
    const bulkDealsRow = document.getElementById('bulk-deals-cards');
    const recommendedGrid = document.getElementById('recommended-container');
    const categoryHighlights = document.getElementById('category-highlights-container');

    if (!arrivalsRow || !bulkDealsRow || !recommendedGrid || !categoryHighlights) {
        return; // Sections may not exist on non-home routes
    }

    // New Arrivals: 10-15 newest by id
    const newest = getAllProducts()
        .sort((a, b) => (b.id || 0) - (a.id || 0))
        .slice(0, 14);

    arrivalsRow.innerHTML = newest.map((p, i) => {
        const tiers = ensureBulkPricing(p);
        const hasBulk = (tiers || []).some(t => (t.discountPercent || 0) > 0);
        const initialQty = 1;
        const unitTotal = calculateBulkPrice(p, initialQty);
        const unitPrice = +(unitTotal / initialQty).toFixed(2);
        const imageMarkup = p.imageUrl
            ? `<img src="${p.imageUrl}" alt="${p.name}" class="w-full aspect-[1/1] object-cover bg-white" onerror="this.onerror=null; this.outerHTML='\x3cdiv class=\x22w-full aspect-[1/1] bg-white\x22\x3e\x3c/div\x3e'" />`
            : `<div class="w-full aspect-[1/1] bg-white"></div>`;
        return `
            <div id="product-card-${p.id}" class="w-64 min-w-[16rem] bg-white rounded-xl shadow border border-card-border overflow-hidden product-card-hover reveal flex flex-col justify-between h-[420px] flex-none snap-start" style="transition-delay: ${i * 80}ms">
                <div class="relative">
                    <button onclick="navigateTo('pdp', ${p.id}); return false;" class="block w-full text-left">
                        ${imageMarkup}
                    </button>
                    ${hasBulk ? `<span class="absolute top-3 right-3 bg-white/90 text-gray-700 text-xs px-2 py-1 rounded border">Bulk</span>` : (p.tag ? `<span class="absolute top-3 right-3 bg-white/90 text-gray-700 text-xs px-2 py-1 rounded border">${p.tag}</span>` : '')}
                </div>
                <div class="p-4 flex flex-col">
                    <button onclick="navigateTo('pdp', ${p.id}); return false;" class="text-left w-full">
                        <h4 class="text-base font-semibold text-primary truncate-2-lines">${p.name}</h4>
                    </button>
                    <div class="flex items-center justify-between mt-2">
                        <div>
                            <span id="arr-price-${p.id}" class="text-primary font-bold">${formatCurrency(unitPrice)}</span>
                            ${p.unit ? `<span class="text-sm text-gray-500"> / ${p.unit}</span>` : ''}
                        </div>
                        <div class="flex">${generateStarRating(p.rating || 0)}</div>
                    </div>
                <div class="mt-auto flex items-center justify-between gap-3 action-bar-fixed-height h-10">
                    <div class="flex items-center border border-card-border rounded-full overflow-hidden w-36 h-full">
                        <button onclick="decArrivalsQty(${p.id}); return false;" class="px-3 h-full text-primary hover:text-secondary-accent">-</button>
                        <input id="arr-qty-input-${p.id}" type="number" min="1" value="1" class="w-16 text-center outline-none h-full" oninput="onArrivalsQtyChange(${p.id}, this.value)" />
                        <button onclick="incArrivalsQty(${p.id}); return false;" class="px-3 h-full text-primary hover:text-secondary-accent">+</button>
                    </div>
                    <button onclick="addBulkToCart(${p.id}); return false;" class="flex-1 text-sm text-white bg-accent h-full px-4 rounded-lg hover:bg-primary transition">Add to Cart</button>
                </div>
                </div>
            </div>`;
    }).join('');

    // Bulk Buy & Save: 3-4 offer cards from dealProducts
    const offers = dealProducts.slice(0, 4);
    bulkDealsRow.innerHTML = offers.map(p => {
        const tierText = `Buy 10, Get ${p.discount}% Off`;
        return `
            <button onclick="navigateTo('deals'); return false;" class="group w-full text-left">
                <div class="rounded-xl border border-card-border overflow-hidden bg-white hover:shadow-lg transition">
                    <div class="p-4 bg-secondary-accent text-white">
                        <p class="text-sm font-semibold tracking-wide">Bulk Offer</p>
                        <h4 class="text-lg font-extrabold">${tierText}</h4>
                    </div>
                    <div class="p-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-primary font-semibold">${p.name}</p>
                                <p class="text-gray-500 text-sm">${p.category} · ${p.brand}</p>
                            </div>
                            <span class="text-accent font-bold">${formatCurrency(p.price)}</span>
                        </div>
                        <p class="mt-2 text-xs text-gray-500">Tap to see all deals</p>
                    </div>
                </div>
            </button>`;
    }).join('');

    // Recommended: 8 products with marginPercent >= 30, random selection
    const eligible = getAllProducts().filter(p => (p.marginPercent || 0) >= 30);
    const baseForRecommended = eligible.length ? eligible : getAllProducts();
    const shuffled = baseForRecommended.sort(() => Math.random() - 0.5).slice(0, 8);
    recommendedGrid.innerHTML = shuffled.map((p, i) => {
        const tiers = ensureBulkPricing(p);
        const hasBulk = (tiers || []).some(t => (t.discountPercent || 0) > 0);
        const price = p.price || p.oldPrice || 0;
        const margin = p.marginPercent || 30;
        const colorHex = (p.imageColor ? `#${p.imageColor}` : '#e5e7eb');
        const imageMarkup = p.imageUrl
            ? `<img src="${p.imageUrl}" alt="${p.name}" class="w-full aspect-[1/1] object-cover bg-white transition duration-300" onerror="this.onerror=null; this.outerHTML='<div class=&quot;w-full aspect-[1/1] bg-white&quot;></div>'" />`
            : `<div class="w-full aspect-[1/1] bg-white"></div>`;
        const initialQty = 1;
        const unitTotal = calculateBulkPrice(p, initialQty);
        const unitPrice = +(unitTotal / initialQty).toFixed(2);
        return `
        <div id="product-card-${p.id}" class="bg-white rounded-xl shadow-lg overflow-hidden product-card-hover border border-card-border reveal flex flex-col justify-between h-[420px]" style="transition-delay: ${i * 80}ms">
            <div class="relative p-4">
                <a href="#pdp-${p.id}" onclick="renderProductPage('${p.name}'); return false;">
                    ${imageMarkup}
                </a>
                <span class="absolute -top-2 right-2 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-sm text-[10px] font-medium">${margin}%</span>
                <button onclick="toggleWishlist(${p.id})" class="absolute top-3 left-3 text-gray-400 hover:text-secondary-accent transition ${wishlistItems.includes(p.id) ? 'wishlist-active' : ''}" aria-label="Add to Wishlist">
                    <i data-lucide="heart" class="w-5 h-5 wishlist-icon"></i>
                </button>
            </div>
            <div class="p-4 flex flex-col">
                <h4 class="text-lg font-semibold text-primary truncate-2-lines">${p.name}</h4>
                <div class="flex items-baseline space-x-2 mt-2">
                    <span id="rec-price-${p.id}" class="text-primary font-bold">${formatCurrency(unitPrice)}</span>
                    ${p.unit ? `<span class="text-gray-500">/ ${p.unit}</span>` : ''}
                </div>
                <div class="flex items-center mt-2">
                    ${generateStarRating(p.rating || 0)}
                </div>
                <div class="mt-auto flex items-center justify-between gap-3 action-bar-fixed-height h-10">
                    <div class="flex items-center border border-card-border rounded-full overflow-hidden w-36 h-full">
                        <button onclick="decRecommendedQty(${p.id}); return false;" class="px-3 h-full text-primary hover:text-secondary-accent">-</button>
                        <input id="rec-qty-input-${p.id}" type="number" min="1" value="1" class="w-16 text-center outline-none h-full" oninput="onRecommendedQtyChange(${p.id}, this.value)" />
                        <button onclick="incRecommendedQty(${p.id}); return false;" class="px-3 h-full text-primary hover:text-secondary-accent">+</button>
                    </div>
                    <button onclick="addBulkToCart(${p.id}); return false;" class="flex-1 px-4 h-full bg-accent text-white rounded-lg hover:bg-primary transition">Add to Cart</button>
                </div>
            </div>
        </div>`;
    }).join('');

    // Category Highlights: two large image cards for Electronics and Fashion
    const elect = categoryProducts.electronics[0] || {};
    const electColor = elect.imageColor ? `#${elect.imageColor}` : '#d1d5db';
    const electMarkup = elect.imageUrl
        ? `<img src="${elect.imageUrl}" alt="Electronics" class="w-full h-[280px] object-cover" onerror="this.onerror=null; this.outerHTML='<div class=&quot;w-full h-[280px]&quot; style=&quot;background-color:${electColor}&quot;></div>'" />`
        : `<div class="w-full h-[280px]" style="background-color:${electColor}"></div>`;
    const fash = categoryProducts.fashion[0] || {};
    const fashionColor = fash.imageColor ? `#${fash.imageColor}` : '#d1d5db';
    const fashionMarkup = fash.imageUrl
        ? `<img src="${fash.imageUrl}" alt="Fashion" class="w-full h-[280px] object-cover" onerror="this.onerror=null; this.outerHTML='<div class=&quot;w-full h-[280px]&quot; style=&quot;background-color:${fashionColor}&quot;></div>'" />`
        : `<div class="w-full h-[280px]" style="background-color:${fashionColor}"></div>`;
    categoryHighlights.innerHTML = `
        <a href="#category-electronics" onclick="navigateTo('category','electronics'); return false;" class="block">
            <div class="relative rounded-xl overflow-hidden shadow-lg border border-card-border hover:shadow-xl transition">
                ${electMarkup}
                <div class="absolute inset-0 bg-black/20"></div>
                <div class="absolute bottom-4 left-4">
                    <h3 class="text-2xl font-extrabold text-white">Electronics</h3>
                    <p class="text-white/90">TVs, Audio, Accessories</p>
                </div>
            </div>
        </a>
        <a href="#category-fashion" onclick="navigateTo('category','fashion'); return false;" class="block">
            <div class="relative rounded-xl overflow-hidden shadow-lg border border-card-border hover:shadow-xl transition">
                ${fashionMarkup}
                <div class="absolute inset-0 bg-black/20"></div>
                <div class="absolute bottom-4 left-4">
                    <h3 class="text-2xl font-extrabold text-white">Fashion</h3>
                    <p class="text-white/90">Apparel, Shoes, Accessories</p>
                </div>
            </div>
        </a>`;

    // Initialize icons for dynamically injected content
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }

    // Observe newly injected reveal elements so they appear (prevent empty-looking sections)
    try {
        const revealTargets = [
            ...arrivalsRow.querySelectorAll('.reveal'),
            ...recommendedGrid.querySelectorAll('.reveal'),
            ...categoryHighlights.querySelectorAll('.reveal')
        ];
        if (window.observer) {
            revealTargets.forEach(el => window.observer.observe(el));
        } else {
            // Fallback: show immediately if observer not ready
            revealTargets.forEach(el => el.classList.add('reveal-visible'));
        }
    } catch (e) {
        // No-op
    }
}

// --- Legacy-compatible routing adapter ---
function MapsTo(page, subview) {
    // Delegate to modern navigator
    navigateTo(page || 'home', subview);
    // Ensure home sections render AFTER visibility for reliability
    if (!page || page === 'home' || page === 'featured-products' || page === '') {
        const homeEl = document.getElementById('home-page');
        if (homeEl) {
            setTimeout(() => {
                renderNewHomepageSections();
            }, 0);
        }
    }
}
// Expose for inline handlers if present
window.MapsTo = MapsTo;

// --- Homepage bulk handlers ---
function onArrivalsQtyChange(productId, qty) {
    const product = findProductById(productId);
    const quantity = Math.max(1, parseInt(qty || '1', 10));
    const total = calculateBulkPrice(product, quantity);
    const unit = +(total / quantity).toFixed(2);
    const priceEl = document.getElementById(`arr-price-${productId}`);
    if (priceEl) priceEl.textContent = formatCurrency(unit);
}

function addArrivalsToCart(productId) {
    const select = document.getElementById(`arr-qty-${productId}`);
    const qty = Math.max(1, parseInt((select && select.value) || '1', 10));
    addToCart(productId, qty);
}

function incArrivalsQty(productId) {
    const input = document.getElementById(`arr-qty-input-${productId}`);
    const current = Math.max(1, parseInt((input && input.value) || '1', 10));
    const next = current + 1;
    if (input) input.value = next;
    onArrivalsQtyChange(productId, next);
}

function decArrivalsQty(productId) {
    const input = document.getElementById(`arr-qty-input-${productId}`);
    const current = Math.max(1, parseInt((input && input.value) || '1', 10));
    const next = Math.max(1, current - 1);
    if (input) input.value = next;
    onArrivalsQtyChange(productId, next);
}

function onRecommendedQtyChange(productId, qty) {
    const product = findProductById(productId);
    const quantity = Math.max(1, parseInt(qty || '1', 10));
    const total = calculateBulkPrice(product, quantity);
    const unit = +(total / quantity).toFixed(2);
    const priceEl = document.getElementById(`rec-price-${productId}`);
    if (priceEl) priceEl.textContent = formatCurrency(unit);
}

function addRecommendedToCart(productId) {
    const input = document.getElementById(`rec-qty-input-${productId}`);
    const qty = Math.max(1, parseInt((input && input.value) || '1', 10));
    addToCart(productId, qty);
}

function incRecommendedQty(productId) {
    const input = document.getElementById(`rec-qty-input-${productId}`);
    const current = Math.max(1, parseInt((input && input.value) || '1', 10));
    const next = current + 1;
    if (input) input.value = next;
    onRecommendedQtyChange(productId, next);
}

function decRecommendedQty(productId) {
    const input = document.getElementById(`rec-qty-input-${productId}`);
    const current = Math.max(1, parseInt((input && input.value) || '1', 10));
    const next = Math.max(1, current - 1);
    if (input) input.value = next;
    onRecommendedQtyChange(productId, next);
}

// --- Generic bulk add helpers (for unified card wiring) ---
function addBulkToCart(productId) {
    const possibleIds = [
        `qty-selector-${productId}`,
        `arr-qty-input-${productId}`,
        `rec-qty-input-${productId}`,
        `cat-qty-input-${productId}`,
        `arr-qty-${productId}`,
        `rec-qty-${productId}`,
        `cat-qty-${productId}`,
        'pdp-quantity'
    ];
    let qty = 1;
    for (const id of possibleIds) {
        const el = document.getElementById(id);
        if (el) {
            qty = Math.max(1, parseInt(el.value || '1', 10));
            break;
        }
    }
    addToCart(productId, qty);
}

function onBulkQtyChange(productId, qty) {
    const product = findProductById(productId);
    const quantity = Math.max(1, parseInt(qty || '1', 10));
    const total = calculateBulkPrice(product, quantity);
    const unit = +(total / quantity).toFixed(2);
    const labelCandidates = [
        `deal-price-${productId}`,
        `price-label-${productId}`,
        `arr-price-${productId}`,
        `rec-price-${productId}`,
        `cat-price-${productId}`
    ];
    for (const id of labelCandidates) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = formatCurrency(unit);
            break;
        }
    }
}

function incBulkQty(productId) {
    const input = document.getElementById(`qty-selector-${productId}`);
    const current = Math.max(1, parseInt((input && input.value) || '1', 10));
    const next = current + 1;
    if (input) input.value = next;
    onBulkQtyChange(productId, next);
}

function decBulkQty(productId) {
    const input = document.getElementById(`qty-selector-${productId}`);
    const current = Math.max(1, parseInt((input && input.value) || '1', 10));
    const next = Math.max(1, current - 1);
    if (input) input.value = next;
    onBulkQtyChange(productId, next);
}

function renderProductCardHTML(p, context = 'deal') { 
    const tiers = ensureBulkPricing(p); 
    const percent = p.discount || (p.oldPrice ? Math.round((+(p.oldPrice - p.price).toFixed(2) / p.oldPrice) * 100) : 0); 
    const savings = p.oldPrice ? +(p.oldPrice - p.price).toFixed(2) : 0; 
    
    const initialUnit = +(p.price || p.oldPrice || 0).toFixed(2); 
    const priceId = `deal-price-${p.id}`; 
    
    const firstTier = (tiers || []).find(t => t.discountPercent > 0); 
    const bulkLabelText = firstTier 
        ? `Bulk pricing available from ${firstTier.minQuantity}+ units` 
        : ''; 
        
    // 💡 FIXED IMAGE MARKUP: Use fixed height container for guaranteed rendering 
    const imageMarkup = p.imageUrl 
        ? `<div class="w-full h-40 overflow-hidden bg-white flex items-center justify-center border-b border-card-border/50"> 
               <img src="${p.imageUrl}" alt="${p.name}" 
                    class="w-full h-full object-cover transition duration-300" 
                    onerror="this.onerror=null; this.outerHTML='<div class=\x22w-full h-full bg-gray-200\x22></div>';" /> 
           </div>` 
        : `<div class="w-full h-40 bg-gray-200 border-b border-card-border/50"></div>`; 


    // 💡 FIXED LAYOUT: Enforced h-[390px] for stability and proper flex distribution 
    return ` 
    <div id="product-card-${p.id}" class="bg-white rounded-xl shadow-lg overflow-hidden product-card-hover border border-card-border reveal flex flex-col h-[390px] min-w-[15rem] flex-shrink-0"> 
        
        <div class="relative p-0"> 
            <a href="#pdp-${p.id}" onclick="renderProductPage('${p.name}'); return false;"> 
                ${imageMarkup} 
            </a> 
            ${percent ? `<span class="absolute top-3 left-3 bg-secondary-accent text-white text-xs font-semibold px-2 py-1 rounded-full">-${percent}%</span>` : ''} 
            <button onclick="toggleWishlist(${p.id}); return false;" class="absolute top-3 right-3 bg-white/90 p-1 rounded-full text-gray-400 hover:text-secondary-accent transition" aria-label="Add to Wishlist"> 
                <i data-lucide="heart" class="w-5 h-5 wishlist-icon"></i> 
            </button> 
        </div> 
        
        <div class="p-4 flex flex-col flex-1 justify-between text-center"> 
            
            <div class="flex-1 min-h-[120px] flex flex-col justify-start items-center"> 
                <p class="text-xs text-gray-500 uppercase">${p.category || ''}</p> 
                <h4 class="text-base font-semibold text-primary truncate-2-lines mt-1">${p.name}</h4> 
                <div class="flex justify-center items-center mt-2">${generateStarRating(p.rating || 0)}</div> 
                
                <p class="text-xl font-bold text-primary mt-3 pt-1"> 
                    ${p.oldPrice ? `<span class="text-gray-500 line-through text-sm mr-2">${formatCurrency(p.oldPrice)}</span>` : ''} 
                    <span id="${priceId}">${formatCurrency(initialUnit)}</span> 
                    ${p.unit ? `<span class="text-sm text-gray-500 font-normal">/ ${p.unit}</span>` : ''} 
                </p> 
                ${savings > 0 ? `<p class="text-secondary-accent text-sm font-semibold mt-1">Save ${formatCurrency(savings)}</p>` : ''} 
                
                ${bulkLabelText ? `<p class="text-xs text-gray-500 mt-2">${bulkLabelText}</p>` : ''} 
            </div> 
            
            <div class="mt-3 flex items-center justify-center gap-2 h-10"> 
                <div class="flex items-stretch border border-card-border rounded-full overflow-hidden h-full"> 
                    <button onclick="decBulkQty(${p.id}); return false;" class="px-3 h-full text-primary hover:text-secondary-accent flex items-center justify-center">-</button> 
                    <input id="qty-selector-${p.id}" type="number" min="1" value="1" class="w-10 text-center outline-none h-full border-x border-card-border text-primary text-sm" oninput="onBulkQtyChange(${p.id}, this.value)" /> 
                    <button onclick="incBulkQty(${p.id}); return false;" class="px-3 h-full text-primary hover:text-secondary-accent flex items-center justify-center">+</button> 
                </div> 
                <button onclick="addBulkToCart(${p.id}); return false;" class="flex-1 text-sm text-white bg-accent h-full px-4 rounded-full hover:bg-primary transition duration-150 flex items-center justify-center space-x-1"> 
                    <i data-lucide="shopping-cart" class="w-4 h-4"></i> 
                    <span>Add to Cart</span> 
                </button> 
            </div> 
        </div> 
    </div>`; 
}

function renderDealsPage() {
    console.log('🔍 renderDealsPage() called');
    const container = document.getElementById('deals-products-container');
    const header = document.getElementById('deals-page-header');
    
    console.log('📦 Container found:', !!container);
    console.log('📋 Header found:', !!header);
    console.log('📊 dealProducts data:', dealProducts);
    console.log('📊 dealProducts length:', dealProducts.length);
    
    if (!container || !header) {
        console.error('❌ Missing container or header element');
        return;
    }

    // Urgent header redesign
    header.innerHTML = `
        <div class="flex items-center justify-between">
            <h2 class="text-3xl font-extrabold text-primary">Limited-Time Flash Deals</h2>
            <span class="text-sm font-semibold text-secondary-accent">Hurry! Prices drop with bulk.</span>
        </div>
    `;

    // Ensure bulk tiers and start countdown
    enrichBulkPricingData();
    startDealsCountdown();

    console.log('🏗️ Generating product cards...');
    const cards = dealProducts.map(p => {
        const cardHTML = renderProductCardHTML(p, 'deal');
        console.log(`🎴 Generated card for ${p.name}:`, cardHTML.substring(0, 100) + '...');
        return cardHTML;
    }).join('');
    
    console.log('📝 Final cards HTML length:', cards.length);
    container.innerHTML = cards;
    console.log('✅ Cards inserted into container');

    // Staggered fade-in / slide-up animation
    const nodes = container.querySelectorAll('.deal-card');
    nodes.forEach((node, i) => {
        node.style.opacity = '0';
        node.style.transform = 'translateY(12px)';
        setTimeout(() => {
            node.style.transition = 'transform 450ms ease, opacity 450ms ease';
            node.style.opacity = '1';
            node.style.transform = 'translateY(0)';
        }, i * 80);
    });

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
}
// --- Filtered Results Rendering ---
function renderFilteredPage(filterKey) {
    const container = document.getElementById('category-products-container');
    const header = document.getElementById('category-page-header');
    const banner = document.getElementById('category-banner-container');
    if (!container || !header || !banner) return;

    const isBest = filterKey === 'best-sellers';
    const products = isBest ? bestSellerProducts : topRatedProducts;
    const title = isBest ? 'All Best Seller Items' : 'Top Rated Products';
    const crumb = isBest ? 'Home > Best Sellers' : 'Home > Top Rated';

    header.innerHTML = `
        <h2 class="text-3xl font-bold text-primary">${title} (${products.length} items)</h2>
        <p class="text-sm text-gray-600 mt-2">${crumb}</p>
    `;

    banner.innerHTML = `
        <div class="p-8 bg-white rounded-xl shadow-lg border-2 border-accent">
            <p class="text-2xl font-bold text-primary">Browsing our <span class="text-accent">${title}</span></p>
            <p class="text-gray-600 mt-2">Curated highlights based on ratings and popularity.</p>
        </div>
    `;

    // Subtle loading state
    const skeletonCard = () => (
        `<div class="bg-white rounded-xl shadow-lg border border-card-border p-4 animate-pulse">
            <div class="w-full aspect-[4/3] bg-gray-200 rounded-md"></div>
            <div class="mt-3 h-4 bg-gray-200 rounded w-3/4"></div>
            <div class="mt-2 h-4 bg-gray-100 rounded w-1/2"></div>
            <div class="mt-4 h-10 bg-gray-100 rounded w-full"></div>
        </div>`
    );
    container.innerHTML = Array.from({ length: Math.min(8, Math.max(4, products.length)) }, skeletonCard).join('');

    setTimeout(() => {
        // Generate product cards with original HTML generation
        container.innerHTML = products.map(p => {
            const isInWishlist = wishlistItems.includes(p.id);
            const cartItem = cartItems.find(item => item.id === p.id);
            const currentQty = cartItem ? cartItem.quantity : 0;
            
            return `
                <div class="bg-white rounded-xl shadow-lg border border-card-border p-4 hover:shadow-xl transition-all duration-300 reveal">
                    <div class="relative">
                        <div class="w-full aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 rounded-md overflow-hidden">
                            ${p.imageUrl ? 
                                `<img src="${p.imageUrl}" alt="${p.name}" class="w-full h-full object-cover">` :
                                `<div class="w-full h-full flex items-center justify-center" style="background: linear-gradient(135deg, #${p.imageColor}20, #${p.imageColor}40);">
                                    <i data-lucide="package" class="w-12 h-12 text-gray-400"></i>
                                </div>`
                            }
                        </div>
                        ${p.tag ? `<span class="absolute top-2 left-2 bg-accent text-white text-xs px-2 py-1 rounded-full font-semibold">${p.tag}</span>` : ''}
                        <button onclick="toggleWishlist(${p.id})" class="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors">
                            <i data-lucide="heart" class="w-4 h-4 ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'}"></i>
                        </button>
                    </div>
                    <div class="mt-3">
                        <h3 class="font-semibold text-gray-900 text-sm leading-tight">${p.name}</h3>
                        <p class="text-xs text-gray-500 mt-1">${p.brand || 'Generic'}</p>
                        <div class="flex items-center mt-2">
                            ${generateStarRating(p.rating)}
                            <span class="text-xs text-gray-500 ml-1">(${p.rating})</span>
                        </div>
                        <div class="flex items-center justify-between mt-3">
                            <div>
                                <span class="text-lg font-bold text-primary">$${p.price.toFixed(2)}</span>
                                <span class="text-xs text-gray-500">/${p.unit}</span>
                            </div>
                        </div>
                        <div class="mt-3 flex items-center gap-2">
                            ${currentQty > 0 ? 
                                `<div class="flex items-center border border-gray-300 rounded-lg">
                                    <button onclick="decFilteredQty(${p.id})" class="p-2 hover:bg-gray-100 transition-colors">
                                        <i data-lucide="minus" class="w-4 h-4"></i>
                                    </button>
                                    <span class="px-3 py-2 min-w-[3rem] text-center font-medium">${currentQty}</span>
                                    <button onclick="incFilteredQty(${p.id})" class="p-2 hover:bg-gray-100 transition-colors">
                                        <i data-lucide="plus" class="w-4 h-4"></i>
                                    </button>
                                </div>` :
                                `<button onclick="addFilteredToCart(${p.id})" class="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors font-medium text-sm">
                                    Add to Cart
                                </button>`
                            }
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Re-init icons and reveal observer for dynamic content
        lucide.createIcons();
        if (observer) {
            document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
        }
    }, 400);
}

// --- Smooth Page Transition ---
function animatePageTransition(fromEl, toEl) {
    if (!toEl) return;
    if (!fromEl || fromEl === toEl) {
        toEl.classList.remove('hidden');
        return;
    }

    toEl.classList.remove('hidden');
    toEl.style.opacity = '0';
    toEl.style.transform = 'translateY(8px)';
    toEl.style.transition = 'opacity 250ms ease, transform 250ms ease';

    fromEl.style.transition = 'opacity 200ms ease, transform 200ms ease';
    fromEl.style.opacity = '1';
    fromEl.style.transform = 'translateY(0)';

    // Start animations
    requestAnimationFrame(() => {
        fromEl.style.opacity = '0';
        fromEl.style.transform = 'translateY(-8px)';
        toEl.style.opacity = '1';
        toEl.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
        fromEl.classList.add('hidden');
        fromEl.style.transition = '';
        fromEl.style.opacity = '';
        fromEl.style.transform = '';
        toEl.style.transition = '';
    }, 260);
}

function showOnly(targetId) {
    const pages = ['home-page', 'cart-page', 'category-page', 'deals-page', 'account-page', 'product-detail-section'];
    pages.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (id === targetId) {
            el.classList.remove('hidden');
        } else {
            el.classList.add('hidden');
        }
    });
}
// ... (Rest of rendering, navigation, and listener functions) ...

// Start functions defined outside the main logic block.
function startOfferCarousel() {
    const offerTextElement = document.getElementById('offer-text');
    if (!offerTextElement) return;

    setInterval(() => {
        // Fade out/slide out effect
        offerTextElement.style.opacity = 0;
        offerTextElement.style.transform = 'translateY(-10px)';

        setTimeout(() => {
            // Update content
            currentOfferIndex = (currentOfferIndex + 1) % offerMessages.length;
            offerTextElement.textContent = offerMessages[currentOfferIndex];

            // Fade in/slide in effect
            offerTextElement.style.opacity = 1;
            offerTextElement.style.transform = 'translateY(0)';
        }, 500); // Wait for transition out before updating
    }, 5000); // Change message every 5 seconds
    
    // Set initial message
    offerTextElement.textContent = offerMessages[0];
    offerTextElement.style.opacity = 1;
}

function startHeroCarousel() {
    const container = document.getElementById('hero-slides-container');
    if (!container) return;

    setInterval(() => {
        currentHeroSlide = (currentHeroSlide + 1) % totalHeroSlides;
        const offset = currentHeroSlide * (100 / totalHeroSlides);
        container.style.transform = `translateX(-${offset}%)`;
    }, 6000); // Slide changes every 6 seconds
}

function startDealsCountdown() {
    const daysEl = document.getElementById('days');
    if (!daysEl) return;
    
    const endTime = new Date();
    endTime.setDate(endTime.getDate() + 1);
    endTime.setHours(23, 59, 59, 999); 
    
    function updateCountdown() {
        const now = new Date().getTime();
        const distance = endTime - now;

        if (distance < 0) {
            clearInterval(countdownInterval);
            document.getElementById('days').textContent = '00';
            document.getElementById('hours').textContent = '00';
            document.getElementById('minutes').textContent = '00';
            document.getElementById('seconds').textContent = '00';
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById('days').textContent = days.toString().padStart(2, '0');
        document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
    }

    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
}

// --- Navigation and Initialization ---
function navigateTo(page, subview = null, fromEl = null, useAnimation = true) {
    const pages = ['home-page', 'cart-page', 'category-page', 'deals-page', 'account-page', 'product-detail-section'];
    
    if (page !== 'deals' && countdownInterval) {
        clearInterval(countdownInterval);
    }
    if (page !== 'account') {
        // Assume hideLogoutModal is defined elsewhere or stubbed out
    }

    if (page === 'home' || page === 'featured-products' || page === '') {
        const homePage = document.getElementById('home-page');
        if (homePage) {
            if (useAnimation) {
                const current = fromEl || pages.map(id => document.getElementById(id)).find(el => el && !el.classList.contains('hidden'));
                animatePageTransition(current, homePage);
            } else {
                showOnly('home-page');
            }
            // Render dynamic homepage sections on navigation
            renderNewHomepageSections();
        }
        window.location.hash = '#home';
    } else if (page === 'cart') {
        const cartPage = document.getElementById('cart-page');
        if (cartPage) {
            if (useAnimation) {
                const current = fromEl || pages.map(id => document.getElementById(id)).find(el => el && !el.classList.contains('hidden'));
                animatePageTransition(current, cartPage);
            } else {
                showOnly('cart-page');
            }
        }
        renderCart();
        window.location.hash = '#cart';
    } else if (page === 'deals') {
        const dealsPage = document.getElementById('deals-page');
        if (dealsPage) {
            if (useAnimation) {
                const current = fromEl || pages.map(id => document.getElementById(id)).find(el => el && !el.classList.contains('hidden'));
                animatePageTransition(current, dealsPage);
            } else {
                showOnly('deals-page');
            }
        }
        renderDealsPage();
        window.location.hash = '#deals';
    } else if (page === 'account') {
        const accountPage = document.getElementById('account-page');
        if (accountPage) {
            if (useAnimation) {
                const current = fromEl || pages.map(id => document.getElementById(id)).find(el => el && !el.classList.contains('hidden'));
                animatePageTransition(current, accountPage);
            } else {
                showOnly('account-page');
            }
        }
        if (subview) {
            setAccountView(subview);
            window.location.hash = `#account-${subview}`;
        } else {
            setAccountView(currentAccountView); 
            window.location.hash = '#account';
        }
    } else if (page === 'category' && subview) {
        const categoryPage = document.getElementById('category-page');
        if (categoryPage) {
            if (useAnimation) {
                const current = fromEl || pages.map(id => document.getElementById(id)).find(el => el && !el.classList.contains('hidden'));
                animatePageTransition(current, categoryPage);
            } else {
                showOnly('category-page');
            }
        }
        renderCategoryPage(subview);
        window.location.hash = `#category-${subview}`;
    } else if (page === 'best-sellers') {
        const categoryPage = document.getElementById('category-page');
        if (categoryPage) {
            if (useAnimation) {
                const current = fromEl || pages.map(id => document.getElementById(id)).find(el => el && !el.classList.contains('hidden'));
                animatePageTransition(current, categoryPage);
            } else {
                showOnly('category-page');
            }
        }
        renderFilteredPage('best-sellers');
        window.location.hash = '#best-sellers';
    } else if (page === 'top-rated') {
        const categoryPage = document.getElementById('category-page');
        if (categoryPage) {
            if (useAnimation) {
                const current = fromEl || pages.map(id => document.getElementById(id)).find(el => el && !el.classList.contains('hidden'));
                animatePageTransition(current, categoryPage);
            } else {
                showOnly('category-page');
            }
        }
        renderFilteredPage('top-rated');
        window.location.hash = '#top-rated';
    } else if (page === 'pdp' && subview) { 
        const pdpSection = document.getElementById('product-detail-section');
        if (pdpSection) {
            if (useAnimation) {
                const current = fromEl || pages.map(id => document.getElementById(id)).find(el => el && !el.classList.contains('hidden'));
                animatePageTransition(current, pdpSection);
            } else {
                showOnly('product-detail-section');
            }
        }
        setPDPView(subview); 
        window.location.hash = `#pdp-${subview}`;
    }
window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- Product Detail View (PDP) builder with bulk ordering ---
function setPDPView(productId) {
    const product = findProductById(productId);
    if (!product || !pdpContentContainer) return;
    enrichBulkPricingData();
    const colorHex = (product.imageColor ? `#${product.imageColor}` : '#e5e7eb');
    const imageMarkup = product.imageUrl
        ? `<img src="${product.imageUrl}" alt="${product.name}" class="w-full h-72 object-cover rounded-xl" onerror="this.onerror=null; this.outerHTML='\x3cdiv class=\x22w-full h-72 rounded-xl\x22 style=\x22background-color:${colorHex}\x22\x3e\x3c/div\x3e'" />`
        : `<div class="w-full h-72 rounded-xl" style="background-color:${colorHex}"></div>`;

    const tiersHtml = ensureBulkPricing(product).map(t => {
        return `<div class="flex justify-between text-sm"><span>Buy ${t.minQuantity}+</span><span>${t.discountPercent}% off</span></div>`;
    }).join('');

    pdpContentContainer.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>${imageMarkup}</div>
            <div>
                <h2 class="text-3xl font-bold text-primary">${product.name}</h2>
                <div class="mt-2 flex items-center">${generateStarRating(product.rating || 0)}</div>
                <p class="mt-2 text-gray-600">${product.brand || ''} ${product.unit ? '• ' + product.unit : ''}</p>

                <div class="mt-6 p-4 rounded-xl border border-card-border bg-white">
                    <div class="flex items-center space-x-3">
                        <button id="pdp-qty-dec" class="w-8 h-8 rounded-full bg-gray-200 text-primary font-bold">-</button>
                        <input id="pdp-quantity" type="number" min="1" max="500" value="1" class="w-20 p-2 border rounded-md text-center" />
                        <button id="pdp-qty-inc" class="w-8 h-8 rounded-full bg-gray-200 text-primary font-bold">+</button>
                    </div>
                    <div class="mt-4">
                        <p class="text-xl font-semibold">Per-unit: <span id="pdp-unit-price">${formatCurrency(product.price || 0)}</span></p>
                        <p class="text-xl font-semibold">Total: <span id="pdp-total-price">${formatCurrency(product.price || 0)}</span></p>
                        <p class="text-sm text-accent font-medium mt-1" id="pdp-bulk-callout">Bulk price applied where eligible</p>
                    </div>
                    <div class="mt-4 space-y-1">
                        <h4 class="font-semibold text-primary">Tiered Pricing</h4>
                        ${tiersHtml}
                    </div>
                    <button id="pdp-add-to-cart" class="mt-6 w-full text-white bg-accent py-3 px-4 rounded-full hover:bg-primary transition duration-150 flex items-center justify-center space-x-2">
                        <i data-lucide="shopping-cart" class="w-4 h-4"></i>
                        <span>Add to Cart</span>
                    </button>
                </div>
            </div>
        </div>
    `;

    // Setup events
    const qtyInput = document.getElementById('pdp-quantity');
    const decBtn = document.getElementById('pdp-qty-dec');
    const incBtn = document.getElementById('pdp-qty-inc');
    const addBtn = document.getElementById('pdp-add-to-cart');

    function updatePdpPricing() {
        const qty = Math.max(1, Math.min(500, parseInt(qtyInput.value || '1', 10)));
        const total = calculateBulkPrice(product, qty);
        const unit = +(total / qty).toFixed(2);
        document.getElementById('pdp-unit-price').textContent = formatCurrency(unit);
        document.getElementById('pdp-total-price').textContent = formatCurrency(total);
        const percent = getBulkDiscountPercent(product, qty);
        document.getElementById('pdp-bulk-callout').textContent = percent > 0 ? `Bulk price: ${percent}% off applied` : 'No bulk discount at this quantity';
    }

    decBtn.addEventListener('click', () => { qtyInput.value = Math.max(1, parseInt(qtyInput.value || '1', 10) - 1); updatePdpPricing(); });
    incBtn.addEventListener('click', () => { qtyInput.value = Math.min(500, parseInt(qtyInput.value || '1', 10) + 1); updatePdpPricing(); });
    qtyInput.addEventListener('input', updatePdpPricing);
    addBtn.addEventListener('click', () => {
        const qty = Math.max(1, Math.min(500, parseInt(qtyInput.value || '1', 10)));
        addToCart(product.id, qty);
    });

    updatePdpPricing();
    lucide.createIcons();
}


window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'deals') {
        navigateTo('deals');
    } else if (hash === 'best-sellers') {
        navigateTo('best-sellers');
    } else if (hash === 'top-rated') {
        navigateTo('top-rated');
    } else if (hash.startsWith('category-')) {
        const categoryKey = hash.substring('category-'.length);
        navigateTo('category', categoryKey);
    } else if (hash.startsWith('account')) {
        const parts = hash.split('-');
        const subview = parts.length > 1 ? parts[1] : 'dashboard';
        navigateTo('account', subview);
    } else if (hash.startsWith('pdp-')) { 
        const productId = parseInt(hash.substring('pdp-'.length));
        navigateTo('pdp', productId);
    } else {
        navigateTo(hash);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Cache DOM elements safely
    cartCountElement = document.getElementById('cart-count');
    wishlistCountElement = document.getElementById('wishlist-count');
    cartItemsContainer = document.getElementById('cart-items-container');
    emptyCartMessage = document.getElementById('empty-cart-message');
    toastNotification = document.getElementById('toast-notification');
    toastProductName = document.getElementById('toast-product-name');
    logoutModal = document.getElementById('logout-modal');
    pdpContentContainer = document.getElementById('pdp-content-container');

    // Start carousels and UI setups
    startOfferCarousel();
    startHeroCarousel();
    updateCartCount();
    updateWishlistCount();
    lucide.createIcons();

    // Scroll Reveal Observer setup
    observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        rootMargin: '0px',
        threshold: 0.1 
    });

    document.querySelectorAll('.reveal').forEach(element => {
        observer.observe(element);
    });
    
    // Enrich data and render dynamic homepage sections
    enrichMarginData();
    renderNewHomepageSections();
    
    // Final un-animated initial navigation
    const initialHash = window.location.hash.replace('#', '');
    if (initialHash === 'deals') {
        navigateTo('deals', null, null, false);
    } else if (initialHash === 'best-sellers') {
        navigateTo('best-sellers', null, null, false);
    } else if (initialHash === 'top-rated') {
        navigateTo('top-rated', null, null, false);
    } else if (initialHash.startsWith('category-')) {
        const categoryKey = initialHash.substring('category-'.length);
        navigateTo('category', categoryKey, null, false);
    } else if (initialHash.startsWith('account')) {
        const parts = initialHash.split('-');
        const subview = parts.length > 1 ? parts[1] : 'dashboard';
        navigateTo('account', subview, null, false);
    } else if (initialHash.startsWith('pdp-')) { 
        const productId = parseInt(initialHash.substring('pdp-'.length));
        navigateTo('pdp', productId, null, false);
    } else {
        navigateTo(initialHash || 'home', null, null, false);
    }
});