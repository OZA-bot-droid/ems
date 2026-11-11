// 기존 VotePage의 데이터 조회·선택 상태·투표 제출·결과 조회 로직을 이동했다.
// React Hooks: 상태 관리(useState), 변경 감지(useEffect), 함수 참조 유지(useCallback), 렌더링과 무관한 값 보관(useRef).
import { useCallback, useEffect, useRef, useState } from 'react';
// Interaction Service REST API: 투표 목록, 사용자 투표 내역, 투표 제출 및 결과 조회를 담당한다.
import { pollApi } from '../../api/pollApi.js';
import { useVoteRealtime } from './useVoteRealtime.js';

/**
 * 투표 목록과 내 투표 내역, 선택지, 결과를 관리한다.
 * WebSocket 구독과 10초 보정 조회는 useVoteRealtime에 위임한다.
 */
export function useVotePage() {
  // polls: 현재 참여 가능한 투표 목록.
  const [polls, setPolls] = useState([]);
  // votes: 로그인 사용자가 이미 제출한 투표 내역(중복 제출 UI 차단에 사용).
  const [votes, setVotes] = useState([]);
  // selectedId: 현재 화면에 선택된 투표 ID.
  const [selectedId, setSelectedId] = useState(null);
  // optionId: 사용자가 라디오 버튼에서 고른 선택지 ID.
  const [optionId, setOptionId] = useState(null);
  // results: 서버에서 조회한 선택지별 득표수와 전체 투표수.
  const [results, setResults] = useState(null);
  // error: REST/WebSocket 처리 중 표시할 오류 메시지.
  const [error, setError] = useState('');
  // notice: 투표 제출 성공 등 사용자 안내 메시지.
  const [notice, setNotice] = useState('');
  // busy: 제출·결과 조회 중 중복 요청을 막기 위한 처리 상태.
  const [busy, setBusy] = useState(false);
  // pollIdRef: 현재 선택 투표 ID를 비동기 WebSocket 콜백에서도 최신 값으로 참조한다.
  const pollIdRef = useRef(null);
  // resultsVisible: 사용자가 결과 보기를 요청했는지 저장해 불필요한 결과 재조회를 방지한다.
  const resultsVisible = useRef(false);

  // load(): 참여 가능 투표와 내 투표 내역을 조회하고, 선택 투표가 사라졌다면 첫 투표로 변경한다.
  const load = useCallback(async () => {
    try {
      const list = await pollApi.active();
      setPolls(list);
      // 이전 선택 ID가 목록에 남아 있으면 유지하고, 없으면 첫 항목을 자동 선택한다.
      setSelectedId((id) =>
        list.some((p) => String(p.id) === String(id)) ? id : (list[0]?.id ?? null),
      );
      // 목록에 표시되는 투표 ID로 사용자 투표 내역을 조회한다.
      setVotes(await pollApi.activeVotes(list.map((p) => p.id)));
      setError('');
    } catch (err) {
      setError(err.message || '투표 목록 조회에 실패했습니다.');
    }
  }, []);

  // 선택 투표 변경 시 이전 선택지·결과·알림을 초기화하고 관련 ref를 갱신한다.
  useEffect(() => {
    pollIdRef.current = selectedId;
    resultsVisible.current = false;
    setOptionId(null);
    setResults(null);
    setNotice('');
  }, [selectedId]);

  // refreshResults(id): 현재 선택된 투표의 결과 화면이 열린 경우에만 REST 결과를 갱신한다.
  const refreshResults = useCallback(async (id) => {
    // 다른 투표의 지연된 이벤트나 결과 미노출 상태에서는 서버 조회를 생략한다.
    if (!id || !resultsVisible.current || String(pollIdRef.current) !== String(id)) return;
    try {
      setResults(await pollApi.results(id));
    } catch (err) {
      setError(err.message || '결과 조회에 실패했습니다.');
    }
  }, []);

  // 기존 VotePage의 WebSocket 생명주기 및 Topic 구독을 별도 Hook으로 이동한다.
  const { socketConnected } = useVoteRealtime({
    selectedId,
    load,
    refreshResults,
    pollIdRef,
    resultsVisible,
    setError,
  });

  // poll: 현재 선택된 ID에 해당하는 투표 객체(없으면 undefined).
  const poll = polls.find((p) => String(p.id) === String(selectedId));
  // submitted: 사용자가 이 투표에 이미 제출한 선택지 ID(없으면 undefined).
  const submitted = votes.find((v) => String(v.pollId) === String(poll?.id))?.pollOptionId;
  // canViewResults: 실시간 결과 공개 투표이거나 종료된 투표일 때만 결과 버튼을 허용한다.
  const canViewResults = poll && (poll.showLiveResults || poll.status === 'CLOSED');

  // submit(): 선택지 투표를 서버에 제출한 뒤 내 투표 내역과 성공 메시지를 갱신한다.
  async function submit() {
    // 선택 누락, 중복 제출, 처리 중 재요청을 방지한다(최종 중복 방지는 서버에서 수행).
    if (!poll || !optionId || busy || submitted) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      // REST API로 pollOptionId를 전달해 실제 투표를 생성한다.
      await pollApi.vote(poll.id, { pollOptionId: Number(optionId) });
      // 성공한 투표 내역을 로컬 상태에 반영해 제출 버튼을 즉시 비활성화한다.
      setVotes((current) => [
        ...current.filter((v) => String(v.pollId) !== String(poll.id)),
        { pollId: poll.id, pollOptionId: Number(optionId) },
      ]);
      setNotice('투표가 제출되었습니다.');
      // 결과 화면이 이미 열려 있는 경우에만 최신 결과를 재조회한다.
      await refreshResults(poll.id);
    } catch (err) {
      setError(err.message || '투표 제출에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }
  // showResults(): 서버의 공개 조건을 만족하는 투표 결과를 조회해 결과 영역을 연다.
  async function showResults() {
    if (!poll || !canViewResults || busy) return;
    setBusy(true);
    setError('');
    try {
      // 결과 공개 권한은 화면 조건과 별개로 서버에서도 검증되어야 한다.
      const data = await pollApi.results(poll.id);
      // 성공한 결과 조회를 현재 선택 투표와 연결하여 이후 실시간 갱신을 허용한다.
      pollIdRef.current = poll.id;
      resultsVisible.current = true;
      setResults(data);
    } catch (err) {
      setError(err.message || '투표 결과를 확인할 수 없습니다.');
    } finally {
      setBusy(false);
    }
  }

  // 화면 컴포넌트가 필요로 하는 기존 상태와 이벤트 핸들러를 노출한다.
  return {
    polls,
    votes,
    selectedId,
    setSelectedId,
    optionId,
    setOptionId,
    results,
    error,
    notice,
    busy,
    socketConnected,
    poll,
    submitted,
    canViewResults,
    submit,
    showResults,
  };
}
