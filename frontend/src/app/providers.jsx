import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '../features/member/context/AuthContext';
import { router } from './router';
export function AppProviders() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
