# 6. API Contracts

## 6.1 Overview
*   **Internal Communication**: gRPC (Protobuf) for high-performance, strongly-typed service-to-service calls.
*   **External Communication**: REST (JSON) exposed via the API Gateway.
*   **Documentation**: Swagger/OpenAPI 3.0.

## 6.2 Internal gRPC Contracts
Defined in `proto/` directory in the Monorepo.

### 6.2.1 `core/auth.proto`
Service for token verification and context hydration.
```protobuf
syntax = "proto3";
package core.auth;

service AuthService {
  // Verifies a JWT and returns the associated Tenant Context
  rpc VerifyToken (VerifyTokenRequest) returns (VerifyTokenResponse);
}

message VerifyTokenRequest {
  string token = 1;
}

message VerifyTokenResponse {
  bool valid = 1;
  string user_id = 2;
  string tenant_id = 3;
  repeated string roles = 4;
}
```

### 6.2.2 `plugin/school.proto`
Example contract for the School Plugin.
```protobuf
syntax = "proto3";
package plugin.school;

service StudentService {
  rpc GetStudent (GetStudentRequest) returns (StudentResponse);
  rpc CreateStudent (CreateStudentRequest) returns (StudentResponse);
}

message GetStudentRequest {
  string student_id = 1;
  // tenant_id is NOT here; it's passed in metadata headers!
}

message StudentResponse {
  string id = 1;
  string name = 2;
  string admission_number = 3;
}
```

## 6.3 External REST API
Exposed by the Gateway, which acts as a proxy/aggregator.

### 6.3.1 Authentication
*   **Context**: All requests (except login/register) require `Authorization: Bearer <token>`.

### 6.3.2 Routes
| Method | Path | Upstream Service | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Core (Auth) | User login, returns JWT. |
| `POST` | `/api/v1/auth/register` | Core (Auth) | Create new account/tenant. |
| `GET` | `/api/v1/billing` | Core (Billing) | Get wallet balance. |
| `GET` | `/api/v1/school/students` | Plugin (School) | List students. |
| `POST` | `/api/v1/school/students` | Plugin (School) | Enroll a student. |

## 6.4 Context Propagation
*   **Header**: `x-tenant-id`
*   **Flow**:
    1.  Gateway validates JWT.
    2.  Gateway extracts `tenant_id` claim.
    3.  Gateway injects `x-tenant-id` into gRPC metadata.
    4.  Services read `x-tenant-id` to set DB session.
    *Note: Clients never send `x-tenant-id` directly; Gateway effectively overwrites it to prevent spoofing.*
