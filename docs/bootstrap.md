# EMS 프로젝트 구동 테스트 가이드 (Bootstrap)

대상: **5인 팀 공통 개발환경** · Windows PowerShell / SourceTree / VS Code / IntelliJ IDEA / DBeaver / Docker Desktop.  
기준: React + Vite + Tailwind CSS, Java 21 / Spring Boot 3.4.5, Spring Cloud Gateway, PostgreSQL 16, Docker Compose.  
본 문서는 **현재 구현된 기능에만** 적용한다. 회원가입·JWT·행사 CRUD·WebSocket·Flyway는 아직 미구현이며 `ping` 성공으로 검증되지 않는다.

## 0. 운영 원칙
- **최초 1회:** 팀원 전원이 본인 PC에서 Docker 전체 실행, 3개 ping, 브라우저, DB 접근 검증.
- **평소 개발:** PostgreSQL은 Docker, Spring Boot는 IntelliJ Run/Debug, React는 VS Code `npm run dev`.
- **통합 테스트/발표:** Docker Compose 전체 실행. 코드 변경 후 이미지를 재빌드해야 반영된다.
- 팀장은 PR 병합 후 전체 서비스 통합·Gateway·Nginx 테스트, 담당 팀원은 본인 기능의 세부 테스트 수행.
- Docker 이미지가 생성된 것과 실제 컨테이너 실행/기능 정상 동작은 다르다.

## 1. 준비 및 버전 확인
1. SourceTree에서 EMS 프로젝트의 **main** 브랜치 체크아웃, Fetch → Pull.
2. Docker Desktop을 실행해 Linux 컨테이너 엔진 준비.
3. VS Code PowerShell에서 프로젝트 최상위 경로 확인:

```powershell
docker --version
docker compose version
docker info
node -v
npm -v
java -version
```

- Docker 통합 실행만 할 경우 로컬 Node/Java는 필수가 아니다.
- 로컬 개발용 권장: Node.js 22.x / npm 10.x, JDK 21. Node 버전 정책은 `docs/node-setup.md` 참조.

## 2. 1차: Docker 전체 실행
EMS 프로젝트 루트에서 (로컬 폴더명은 자유롭게 지정 가능):

```powershell
Copy-Item .env.example .env
# .env 파일에서 POSTGRES_PASSWORD를 로컬 전용 값으로 변경
docker compose config
docker compose up --build -d
docker compose ps
```

`Copy-Item`은 최초 1회만 실행하고 이미 .env가 존재하면 덮어쓰지 않는다.
현재 Compose 서비스는 **7개**: postgres, member, event, interaction, gateway, frontend, nginx. `postgres`는 `healthy`, 나머지는 `Up` 상태인지 확인한다. 컨테이너 실행 순서만으로 API 준비 완료가 보장되지는 않는다.

### API / 브라우저 점검
```powershell
curl.exe http://localhost:8088/api/members/ping
curl.exe http://localhost:8088/api/events/ping
curl.exe http://localhost:8088/api/interactions/ping
```

각 응답은 각각 `{"service":"member-service","status":"UP"}`, `event-service`, `interaction-service`를 포함해야 한다. 브라우저 `http://localhost:8088`에서 3개 서비스 상태를 확인한다.

통신 경로: **브라우저 :8088 → Nginx → Gateway :8080 → 서비스(:8081/:8082/:8083)**. Gateway의 `StripPrefix=1`으로 `/api/members/ping`은 내부 `/members/ping`으로 전달된다.

> 현재 팀장이 3개 ping 성공을 확인했으나, 각 팀원 로컬 환경은 별도로 점검한다.

### Docker 이미지와 컨테이너 구분
`docker images`는 빌드/다운로드된 **이미지 목록**, `docker compose ps`는 실제 **컨테이너 실행 상태**를 보여준다. IntelliJ를 열지 않아도 컨테이너에서 Java 앱은 실행된다. 그러나 IntelliJ에서 소스를 수정했다고 컨테이너 코드가 자동 갱신되는 것은 아니다.

서비스 코드 수정 후 통합 환경에 반영:
```powershell
docker compose up -d --build --no-deps member
```
필요에 따라 `member`를 `event`, `interaction`, `gateway`로 바꾼다. Gradle 빌드 오류는 해당 서비스 로그와 빌드 출력을 확인한다.

## 3. 2차: PostgreSQL 16 / DBeaver
**현재 compose.yml은 PostgreSQL의 호스트 포트를 공개하지 않는다.** 따라서 DBeaver 또는 IntelliJ가 `localhost:5432`로 접속하도록 하려면 루트에 Git 추적하지 않는 로컬용 `compose.override.yml`을 준비한다.

```yaml
services:
  postgres:
    ports:
      - "127.0.0.1:5432:5432"
```

```powershell
docker compose up -d postgres
```

5432 포트 충돌이 있다면 매핑을 `127.0.0.1:5433:5432`로 변경하고 DBeaver에서는 5433으로 접속한다.

| Database | Host / Port | User | 초기 비밀번호 |
|---|---|---|---|
| member_db | localhost / 5432 | member_app | localdev |
| event_db | localhost / 5432 | event_app | localdev |
| interaction_db | localhost / 5432 | interaction_app | localdev |

DBeaver → New Database Connection → PostgreSQL → 접속 정보 입력 → Test Connection.

```sql
SELECT current_database(), current_user;
SELECT schema_name FROM information_schema.schemata ORDER BY schema_name;
```

