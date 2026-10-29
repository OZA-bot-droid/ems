ALTER TABLE member
ALTER COLUMN created_at TYPE timestamptz
    USING created_at AT TIME ZONE 'Asia/Seoul';

ALTER TABLE member
ALTER COLUMN updated_at TYPE timestamptz
    USING updated_at AT TIME ZONE 'Asia/Seoul';

ALTER TABLE refresh_token
ALTER COLUMN created_at TYPE timestamptz
    USING created_at AT TIME ZONE 'Asia/Seoul';

ALTER TABLE refresh_token
ALTER COLUMN expires_at TYPE timestamptz
    USING expires_at AT TIME ZONE 'Asia/Seoul';