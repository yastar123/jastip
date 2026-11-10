import dotenv from "dotenv";
import pg from "pg";
import fs from "node:fs";
import path from "node:path";
import { type AppCMSData } from "../lib/cms-types";
import { DEFAULT_CMS_DATA } from "../lib/cms-defaults";
import { type PublicTrackingResult } from "../lib/tracking";
import { findResisByCustomerNameInGoogleSheet, isResiInGoogleSheet } from "./google-sheets";

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
  customer_name: string;
  package_number: string | null;
  package_date: string | null;
  last_updated: string | null;
  service_type: string | null;
  route: string | null;
  last_location: string | null;
  real_weight: string | null;
  volume_weight: string | null;
  billable_weight: string | null;
  total_shipping: string | null;
  all_picked_up: boolean;
  arrived_at_destination: boolean;
};

type PublicPackageQuery = (text: string, values: string[]) => Promise<{ rows: PublicPackageRow[] }>;

export function resolveServiceRoute(
  serviceType: string | null,
  services: readonly Pick<AppCMSData["services"][number], "name" | "route">[],
): string | null {
  if (!serviceType) return null;

  const normalize = (value: string) => value.trim().toLowerCase().replace(/\+$/, "").trim();
  const normalizedServiceType = normalize(serviceType);
  return (
    services.find((service) => normalize(service.name) === normalizedServiceType)?.route ?? null
  );
}

