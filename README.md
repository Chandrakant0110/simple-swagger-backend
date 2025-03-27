# Simple Express Backend with Swagger UI and JWT Authentication

A secure Express.js backend API with Swagger UI documentation and JWT authentication.

## Features

- Express.js server with JWT authentication
- Access tokens and refresh tokens
- Secure authentication endpoints
- Swagger UI API documentation
- Protected routes
- CORS enabled
- Security best practices implemented
- Easy to extend

## Security Features

- JSON Web Tokens (JWT) for authentication
- Separate access and refresh tokens
- Password hashing with bcrypt
- Security HTTP headers
- CORS protection
- Request validation
- Error handling

## Installation

```bash
# Clone the repository or create your own
# Navigate to the project directory
cd simple-swagger-backend

# Install dependencies
npm install

# Create a .env file with your configuration
# Example:
# PORT=3000
# ACCESS_TOKEN_SECRET=your_access_token_secret
# REFRESH_TOKEN_SECRET=your_refresh_token_secret
# ACCESS_TOKEN_EXPIRES_IN=15m
# REFRESH_TOKEN_EXPIRES_IN=7d
```

## Usage

### Development

```bash
# Start the server with nodemon for development
npm run dev
```

### Production

```bash
# Start the server
npm start
```

The server will start on port 3000 by default. You can change this by setting the PORT environment variable.

## API Documentation

Once the server is running, you can access the Swagger UI documentation at:

```
http://localhost:3000/api-docs
```

## Authentication Flow

### Registration

1. Register a new user with a unique username and email
   - `POST /api/auth/register`

### Login

1. Login with username/email and password
   - `POST /api/auth/login`
2. Receive access token and refresh token
3. Store tokens securely (refresh token in HTTP-only cookie)

### Accessing Protected Routes

1. Include the access token in the Authorization header
   - `Authorization: Bearer <access_token>`

### Token Refresh

1. When access token expires, use the refresh token to get a new one
   - `POST /api/auth/refresh-token`

### Logout

1. Invalidate the refresh token
   - `POST /api/auth/logout`

## Available Endpoints

### Public Endpoints

- `GET /` - Welcome message
- `GET /api/hello` - Returns a hello message
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login with username/email and password
- `POST /api/auth/refresh-token` - Get a new access token

### Protected Endpoints (Require Authentication)

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get a specific user
- `GET /api/users/profile` - Get the current user's profile
- `POST /api/auth/logout` - Logout (invalidate refresh token)

## Extending the API

To add new endpoints:

1. Create a new route file in the `routes` directory
2. Document your endpoints using Swagger JSDoc annotations
3. Import and use your route in `index.js`
4. Use the `authenticate` middleware for protected routes

Example:

```javascript
const { authenticate } = require('../middleware/auth');

// Public route
router.get('/public', (req, res) => {
  // ...
});

// Protected route
router.get('/protected', authenticate, (req, res) => {
  // Access authenticated user via req.user
  // ...
});
```

## License

ISC 