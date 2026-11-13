-- 문서의 신청 시각 컬럼명(requested_at)에 맞춥니다.
-- 기존 신청 시각 데이터는 유지하고 컬럼명만 변경합니다.
ALTER TABLE registrations
    RENAME COLUMN created_at TO requested_at;
