const crypto = require('crypto');

require('dotenv').config();
let AWS = require('aws-sdk');

const User = require('../models/user');
const bcryptjs = require('bcryptjs');
const otpGenerator = require('otp-generator');
const { validationResult }  = require('express-validator/check');

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('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');

exports.getLogin = (req, res, next) => {
    let message = req.flash('error');
    if(message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login | Saurabh Singh',
        errorMessage: message,
        oldInput: {
            email: '',
            password: ''
        },
        validationErrors: []
    });
};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login | Saurabh Singh',
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email: email,
                password: password
            },
            validationErrors: errors.array()
        });
    }
    User.findOne({email: email})
        .then(user => {
            if(!user) {
                // req.flash('error', 'Invalid Email.');
                return res.status(422).render('auth/login', {
                    path: '/login',
                    pageTitle: 'Login | Saurabh Singh',
                    errorMessage: 'Email doesn\'t exist',
                    oldInput: {
                        email: email,
                        password: password
                    },
                    validationErrors: []
                });
            }
            if(user) {
                return bcryptjs.compare(password, user.password)
                    .then(doMatch => {
                        if(doMatch) {
                            req.session.isLoggedIn = true;
                            req.session.user = user;
                            req.session.tempUser = undefined;
                            return req.session.save(err => {
                                console.log(err);
                                res.redirect('/');
                            });
                        }
                        // req.flash('error', 'Invalid Password.');
                        return res.status(422).render('auth/login', {
                            path: '/login',
                            pageTitle: 'Login | Saurabh Singh',
                            errorMessage: 'Password doesn\'t match',
                            oldInput: {
                                email: email,
                                password: password
                            },
                            validationErrors: []
                        });
                    })
                    .catch(err => {
                        console.log(err);
                        res.redirect('/login');
                    })
            }
        })
        .catch(err => console.log(err));
};

exports.getSignUp = (req, res, next) => {
    let message = req.flash('error');
    if(message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'SignUp | Saurabh Singh',
        isAuthenticated: req.session.isLoggedIn,
        errorMessage: message,
        oldInput: {
            name: '',
            email: '',
            password: '',
            confirmPassword: ''
        },
        validationErrors: []
    })
};

exports.postSignUp = (req, res, next) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('auth/signup', {
            path: '/signup',
            pageTitle: 'SignUp | Saurabh Singh',
            isAuthenticated: req.session.isLoggedIn,
            errorMessage: errors.array()[0].msg,
            oldInput: {
                name: name,
                email: email,
                password: password,
                confirmPassword: req.body.confirmPassword
            },
            validationErrors: errors.array()
        })
    }
    return bcryptjs.hash(password, 12)
        .then(hashedPassword => {
            const newUser = new User({
                name: name,
                email: email,
                password: hashedPassword,
                isEmailVerified: false,
                isOtpVerified: false,
                cart: {items: []}
            });
            req.session.tempUser = newUser;
            return res.redirect('/get-otp-page');
        })
        .catch(err => console.log(err));
};

exports.getOtpPage = (req, res, next) => {
    let message = req.flash('error');
    if(message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/send-otp', {
        pageTitle: 'Send Otp',
        path: '/send-otp',
        errorMessage: message
    })
};

exports.postOtp = (req, res, next) => {
    console.log(req.session.tempUser);
    const mobileno = req.body.phoneno;
    console.log(mobileno);

    const otpCode = otpGenerator.generate(6, {alphabets: false, upperCase: false, specialChars: false});

    bcryptjs.hash(otpCode, 12)
        .then(hashedOtp => {
            req.session.tempUser.verifyOtpToken = hashedOtp;
            req.session.tempUser.verifyOtpTokenExpiration = Date.now() + 120000;
            req.session.tempUser.mobileNumber = mobileno;
        })
        .catch(err => console.log(err));

    let params = {
        Message: `${otpCode} is so called OTP for your registration on Saurabh Shopping Node Application. Thanks for choosing us.`,
        PhoneNumber: '+91' + mobileno,
        MessageAttributes: {
            'AWS.SNS.SMS.SenderID': {
                'DataType': 'String',
                'StringValue': 'USERID'
            }
        }
    };

    let publishTextPromise = new AWS.SNS({ apiVersion: '2010-03-31' }).publish(params).promise();

    publishTextPromise.then(
        function (data) {
            req.flash('error', `Otp Sent to your mobile no ${mobileno}`);
            res.redirect(`/verify-otp?mobile=${mobileno}`);
        }).catch(
        function (err) {
            res.end(JSON.stringify({ Error: err }));
        });
};

exports.getVerifyOtp = (req, res, next) => {
    const mobileno = req.query.mobile;
    let message = req.flash('error');
    if(message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/verify-otp', {
        pageTitle: 'Verify Otp',
        path: 'verify-otp',
        errorMessage: message,
        mobile: mobileno
    });
};

