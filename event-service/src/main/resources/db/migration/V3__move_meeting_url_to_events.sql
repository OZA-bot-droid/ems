-- 화상 회의 링크를 세션에서 행사로 옮긴다 (2026-10-22)
-- 세미나 하나는 보통 회의방 하나로 진행하므로 행사 단위로 관리한다
ALTER TABLE events ADD COLUMN meeting_url VARCHAR(500);

ALTER TABLE sessions DROP COLUMN meeting_url;
