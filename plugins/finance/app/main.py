"""
Finance Plugin — SaaS ERP.
Exposes /invoice and other finance endpoints.
Tenant context is read from X-Tenant-ID (set by Kernel); use it for schema/DB scope.
"""
from fastapi import FastAPI, Header
from fastapi.responses import JSONResponse
from typing import Optional

app = FastAPI(
    title="Finance Plugin",
    description="Finance microservice for SaaS ERP",
    version="0.1.0",
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "finance"}


@app.get("/invoice")
def list_invoices(
    x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-ID"),
):
    """
    Dummy invoice list. In production, scope queries by tenant_id (e.g. schema or tenant column).
    """
    tenant_id = x_tenant_id or "default"
    # Example: use tenant_id to select schema or filter: db.query(Invoice).filter(tenant_id=tenant_id)
    return JSONResponse(
        content={
            "tenant_id": tenant_id,
            "invoices": [
                {
                    "id": "inv-001",
                    "amount": "1500.00",
                    "currency": "USD",
                    "status": "paid",
                },
                {
                    "id": "inv-002",
                    "amount": "2300.50",
                    "currency": "USD",
                    "status": "pending",
                },
            ],
        }
    )


@app.get("/invoice/{invoice_id}")
def get_invoice(
    invoice_id: str,
    x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-ID"),
):
    """Dummy single invoice. Always scope by tenant in production."""
    tenant_id = x_tenant_id or "default"
    return JSONResponse(
        content={
            "tenant_id": tenant_id,
            "id": invoice_id,
            "amount": "1500.00",
            "currency": "USD",
            "status": "paid",
        }
    )
