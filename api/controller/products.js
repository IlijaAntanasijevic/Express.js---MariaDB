const db = require('../connection/connection');
//const {parse} = require("dotenv");
//nodemon - live refresh

exports.fetchAll = async (req, res) => {
  console.log("TU");
  try{
    const keyword = req.params.keyword;
    let keywordQuery = '';
    if(keyword){
      keywordQuery += `WHERE p.name LIKE '%${keyword.trim()}%'`; 
    }

    const conn = await db.pool.getConnection();
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

exports.fetchSingleProduct = async (req, res) => {
  const id = req.params.productId; 
 
  try{
    const conn = await db.pool.getConnection();
    if(isNaN(id)) {
      return res.status(500).json({
        message: 'Server error'
      })
    }
    const rows = await conn.query(`SELECT p.*,i.path FROM product p INNER JOIN image i ON p.product_id = i.product_id WHERE p.product_id = ${id}`); //SQL injection
    await conn.release();
    if(rows[0]){ // rows[0] == null
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

exports.create = async (req, res) => {
  try {
    const productObject = {
      name: req.body.name, 
      details: req.body.details,
      totalQuantity: parseInt(req.body.totalQuantity), //2,5 = 2  '2' - string 
      price: parseFloat(req.body.price), 
      image: req.file.filename === 'undefined' ? null : req.file.filename 
    };

    if(productObject.image == null){
      res.status(400).json({
        message: "Image is required"
      })
    }
    if(productObject.name == ''){
      res.status(400).json({
        message: "Name is required"
      })
    }


    const conn = await db.pool.getConnection();
    conn.beginTransaction();
    const insertResult = await conn.query(`INSERT INTO product (name, details, total_quantity, price) 
                                           VALUES ('${productObject.name}', '${productObject.details}', ${productObject.totalQuantity}, ${productObject.price})`);

    const insertedID = insertResult.insertId;
    console.log("Inserted ID:", insertedID);

    await conn.query(`INSERT INTO image (path, product_id) VALUES ('${productObject.image}', ${insertedID})`);

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

/*-----------DEBUGGING---------------*/
exports.update = async (req, res) => {
  if(isNaN(req.body.id)){
    return res.status(500).json({
      message: "Server error"
    });
  }
  try{
    const conn = await db.pool.getConnection();
    const product = await conn.query(`SELECT * FROM product WHERE product_id = ${req.body.id}`); //[]
    if(product.length < 1){
      conn.release();
      return res.status(404).json({
        message: "Product not found"
      });
    }
    else {
      const object = {
        id: req.body.id,
        name: req.body.name,
        totalQuantity: req.body.totalQuantity,
        price: req.body.price,
        details: req.body.details,
        imagePath: req.file ? req.file.filename : null
      }

      if(object.name == ''){
        return res.status(400).json({
          message: "Name is required"
        })
      }
      if(object.totalQuantity <= 0){
        return res.status(400).json({
          message: "Total quantity is not valid format"
        })
      }
      console.log(object);
      await conn.query(`UPDATE product 
                        SET name='${object.name}', total_quantity=${object.totalQuantity}, price=${object.price}, details='${object.details}' 
                        WHERE product_id='${object.id}'`);
     
      if (object.imagePath) {
        await conn.query(`UPDATE image SET path='${object.imagePath}' WHERE product_id = '${object.id}'`);
      }
      
      conn.release();
      return res.status(204).json({
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

exports.delete = async (req, res) => {
    const id = req.params.productId;
  try{
    if(isNaN(id)) {
      res.status(500).json({
        message: 'Server error'
      })
    }
    const conn = await db.pool.getConnection();

    const productOrders = await conn.query(`SELECT * FROM order_product WHERE product_id = ${id}`);
    //productOrders.length => 0 , 5
    if(productOrders.length != 0){
      await conn.query(`DELETE FROM order_product WHERE product_id = ${id}`)
    }

    await conn.query(`DELETE FROM image WHERE product_id = ${id}`);
    await conn.query(`DELETE FROM product WHERE product_id = ${id}`);

    
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

