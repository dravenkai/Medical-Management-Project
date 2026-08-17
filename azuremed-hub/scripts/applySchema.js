// Applies config/azuremed_schema.sql against the configured MySQL server.
// Run with: npm run db:schema
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

// `ADD COLUMN IF NOT EXISTS` / `DROP COLUMN IF EXISTS` / `ADD INDEX IF NOT
// EXISTS` are MariaDB-only extensions — real MySQL (e.g. Railway's managed
// MySQL, vs. this project's local MariaDB dev setup) rejects that syntax
// outright with a parse error, not a graceful no-op. information_schema
// checks work identically on both, so every column/index change below is
// guarded that way instead of relying on the shortcut syntax.
async function columnExists(connection, table, column) {
  const [[{ n }]] = await connection.query(
    `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return n > 0;
}

async function indexExists(connection, table, indexName) {
  const [[{ n }]] = await connection.query(
    `SELECT COUNT(*) AS n FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [table, indexName]
  );
  return n > 0;
}

async function constraintExists(connection, table, constraintName) {
  const [[{ n }]] = await connection.query(
    `SELECT COUNT(*) AS n FROM information_schema.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = ?`,
    [table, constraintName]
  );
  return n > 0;
}

async function tableExists(connection, table) {
  const [[{ n }]] = await connection.query(
    `SELECT COUNT(*) AS n FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table]
  );
  return n > 0;
}

async function addColumnIfMissing(connection, table, column, definition) {
  if (!(await tableExists(connection, table))) return; // fresh install — CREATE TABLE below already has every column
  if (await columnExists(connection, table, column)) return;
  await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
}

async function dropColumnIfPresent(connection, table, column) {
  if (!(await tableExists(connection, table))) return;
  if (!(await columnExists(connection, table, column))) return;
  await connection.query(`ALTER TABLE \`${table}\` DROP COLUMN \`${column}\``);
}

