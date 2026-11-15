import { api } from '../../../api/axiosInstance.js';
import { unwrap } from '../../../api/apiError.js';

export const chatApi = {
  /**
   * 특정 세션의 최근 채팅 메시지 조회
   */
  getMessages: (sessionId) =>
    api.get(`/interactions/sessions/${sessionId}/chat/messages`).then(unwrap),
};
