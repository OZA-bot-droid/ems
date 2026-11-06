// 파일 기능: 사용자가 선택한 항목을 투표 API로 제출합니다.

import { parseApiResponse } from '../../../api/requestJson.js';

// 실제 투표 참여 저장: PollVoteController POST /polls/{pollId}/votes
export async function submitPollVoteApi(pollId, pollOptionId) {
  // 변수 역할: API에 전달할 로그인 액세스 토큰
  const accessToken = localStorage.getItem('accessToken');
  // 변수 역할: REST API 서버 기본 주소
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  const response = await fetch(
    `${API_BASE_URL}api/interactions/polls/${encodeURIComponent(pollId)}/votes`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ pollOptionId }),
    },
  );

  return parseApiResponse(response);
}
