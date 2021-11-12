const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
// const expressHbs = require('express-handlebars');

const sequelize = require('./util/database');
const Product = require('./models/product');
const User = require('./models/user');
const Cart = require('./models/cart');
const CartItem = require('./models/cart-item');
const Order = require('./models/order');
const OrderItem = require('./models/order-item');

const app = express();
const errorController = require('./controllers/error');

// EJS
app.set('view engine', 'ejs'); // compile dynamic templates with ejs

// HANDLEBARS
// app.engine('hbs', expressHbs({layoutsDir: 'views/layouts/', defaultLayout: 'main-layout', extname: 'hbs'})); // tells express that handlebars is an engine we can use (the name can be anyone, templates has this name as extention)
// app.set('view engine', 'hbs'); // compile dynamic templates with handle bars

// PUG
// app.set('view engine', 'pug'); // compile dynamic templates with pug


app.set('views', 'views'); // where templates will be find

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');

// use a middleware function

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    User.findByPk(1)
        .then((user) => {
            req.user = user;
            next();
        })
        .catch();
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);

Product.belongsTo(User, { constraints: true, onDelete: 'CASCADE'});
User.hasMany(Product);

User.hasOne(Cart);
Cart.belongsTo(User);
Cart.belongsToMany(Product, { through: CartItem });
Product.belongsToMany(Cart, { through: CartItem });

Order.belongsTo(User);
User.hasMany(Order);
Order.belongsToMany(Product, { through: OrderItem });

sequelize
    // .sync({ force: true}) // delete all tables and data and recreates db
    .sync()
    .then(result => {
        return User.findByPk(1)
    })
    .then(user => {
        if (!user) {
            return User.create({name: 'Andres', email: 'test@test.com'});
        }
        return user;
    })
    .then(user => {
        // console.log(user);
        return user.getCart(cart => cart ? cart : user.createCart())
        // return user.createCart();
    })
    .then(cart => {
        // console.log({cart});
        app.listen(3000);
    })
    .catch(err => {
        console.log(err);
    })

