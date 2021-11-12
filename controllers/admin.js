const Product = require('../models/product');

exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false
    })
};

exports.postAddProduct = (req, res, next) => { // get, post, put delete: these are basically app.use, same syntax
    const {
        user,
        body: {
            title,
            imageUrl,
            description,
            price,
    }} = req;
    
    user.createProduct({
    // Product.create({
        title,
        imageUrl,
        description,
        price
    })
        .then(result => res.redirect('/admin/products'))
        .catch(err => console.log(err));
}

exports.getEditProduct = (req, res, next) => {
    const { query: { editing } } = req;
    if (editing !== 'true') {
        return res.redirect('/');
    }
    const { user, params: { productId } } = req;
    user.getProducts({where: {id: productId}})
    // Product.findByPk(productId)
        .then(([product]) => {
            if (!product) {
                return res.redirect('/');
            }
            res.render('admin/edit-product', {
                pageTitle: 'Edit Product',
                path: '/admin/edit-product',
                editing,
                product
            });
        })
        .catch(err => console.log(err));
};

exports.postEditProduct = (req, res, next) => {
    const { body: {
        productId,
        title,
        price,
        imageUrl,
        description
    }} = req;

    Product.findByPk(productId)
        .then((product) => {
            product.title = title;
            product.price = price;
            product.imageUrl = imageUrl;
            product.description = description;
            return product.save();
        })
        .then(() => res.redirect('/admin/products'))
        .catch(err => console.log(err));
};

exports.getProducts = (req, res, next) => {
    const { user } = req;
    user.getProducts()
    // Product.findAll()
    .then((products) => {
        res.render('admin/products', {
            prods: products,
            pageTitle: 'Admin Products',
            path: '/admin/products',
        });
    })
    .catch(err => console.log(err));
}

exports.postDeleteProduct = (req, res, next) => {
    const { body: { productId }} = req;
    Product.findByPk(productId)
        .then((product) => product.destroy())
        .then(() => res.redirect('/admin/products'))
        .catch(err => console.log(err));
};
