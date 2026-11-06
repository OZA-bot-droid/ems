// 파일 기능: 투표 생성 모달의 입력 UI와 제출 동작을 구성합니다.

import { useCallback } from 'react';
import { useCreatePollForm } from './useCreatePollForm.js';
import { useCreatePollDialog } from './useCreatePollDialog.js';
import PollEventSessionFields from './PollEventSessionFields.jsx';
import PollChoiceFields from './PollChoiceFields.jsx';
import PollScheduleFields from './PollScheduleFields.jsx';
import styles from './CreatePollModal.module.scss';

// UI 조합만 담당.
export default function CreatePollModal({ onClose, onCreate }) {
  const close = useCallback(() => onClose(), [onClose]);

  const {
    form,
    event,
    error,
    isSubmitting,
    update,
    selectEvent,
    updateOption,
    addOption,
    removeOption,
    submit,
  } = useCreatePollForm(onCreate, close);

  const { dialogRef, closeRef } = useCreatePollDialog(close);
  return (
    <div
      className={styles.backdrop}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <section
        className={styles.modal}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-poll-heading"
        aria-describedby="create-poll-description"
      >
        <header className={styles.header}>
          <div>
            <h2 id="create-poll-heading">새 투표 만들기</h2>
            <p id="create-poll-description">세션 참가자에게 공개할 투표를 설정합니다.</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            className={styles.close}
            onClick={close}
            aria-label="모달 닫기"
          >
            ×
          </button>
        </header>
        <form onSubmit={submit} className={styles.form}>
          <PollEventSessionFields
            form={form}
            event={event}
            selectEvent={selectEvent}
            update={update}
          />
          <label className={styles.field}>
            투표 질문 *
            <input
              required
              maxLength={255}
              value={form.title}
              placeholder="예: 가장 기대되는 기술 주제는?"
              onChange={(e) => update('title', e.target.value)}
            />
          </label>
          <PollChoiceFields
            options={form.options}
            updateOption={updateOption}
            addOption={addOption}
            removeOption={removeOption}
          />
          <PollScheduleFields form={form} update={update} />
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          <footer className={styles.footer}>
            <div className={styles.footerButtons}>
              <button type="button" className={styles.cancel} onClick={close}>
                취소
              </button>
              {/* 데모용 */}
              {/* <button type="submit" className={styles.create}>
                투표 만들기
              </button> */}
              <button type="submit" className={styles.create} disabled={isSubmitting}>
                {isSubmitting ? '생성 중...' : '투표 만들기'}
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  );
}
