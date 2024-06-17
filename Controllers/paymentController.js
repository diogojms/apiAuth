const { log } = require('console');
const Payment = require('../Models/payment');
const mongoose = require('mongoose');
const { default: axios } = require("axios");

exports.getPayments = async (req, res) => {
  const { clientId } = req.params;
  const page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit);

  // If no limit is specified, set it to a very large number
  if (!limit) {
    limit = Number.MAX_SAFE_INTEGER;
  }

  const startIndex = (page - 1) * limit;

  try {
    const payments = await Payment.find({ clientId }).skip(startIndex).limit(limit);
    const totalPayments = await Payment.countDocuments({ clientId });

    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(totalPayments / limit),
      totalPayments: totalPayments
    };

    res.json({ status: 'success', payments: payments, pagination: pagination });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


exports.getPayment = async (req, res) => {
  const { id } = req.params;

  console.log(id);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: 'Invalid payment ID' });
  }

  try {
    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ msg: 'Payment not found' });
    }
    res.json({ status: 'success', payment: payment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, message: 'Error fetching payment', data: {} });
  }
};

exports.addPayment = async (req, res) => {
  const { name, type, card_number, expiration_date, cvv, clientId } = req.body;

  if (!name || !type || !card_number || !expiration_date || !cvv || !clientId)
    return res.status(400).json({ msg: 'Preencha todos os campos' });

  const response = await Payment.create({ name, type, card_number, expiration_date, cvv, clientId });

  res.json({ status: 'success', payment: response });
};

exports.changeInfo = async (req, res) => {
  try {
    const { newName, newType, newCard_number, newExpiration_date, newCvv } = req.body;
    const { id } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: 'Invalid Payment ID' });
    }

    if (!newName && !newType && !newCard_number && !newExpiration_date && !newCvv) {
      return res.status(400).json({ msg: 'At least one field must be provided' });
    }

    const updateFields = {};
    if (newName) {
      updateFields.name = newName;
    }
    if (newType) {
      updateFields.type = newType;
    }
    if (newCard_number) {
      updateFields.card_number = newCard_number;
    }
    if (newExpiration_date) {
      updateFields.expiration_date = newExpiration_date;
    }
    if (newCvv) {
      updateFields.cvv = newCvv;
    }

    const updatedPayment = await Payment.findByIdAndUpdate(id, updateFields, { new: true });

    if (!updatedPayment) {
      return res.status(404).json({ msg: 'Payment not found' });
    }

    res.json({ status: 'success', payment: updatedPayment });
  } catch (error) {
    console.error('Error updating payment information: ', error);
    res.status(500).json({ msg: 'Internal Server Error' });
  }
};

exports.removePayment = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ status: 400, message: 'Invalid payment ID', data: {} });
  }

  try {
    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({ status: 404, message: 'Payment not found', data: {} });
    }

    await Payment.deleteOne({ _id: id });
    res.json({ status: 200, message: 'Payment deleted successfully', data: payment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, message: 'Error deleting payment', data: {} });
  }
};

exports.countPayments = async (req, res) => {
  const { clientId } = req.params;
  try {
    const totalPayments = await Payment.countDocuments().findById({ clientId });
    res.json({ status: 200, message: 'Count retrieved successfully', data: { totalPayments } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, message: 'Error counting payments', data: {} });
  }
};



