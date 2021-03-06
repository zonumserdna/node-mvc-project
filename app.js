const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const mongoDBSession = require('connect-mongodb-session');
const MongoDBStore = mongoDBSession(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const fs = require('fs');
/**
Parses incomming requests for files or requests with mixed data (plain+files)
> enctype="application/x-www-form-urlencoded": form with plain text (default)
> enctype="multipart/form-data": form with mixed data

multer will be looking for incomming requests with multipart/form-data type of data and will be able
to parse both text and binary data
 */
const multer = require('multer');

/*
Helmet helps you secure your Express apps by setting various HTTP headers
*/
const helmet = require('helmet');

/*
compression helps to serve optimized assets
*/
const compression = require('compression');

/*
Logs, commonly logging is done by hosting providers, but it is a good package to do it mannually
more on logs https://blog.risingstack.com/node-js-logging-tutorial/
*/
const morgan = require('morgan');

/*
Set env variables for production has a problem with windows env,
Review this link
https://www.udemy.com/course/nodejs-the-complete-guide/learn/lecture/12198022#questions/9925546

the solution is to write the start in package.json like this
"start": "SET NODE_ENV=production&&SET MONGO_USER=expressjsuser&&SET MONGO_PASSWORD=K2ey4I2$&&SET MONGO_DEFAULT_DATABASE=shop&&SET STRIPE_KEY=sk_test_51K03lcLBBFIqTyTPua8kCSBu6yI1okup4s5eNMB9sehpXUUrzYN9mSw6eqKus6bpn1kRt810rvg2ChDl1ciagAlT001rrlYHET&& node app.js",
instead of this
this works in linux
"start": "NODE_ENV=production MONGO_USER=expressjsuser MONGO_PASSWORD=K2ey4I2$ MONGO_DEFAULT_DATABASE=shop STRIPE_KEY=sk_test_51K03lcLBBFIqTyTPua8kCSBu6yI1okup4s5eNMB9sehpXUUrzYN9mSw6eqKus6bpn1kRt810rvg2ChDl1ciagAlT001rrlYHET node app.js",

To do the windows solution compatible with linux, it is needed to add the cross-env as dev dependency
*/

/*
To create ssl certificate, we need to execute the command below, in linux and mac this works by default, but in windows it is needed to install a tool ./notes/ssl-installer-tool-windows.png

openssl -nodes -new -x509 -keyout server.key -out server.cert

SSL WAS NOT CREATED IN THIS APP, to do it show the "456 Setting Up a SSL Server" class https://www.udemy.com/course/nodejs-the-complete-guide/learn/lecture/12198032#questions
*/

// const MONGODB_URI = 'mongodb+srv://expressjsuser:K2ey4I2$@cluster0.e6tzx.mongodb.net/shop?retryWrites=true&w=majority';
const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.e6tzx.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`;

const app = express();
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions',

});

const csrfProtection = csrf();

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().getTime().toString() + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => { // white list of which kind of files are accepted (uploading)
    const { mimetype } = file;
    if (mimetype === 'image/png' || mimetype === 'image/jpg' || mimetype === 'image/jpeg') {
        cb(null, true);
    } else {
        cb(null, false);
    }

};

const errorController = require('./controllers/error');
const User = require('./models/user');

// EJS
app.set('view engine', 'ejs'); // compile dynamic templates with ejs
app.set('views', 'views'); // where templates will be find

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

// const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'),
//     { flags: 'a' }); // new data will be appended to the file instead of overwwrite

app.use(helmet());
app.use(compression());
// app.use(morgan('combined', { stream: accessLogStream }));

// use a middleware function

app.use(bodyParser.urlencoded({extended: false})); // forms with just plain text
app.use(multer({ storage: fileStorage, fileFilter }).single('image'));
// app.use(multer({ dest: 'images' }).single('image'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
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

    console.error(error);
    res.status(error?.httpStatusCode || 500).render('500', {
        pageTitle: 'Error!',
        path: '/500',
        isAuthenticated: req.session.isLoggedIn
    });
});

mongoose.connect(MONGODB_URI)
    .then(() => app.listen(process.env.PORT || 3000))
    .catch(err => console.log(err));