const User = require('../models/user');

exports.getLogin = (req, res, next) => {
    const { session: { isLoggedIn }} = req;
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        isAuthenticated: isLoggedIn
    });
}

exports.postLogin = (req, res, next) => {
    User
        .findById("6195081099ee6a3b3c25da5c")
        .then((user) => {
            req.session.isLoggedIn = true;
            req.session.user = user;
            req.session.save((err) => {
                res.redirect('/');
            });
        })
        .catch();
    // res.setHeader('Set-Cookie', 'loggedIn=true; Max-Age=10');
}

exports.postLogout = (req, res, next) => {
    const { session } = req;
    session.destroy((err) => {
        console.log(err);
        res.redirect('/');
    });
}