async function queryPublicPackages(
  filter: "name" | "resi",
  value: string,
  queryOverride?: PublicPackageQuery,
): Promise<PublicPackageRow[]> {
  let query = queryOverride;
  if (!query) {
    const pool = getTrackingDatabasePool();
    if (!pool) {
      throw new Error("TRACKING_DATABASE_URL is not configured");
    }
    query = (text, values) => pool.query<PublicPackageRow>(text, values);
  }

  const filterSql =
    filter === "name"
      ? `LOWER(BTRIM(COALESCE(
           NULLIF(to_jsonb(packages)->>'customer_name', ''),
           NULLIF(to_jsonb(packages)->>'nama_konsumen', ''),
           NULLIF(to_jsonb(packages)->>'nama_pelanggan', ''),
           NULLIF(to_jsonb(packages)->>'nama', '')
         ))) = LOWER(BTRIM($1))`
      : `UPPER(BTRIM(COALESCE(
           NULLIF(to_jsonb(packages)->>'resi_number', ''),
           NULLIF(to_jsonb(packages)->>'barcode_number', ''),
           NULLIF(to_jsonb(packages)->>'barcode', ''),
           NULLIF(to_jsonb(packages)->>'kode_barcode', ''),
           NULLIF(to_jsonb(packages)->>'no_paket', ''),
           NULLIF(to_jsonb(packages)->>'package_number', '')
         ))) = UPPER(BTRIM($1))
         OR UPPER(BTRIM(COALESCE(
           NULLIF(BTRIM(to_jsonb(packages)->>'no_resi'), ''),
           NULLIF(BTRIM(to_jsonb(packages)->>'nomor_resi'), ''),
           NULLIF(BTRIM(to_jsonb(packages)->>'resi_ekspedisi'), ''),
           NULLIF(BTRIM(to_jsonb(packages)->>'tracking_number'), ''),
           NULLIF(BTRIM(to_jsonb(packages)->>'awb'), ''),
           NULLIF(BTRIM(to_jsonb(packages)->>'no_awb'), '')
         ))) = UPPER(BTRIM($1))`;
  const result = await query(
    `WITH matched_packages AS (
       SELECT to_jsonb(packages) AS package_data
       FROM packages
       WHERE ${filterSql}
     ),
     public_package_rows AS (
       SELECT
         UPPER(BTRIM(COALESCE(
           NULLIF(BTRIM(package_data->>'resi_number'), ''),
           NULLIF(BTRIM(package_data->>'barcode_number'), ''),
           NULLIF(BTRIM(package_data->>'barcode'), ''),
           NULLIF(BTRIM(package_data->>'kode_barcode'), ''),
           NULLIF(BTRIM(package_data->>'no_paket'), ''),
           NULLIF(BTRIM(package_data->>'package_number'), ''),
           NULLIF(BTRIM(package_data->>'no_resi'), ''),
           NULLIF(BTRIM(package_data->>'nomor_resi'), ''),
           NULLIF(BTRIM(package_data->>'resi_ekspedisi'), ''),
           NULLIF(BTRIM(package_data->>'tracking_number'), ''),
           NULLIF(BTRIM(package_data->>'awb'), ''),
           NULLIF(BTRIM(package_data->>'no_awb'), '')
         ))) AS resi_key,
         LOWER(BTRIM(COALESCE(
           NULLIF(BTRIM(package_data->>'customer_name'), ''),
           NULLIF(BTRIM(package_data->>'nama_konsumen'), ''),
           NULLIF(BTRIM(package_data->>'nama_pelanggan'), ''),
           NULLIF(BTRIM(package_data->>'nama'), '')
         ))) AS customer_key,
         BTRIM(COALESCE(
           NULLIF(BTRIM(package_data->>'resi_number'), ''),
           NULLIF(BTRIM(package_data->>'barcode_number'), ''),
           NULLIF(BTRIM(package_data->>'barcode'), ''),
           NULLIF(BTRIM(package_data->>'kode_barcode'), ''),
           NULLIF(BTRIM(package_data->>'no_paket'), ''),
           NULLIF(BTRIM(package_data->>'package_number'), ''),
           NULLIF(BTRIM(package_data->>'no_resi'), ''),
           NULLIF(BTRIM(package_data->>'nomor_resi'), ''),
           NULLIF(BTRIM(package_data->>'resi_ekspedisi'), ''),
           NULLIF(BTRIM(package_data->>'tracking_number'), ''),
           NULLIF(BTRIM(package_data->>'awb'), ''),
           NULLIF(BTRIM(package_data->>'no_awb'), '')
         )) AS resi,
         BTRIM(COALESCE(
           NULLIF(BTRIM(package_data->>'customer_name'), ''),
           NULLIF(BTRIM(package_data->>'nama_konsumen'), ''),
           NULLIF(BTRIM(package_data->>'nama_pelanggan'), ''),
           NULLIF(BTRIM(package_data->>'nama'), '')
         )) AS customer_name,
         COALESCE(
           NULLIF(BTRIM(package_data->>'no_paket'), ''),
           NULLIF(BTRIM(package_data->>'package_number'), ''),
           NULLIF(BTRIM(package_data->>'package_no'), ''),
           NULLIF(BTRIM(package_data->>'nomor_paket'), '')
         ) AS package_number,
         COALESCE(
           NULLIF(BTRIM(package_data->>'tanggal_tiba_gudang'), ''),
           NULLIF(BTRIM(package_data->>'tanggal_terima_gudang'), ''),
           NULLIF(BTRIM(package_data->>'tanggal_masuk'), ''),
           NULLIF(BTRIM(package_data->>'received_at'), ''),
           NULLIF(BTRIM(package_data->>'package_date'), ''),
           NULLIF(BTRIM(package_data->>'tanggal'), ''),
           NULLIF(BTRIM(package_data->>'tanggal_paket'), ''),
           NULLIF(BTRIM(package_data->>'created_at'), '')
         ) AS package_date,
         COALESCE(
           NULLIF(BTRIM(package_data->>'tanggal_update'), ''),
           NULLIF(BTRIM(package_data->>'last_updated'), ''),
           NULLIF(BTRIM(package_data->>'updated_at'), ''),
           NULLIF(BTRIM(package_data->>'updated'), ''),
           NULLIF(BTRIM(package_data->>'tanggal'), ''),
           NULLIF(BTRIM(package_data->>'package_date'), '')
         ) AS last_updated,
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
           COALESCE(
             NULLIF(BTRIM(package_data->>'lokasi_terakhir'), ''),
             NULLIF(BTRIM(package_data->>'last_location'), ''),
             NULLIF(BTRIM(package_data->>'current_location'), ''),
             NULLIF(BTRIM(package_data->>'lokasi'), ''),
             NULLIF(BTRIM(package_data->>'location'), ''),
             NULLIF(BTRIM(package_data->>'kota_terakhir'), ''),
             NULLIF(BTRIM(package_data->>'current_city'), '')
           ) AS last_location,
         NULLIF(REPLACE(REGEXP_REPLACE(COALESCE(
           NULLIF(package_data->>'berat_real', ''),
           NULLIF(package_data->>'real_weight', ''),
           NULLIF(package_data->>'weight_real', ''),
           NULLIF(package_data->>'berat_aktual', ''),
           NULLIF(package_data->>'berat', '')
         ), '[^0-9,.-]', '', 'g'), ',', '.'), '')::numeric AS real_weight,
         NULLIF(REPLACE(REGEXP_REPLACE(COALESCE(
           NULLIF(package_data->>'berat_volume', ''),
           NULLIF(package_data->>'volume_weight', ''),
           NULLIF(package_data->>'weight_volume', ''),
           NULLIF(package_data->>'berat_volumetrik', '')
         ), '[^0-9,.-]', '', 'g'), ',', '.'), '')::numeric AS volume_weight,
         NULLIF(REPLACE(REGEXP_REPLACE(COALESCE(
           NULLIF(package_data->>'berat_digunakan', ''),
           NULLIF(package_data->>'used_weight', ''),
           NULLIF(package_data->>'chargeable_weight', ''),
           NULLIF(package_data->>'berat_tagihan', ''),
           NULLIF(package_data->>'berat_dipakai', '')
         ), '[^0-9,.-]', '', 'g'), ',', '.'), '')::numeric AS billable_weight,
         CASE
           WHEN COALESCE(
             NULLIF(BTRIM(package_data->>'total_ongkir'), ''),
             NULLIF(BTRIM(package_data->>'total_shipping'), ''),
             NULLIF(BTRIM(package_data->>'ongkir'), ''),
             NULLIF(BTRIM(package_data->>'shipping_cost'), ''),
             NULLIF(BTRIM(package_data->>'biaya_pengiriman'), '')
           ) ~ '^[0-9]{1,3}([.,][0-9]{3})+$'
           THEN REGEXP_REPLACE(
             COALESCE(
               NULLIF(BTRIM(package_data->>'total_ongkir'), ''),
               NULLIF(BTRIM(package_data->>'total_shipping'), ''),
               NULLIF(BTRIM(package_data->>'ongkir'), ''),
               NULLIF(BTRIM(package_data->>'shipping_cost'), ''),
               NULLIF(BTRIM(package_data->>'biaya_pengiriman'), '')
             ),
             '[.,]', '', 'g'
           )::numeric
           ELSE NULLIF(REPLACE(REGEXP_REPLACE(COALESCE(
             NULLIF(BTRIM(package_data->>'total_ongkir'), ''),
             NULLIF(BTRIM(package_data->>'total_shipping'), ''),
             NULLIF(BTRIM(package_data->>'ongkir'), ''),
             NULLIF(BTRIM(package_data->>'shipping_cost'), ''),
             NULLIF(BTRIM(package_data->>'biaya_pengiriman'), '')
           ), '[^0-9,.-]', '', 'g'), ',', '.'), '')::numeric
         END AS total_shipping,
         UPPER(REPLACE(REPLACE(BTRIM(COALESCE(
           NULLIF(package_data->>'status_pengambilan', ''),
           NULLIF(package_data->>'status_pembayaran', ''),
           NULLIF(package_data->>'status_bayar', ''),
           NULLIF(package_data->>'payment_status', ''),
           NULLIF(package_data->>'status', ''),
           ''
         )), ' ', '_'), '-', '_'))
           IN ('SUDAH_DIAMBIL', 'SUDAH_DIBAYAR', 'SUDAH_DI_BAYAR', 'LUNAS', 'PAID') AS picked_up,
         UPPER(REPLACE(BTRIM(COALESCE(
           NULLIF(package_data->>'status_verifikasi', ''),
           NULLIF(package_data->>'verification_status', ''),
           NULLIF(package_data->>'status_kedatangan', ''),
           NULLIF(package_data->>'arrival_status', ''),
           ''
         )), ' ', '_'))
           IN ('SUDAH_DIVERIFIKASI', 'TIBA_DI_MANOKWARI') AS arrived_at_destination
       FROM matched_packages
     )
     SELECT
       MIN(resi) AS resi,
       MIN(customer_name) AS customer_name,
       MIN(package_number) AS package_number,
       MIN(package_date) AS package_date,
       MAX(last_updated) AS last_updated,
       MIN(service_type) AS service_type,
       MIN(route) AS route,
       MIN(last_location) AS last_location,
       CASE WHEN COUNT(real_weight) = 0 THEN NULL ELSE SUM(real_weight)::text END AS real_weight,
       CASE WHEN COUNT(volume_weight) = 0 THEN NULL ELSE SUM(volume_weight)::text END AS volume_weight,
       CASE WHEN COUNT(billable_weight) = 0 THEN NULL ELSE SUM(billable_weight)::text END AS billable_weight,
       BOOL_AND(picked_up) AS all_picked_up,
       BOOL_AND(arrived_at_destination OR picked_up) AS arrived_at_destination,
       CASE
         WHEN BOOL_AND(arrived_at_destination OR picked_up) AND COUNT(total_shipping) > 0
         THEN SUM(total_shipping)::text
         ELSE NULL
       END AS total_shipping
     FROM public_package_rows
     GROUP BY resi_key, customer_key
     ORDER BY MAX(last_updated) DESC NULLS LAST, resi_key`,
    [value.trim()],
  );
  return result.rows;
}

