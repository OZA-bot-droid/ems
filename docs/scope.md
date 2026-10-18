# 범위 — 6개 목표 서비스, 단계별 구축

| 단계 | 서비스/기능 | 완료 기준 |
|---|---|---|
| P0 | Member | 가입·로그인/JWT, USER/ADMIN RBAC |
| P0 | Event | 행사·세션 CRUD, 참가 신청·취소·승인, 정원 관리 |
| P0 | Interaction | WebSocket 투표, 중복 차단, 결과 방송 |
| P0 | Frontend | React/Vite/Tailwind 행사·세미나·투표·기본 대시보드 |
| P0 | 인프라 | Nginx reverse proxy, Spring Cloud Gateway, PostgreSQL 논리 분리, 기본 Docker 실행 |
| P0 | 보고 | OpenAPI, 보안 및 통합 테스트, 기본 Event 집계 |
| P1 | Notification | 앱 내 알림, 외부 SNS 공유·푸시 연동 |
| P1 | Analytics | Event/Interaction 데이터를 API 등으로 받아 통계/리포트 독립 제공 |
| P1 | Integration | 외부 Zoom/Jitsi 세미나 링크 관리 및 연동 |
| P1 | Redis | 필요 시 실시간 분산 Pub/Sub/캐시 |
| P1 | 모니터링 | Prometheus/Grafana, Elasticsearch/Kibana |
| P1 | Cloud | Storage/CDN, Kubernetes 또는 OpenShift |
| P2 | 고급 기능 | Kafka, gRPC, GraphQL, Jenkins/ArgoCD, 자체 화상 스트리밍, 멀티클라우드 |

**수업의 필수 평가 기준과 실제 구현 우선순위는 별도 확인.** 운영 로그/성능 분석/Cloud Storage가 채점 필수라면 해당 P1을 상향하고 기타 선택 범위를 축소한다.

### 완료 시나리오
관리자 로그인 → 행사/세션 생성 → 회원 참가 신청 → 관리자 승인 → 승인 회원의 투표 → 실시간 결과와 기본 통계 표시 → Docker 기반 시연.
