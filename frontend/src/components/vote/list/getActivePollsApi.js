// 파일 기능: 승인된 세션에 속한 활성 투표를 API로 조회합니다.

import { parseApiResponse } from '../../../api/requestJson.js';
import axios from 'axios';

// 승인된 세션에 속한 ACTIVE 투표를 서버에서 가져옵니다.
export async function getActivePollsApi({ signal } = {}) {
  // 변수 역할: API에 전달할 로그인 액세스 토큰
  const accessToken = localStorage.getItem('accessToken');
  // 변수 역할: REST API 서버 기본 주소
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  const response = await fetch(`${API_BASE_URL}api/interactions/polls/getpolls`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    signal,
  });

  // 변수 역할: 조회된 활성 투표 목록
  const polls = await parseApiResponse(response);

  if (!Array.isArray(polls)) {
    throw new Error('투표 목록 응답 형식이 올바르지 않습니다.');
  }
  return polls;
}
