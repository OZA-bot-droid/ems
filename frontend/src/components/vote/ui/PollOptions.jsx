// 파일 기능: 사용자가 선택할 투표 선택지를 렌더링합니다.

import styles from './PollOptions.module.scss';

// 함수 역할: 투표 선택지의 선택·비활성화 UI를 표시합니다.
export default function PollOptions({ options, selected, onSelect, disabled }) {
  return (
    <fieldset className={styles.options} disabled={disabled}>
      <legend className="sr-only">투표 선택지</legend>
      {options.map((option) => (
        <label key={option.id} className={`${styles.option} ${selected === option.id ? styles.selected : ''}`}>
          <input type="radio" name="seminar-topic" value={option.id}
            checked={selected === option.id} onChange={() => onSelect(option.id)} />
          <span>{option.content}</span>
        </label>
      ))}
    </fieldset>
  );
}
