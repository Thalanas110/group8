import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CreateExamFocusViolationState,
  ResolveExamFocusViolation,
  type ExamFocusViolationEvent,
} from './ExamFocusViolationState.ts';

function CollectViolations(events: ExamFocusViolationEvent[]) {
  let state = CreateExamFocusViolationState();
  const violations = [];

  for (const event of events) {
    const outcome = ResolveExamFocusViolation(state, event);
    state = outcome.nextState;

    if (outcome.violationType) {
      violations.push(outcome.violationType);
    }
  }

  return violations;
}

test('tab switches do not double count as window blur before focus returns', () => {
  const violations = CollectViolations([
    { type: 'blur', hidden: false },
    { type: 'visibilitychange', hidden: true },
    { type: 'visibilitychange', hidden: false },
    { type: 'focus', hidden: false },
  ]);

  assert.deepEqual(violations, ['tab_switch']);
});

test('window blur counts once focus returns without hiding the tab', () => {
  const violations = CollectViolations([
    { type: 'blur', hidden: false },
    { type: 'focus', hidden: false },
  ]);

  assert.deepEqual(violations, ['window_blur']);
});
