const mongoose = require('mongoose');
const { type } = require('os');
const Schema = mongoose.Schema;

const CarsSchema = new Schema({
    name:{type: String, require:true},
    brand:{type: String, require:true},
    model:{type: String, require:true},
    type:{type: String, require:false},
    year:{type: Number, require:false},
    color:{type: String, require:false},
    license_plate:{type: String, require:false},
    image:{type: String, require:false},
    clientId:{type: String, require:true},
}, 
    { collection: 'cars' }
)

const Cars = mongoose.model('Cars', CarsSchema)

module.exports = Cars