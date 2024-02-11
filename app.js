const express = require('express');
const app = express();
const bodyParser = require('body-parser');


app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json());
app.use('/uploads',express.static('uploads'));
// app.use(express.json());

require('dotenv').config();


//CORS SETTINGS
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    if (req.method === "OPTIONS") {
        res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
        return res.status(200).json({});
    }
    next();
});



const productRoutes = require('./api/routes/products');
const adminRoutes = require('./api/routes/admin');

app.use('/products', productRoutes);
app.use('/admin', adminRoutes);

module.exports = app;