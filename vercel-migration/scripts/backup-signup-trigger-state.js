require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const projectRefMatch = supabaseUrl.match(/https:\/\/([^.]+)\./);
const projectRef = projectRefMatch ? projectRefMatch[1] : '';

const hostFromEnv = process.env.POSTGRES_HOST || '';
const userFromEnv = process.env.POSTGRES_USER || '';
const passwordFromEnv = process.env.POSTGRES_PASSWORD || '';
const databaseFromEnv = process.env.POSTGRES_DATABASE || 'postgres';
const portFromEnv = Number(process.env.POSTGRES_PORT || 6543);

const functionNames = [
  'handle_new_user',
  'create_subscription_on_user_signup',
  'create_default_location_for_user',
  'log_signup_trigger_error'
];

const triggerNames = [
  'on_auth_user_created',
  'auto_create_subscription_on_signup',
  'create_default_location_on_signup'
];

function uniq(arr) {
  return arr.filter((v, i) => arr.indexOf(v) === i);
}

function splitCsv(value) {
  return String(value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function parsePgUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    const protocol = parsed.protocol.toLowerCase();

    if (protocol !== 'postgresql:' && protocol !== 'postgres:') {
      return null;
    }

    const host = parsed.hostname;
    const user = decodeURIComponent(parsed.username || '');
    const password = decodeURIComponent(parsed.password || '');
    const port = Number(parsed.port || 5432);
    const database = parsed.pathname.replace(/^\/+/, '') || 'postgres';

    if (!host || !user) {
      return null;
    }

    return {
      host,
      port,
      user,
      password,
      database,
      source: 'url'
    };
  } catch (_) {
    return null;
  }
}

function getUrlCandidates() {
  const urlVars = [
    ...splitCsv(process.env.HOTFIX_DATABASE_URL),
    ...splitCsv(process.env.POSTGRES_URL),
    ...splitCsv(process.env.DATABASE_URL)
  ];

  return uniq(urlVars)
    .map(parsePgUrl)
    .filter(Boolean);
}

function candidateKey(candidate) {
  return [candidate.host, candidate.port, candidate.user, candidate.database].join('|');
}

function sanitizeCandidate(candidate) {
  return {
    source: candidate.source,
    host: candidate.host,
    port: candidate.port,
    user: candidate.user,
    database: candidate.database
  };
}

