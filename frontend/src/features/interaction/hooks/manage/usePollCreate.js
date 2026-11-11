import { useEffect, useState } from 'react';
import { eventApi } from '../../../event/api/eventApi.js';
import { pollApi } from '../../api/pollApi.js';
import { validatePollForm, toCreatePollRequest } from '../../utils/pollValidation.js';

// 관리자 행사/세션 선택, Poll 생성 폼 상태, 생성 REST 요청
export function usePollCreate(eventFilter, sessionFilter, onCreated, mutationLock) {
  const [form, setForm] = useState({
    eventId: eventFilter,
    sessionId: sessionFilter,
    title: '',
    startsAt: '',
    endsAt: '',
    showLiveResults: true,
    options: ['', ''],
  });
  const [events, setEvents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const update = (key, value) => setForm((s) => ({ ...s, [key]: value }));

  useEffect(() => {
    setForm((s) => ({ ...s, eventId: eventFilter, sessionId: sessionFilter }));
  }, [eventFilter, sessionFilter]);

  useEffect(() => {
    let ok = true;
    eventApi
      .mine({ page: 0, size: 100 })
      .then((d) => {
        if (ok) setEvents(d.content || []);
      })
      .catch((e) => {
        if (ok) setError(e.message);
      });
    return () => {
      ok = false;
    };
  }, []);

  useEffect(() => {
    if (!form.eventId) {
      setSessions([]);
      return;
    }
    let ok = true;
    eventApi
      .manageSessions(form.eventId)
      .then((s) => {
        if (ok) setSessions(s);
      })
      .catch((e) => {
        if (ok) setError(e.message);
      });
    return () => {
      ok = false;
    };
  }, [form.eventId]);

  async function create(e) {
    e.preventDefault();
    if (mutationLock.current) return;

    const validationError = validatePollForm(form, sessions);
    if (validationError) {
      setError(validationError);
      return;
    }

    mutationLock.current = true;
    setBusy(true);
    setError('');
    try {
      await pollApi.create(toCreatePollRequest(form));
      setOpen(false);
      await onCreated();
    } catch (e) {
      setError(e.message);
    } finally {
      mutationLock.current = false;
      setBusy(false);
    }
  }

  return { form, setForm, update, events, sessions, open, setOpen, busy, error, create };
}
