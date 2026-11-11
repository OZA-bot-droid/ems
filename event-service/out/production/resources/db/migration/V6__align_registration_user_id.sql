-- Member Service와 동일하게 신청 회원 ID를 BIGINT로 통일합니다.
-- UUID 등 숫자가 아닌 값이 있으면 변환 전에 중단해 데이터 손실을 막습니다.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM registrations
        WHERE user_id !~ '^[0-9]+$'
    ) THEN
        RAISE EXCEPTION 'Cannot migrate registrations.user_id to BIGINT: non-numeric member IDs exist';
    END IF;
END $$;

ALTER TABLE registrations
    ALTER COLUMN user_id TYPE BIGINT USING user_id::BIGINT;
