import React from 'react';
import { mapClassNames } from '../../../styles/classNames.js';
import module0 from '../../../styles/member.module.scss';

const cx = (value) => mapClassNames(value, module0);
const PasswordInput = ({
  id,
  value = '',
  onChange = '',
  placeholder = '',
  className = '',
  autoComplete = 'current-password',
  required,
  name,
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  return (
    <div className={cx('relative w-full')}>
      <input
        id={id}
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={cx(`${className} pr-14`)}
        required={required}
        name={name}
      />
      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
        aria-pressed={showPassword}
        className={cx(
          'absolute right-3 top-1/2 -translate-y-1/2 flex h-8 items-center justify-center rounded-md px-2 text-xs font-medium text-[#7a879a] hover:bg-[#f1f4f8] hover:text-[#142238]',
        )}
      >
        {showPassword ? '숨김' : '보기'}
      </button>
    </div>
  );
};

export default PasswordInput;
