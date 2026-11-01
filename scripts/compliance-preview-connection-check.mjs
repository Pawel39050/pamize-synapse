/**
 * Read-only connection probe. Intentionally NOT registered as an HTTP route or scheduled job.
 * Run only in an approved isolated Preview environment with secrets supplied by the host.
 * Never prints the connection string, password, host, SQL results containing customer data.
 */
import { neon } from "@neondatabase/serverless";

function abort(message) { throw new Error(message); }
if (process.env.VERCEL_ENV !== "preview") abort("Preview environment required");
if (process.env.VERCEL_GIT_COMMIT_REF !== "feature/compliance-guardian") abort("Wrong Git branch");
const connection = process.env.COMPLIANCE_DATABASE_URL;
if (!connection) abort("Missing COMPLIANCE_DATABASE_URL");
const url = new URL(connection);
if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") abort("Invalid protocol");
if (!url.hostname.endsWith(".neon.tech")) abort("Not a Neon endpoint");
const expectedHost = process.env.COMPLIANCE_EXPECTED_DB_HOST;
if (!expectedHost || url.hostname !== expectedHost) abort("Neon host not independently confirmed");
const sql = neon(connection);
const result = await sql`SELECT current_database() AS database_name, current_user AS role_name`;
if (!result[0]?.database_name || !result[0]?.role_name) abort("Connection verification failed");
console.log("PASS: read-only Neon connection established in expected Preview branch and host.");
console.log("NOTE: SQL cannot itself prove Neon branch identity; confirm branch endpoint in Neon console.");
