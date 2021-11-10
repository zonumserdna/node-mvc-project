const Product = require('../models/product');
const Cart = require('../models/cart');

exports.getProducts = (req, res, next) => {
    Product.fetchAll()
        .then(([rows, fieldData]) => {
            res.render('shop/product-list', {
                prods: rows,
                pageTitle: 'All products',
                path: '/products',
            });
        }).catch(err => console.log(err));
}

exports.getProduct = (req, res, next) => {
    const {params: { productId} } = req;
    Product.findById(productId)
        .then(([[product], fieldData]) => {
            res.render('shop/product-detail', {
                product,
                pageTitle: product.title,
                path: '/products',
            });
        })
        .catch(err => console.log(err));
};

exports.getIndex = (req, res, next) => {
    Product.fetchAll()
        .then(([rows, fieldData]) => {
            res.render('shop/index', {
                prods: rows,
                pageTitle: 'Shop',
                path: '/',
            });
        })
        .catch((err) => {
            console.log(err)
        });
}

exports.getCart = (req, res, next) => {
    Cart.getCart((cart) => {
        Product.fetchAll((products) => {
            const cartProducts = [];
            for (product of products) {
                const cartProductData = cart.products.find(p => p.id === product.id);
                if (cart.products.find((p) => p.id === product.id)) {
                    cartProducts.push({productData: product, qty: cartProductData.qty});
                }
            }

            res.render('shop/cart', {
                path: '/cart',
                pageTitle: 'Your Cart',
                products: cartProducts
            });
        });
    });
}

exports.postCart = (req, res, next) => {
    const { body: { productId } } = req;
    Product.findById(productId, (product) => {
        Cart.addProduct(product.id, product.price)
    });
    res.redirect('/cart');
}

exports.postCartDeleteProduct = (req, res, next) => {
    const {body: { productId }} = req;
    Product.findById(productId, (product) => {
        Cart.deleteProduct(productId, product.price);
        res.redirect('/cart');
    });
}

exports.getOrders = (req, res, next) => {
    res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
    });
}

exports.getCheckout = (req, res, next) => {
    res.render('shop/checkout', {
        path: '/checkout',
        pageTitle: 'Checkout',
    });
}