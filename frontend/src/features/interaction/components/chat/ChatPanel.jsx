import { useEffect, useRef, useState } from 'react';
import { useSessionChat } from '../../hooks/chat/useSessionChat.js';
import { tokenStore } from '../../../../api/tokenStore.js';
import { useChatSessionInfo } from '../../hooks/chat/useChatSessionInfo.js';
import { useSessionPresence } from '../../hooks/chat/useSessionPresence.js';
import styles from '../../styles/Vote.module.scss';

/**
 * JWT에서 현재 로그인한 사용자 ID를 가져온다.
 *
 * 기존 StompAuthInterceptor는 JWT subject를
 * 사용자 ID로 사용하므로 동일한 값을 비교한다.
 */
function getMemberIdFromToken(token) {
  if (!token) return null;

  try {
    const payload = token.split('.')[1];

    if (!payload) return null;

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');

    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');

    const decoded = JSON.parse(atob(padded));

    return decoded.sub != null ? String(decoded.sub) : null;
  } catch {
    return null;
  }
}

/**
 * 채팅 메시지 생성 시각 표시
 */
function formatChatTime(value) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 실시간 세션 채팅 패널
 *
 * sessionId: 현재 선택한 투표의 세션 ID
 * socketRef: 기존 투표 WebSocket 연결
 * socketConnected: STOMP 연결 상태
 */
