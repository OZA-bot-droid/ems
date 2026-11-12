import { api, publicApi } from '../../../api/axiosInstance';
import { tokenStore } from '../../../api/tokenStore';
import { unwrap } from '../../../api/apiError';
import { getClientId } from '../utils/getClientId';
const responseData = (response) => response?.data;
export const memberApi = {
  register: async (data) => responseData(await publicApi.post('/members/register', data)),
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
  emailSend: async (email) => responseData(await publicApi.post('/members/email/send', { email })),
  emailVerify: async (email, verificationCode) =>
    responseData(await publicApi.post('/members/email/verify', { email, code: verificationCode })),
  passwordResetRequest: async (email) =>
    responseData(await publicApi.post('/members/password/reset-request', { email })),
  passwordReset: async (token, newPassword) =>
    responseData(await publicApi.post('/members/password/reset', { token, newPassword })),
  passwordChange: async (currentPassword, newPassword) =>
    responseData(await api.post('/members/password/change', { currentPassword, newPassword })),
  updateMe: async (name) => responseData(await api.patch('/members/me', { name })),
  emailFound: async (name) => responseData(await publicApi.post('/members/email/found', { name })),
  nameDuplicateCheck: async (name) =>
    responseData(await publicApi.post('/members/name/duplicate', { name })),
};
