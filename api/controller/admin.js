const db = require('../connection/connection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const validationSchemas = require('../validationSchemas');

const defaultAdminName = 'CPO AG';

// Get all admins from the database
exports.getAllAdmins = async (req, res) => {
  try {
    const conn = await db.pool.getConnection();
    // Retrieve admins' information from the database
    const admin = await conn.query(`SELECT admin_id, email FROM admin`);
    // Check if admins are found
    if (admin.length > 0) {
      res.status(200).json(admin);
    } else {
      res.status(404).json({
        message: "Admins not found"
      });
    }
  } catch (error) {
    console.log("Catch error: " + error);
    res.status(500).json({
      message: 'Server error'
    });
  }
};


// Register a new admin
exports.register = async (req, res) => {
  try {
    let email = req.body.email;
    let {error:emailError} = validationSchemas.email.validate(email);
    let {error:passwordError} = validationSchemas.password.validate(req.body.password);

    if(emailError){
      return res.status(400).json({
        message: emailError.message
      })
    }
    if(passwordError){
      return res.status(400).json({
        message: passwordError.message
      })
    }
    const conn = await db.pool.getConnection();
    // Check if the email already exists in the database
    const rows = await conn.query(`SELECT email FROM admin WHERE email = ?`,[email]);
    console.log(req.body);
    if (rows.length > 0) {
      conn.release();
      return res.status(409).json({
        message: "Email existiert bereits"
      });
    }
    else if (req.body.password != req.body.repeatPassword) {
      conn.release();
      return res.status(409).json({
        message: "Password does not match"
      });
    } else {
      // Hash the password
      bcrypt.hash(req.body.password, 10, async (err, hash) => {
        if (err) {
          console.log("Error occurred while hashing password:", err);
          conn.release();
          return res.status(500).json({
            error: "Error occurred while hashing password"
          });
        } else {
          // Insert the new admin into the database
          await conn.query(`INSERT INTO admin (email, password) VALUES (?,?)`,[email,hash]);
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

// Log in as an admin
exports.login = async (req, res) => {
  if(req.body.email != defaultAdminName){
    var {error:emailError} = validationSchemas.email.validate(req.body.email);

  }
  let {error: passwordError} = validationSchemas.password.validate(req.body.password);

 if(emailError){
      return res.status(400).json({
        message: emailError.message
      })
    }
    if(passwordError){
      return res.status(400).json({
        message: passwordError.message
      })
    }
  try {
    const conn = await db.pool.getConnection();
    // Retrieve admin information from the database
    const admin = await conn.query(`SELECT admin_id,email, password FROM admin WHERE email = ?`,[req.body.email]);
    if (admin.length < 1) {
      conn.release();
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }
    // Compare the password with the hashed password
    bcrypt.compare(req.body.password, admin[0].password, (err, result) => {
      if (!result) {
        conn.release();
        return res.status(401).json({
          message: "Invalid email or password"
        });
      } else {
        // Create a JWT token for authentication
        const token = jwt.sign({
            email: admin[0].email,
            id: admin[0].admin_id
          },
          process.env.JWT_KEY, {
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

// Delete an admin by ID
exports.delete = async (req, res) => {
  try {
    // Check if admin ID is a number
    if (isNaN(req.params.adminID)) {
      return res.status(500).json({
        message: "Server error"
      });
    }
        // Extract admin ID from the request parameters and get token to find current logged in admin
    const token = req.headers.authorization.split(" ")[1];
    const currentAdminId = jwt.decode(token).id;
    
    const conn = await db.pool.getConnection();

    // Retrieve admin information from the database
    const findAdmin = await conn.query(`SELECT admin_id,email FROM admin WHERE admin_id = ?`,[req.params.adminID]);
    if (findAdmin.length < 1) {
      await conn.release();
      return res.status(404).json({
        message: "Admin not found"
      });
    }
    else if (findAdmin[0].admin_id == currentAdminId) {
      await conn.release();
      return res.status(406).json({
        message: "Sie können den momentan eingeloggten User nicht löschen"
      });
    }
    // Return an error message if the admin is attempting to delete the default admin account
    else if (findAdmin[0].email == defaultAdminName) {
      await conn.release();
      return res.status(406).json({
        message: "You cannot delete the default admin"
      });
    }
    // Delete the admin from the database
    await conn.query(`DELETE FROM admin WHERE admin_id = ?`,[req.params.adminID]);
    await conn.release();
    return res.status(200).json({
      message: "Admin deleted successfully"
    });
  } catch (err) {
    console.error('Catch error:', err);
    res.status(500).json({
      message: "Server error"
    });
  }
}

// Get the current email
exports.getCurrentEmail = async (req, res) => {
  try {
    const conn = await db.pool.getConnection();
    // Retrieve the most recent email from the database
    const email = await conn.query('SELECT email FROM email ORDER BY created_at DESC LIMIT 1');
    // Return the email if found
    if (email.length > 0) {
      res.status(200).json(email)
    } else {
      res.status(404).json({
        message: "Email not found"
      })
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Server error'
    });
  }
}

// Change the email
exports.changeEmail = async (req, res) => {
  try {
    // Extract the new email from the request body
    const newEmail = req.body.email;
    const {error} = validationSchemas.email.validate(newEmail);
    if(error){
      return res.status(400).json({
        message: error.details[0].message
      });
    }
    const conn = await db.pool.getConnection();
    // Insert the new email into the database
    await conn.query(`INSERT INTO email (email) VALUES (?)`,[newEmail]);
    conn.release();
    return res.status(201).json({
      message: 'Successfully'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Server error'
    });
  }
}

