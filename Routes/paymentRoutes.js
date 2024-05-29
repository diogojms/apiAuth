const express = require('express');
const paymentController = require('../Controllers/paymentController');
const { checkToken } = require('../utils');
const router = express.Router();

router.get('/count/:clientId', checkToken, paymentController.countPayments);
router.get('/payments/:clientId', checkToken, paymentController.getPayments);
router.get('/:id', checkToken, paymentController.getPayment);
router.put('/:id',checkToken, paymentController.changeInfo);
router.post('/', paymentController.addPayment);
router.delete('/:id', paymentController.removePayment);

module.exports = router;