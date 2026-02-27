# Health Check Routes

Simple endpoints to verify that the Gateway and its downstream dependencies are running.

## 1. Gateway Health
Quickly check if the Gateway service itself is up.

- **Endpoint**: `GET /health`
- **Auth Required**: No

### Response
`200 OK`
```text
ok
```

## 2. gRPC Connectivity Check
Check if the Gateway can successfully connect to the internal gRPC micrososervices (Auth, Tenancy, Billing).

- **Endpoint**: `GET /health/grpc`
- **Auth Required**: No

### Response (Success)
`200 OK`
```json
{
  "status": "up",
  "details": {
    "auth": "pass",
    "tenancy": "pass",
    // billing might be "fail" if not running
  }
}
```
*(Exact response format depends on `grpc_health` module implementation)*
