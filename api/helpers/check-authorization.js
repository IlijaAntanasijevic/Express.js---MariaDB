const jwt = require('jsonwebtoken');

module.exports = (req,res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1]; // Bearer token = ['Bearer','token']
    req.userData = jwt.verify(token, process.env.JWT_KEY);
    next();
  }
  catch(error){
    return res.status(401).json({ //401 = Unauthorized
      message: "Authorization failed"
    })
  }
};