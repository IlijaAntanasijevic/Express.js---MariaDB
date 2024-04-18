const express = require('express');
const app = express();
const bodyParser = require('body-parser'); 

app.use(bodyParser.urlencoded({extended: false}))


app.use(bodyParser.json());
require('dotenv').config();

app.use('/uploads',express.static('uploads'));

//*** CORS SETTINGS *** - GPT, Stackoverflow //
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");

    if (req.method === "OPTIONS") {
        res.setHeader("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
        res.setHeader("Access-Control-Allow-Headers", "*");
        return res.status(200).json({});
    }
    next();
});

// Import routes 
const productRoutes = require('./api/routes/products');
const orderRoutes = require('./api/routes/order');
const adminRoutes = require('./api/routes/admin');


// Attach routes to their endpoints
app.use('/products', productRoutes); 
app.use('/orders', orderRoutes);
app.use('/admin', adminRoutes); 


module.exports = app;
