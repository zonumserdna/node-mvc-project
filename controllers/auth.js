const User = require('../models/user');
const bcrypt = require('bcryptjs');

exports.getLogin = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    }  else {
        message = null;
    }
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        errorMessage: message
    });
}

exports.getSignup = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    }  else {
        message = null;
    }
    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'Signup',
        errorMessage: message
    });
};

exports.postLogin = (req, res, next) => {
    const { body: { email, password }} = req;
    User
        .findOne({ email })
        .then((user) => {
            if (!user) {
                req.flash('error', 'Invalid email or password');
                return res.redirect('/login');
            }
            bcrypt
                .compare(password, user.password)
                .then(doMatch => {
                    if (doMatch) {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        return req.session.save((err) => {
                            console.log(err);
                            res.redirect('/');
                        });
                    }
                    req.flash('error', 'Invalid email or password');
                    res.redirect('/login');
                })
                .catch(err => {
                    console.log(err);
                    res.redirect('/login');
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

exports.postSignup = (req, res, next) => {
    const { body: { email, password, confirmPassword }} = req;
    User
        .findOne({ email })
        .then(userDoc => {
            if (userDoc) {
                req.flash('error', 'E-Mail already exists, please pick a different one.');
                return res.redirect('/signup');
            }
            
            return bcrypt
                .hash(password, 12)
                .then(hashedPassword => {
                    const user = new User({ email, password: hashedPassword, cart: { items: [] }});
                    user.save();
                    return res.redirect('/login');
                });
        })
        .catch(err => console.log(err));
};
