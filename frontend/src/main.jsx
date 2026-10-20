import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { Layout, RequireAuth } from './components/layout/Layouts';
import {
  Login,
  Register,
  EventList,
  EventDetail,
  UserHome,
  MyRegistrations,
  Seminar,
  Voting,
  AdminHome,
  AdminEvents,
  AdminSessions,
  Approvals,
  AdminPolls,
  Stats,
  NotFound,
} from './pages/Pages';
import './style.css';
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/events" replace />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="events" element={<EventList />} />
            <Route path="events/:eventId" element={<EventDetail />} />
            <Route element={<RequireAuth role="USER" />}>
              <Route path="user" element={<UserHome />} />
              <Route path="user/registrations" element={<MyRegistrations />} />
              <Route path="user/seminars" element={<Seminar />} />
              <Route path="user/voting" element={<Voting />} />
            </Route>
            <Route element={<RequireAuth role="ADMIN" />}>
              <Route path="admin" element={<AdminHome />} />
              <Route path="admin/events" element={<AdminEvents />} />
              <Route path="admin/sessions" element={<AdminSessions />} />
              <Route path="admin/approvals" element={<Approvals />} />
              <Route path="admin/polls" element={<AdminPolls />} />
              <Route path="admin/stats" element={<Stats />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
