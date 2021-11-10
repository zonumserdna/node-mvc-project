const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
// const expressHbs = require('express-handlebars');

const app = express();
const errorController = require('./controllers/error');
const db = require('./util/database');

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

app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);

app.listen(3000);
