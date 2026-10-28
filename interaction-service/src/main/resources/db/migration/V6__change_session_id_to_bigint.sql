-- session_id가 UUID인 기존 데이터가 남아 있다면 마이그레이션 중단
-- session_id가 UUID인 기존 데이터 삭제해야함.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM poll)
       OR EXISTS (SELECT 1 FROM poll_vote) THEN
        RAISE EXCEPTION '기존 투표 데이터가 존재합니다.';
END IF;
END
$$;

-- UUID → BIGINT 변경
ALTER TABLE poll
ALTER COLUMN session_id TYPE BIGINT
    USING NULL::BIGINT;

ALTER TABLE poll_vote
ALTER COLUMN session_id TYPE BIGINT
    USING NULL::BIGINT;