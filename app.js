const express = require('express');
const app = express();
const bodyParser = require('body-parser'); 
const rateLimit = require('express-rate-limit');

//body parser se koristi za parsiranje JSON objekata i slanja podataka preko HTTP zahteva
//bodyParser.urlencoded() se koristi za parsiranje podataka koji su poslati preko forme

/*
    * Returns middleware that only parses urlencoded bodies and only looks at requests
    * where the Content-Type header matches the type option
    * querystring?
*/
//app.use(bodyParser.urlencoded())
app.use(bodyParser.urlencoded({extended: false}))


/*
    * Returns middleware that only parses json and only looks at requests
    * where the Content-Type header matches the type option.
*/
app.use(bodyParser.json());
//express.static() se koristi za slanje statickih fajlova kao sto su slike, CSS fajlovi, JavaScript fajlovi i sl.
app.use('/uploads',express.static('uploads'));
// app.use(express.json());

//? dotenv is used to load environment variables from a .env file into process.env
//? congif() method is used to load the environment variables from the .env file

require('dotenv').config();


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


//*** LIMITER ***//
//https://www.npmjs.com/package/express-rate-limit
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers 
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

app.use(limiter);

const productRoutes = require('./api/routes/products');
const adminRoutes = require('./api/routes/admin');
const orderRoutes = require('./api/routes/order');


app.use('/products', productRoutes); //api.com/products/8
app.use('/admin', adminRoutes); //api.com/admin/register => /admin , /register 
app.use('/orders', orderRoutes); //api.com/orders

// module exports se koristi za izvoz modula tacnije objekta app.
// Modul se izvozi kako bi mogao biti koriscen u drugim fajlovima
module.exports = app;