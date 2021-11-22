const Product = require('../models/product');
const Order = require('../models/order');
const User = require('../models/user');

exports.getProducts = (req, res, next) => {
    Product.find()
        .then((products) => {
            res.render('shop/product-list', {
                prods: products,
                pageTitle: 'All products',
                path: '/products'
            });
        }).catch(err => console.log(err));
}

exports.getProduct = (req, res, next) => {
    const { params: { productId }} = req;
    Product.findById(productId)
        .then((product) => {
            res.render('shop/product-detail', {
                product,
                pageTitle: product.title,
                path: '/products'
            });
        })
        .catch(err => console.log(err));
};

exports.getIndex = (req, res, next) => {
    Product.find()
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
    user
        .populate('cart.items.productId')
        .then(u => {
            const { cart: { items: products}} = u;
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
        .removeFromCart(productId)
        .then(result => {
            res.redirect('/cart')
        })
        .catch(err => console.log(err))

}

exports.postOrder = (req, res, next) => {
    const { user } = req;
    user
        .populate('cart.items.productId')
        .then(({ cart }) => {
            const products = cart.items.map(i => ({
                quantity: i.quantity,
                product: { ...i.productId._doc }
            }));
            const order = new Order({
                user: {
                    email: user.email,
                    userId: user
                },
                products
            });
            return order.save();
        })
        .then(result => user.clearCart())
        .then(() => {
            res.redirect('/orders');
        })
        .catch(err => console.log(err));

}

exports.getOrders = (req, res, next) => {
    const { user } = req;
    Order
        .find({ 'user.userId': user._id })
        .then(orders => {
            res.render('shop/orders', {
                path: '/orders',
                pageTitle: 'Your Orders',
                orders
            });
        })
        .catch(err => console.log(err));
}
