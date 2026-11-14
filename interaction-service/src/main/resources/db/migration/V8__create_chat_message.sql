CREATE TABLE chat_message (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL,
    member_id BIGINT NOT NULL,
    content VARCHAR(1000) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_chat_message_content CHECK (length(btrim(content)) > 0)
);
