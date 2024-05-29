const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit')
var amqp = require('amqplib/callback_api');
const { specs, swaggerUi } = require('./swagger');

require('dotenv').config();

const rateLimitTimer = 30 //seconds
const rateLimiter = 10 //attempts

//IP Rate Limiter
const limiter = rateLimit({
    windowMs: 1000 * rateLimitTimer,
    max: rateLimiter
})

const uri = process.env.MONGODB_URI;
mongoose.Promise = global.Promise;
mongoose.connect(uri).then(() => { 
    console.log("Successfully connected to MongoDB.");
}).catch(err => {
    console.error("Connection error", err);
}) 

// Midleware
const app = express();
app.use('/', express.static(path.join(__dirname, 'static')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false })); //parse application/x-www-form-urlencoded
app.use(limiter);


// routes
app.use('/auth', require('./Routes/authRoutes'));
app.use('/user', require('./Routes/userRoutes'));
app.use('/car', require('./Routes/carRoutes'));
app.use('/payment', require('./Routes/paymentRoutes'));
app.use('/api-docs-auth', swaggerUi.serve, swaggerUi.setup(specs));

// documentation
//app.use('/apidoc', swaggerui.serve, swaggerui.setup(swaggerDocument));
//app.use('/apidocjs', express.static(path.join(__dirname, 'apidoc')));

let port=8081;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
    
})