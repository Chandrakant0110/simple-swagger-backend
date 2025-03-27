const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const User = require('../models/User');

// Generate access token
const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId }, 
    jwtConfig.accessToken.secret, 
    { expiresIn: jwtConfig.accessToken.expiresIn }
  );
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  const refreshToken = jwt.sign(
    { userId }, 
    jwtConfig.refreshToken.secret, 
    { expiresIn: jwtConfig.refreshToken.expiresIn }
  );
  
  // Store the refresh token in the user's record
  User.addRefreshToken(userId, refreshToken);
  
  return refreshToken;
};

// Verify access token
const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, jwtConfig.accessToken.secret);
    return { valid: true, expired: false, userId: decoded.userId };
  } catch (error) {
    return { 
      valid: false, 
      expired: error.name === 'TokenExpiredError', 
      userId: null 
    };
  }
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, jwtConfig.refreshToken.secret);
    
    // Check if the refresh token exists in the user's record
    const isValidToken = User.hasRefreshToken(decoded.userId, token);
    
    if (!isValidToken) {
      return { valid: false, expired: false, userId: null };
    }
    
    return { valid: true, expired: false, userId: decoded.userId };
  } catch (error) {
    return { 
      valid: false, 
      expired: error.name === 'TokenExpiredError', 
      userId: null 
    };
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
}; 