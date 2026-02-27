-- Add configurable prefix column to tenants for numbering (e.g., "GVS")
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS prefix TEXT;

-- Number sequence table for auto-generating admission/employee numbers
-- Format: {PREFIX}-{S|T}-{YY}{SEQ:03}  e.g., GVS-S-25001
CREATE TABLE IF NOT EXISTS number_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('student', 'staff')),
    year INT NOT NULL,
    next_sequence INT NOT NULL DEFAULT 1,
    UNIQUE (tenant_id, type, year)
);

CREATE INDEX IF NOT EXISTS idx_number_sequences_lookup
    ON number_sequences(tenant_id, type, year);
