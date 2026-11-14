import { api } from '../../../api/axiosInstance.js';
import { unwrap } from '../../../api/apiError.js';

export const chatApi = {
  /**
   * 특정 세션의 최근 채팅 메시지 조회
   */
  getMessages: (sessionId) =>
    api.get(`/interactions/sessions/${sessionId}/chat/messages`).then(unwrap),

  // 신규: 현재 채팅 접속 현황 조회
  getPresence: (sessionId) => api.get(`/interactions/sessions/${sessionId}/presence`).then(unwrap),
};
