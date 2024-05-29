const mongoose = require('mongoose');
const { type } = require('os');
const Schema = mongoose.Schema;

const PaymentsSchema = new Schema({
    type:{type: String, require:true},
    name:{type: String, require:true},
    card_number:{type: String, require:true},
    expiration_date:{type: String, require:true},
    cvv:{type: String, require:true},
    clientId:{type: String, require:true},
}, 
    { collection: 'payments' }
)

const Payments = mongoose.model('Payments', PaymentsSchema)

module.exports = Payments