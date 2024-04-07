const express = require('express');
const router = express.Router();
const multer = require('multer');
const checkAuth = require('../helpers/check-authorization');

const storage = multer.diskStorage({
  destination: function(req, file, callback){
    callback(null, './uploads/')
  },
  filename: function(req, file, callback){
    callback(null, new Date().valueOf() + file.originalname);
  }
})

const allowedFileType = (req, file, callback) => {
  if(file.mimetype === "image/jpeg" || file.mimetype === "image/png"){
    callback(null,true);
  }
  else {
    callback(null,false);
  }
}

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5 //5MB
  },
  fileFilter: allowedFileType
})

const productController = require('../controller/products');
 
//router.get('/', productController.fetchAll);
router.get('/:keyword?', productController.fetchAll);


router.get('/show/:productId',productController.fetchSingleProduct);

router.post("/",checkAuth ,upload.single('productImage'),productController.create);

//PUT OR PATCH - UPDATE
router.put('/',checkAuth, upload.single('productImage'),productController.update); 

router.delete("/:productId", checkAuth, productController.delete);


module.exports = router;
