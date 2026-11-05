ALTER TABLE refresh_token
ALTER COLUMN session_id TYPE UUID
        USING session_id::uuid,
    ALTER COLUMN client_id TYPE UUID
        USING client_id::uuid,
    ALTER COLUMN client_id SET NOT NULL;

ALTER TABLE refresh_token_history
ALTER COLUMN session_id TYPE UUID
        USING session_id::uuid;