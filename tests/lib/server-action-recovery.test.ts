import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  clearServerActionRecoveryMarker,
  recoverFromStaleServerActionResponse,
} from '../../lib/server-action-recovery';

function createRuntime() {
  let marker: string | null = null;
  let reloadCount = 0;

  return {
    runtime: {
      getMarker: () => marker,
      setMarker: (value: string) => {
        marker = value;
      },
      clearMarker: () => {
        marker = null;
      },
      reload: () => {
        reloadCount += 1;
      },
    },
    marker: () => marker,
    reloadCount: () => reloadCount,
  };
}

test('response Server Action cũ tự reload đúng một lần cho tới khi đồng bộ lại thành công', () => {
  const state = createRuntime();
  const error = Object.assign(new Error('An unexpected response was received from the server.'), {
    __NEXT_ERROR_CODE: 'E394',
  });

  assert.equal(recoverFromStaleServerActionResponse(error, state.runtime), true);
  assert.equal(state.reloadCount(), 1);
  assert.equal(state.marker(), 'pending');

  assert.equal(recoverFromStaleServerActionResponse(error, state.runtime), true);
  assert.equal(state.reloadCount(), 1, 'Không được reload lặp nếu response vẫn lỗi');

  clearServerActionRecoveryMarker(state.runtime);
  assert.equal(state.marker(), null);
});

test('lỗi nghiệp vụ hoặc mạng khác không bị ép reload', () => {
  const state = createRuntime();

  assert.equal(recoverFromStaleServerActionResponse(new Error('Không thể kết nối cơ sở dữ liệu.'), state.runtime), false);
  assert.equal(state.reloadCount(), 0);
  assert.equal(state.marker(), null);
});

test('mọi refresh nền của bảng task dùng recovery thay vì console.error', () => {
  const teamBoardSource = readFileSync(
    new URL('../../components/dashboard/task-board.tsx', import.meta.url),
    'utf8'
  );
  const personalBoardSource = readFileSync(
    new URL('../../components/dashboard/personal-task-board.tsx', import.meta.url),
    'utf8'
  );
  const sources = `${teamBoardSource}\n${personalBoardSource}`;

  assert.doesNotMatch(sources, /console\.error\('refresh(?:Board|Overview| board cá nhân) \(nền\) lỗi:'/);
  assert.equal(
    sources.match(/recoverFromStaleServerActionResponse\(err\)/g)?.length,
    3,
    'Bảng đội, tổng quan và bảng cá nhân đều phải phục hồi response lệch build'
  );
});
