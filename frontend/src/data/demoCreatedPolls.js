// 파일 기능: 로컬 데모 생성 투표를 저장하고 읽어옵니다.

// 데모 투표 저장용 localStorage. 실서비스 API 연결 전까지 사용합니다.
export const CREATED_POLLS_KEY = 'ems-user08-created-polls-v1';
// 함수 역할: 로컬 저장소에서 데모 생성 투표를 읽습니다.
export function readCreatedPolls() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CREATED_POLLS_KEY) || '[]');
    return Array.isArray(parsed)
      ? parsed.filter(
          (item) =>
            item &&
            typeof item.id === 'string' &&
            typeof item.title === 'string' &&
            Array.isArray(item.options) &&
            item.options.length >= 2,
        )
      : [];
  } catch {
    return [];
  }
}
// 함수 역할: 데모 투표를 로컬 저장소에 저장합니다.
export function saveCreatedPolls(polls) {
  try {
    localStorage.setItem(CREATED_POLLS_KEY, JSON.stringify(polls));
    return true;
  } catch {
    return false;
  }
}
