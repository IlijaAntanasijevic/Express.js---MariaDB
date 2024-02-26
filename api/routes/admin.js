const express = require("express");
const router = express.Router();
const checkAuthorization = require('../helpers/check-authorization');

const adminController = require('../controller/admin');

router.get('/',checkAuthorization,adminController.getAll);
router.post('/register', checkAuthorization,adminController.register);
router.post('/login', adminController.login);
router.delete('/:adminID', checkAuthorization ,adminController.delete);

module.exports = router;