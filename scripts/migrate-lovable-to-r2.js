#!/usr/bin/env node
/*
  migrate-lovable-to-r2.js

  Usage:
    ADMIN_JWT=<your_admin_jwt> node scripts/migrate-lovable-to-r2.js

  Optional env vars:
    WORKER_URL - defaults to https://r2-upload-worker.cirpmanhome.workers.dev
    LOVABLE_DIR - defaults to ./public/lovable-uploads
    CF_ACCOUNT_ID - if provided with D1_DB_ID and CF_READ_TOKEN the script will
                    query D1 to locate rows referencing each file and emit SQL
    D1_DB_ID - Cloudflare D1 database id (uuid)
    CF_READ_TOKEN - read-only Cloudflare token for querying D1 (optional)

  Output:
    ./migrations/lovable_to_r2.csv  - mapping old_path -> r2_url
    ./migrations/update_sql.sql     - suggested UPDATE statements to run

  Notes:
  - This script uploads files by calling your deployed Worker /upload endpoint.
    It requires an admin JWT (ADMIN_JWT) that the Worker recognizes.
  - The script does NOT modify the DB. It only emits SQL you can review and
    run manually or with a write-capable token.
*/

const fs = require('fs').promises;
const path = require('path');
const fetch = global.fetch || require('node-fetch');

const WORKER_URL = process.env.WORKER_URL || 'https://r2-upload-worker.cirpmanhome.workers.dev';
const LOVABLE_DIR = process.env.LOVABLE_DIR || path.join(process.cwd(), 'public', 'lovable-uploads');
const ADMIN_JWT = process.env.ADMIN_JWT;
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const D1_DB_ID = process.env.D1_DB_ID;
const CF_READ_TOKEN = process.env.CF_READ_TOKEN;

if (!ADMIN_JWT) {
  console.error('ERROR: ADMIN_JWT not set. Export your admin JWT and re-run.');
  process.exit(1);
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const res = path.resolve(dir, e.name);
    if (e.isDirectory()) {
      files.push(...await walk(res));
    } else if (e.isFile()) {
      files.push(res);
    }
  }
  return files;
}

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const map = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.mov': 'video/quicktime'
  };
  return map[ext] || 'application/octet-stream';
}

async function uploadToWorker(filePath) {
  const buf = await fs.readFile(filePath);
  const mime = getMimeType(filePath);
  const base64 = buf.toString('base64');
  const dataUrl = `data:${mime};base64,${base64}`;

  const res = await fetch(`${WORKER_URL.replace(/\/$/, '')}/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ADMIN_JWT}` },
    body: JSON.stringify({ file: dataUrl, type: mime, fileName: path.basename(filePath) }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed: ${res.status} ${res.statusText} - ${text}`);
  }
  const json = await res.json();
  return json;
}

async function queryD1(sql) {
  if (!CF_ACCOUNT_ID || !D1_DB_ID || !CF_READ_TOKEN) return null;
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${D1_DB_ID}/query`;
  const res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${CF_READ_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ sql }) });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`D1 query failed: ${res.status} ${txt}`);
  }
  return await res.json();
}

async function findReferencesForFilename(filename) {
  if (!CF_ACCOUNT_ID || !D1_DB_ID || !CF_READ_TOKEN) return [];
  // naive queries to find occurrences in likely columns
  const like = `%${filename}%`;
  const queries = [
    { sql: `SELECT id, featured_image as col FROM properties WHERE featured_image LIKE '${like.replace(/'/g, "''")}'`, table: 'properties', column: 'featured_image' },
    { sql: `SELECT id, images as col FROM properties WHERE images LIKE '${like.replace(/'/g, "''")}'`, table: 'properties', column: 'images' },
    { sql: `SELECT id, videos as col FROM properties WHERE videos LIKE '${like.replace(/'/g, "''")}'`, table: 'properties', column: 'videos' },
    { sql: `SELECT id, image_url as col FROM gallery WHERE image_url LIKE '${like.replace(/'/g, "''")}'`, table: 'gallery', column: 'image_url' },
    { sql: `SELECT id, video_url as col FROM gallery WHERE video_url LIKE '${like.replace(/'/g, "''")}'`, table: 'gallery', column: 'video_url' },
    { sql: `SELECT id, client_photo_url as col FROM testimonials WHERE client_photo_url LIKE '${like.replace(/'/g, "''")}'`, table: 'testimonials', column: 'client_photo_url' },
  ];
  const results = [];
  for (const q of queries) {
    try {
      const r = await queryD1(q.sql);
      const rows = r?.result?.[0]?.results || r?.result || r?.results || [];
      for (const row of rows) results.push({ table: q.table, column: q.column, row });
    } catch (e) {
      // ignore table/column errors
    }
  }
  return results;
}

async function main() {
  console.log('Scanning', LOVABLE_DIR);
  let files;
  try { files = await walk(LOVABLE_DIR); } catch (e) { console.error('Failed to read LOVABLE_DIR:', e.message); process.exit(1); }
  if (files.length === 0) { console.log('No files found - nothing to do'); return; }

  await fs.mkdir(path.join(process.cwd(), 'migrations'), { recursive: true });
  const csvLines = ['old_path,r2_url'];
  const sqlLines = ['-- Generated SQL updates to replace lovable-uploads paths with R2 URLs'];

  for (const f of files) {
    const rel = path.relative(process.cwd(), f).replace(/\\/g, '/');
    console.log('Uploading', rel);
    try {
      const resp = await uploadToWorker(f);
      const r2 = resp.publicUrl || resp.url || resp; // best effort
      console.log(' ->', r2);
      csvLines.push(`${rel},${r2}`);

      // try to find DB references and emit SQL
      const filename = path.basename(f);
      const refs = await findReferencesForFilename(filename);
      for (const r of refs) {
        const id = r.row.id || r.row.ID || r.row[0] || null;
        if (!id) continue;
        if (r.column === 'featured_image' || r.column === 'image_url' || r.column === 'video_url' || r.column === 'client_photo_url') {
          // direct replace
          sqlLines.push(`-- ${r.table} id=${id}\nUPDATE ${r.table} SET ${r.column} = '${r2.replace(/'/g, "''")}' WHERE id = ${id};`);
        } else if (r.column === 'images' || r.column === 'videos') {
          // JSON text field - use REPLACE to substitute occurrences
          const oldRel = rel.replace(/'/g, "''");
          sqlLines.push(`-- ${r.table} id=${id}\nUPDATE ${r.table} SET ${r.column} = REPLACE(${r.column}, '${oldRel}', '${r2.replace(/'/g, "''")}') WHERE id = ${id};`);
        }
      }
    } catch (e) {
      console.error('Upload failed for', rel, e.message);
    }
  }

  await fs.writeFile(path.join(process.cwd(), 'migrations', 'lovable_to_r2.csv'), csvLines.join('\n'));
  await fs.writeFile(path.join(process.cwd(), 'migrations', 'update_sql.sql'), sqlLines.join('\n\n'));
  console.log('Done. Files written to migrations/lovable_to_r2.csv and migrations/update_sql.sql');
}

main().catch(err => { console.error(err); process.exit(1); });
