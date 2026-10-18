# 배포 및 운영 목표

## 경로
브라우저 HTTPS/WSS → Nginx(정적 파일/Ingress) → Spring Cloud Gateway → 6개 목표 서비스.
P0에서는 Member/Event/Interaction 3개만 실행하고 P1 서비스는 단계적으로 추가.

## 컴포넌트
- PostgreSQL: member_db / event_db / interaction_db (P0), notification_db / analytics_db / integration_db (P1)
- Redis: WebSocket Pub/Sub, 임시 캐시 (P1)
- Elasticsearch + Kibana: 중앙 로그 검색 (P1)
- Prometheus + Grafana: 서비스/인프라 메트릭 (P1)
- Cloud Storage + CDN: 정적 파일/첨부 자산 (P1)
- Kubernetes/OpenShift: 운영 단계/평가 필수 시 구축. Nginx reverse proxy와 Ingress controller는 배포 환경에 따라 선택/병용.

## 실행 순서
1. .env.example을 로컬 .env로 복사하고 비밀번호 지정(커밋 금지)
2. PostgreSQL 서비스별 데이터베이스/계정과 Flyway 마이그레이션
3. Gateway + 서비스 Spring Boot + React Vite + Nginx 설정
4. docker compose 구성 후 readiness/health 및 JWT·CORS·WSS 검증
5. 선택 컴포넌트와 운영 모니터링 추가

현재 본 저장소 변경은 **설계**이며 Docker Compose·Dockerfile·Kubernetes 매니페스트·실행 가능한 서비스 코드는 아직 없음.
