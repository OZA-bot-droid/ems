-- 세션 테이블 (docs/data-model.md)
-- 행사 하나에 여러 세션이 시간대별로 붙는다 (1:N)
CREATE TABLE sessions (
    id          UUID PRIMARY KEY,
    event_id    UUID          NOT NULL REFERENCES events (id) ON DELETE CASCADE, -- 행사를 지우면 세션도 함께 삭제
    title       VARCHAR(200)  NOT NULL,   -- 그 시간대에 할 일 (예: 클라우드 아키텍처의 현재)
    starts_at   TIMESTAMPTZ   NOT NULL,
    ends_at     TIMESTAMPTZ   NOT NULL,
    meeting_url VARCHAR(500),             -- 화상회의 링크 (선택, P1 Integration 연동 전까지 직접 입력)
    CONSTRAINT chk_sessions_period CHECK (ends_at > starts_at)
);

-- 행사별 세션을 시간순으로 조회할 때 사용
CREATE INDEX idx_sessions_event_starts_at ON sessions (event_id, starts_at);
