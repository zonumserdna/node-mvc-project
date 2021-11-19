const Product = require('../models/product');
// const User = require('../models/user');

exports.getAddProduct = (req, res, next) => {
    const { session: { isLoggedIn: isAuthenticated }} = req;
    res.render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false,
        isAuthenticated
    })
};

exports.postAddProduct = (req, res, next) => {
    const {
        user: { _id: userId },
        body: {
            title,
            price,
            description,
            imageUrl,
    }} = req;
    const product = new Product({title, price, description, imageUrl, userId});
    product
        .save()
        .then(result => res.redirect('/admin/products'))
        .catch(err => console.log(err));
}

exports.getEditProduct = (req, res, next) => {
    const { query: { editing }, session: { isLoggedIn: isAuthenticated }} = req;
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
                product,
                isAuthenticated
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
        .then((product) => {
            product.title = title;
            product.price = price;
            product.description = description;
            product.imageUrl = imageUrl;
            return product.save();
        })
        .then(() => res.redirect('/admin/products'))
        .catch(err => console.log(err));
};

exports.getProducts = (req, res, next) => {
    const { session: { isLoggedIn: isAuthenticated }} = req;
    Product.find()
    // .select('title price description -_id') // selects some attributes of product, _id is excluded
    // .populate('userId', 'name') //populate data related to user (name in this case)
    .then((products) => {
        console.log(products);
        res.render('admin/products', {
            prods: products,
            pageTitle: 'Admin Products',
            path: '/admin/products',
            isAuthenticated
        });
    })
    .catch(err => console.log(err));
}

exports.postDeleteProduct = (req, res, next) => {
    const { body: { productId }} = req;
    Product.findByIdAndRemove(productId)
        .then(() => res.redirect('/admin/products'))
        .catch(err => console.log(err));
};
