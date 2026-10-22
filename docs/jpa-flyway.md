# EMS JPA + Flyway 적용 가이드 (Bootstrap → P0)

## 범위
- Spring Boot 3.4.5 / Java 21 / PostgreSQL 16 유지.
- Member, Event, Interaction 서비스에서 Spring Data JPA + Flyway 사용.
- Gateway, Nginx, Compose, 포트/DB URL, Actuator는 변경 없음.
- **이 PR은 공통 의존성·설정만 준비**하며 업무 Entity/테이블은 생성하지 않음.

## 데이터베이스 초기화 책임
- `infra/postgres/init/01-databases.sql`: 빈 PostgreSQL 볼륨 최초 실행 시 DB 및 DB 계정 생성.
- `<service>/src/main/resources/db/migration/V1__*.sql`: 각 DB의 업무 테이블 및 제약조건 생성 (서비스 담당자).
- 각 서비스는 별도 DB이므로 각각 V1부터 시작. 같은 event_db를 사용하는 Event/Registration 담당자는 번호 협의.
- 서비스 간 직접 DB 조회 및 cross-DB FK 금지.

## 현재 설정의 의도
- `spring.jpa.hibernate.ddl-auto: none`: 현재 main은 업무 테이블도 Entity도 없는 Bootstrap 단계. **임시 설정**.
- `spring.flyway.enabled: true`, `locations: classpath:db/migration`: 향후 버전 SQL을 실행.
- 각 담당자가 Entity와 해당 V1 SQL을 **같은 PR로 추가한 후 `ddl-auto: validate`로 변경**해야 함.
- Entity가 먼저 있는 feature/member 브랜치의 기존 JPA, Security, Lombok, JWT 설정을 유지하고, Flyway 의존성과 YAML 설정만 병합할 것. **main의 build.gradle로 덮어쓰지 말 것.**

## 서비스별 담당 작업
1. Member (하진철): Member/BaseEntity의 실제 컬럼·타입에 맞춘 V1 SQL 및 Refresh Token 정책. 현재 feature/member의 BaseEntity는 Long IDENTITY ID, createAt/updateAt을 포함함. UUID라고 가정하지 말 것.
2. Event 행사/세션 (이도관): events/sessions V1 SQL; 참가(이도형)와 공유 DB 버전 조율.
3. Event 참가/승인 (이도형): registrations 및 UNIQUE(event_id, user_id), 정원 동시성 제어.
4. Interaction (박천보): polls/options/votes, UNIQUE(poll_id, user_id).
5. 공통 통합 (오좌언): PR 충돌 조정, DB 초기화/마이그레이션 검증, Gateway 경로 및 Docker 검증.

## 개발환경 및 확인 방법
```powershell
docker compose up -d postgres
# 서비스 폴더에서 Windows PowerShell / Gradle 환경에 맞게 실행
./gradlew bootRun
```
- 현 저장소에 Gradle Wrapper가 없으면 설치 Gradle 또는 IntelliJ Gradle 실행 구성을 이용.
- IntelliJ 개발 시 PostgreSQL localhost:5432 연결은 문서의 로컬 `compose.override.yml` 포트 매핑이 필요.
- Docker 전체 실행: `docker compose up -d --build`.
- Docker 볼륨을 지우는 `docker compose down -v`는 사용하지 말 것.
- DBeaver에서 각 DB의 `flyway_schema_history` 확인: 마이그레이션 파일 적용 이후 이력 생성.
- 확인 API: `/api/members/ping`, `/api/events/ping`, `/api/interactions/ping`.

## 테스트/완료 기준
- 3개 서비스의 Gradle 의존성 해석 및 빌드 성공.
- 개별 Spring Boot 기동 및 기존 Ping 성공.
- 각 담당자의 V1 SQL 추가 후 Flyway 적용 성공, JPA validate 통과.
- 같은 DB의 V1 번호 중복 없음; 이미 적용한 V1은 수정하지 않고 V2 추가.
- 팀원이 구현한 Entity 및 인증 기능 코드는 공통 설정 PR에서 변경하지 않음.

> 현재 PR은 통합 실행 결과가 아니라 **공통 설정 준비**. 실제 테스트는 팀별 로컬/Docker 환경에서 수행해야 함.
