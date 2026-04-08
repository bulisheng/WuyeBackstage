# Property Server

Spring Boot backend for the property management mini program.

## What it does

- Provides the public APIs used by the mini program
- Persists business data in MongoDB
- Exposes admin APIs under `/api/v1/admin`
- Exposes assistant APIs under `/api/v1/assistant`

## Database connection

Default MongoDB URI:

```text
mongodb://localhost:27017/property_management
```

You can override it with:

```text
MONGODB_URI
```

Example:

```bash
set MONGODB_URI=mongodb://localhost:27017/property_management
```

## Run

### Local Maven

```bash
cd server
mvn spring-boot:run
```

The server binds to `0.0.0.0:8080`, so phones on the same LAN can reach it at:

```text
http://192.168.5.4:8080
```

### Docker Compose

From the repository root:

```bash
docker compose up --build
```

## API prefix

All APIs are mounted under:

```text
/api/v1
```

## Important env vars

- `SERVER_PORT` - server port, default `8080`
- `MONGODB_URI` - MongoDB connection string
- `OPENCLAW_BASE_URL` - openclaw endpoint
- `ADMIN_API_KEY` - admin key for login fallback, default `dev-admin-123456`
- `ADMIN_SESSION_TTL_MINUTES` - admin token expiry, default `720`

## Admin login

Use this endpoint first:

```http
POST /api/v1/admin/auth/login
```

Request body:

```json
{
  "adminKey": "dev-admin-123456"
}
```

Then send:

```text
Authorization: Bearer <token>
```

## Quick checks

- Backend health: `http://127.0.0.1:8080/actuator/health`
- Admin notices: `GET /api/v1/admin/notices`
- Admin bills: `GET /api/v1/admin/bills`
- Admin repairs: `GET /api/v1/admin/repairs`
