const express = require("express"); 
const router = express.Router();

// Middleware for autthorization 
const checkAuthorization = require('../middleware/check-authorization');

const adminController = require('../controller/admin');

// Define routes for handling admin-related operations
router.get('/',checkAuthorization,adminController.getAllAdmins); 
router.delete('/:adminID',checkAuthorization,adminController.delete);
router.post('/register',adminController.register);
router.post('/login', adminController.login);
router.get('/email',checkAuthorization,adminController.getCurrentEmail);
router.post('/changeEmail',checkAuthorization,adminController.changeEmail);


module.exports = router;