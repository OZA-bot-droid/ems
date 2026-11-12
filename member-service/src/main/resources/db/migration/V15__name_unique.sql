ALTER TABLE member
    ADD CONSTRAINT uk_member_name UNIQUE (name);