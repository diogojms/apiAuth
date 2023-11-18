'use strict';

const mongoose = require('mongoose');
const schema = mongoose.Schema;
const userSchema = new schema({
    username: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        minlength: 6,
        maxlength: 32,
        trim: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        minlength: 6,
        maxlength: 32,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        maxlength: 32,
        trim: true
    }
},
    { collection: 'users' }
)
const User = mongoose.model('User', userSchema);

module.exports = User;