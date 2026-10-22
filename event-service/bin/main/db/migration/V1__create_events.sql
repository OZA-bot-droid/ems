-- 행사 테이블 (docs/data-model.md)
CREATE TABLE events (
    id          UUID PRIMARY KEY,
    title       VARCHAR(200)  NOT NULL,
    description VARCHAR(2000),
    capacity    INTEGER       NOT NULL,
    starts_at   TIMESTAMPTZ   NOT NULL,
    ends_at     TIMESTAMPTZ   NOT NULL,
    status      VARCHAR(20)   NOT NULL,
    created_by  UUID,
    CONSTRAINT chk_events_capacity CHECK (capacity > 0),
    CONSTRAINT chk_events_period   CHECK (ends_at > starts_at),
    CONSTRAINT chk_events_status   CHECK (status IN ('DRAFT', 'OPEN', 'CLOSED'))
);

CREATE INDEX idx_events_status_starts_at ON events (status, starts_at);
