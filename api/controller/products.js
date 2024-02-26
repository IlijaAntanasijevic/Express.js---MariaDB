const db = require('../connection/connection');
//const {parse} = require("dotenv");

exports.fetchAll = async (req, res) => {
  try{
    const conn = await db.pool.getConnection();
    const rows = await conn.query("SELECT p.*,i.path FROM product p INNER JOIN image i ON p.product_id = i.product_id");
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
    const rows = await conn.query(`SELECT p.*,i.path FROM product p INNER JOIN image i ON p.product_id = i.product_id WHERE p.product_id = ${id}`);
    await conn.release();
    if(rows[0]){
      res.json(rows[0]);
    }
    else {
      res.status(500).json({
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
      totalQuantity: parseInt(req.body.totalQuantity),
      price: parseFloat(req.body.price),
      image: req.file.filename === 'undefined' ? null : req.file.filename
    };



    const conn = await db.pool.getConnection();
    const insertResult = await conn.query(`INSERT INTO product (name, details, total_quantity, price) VALUES ('${productObject.name}', '${productObject.details}', ${productObject.totalQuantity}, ${productObject.price})`);

    const insertedID = insertResult.insertId;
    //console.log("Inserted ID:", insertedID);

    await conn.query(`INSERT INTO image (path, product_id) VALUES ('${productObject.image}', ${insertedID})`);

    conn.release();
    res.status(201).send("Product inserted successfully");
  } catch (err) {
    console.error('Error executing query:', err);
    res.status(500).send(err);
  }
}

/*-----------DEBUGGING---------------*/
exports.update = async (req, res) => {
  if(isNaN(req.body.id)){
    res.status(500).json({
      message: "Server error"
    });
  }
  try{
    const conn = await db.pool.getConnection();
    const product = await conn.query(`SELECT * FROM product WHERE product_id = ${req.body.id}`);
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
      await conn.query(`UPDATE product SET name='${object.name}', total_quantity=${object.totalQuantity}, price=${object.price}, details='${object.details}' WHERE product_id='${object.id}'`);


      if (object.imagePath) {
        await conn.query(`UPDATE image SET path='${object.imagePath}' WHERE product_id = '${object.id}'`);
      }

      conn.release();
      res.status(204).json({
       message:  "Product updated successfully"
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

exports.delete = async (req, res) => {
  try{
    const conn = await db.pool.getConnection();
    await conn.query(`DELETE FROM image WHERE product_id = ${req.params.productId}`);
    await conn.query(`DELETE FROM product WHERE product_id = ${req.params.productId}`);
    res.status(201).json({
      message: "Successfully deleted"
    })
  }
  catch(err){
    console.error('Error executing query:', err);
    res.status(500).json({
      message: "Server error"
    });
  }
}
