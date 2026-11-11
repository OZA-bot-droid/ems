CREATE TABLE email_verification
(
    id              BIGSERIAL PRIMARY KEY,
    email           VARCHAR(254) NOT NULL UNIQUE,
    code_hash       VARCHAR(100) NOT NULL,
    expires_at      TIMESTAMPTZ  NOT NULL,
    resend_at       TIMESTAMPTZ  NOT NULL,
    failed_attempts INTEGER      NOT NULL DEFAULT 0,
    verified_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);