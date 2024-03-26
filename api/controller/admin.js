const db = require('../connection/connection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

//stackoverflow.com
const emailRegex = '/^\\w+([\\.-]?\\w+)*@\\w+([\\.-]?\\w+)*(\\.\\w{2,3})+$/';

exports.getAllAdmins = async (req, res) => {
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
      message: 'Server error'
    });
  }
}
exports.register = async (req, res) => {
  try {
    let email = req.body.email;
    const conn = await db.pool.getConnection();
    //${} - template literal
   /*
    if(!emailRegex.test(email)){
      return res.status(400).json({
        message: 'Email is not valid format'
      })
    }
   */
    const rows = await conn.query(`SELECT email FROM admin WHERE email = '${email}'`); 

    if (rows.length > 0) {
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
          await conn.query(`INSERT INTO admin (email, password) VALUES ('${email}', '${hash}')`);
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
      error: 'Server error'
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
        message: "Invalid email" //credentials
      });
    }
    bcrypt.compare(req.body.password, admin[0].password, (err, result) => {
      if (!result) {
        conn.release();
        return res.status(401).json({
          message: "Invalid password" //credentials
        });
      }
      else{
        // jwt.sign is used to create a token with the payload and secret key and expiration time
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
    });
  } catch (error) {
    console.log("Catch error: " + error);
    res.status(500).json({
      message: "Server error"
    });
  }
};


exports.delete = async (req, res) => {
  if(isNaN(req.params.adminID)){ 
    return res.status(500).json({
      message: "Server error"
    });
  }
  try {
    const conn = await db.pool.getConnection();
    const findAdmin = await conn.query(`SELECT admin_id FROM admin WHERE admin_id = '${req.params.adminID}'`); //[]
    if (findAdmin.length < 1) {
      conn.release();
      return res.status(404).json({
        message: "Admin not found"
      });
    }
      await conn.query(`DELETE FROM admin WHERE admin_id = '${req.params.adminID}'`);
      conn.release();
      res.status(200).json({
        message: "Admin deleted successfully"
      });
  }
  catch (err) {
    console.error('Catch error:', err);
    res.status(500).json({
      message: "Server error"
    });
  }
}

exports.getCurrentEmail = async (req, res) => {
  const conn = await db.pool.getConnection();
  const email = await conn.query('SELECT email FROM email ORDER BY created_at DESC LIMIT 1');
  if(email.length > 0){
    res.status(200).json(email)
  }
  else {
    res.status(500).json({
      message: "Server error"
    })
  }
}

exports.changeEmail = async (req, res) => {
  try{
      const newEmail = req.body.email;
      const conn = await db.pool.getConnection();
      await conn.query(`INSERT INTO email (email) VALUES ('${newEmail}')`);
      await conn.release();

      return res.status(201).json({
        message: 'Successfully'
      });
      
  }
  catch(error){
    console.log(error);
    return res.status(500).json({
      message: 'Server error'
    });
  }

}