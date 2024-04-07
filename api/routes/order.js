const express = require("express");
const router = express.Router();
const checkQuantity = require('../helpers/checkOrderCart');


const orderController = require('../controller/order');


//router.get('/:id/:startDate/:endDate/:quantity',orderController.check);
router.post('/checkOrders',orderController.check);
router.post('/',checkQuantity,orderController.create);

module.exports = router;