async function mapPublicPackage(
  row: PublicPackageRow,
  includeDetails: boolean,
): Promise<PublicTrackingResult> {
  const arrivedAtDestination = row.arrived_at_destination || row.all_picked_up;
  const status = row.all_picked_up
    ? "Sudah Diambil"
    : arrivedAtDestination
      ? "Bisa Diambil"
      : "Dalam Perjalanan";
  const route =
    row.route ??
    (row.service_type
      ? resolveServiceRoute(row.service_type, (await getCMSData()).services)
      : null);

  return {
    resi: row.resi,
    customerName: includeDetails && arrivedAtDestination ? row.customer_name : null,
    packageNumber: row.package_number,
    packageDate: row.package_date,
    lastUpdated: row.last_updated,
    serviceType: row.service_type,
    route,
    lastLocation: arrivedAtDestination
      ? "Manokwari"
      : "Gudang Jastip / Dalam Perjalanan ke Manokwari",
    realWeight: includeDetails && arrivedAtDestination ? row.real_weight : null,
    volumeWeight: includeDetails && arrivedAtDestination ? row.volume_weight : null,
    billableWeight: includeDetails && arrivedAtDestination ? row.billable_weight : null,
    totalShipping: includeDetails && arrivedAtDestination ? row.total_shipping : null,
    arrivedAtDestination,
    pickedUp: row.all_picked_up,
    status,
  };
}

