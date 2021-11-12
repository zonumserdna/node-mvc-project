const Product = require('../models/product');

exports.getProducts = (req, res, next) => {
    Product.findAll()
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
    Product.findByPk(productId)
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
    Product.findAll()
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
        .then(cart => cart.getProducts())
        .then(cartProducts => {
            res.render('shop/cart', {
                path: '/cart',
                pageTitle: 'Your Cart',
                products: cartProducts
            });
        })
        .catch(err => console.log(err));
}

exports.postCart = (req, res, next) => {
    const { user, body: { productId } } = req;
    let fetchedCart;
    let newQuantity = 1;
    user
        .getCart()
        .then(cart => {
            fetchedCart = cart;
            return cart.getProducts({ where: { id: productId } });
        })
        .then(products => {
            let product;
            if (products.length > 0) {
                product = products[0];
            }
            if (product) {
                const { cartItem: { quantity: oldQuantity } } = product;
                newQuantity = oldQuantity + 1;
                return product
            }
            return Product.findByPk(productId)
        })
        .then(product => {
            return fetchedCart.addProduct(product, {
                through: { quantity: newQuantity }
            });
        })
        .then(() => res.redirect('./cart'))
        .catch(err => console.log(err))
}

exports.postCartDeleteProduct = (req, res, next) => {
    const { user, body: { productId } } = req;
    user
        .getCart()
        .then(cart => cart.getProducts({ where: { id: productId } }))
        .then(products => {
            const product = products[0];
            return product.cartItem.destroy();
        })
        .then(result => {
            res.redirect('/cart')
        })
        .catch(err => console.log(err))

}

exports.postOrder = (req, res, next) => {
    const { user } = req;
    let fetchedCart;
    user
        .getCart()
        .then(cart => {
            fetchedCart = cart;
            return cart.getProducts();
        })
        .then(products => user.createOrder()
            .then(order => order.addProducts(products.map(product => {
                product.orderItem = { quantity: product.cartItem.quantity };
                return product;
            })))
            .catch(err => console.log(err))
        )
        .then(result => fetchedCart.setProducts(null))
        .then(result => {
            res.redirect('/orders');
        })
        .catch(err => console.log(err));

}

exports.getOrders = (req, res, next) => {
    const { user } = req;
    user
        .getOrders({ include: ['products']})
        .then(orders => {
            res.render('shop/orders', {
                path: '/orders',
                pageTitle: 'Your Orders',
                orders
            });
        })
        .catch(err => console.log(err));
}
