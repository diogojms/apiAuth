const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const logSchema = new Schema({
  level: String,
  action: String,
  description: String,
  user: String,
});

const Log = mongoose.model('Log', logSchema);

module.exports = Log;