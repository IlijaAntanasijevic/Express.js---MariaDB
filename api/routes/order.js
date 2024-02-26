const express = require("express");
const router = express.Router();
const checkAuthorization = require('../helpers/check-authorization');


const orderController = require('../controller/order');


router.get('/:id/:startDate/:endDate/:quantity',orderController.check);

router.post('/',orderController.create);
// module exports is used here to export the router object
module.exports = router;