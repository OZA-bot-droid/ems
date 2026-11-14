// 투표 생성 입력값 검증. 정상일 때 null, 실패하면 사용자용 메시지 반환.
export function validatePollForm(form, sessions) {
  const session = sessions.find((s) => String(s.id) === String(form.sessionId));
  const start = new Date(form.startsAt);
  const end = new Date(form.endsAt);

  if (!session) return '유효한 행사 및 세션을 선택하세요.';
  if (!(end > start && start >= new Date(session.startsAt) && end <= new Date(session.endsAt))) {
    return '투표 일정은 세션 운영 시간 안에 있어야 합니다.';
  }
  if (form.options.some((o) => !o.trim()) || form.options.length < 2) {
    return '선택지 두 개 이상을 입력하세요.';
  }
  return null;
}

// 백엔드 DTO 규격: Long ID는 숫자, 시간은 UTC ISO-8601, 선택지는 {content}
export function toCreatePollRequest(form) {
  return {
    title: form.title.trim(),
    eventId: Number(form.eventId),
    sessionId: Number(form.sessionId),
    startsAt: new Date(form.startsAt).toISOString(),
    endsAt: new Date(form.endsAt).toISOString(),
    showLiveResults: form.showLiveResults,
    options: form.options.map((content) => ({ content: content.trim() })),
  };
}
