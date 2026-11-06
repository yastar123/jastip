import dotenv from "dotenv";
import pg from "pg";
import { DEFAULT_CMS_DATA } from "../lib/cms-defaults";

dotenv.config();

const { Pool } = pg;

async function pushDatabase() {
  console.log("==========================================");
  console.log("  JASTIP ANGGUN JAYA — DATABASE PUSH (PostgreSQL)");
  console.log("==========================================");

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is required for db:push. Set it to the separate CMS database, never the read-only tracking database.",
    );
  }

  console.log("[INFO] Target configured through DATABASE_URL.");
  const pool = new Pool({ connectionString, connectionTimeoutMillis: 8000 });

  try {
    console.log("[INFO] Connecting to PostgreSQL database...");
    const client = await pool.connect();

    try {
      console.log("[INFO] Pushing schema: creating tables if not exists...");

      // 1. Table cms_content
      await client.query(`
        CREATE TABLE IF NOT EXISTS cms_content (
          id VARCHAR(64) PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log("  ✓ Table 'cms_content' ready.");

      // 2. Table shipments
      await client.query(`
        CREATE TABLE IF NOT EXISTS shipments (
          resi VARCHAR(64) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          service VARCHAR(100) NOT NULL,
          route VARCHAR(255) NOT NULL,
          weight VARCHAR(100) NOT NULL,
          price INTEGER NOT NULL,
          status VARCHAR(255) NOT NULL,
          stage VARCHAR(64) NOT NULL,
          updated VARCHAR(100) NOT NULL,
          timeline JSONB NOT NULL
        );
      `);
      console.log("  ✓ Table 'shipments' ready.");

      // 3. Seed CMS data if not present
      const res = await client.query("SELECT data FROM cms_content WHERE id = 'main'");
      if (res.rows.length === 0) {
        console.log("[INFO] Seeding initial CMS data into 'cms_content'...");
        await client.query(
          "INSERT INTO cms_content (id, data) VALUES ('main', $1) ON CONFLICT (id) DO NOTHING",
          [JSON.stringify(DEFAULT_CMS_DATA)],
        );
        console.log("  ✓ Initial CMS content seeded successfully.");
      } else {
        console.log("  ✓ CMS content record already present.");
      }

      // 4. Seed Shipments if not present
      const shipRes = await client.query("SELECT COUNT(*) FROM shipments");
      const count = Number(shipRes.rows[0]?.count || 0);
      if (count === 0) {
        console.log("[INFO] Seeding initial shipments...");
        for (const s of DEFAULT_CMS_DATA.shipments) {
          await client.query(
            `INSERT INTO shipments (resi, name, service, route, weight, price, status, stage, updated, timeline)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (resi) DO NOTHING`,
            [
              s.resi,
              s.name,
              s.service,
              s.route,
              s.weight,
              s.price,
              s.status,
              s.stage,
              s.updated,
              JSON.stringify(s.timeline),
            ],
          );
        }
        console.log(`  ✓ Seeded ${DEFAULT_CMS_DATA.shipments.length} shipments.`);
      } else {
        console.log(`  ✓ Found ${count} shipments in database.`);
      }

      console.log("==========================================");
      console.log("  DATABASE PUSH SUCCESSFUL! (PostgreSQL Synchronized)");
      console.log("==========================================");
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Could not push CMS database schema:", errorMsg);
    throw err;
  } finally {
    await pool.end();
  }
}

pushDatabase().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
