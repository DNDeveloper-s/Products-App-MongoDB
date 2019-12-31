const crypto = require('crypto');

const User = require('../models/user');

const sgMail = require('@sendgrid/mail');

exports.getProfile = (req, res, next) => {
    const userId = req.query.userId;
    User.findOne({_id: userId})
        .then(user => {
            if(!user) {
                req.flash('error', 'No Profile Exists');
                return res.redirect('/');
            }
            return res.render('user/profile', {
                pageTitle: `Your Profile | ${user.name}`,
                path: '/profile',
                errorMessage: req.flash('error'),
                userId: user
            })
        })
        .catch(err => {
            req.flash('error', 'No Profile Exists');
            return res.redirect('/');
            console.log(err);
        });
};

exports.postProfileEdits = (req, res, next) => {
    const name = req.body.name;
    const email = req.body.email;
    const address = req.body.address;
    const dp = req.file;
    const bio = req.body.bio;
    const id = req.body.userId;
    let dpPath;
    if(dp) {
        dpPath = dp.path;
    }

    User.findOne({_id: id})
        .then(user => {
            if(!user) {
                req.flash('error', 'No user Exists!');
                return res.redirect('/');
            }
            console.log('Line 43, controllers/profile', dp);
            user.name = name;
            user.email = email;
            if(dp) {
                user.dp = dpPath;
            }
            user.address = address;
            user.bio = bio;
            return user.save()
                .then(() => {
                    return res.redirect(`/profile?userId=${user._id}`);
                })
        })
        .catch(err => {
            req.flash('error', 'No user Exists!');
            console.log(err);
            return res.redirect('/');
        });
};

exports.postVerifyEmail = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if(err) {
            console.log(err);
            return res.redirect('/');
        }
        const token = buffer.toString('hex');
        User.findOne({_id: req.user._id})
            .then(user => {
                if(!user) {
                    req.flash('Error', 'No user found!');
                    return res.redirect('/');
                }
                user.verifyEmailToken = token;
                user.verifyEmailTokenExpiration = Date.now() + 3600000;
                return user.save()
                    .then(() => {
                        const msg = {
                            to: req.user.email,
                            from: 'saurabh@firstNodeApp.com',
                            subject: 'Verify Your Email',
                            text: 'You requested to reset your password',
                            html: `
                                <p>Click this <a href="/verifyEmail/${token}">Link</a> to verify your email.</p>
                            `,
                        };
                        sgMail.send(msg)
                            .then(data => {
                                req.flash('error', 'Mail has been sent');
                                console.log('Mail has been sent!', data);
                                return res.redirect('/');
                            })
                            .catch(err => console.log(err));
                    })
            })
    })
};

exports.verifyEmail = (req, res, next) => {
    const token = req.params.token;
        User.findOne({verifyEmailToken: token, verifyEmailTokenExpiration: {$gt: Date.now()}})
        .then(user => {
            if(user._id.toString() === req.user._id.toString()) {
                if(!user) {
                    req.flash('error', 'No User found to verify email!');
                    return res.redirect('/');
                }
                user.verifyEmailToken = undefined;
                user.verifyEmailTokenExpiration = undefined;
                user.isEmailVerified = true;
                return user.save()
                    .then(() => {
                        console.log('Email Verified');
                        req.flash('error', 'Email Verified');
                        return res.redirect('/');
                    })
            }
        })
        .catch(err => {
            req.flash('error', 'Something went wrong, Make sure link is not expired and You are logged in with your email.');
            console.log(err);
            return res.redirect('/');
        })
};