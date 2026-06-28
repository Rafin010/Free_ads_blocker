# API Documentation

The Free Blocker Backend uses FastAPI, which automatically generates OpenAPI documentation.

## Interactive Documentation

When the backend server is running, you can access the interactive API documentation at:
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

## Base URL
`/api/v1`

## Endpoints Summary

### Authentication (`/auth`)
- `POST /auth/register`: Register a new user. Optionally accepts a `referral_code`. Returns a JWT token.
- `POST /auth/login`: Authenticate a user and return a JWT token.

*(More endpoints for sync, rules, and admin will be added as the backend expands).*

## Authentication Mechanism

Protected endpoints require a Bearer token in the Authorization header.

```http
Authorization: Bearer <your_jwt_token>
```
