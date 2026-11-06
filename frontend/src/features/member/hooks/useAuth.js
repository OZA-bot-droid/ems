import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
export function useAuth() { const ctx = useContext(AuthContext); if (!ctx) throw new Error('AuthProvider 안에서 사용하세요.'); return ctx; }