exports.getResendOtp = (req, res, next) => {
    const mobileno = req.query.mobile;
    console.log('Resend OTP on mobile no.', mobileno);

    const otpCode = otpGenerator.generate(6, {alphabets: false, upperCase: false, specialChars: false});

    bcryptjs.hash(otpCode, 12)
        .then(hashedOtp => {
            req.session.tempUser.verifyOtpToken = hashedOtp;
            req.session.tempUser.verifyOtpTokenExpiration = Date.now() + 120000;
            req.session.tempUser.mobileNumber = mobileno;
        })
        .catch(err => console.log(err));

    let params = {
        Message: `${otpCode} is so called OTP for your registration on Saurabh Shopping Node Application. Thanks for choosing us.`,
        PhoneNumber: '+91' + mobileno,
        MessageAttributes: {
            'AWS.SNS.SMS.SenderID': {
                'DataType': 'String',
                'StringValue': 'USERID'
            }
        }
    };

    let publishTextPromise = new AWS.SNS({ apiVersion: '2010-03-31' }).publish(params).promise();

    publishTextPromise.then(
        function (data) {
            req.flash('error', 'Otp Resent');
            res.redirect(`/verify-otp?mobile=${mobileno}`);
        }).catch(
        function (err) {
            res.end(JSON.stringify({ Error: err }));
        });
};

exports.postVerifyOtp = (req, res, next) => {
    const enteredotp = req.body.enteredotp;
    return bcryptjs.compare(enteredotp, req.session.tempUser.verifyOtpToken)
        .then(isItMatched => {
            if(isItMatched && req.session.tempUser.verifyOtpTokenExpiration > Date.now()) {
                req.session.tempUser.verifyOtpToken = undefined;
                req.session.tempUser.verifyOtpTokenExpiration = undefined;
                req.session.tempUser.isOtpVerified = true;
                const user = new User({
                    name: req.session.tempUser.name,
                    email: req.session.tempUser.email,
                    password: req.session.tempUser.password,
                    mobileNumber: req.session.tempUser.mobileNumber,
                    isEmailVerified: req.session.tempUser.isEmailVerified,
                    isOtpVerified: req.session.tempUser.isOtpVerified,
                    cart: req.session.tempUser.cart
                });
                return user.save()
                    .then(() => {
                        req.flash('error', 'OTP verified');
                        res.redirect('/login');
                    })
                    .catch(err => {
                        req.flash('error', 'Something Went Wrong');
                        console.log(err);
                        return res.redirect('/');
                    })
            }
            req.flash('error', 'Otp is invalid');
            return res.redirect('/verify-otp');
        })
        .catch(err => {
            req.flash('error', 'Something Went Wrong');
            console.log(err);
            return res.redirect('/verify-otp');
        })
};

exports.getLogout = (req, res, next) => {
    console.log('Line 110, controller/auth', req.session);
    req.session.destroy(err => {
        console.log('Line 112, controller/auth', req.session);
        res.redirect('/');
    })
};

exports.getReset = (req, res, next) => {
    let message = req.flash('error');
    if(message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
   res.render('auth/reset', {
       path: '/reset',
       pageTitle: 'Reset Your Password',
       errorMessage: message
   })
};

exports.postReset = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('auth/reset', {
            path: '/reset',
            pageTitle: 'Reset Your Password',
            errorMessage: errors.array()[0].msg,
            // validationErrors: errors.array()
        });
    }
    crypto.randomBytes(32, (err, buffer) => {
        if(err) {
            console.log(err);
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        User.findOne({email: req.body.email})
            .then(user => {
                if(!user) {
                    req.flash('error', 'No user found with this email.');
                    console.log(err);
                    return res.redirect('/reset');
                }
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000;
                return user.save()
                    .then(() => {
                        const msg = {
                            to: req.body.email,
                            from: 'saurabh@firstNodeApp.com',
                            subject: 'Reset your password',
                            text: 'You requested to reset your password',
                            html: `
                        <p>Click this <a href="http://localhost:3000/reset/${token}">Link</a> to reset your password.</p>
                    `,
                        };
                        req.flash('error', 'Mail has been Sent!');
                        res.redirect('/login');
                        sgMail.send(msg)
                            .then(data => {
                                console.log('Mail has been sent!', data);
                            })
                            .catch(err => console.log(err));

                    })
            })
            .catch(err => console.log(err));
    })
};

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now()}})
        .then(user => {
            if(!user) {
                req.flash('error', 'Your link seems expired or invalid! Try generate new one.');
                return res.redirect('/login');
            }
            let message = req.flash('error');
            if(message.length > 0) {
                message = message[0];
            } else {
                message = null;
            }
            res.render('auth/new-password', {
                path: '/new-password',
                pageTitle: 'Set New Password',
                errorMessage: message,
                userId: user._id.toString(),
                passwordToken: token
            })
        })
        .catch(err => console.log(err));
};

exports.postNewPassword = (req, res, next) => {
    const userId = req.body.userId;
    const password = req.body.newPassword;
    const passwordToken = req.body.passwordToken;
    let resetUser;
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('auth/new-password', {
            path: '/new-password',
            pageTitle: 'Set New Password',
            errorMessage: errors.array()[0].msg,
            userId: userId.toString(),
            passwordToken: passwordToken
            // validationErrors: errors.array()
        });
    }
    User.findOne({resetToken: passwordToken, resetTokenExpiration: {$gt: Date.now()}, _id: userId})
        .then(user => {
            resetUser = user;
            return bcryptjs.hash(password, 12)
        })
        .then(hashedPassword => {
            resetUser.password = hashedPassword;
            resetUser.resetTokenExpiration = undefined;
            resetUser.resetToken = undefined;
            return resetUser.save();
        })
        .then(success => {
            console.log('Successfully Updated');
            req.flash('error', 'Password has been reset successfully!');
            return res.redirect('/login');
        })
        .catch(err => {
            console.log(err);
        })
};