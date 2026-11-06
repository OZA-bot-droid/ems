// 파일 기능: 투표 선택지의 추가·삭제·입력을 렌더링합니다.

import styles from './CreatePollModal.module.scss';
// 함수 역할: 투표 선택지 입력과 추가·삭제 UI를 표시합니다.
export default function PollChoiceFields({ options, updateOption, addOption, removeOption }) {
  return (
    <>
      <div className={styles.choicesHeading}>
        <strong>선택지 *</strong>
        <span>최소 2개 · 항목별 개별 수정 가능</span>
      </div>
      <div className={styles.choices}>
        {options.map((option, index) => (
          <div className={styles.choice} key={index}>
            <input
              aria-label={`선택지 ${index + 1}`}
              maxLength={255}
              required
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
              placeholder={`${index + 1}. 선택지를 입력하세요`}
            />
            <button
              type="button"
              aria-label={`선택지 ${index + 1} 삭제`}
              onClick={() => removeOption(index)}
              disabled={options.length <= 2}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button type="button" className={styles.addChoice} onClick={addOption}>
        ＋ 선택지 추가
      </button>
    </>
  );
}
