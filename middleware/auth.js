const { verifyAccessToken } = require('../utils/tokenUtils');
const User = require('../models/User');

/**
 * Middleware to authenticate users
 * Extracts the token from the Authorization header, verifies it,
 * and attaches the user to the request object if valid
 */
const authenticate = (req, res, next) => {
  // Get the token from the authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      status: 'error', 
      message: 'Authentication required. No token provided.' 
    });
  }

  // Extract the token
  const token = authHeader.split(' ')[1];

  // Verify the token
  const { valid, expired, userId } = verifyAccessToken(token);

  if (!valid) {
    if (expired) {
      return res.status(401).json({
        status: 'error',
        message: 'Token has expired. Please refresh your token.'
      });
    }
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token.'
    });
  }

  // Get the user from the database
  const user = User.findById(userId);

  if (!user) {
    return res.status(401).json({
      status: 'error',
      message: 'User not found.'
    });
  }

  // Attach the user to the request object
  req.user = {
    id: user.id,
    username: user.username,
    email: user.email
  };

  next();
};

module.exports = { authenticate }; 