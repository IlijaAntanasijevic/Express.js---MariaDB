const db = require('../connection/connection');

const validationSchemas = require('../validationSchemas');


// Fetch all products or filter by keyword
exports.fetchAll = async (req, res) => {
  try{
    const keyword = req.params.keyword;
    let keywordQuery = '';
    const {error} = validationSchemas.keyword.validate(keyword);

    if(keyword && !error){
      // Construct SQL query to filter products by name using the provided keyword
      keywordQuery += `WHERE p.name LIKE '%${keyword.trim()}%'`; 
    }

    const conn = await db.pool.getConnection();
    // Execute SQL query to retrieve product data
    const rows = await conn.query("SELECT p.*,i.path FROM product p INNER JOIN image i ON p.product_id = i.product_id " + keywordQuery); 
    conn.release();
    res.json(rows);
  }
  catch(err){
    console.error('Error executing query:', err);
    res.status(500).json({
      message: "Server error"
    });
  }
}

  
// Fetch a single product by ID
exports.fetchSingleProduct = async (req, res) => {
    const id = req.params.productId; 
    try{
      const conn = await db.pool.getConnection();
      // Check if the provided product ID is number
      if(isNaN(id)) {
        return res.status(500).json({
          message: 'Server error'
        })
      }
      // Execute SQL query to get product data for the specified ID
      const rows = await conn.query(`SELECT p.*,i.path FROM product p INNER JOIN image i ON p.product_id = i.product_id WHERE p.product_id = ?`,[id]);
      await conn.release();
      // Check if product data was retrieved
      if(rows[0]){
        res.json(rows[0]);
      }
      else {
          return res.status(404).json({
          message: "Product not found"
        });
      }
    }
    catch(err){
        console.error('Error executing query:', err);
        res.status(500).json({
        message: "Server error"
      });
    }
  }
  
  
// Create a new product
exports.create = async (req, res) => {
  try {
    //Validate product informations
    const {error: nameError} = validationSchemas.name.validate(req.body.name);
    const {error: detailsError} = validationSchemas.details.validate(req.body.details);
    const {error: quantityError} = validationSchemas.quantity.validate(req.body.totalQuantity);
    const {error: priceError} = validationSchemas.price.validate(req.body.price);

    if(nameError){
      return res.status(400).json({
        message: nameError.message
      })
    }
    if(detailsError){
      return res.status(400).json({
        message: detailsError.message
      })
    }
    if(quantityError){
      return res.status(400).json({
        message: quantityError.message
      })
    }
    if(priceError){
      return res.status(400).json({
        message: priceError.message
      })
    }
    if(typeof(req.file) === 'undefined' || typeof(req.file.filename) === 'undefined'){
      return res.status(400).json({
        message: "Image is required"
      })
    }

    

    // Extract product information from request body

    const productObject = {
      name: req.body.name, 
      details: req.body.details.trim() ,
      totalQuantity: parseInt(req.body.totalQuantity), 
      price: parseFloat(req.body.price), 
      image: req.file.filename 
    };

 

    const conn = await db.pool.getConnection();
    conn.beginTransaction();
    // Execute SQL query to insert product data into database
    const insertResult = await conn.query(`INSERT INTO product (name, details, total_quantity, price) 
                                           VALUES (?,?,?,?)`, [productObject.name,productObject.details,productObject.totalQuantity,productObject.price]);

    const insertedID = insertResult.insertId;


    await conn.query(`INSERT INTO image (path, product_id) VALUES (?,?)`,[productObject.image, insertedID]);

    conn.commit();
    conn.release();
   
    res.status(201).json({
      message: 'Product inserted successfully'
    })

  } catch (err) {
    console.error('Error executing query:', err);
    conn.rollback();
    res.status(500).send(err);
  }
}


// Update an existing product
exports.update = async (req, res) => {
  // Check if the provided product ID is number
 if(isNaN(req.body.id)){
   return res.status(500).json({
     message: "Server error"
   });
 }

 // Validate updated product information
 const {error: nameError} = validationSchemas.name.validate(req.body.name);
 const {error: detailsError} = validationSchemas.details.validate(req.body.details);
 const {error: quantityError} = validationSchemas.quantity.validate(req.body.totalQuantity);
 const {error: priceError} = validationSchemas.price.validate(req.body.price);

 if(nameError){
   return res.status(400).json({
     message: nameError.message
   })
 }
 if(detailsError){
   return res.status(400).json({
     message: detailsError.message
   })
 }
 if(quantityError){
   return res.status(400).json({
     message: quantityError.message
   })
 }
 if(priceError){
   return res.status(400).json({
     message: priceError.message
   })
 }

 

 try{
   const conn = await db.pool.getConnection();
   // Retrieve product information for the specified ID
   const product = await conn.query(`SELECT * FROM product WHERE product_id = ?`,[req.body.id]);
   // Check if product exists
   if(product.length < 1){
     conn.release();
     return res.status(404).json({
       message: "Product not found"
     });
   }
   else {
     // Prepare object with updated product information
     const object = {
       id: req.body.id,
       name: req.body.name,
       totalQuantity: req.body.totalQuantity,
       price: req.body.price,
       details: req.body.details.trim(),
       imagePath: req.file ? req.file.filename : null
     }
 
     // Execute SQL query to update product information
     await conn.query('UPDATE product SET name=?, total_quantity=?, price=?, details=? WHERE product_id=?',
       [object.name, object.totalQuantity, object.price, object.details, object.id]);
    
     // Check if an image is provided for update
     if (object.imagePath) {
       // Update image path in database
       await conn.query(`UPDATE image SET path=? WHERE product_id =?`,[object.imagePath, object.id]);
     
     }
     
     conn.release();
     return res.status(200).json({
      message:  "Product updated successfully"
     });
   }
 }
 catch(err){
   console.log('Error executing query!!:', err);
   res.status(500).json({
     message: "Server error"
   });
 }
}


// Delete a product by ID
exports.delete = async (req, res) => {
    
  const id = req.params.productId;
try{
 // Check if the provided product ID is number  
 if(isNaN(id)) {
    res.status(500).json({
      message: 'Server error'
    })
  }
  const conn = await db.pool.getConnection();

  // Check if the product has linked orders
  const productOrders = await conn.query(`SELECT * FROM order_product WHERE product_id = ?`,[id]);
  if(productOrders.length != 0){
      await conn.query(`DELETE FROM order_product WHERE product_id = ?`,[id]);
  }

  // Delete image associated with the product
  await conn.query(`DELETE FROM image WHERE product_id = ?`,[id]);
  await conn.query(`DELETE FROM product WHERE product_id = ?`,[id]);

  conn.release();
  res.status(201).json({
    message: "Successfully deleted"
  })
}
catch(error){
  console.log('Error executing query:', error);
  res.status(500).json({
    message: "Server error"
  });
}
}