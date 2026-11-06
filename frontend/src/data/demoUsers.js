// 파일 기능: 로컬 테스트용 데모 사용자와 사용자 전환 함수를 정의합니다.

// 데모 전용 사용자 목록입니다. 실제 로그인/권한 인증을 대체하지 않습니다.
export const DEMO_USERLIST = [
  { id: 1, name: '관리자 1', email: 'admin1@test.com', role: 'ADMIN' },
  { id: 2, name: '관리자 2', email: 'admin2@test.com', role: 'ADMIN' },
  { id: 3, name: '사용자 1', email: 'user1@test.com', role: 'USER' },
  { id: 4, name: '사용자 2', email: 'user2@test.com', role: 'USER' },
];

export const SELECTED_DEMO_USER_KEY = 'ems-selected-demo-user-id';

// 함수 역할: 선택된 데모 사용자 정보를 읽습니다.
export function getSelectedDemoUser() {
  if (typeof window === 'undefined') return DEMO_USERLIST[0];
  try {
    const storedId = Number(window.localStorage.getItem(SELECTED_DEMO_USER_KEY));
    return DEMO_USERLIST.find((user) => user.id === storedId) ?? DEMO_USERLIST[0];
  } catch {
    return DEMO_USERLIST[0];
  }
}

// 함수 역할: 현재 데모 사용자 ID를 변경합니다.
export function setSelectedDemoUser(userId) {
  const user = DEMO_USERLIST.find((item) => item.id === Number(userId));
  if (!user) return false;
  try {
    window.localStorage.setItem(SELECTED_DEMO_USER_KEY, String(user.id));
    return true;
  } catch {
    return false;
  }
}

// 로컬 테스트 요청에만 사용합니다. 서버는 이 헤더를 신뢰해 권한을 부여해서는 안 됩니다.
export function getDemoUserHeaders() {
  const user = getSelectedDemoUser();
  return {
    'X-Member-Id': String(user.id),
    'X-User-Role': user.role,
  };
}
