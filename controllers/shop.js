const fs = require('fs');
const path = require('path');

const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');

const Product = require('../models/product');
const Order = require('../models/order');

const PRODUCTS_PER_PAGE = 9;

exports.getProducts = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;
    let message = req.flash('error');
    if(message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    Product.find()
        .countDocuments()
        .then(productCount => {
            totalItems = productCount;
            return Product.find()
                .skip((page * PRODUCTS_PER_PAGE) - PRODUCTS_PER_PAGE)
                .limit(PRODUCTS_PER_PAGE)
                .populate('userId')
        })
        .then(products => {
            res.render('shop/product-list', {
                prods: products,
                pageTitle: 'My Shop',
                path: '/products',
                isAuthenticated: req.session.isLoggedIn,
                errorMessage: message,
                currentPage: page,
                hasNextPage: PRODUCTS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page-1,
                lastPage: Math.ceil(totalItems / PRODUCTS_PER_PAGE)
            });
        }).catch((err => console.log(err)));
};

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then((product) => {
            console.log( 'Line 19 from shop.js/routes', product);
            res.render('shop/product-details', {
                pageTitle: `${product.title}`,
                product: product,
                path: '/products',
                isAuthenticated: req.session.isLoggedIn
            })
        })
        .catch(err => console.log(err));
};

exports.getIndex = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;
    let message = req.flash('error');
    if(message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    Product.find()
        .countDocuments()
        .then(productCount => {
            totalItems = productCount;
            return Product.find()
                .skip((page * PRODUCTS_PER_PAGE) - PRODUCTS_PER_PAGE)
                .limit(PRODUCTS_PER_PAGE)
        })
        .then(products => {
            res.render('shop/index', {
                prods: products,
                pageTitle: 'Home Page | Saurabh Singh',
                path: '/',
                isAuthenticated: req.session.isLoggedIn,
                errorMessage: message,
                currentPage: page,
                hasNextPage: PRODUCTS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page-1,
                lastPage: Math.ceil(totalItems / PRODUCTS_PER_PAGE)
            });
        }).catch((err => console.log(err)));
};

exports.getCart = (req, res, next) => {
    console.log('Line 46 from shop.js', req.session.user);
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            let products = user.cart.items;
            res.render('shop/cart', {
                pageTitle: 'Your Cart | Saurabh Singh',
                path: '/cart',
                products: products,
                isAuthenticated: req.session.isLoggedIn
            });
        })
        .catch(err => console.log(err));
};
exports.postCart = async (req, res, next) => {
    const prodId = req.params.productId;
    console.log('Line 115 from controllers/shop', prodId);
    try {
        const product = await Product.findById(prodId);
        console.log(product);
        await req.user.addToCart(product);
        return res.json({message: 'Product added to cart successfully and it is amazing to do so!', imageUrl: product.imageUrl});
    } catch(err) {
        console.log(err);
    }
};

exports.postCartDeleteProduct = async (req, res, next) => {
    const prodId = req.body.productId;
    try {
        const product = await Product.findById(prodId);
        await req.user.deleteCartItemById(prodId);
        res.json({message: 'Cart Item deleted!', imageUrl: product.imageUrl});
    } catch(err) {
        console.log(err);
    }


};

exports.postOrder = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            const products = user.cart.items.map(i => {
                return {product: {...i.productId._doc}, quantity: i.quantity}
            });
            const order = new Order({
                user: {
                    email: req.session.user.email,
                    userId: req.user
                },
                products: products
            });
            return order.save();
        })
        .then(data => {
            req.user.cart = {items: []};
            return req.user.save();
        })
        .then(() => {
            res.redirect('/orders')
        })
        .catch(err => console.log(err));
};

exports.getOrders = (req, res, next) => {
    Order.find({'user.userId': req.session.user._id})
        .then(orders => {
            res.render('shop/orders', {
                pageTitle: 'Your Orders | Saurabh Singh',
                path: '/orders',
                orders: orders,
                isAuthenticated: req.session.isLoggedIn
            });
        })
        .catch(err => console.log(err));
};

exports.getInvoice = (req, res, next) => {
    const orderId = req.params.orderId;
    Order.findById(orderId)
        .then(order => {
            if(!order) {
                req.flash('error', 'No Order found!');
                return res.redirect('/');
            }
            if(order.user.userId.toString() !== req.user._id.toString()) {
                req.flash('error', 'You are not authorized for this order! Please login to account with it is placed!');
                return res.redirect('/');
            }
            const invoiceName = 'invoice-' + orderId + '.pdf';
            const invoicePath = path.join('data', 'invoices', invoiceName);

            const pdfDoc = new PDFDocument();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=${invoiceName}`);
            pdfDoc.pipe(fs.createWriteStream(invoicePath));
            pdfDoc.pipe(res);
            pdfDoc.fontSize(26).text('INVOICE', {
                // underline: true,
                align: 'center'
            });
            pdfDoc.lineWidth(1);
            pdfDoc.lineCap('butt')
                .moveTo(0, 130)
                .lineTo(900, 130)
                .stroke();
            let imageName = null;
            let price = 0;
            order.products.forEach((cur, ind) => {
                price = (cur.product.price * cur.quantity) + price;
                const x = (160 * (ind+1)) - ((ind) * 80);
                pdfDoc.fontSize(14).text(`${ind + 1}.`, 60, x);
                pdfDoc.fontSize(14).text(cur.product.title, 80, x);
                imageName = cur.product.imageUrl.split('\\')[1];
                pdfDoc.image(path.join('productImages', imageName), 220, x - 15, {width: 90, height: 60});
                pdfDoc.text(`Qty: ${cur.quantity}`, 390, x);
                pdfDoc.text(`$${(cur.product.price * cur.quantity).toFixed(2)}`, 470, x);
                if(ind === order.products.length-1) {
                    pdfDoc.fillColor('salmon').text(`Total Price: $${price.toFixed(2)}`, 390, x + 100);
                    // pdfDoc.text(`$${price.toFixed(2)}`, 470);
                    pdfDoc.fillColor('#272727').text('Thanks for shopping with us!', 220, x+130);
                }
            });
            pdfDoc.end();
            // fs.readFile(invoicePath, (err, data) => {
            //     if(err) {
            //         console.log(err);
            //     }
            //     res.setHeader('Content-Type', 'application/pdf');
            //     res.setHeader('Content-Disposition', `inline; filename=${invoiceName}`);
            //     res.send(data);
            // });
        })
        .catch(err => {
            req.flash('error', 'Something went wrong');
            console.log(err);
            return res.redirect('/');
        });
};

// exports.getCheckout = (req, res, next) => {
//     res.render('shop/checkout', {
//         pageTitle: 'Checkout | Saurabh Singh',
//         path: '/checkout'
//     });
// };