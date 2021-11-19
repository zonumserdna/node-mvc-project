const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const mongoDBSession = require('connect-mongodb-session');
const MongoDBStore = mongoDBSession(session);
// const MONGODB_URI = 'mongodb+srv://expressjsuser:K2ey4I2$@cluster0.e6tzx.mongodb.net/shop?retryWrites=true&w=majority';
const MONGODB_URI = 'mongodb+srv://expressjsuser:K2ey4I2$@cluster0.e6tzx.mongodb.net/shop';

const app = express();
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions',

});
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

app.use((req, res, next) => {
    const { session: { user }} = req;
    User.findById(user?._id)
        .then((user) => {
            req.user = user;
            next();
        })
        .catch(err => console.log(err));
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

mongoose.connect(MONGODB_URI)
    .then(result => {
        return User
            .findOne()
            .then(user => {
                if (!user) {
                    const user = new User({
                        name: 'Andres',
                        email: 'andres@test.com',
                        cart: {
                            items: []
                        }
                    });
                    return user.save();
                }
            });
    })
    .then(() => app.listen(3001))
    .catch(err => console.log(err));