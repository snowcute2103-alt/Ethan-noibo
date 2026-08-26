import 'server-only';
import { sql } from './db';

export interface Quote {
  id: number;
  content: string;
  author: string;
  imgUrl: string | null;
}

export interface QuoteInput {
  content: string;
  author: string;
  imgUrl?: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): Quote {
  return {
    id: row.id,
    content: row.content,
    author: row.author,
    imgUrl: row.img_url ?? null,
  };
}

export async function listQuotes(): Promise<Quote[]> {
  const rows = await sql.query('SELECT * FROM quotes ORDER BY id ASC');
  return rows.map(mapRow);
}

export async function createQuote(input: QuoteInput, createdBy: number): Promise<Quote> {
  const rows = await sql.query(
    `INSERT INTO quotes (content, author, img_url, created_by)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [input.content, input.author || 'Khuyết danh', input.imgUrl ?? null, createdBy]
  );
  return mapRow(rows[0]);
}
