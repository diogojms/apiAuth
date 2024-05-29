const express = require('express');
const carController = require('../Controllers/carController');
const { checkToken } = require('../utils');
const router = express.Router();

router.get('/count/:clientId', checkToken, carController.countCars);
router.get('/cars/:clientId', checkToken, carController.getCars);
router.get('/:id', checkToken, carController.getCar);
router.put('/:id',checkToken, carController.changeInfo);
router.post('/', carController.addCar);
router.delete('/:id', carController.removeCar);

module.exports = router;