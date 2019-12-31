module.exports = (req, res, next) => {
    if(!req.session.isLoggedIn) {
        // req.flash('error', 'You need to login for such pages!');
        next('You need to login!');
    }
    next();
};