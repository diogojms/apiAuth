const { log } = require('console');
const Car = require('../Models/cars');
const mongoose = require('mongoose');
const { default: axios } = require("axios");

exports.getCars = async (req, res) => {
  const { clientId } = req.params;
  const page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit);

  // If no limit is specified, set it to a very large number
  if (!limit) {
    limit = Number.MAX_SAFE_INTEGER;
  }

  const startIndex = (page - 1) * limit;

  try {
    const cars = await Car.find({ clientId }).skip(startIndex).limit(limit);
    const totalCars = await Car.countDocuments({ clientId });

    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(totalCars / limit),
      totalCars: totalCars
    };

    res.json({ status: 'success', cars: cars, pagination: pagination });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.getCar = async (req, res) => {
  const { id } = req.params;

  console.log(id);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: 'Invalid car ID' });
  }

  try {
    const car = await Car.findById(id);
    if (!car) {
      return res.status(404).json({ msg: 'Car not found' });
    }
    res.json({ car: car });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, message: 'Error fetching car', data: {} });
  }
};

exports.addCar = async (req, res) => {
  const { name, brand, model, type, year, color, license_plate, image, clientId } = req.body;

  if (!name || !brand || !model || !clientId)
    return res.status(400).json({ msg: 'Preencha todos os campos' });

  const response = await Car.create({ name, brand, model, type, year, color, license_plate, image, clientId });

  res.json({ status: 'success', car: response });
};

exports.changeInfo = async (req, res) => {
  try {
    const { newName, newBrand, newModel, newType, newYear, newColor, newLicense_plate, newImage } = req.body;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: 'Invalid Car ID' });
    }

    if (!newName && !newBrand && !newModel && !newType && !newYear && !newColor && !newLicense_plate && !newImage) {
      return res.status(400).json({ msg: 'At least one field must be provided' });
    }

    const updateFields = {};
    if (newName) {
      updateFields.name = newName;
    }
    if (newBrand) {
      updateFields.brand = newBrand;
    }
    if (newModel) {
      updateFields.model = newModel;
    }
    if (newType) {
      updateFields.type = newType;
    }
    if (newYear) {
      updateFields.year = newYear;
    }
    if (newColor) {
      updateFields.color = newColor;
    }
    if (newLicense_plate) {
      updateFields.license_plate = newLicense_plate;
    }
    if (newImage) {
      updateFields.image = newImage;
    }

    const updatedCar = await Car.findByIdAndUpdate(id, updateFields, { new: true });

    if (!updatedCar) {
      return res.status(404).json({ msg: 'Car not found' });
    }

    res.json({ status: 'success', car: updatedCar });
  } catch (error) {
    console.error('Error updating car information: ', error);
    res.status(500).json({ msg: 'Internal Server Error' });
  }
};

exports.removeCar = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ status: 400, message: 'Invalid car ID', data: {} });
  }

  try {
    const car = await Car.findById(id);
    if (!car) {
      return res.status(404).json({ status: 404, message: 'Car not found', data: {} });
    }

    await Car.deleteOne({ _id: id });
    res.json({ status: 200, message: 'Car deleted successfully', data: car });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, message: 'Error deleting car', data: {} });
  }
};

exports.countCars = async (req, res) => {
  const { clientId } = req.params;
  try {
    const totalCars = await Car.countDocuments().findById({ clientId });
    res.json({ status: 200, message: 'Count retrieved successfully', data: { totalCars } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, message: 'Error counting cars', data: {} });
  }
};



