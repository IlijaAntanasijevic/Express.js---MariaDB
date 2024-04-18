const express = require('express');
const router = express.Router();
const multer = require('multer');
const productController = require('../controller/products');

// Middleware for autthorization 
const checkAuthorization = require('../middleware/check-authorization');

// Multer configuration for file upload
const storage = multer.diskStorage({
    destination: function(req, file, callback) {
      callback(null, './uploads/')
    },
    filename: function(req, file, callback) {
      callback(null, new Date().valueOf() + file.originalname);
    }
  })
  
  // Function to filter allowed file types
  const allowedFileType = (req, file, callback) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      callback(null, true);
    } else {
      callback(null, false);
    }
  }
  
  // Multer instance for file upload
  const upload = multer({
    storage: storage,
    limits: {
      fileSize: 1024 * 1024 * 5 // 5MB
    },
    fileFilter: allowedFileType
  })


// Define routes for handling product-related operations
router.get('/:keyword?', productController.fetchAll);  
router.get('/show/:productId',productController.fetchSingleProduct)
router.post("/",checkAuthorization, upload.single('productImage'),productController.create); 
router.put('/',checkAuthorization, upload.single('productImage'),productController.update); 
router.delete("/:productId",checkAuthorization,productController.delete);

module.exports = router;