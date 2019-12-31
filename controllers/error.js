exports.get404 = (req, res, next) => {
    res.status(404).render('404', {pageTitle: '404 Error Page', path: '/none', isAuthenticated: req.session.isLoggedIn});
};