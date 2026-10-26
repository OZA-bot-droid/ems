-- poll_vote(유저투표 테이블) session_id 추가
ALTER TABLE poll_vote ADD COLUMN session_id UUID NOT NULL;