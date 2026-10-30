CREATE TABLE refresh_token_history
(
    id         BIGSERIAL PRIMARY KEY,
    member_id  BIGINT       NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_refresh_token_history_member
        FOREIGN KEY (member_id)
            REFERENCES member(id)
            ON DELETE CASCADE
);

ALTER TABLE refresh_token
    ADD CONSTRAINT fk_refresh_token_member
        FOREIGN KEY (member_id)
            REFERENCES member(id)
            ON DELETE CASCADE;