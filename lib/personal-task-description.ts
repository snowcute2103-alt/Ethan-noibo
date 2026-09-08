export type PersonalTaskDescriptionItem = {
  kind: 'bullet' | 'arrow';
  content: string;
};

/** Chuẩn hoá ký hiệu người dùng quen gõ thành dấu hiển thị thống nhất. */
export function normalizePersonalTaskDescription(value: string): string {
  return value
    .split('\n')
    .map((line) => {
      if (/^\s*->\s*/.test(line)) return line.replace(/^\s*->\s*/, '→ ');
      if (/^\s*-\s*/.test(line)) return line.replace(/^\s*-\s*/, '• ');
      return line;
    })
    .join('\n');
}

/** Mọi dòng nội dung được trình bày như một ý riêng; `→` dành cho ý suy ra. */
export function parsePersonalTaskDescription(value: string | null | undefined): PersonalTaskDescriptionItem[] {
  if (!value) return [];
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (/^(?:→|->)\s*/.test(line)) {
        return { kind: 'arrow' as const, content: line.replace(/^(?:→|->)\s*/, '') };
      }
      return { kind: 'bullet' as const, content: line.replace(/^(?:•|-)\s*/, '') };
    })
    .filter((item) => item.content.length > 0);
}
