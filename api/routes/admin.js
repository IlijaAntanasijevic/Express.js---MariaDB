const express = require("express");
const router = express.Router();
const checkAuthorization = require('../helpers/check-authorization');

const adminController = require('../controller/admin');

router.get('/',checkAuthorization,adminController.getAllAdmins); 
router.post('/register', checkAuthorization,adminController.register);
router.post('/login', adminController.login);
router.delete('/:adminID', checkAuthorization ,adminController.delete);
router.get('/email',checkAuthorization  ,adminController.getCurrentEmail);
router.post('/changeEmail',checkAuthorization,adminController.changeEmail);

module.exports = router;