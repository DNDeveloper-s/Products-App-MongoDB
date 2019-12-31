const mongodb = require('mongoose');

const { validationResult } = require('express-validator/check');
const fileHelper = require('../utils/file');
const Product = require('../models/product');

exports.getAddProduct = (req, res, next) => {
    let message = req.flash('error');
    if(message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('admin/edit-product', {
        pageTitle: 'Add Product | Saurabh Singh', 
        path: '/admin/add-product',
        editing: false,
        errorMessage: message,
        oldInput: {
            title: '',
            imageUrl: '',
            price: '',
            description: '',
        },
        validationErrors: []
    });
};

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    console.log('I am on 31');
    const image = req.file;
    console.log('Line 33, controllers/admin', image);
    const price = req.body.price;
    const description = req.body.description;
    const errors = validationResult(req);

    if(!image) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product | Saurabh Singh',
            path: '/admin/add-product',
            editing: false,
            errorMessage: 'Attached File is not an image.',
            oldInput: {
                title: title,
                price: price,
                description: description,
            },
            validationErrors: []
        });
    }

    const imageUrl = '/' + image.path;

    if(!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product | Saurabh Singh',
            path: '/admin/add-product',
            editing: false,
            errorMessage: errors.array()[0].msg,
            oldInput: {
                title: title,
                price: price,
                description: description,
            },
            validationErrors: errors.array()
        });
    }
    const product = new Product({
        title: title,
        imageUrl: imageUrl,
        price: price,
        description: description,
        userId: req.session.user
    });
    product.save()
        .then(data => {
            req.flash('error', 'Product Successfully Posted!');
            res.redirect('/admin/products');
        })
        .catch(err => console.log(err));
};

exports.getProducts = (req, res, next) => {
    let message = req.flash('error');
    if(message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    Product.find({userId: req.user._id})
        .then(products => {
            res.render('admin/products', {
                prods: products,
                pageTitle: 'Admin Products',
                path: '/admin/products',
                isAuthenticated: req.session.isLoggedIn,
                hasError: false,
                errorMessage: message
            });
        })
        .catch(err => console.log(err));
};

exports.getEditProduct = (req, res, next) => {
    let message = req.flash('error');
    if(message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    const editMode = req.query.edit;
    if(!editMode) {
        return res.redirect('/');
    }
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then(product => {
            console.log('Line 44 from /controller/admin', product);
            if(!product) {
                return res.redirect('/');
            }
            res.render('admin/edit-product', {
                pageTitle: 'Edit Product | Saurabh Singh',
                path: '/admin/edit-product',
                editing: editMode,
                product: product,
                isAuthenticated: req.session.isLoggedIn,
                errorMessage: message,
                oldInput: {
                    title: '',
                    imageUrl: '',
                    price: '',
                    description: '',
                },
                validationErrors: []
            });
        })
        .catch(err => console.log(err));
};

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const image = req.file;
    const updatedPrice = req.body.price;
    const updatedDescription = req.body.description;
    const errors = validationResult(req);
    Product.findById(prodId)
        .then(product => {
            if(!errors.isEmpty()) {
                return res.status(422).render('admin/edit-product', {
                    pageTitle: 'Add Product | Saurabh Singh',
                    path: '/admin/add-product',
                    editing: true,
                    product: product,
                    errorMessage: errors.array()[0].msg,
                    oldInput: {
                        title: updatedTitle,
                        price: updatedPrice,
                        description: updatedDescription,
                    },
                    validationErrors: errors.array()
                });
            }
            if(product.userId.toString() !== req.user._id.toString()) {
                return res.redirect('/');
            }
            product.title = updatedTitle;
            if(image) {
                fileHelper.deleteFile(product.imageUrl);
                product.imageUrl = '/' + image.path;
            }
            product.price = updatedPrice;
            product.description = updatedDescription;
            return product.save()
                .then(product => {
                    console.log('Product Updated');
                    res.redirect('/admin/products');
                })
        })
        .catch(err => console.log(err));
};

exports.deleteProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then(product => {
            fileHelper.deleteFile(product.imageUrl);
            return Product.deleteOne({_id: prodId, userId: req.user._id});
        })
        .then(result => {
            console.log('Product Deleted');
            return Product.find({userId: req.user._id});
        })
        .then(products => {
            res.status(200).json({message: 'Product Deleted Successfully!'});
        })
        .catch(err => {
            res.status(500).json({message: 'Product Deletion failed!'});
        });
};
