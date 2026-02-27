//! # erp-proto
//!
//! Generated gRPC/Protobuf code for the SaaS ERP platform.
//! Re-exports all service stubs and message types.

/// Common messages (TenantContext, ApiStatus).
pub mod common {
    tonic::include_proto!("erp.common");
}

/// Health check service definitions.
pub mod health {
    tonic::include_proto!("erp.health");
}

/// Authentication service definitions.
pub mod auth {
    tonic::include_proto!("erp.auth");
}

/// Tenancy service definitions.
pub mod tenancy {
    tonic::include_proto!("erp.tenancy");
}

/// Billing service definitions.
pub mod billing {
    tonic::include_proto!("erp.billing");
}

/// School plugin definitions.
pub mod school {
    tonic::include_proto!("erp.school");
}

/// Audit service definitions.
pub mod audit {
    tonic::include_proto!("erp.audit");
}
