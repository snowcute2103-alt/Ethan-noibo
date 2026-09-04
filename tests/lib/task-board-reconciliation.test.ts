import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const taskBoardSource = readFileSync(
  new URL('../../components/dashboard/task-board.tsx', import.meta.url),
  'utf8'
);

interface TestTask {
  id: number;
  status: string;
}

function reconcileRows(rows: Map<number, TestTask>, removeId: number | undefined, next: TestTask | null, includeNext: boolean) {
  const replacingTaskInPlace =
    removeId !== undefined && next !== null && next.id === removeId && includeNext && rows.has(removeId);
  if (!replacingTaskInPlace && removeId !== undefined) rows.delete(removeId);
  if (next && includeNext) rows.set(next.id, next);
}

test('reconcile task cùng ID không đổi insertion order của hàng', () => {
  const reconcileStart = taskBoardSource.indexOf('function reconcileBoardTasks');
  const reconcileEnd = taskBoardSource.indexOf('async function refreshBoard', reconcileStart);
  const reconcileSource = taskBoardSource.slice(reconcileStart, reconcileEnd);

  assert.notEqual(reconcileStart, -1, 'Không tìm thấy reconcileBoardTasks');
  assert.match(
    reconcileSource,
    /const replacingTaskInPlace =\s*removeId !== undefined &&\s*change\.next !== null &&\s*change\.next\.id === removeId &&\s*inRange\(change\.next\) &&\s*nextById\.has\(removeId\);/,
    'Khi server trả về cùng task, phải nhận diện đây là thay giá trị tại chỗ'
  );
  assert.match(
    reconcileSource,
    /if \(!replacingTaskInPlace && removeId !== undefined\) nextById\.delete\(removeId\);/,
    'Không được xóa key trước khi thay cùng ID vì Map sẽ chuyển hàng xuống cuối'
  );

  const rows = new Map([
    [101, { id: 101, status: 'not_started' }],
    [102, { id: 102, status: 'not_started' }],
    [103, { id: 103, status: 'not_started' }],
  ]);
  const removeId = 102;
  const next = { id: 102, status: 'done' };
  reconcileRows(rows, removeId, next, true);

  assert.deepEqual([...rows.keys()], [101, 102, 103]);
  assert.equal(rows.get(102)?.status, 'done');
});

test('reconcile vẫn xóa, loại khỏi range và thay ID tạm đúng thứ tự', () => {
  const deletedRows = new Map([
    [101, { id: 101, status: 'not_started' }],
    [102, { id: 102, status: 'not_started' }],
    [103, { id: 103, status: 'not_started' }],
  ]);
  reconcileRows(deletedRows, 102, null, false);
  assert.deepEqual([...deletedRows.keys()], [101, 103]);

  const movedOutOfRangeRows = new Map([
    [101, { id: 101, status: 'not_started' }],
    [102, { id: 102, status: 'not_started' }],
    [103, { id: 103, status: 'not_started' }],
  ]);
  reconcileRows(movedOutOfRangeRows, 102, { id: 102, status: 'not_started' }, false);
  assert.deepEqual([...movedOutOfRangeRows.keys()], [101, 103]);

  const optimisticRows = new Map([
    [-1, { id: -1, status: 'not_started' }],
    [101, { id: 101, status: 'not_started' }],
  ]);
  reconcileRows(optimisticRows, -1, { id: 104, status: 'not_started' }, true);
  assert.deepEqual([...optimisticRows.keys()], [101, 104]);
});
