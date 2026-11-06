// 파일 기능: 관리자 투표 목록 페이지 조회 및 상태 변경 API를 제공합니다.

import { parseApiResponse } from '../../api/requestJson.js';
import axios from 'axios';

// 관리자가 생성한 투표 목록 페이지 조회
export async function getMyCreatedPolls(page = 0, size = 10) {
  // 변수 역할: API 인증 헤더에 사용할 액세스 토큰
  const accessToken = localStorage.getItem('accessToken');
  // 변수 역할: REST API 요청에 사용하는 기본 URL
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // 변수 역할: 페이지 번호와 크기 쿼리 파라미터
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  const response = await fetch(`${API_BASE_URL}api/interactions/polls/mycreated?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const result = await parseApiResponse(response);

  if (
    !result ||
    !Array.isArray(result.content) ||
    !Number.isInteger(result.page) ||
    !Number.isInteger(result.totalPages)
  ) {
    throw new Error('투표 페이지 응답 형식이 올바르지 않습니다.');
  }

  return result;
}

// 함수 역할: 투표 활성화 또는 종료 PATCH 요청을 전송합니다.
export async function updatePollStatus(pollId, action) {
  // 변수 역할: API 인증 헤더에 사용할 액세스 토큰
  const accessToken = localStorage.getItem('accessToken');
  // 변수 역할: REST API 요청에 사용하는 기본 URL
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  if (action !== 'activate' && action !== 'close') {
    throw new Error('지원하지 않는 투표 상태 변경입니다.');
  }

  const response = await fetch(
    `${API_BASE_URL}api/interactions/polls/${encodeURIComponent(pollId)}/${action}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return parseApiResponse(response);
}
