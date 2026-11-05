ALTER TABLE member
    ADD CONSTRAINT chk_member_role
        CHECK (role IN ('ADMIN', 'USER'));