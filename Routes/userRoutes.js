const express = require('express');
const userController = require('../Controllers/userController');
const { checkToken } = require('../utils');
const router = express.Router();

router.get('/:id', checkToken, userController.getUserById);
router.post('/changeInfo', userController.changeInfo);

module.exports = router;