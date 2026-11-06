// 파일 기능: 투표 생성 API 요청과 응답 처리를 담당합니다.

import { parseApiResponse } from '../../../api/requestJson.js';
import axios from 'axios';

// 함수 역할: 투표 생성 데이터를 API 요청 형식으로 보내고 결과를 반환합니다.
export async function createPollApi(form) {
  // 변수 역할: API 인증에 사용할 액세스 토큰
  const accessToken = localStorage.getItem('accessToken');
  // 변수 역할: REST API 서버 주소
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  const body = {
    title: form.title.trim(),
    eventId: Number(form.eventId),
    sessionId: Number(form.sessionId),
    startsAt: new Date(form.startsAt).toISOString(),
    endsAt: new Date(form.endsAt).toISOString(),
    showLiveResults: form.showLiveResults,
    options: form.options.map((content) => ({
      content: content.trim(),
    })),
  };

  const response = await fetch(`${API_BASE_URL}api/interactions/polls`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  return parseApiResponse(response);
}
