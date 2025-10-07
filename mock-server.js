const http = require('http');
const url = require('url');

// Mock data
const products = [
    {
        id: 1,
        name: "iPhone 15 Pro",
        price: 999,
        originalPrice: 1099,
        category: "electronics",
        image: "https://via.placeholder.com/300x300?text=iPhone+15+Pro",
        rating: 4.8,
        reviews: 1250,
        inStock: true,
        description: "Latest iPhone with advanced features"
    },
    {
        id: 2,
        name: "Samsung Galaxy S24",
        price: 899,
        originalPrice: 999,
        category: "electronics",
        image: "https://via.placeholder.com/300x300?text=Galaxy+S24",
        rating: 4.7,
        reviews: 980,
        inStock: true,
        description: "Premium Android smartphone"
    },
    {
        id: 3,
        name: "Nike Air Max",
        price: 129,
        originalPrice: 159,
        category: "fashion",
        image: "https://via.placeholder.com/300x300?text=Nike+Air+Max",
        rating: 4.6,
        reviews: 750,
        inStock: true,
        description: "Comfortable running shoes"
    },
    {
        id: 4,
        name: "Organic Bananas",
        price: 3.99,
        originalPrice: 4.99,
        category: "fruits",
        image: "https://via.placeholder.com/300x300?text=Organic+Bananas",
        rating: 4.5,
        reviews: 320,
        inStock: true,
        description: "Fresh organic bananas"
    },
    {
        id: 5,
        name: "Wireless Headphones",
        price: 199,
        originalPrice: 249,
        category: "electronics",
        image: "https://via.placeholder.com/300x300?text=Headphones",
        rating: 4.9,
        reviews: 1500,
        inStock: true,
        description: "Premium wireless headphones"
    }
];

const deals = products.filter(p => p.originalPrice > p.price);
const bestSellers = products.slice(0, 3);
const topRated = products.filter(p => p.rating >= 4.7);

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
};

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const method = req.method;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
        res.writeHead(200, corsHeaders);
        res.end();
        return;
    }

    // Set CORS headers for all responses
    Object.keys(corsHeaders).forEach(key => {
        res.setHeader(key, corsHeaders[key]);
    });

    try {
        // Routes
        if (path === '/api/v1/products' && method === 'GET') {
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, data: products }));
        }
        else if (path === '/api/v1/products/best-sellers' && method === 'GET') {
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, data: bestSellers }));
        }
        else if (path === '/api/v1/products/top-rated' && method === 'GET') {
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, data: topRated }));
        }
        else if (path.startsWith('/api/v1/products/') && method === 'GET') {
            const productId = parseInt(path.split('/').pop());
            const product = products.find(p => p.id === productId);
            if (product) {
                res.writeHead(200);
                res.end(JSON.stringify({ success: true, data: product }));
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({ success: false, error: 'Product not found' }));
            }
        }
        else if (path === '/api/v1/deals' && method === 'GET') {
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, data: deals }));
        }
        else if (path === '/api/v1/categories/electronics/products' && method === 'GET') {
            const electronicsProducts = products.filter(p => p.category === 'electronics');
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, data: electronicsProducts }));
        }
        else if (path === '/api/v1/categories/fashion/products' && method === 'GET') {
            const fashionProducts = products.filter(p => p.category === 'fashion');
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, data: fashionProducts }));
        }
        else if (path.startsWith('/api/v1/categories/') && path.endsWith('/products') && method === 'GET') {
            const category = path.split('/')[4]; // Extract category from path
            const categoryProducts = products.filter(p => p.category === category);
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, data: categoryProducts }));
        }
        else if (path === '/api/v1/cart' && method === 'POST') {
            // Mock add to cart
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, message: 'Product added to cart' }));
        }
        else if (path === '/api/v1/cart' && method === 'GET') {
            // Mock get cart
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, data: { items: [], total: 0 } }));
        }
        else if (path === '/api/v1/wishlist' && method === 'GET') {
            // Mock get wishlist
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, data: { items: [] } }));
        }
        else if (path === '/api/v1/wishlist/toggle' && method === 'POST') {
            // Mock wishlist toggle
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, inWishlist: true }));
        }
        else {
            res.writeHead(404);
            res.end(JSON.stringify({ success: false, error: 'Endpoint not found' }));
        }
    } catch (error) {
        res.writeHead(500);
        res.end(JSON.stringify({ success: false, error: 'Internal server error' }));
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Mock API server running on http://localhost:${PORT}`);
    console.log('Available endpoints:');
    console.log('- GET /api/v1/products');
    console.log('- GET /api/v1/products/{id}');
    console.log('- GET /api/v1/deals');
    console.log('- GET /api/v1/products/best-sellers');
    console.log('- GET /api/v1/products/top-rated');
    console.log('- GET /api/v1/categories/{category}/products');
    console.log('- POST /api/v1/cart');
    console.log('- GET /api/v1/cart');
    console.log('- POST /api/v1/wishlist/toggle');
});