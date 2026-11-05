ALTER TABLE member
    ADD COLUMN provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL',
    ADD COLUMN provider_id VARCHAR(255);

-- CREATE UNIQUE INDEX uk_member_provider_provider_id
--     ON member(provider, provider_id)
--     WHERE provider_id IS NOT NULL;