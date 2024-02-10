const express = require('express');
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json());
// app.use(express.json());


require('dotenv').config();
console.log(process.env);


const productRoutes = require('./api/routes/products');
const adminRoutes = require('./api/routes/admin');

app.use('/products', productRoutes);
app.use('/admin', adminRoutes);

module.exports = app;