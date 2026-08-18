import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sql } from '../lib/db';

async function main() {
  const schemaPath = join(__dirname, '..', 'db', 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');

  const statements = schema
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));

  for (const [i, statement] of statements.entries()) {
    const label = statement.slice(0, 60).replace(/\s+/g, ' ');
    try {
      await sql.query(statement);
      console.log(`[${i + 1}/${statements.length}] OK: ${label}...`);
    } catch (err) {
      console.error(`[${i + 1}/${statements.length}] FAILED: ${label}...`);
      throw err;
    }
  }

  console.log('Migration hoàn tất.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
