const express = require('express');
const userController = require('../Controllers/userController');
const { checkToken } = require('../utils');
const router = express.Router();

router.get('/:id', checkToken, userController.getUserById);

module.exports = router;
