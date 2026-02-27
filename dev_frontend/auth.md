# Authentication Routes

Base Path: `/api/v1/auth`

## 1. Register User
Create a new user account.

- **Endpoint**: `POST /register`
- **Auth Required**: No

### Request Body
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "full_name": "John Doe" // Optional
}
```

### Response (Success)
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsIn...", // JWT Token
  "user_id": "uuid-string"
}
```

## 2. Login
Authenticate a user and receive a JWT.

- **Endpoint**: `POST /login`
- **Auth Required**: No

### Request Body
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

### Response (Success)
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsIn...", // JWT Token
  "user_id": "uuid-string"
}
```

## 3. Verify Token (Debug)
Verify if a JWT is valid and get its claims.

- **Endpoint**: `POST /verify`
- **Auth Required**: No (Token sent in body)

### Request Body
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsIn..."
}
```

### Response (Success)
```json
{
  "valid": true,
  "user_id": "uuid-string",
  "email": "user@example.com",
  "roles": ["admin", "user"]
}
```
