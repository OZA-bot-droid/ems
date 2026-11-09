-- SHA-256 해시를 hex 문자열로 저장할 계획
-- SHA-256 hex 결과는 항상 64글자
ALTER TABLE refresh_token_history
    ALTER COLUMN token_hash TYPE VARCHAR(64);