const express = require("express");
const router = express.Router();

const orderController = require('../controller/order');

// Define routes for handling order-related operations
router.post('/checkOrders',orderController.check);
router.post('/',orderController.create);

module.exports = router;