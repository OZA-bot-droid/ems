// 파일 기능: 투표 화면 테스트에 쓰이는 데모 투표 정보를 제공합니다.

// 임시 데이터: API 연결 전 개발 및 화면 검증 전용입니다.
export const DEMO_USER = 'demo-user-101';
export const STORAGE_KEY = 'ems-user08-votes-demo-v1';
export const DEMO_POLLS = [
  {
    id: 'seminar-08',
    eventName: 'EMS 기술 세미나 (예시)',
    title: '이번 세미나에서 가장 기대되는 주제는?',
    status: 'ACTIVE',
    options: [
      { id: 1, content: 'React / 프론트엔드', seed: 8 },
      { id: 2, content: 'Spring Cloud / MSA', seed: 14 },
      { id: 3, content: 'DevOps / Cloud Native', seed: 6 },
      { id: 4, content: 'AI 서비스 활용', seed: 10 },
    ],
  },
  {
    id: 'network-01',
    eventName: '개발자 네트워킹 데이 (예시)',
    title: '가장 관심 있는 개발 분야는?',
    status: 'ACTIVE',
    options: [
      { id: 1, content: '백엔드 개발', seed: 12 },
      { id: 2, content: '프론트엔드 개발', seed: 8 },
      { id: 3, content: '클라우드 / 인프라', seed: 7 },
      { id: 4, content: '데이터 / AI', seed: 9 },
    ],
  },
];
