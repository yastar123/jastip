import dotenv from "dotenv";
import pg from "pg";
import fs from "node:fs";
import path from "node:path";
import { type AppCMSData } from "../lib/cms-types";
import { DEFAULT_CMS_DATA } from "../lib/cms-defaults";
import { type PublicTrackingResult } from "../lib/tracking";

dotenv.config();

const { Pool } = pg;

// Global persistent cache
let isPgConnected = false;
let pgPool: pg.Pool | null = null;
let trackingPool: pg.Pool | null = null;

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

  const connectionString = process.env.DATABASE_URL;

  if (connectionString) {
    try {
      pgPool = new Pool({ connectionString, connectionTimeoutMillis: 5000 });

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

function getTrackingDatabasePool(): pg.Pool | null {
  if (trackingPool) return trackingPool;
  const connectionString = process.env.TRACKING_DATABASE_URL;
  if (!connectionString) return null;

  trackingPool = new Pool({
    connectionString,
    connectionTimeoutMillis: 5000,
    options: "-c default_transaction_read_only=on",
    max: 5,
  });
  trackingPool.on("error", (err) => {
    console.error("Tracking database connection error:", err.message);
  });
  return trackingPool;
}

export async function isTrackingDatabaseAvailable(): Promise<boolean> {
  const pool = getTrackingDatabasePool();
  if (!pool) return false;
  try {
    await pool.query("SELECT 1");
    return true;
  } catch (err) {
    console.error("Tracking database health check failed:", err);
    return false;
  }
}

type PublicPackageRow = {
  resi: string;
  package_number: string | null;
  package_date: string | null;
  service_type: string | null;
  route: string | null;
  real_weight: string | null;
  volume_weight: string | null;
  billable_weight: string | null;
  additional_fee_description: string | null;
  all_picked_up: boolean;
  all_verified: boolean;
};

type PublicPackageQuery = (
  text: string,
  values: (string | null)[],
) => Promise<{ rows: PublicPackageRow[] }>;

export async function findPublicPackage(
  name: string | undefined,
  resi: string,
  queryOverride?: PublicPackageQuery,
): Promise<PublicTrackingResult | null> {
  let query = queryOverride;
  if (!query) {
    const pool = getTrackingDatabasePool();
    if (!pool) {
      throw new Error("TRACKING_DATABASE_URL is not configured");
    }
    query = (text, values) => pool.query<PublicPackageRow>(text, values);
  }

  const result = await query(
    `WITH matched_packages AS (
       SELECT packages.*, to_jsonb(packages) AS package_data
       FROM packages
       WHERE UPPER(BTRIM(resi_number)) = UPPER(BTRIM($1))
         AND ($2::text IS NULL OR LOWER(BTRIM(customer_name)) = LOWER(BTRIM($2)))
     ),
     public_package_rows AS (
       SELECT
         UPPER(BTRIM(resi_number)) AS resi_key,
         LOWER(BTRIM(customer_name)) AS customer_key,
         BTRIM(resi_number) AS resi,
         COALESCE(
           NULLIF(BTRIM(package_data->>'no_paket'), ''),
           NULLIF(BTRIM(package_data->>'package_number'), ''),
           NULLIF(BTRIM(package_data->>'package_no'), ''),
           NULLIF(BTRIM(package_data->>'nomor_paket'), '')
         ) AS package_number,
         COALESCE(
           NULLIF(BTRIM(package_data->>'tanggal'), ''),
           NULLIF(BTRIM(package_data->>'tanggal_paket'), ''),
           NULLIF(BTRIM(package_data->>'tanggal_masuk'), ''),
           NULLIF(BTRIM(package_data->>'package_date'), ''),
           NULLIF(BTRIM(package_data->>'created_at'), '')
         ) AS package_date,
         COALESCE(
           NULLIF(BTRIM(package_data->>'jenis_jastip'), ''),
           NULLIF(BTRIM(package_data->>'service_type'), ''),
           NULLIF(BTRIM(package_data->>'jenis'), ''),
           NULLIF(BTRIM(package_data->>'tipe_jastip'), '')
         ) AS service_type,
         COALESCE(
           NULLIF(BTRIM(package_data->>'rute_pengiriman'), ''),
           NULLIF(BTRIM(package_data->>'rute'), ''),
           NULLIF(BTRIM(package_data->>'route'), ''),
           NULLIF(CONCAT_WS(' → ',
             NULLIF(COALESCE(package_data->>'asal', package_data->>'origin', package_data->>'kota_asal'), ''),
             NULLIF(COALESCE(package_data->>'tujuan', package_data->>'destination', package_data->>'kota_tujuan'), '')
           ), '')
         ) AS route,
         NULLIF(REPLACE(COALESCE(
           NULLIF(package_data->>'berat_real', ''),
           NULLIF(package_data->>'real_weight', ''),
           NULLIF(package_data->>'weight_real', ''),
           NULLIF(package_data->>'berat_aktual', ''),
           NULLIF(package_data->>'berat', '')
         ), ',', '.'), '')::numeric AS real_weight,
         NULLIF(REPLACE(COALESCE(
           NULLIF(package_data->>'berat_volume', ''),
           NULLIF(package_data->>'volume_weight', ''),
           NULLIF(package_data->>'weight_volume', ''),
           NULLIF(package_data->>'berat_volumetrik', '')
         ), ',', '.'), '')::numeric AS volume_weight,
         NULLIF(REPLACE(COALESCE(
           NULLIF(package_data->>'berat_digunakan', ''),
           NULLIF(package_data->>'used_weight', ''),
           NULLIF(package_data->>'chargeable_weight', ''),
           NULLIF(package_data->>'berat_tagihan', ''),
           NULLIF(package_data->>'berat_dipakai', '')
         ), ',', '.'), '')::numeric AS billable_weight,
         COALESCE(
           NULLIF(BTRIM(package_data->>'keterangan_biaya_tambahan'), ''),
           NULLIF(BTRIM(package_data->>'additional_fee_description'), ''),
           NULLIF(BTRIM(package_data->>'catatan_biaya_tambahan'), '')
         ) AS additional_fee_description,
         UPPER(BTRIM(COALESCE(status_pengambilan, ''))) = 'SUDAH_DIAMBIL' AS picked_up,
         UPPER(BTRIM(COALESCE(status_verifikasi, ''))) = 'SUDAH_DIVERIFIKASI' AS verified
       FROM matched_packages
     )
     SELECT
       MIN(resi) AS resi,
       MIN(package_number) AS package_number,
       MIN(package_date) AS package_date,
       MIN(service_type) AS service_type,
       MIN(route) AS route,
       CASE WHEN COUNT(real_weight) = 0 THEN NULL ELSE SUM(real_weight)::text END AS real_weight,
       CASE WHEN COUNT(volume_weight) = 0 THEN NULL ELSE SUM(volume_weight)::text END AS volume_weight,
       CASE WHEN COUNT(billable_weight) = 0 THEN NULL ELSE SUM(billable_weight)::text END AS billable_weight,
       MIN(additional_fee_description) AS additional_fee_description,
       BOOL_AND(picked_up) AS all_picked_up,
       BOOL_AND(verified) AS all_verified
     FROM public_package_rows
     GROUP BY resi_key, customer_key
       ORDER BY resi_key, customer_key
       LIMIT 2`,
    [resi, name?.trim() || null],
  );
  if (!name && result.rows.length > 1) return null;
  const row = result.rows[0];
  if (!row) return null;

  const status = row.all_picked_up
    ? "Paket sudah diambil"
    : row.all_verified
      ? "Paket tiba di gudang"
      : "Paket dalam proses pengiriman";

  return {
    resi: row.resi,
    packageNumber: row.package_number,
    packageDate: row.package_date,
    serviceType: row.service_type,
    route: row.route,
    realWeight: row.real_weight,
    volumeWeight: row.volume_weight,
    billableWeight: row.billable_weight,
    additionalFeeDescription: row.additional_fee_description,
    status,
  };
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
