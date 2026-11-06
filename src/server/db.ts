import dotenv from "dotenv";
import pg from "pg";
import fs from "node:fs";
import path from "node:path";
import { type AppCMSData } from "../lib/cms-types";
import { DEFAULT_CMS_DATA } from "../lib/cms-defaults";

dotenv.config();

const { Pool } = pg;

// Global persistent cache
let isPgConnected = false;
let pgPool: pg.Pool | null = null;

const DATA_DIR = path.resolve(process.cwd(), "data");
const FALLBACK_FILE = path.join(DATA_DIR, "cms-data.json");

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn("Could not create data directory, using in-memory:", err);
  }
}

function loadFromFile(): AppCMSData {
  try {
    ensureDataDir();
    if (fs.existsSync(FALLBACK_FILE)) {
      const raw = fs.readFileSync(FALLBACK_FILE, "utf-8");
      return JSON.parse(raw) as AppCMSData;
    }
  } catch (err) {
    console.warn("Failed reading fallback file:", err);
  }
  return DEFAULT_CMS_DATA;
}

function saveToFile(data: AppCMSData) {
  try {
    ensureDataDir();
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.warn("Failed saving fallback file:", err);
  }
}

let inMemoryData: AppCMSData = loadFromFile();

export function getDatabasePool(): pg.Pool | null {
  if (pgPool) return pgPool;

  const connectionString =
    process.env.DATABASE_URL ||
    (process.env.SQL_USER && process.env.SQL_HOST
      ? `postgresql://${process.env.SQL_USER}:${process.env.SQL_PASSWORD || ""}@${process.env.SQL_HOST}/${process.env.SQL_DB_NAME || "postgres"}`
      : undefined);

  if (connectionString || (process.env.PGHOST && process.env.PGDATABASE)) {
    try {
      pgPool = new Pool(
        connectionString
          ? { connectionString, connectionTimeoutMillis: 5000 }
          : {
              host: process.env.PGHOST,
              port: Number(process.env.PGPORT || 5432),
              user: process.env.PGUSER,
              password: process.env.PGPASSWORD,
              database: process.env.PGDATABASE,
              connectionTimeoutMillis: 5000,
            },
      );

      pgPool.on("error", (err) => {
        console.warn("PostgreSQL idle client error (falling back to storage):", err.message);
        isPgConnected = false;
      });
    } catch (err) {
      console.warn("PostgreSQL initialization skipped:", err);
      pgPool = null;
    }
  }

  return pgPool;
}

export async function initDatabase() {
  const pool = getDatabasePool();
  if (!pool) {
    return { type: "file/in-memory", connected: true };
  }

  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS cms_content (
          id VARCHAR(64) PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

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

      // Seed if empty
      const res = await client.query("SELECT data FROM cms_content WHERE id = 'main'");
      if (res.rows.length === 0) {
        await client.query(
          "INSERT INTO cms_content (id, data) VALUES ('main', $1) ON CONFLICT (id) DO NOTHING",
          [JSON.stringify(inMemoryData)],
        );
      }

      isPgConnected = true;
      return { type: "postgresql", connected: true };
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn("PostgreSQL connection check failed, using persistent local store:", errorMsg);
    isPgConnected = false;
    return { type: "file/in-memory", connected: true, notice: errorMsg };
  }
}

export async function getCMSData(): Promise<AppCMSData> {
  const pool = getDatabasePool();
  if (pool && isPgConnected) {
    try {
      const res = await pool.query("SELECT data FROM cms_content WHERE id = 'main'");
      if (res.rows.length > 0 && res.rows[0]?.data) {
        return res.rows[0].data as AppCMSData;
      }
    } catch (err) {
      console.warn("Error querying PostgreSQL, using in-memory fallback:", err);
    }
  }
  return inMemoryData;
}

export async function saveCMSData(data: AppCMSData): Promise<AppCMSData> {
  inMemoryData = data;
  saveToFile(data);

  const pool = getDatabasePool();
  if (pool && isPgConnected) {
    try {
      await pool.query(
        `INSERT INTO cms_content (id, data, updated_at) 
         VALUES ('main', $1, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET data = $1, updated_at = CURRENT_TIMESTAMP`,
        [JSON.stringify(data)],
      );
    } catch (err) {
      console.warn("Failed saving to PostgreSQL, kept in local fallback:", err);
    }
  }
  return inMemoryData;
}

export async function resetCMSDataToDefault(): Promise<AppCMSData> {
  return await saveCMSData(DEFAULT_CMS_DATA);
}

export function getDatabaseStatus() {
  return {
    engine: isPgConnected ? "PostgreSQL" : "In-Memory / Local JSON Store",
    isPostgresConnected: isPgConnected,
    fallbackActive: !isPgConnected,
  };
}
