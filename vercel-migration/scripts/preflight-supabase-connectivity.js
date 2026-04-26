require('dotenv').config({ path: '.env.local' });

const { Client } = require('pg');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const projectRefMatch = supabaseUrl.match(/https:\/\/([^.]+)\./);
const projectRef = projectRefMatch ? projectRefMatch[1] : '';

function splitCsv(value) {
  return String(value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function uniq(arr) {
  return arr.filter((v, i) => arr.indexOf(v) === i);
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
      source: 'url',
      host,
      port,
      user,
      password,
      database
    };
  } catch (_) {
    return null;
  }
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

function buildConnectionCandidates() {
  const urlCandidates = uniq([
    ...splitCsv(process.env.HOTFIX_DATABASE_URL),
    ...splitCsv(process.env.POSTGRES_URL),
    ...splitCsv(process.env.DATABASE_URL)
  ])
    .map(parsePgUrl)
    .filter(Boolean);

  const host = process.env.POSTGRES_HOST || '';
  const user = process.env.POSTGRES_USER || '';
  const password = process.env.POSTGRES_PASSWORD || '';
  const database = process.env.POSTGRES_DATABASE || 'postgres';
  const port = Number(process.env.POSTGRES_PORT || 6543);

  const matrixCandidate = host && user
    ? [{
        source: 'matrix',
        host,
        port,
        user,
        password,
        database
      }]
    : [];

  const merged = [...urlCandidates, ...matrixCandidate];
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

async function checkAuthSettingsKey(label, apiKey) {
  if (!supabaseUrl) {
    return {
      ok: false,
      label,
      status: null,
      message: 'NEXT_PUBLIC_SUPABASE_URL is missing'
    };
  }

  if (!apiKey) {
    return {
      ok: false,
      label,
      status: null,
      message: `${label} key is missing`
    };
  }

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: apiKey }
    });

    const body = await response.text();

    if (!response.ok) {
      return {
        ok: false,
        label,
        status: response.status,
        message: body
      };
    }

    return {
      ok: true,
      label,
      status: response.status,
      message: 'ok'
    };
  } catch (error) {
    return {
      ok: false,
      label,
      status: null,
      message: error.message
    };
  }
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
    const result = await client.query('select current_database() as db, current_user as usr');
    await client.end();

    return {
      ok: true,
      candidate: sanitizeCandidate(candidate),
      db: result.rows[0]?.db || null,
      user: result.rows[0]?.usr || null
    };
  } catch (error) {
    try {
      await client.end();
    } catch (_) {
      // ignore cleanup error
    }

    return {
      ok: false,
      candidate: sanitizeCandidate(candidate),
      code: error.code || null,
      message: error.message
    };
  }
}

async function main() {
  const serviceRoleCheck = await checkAuthSettingsKey(
    'SUPABASE_SERVICE_ROLE_KEY',
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const anonCheck = await checkAuthSettingsKey(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const candidates = buildConnectionCandidates();

  const summary = {
    projectRef,
    supabaseUrl,
    authChecks: {
      serviceRole: serviceRoleCheck,
      anon: anonCheck
    },
    dbCandidates: candidates.map(sanitizeCandidate)
  };

  console.log(JSON.stringify(summary, null, 2));

  if (candidates.length === 0) {
    console.error('NO_DB_CANDIDATES_FOUND');
    process.exit(1);
  }

  for (const candidate of candidates) {
    const result = await tryConnect(candidate);

    if (result.ok) {
      console.log('DB_CONNECT_OK', JSON.stringify(result));

      if (!serviceRoleCheck.ok) {
        console.error('SERVICE_ROLE_INVALID');
        process.exit(1);
      }

      if (!anonCheck.ok) {
        console.warn('ANON_KEY_INVALID_OR_STALE');
      }

      process.exit(0);
    }

    console.log('DB_CONNECT_FAIL', JSON.stringify(result));
  }

  console.error('DB_CONNECTIVITY_FAILED_FOR_ALL_CANDIDATES');
  process.exit(1);
}

main().catch((error) => {
  console.error('UNHANDLED', error.message);
  process.exit(1);
});
