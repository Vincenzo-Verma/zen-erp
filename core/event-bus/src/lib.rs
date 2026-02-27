//! # erp-event-bus
//!
//! NATS JetStream abstraction for async event-driven communication.
//! Provides connect, publish, and subscribe helpers.

use serde::{Deserialize, Serialize};

/// Connect to a NATS server.
pub async fn connect(url: &str) -> Result<async_nats::Client, async_nats::ConnectError> {
    let client = async_nats::connect(url).await?;
    tracing::info!("Event bus connected to {}", url);
    Ok(client)
}

/// Publish a JSON event to a subject.
pub async fn publish<T: Serialize>(
    client: &async_nats::Client,
    subject: &str,
    event: &T,
) -> Result<(), Box<dyn std::error::Error>> {
    let payload = serde_json::to_vec(event)?;
    client.publish(subject.to_string(), payload.into()).await?;
    tracing::debug!(subject = subject, "Event published");
    Ok(())
}

/// Standard ERP event envelope.
#[derive(Debug, Serialize, Deserialize)]
pub struct ErpEvent {
    pub event_type: String,
    pub tenant_id: String,
    pub payload: serde_json::Value,
    pub timestamp: String,
}