현재는 DB/계정만 초기화하며 **업무 테이블은 아직 생성되지 않으므로 테이블이 없어도 정상**이다. `infra/postgres/init/01-databases.sql`은 빈 PostgreSQL 데이터 볼륨의 **최초 실행 시에만** 적용된다. 기존 DB 데이터를 유지해야 한다면 `docker compose down -v`를 실행하지 말 것. `localdev`는 개인 로컬 전용 임시 비밀번호이며 운영·공유 환경 사용 금지.

## 4. 3차: IntelliJ에서 Spring Boot Run/Debug
**평소 기능 개발 권장 방식**: Docker에서는 DB만 실행하고 나머지 백엔드는 IntelliJ에서 실행한다.

```powershell
docker compose down
docker compose up -d postgres
```

위 3절의 PostgreSQL 호스트 포트 공개 설정이 필요하다.

IntelliJ에 다음 폴더를 각각 Gradle 프로젝트로 열거나 Import한다.

| 프로젝트 | Java 메인 클래스 | 로컬 포트 |
|---|---|---|
| gateway | GatewayApplication | 8080 |
| member-service | MemberApplication | 8081 |
| event-service | EventApplication | 8082 |
| interaction-service | InteractionApplication | 8083 |

- Project SDK/Gradle JVM: **JDK 21**.
- 각 서비스의 `application.yml` 기본 DB URL은 `jdbc:postgresql://localhost:5432/{service}_db`.
- Gradle Wrapper가 없다면 IDE에 사용할 Gradle 배포판을 설정해야 할 수 있다.
- 실행 로그에서 `Started ...Application`을 확인한다.

개별 테스트:
```powershell
curl.exe http://localhost:8081/members/ping
curl.exe http://localhost:8082/events/ping
curl.exe http://localhost:8083/interactions/ping
curl.exe http://localhost:8080/api/members/ping
curl.exe http://localhost:8080/api/events/ping
curl.exe http://localhost:8080/api/interactions/ping
```

Gateway가 IntelliJ에서 실행된다면 기본 라우트는 localhost로 접속한다. 반면 **Docker 안의 Gateway는 내부 Docker 호스트명(member/event/interaction)을 사용**하므로 로컬 IntelliJ 앱에 자동 연결되지 않는다. 혼합 실행이 필요하면 별도 Gateway URL 설정(예: host.docker.internal)과 포트 공개가 필요하다.

IntelliJ 변경 코드는 Run/Debug 재실행을 통해 확인하고, Docker 코드에는 재빌드 후 반영한다.

## 5. 4차: VS Code에서 React/Vite
IntelliJ에서 Gateway(:8080) 및 대상 Spring Boot 서비스를 실행한 상태:

```powershell
cd frontend
node -v
npm -v
npm install
npm run dev
```

브라우저 `http://localhost:5173` 접속. `frontend/vite.config.js`의 `/api` 프록시는 기본적으로 `http://localhost:8080`으로 요청을 전달한다. F12 → Network에서 세 `/api/*/ping` 응답을 확인한다.

프로덕션 빌드 확인:
```powershell
npm run build
```

프론트만 실행하면 API는 `ERROR`로 표시될 수 있다. 이는 백엔드 미구동 때문일 수 있으며 Vite 설치 오류와는 구분한다.

## 6. 오류 발생 시
| 증상 | 점검할 사항 |
|---|---|
| Docker 이미지 존재하나 API 실패 | `docker compose ps`, 해당 서비스 로그, Nginx/Gateway 포트 |
| 502 Bad Gateway | Gateway·대상 서비스 시작 여부 및 Docker 호스트명 |
| 404 Not Found | Gateway Path/StripPrefix와 Controller 매핑 |
| DBeaver 접속 거부 | Compose 포트 공개 여부, PostgreSQL 컨테이너 상태 |
| DB 비밀번호 오류 | 기존 볼륨의 사용자 암호, 초기화 스크립트 실행 여부 |
| IntelliJ 시작 실패 | JDK 21, Gradle, PostgreSQL 포트/DB 연결 |
| React ERROR | Vite proxy, Gateway 응답, 브라우저 Network 로그 |

```powershell
docker compose logs --tail=100 postgres
docker compose logs --tail=100 gateway member event interaction nginx
docker compose logs -f gateway
```

## 7. 팀원별 체크리스트 및 통합 기준
- [ ] SourceTree main 최신 코드 반영
- [ ] Docker Compose 7개 서비스 구동 상태 확인
- [ ] `/api/members/ping` 정상
- [ ] `/api/events/ping` 정상
- [ ] `/api/interactions/ping` 정상
- [ ] `http://localhost:8088` React 초기 화면 확인
- [ ] DBeaver에서 담당 DB 접속 성공
- [ ] IntelliJ 또는 VS Code에서 담당 프로젝트 개발 모드 실행 성공

담당: **오좌언** 전체 통합 / **하진철** Member·인증 / **박천보** Interaction·투표 / **이도형** Event 참가·승인 / **이도관** Event 행사·세션.

**1회 전원 기본 통신 검증 → 이후 각자 담당 기능 테스트 → PR 병합 시 팀장 통합 테스트** 원칙을 적용한다.

완료 기준: React → Nginx/Gateway → 3개 Spring 서비스 `ping` 성공과 개별 개발 모드 구동 가능. 아직 구현되지 않은 JWT·CRUD·WebSocket·DB 업무 테이블 검증으로 해석해서는 안 된다.
