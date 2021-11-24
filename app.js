const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const mongoDBSession = require('connect-mongodb-session');
const MongoDBStore = mongoDBSession(session);
const csrf = require('csurf');
const flash = require('connect-flash');


// const MONGODB_URI = 'mongodb+srv://expressjsuser:K2ey4I2$@cluster0.e6tzx.mongodb.net/shop?retryWrites=true&w=majority';
const MONGODB_URI = 'mongodb+srv://expressjsuser:K2ey4I2$@cluster0.e6tzx.mongodb.net/shop';

const app = express();
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions',

});

const csrfProtection = csrf();

const errorController = require('./controllers/error');
const User = require('./models/user');

// EJS
app.set('view engine', 'ejs'); // compile dynamic templates with ejs
app.set('views', 'views'); // where templates will be find

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

// use a middleware function

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'my secret', // should be a long string option in prod
    resave: false, // session will not be saved on every request that is done, so on every response that is sent, but only if something changed in the session (will improve performance)
    saveUninitialized: false, // basically ensure that no session gets saved for a request where it doesn't need to be saved because nothing was changed about it
    store: store
}));
app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use((req, res, next) => {
    // throw new Error('Sync dummy'); // this will execute the centralize error hadling MW
    const { session: { user: sessionUser }} = req;
    if (!sessionUser) {
        return next();
    }
    User.findById(sessionUser?._id)
        .then((user) => {
            if (!user) {
                return next();
            }
            req.user = user;
            next();
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            next(error); // it will skip all other MWs and will execute the special error handling MW
        });
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);


app.get('/500', errorController.get500);
app.use(errorController.get404);

// special centralized ERROR HANDLING MW (4 params MW)
// if more than one error handling MW is used, they'll execute from top to bottom, as normal MW
// this will not execute for 404 errors!!, 404 error is simply just a valid url which we catch with our catch all handler there where we then just happen to render the 404 page. This is not a technical error object that gets created at any point here
app.use((error, req, res, next) => {
    // res.status(error.httpStatusCode).render(...)
    // res.redirect('/500');

    res.status(error.httpStatusCode).render('500', {
        pageTitle: 'Error!',
        path: '/500',
        isAuthenticated: req.session.isLoggedIn
    });
});

mongoose.connect(MONGODB_URI)
    .then(() => app.listen(3001))
    .catch(err => console.log(err));