function buildCandidates() {
  const urlCandidates = getUrlCandidates();

  const hostsFromOverride = (process.env.POSTGRES_HOSTS || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  const usersFromOverride = (process.env.POSTGRES_USERS || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  const defaultHosts = [
    hostFromEnv,
    projectRef ? `db.${projectRef}.supabase.co` : '',
    projectRef ? `db.${projectRef}.supabase.net` : '',
    projectRef ? 'aws-0-us-east-1.pooler.supabase.com' : ''
  ].filter(Boolean);

  const hosts = uniq((hostsFromOverride.length > 0 ? hostsFromOverride : defaultHosts));

  const projectedUser = projectRef ? `postgres.${projectRef}` : '';
  const projectedFromEnv = userFromEnv && projectRef && !userFromEnv.endsWith(`.${projectRef}`)
    ? `${userFromEnv}.${projectRef}`
    : '';

  const defaultUsers = [
    userFromEnv,
    'postgres',
    projectedUser,
    projectedFromEnv
  ].filter(Boolean);

  const users = uniq((usersFromOverride.length > 0 ? usersFromOverride : defaultUsers));

  const ports = uniq([portFromEnv, 6543, 5432]);

  const candidates = [];
  for (const host of hosts) {
    for (const port of ports) {
      for (const user of users) {
        candidates.push({
          source: 'matrix',
          host,
          port,
          user,
          password: passwordFromEnv,
          database: databaseFromEnv
        });
      }
    }
  }

  const merged = [...urlCandidates, ...candidates];
  const seen = new Set();

  return merged.filter((candidate) => {
    const key = candidateKey(candidate);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

async function tryConnect(candidate) {
  const client = new Client({
    host: candidate.host,
    port: candidate.port,
    user: candidate.user,
    password: candidate.password,
    database: candidate.database,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
  });

  try {
    await client.connect();
    const who = await client.query('select current_database() as db, current_user as usr');
    return { ok: true, client, who: who.rows[0] };
  } catch (err) {
    try {
      await client.end();
    } catch (_) {
      // ignore cleanup error
    }

    return {
      ok: false,
      error: {
        message: err.message,
        code: err.code || null,
        severity: err.severity || null
      }
    };
  }
}

function buildBackupSql(functionRows, triggerRows) {
  const functionSql = functionRows.map((row) => row.definition).join('\n\n');
  const triggerSql = triggerRows
    .map((row) => `DROP TRIGGER IF EXISTS ${row.tgname} ON auth.users;\n${row.definition};`)
    .join('\n\n');

  return [
    '-- Generated backup: signup trigger state',
    `-- Generated at: ${new Date().toISOString()}`,
    'BEGIN;',
    functionSql,
    triggerSql,
    'COMMIT;'
  ].join('\n\n');
}

async function backupFromClient(client) {
  const functionsResult = await client.query(
    `
      SELECT
        p.proname,
        pg_get_functiondef(p.oid) AS definition
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.proname = ANY($1::text[])
      ORDER BY p.proname;
    `,
    [functionNames]
  );

  const triggersResult = await client.query(
    `
      SELECT
        t.tgname,
        pg_get_triggerdef(t.oid, true) AS definition
      FROM pg_trigger t
      JOIN pg_class c ON c.oid = t.tgrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'auth'
        AND c.relname = 'users'
        AND NOT t.tgisinternal
        AND t.tgname = ANY($1::text[])
      ORDER BY t.tgname;
    `,
    [triggerNames]
  );

  const now = new Date();
  const stamp = now.toISOString().replace(/[:.]/g, '-');
  const backupDir = path.resolve(__dirname, '..', 'backups');

  fs.mkdirSync(backupDir, { recursive: true });

  const jsonPath = path.join(backupDir, `signup-trigger-state-${stamp}.json`);
  const sqlPath = path.join(backupDir, `signup-trigger-state-${stamp}.sql`);

  const payload = {
    generatedAt: now.toISOString(),
    functions: functionsResult.rows,
    triggers: triggersResult.rows
  };

  fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2), 'utf8');
  fs.writeFileSync(sqlPath, buildBackupSql(functionsResult.rows, triggersResult.rows), 'utf8');

  return {
    jsonPath,
    sqlPath,
    functionCount: functionsResult.rows.length,
    triggerCount: triggersResult.rows.length
  };
}

async function main() {
  const candidates = buildCandidates();

  console.log(
    JSON.stringify(
      {
        projectRef,
        totalCandidates: candidates.length,
        candidates: candidates.map(sanitizeCandidate)
      },
      null,
      2
    )
  );

  for (const candidate of candidates) {
    const result = await tryConnect(candidate);

    if (!result.ok) {
      console.log('CONNECT_FAIL', JSON.stringify({ ...sanitizeCandidate(candidate), ...result.error }));
      continue;
    }

    const { client, who } = result;
    console.log(
      'CONNECTED',
      JSON.stringify({
        ...sanitizeCandidate(candidate),
        currentDb: who.db,
        currentUser: who.usr
      })
    );

    try {
      const backup = await backupFromClient(client);
      console.log('BACKUP_CREATED', JSON.stringify({ ...sanitizeCandidate(candidate), ...backup }));
      await client.end();
      process.exit(0);
    } catch (err) {
      await client.end();
      console.log(
        'BACKUP_FAIL',
        JSON.stringify({
          ...sanitizeCandidate(candidate),
          message: err.message,
          code: err.code || null,
          severity: err.severity || null
        })
      );
    }
  }

  console.error('ALL_CONNECTION_ATTEMPTS_FAILED');
  process.exit(1);
}

main().catch((err) => {
  console.error('UNHANDLED', err.message);
  process.exit(1);
});
