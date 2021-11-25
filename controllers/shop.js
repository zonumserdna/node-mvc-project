const fs = require('fs');
const path = require('path');
const Product = require('../models/product');
const Order = require('../models/order');
const User = require('../models/user');
const PDFDocument = require('pdfkit');

exports.getProducts = (req, res, next) => {
    Product.find()
        .then((products) => {
            res.render('shop/product-list', {
                prods: products,
                pageTitle: 'All products',
                path: '/products'
            });
        }).catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            next(error); // it will skip all other MWs and will execute the special error handling MW
        });
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
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            next(error); // it will skip all other MWs and will execute the special error handling MW
        });
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
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            next(error); // it will skip all other MWs and will execute the special error handling MW
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
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            next(error); // it will skip all other MWs and will execute the special error handling MW
        });
}

exports.postCart = (req, res, next) => {
    const { user, body: { productId } } = req;
    Product
        .findById(productId)
        .then(product => user.addToCart(product))
        .then(result => {
            res.redirect('/cart')
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            next(error); // it will skip all other MWs and will execute the special error handling MW
        });
}

exports.postCartDeleteProduct = (req, res, next) => {
    const { user, body: { productId } } = req;
    return user
        .removeFromCart(productId)
        .then(result => {
            res.redirect('/cart')
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            next(error); // it will skip all other MWs and will execute the special error handling MW
        });

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
                    email: req.user.email,
                    userId: req.user
                },
                products
            });
            return order.save();
        })
        .then(result => user.clearCart())
        .then(() => {
            res.redirect('/orders');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            next(error); // it will skip all other MWs and will execute the special error handling MW
        });

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
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            next(error); // it will skip all other MWs and will execute the special error handling MW
        });
}

exports.getInvoice = (req, res, next) => {
    const { params: { orderId }} = req;
    Order
        .findById(orderId)
        .then((order => {
            if (!order) {
                return next(new Error('No order found.'));
            }
            if (order.user.userId.toString() !== req.user._id.toString()) {
                return next(new Error('Unauthorized'));
            }

            const invoiceName = `invoice-${orderId}.pdf`;
            const invoicePath = path.join('data', 'invoices', invoiceName);
            // ===> creating the pdf
            const pdfDoc = new PDFDocument();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="${invoiceName}"`);
            pdfDoc.pipe(fs.createWriteStream(invoicePath)); // streaming to write the pdf, stored in the server not only in the client
            pdfDoc.pipe(res); // return the streaming to the client, so pipe the output into response
            pdfDoc.fontSize(26).text('Invoice', {underline: true});
            pdfDoc.fontSize(14).text('---------------------------------------------------------------');
            let totalPrice = 0;
            order.products.forEach(p => {
                totalPrice += p.quantity * p.product.price;
                pdfDoc.fontSize(14).text(`${p.product.title} - ${p.quantity} x $${p.product.price}`);
                pdfDoc.text('---');
                pdfDoc.fontSize(20).text(`Total price: $${totalPrice}`);

            });
            pdfDoc.end(); // the writable streams for creating the file and for sending the response will be closed



            // ===> reading entire file (existing file in server)
            // fs.readFile(invoicePath, (err, data) => {
            //     if (err) {
            //         return next(err);
            //     }

            //     res.setHeader('Content-Type', 'application/pdf');
            //     // res.setHeader('Content-Disposition', `inline; filename="${invoiceName}"`);// how the content should be served to the client, inline tells the browser to open the file
            //     res.setHeader('Content-Disposition', `attachment; filename="${invoiceName}"`);// attachments tells the browser to download the file
            //     res.send(data);
            // });

            // ===> streaming the responseData (big files), reads the file in different chunks (existing file in server)
            // const file = fs.createReadStream(invoicePath);
            // res.setHeader('Content-Type', 'application/pdf');
            // res.setHeader('Content-Disposition', `inline; filename="${invoiceName}"`);

            // file.pipe(res); // forward the readed data to the response, the response is a writable stream
        }))
        .catch(err => next(err));
};