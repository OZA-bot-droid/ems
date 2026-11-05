// 개발용 로그인 칸 (정식 로그인 화면이 develop에 들어오기 전까지 임시로 사용)
// - 로그인 안 함: 이메일·비밀번호 입력 → [로그인]  (테스트 계정 버튼으로 빠르게 채우기)
// - 로그인 함: "관리자1 · ADMIN · 회원 7번" + [로그아웃]
// 로그인하면 api.js가 토큰을 보관하고, 모든 요청에 Authorization: Bearer 토큰을 붙입니다.
import { useState, useSyncExternalStore } from 'react';
import { getCurrentUser, login, logout, subscribeAuth } from '../api.js';

// 로그인 상태가 바뀌면 이 hook을 쓰는 화면이 자동으로 다시 그려짐
export function useCurrentUser() {
  return useSyncExternalStore(subscribeAuth, getCurrentUser);
}

// Postman 컬렉션과 같은 테스트 계정 (비밀번호는 직접 입력)
const TEST_ACCOUNTS = [
  ['관리자1', 'admin1@test.com'],
  ['사용자1', 'user1@test.com'],
];

export default function DevLogin() {
  const user = useCurrentUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email.trim(), password);
      setPassword('');
    } catch (err) {
      setError(`${err.message} (${err.code})`);
    } finally {
      setBusy(false);
    }
  }

  if (user.id) {
    return (
      <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-(--ems-muted)">개발용 로그인</span>
        <span className="rounded-[6px] bg-(--ems-green-soft) px-2.5 py-1 font-semibold text-(--ems-green)">
          {user.email ?? '로그인됨'} · {user.role} · 회원 {user.id}번
        </span>
        <button
          type="button"
          onClick={logout}
          className="rounded-[6px] bg-(--ems-surface) px-2.5 py-1 font-semibold text-(--ems-ink) hover:text-(--ems-green)"
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mb-6 flex flex-wrap items-center gap-2 text-xs">
      <span className="text-(--ems-muted)">개발용 로그인</span>
      {TEST_ACCOUNTS.map(([label, value]) => (
        <button
          key={value}
          type="button"
          onClick={() => setEmail(value)}
          className={`rounded-[6px] px-2.5 py-1 font-semibold ${
            email === value ? 'bg-(--ems-ink) text-white' : 'bg-(--ems-surface) text-(--ems-ink)'
          }`}
        >
          {label}
        </button>
      ))}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="이메일"
        aria-label="이메일"
        required
        className="h-7 w-44 rounded-[6px] border border-(--ems-line) bg-(--ems-surface) px-2"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="비밀번호"
        aria-label="비밀번호"
        required
        className="h-7 w-32 rounded-[6px] border border-(--ems-line) bg-(--ems-surface) px-2"
      />
      <button
        type="submit"
        disabled={busy}
        className="h-7 rounded-[6px] bg-(--ems-green) px-3 font-semibold text-white disabled:bg-slate-300"
      >
        {busy ? '로그인 중…' : '로그인'}
      </button>
      {error && (
        <span className="w-full text-rose-600" role="alert">
          {error}
        </span>
      )}
    </form>
  );
}
