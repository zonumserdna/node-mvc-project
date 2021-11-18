const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const errorController = require('./controllers/error');
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
    User.findById("6195081099ee6a3b3c25da5c")
        .then((user) => {
            req.user = user;
            next();
        })
        .catch();
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);

mongoose.connect('mongodb+srv://expressjsuser:K2ey4I2$@cluster0.e6tzx.mongodb.net/shop?retryWrites=true&w=majority')
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
    .then(() => app.listen(3000))
    .catch(err => console.log(err));