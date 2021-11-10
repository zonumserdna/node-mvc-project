const Product = require('../models/product');

exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false
    })
};

exports.postAddProduct = (req, res, next) => { // get, post, put delete: these are basically app.use, same syntax
    const {body: {
        title,
        imageUrl,
        description,
        price,
    }} = req;
    
    const product = new Product(null, title,
        imageUrl,
        description,
        price);
    product.save();
    res.redirect('/');
}

exports.getEditProduct = (req, res, next) => {
    const { query: { editing } } = req;
    if (editing !== 'true') {
        return res.redirect('/');
    }
    const { params: { productId } } = req;
    Product.findById(productId, (product) => {
        if (!product) {
            return res.redirect('/');
        }
        res.render('admin/edit-product', {
            pageTitle: 'Edit Product',
            path: '/admin/edit-product',
            editing,
            product
        });
    });
};

exports.postEditProduct = (req, res, next) => {
    const { body: {
        productId,
        title,
        price,
        imageUrl,
        description
    }} = req;

    const updatedProduct = new Product(productId, title, imageUrl, description, price)
    updatedProduct.save();
    res.redirect('/admin/products');
};

exports.getProducts = (req, res, next) => {
    Product.fetchAll((products) => {
        res.render('admin/products', {
            prods: products,
            pageTitle: 'Admin Products',
            path: '/admin/products',
        });
    });
}

exports.postDeleteProduct = (req, res, next) => {
    const { body: { productId }} = req;
    Product.deleteById(productId, () => {
        res.redirect('/admin/products');
    })
};
