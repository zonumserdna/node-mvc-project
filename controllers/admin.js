const Product = require('../models/product');
const { validationResult } = require('express-validator/check');
const fileHelper = require('../util/file');

exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        hasError: false,
        editing: false,
        errorMessage: null,
        validationErrors: []
    })
};

exports.postAddProduct = (req, res, next) => {
    const {
        file: image,
        user: { _id: userId },
        body: {
            title,
            price,
            description,
    }} = req;

    const errors = validationResult(req);

    if (!image) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            editing: false,
            hasError: true,
            product: {
                title,
                price,
                description,
            },
            errorMessage: 'Attached file is not an image.',
            validationErrors: []
        });
    }

    const imageUrl = image.path;

    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            editing: false,
            hasError: true,
            product: {
                title,
                price,
                description,
            },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array()
        });
    }

    const product = new Product({title, price, description, imageUrl, userId});
    product
        .save()
        .then(result => res.redirect('/admin/products'))
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            next(error); // it will skip all other MWs and will execute the special error handling MW
        });
}

exports.getEditProduct = (req, res, next) => {
    const { query: { editing }} = req;
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
                hasError: false,
                errorMessage: null,
                editing,
                product,
                validationErrors: []
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            next(error); // it will skip all other MWs and will execute the special error handling MW
        });
};

exports.postEditProduct = (req, res, next) => {
    const {
        file: image,
        body: {
            productId,
            title,
            price,
            description,
    }} = req;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/edit-product',
            editing: 'true',
            hasError: true,
            product: {
                title,
                price,
                description,
                _id: productId
            },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array()
        });
    }

    Product.findById(productId)
        .then((product) => {
            if (product.userId.toString() !== req.user._id.toString()) {// authorization
                return res.redirect('/');
            }
            product.title = title;
            product.price = price;
            product.description = description;

            if (image) {
                fileHelper.deleteFile(product.imageUrl);
                product.imageUrl = image.path;
            }
            return product
                .save()
                .then(() => res.redirect('/admin/products'));
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            next(error); // it will skip all other MWs and will execute the special error handling MW
        });
};

exports.getProducts = (req, res, next) => {
    Product.find({ userId: req.user._id}) // authorization
    // .select('title price description -_id') // selects some attributes of product, _id is excluded
    // .populate('userId', 'name') //populate data related to user (name in this case)
    .then((products) => {
        console.log(products);
        res.render('admin/products', {
            prods: products,
            pageTitle: 'Admin Products',
            path: '/admin/products'
        });
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        next(error); // it will skip all other MWs and will execute the special error handling MW
    });
}

exports.deleteProduct = (req, res, next) => {
    const { user, params: { productId }} = req;
    Product
        .findById(productId)
        .then(product => {
            if (!product) {
                next(new Error('Product not found.'))
            }
            fileHelper.deleteFile(product.imageUrl);
            return Product.deleteOne({ _id: productId, userId: user._id });// authorization
        })
        .then(() => {
            res.status(200).json({message: 'Success!'});
        })
        .catch(err => {
            res.status(500).json({message: 'Deleting product failed!'});
        });
};