export default function ChatPanel({ poll, sessionId, socketRef, socketConnected }) {
  // 채팅 입력값
  const [content, setContent] = useState('');

  // 채팅 전송 오류
  const [sendError, setSendError] = useState('');

  // 현재 로그인한 사용자 ID
  const [myMemberId, setMyMemberId] = useState(() => getMemberIdFromToken(tokenStore.get()));

  // 채팅 메시지 스크롤 영역
  const chatMessagesRef = useRef(null);

  // 기존 채팅 Hook 연결
  const { messages, loading, error, sendMessage } = useSessionChat(
    sessionId,
    socketRef,
    socketConnected,
  );

  // 세션 선택 여부
  const hasSession = sessionId != null;

  // 채팅 메시지 전송 가능 여부
  const canSend =
    hasSession && socketConnected && content.trim().length > 0 && content.trim().length <= 1000;

  // 선택한 투표의 세션명, 관리자 ID 조회
  const { sessionName, adminId } = useChatSessionInfo(poll);

  // 채팅방 접속 인원 및 입장·퇴장 알림
  const { onlineCount, notices } = useSessionPresence(sessionId, socketRef, socketConnected);

  /**
   * 로그인 토큰이 갱신되면 사용자 ID도 갱신한다.
   */
  useEffect(() => {
    setMyMemberId(getMemberIdFromToken(tokenStore.get()));

    const unsubscribe = tokenStore.subscribe((token) => {
      setMyMemberId(getMemberIdFromToken(token));
    });

    return unsubscribe;
  }, []);

  /**
   * 세션 변경 시 입력값과 전송 오류 초기화
   */
  useEffect(() => {
    setContent('');
    setSendError('');
  }, [sessionId]);

  /* 채팅 메시지 또는 입장·퇴장 알림 수신 시 */
  useEffect(() => {
    const container = chatMessagesRef.current;

    if (!container) return;

    // 채팅창 내부 스크롤만 맨 아래로 이동
    container.scrollTop = container.scrollHeight;
  }, [messages, notices]);

  /**
   * 채팅 메시지 전송
   */
  function handleSubmit(event) {
    event.preventDefault();

    if (!canSend) return;

    try {
      sendMessage(content);

      setContent('');
      setSendError('');
    } catch (err) {
      setSendError(err?.message || '채팅 메시지 전송에 실패했습니다.');
    }
  }

  // 채팅 메시지와 입장·퇴장 알림에 등장한 사용자에게 번호 부여
  const participantNumbers = new Map();

  // 채팅 메시지 + 입장·퇴장 알림을 시간순으로 표시
  const timeline = [
    ...messages.map((message) => ({
      kind: 'message',
      id: `message-${message.id}`,
      occurredAt: message.createdAt,
      data: message,
    })),

    ...notices.map((notice) => ({
      kind: 'notice',
      id: `notice-${notice.id}`,
      occurredAt: notice.occurredAt,
      data: notice,
    })),
  ].sort((a, b) => {
    return new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime();
  });

  // messages.forEach((message) => {
  //   const memberKey = String(message.memberId);

  //   if (!participantNumbers.has(memberKey)) {
  //     participantNumbers.set(memberKey, participantNumbers.size + 1);
  //   }
  // });

  timeline.forEach((item) => {
    const memberId = item.data.memberId;

    if (memberId == null) return;

    const memberKey = String(memberId);

    // 관리자에게는 참가자 번호를 부여하지 않음
    if (adminId != null && memberKey === String(adminId)) {
      return;
    }

    if (!participantNumbers.has(memberKey)) {
      participantNumbers.set(memberKey, participantNumbers.size + 1);
    }
  });

  return (
    <section className={styles.chatCard}>
      {/* 채팅 헤더 */}
      <header className={styles.chatHeader}>
        <div>
          <h2 className={styles.chatTitle}>실시간 채팅</h2>

          <p className={styles.chatSubtitle}>
            {hasSession
              ? `${sessionName || `세션 ${sessionId}`} 채팅방`
              : '투표를 선택하면 채팅방이 표시됩니다.'}
          </p>
        </div>

        {/* 접속 인원 및 WebSocket 연결 상태 */}
        <div className={styles.chatHeaderActions}>
          {hasSession && socketConnected && (
            <span className={styles.chatOnlineCount}>
              {onlineCount == null ? '접속 인원 확인 중' : `접속 ${onlineCount}명`}
            </span>
          )}

          <span
            className={`${styles.chatStatus} ${
              !hasSession
                ? styles.chatStatusWaiting
                : socketConnected
                  ? styles.chatStatusConnected
                  : styles.chatStatusDisconnected
            }`}
          >
            {!hasSession ? '대기 중' : socketConnected ? '연결됨' : '연결 끊김'}
          </span>
        </div>
      </header>

      {/* 채팅 메시지 목록 */}
      <div
        ref={chatMessagesRef}
        className={styles.chatMessages}
        role="log"
        aria-label="실시간 채팅 메시지"
        aria-live="polite"
      >
        {!hasSession ? (
          <p className={styles.chatEmpty}>채팅할 세션을 선택해 주세요.</p>
        ) : loading ? (
          <p className={styles.chatEmpty}>채팅 기록을 불러오는 중입니다.</p>
        ) : messages.length === 0 && !error ? (
          <p className={styles.chatEmpty}>아직 등록된 채팅 메시지가 없습니다.</p>
        ) : null}

        {/* 채팅 기록 조회 오류 */}
        {error && (
          <p className={styles.chatError} role="alert">
            {error}
          </p>
        )}

        {/* 채팅 메시지 및 입장·퇴장 알림 */}
        {hasSession &&
          timeline.map((item) => {
            // 입장·퇴장 시스템 안내
            if (item.kind === 'notice') {
              const notice = item.data;

              const isMine = myMemberId != null && String(notice.memberId) === myMemberId;

              const isAdmin = adminId != null && String(notice.memberId) === adminId;

              // 참가자 번호 조회
              const participantNumber = participantNumbers.get(String(notice.memberId));

              // 본인 / 관리자 / 일반 참가자 구분
              const sender = isMine
                ? '내가'
                : isAdmin
                  ? '관리자'
                  : participantNumber != null
                    ? `참가자 ${participantNumber}`
                    : '참가자';

              return (
                <div key={item.id} className={styles.chatSystemNotice}>
                  {notice.type === 'JOIN'
                    ? `${sender}${isMine ? '' : '님이'} 입장했습니다.`
                    : `${sender}${isMine ? '' : '님이'} 퇴장했습니다.`}
                </div>
              );
            }

            // 기존 일반 채팅 메시지
            const message = item.data;

            const isMine =
              myMemberId != null &&
              message.memberId != null &&
              String(message.memberId) === myMemberId;

            const isAdmin =
              adminId != null && message.memberId != null && String(message.memberId) === adminId;

            return (
              <div
                key={item.id}
                className={`${styles.chatMessageRow} ${
                  isMine ? styles.chatMessageMine : styles.chatMessageOther
                } ${isAdmin ? styles.chatMessageAdmin : ''}`}
              >
                <div className={styles.chatMessageBubble}>
                  <div className={styles.chatMessageHeader}>
                    <span className={styles.chatSender}>
                      {isMine
                        ? '나'
                        : isAdmin
                          ? '관리자'
                          : `참가자 ${participantNumbers.get(String(message.memberId))}`}
                    </span>

                    <time className={styles.chatTime}>{formatChatTime(message.createdAt)}</time>
                  </div>

                  <p className={styles.chatMessageContent}>{message.content}</p>
                </div>
              </div>
            );
          })}
      </div>

      {/* 전송 오류 */}
      {sendError && (
        <p className={styles.chatError} role="alert">
          {sendError}
        </p>
      )}

      {/* 채팅 입력 영역 */}
      <form className={styles.chatInputArea} onSubmit={handleSubmit}>
        <input
          type="text"
          className={styles.chatInput}
          value={content}
          onChange={(event) => {
            setContent(event.target.value);
            setSendError('');
          }}
          maxLength={1000}
          placeholder={
            !hasSession
              ? '세션을 먼저 선택해 주세요.'
              : socketConnected
                ? '메시지를 입력하세요.'
                : '서버 연결을 확인하는 중입니다.'
          }
          aria-label="채팅 메시지"
          disabled={!hasSession || !socketConnected}
        />

        <button type="submit" className={styles.chatSendButton} disabled={!canSend}>
          전송
        </button>
      </form>
    </section>
  );
}
