const fs = require('fs');
const path = require('path');
const Product = require('../models/product');
const Order = require('../models/order');

// private key
// const stripe = require('stripe')('sk_test_51K03lcLBBFIqTyTPua8kCSBu6yI1okup4s5eNMB9sehpXUUrzYN9mSw6eqKus6bpn1kRt810rvg2ChDl1ciagAlT001rrlYHET');
const stripe = require('stripe')(process.env.STRIPE_KEY);

const PDFDocument = require('pdfkit');

const ITEMS_PER_PAGE = 2;

exports.getProducts = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;

    Product
        .find()
        .countDocuments()
        .then(numProducts => {
            totalItems = numProducts;
            return Product
                .find()
                .skip((page - 1) * ITEMS_PER_PAGE) // 1 > 0; 2 > 2; 3 > 4; 4 > 6; 5 > 8
                .limit(ITEMS_PER_PAGE);
        })    
        .then((products) => {
            res.render('shop/product-list', {
                prods: products,
                pageTitle: 'Products',
                path: '/products',
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
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
    const page = +req.query.page || 1;
    let totalItems;

    Product
        .find()
        .countDocuments()
        .then(numProducts => {
            totalItems = numProducts;
            return Product
                .find()
                .skip((page - 1) * ITEMS_PER_PAGE) // 1 > 0; 2 > 2; 3 > 4; 4 > 6; 5 > 8
                .limit(ITEMS_PER_PAGE);
        })    
        .then((products) => {
            res.render('shop/index', {
                prods: products,
                pageTitle: 'Shop',
                path: '/',
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
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

exports.getCheckout = (req, res, next) => {
    let products;
    let total = 0;
    const { user } = req;
    user
        .populate('cart.items.productId')
        .then(u => {
            products = u.cart.items;
            total = 0;
            products.forEach((p) => {
                total = p.quantity * p.productId.price;
            });

            return stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: products.map(({quantity, productId}) => ({
                    name: productId.title,
                    description: productId.description,
                    amount: productId.price * 100, // specified in cents
                    currency: 'usd',
                    quantity
                })),
                success_url: `${req.protocol}://${req.get('host')}/checkout/success`,
                cancel_url: `${req.protocol}://${req.get('host')}/checkout/cancel`,
            });
        })
        .then(session => {
            res.render('shop/checkout', {
                path: '/checkout',
                pageTitle: 'Checkout',
                products,
                totalSum: total,
                sessionId: session.id
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            next(error); // it will skip all other MWs and will execute the special error handling MW
        });
}

exports.getCheckoutSuccess = (req, res, next) => {
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