//! gRPC AuthService implementation.

use erp_proto::auth::auth_service_server::AuthService;
use erp_proto::auth::{
    AuthResponse, LoginRequest, RegisterRequest, VerifyTokenRequest, VerifyTokenResponse,
};
use sqlx::PgPool;
use tonic::{Request, Response, Status};
use uuid::Uuid;

use crate::jwt;
use crate::password;

/// Auth service backed by Postgres.
pub struct AuthServiceImpl {
    pool: PgPool,
    jwt_secret: String,
}

impl AuthServiceImpl {
    pub fn new(pool: PgPool, jwt_secret: String) -> Self {
        Self { pool, jwt_secret }
    }
}

#[tonic::async_trait]
impl AuthService for AuthServiceImpl {
    /// Register a new user.
    async fn register(
        &self,
        request: Request<RegisterRequest>,
    ) -> Result<Response<AuthResponse>, Status> {
        let req = request.into_inner();

        // Validate input
        if req.email.is_empty() || req.password.is_empty() {
            return Ok(Response::new(AuthResponse {
                success: false,
                message: "Email and password are required".into(),
                token: String::new(),
                user_id: String::new(),
            }));
        }

        // Check if user already exists
        let existing = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM users WHERE email = $1"
        )
        .bind(&req.email)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| Status::internal(format!("DB error: {}", e)))?;

        if existing > 0 {
            return Ok(Response::new(AuthResponse {
                success: false,
                message: "User with this email already exists".into(),
                token: String::new(),
                user_id: String::new(),
            }));
        }

        // Hash password
        let password_hash = password::hash_password(&req.password)
            .map_err(|e| Status::internal(format!("Hash error: {}", e)))?;

        // Insert user
        let user_id = Uuid::new_v4();
        sqlx::query(
            "INSERT INTO users (id, email, password_hash, full_name) VALUES ($1, $2, $3, $4)"
        )
        .bind(user_id)
        .bind(&req.email)
        .bind(&password_hash)
        .bind(&req.full_name)
        .execute(&self.pool)
        .await
        .map_err(|e| Status::internal(format!("DB insert error: {}", e)))?;

        // Generate JWT
        let token = jwt::create_token(&user_id, &req.email, &self.jwt_secret)
            .map_err(|e| Status::internal(format!("JWT error: {}", e)))?;

        tracing::info!(user_id = %user_id, email = %req.email, "User registered");

        Ok(Response::new(AuthResponse {
            success: true,
            message: "User registered successfully".into(),
            token,
            user_id: user_id.to_string(),
        }))
    }

    /// Login with email/password.
    async fn login(
        &self,
        request: Request<LoginRequest>,
    ) -> Result<Response<AuthResponse>, Status> {
        let req = request.into_inner();

        // Fetch user
        let row = sqlx::query_as::<_, (Uuid, String, String)>(
            "SELECT id, email, password_hash FROM users WHERE email = $1"
        )
        .bind(&req.email)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Status::internal(format!("DB error: {}", e)))?;

        let (user_id, email, password_hash) = match row {
            Some(r) => r,
            None => {
                return Ok(Response::new(AuthResponse {
                    success: false,
                    message: "Invalid email or password".into(),
                    token: String::new(),
                    user_id: String::new(),
                }));
            }
        };

        // Verify password
        let valid = password::verify_password(&req.password, &password_hash)
            .map_err(|e| Status::internal(format!("Hash verify error: {}", e)))?;

        if !valid {
            return Ok(Response::new(AuthResponse {
                success: false,
                message: "Invalid email or password".into(),
                token: String::new(),
                user_id: String::new(),
            }));
        }

        // Generate JWT
        let token = jwt::create_token(&user_id, &email, &self.jwt_secret)
            .map_err(|e| Status::internal(format!("JWT error: {}", e)))?;

        tracing::info!(user_id = %user_id, "User logged in");

        Ok(Response::new(AuthResponse {
            success: true,
            message: "Login successful".into(),
            token,
            user_id: user_id.to_string(),
        }))
    }

    /// Verify a JWT token.
    async fn verify_token(
        &self,
        request: Request<VerifyTokenRequest>,
    ) -> Result<Response<VerifyTokenResponse>, Status> {
        let req = request.into_inner();

        match jwt::verify_token(&req.token, &self.jwt_secret) {
            Ok(claims) => {
                let mut roles = vec![];
                
                // Fetch user to check if they are a superadmin globally
                if let Ok(user_id) = claims.sub.parse::<Uuid>() {
                    let is_super_admin = sqlx::query_scalar::<_, bool>(
                        "SELECT is_super_admin FROM users WHERE id = $1"
                    )
                    .bind(user_id)
                    .fetch_optional(&self.pool)
                    .await
                    .unwrap_or(Some(false))
                    .unwrap_or(false);

                    if is_super_admin {
                        roles.push("superadmin".to_string());
                    }
                }

                Ok(Response::new(VerifyTokenResponse {
                    valid: true,
                    user_id: claims.sub,
                    email: claims.email,
                    roles,
                }))
            }
            Err(_) => Ok(Response::new(VerifyTokenResponse {
                valid: false,
                user_id: String::new(),
                email: String::new(),
                roles: vec![],
            })),
        }
    }

    /// Force update a user's password.
    async fn update_password(
        &self,
        request: Request<erp_proto::auth::UpdatePasswordRequest>,
    ) -> Result<Response<AuthResponse>, Status> {
        let req = request.into_inner();

        if req.user_id.is_empty() || req.new_password.is_empty() {
             return Ok(Response::new(AuthResponse {
                 success: false,
                 message: "User ID and new password are required".into(),
                 token: String::new(),
                 user_id: String::new(),
             }));
        }

        let user_uuid = match Uuid::parse_str(&req.user_id) {
            Ok(id) => id,
            Err(_) => return Ok(Response::new(AuthResponse {
                success: false,
                message: "Invalid User ID format".into(),
                token: String::new(),
                user_id: String::new(),
            })),
        };

        // Hash password
        let password_hash = password::hash_password(&req.new_password)
            .map_err(|e| Status::internal(format!("Hash error: {}", e)))?;

        // Update user
        let result = sqlx::query("UPDATE users SET password_hash = $1 WHERE id = $2")
            .bind(&password_hash)
            .bind(user_uuid)
            .execute(&self.pool)
            .await
            .map_err(|e| Status::internal(format!("DB update error: {}", e)))?;

        if result.rows_affected() == 0 {
            return Ok(Response::new(AuthResponse {
                success: false,
                message: "User not found".into(),
                token: String::new(),
                user_id: String::new(),
            }));
        }

        tracing::info!(user_id = %req.user_id, "User password updated via admin action");

        Ok(Response::new(AuthResponse {
            success: true,
            message: "Password updated successfully".into(),
            token: String::new(),
            user_id: req.user_id,
        }))
    }
}
