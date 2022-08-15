import { Pool } from "pg";
import * as dotEnv from "dotenv";
dotEnv.config();

const pool = new Pool({
  host: process.env.HOSTNAME,
  user: process.env.DB_USER,
  port: parseInt(process.env.PORT!),
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  max: 10,
  connectionTimeoutMillis: 0,
  idleTimeoutMillis: 0,
});

async function fetch(sql: string, binds?: Array<any>) {
  let returned_fetch: any;
  if (binds === undefined) {
    returned_fetch = await pool.query(sql);
  } else if (binds !== undefined) {
    returned_fetch = await pool.query(sql, binds);
  }
  return returned_fetch.rows;
}
/**
 * @param  {string} sql - The SQL query to run.
 * @param  {Array<Object>} binds - The values to bind to the query.
 */
async function modify(sql: string, binds?: Array<any>) {
  await pool.query("BEGIN;");
  if (binds === undefined) {
    await pool.query(sql);
  } else if (binds !== undefined) {
    await pool.query(sql, binds);
  }

  await pool.query("COMMIT;");
}

async function create(table: string, columns: string) {
  await pool.query("BEGIN;");
  await pool.query(`CREATE TABLE IF NOT EXISTS ${table}(${columns});`);
  await pool.query("COMMIT;");
}

export { fetch, modify, create};
