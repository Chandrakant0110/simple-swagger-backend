const bcrypt = require('bcrypt');

// In a real application, you would use a database instead of in-memory storage
const users = [];

class User {
  constructor(id, username, email, password) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.password = password;
    this.refreshTokens = []; // Store refresh tokens for the user
  }

  // Method to create a new user
  static async create(username, email, password) {
    // Check if user already exists
    const existingUser = users.find(
      user => user.username === username || user.email === email
    );
    
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const id = users.length + 1;
    const user = new User(id, username, email, hashedPassword);
    
    // Add to "database"
    users.push(user);
    
    return {
      id: user.id,
      username: user.username,
      email: user.email
    };
  }

  // Find user by username or email
  static findByCredentials(usernameOrEmail) {
    return users.find(
      user => user.username === usernameOrEmail || user.email === usernameOrEmail
    );
  }

  // Find user by ID
  static findById(id) {
    return users.find(user => user.id === parseInt(id));
  }

  // Compare password
  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Add refresh token to user
  static addRefreshToken(userId, token) {
    const user = this.findById(userId);
    if (user) {
      // Limit number of refresh tokens per user (optional security measure)
      if (user.refreshTokens.length >= 5) {
        // Remove the oldest token
        user.refreshTokens.shift();
      }
      user.refreshTokens.push(token);
    }
  }

  // Remove refresh token from user
  static removeRefreshToken(userId, token) {
    const user = this.findById(userId);
    if (user) {
      user.refreshTokens = user.refreshTokens.filter(t => t !== token);
    }
  }

  // Verify if refresh token exists for user
  static hasRefreshToken(userId, token) {
    const user = this.findById(userId);
    return user ? user.refreshTokens.includes(token) : false;
  }

  // Get all users (for demonstration purposes)
  static getAll() {
    return users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email
    }));
  }
}

module.exports = User; 