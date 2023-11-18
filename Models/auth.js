const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const AuthSchema = new Schema({
    username:{type: String, require:true, unique:true},
    password:{type: String, require:true}
}, 
    { collection: 'auth' }
)

const Auth = mongoose.model('Auth', AuthSchema)

module.exports = Auth