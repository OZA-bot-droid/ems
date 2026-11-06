-- 잘못된 행사 ID가 남아 있으면 FK 추가를 중단해 정리 대상을 명확히 알립니다.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM registrations r
        LEFT JOIN events e ON e.id = r.event_id
        WHERE e.id IS NULL
    ) THEN
        RAISE EXCEPTION 'Cannot add fk_registrations_event: registrations reference missing events';
    END IF;
END $$;

ALTER TABLE registrations
    ADD CONSTRAINT fk_registrations_event
    FOREIGN KEY (event_id) REFERENCES events (id);

ALTER TABLE registrations
    ADD CONSTRAINT chk_registration_status
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'));
