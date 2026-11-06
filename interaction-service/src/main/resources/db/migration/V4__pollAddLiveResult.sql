-- 실시간 결과 공개 추가
ALTER TABLE poll ADD COLUMN show_live_results BOOLEAN NOT NULL DEFAULT TRUE;