async function addIndexIfMissing(connection, table, indexName, columns) {
  if (!(await tableExists(connection, table))) return;
  if (await indexExists(connection, table, indexName)) return;
  await connection.query(`ALTER TABLE \`${table}\` ADD INDEX \`${indexName}\` (${columns})`);
}

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, "..", "config", "azuremed_schema.sql"), "utf8");

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    multipleStatements: true,
  });

  // schema.sql's own "CREATE DATABASE IF NOT EXISTS" + "USE" only take
  // effect once the `sql` blob below runs — the pre-emptive ALTER right
  // after this needs a database selected on the connection already, hence
  // this explicit USE (harmless no-op once schema.sql's own USE runs too).
  await connection.query(`USE ${process.env.DB_NAME || "azuremed_hub"}`).catch(() => {});

  // store_settings.free_delivery_threshold_ks needs to exist BEFORE the
  // schema.sql blob below runs, because that blob's own INSERT IGNORE seed
  // row references it by name — on this already-existing table (unlike a
  // fresh install, where CREATE TABLE below already includes the column)
  // that INSERT fails with "Unknown column" otherwise. addColumnIfMissing
  // is itself a no-op on a fresh install (table doesn't exist yet).
  await addColumnIfMissing(
    connection,
    "store_settings",
    "free_delivery_threshold_ks",
    "INT NOT NULL DEFAULT 30000 AFTER delivery_fee_ks"
  );

  await connection.query(sql);

  // `CREATE TABLE IF NOT EXISTS` in azuremed_schema.sql is a no-op against a
  // table that already exists, so columns added to the schema file after a
  // table's first creation never actually land on a live database — this
  // silently happened with orders.payment_proof_url/payment_status. Until
  // there's a real migration system, additive column changes get an
  // idempotent guarded ALTER here so re-running this script actually
  // catches existing DBs up.
  await addColumnIfMissing(connection, "orders", "payment_proof_url", "TEXT NULL AFTER status");
  await addColumnIfMissing(
    connection,
    "orders",
    "payment_status",
    "ENUM('not_required','pending_review','confirmed','rejected') NOT NULL DEFAULT 'not_required' AFTER payment_proof_url"
  );
  // 2FA/TOTP feature (Security page + /api/account/2fa/*) was removed
  // entirely — drop the now-dead columns rather than leave them as unused
  // schema cruft. Safe to re-run: no-ops once already gone.
  await dropColumnIfPresent(connection, "users", "totp_secret");
  await dropColumnIfPresent(connection, "users", "totp_enabled");

  await addColumnIfMissing(connection, "orders", "delivery_fee_ks", "INT NOT NULL DEFAULT 0 AFTER tax_ks");
  await addColumnIfMissing(connection, "orders", "discount_ks", "INT NOT NULL DEFAULT 0 AFTER delivery_fee_ks");
  await addColumnIfMissing(connection, "orders", "promo_code", "VARCHAR(50) NULL AFTER discount_ks");
  if (await tableExists(connection, "orders")) {
    await connection.query(`
      ALTER TABLE orders MODIFY COLUMN status ENUM('pending','confirmed','processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending'
    `);
  }

  // users.role: 'owner' -> 'admin' rename. A straight MODIFY COLUMN to an
  // ENUM that no longer includes 'owner' would fail/truncate any existing
  // 'owner' rows, so this widens the ENUM first, migrates the data, then
  // narrows it — each step is safe to re-run (no-op once already migrated).
  if (await tableExists(connection, "users")) {
    await connection.query(`
      ALTER TABLE users MODIFY COLUMN role ENUM('owner','admin','staff','agent','user') NOT NULL DEFAULT 'user'
    `);
    await connection.query(`UPDATE users SET role = 'admin' WHERE role = 'owner'`);
    await connection.query(`
      ALTER TABLE users MODIFY COLUMN role ENUM('admin','staff','agent','user') NOT NULL DEFAULT 'user'
    `);
  }

  await addColumnIfMissing(connection, "advertisements", "description", "VARCHAR(500) NULL AFTER title");
  await addColumnIfMissing(connection, "advertisements", "title_my", "VARCHAR(255) NULL AFTER description");
  await addColumnIfMissing(connection, "advertisements", "description_my", "VARCHAR(500) NULL AFTER title_my");

  // reviews.user_id: lets a real customer submit/edit their own testimonial
  // (as opposed to the original owner-seeded demo rows, which stay NULL).
  await addColumnIfMissing(connection, "reviews", "user_id", "INT NULL AFTER id");
  if ((await tableExists(connection, "reviews")) && !(await constraintExists(connection, "reviews", "uq_reviews_user"))) {
    await connection.query(`
      ALTER TABLE reviews
        ADD CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        ADD CONSTRAINT uq_reviews_user UNIQUE (user_id)
    `);
  }
  if ((await tableExists(connection, "reviews")) && !(await constraintExists(connection, "reviews", "chk_reviews_rating"))) {
    await connection.query(`ALTER TABLE reviews ADD CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5)`);
  }

  // medicalbot Telegram bot integration — lets a support query submitted via
  // Telegram (no website session) still record who actually asked. See the
  // CREATE TABLE customer_queries comment above and lib/telegramBot.ts.
  await addColumnIfMissing(connection, "customer_queries", "telegram_chat_id", "BIGINT NULL AFTER responded_at");
  await addColumnIfMissing(
    connection,
    "customer_queries",
    "telegram_username",
    "VARCHAR(255) NULL AFTER telegram_chat_id"
  );
  await addIndexIfMissing(connection, "customer_queries", "idx_customer_queries_telegram_chat", "telegram_chat_id");

  // staff_todos/staff_attendance (personal task list + check-in/out on the
  // Staff dashboard) — feature removed, not just hidden.
  await connection.query(`DROP TABLE IF EXISTS staff_todos`);
  await connection.query(`DROP TABLE IF EXISTS staff_attendance`);

  // Cart stock reservations (hold stock for 15 min after add-to-cart without
  // touching the real stock_qty count) — see the comments on these columns
  // in azuremed_schema.sql and lib/cartReservation.ts.
  await addColumnIfMissing(connection, "medicines", "reserved_qty", "INT NOT NULL DEFAULT 0 AFTER stock_qty");
  await addColumnIfMissing(connection, "cart_items", "reserved_until", "DATETIME NULL AFTER qty");
  await addIndexIfMissing(connection, "cart_items", "idx_cart_reserved_until", "reserved_until");

  // Answer-tickets-from-Telegram feature — an admin/staff account links
  // their Telegram (users.telegram_chat_id) to reply to customer questions
  // straight from the medicalbot chat instead of /staff/queries. See
  // app/api/support/telegram/answer/route.ts and lib/telegramNotify.ts.
  await addColumnIfMissing(connection, "users", "telegram_chat_id", "BIGINT NULL AFTER is_active");
  if ((await tableExists(connection, "users")) && !(await constraintExists(connection, "users", "uq_users_telegram_chat_id"))) {
    await connection.query(`ALTER TABLE users ADD CONSTRAINT uq_users_telegram_chat_id UNIQUE (telegram_chat_id)`);
  }
  // staff_notify_message_id: dropped almost immediately after being added —
  // the original design required staff to reply to a specific Telegram
  // message to answer a ticket, which turned out to be confusing to
  // actually use. Replaced with a "✍️ Reply" button carrying the ticket id
  // directly (see app/api/support/telegram/route.ts), which needs no
  // message-id bookkeeping at all.
  await dropColumnIfPresent(connection, "customer_queries", "staff_notify_message_id");

  await connection.end();
  console.log("Schema applied.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
