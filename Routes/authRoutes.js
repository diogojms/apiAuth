const express = require('express');
const authController = require('../Controllers/authController');
const { checkToken } = require('../utils');
const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/password', checkToken, authController.changePassword);
router.post('/logout', checkToken, authController.logout);

module.exports = router;
