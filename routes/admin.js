const express = require('express');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const { body } = require('express-validator/check');

const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', isAuth, adminController.getAddProduct);

// /admin/add-product => POST
router.post('/add-product', [
    body('title')
        .trim()
        .isLength({min:3, max: 20})
        .withMessage('Title should be at least 3 chars and max 20 chars'),
    body('price')
        .trim()
        .isFloat()
        .withMessage('Provide Valid Price'),
    body('description')
        .trim()
        .isLength({min: 10, max: 300})
        .withMessage('Description should be at least 10 chars and max 300 chars')
], isAuth, adminController.postAddProduct);

// /admin/products => GET
router.get('/products', isAuth, adminController.getProducts);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post('/edit-product', [
    body('title')
        .trim()
        .isLength({min:3, max: 20})
        .withMessage('Title should be at least 3 chars and max 20 chars'),
    body('price')
        .trim()
        .isFloat()
        .withMessage('Provide Valid Price'),
    body('description')
        .trim()
        .isLength({min: 10, max: 300})
        .withMessage('Description should be at least 10 chars and max 300 chars')
], isAuth, adminController.postEditProduct);

router.delete('/product/:productId', isAuth, adminController.deleteProduct);

module.exports = router;


<!--            <input class="add-product__input <%= validationErrors.find(i => i.param === 'imageUrl') ? 'invalid' : '' %>" type="file" name="image" value="<%= editing ? product.imageUrl : oldInput.imageUrl %>">-->