// Middleware function to verify JWT token and authenticate requests
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1]; // ['Bearer', 'token']
    
    // Verify and decode the token using the JWT secret key
    req.userData = jwt.verify(token, process.env.JWT_KEY);
    
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Authorization failed"
    });
  }
};
