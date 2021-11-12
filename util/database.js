const Sequelize = require('sequelize');

const sequelize = new Sequelize('node-complete', 'root', 'K2ey4I2$', {
    dialect: 'mysql',
    host: 'localhost'
});

module.exports = sequelize;
