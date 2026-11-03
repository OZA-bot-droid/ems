ALTER TABLE refresh_token
    RENAME COLUMN token TO token_hash;

ALTER TABLE refresh_token
    ALTER COLUMN token_hash TYPE VARCHAR(64);

CREATE UNIQUE INDEX ux_refresh_token_hash
    ON refresh_token (token_hash);