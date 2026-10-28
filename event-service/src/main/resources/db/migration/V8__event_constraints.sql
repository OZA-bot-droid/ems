-- 주최자가 지정되지 않은 기존 행사가 있으면 소유자를 먼저 보완하도록 중단합니다.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM events
        WHERE created_by IS NULL
    ) THEN
        RAISE EXCEPTION 'Cannot set events.created_by to NOT NULL: events without an owner exist';
    END IF;
END $$;

ALTER TABLE events
    ALTER COLUMN created_by SET NOT NULL;

CREATE INDEX idx_events_created_by ON events (created_by);
