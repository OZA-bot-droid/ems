import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useNavigate } from 'react-router-dom';
import { memberApi } from '../api/memberApi.js';
import Header from '../../../components/layout/LegacyHeader.jsx';
import Button from '../../../components/ui/Button.jsx';
import Modal from '../../../components/ui/Modal.jsx';

const MyPage = () => {
  const { role, authLoading, accessToken } = useAuth();
  const navigate = useNavigate();
  const [member, setMember] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  const [open, setOpen] = useState(false);

  // 삭제 버튼을 누르면 Modal 표시
  const handleOpen = () => setOpen(true);

  // 취소하거나 닫기 버튼을 누르면 Modal 숨김
  const handleClose = () => setOpen(false);

  const handleDelete = async () => {
    // TODO: eventApi.delete(eventId) 연결
    console.log('행사 삭제 요청');

    // 삭제 완료 후 모달 닫기
    handleClose();
  };

  useEffect(() => {
    // 재발급이 완료되기 전까지 대기
    if (authLoading || !accessToken) {
      return;
    }

    const myInfo = async () => {
      try {
        const res = await memberApi.me();

        console.log(res);
        setMember((m) => ({ ...m, ...res }));
      } catch (err) {
        console.error(err);
        alert(err.message || '회원 정보를 불러오지 못했습니다.');
      }
    };
    myInfo();
  }, [authLoading, accessToken]);

  const updateName = async () => {
    const name = newName.trim();

    if (!name || name.length > 50 || saving) return;

    setSaving(true);

    try {
      const res = await memberApi.updateMe(name);

      console.log(res);
      if (res.status >= 200 && res.status < 300) {
        setMember((prev) => ({
          ...prev,
          ...res.data,
        }));
        setIsEditing(false);
      } else {
        alert('닉네임 수정에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-ems-background">
      <div className="min-h-screen w-full bg-ems-background lg:flex">
        <Header role={role} activePage="events" />

        {/* My Page 영역 */}
        {/* 사이드바를 제외한 나머지 영역을 모두 사용 */}
        <section className="min-w-0 flex-1 px-6 py-10 sm:px-10 lg:px-12 lg:py-[65px] flex justify-center">
          <div className="w-full min-w-0">
            <div className="mb-8">
              <h2 className="text-[28px] font-bold text-ems-text">마이페이지</h2>
              <p className="mt-3 text-[13px] text-ems-muted">내 정보와 활동 내역을 확인하세요.</p>
            </div>

            {/* Member Service */}
            <section className="rounded-[14px] border border-ems-member-input-border bg-white p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[17px] font-bold text-ems-text">내 프로필</h3>
                <span className="rounded-full bg-ems-member-primary-soft px-3 py-1 text-[11px] font-semibold text-ems-primary">
                  {member.role}
                </span>
              </div>
              <p className="mt-2 text-[12px] text-ems-muted">기본 회원 정보</p>

              <div className="mt-5 space-y-4 border-t border-ems-member-input-border pt-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[12px] text-ems-muted">닉네임</p>

                    {isEditing ? (
                      <input
                        type="text"
                        value={newName}
                        maxLength={50}
                        onChange={(e) => setNewName(e.target.value)}
                        // P2: focus 색상만 디자인 토큰으로 변경
                        // 기존 높이, 테두리 및 여백 유지
                        className={
                          'mt-1 h-9 rounded-lg border ' +
                          'border-ems-member-divider px-3 text-[13px] ' +
                          'outline-none focus:border-ems-primary'
                        }
                      />
                    ) : (
                      <p className="mt-1 text-[14px] font-medium text-ems-text">{member.name}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={updateName}
                          disabled={saving || !newName.trim()}
                          className="rounded-[10px] bg-ems-primary px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          {saving ? '저장 중...' : '저장'}
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          disabled={saving}
                          className="rounded-[10px] border border-ems-member-divider px-3 py-2 text-xs font-semibold text-ems-text"
                        >
                          취소
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setNewName(member.name ?? '');
                          setIsEditing(true);
                        }}
                        className="rounded-[10px] border border-ems-member-divider px-3 py-2 text-xs font-semibold text-ems-text hover:bg-ems-background"
                      >
                        정보 수정
                      </button>
                    )}
                    {member.status && (
                      <button
                        type="button"
                        onClick={() => navigate('/password/change')}
                        className="rounded-[10px] bg-ems-primary px-3 py-2 text-xs font-semibold text-white hover:bg-ems-member-primary-hover"
                      >
                        비밀번호 변경
                      </button>
                    )}
                    {/* <Button></Button>
                    <>
                      <Button type="button" onClick={handleOpen}>
                        행사 삭제
                      </Button>

                      <Modal open={open} title="행사 삭제 확인" onClose={handleClose}>
                        <p>정말 이 행사를 삭제하시겠습니까?</p>
                        <p>삭제한 행사는 복구할 수 없습니다.</p>

                        <div className="modal-actions">
                          <Button type="button" onClick={handleClose}>
                            취소
                          </Button>

                          <Button type="button" onClick={handleDelete}>
                            삭제
                          </Button>
                        </div>
                      </Modal>
                    </> */}
                  </div>
                </div>

                <div>
                  <p className="text-[12px] text-ems-muted">이메일</p>
                  <p className="mt-1 text-[14px] font-medium text-ems-text">{member.email}</p>
                </div>
              </div>
            </section>

            {/* 다른 서비스가 사용할 공간 */}
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {/* Event Service */}
              <section className="rounded-[14px] border border-ems-member-input-border bg-white p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-ems-member-primary-soft">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5 text-ems-primary"
                      aria-hidden="true"
                    >
                      <rect x="3" y="5" width="18" height="16" rx="2" />
                      <path d="M7 3v4M17 3v4M3 10h18" />
                    </svg>
                  </div>

                  <div>
                    <h3 className="text-[15px] font-bold text-ems-text">나의 행사</h3>
                    <p className="mt-1 text-[11px] text-ems-muted">Event Service</p>
                  </div>
                </div>

                <div className="mt-5 flex min-h-[120px] items-center justify-center rounded-[10px] border border-dashed border-ems-member-divider bg-ems-background p-4">
                  <p className="text-center text-[12px] leading-6 text-ems-muted">
                    행사 신청 및 주최 행사
                    <br />
                    연동 예정
                  </p>
                </div>
              </section>

              {/* Interaction Service */}
              <section className="rounded-[14px] border border-ems-member-input-border bg-white p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-ems-member-primary-soft">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5 text-ems-primary"
                      aria-hidden="true"
                    >
                      <path d="M5 20V11M10 20V5M15 20v-8M20 20V8" />
                    </svg>
                  </div>

                  <div>
                    <h3 className="text-[15px] font-bold text-ems-text">나의 참여 활동</h3>
                    <p className="mt-1 text-[11px] text-ems-muted">Interaction Service</p>
                  </div>
                </div>

                <div className="mt-5 flex min-h-[120px] items-center justify-center rounded-[10px] border border-dashed border-ems-member-divider bg-ems-background p-4">
                  <p className="text-center text-[12px] leading-6 text-ems-muted">
                    투표 및 참여 내역
                    <br />
                    연동 예정
                  </p>
                </div>
              </section>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default MyPage;
