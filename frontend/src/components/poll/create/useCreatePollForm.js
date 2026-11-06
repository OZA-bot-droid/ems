// 파일 기능: 투표 생성 폼 상태·유효성 검사·등록을 관리합니다.

import { useState } from 'react';
//==========데모 데이터=============
import { DEMO_EVENTS } from '../../../data/demoEventSessions.js';

// 투표 생성 연동
import { createPollApi } from './createPollApi.js';

// 실제 서버 연동 시 동일 규칙을 백엔드에서도 검증해야 합니다.
function validateCreatePoll(form, event, now = Date.now()) {
  if (!event || !event.sessions.some((session) => session.id === form.sessionId))
    return '행사와 세션을 선택해 주세요.';
  if (!form.title.trim() || form.title.trim().length > 255)
    return '투표 질문을 1~255자로 입력해 주세요.';
  if (
    form.options.length < 2 ||
    form.options.some((item) => !item.trim() || item.trim().length > 255)
  )
    return '내용이 있는 선택지를 최소 2개 입력해 주세요. (각 255자 이내)';
  const start = new Date(form.startsAt).getTime(),
    end = new Date(form.endsAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start)
    return '시작·종료 일시를 확인해 주세요. 종료 시각은 시작보다 늦어야 합니다.';
  if (start <= now) return '데모 투표 시작 일시는 현재보다 미래로 설정해 주세요.';
  return '';
}

// 저장/목록 표시용 모델 변환 (datetime-local -> UTC ISO)
function buildDemoPoll(form, event) {
  return {
    id: `demo-created-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    eventId: Number(form.eventId),
    eventName: event.name,
    sessionId: Number(form.sessionId),
    title: form.title.trim(),
    status: 'SCHEDULED',
    startsAt: new Date(form.startsAt).toISOString(),
    endsAt: new Date(form.endsAt).toISOString(),
    showLiveResults: form.showLiveResults,
    options: form.options.map((content, index) => ({
      id: index + 1,
      content: content.trim(),
      seed: 0,
    })),
  };
}

// 함수 역할: 투표 생성 폼의 기본값을 제공합니다.
const initialForm = () => ({
  eventId: '',
  sessionId: '',
  title: '',
  options: ['React / 프론트엔드', 'Spring Cloud / MSA', 'DevOps / Cloud Native', 'AI 서비스 활용'],
  startsAt: '',
  endsAt: '',
  showLiveResults: true,
});
// 함수 역할: 투표 생성 필드 변경과 제출·오류 상태를 관리합니다.
export function useCreatePollForm(onCreate, onClose) {
  // 투표 생성 연동
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 변수 역할: 투표 생성 폼의 입력 데이터
  const [form, setForm] = useState(initialForm);
  // 변수 역할: 폼 또는 API 처리 중 발생한 오류
  const [error, setError] = useState('');
  const event = DEMO_EVENTS.find((item) => item.id === form.eventId);
  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  };
  const selectEvent = (eventId) => {
    setForm((prev) => ({ ...prev, eventId, sessionId: '' }));
    setError('');
  };
  const updateOption = (index, value) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((item, i) => (i === index ? value : item)),
    }));
    setError('');
  };
  const addOption = () => update('options', [...form.options, '']);
  const removeOption = (index) => {
    if (form.options.length > 2)
      update(
        'options',
        form.options.filter((_, i) => i !== index),
      );
  };

  const submit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    const message = validateCreatePoll(form, event);

    if (message) {
      setError(message);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Spring Boot PollController 호출
      const createdPoll = await createPollApi(form);

      // 서버에서 생성된 투표를 프론트 목록에 추가
      onCreate(createdPoll);

      // 정상 생성 후 모달 닫기
      onClose();
    } catch (error) {
      console.error('투표 생성 오류:', error);
      setError(error.message || '투표 생성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    event,
    error,
    isSubmitting,
    update,
    selectEvent,
    updateOption,
    addOption,
    removeOption,
    submit,
  };
}
