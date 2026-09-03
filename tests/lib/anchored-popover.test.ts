import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { getAnchoredPopoverPosition } from '../../lib/anchored-popover';

test('mở popover lên trên khi nút bấm nằm sát đáy màn hình', () => {
  const position = getAnchoredPopoverPosition(
    { left: 300, top: 520, right: 430, bottom: 560 },
    { width: 1280, height: 577 },
    256
  );

  assert.deepEqual(position, {
    placement: 'above',
    edge: 61,
    left: 300,
    width: 256,
    maxHeight: 508,
  });
});

test('mở popover xuống dưới khi còn đủ khoảng trống', () => {
  const position = getAnchoredPopoverPosition(
    { left: 120, top: 100, right: 250, bottom: 140 },
    { width: 1280, height: 800 },
    256
  );

  assert.equal(position.placement, 'below');
  assert.equal(position.edge, 144);
  assert.equal(position.maxHeight, 648);
});

test('giữ popover bên trong cạnh phải màn hình', () => {
  const position = getAnchoredPopoverPosition(
    { left: 1200, top: 100, right: 1270, bottom: 140 },
    { width: 1280, height: 800 },
    256
  );

  assert.equal(position.left, 1016);
});

test('các combobox trong bảng đều render popover fixed qua portal', () => {
  const source = readFileSync(new URL('../../components/dashboard/task-board.tsx', import.meta.url), 'utf8');
  const cellNames = ['MemberPickerCell', 'AccountNameCell', 'ProductCell'];

  for (const [index, cellName] of cellNames.entries()) {
    const start = source.indexOf(`function ${cellName}`);
    const end = index === cellNames.length - 1 ? source.indexOf('/** Hàng nhập liệu', start) : source.indexOf(`function ${cellNames[index + 1]}`, start);
    const cellSource = source.slice(start, end);

    assert.notEqual(start, -1, `Không tìm thấy ${cellName}`);
    assert.match(cellSource, /createPortal\(/, `${cellName} phải thoát khỏi overflow của bảng bằng portal`);
    assert.match(cellSource, /document\.body/, `${cellName} phải render portal trực tiếp vào document.body`);
    assert.match(cellSource, /className="fixed z-50/, `${cellName} phải neo theo viewport`);
    assert.doesNotMatch(cellSource, /className="absolute[^\"]*z-20/, `${cellName} không được đặt popup absolute trong bảng`);
  }
});
