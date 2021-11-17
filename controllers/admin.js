const Product = require('../models/product');

exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false
    })
};

exports.postAddProduct = (req, res, next) => {
    const {
        user: { _id },
        body: {
            title,
            price,
            description,
            imageUrl,
    }} = req;
    const product = new Product(title, price, description, imageUrl, null, _id);
    product
        .save()
        .then(result => res.redirect('/admin/products'))
        .catch(err => console.log(err));
}

exports.getEditProduct = (req, res, next) => {
    const { query: { editing } } = req;
    if (editing !== 'true') {
        return res.redirect('/');
    }
    const { params: { productId } } = req;
    Product.findById(productId)
        .then((product) => {
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
        description,
        imageUrl,
    }} = req;

    Product.findById(productId)
        .then((productData) => {
            const product = new Product(title, price, description, imageUrl, productId);
            return product.save();
        })
        .then(() => res.redirect('/admin/products'))
        .catch(err => console.log(err));
};

exports.getProducts = (req, res, next) => {
    Product.fetchAll()
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
    Product.deleteById(productId)
        .then(() => res.redirect('/admin/products'))
        .catch(err => console.log(err));
};
