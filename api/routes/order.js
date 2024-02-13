const express = require("express");
const router = express.Router();
const checkAuthorization = require('../helpers/check-authorization');


const orderController = require('../controller/order');


router.get('/:id/:startDate/:endDate/:quantity',orderController.check);

router.post('/',orderController.create);
/*
router.post('/',(req,res) => {
    //console.log(req.body);
    try {
        const orderObject = {
            name: req.body.name,
            last_name: req.body.lastName,
            phone: req.body.phone,
            email: req.body.email,
            address: req.body.address,
        }
        const orderedProducts = req.body.products;


    }catch (err){
        console.log("Catch: error");
    }
});
*/
module.exports = router;