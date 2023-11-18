var cors = require('cors');

var MONGO_URL = process.env.MONGO_URL
var mongoose = require('mongoose');
mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });