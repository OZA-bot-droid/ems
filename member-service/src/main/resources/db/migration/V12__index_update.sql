-- 멀티 디바이스 정책
-- 동일 회원 + 동일 clientId의 활성 Refresh Session 중복 방지
CREATE UNIQUE INDEX ux_refresh_token_member_client
    ON refresh_token(member_id, client_id);

-- 동일 소셜 계정이 여러 Member에 연결되는 것 방지
CREATE UNIQUE INDEX ux_member_provider_provider_id
    ON member(provider, provider_id)
    WHERE provider_id IS NOT NULL;
