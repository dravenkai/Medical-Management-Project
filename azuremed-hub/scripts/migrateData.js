// One-time local -> production data migration, using mysql2 directly
// instead of the mysqldump/mysql CLI tools (not installed on this machine).
// Safe to keep in the repo — running it does nothing unless invoked.
//
// Usage:
//   node scripts/migrateData.js dump > azuremed_hub_dump.sql
//     Connects using the LOCAL .env's DB_* vars, writes every table's rows
//     as INSERT statements. Run this against your local dev database.
//
//   node scripts/migrateData.js restore azuremed_hub_dump.sql
//     Connects using whatever DB_* vars are currently set (point these at
//     Railway's MySQL — see DEPLOYMENT.md) and replays the dump. Run
//     `npm run db:schema` against that same target FIRST so the tables
//     exist — this script only inserts rows, it doesn't create tables.
require("dotenv").config();
const fs = require("fs");
const mysql = require("mysql2/promise");

// Dependency order matters for restore (FK parents before children) — not
// for dump, but keeping one order for both keeps this script simple.
const TABLES = [
  "users",
  "medicines",
  "sales",
  "sale_items",
  "ai_detection_logs",
  "cart_items",
  "orders",
  "order_items",
  "store_settings",
  "promo_codes",
  "customer_queries",
  "staff_todos",
  "reviews",
  "product_reviews",
  "password_reset_tokens",
  "advertisements",
];

async function connect() {
  return mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "azuremed_hub",
    multipleStatements: true,
  });
}

async function dump() {
  const connection = await connect();
  const lines = ["SET FOREIGN_KEY_CHECKS=0;", ""];

  for (const table of TABLES) {
    let rows;
    try {
      [rows] = await connection.query(`SELECT * FROM \`${table}\``);
    } catch (error) {
      if (error.code === "ER_NO_SUCH_TABLE") continue; // table dropped/renamed since TABLES was written
      throw error;
    }
    if (rows.length === 0) continue;

    const columns = Object.keys(rows[0]);
    // ON DUPLICATE KEY UPDATE, not a plain INSERT — makes restore
    // idempotent (safe to re-run, e.g. after a partial failure) and
    // resilient to rows the target schema already seeded itself, like
    // store_settings' default id=1 row from azuremed_schema.sql's own
    // INSERT IGNORE. A plain INSERT hitting that pre-existing row aborts
    // the whole multi-statement batch on the duplicate-key error and
    // silently skips every table listed after it.
    const updateClause = columns
      .filter((c) => c !== "id")
      .map((c) => `\`${c}\` = VALUES(\`${c}\`)`)
      .join(", ");
    lines.push(`-- ${table}: ${rows.length} rows`);
    for (const row of rows) {
      const values = columns.map((col) => connection.escape(row[col])).join(", ");
      lines.push(
        `INSERT INTO \`${table}\` (${columns.map((c) => `\`${c}\``).join(", ")}) VALUES (${values}) ON DUPLICATE KEY UPDATE ${updateClause};`
      );
    }
    lines.push("");
  }

  lines.push("SET FOREIGN_KEY_CHECKS=1;");
  await connection.end();
  process.stdout.write(lines.join("\n") + "\n");
  console.error(`Dumped ${TABLES.length} tables' worth of data to stdout.`);
}

async function restore(filePath) {
  if (!filePath) {
    console.error("Usage: node scripts/migrateData.js restore <dump-file.sql>");
    process.exitCode = 1;
    return;
  }
  const sql = fs.readFileSync(filePath, "utf8");
  const connection = await connect();
  console.error(`Connecting to ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME} ...`);
  await connection.query(sql);
  await connection.end();
  console.error("Restore complete.");
}

const [, , command, arg] = process.argv;
if (command === "dump") {
  dump().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
} else if (command === "restore") {
  restore(arg).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  console.error("Usage:\n  node scripts/migrateData.js dump > dump.sql\n  node scripts/migrateData.js restore dump.sql");
  process.exitCode = 1;
}
