const Product = require('../models/product');

exports.getProducts = (req, res, next) => {
    Product.fetchAll()
        .then((products) => {
            res.render('shop/product-list', {
                prods: products,
                pageTitle: 'All products',
                path: '/products',
            });
        }).catch(err => console.log(err));
}

exports.getProduct = (req, res, next) => {
    const { params: { productId } } = req;
    Product.findById(productId)
        .then((product) => {
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
        .then((products) => {
            res.render('shop/index', {
                prods: products,
                pageTitle: 'Shop',
                path: '/',
            });
        })
        .catch((err) => {
            console.log(err)
        });
}

exports.getCart = (req, res, next) => {
    const { user } = req;
    user.getCart()
        .then(products => {
            res.render('shop/cart', {
                path: '/cart',
                pageTitle: 'Your Cart',
                products
            });
        })
        .catch(err => console.log(err));
}

exports.postCart = (req, res, next) => {
    const { user, body: { productId } } = req;
    Product
        .findById(productId)
        .then(product => user.addToCart(product))
        .then(result => {
            res.redirect('/cart')
        })
        .catch(err => console.log(err));
}

exports.postCartDeleteProduct = (req, res, next) => {
    const { user, body: { productId } } = req;
    return user
        .deleteItemFromCart(productId)
        .then(result => {
            res.redirect('/cart')
        })
        .catch(err => console.log(err))

}

exports.postOrder = (req, res, next) => {
    const { user } = req;
    user
        .addOrder()
        .then(result => {
            res.redirect('/orders');
        })
        .catch(err => console.log(err));

}

exports.getOrders = (req, res, next) => {
    const { user } = req;
    user
        .getOrders()
        .then(orders => {
            res.render('shop/orders', {
                path: '/orders',
                pageTitle: 'Your Orders',
                orders
            });
        })
        .catch(err => console.log(err));
}
