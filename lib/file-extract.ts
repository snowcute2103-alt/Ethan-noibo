import 'server-only';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

const PAGE_SEPARATOR_RE = /^-- \d+ of \d+ --$/;

/** Trích xuất nội dung text từ file rule do BGĐ upload (PDF/DOCX/TXT/MD) —
 *  không lưu file gốc, chỉ dùng text để đổ vào 1 section cho admin chỉnh sửa tiếp. */
export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith('.txt') || name.endsWith('.md')) {
    return file.text();
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (name.endsWith('.pdf')) {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text
        .split('\n')
        .filter((line) => !PAGE_SEPARATOR_RE.test(line.trim()))
        .join('\n')
        .trim();
    } finally {
      await parser.destroy();
    }
  }

  if (name.endsWith('.docx')) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  throw new Error('Chỉ hỗ trợ file PDF, DOCX, TXT hoặc MD.');
}
