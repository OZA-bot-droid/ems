-- 행사 게시일 컬럼 추가 (시간대 포함 timestamptz, 다른 날짜 컬럼과 같은 형식)
-- 기존 행사에는 값이 없으므로 NULL 허용으로 추가합니다.
ALTER TABLE events
    ADD COLUMN posted_date TIMESTAMPTZ;
