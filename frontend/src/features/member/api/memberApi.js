import { api, publicApi } from '../../../api/axiosInstance';
import { tokenStore } from '../../../api/tokenStore';
import { unwrap } from '../../../api/apiError';
import { getClientId } from '../utils/getClientId';
export const memberApi = {
  register: async (data) => unwrap(await publicApi.post('/members/register', data)),
  login: async ({ email, password }) => {
    const response = await publicApi.post('/members/login', {
      email,
      password,
      clientId: getClientId(),
    });
    const token = unwrap(response)?.accessToken;
    if (!token) throw new Error('로그인 응답에 Access Token이 없습니다.');
    tokenStore.set(token);
    return token;
  },
  exchange: async (code) => {
    const response = await publicApi.post('/members/oauth2/exchange', null, { params: { code } });
    const token = unwrap(response)?.accessToken;
    if (!token) throw new Error('소셜 로그인 응답에 Access Token이 없습니다.');
    tokenStore.set(token);
    return token;
  },
  me: async () => unwrap(await api.get('/members/me')),
  logout: async () => {
    try {
      return unwrap(
        await publicApi.delete('/members/logout', {
          data: { clientId: getClientId() },
          skipAuthRefresh: true,
        }),
      );
    } finally {
      tokenStore.clear();
    }
  },
  emailSend: async (email) => unwrap(await publicApi.post('/members/email/send', { email })),
  emailVerify: async (data) =>
    unwrap(await publicApi.post('/members/email/verify', data)),
};
