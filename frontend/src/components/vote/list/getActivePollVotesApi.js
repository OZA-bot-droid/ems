// 파일 기능: 사용자가 기존에 제출한 투표 기록을 조회합니다.

import { parseApiResponse } from '../../../api/requestJson.js';

// 현재 사용자가 이미 참여한 투표 기록 조회
export async function getActivePollVotesApi(pollIds, { signal } = {}) {
  // 변수 역할: API 인증에 사용할 액세스 토큰
  const accessToken = localStorage.getItem('accessToken');
  // 변수 역할: REST API 서버 주소
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // 조회할 투표 ID가 없는 경우
  if (pollIds.length === 0) {
    return [];
  }

  // URL 파라미터 생성
  const params = new URLSearchParams();

  pollIds.forEach((id) => {
    params.append('pollIds', String(id));
  });

  // 백엔드 API 호출
  const response = await fetch(
    `${API_BASE_URL}api/interactions/polls/getactivevotes?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      signal,
    },
  );

  return parseApiResponse(response);
}
