const express = require('express');
const app = express();
const bodyParser = require('body-parser');
/*
TO-DO:
- Slanje email-a adminu
- Fixing order korisnika !!
- Prikaz ukupne kolicine i koliko trenutno ima
- Delete - admin
- Insert - admin
- Dodavanje admina/registracija
 */

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json());
app.use('/uploads',express.static('uploads'));
// app.use(express.json());

require('dotenv').config();


//CORS SETTINGS
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



const productRoutes = require('./api/routes/products');
const adminRoutes = require('./api/routes/admin');
const orderRoutes = require('./api/routes/order');


app.use('/products', productRoutes);
app.use('/admin', adminRoutes);
app.use('/orders', orderRoutes);

module.exports = app;