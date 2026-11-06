// 파일 기능: Event Service 연동 전 행사·세션의 데모 데이터를 제공합니다.

// Event Service 연동 전 사용하는 임시 행사/세션 데이터
export const DEMO_EVENTS = [
  {
    id: '100',
    name: '클라우드 개발 컨퍼런스',
    sessions: [
      { id: '101', name: 'Spring Boot와 MSA' },
      { id: '102', name: 'React와 프론트엔드' },
    ],
  },
  {
    id: '200',
    name: 'AI 서비스 개발 세미나',
    sessions: [{ id: '201', name: 'AI 서비스 개발' }],
  },
];
