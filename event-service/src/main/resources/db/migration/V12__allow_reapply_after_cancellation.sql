-- 취소된 신청 기록은 보존하면서 동일 회원·행사의 재신청을 허용합니다.
ALTER TABLE registrations
    DROP CONSTRAINT uk_registration_user_event;

-- 취소되지 않은 신청은 한 회원·행사 조합당 하나만 허용합니다.
CREATE UNIQUE INDEX uk_registration_active_user_event
    ON registrations (user_id, event_id)
    WHERE status <> 'CANCELLED';