export async function findPublicPackagesByName(
  name: string,
  queryOverride?: PublicPackageQuery,
  sheetNameLookup: (value: string) => Promise<string[]> = findResisByCustomerNameInGoogleSheet,
): Promise<PublicTrackingResult[]> {
  if (!name.trim()) return [];
  const rows = await queryPublicPackages("name", name, queryOverride);
  const databaseResults = await Promise.all(rows.map((row) => mapPublicPackage(row, true)));
  const knownResis = new Set(databaseResults.map((result) => result.resi.trim().toUpperCase()));
  const sheetResis = await sheetNameLookup(name);
  const sheetResults = sheetResis
    .filter((resi) => !knownResis.has(resi.trim().toUpperCase()))
    .map((resi): PublicTrackingResult => ({
      resi,
      customerName: null,
      packageNumber: null,
      packageDate: null,
      lastUpdated: null,
      serviceType: null,
      route: null,
      lastLocation: "Gudang Jastip / Dalam Perjalanan ke Manokwari",
      realWeight: null,
      volumeWeight: null,
      billableWeight: null,
      totalShipping: null,
      arrivedAtDestination: false,
      pickedUp: false,
      status: "Dalam Perjalanan",
    }));
  return [...databaseResults, ...sheetResults];
}

export async function findPublicPackageByResi(
  resi: string,
  queryOverride?: PublicPackageQuery,
  sheetLookupOverride: (value: string) => Promise<boolean> = isResiInGoogleSheet,
): Promise<PublicTrackingResult | null> {
  if (!resi.trim()) return null;
  const rows = await queryPublicPackages("resi", resi, queryOverride);
  if (rows.length === 1) return await mapPublicPackage(rows[0]!, true);
  if (rows.length > 1 || !(await sheetLookupOverride(resi))) return null;
  return {
    resi: resi.trim(),
    customerName: null,
    packageNumber: null,
    packageDate: null,
    lastUpdated: null,
    serviceType: null,
    route: null,
    lastLocation: "Gudang Jastip / Dalam Perjalanan ke Manokwari",
    realWeight: null,
    volumeWeight: null,
    billableWeight: null,
    totalShipping: null,
    arrivedAtDestination: false,
    pickedUp: false,
    status: "Dalam Perjalanan",
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
