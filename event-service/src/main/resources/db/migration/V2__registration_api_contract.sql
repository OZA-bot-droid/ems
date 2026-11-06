-- Align the initial registration table with the Event Service data model.
ALTER TABLE registrations
    ALTER COLUMN user_id TYPE VARCHAR(36) USING user_id::text;

ALTER TABLE registrations RENAME COLUMN applied_at TO created_at;

ALTER TABLE registrations
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN decided_at TIMESTAMPTZ;

ALTER TABLE registrations
    ADD CONSTRAINT uk_registration_user_event UNIQUE (user_id, event_id);

CREATE INDEX idx_registration_user_status ON registrations (user_id, status);
CREATE INDEX idx_registration_event_status ON registrations (event_id, status);
