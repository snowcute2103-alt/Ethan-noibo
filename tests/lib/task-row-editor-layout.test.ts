import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const taskBoardSource = readFileSync(
  new URL('../../components/dashboard/task-board.tsx', import.meta.url),
  'utf8'
);

test('các control của hàng sửa không ép chiều rộng vượt khỏi cột table-fixed', () => {
  const colgroupStart = taskBoardSource.indexOf('<colgroup>');
  const colgroupEnd = taskBoardSource.indexOf('</colgroup>', colgroupStart);
  const colgroupSource = taskBoardSource.slice(colgroupStart, colgroupEnd);
  const editorStart = taskBoardSource.indexOf('function MemberPickerCell');
  const editorEnd = taskBoardSource.indexOf('const WEEKDAY_LABELS', editorStart);
  const editorSource = taskBoardSource.slice(editorStart, editorEnd);

  assert.notEqual(editorStart, -1, 'Không tìm thấy các control của TaskRowEditor');
  assert.match(
    colgroupSource,
    /<col style=\{\{ width: 44 \}\} \/>\s*<col style=\{\{ width: 160 \}\} \/>/,
    'Cột Ngày phải đủ rộng để hiển thị cả ngày và nút lịch'
  );
  assert.match(
    colgroupSource,
    /<col style=\{\{ width: 100 \}\} \/>\s*<col style=\{\{ width: 100 \}\} \/>/,
    'Cột thao tác phải đủ rộng cho Xong hoặc Lưu/Huỷ'
  );
  assert.doesNotMatch(
    editorSource,
    /min-w-\[100px\]/,
    'Control trong cột hẹp không được ép min-width 100px vì sẽ chồng sang cột kế bên'
  );
  assert.match(
    editorSource,
    /const cellInputClass\s*=\s*'[^']*min-w-0[^']*max-w-full[^']*'/,
    'Input chung phải được phép co theo chiều rộng thật của ô'
  );
  assert.match(
    editorSource,
    /const editorCellClass = '[^']*min-w-0[^']*overflow-hidden[^']*'/,
    'Ô của hàng sửa phải chặn nội dung tràn sang ô kế bên'
  );
});
