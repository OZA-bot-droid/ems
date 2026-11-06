// 파일 기능: 선택된 투표의 결과 데이터를 API로 조회합니다.

import { parseApiResponse } from '../../../api/requestJson.js';
import axios from 'axios';

// 특정 투표의 전체 결과 조회
export async function getPollResultsApi(pollId, { signal } = {}) {
  // 변수 역할: API에 전달할 로그인 액세스 토큰
  const accessToken = localStorage.getItem('accessToken');
  // 변수 역할: REST API 서버 기본 주소
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  const response = await fetch(
    `${API_BASE_URL}api/interactions/polls/${encodeURIComponent(pollId)}/results`,
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
