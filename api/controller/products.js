const db = require('../connection/connection');
//const {parse} = require("dotenv");

exports.fetchAll = async (req, res) => {
  try{
    const conn = await db.pool.getConnection();
    const rows = await conn.query("SELECT * FROM product");
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
    const rows = await conn.query(`SELECT * FROM product WHERE product_id = ${id}`);
    conn.release();
    res.json(rows[0]);
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
      quantity: parseInt(req.body.quantity),
      details: req.body.details,
      totalQuantity: parseInt(req.body.totalQuantity),
      price: parseFloat(req.body.price),
      image: req.file.filename
    };


    const conn = await db.pool.getConnection();
    const insertResult = await conn.query(`INSERT INTO product (product_name, quantity, details, total_quantity, price) VALUES ('${productObject.name}', ${productObject.quantity}, '${productObject.details}', ${productObject.totalQuantity}, ${productObject.price})`);

    const insertedID = insertResult.insertId;
    //console.log("Inserted ID:", insertedID);

    await conn.query(`INSERT INTO image (path, product_id) VALUES ('${productObject.image}', ${insertedID})`);

    conn.release();
    res.status(200).send("Product inserted successfully");
  } catch (err) {
    console.error('Error executing query:', err);
    res.status(500).send(err);
  }
}

exports.update = async (req, res) => {
  try{
    const conn = await db.pool.getConnection();
    const rows = await conn.query(`SELECT * FROM product WHERE product_id = ${id}`);
    conn.release();
    res.json(rows[0]);
  }
  catch(err){
    console.error('Error executing query:', err);
    res.status(500).json({
      message: "Server error"
    });
  }
}
