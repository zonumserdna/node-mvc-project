const express = require('express');

const authConttroller = require('../controllers/auth');

const router = express.Router();

router.get('/login', authConttroller.getLogin);

router.post('/login', authConttroller.postLogin);

router.post('/logout', authConttroller.postLogout);

module.exports = router;