const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const errorController = require('./controllers/error');
const mongoConnect = require('./util/database').mongoConnect;
const User = require('./models/user');

// EJS
app.set('view engine', 'ejs'); // compile dynamic templates with ejs



app.set('views', 'views'); // where templates will be find

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');

// use a middleware function

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    User.findById("6194072b9925dc368f47bbb0")
        .then((user) => {
            const {name, email, cart, _id} = user;
            req.user = new User(name, email, cart, _id);
            next();
        })
        .catch();
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);

mongoConnect(() => {
    app.listen(3000);
});