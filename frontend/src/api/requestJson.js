// 파일 기능: 공통 API 성공·오류 응답을 파싱합니다.

//응답 수신시 공통 파서
export async function parseApiResponse(response) {
  // 204는 응답 본문이 없음
  if (response.status === 204) {
    return null;
  }

  // 변수 역할: API 응답 본문
  const body = await response.json().catch(() => null);

  if (!response.ok || body?.success === false) {
    const error = new Error(body?.message || '요청 처리에 실패했습니다.');

    error.status = response.status;
    error.code = body?.code;

    throw error;
  }

  // 공통 성공 응답의 데이터 반환
  if (
    body?.success !== true ||
    body.status !== response.status ||
    !Object.prototype.hasOwnProperty.call(body, 'data')
  ) {
    throw new Error('API 성공 응답 형식이 올바르지 않습니다.');
  }

  return body.data;
}
