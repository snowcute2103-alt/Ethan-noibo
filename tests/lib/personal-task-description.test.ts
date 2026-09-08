import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizePersonalTaskDescription,
  parsePersonalTaskDescription,
} from '../../lib/personal-task-description';

test('đổi cú pháp gạch ngang và mũi tên thành ký hiệu đẹp', () => {
  assert.equal(
    normalizePersonalTaskDescription('- Việc một\n-> Kết quả\nNội dung thường'),
    '• Việc một\n→ Kết quả\nNội dung thường'
  );
  assert.equal(normalizePersonalTaskDescription('-'), '• ');
});

test('tách mô tả thành từng ý và mặc định dòng thường là gạch đầu dòng', () => {
  assert.deepEqual(parsePersonalTaskDescription('- Việc một\n→ Kết quả\nNội dung thường'), [
    { kind: 'bullet', content: 'Việc một' },
    { kind: 'arrow', content: 'Kết quả' },
    { kind: 'bullet', content: 'Nội dung thường' },
  ]);
});
