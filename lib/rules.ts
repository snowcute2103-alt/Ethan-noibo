import 'server-only';
import { sql } from './db';
import type { RuleDocument, SopSection } from './content/sop';

export interface RuleInput {
  title: string;
  subtitle: string;
  version: string;
  effectiveDate: string;
  updatedAt: string;
  status: string;
  goldenRule?: { title: string; points: string[] } | null;
  sections: SopSection[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): RuleDocument {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    version: row.version,
    effectiveDate: row.effective_date,
    updatedAt: row.updated_at_label,
    status: row.status,
    goldenRule: row.golden_rule ?? undefined,
    sections: row.sections ?? [],
  };
}

function slugify(title: string): string {
  const base = title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'rule';
}

async function generateUniqueId(title: string): Promise<string> {
  const base = slugify(title);
  let candidate = base;
  let suffix = 2;
  while (true) {
    const rows = await sql.query('SELECT 1 FROM rules WHERE id = $1', [candidate]);
    if (rows.length === 0) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

export async function listRules(): Promise<RuleDocument[]> {
  const rows = await sql.query('SELECT * FROM rules ORDER BY created_at ASC');
  return rows.map(mapRow);
}

export async function findRule(id: string): Promise<RuleDocument | null> {
  const rows = await sql.query('SELECT * FROM rules WHERE id = $1', [id]);
  return rows.length > 0 ? mapRow(rows[0]) : null;
}

export async function createRule(input: RuleInput, createdBy: number): Promise<RuleDocument> {
  const id = await generateUniqueId(input.title);
  const rows = await sql.query(
    `INSERT INTO rules (id, title, subtitle, version, effective_date, updated_at_label, status, golden_rule, sections, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      id,
      input.title,
      input.subtitle,
      input.version,
      input.effectiveDate,
      input.updatedAt,
      input.status,
      input.goldenRule ? JSON.stringify(input.goldenRule) : null,
      JSON.stringify(input.sections),
      createdBy,
    ]
  );
  return mapRow(rows[0]);
}

export async function updateRule(id: string, input: RuleInput): Promise<RuleDocument> {
  const rows = await sql.query(
    `UPDATE rules SET
       title = $2, subtitle = $3, version = $4, effective_date = $5,
       updated_at_label = $6, status = $7, golden_rule = $8, sections = $9,
       updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [
      id,
      input.title,
      input.subtitle,
      input.version,
      input.effectiveDate,
      input.updatedAt,
      input.status,
      input.goldenRule ? JSON.stringify(input.goldenRule) : null,
      JSON.stringify(input.sections),
    ]
  );
  if (rows.length === 0) throw new Error('Không tìm thấy rule.');
  return mapRow(rows[0]);
}

export async function deleteRule(id: string): Promise<void> {
  await sql.query('DELETE FROM rules WHERE id = $1', [id]);
}
