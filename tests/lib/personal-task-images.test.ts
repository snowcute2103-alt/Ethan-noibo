import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const drawerSource = readFileSync(
  new URL('../../components/dashboard/personal-task-detail-drawer.tsx', import.meta.url),
  'utf8'
);
const actionsSource = readFileSync(
  new URL('../../app/dashboard/giao-task/actions.ts', import.meta.url),
  'utf8'
);
const schemaSource = readFileSync(new URL('../../db/schema.sql', import.meta.url), 'utf8');

test('vùng ảnh nhận nhiều file từ picker, kéo thả và clipboard', () => {
  assert.match(drawerSource, /accept="image\/jpeg,image\/png,image\/webp"\s+multiple/);
  assert.match(drawerSource, /onDrop=\{handleImageDrop\}/);
  assert.match(drawerSource, /onPaste=\{handleImagePaste\}/);
  assert.match(drawerSource, /event\.clipboardData\.files/);
  assert.match(drawerSource, /formData\.append\('files', file\)/);
});

test('server kiểm tra số lượng, kích thước và magic bytes trước khi lưu ảnh', () => {
  assert.match(actionsSource, /PERSONAL_TASK_IMAGES_MAX_COUNT = 10/);
  assert.match(actionsSource, /PERSONAL_TASK_IMAGES_MAX_TOTAL_BYTES = 20 \* 1024 \* 1024/);
  assert.match(actionsSource, /sniffPersonalTaskImageType\(buffer\)/);
  assert.match(actionsSource, /addPersonalTaskImageUrls/);
  assert.match(actionsSource, /removePersonalTaskImageUrl/);
});

test('migration giữ ảnh cũ khi nâng cấp sang danh sách ảnh', () => {
  assert.match(schemaSource, /ADD COLUMN IF NOT EXISTS image_urls TEXT\[\] NOT NULL/);
  assert.match(schemaSource, /SET image_urls = ARRAY\[image_url\]/);
  assert.match(schemaSource, /cardinality\(image_urls\) = 0/);
  assert.match(schemaSource, /CHECK \(cardinality\(image_urls\) <= 10\)/);
});
