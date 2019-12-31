const express = require('express');
const { check, body } = require('express-validator/check');

const User = require('../models/user');

const router = express.Router();

const authController = require('../controllers/auth');

router.get('/login', authController.getLogin);

router.post('/login',
    [
        check('email')
            .normalizeEmail()
            .isEmail()
            .withMessage('Please enter valid Email'),
        body('password', 'Enter Valid Password!')
            .trim()
            .isLength({min: 8})
            .isAlphanumeric()
    ]
    , authController.postLogin);

router.get('/logout', authController.getLogout);

router.get('/signUp', authController.getSignUp);

router.post('/signUp',
    [
        check('name', 'Name field can\'t be empty')
            .trim()
            .isByteLength({min: 4, max: 30}),
        check('email')
            .normalizeEmail()
            .isEmail()
            .withMessage('Please enter a valid email!')
            .custom((value, {req}) => {
                return User.findOne({email: value})
                    .then(user => {
                        if(user) {
                            console.log(user.email, value);
                            return Promise.reject('User already exists with that email.');
                        }
                    })
            }),
        body('password', 'Please enter password with at least 8 chars and only numbers and characters are allowed!')
            .trim()
            .isLength({min: 8, max: 199})
            .isAlphanumeric(),
        body('confirmPassword', 'Passwords do not match!')
            .trim()
            .custom((value, {req}) => {
                return value === req.body.password;
            })
    ]
    , authController.postSignUp);

router.get('/reset', authController.getReset);

router.post('/reset', [
    body('email')
        .normalizeEmail()
        .isEmail()
], authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', [
    body('newPassword', 'Please enter password with at least 8 chars and only numbers and characters are allowed!')
        .trim()
        .isLength({min: 8, max: 199})
        .isAlphanumeric(),
    body('confirmPassword', 'Passwords do not match!')
        .trim()
        .custom((value, {req}) => {
            return value === req.body.newPassword;
        })
], authController.postNewPassword);

router.get('/get-otp-page', authController.getOtpPage);

router.post('/send-otp', authController.postOtp);

router.get('/verify-otp', authController.getVerifyOtp);

router.get('/resend-otp', authController.getResendOtp);

router.post('/verify-otp', authController.postVerifyOtp);

module.exports = router;