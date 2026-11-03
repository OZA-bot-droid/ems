ALTER TABLE refresh_token
    RENAME COLUMN token TO token_hash;

ALTER TABLE refresh_token
    ALTER COLUMN token_hash TYPE VARCHAR(64);