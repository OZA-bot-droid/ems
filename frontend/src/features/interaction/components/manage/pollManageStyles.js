/**
 * Interaction 투표 관리 화면 스타일
 *
 * P2 수정:
 * 공통 Interaction 스타일을 가져온다.
 *
 * 기존 export 이름을 유지하므로
 * PollCreateForm, PollManageTable 등의
 * import 코드는 변경하지 않아도 된다.
 */

import {
  interactionPanel,
  interactionField,
  interactionManageButton,
  interactionDangerButton,
} from '../../styles/interactionStyles.js';

export const panel = interactionPanel;

export const field = interactionField;

export const btn = interactionManageButton;

export const closeBtn = interactionDangerButton;
