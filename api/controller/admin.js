const db = require('../connection/connection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {pool} = require("../connection/connection");

exports.getAll = async (req, res) => {
  try {
    const conn = await db.pool.getConnection();
    const admin = await conn.query(`SELECT admin_id, email FROM admin`);

    if(admin.length > 0){
      res.status(200).json(admin);
    }
    else {
      res.status(500).json({
        message: "Admins not found"
      });
    }
  }
  catch (error){
    console.log("Catch error: " + error);
    res.status(500).json({
      message: error
    });
  }
}
//DODATI VALIDACIJU I HANDLOVANJE GRESAKA
exports.register = async (req, res) => {
  try {
    const conn = await db.pool.getConnection();
    const rows = await conn.query(`SELECT email FROM admin WHERE email = '${req.body.email}'`);

    if(rows[0] != undefined && rows[0].email == ""){
      return res.status(409).json({
        message: "Email is required"
      });
    }
    else if (rows.length > 0) {
      conn.release();
      return res.status(409).json({
        message: "Email already exists"
      });
    }

    else {
      bcrypt.hash(req.body.password, 10, async (err, hash) => {
        if (err) {
          console.log("Error occurred while hashing password:", err);
          conn.release();
          return res.status(500).json({
            error: "Error occurred while hashing password"
          });
        } else {
          await conn.query(`INSERT INTO admin (email, password) VALUES ('${req.body.email}', '${hash}')`);
          console.log("Inserted");
          conn.release();
          return res.status(201).json({
            message: "Admin registered successfully"
          });
        }
      });
    }
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({
      error: error
    });
  }
};


exports.login = async (req, res) => {
  try {
    const conn = await db.pool.getConnection();
    const admin = await conn.query(`SELECT email, password FROM admin WHERE email = '${req.body.email}'`);
    if (admin.length < 1) {
      conn.release();
      return res.status(401).json({
        message: "Invalid email"
      });
    }
    bcrypt.compare(req.body.password, admin[0].password, (err, result) => {
      if (!result) {
        //console.log("Compare error: " + err);
        conn.release();
        return res.status(401).json({
          message: "Invalid password"
        });
      }
      else{
        const token = jwt.sign(
            {
              email: admin[0].email
            },
            process.env.JWT_KEY,
            {
              expiresIn: "8h"
            }
        );
        conn.release();
        return res.status(200).json({
          message: "Successful",
          token: token
        });
      }

        conn.release();
      res.status(401).json({
        message: "Authorization failed"
      });
    });
  } catch (error) {
    console.log("Catch error: " + error);
    res.status(500).json({
      message: error
    });
  }
};


exports.delete = async (req, res) => {
  try {
    const conn= await db.pool.getConnection();
    const findAdmin = await conn.query(`SELECT admin_id FROM admin WHERE admin_id = '${req.params.adminID}'`);
    if (findAdmin.length < 1) {
      conn.release();
      return res.status(401).json({
        message: "Admin not found"
      });
    }
    else {
      await conn.query(`DELETE FROM admin WHERE admin_id = '${req.params.adminID}'`);
      conn.release();
      res.status(200).json({
        message: "Admin deleted successfully"
      });
    }
  }
  catch (err) {
    console.error('Catch error:', err);
    res.status(500).json({
      message: "Server error"
    });
  }
}