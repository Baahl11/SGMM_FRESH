require('dotenv').config({ path: '.env.local' });

const { Client } = require('pg');

async function main() {
  const host = process.env.POSTGRES_HOSTS || process.env.POSTGRES_HOST;
  const user = process.env.POSTGRES_USERS || process.env.POSTGRES_USER;
  const port = Number(process.env.POSTGRES_PORT || 5432);
  const password = process.env.POSTGRES_PASSWORD;

  const client = new Client({
    host,
    user,
    port,
    password,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  const triggers = await client.query(
    "SELECT trigger_name FROM information_schema.triggers WHERE event_object_schema='auth' AND event_object_table='users' ORDER BY trigger_name"
  );

  const functions = await client.query(
    "SELECT routine_name FROM information_schema.routines WHERE routine_schema='public' AND routine_name IN ('handle_new_user','create_subscription_on_user_signup','create_default_location_for_user','log_signup_trigger_error') ORDER BY routine_name"
  );

  const errorLogs = await client.query(
    "SELECT to_regclass('public.error_logs') AS error_logs_table"
  );

  console.log('TRIGGERS', JSON.stringify(triggers.rows));
  console.log('FUNCTIONS', JSON.stringify(functions.rows));
  console.log('ERROR_LOGS_TABLE', JSON.stringify(errorLogs.rows));

  await client.end();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
