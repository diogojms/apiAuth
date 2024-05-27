const express = require('express');
const userController = require('../Controllers/userController');
const { checkToken } = require('../utils');
const router = express.Router();

router.get('/', checkToken, userController.getUsers);
router.get('/:id', checkToken, userController.getUserById);
router.post('/changeInfo',checkToken, userController.changeInfo);
router.get('/count', checkToken, userController.countUsers);

module.exports = router;