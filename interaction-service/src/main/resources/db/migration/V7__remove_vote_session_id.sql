-- PollVote의 중복 session_id 제거
ALTER TABLE poll_vote DROP COLUMN session_id;