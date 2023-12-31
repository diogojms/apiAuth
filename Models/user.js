'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    nif: {
        type: String,
        required: true,
        unique: true,
    },
    role: {
        type: Number,
        required: false,
    },
    login_id: {
        type: Number,
        required: false,
    },

},
    { collection: 'users' }
)
const User = mongoose.model('User', UserSchema);

module.exports = User;