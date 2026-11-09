const DEFAULT_SPREADSHEET_ID = "15PoD1RdeIh-zfXKm7SG8nzctLINGPYe5";
const DEFAULT_SHEET_GID = "2035133146";
const SHEET_CACHE_TTL_MS = 30_000;
const APPS_SCRIPT_REQUEST_TIMEOUT_MS = 30_000;
const GOOGLE_SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";

let cachedResis: Set<string> | null = null;
let cachedResisExpiresAt = 0;
let pendingResisRequest: Promise<Set<string>> | null = null;
let cachedAccessToken: string | null = null;
let cachedAccessTokenExpiresAt = 0;
const cachedAppsScriptLookups = new Map<string, { found: boolean; expiresAt: number }>();
const pendingAppsScriptLookups = new Map<string, Promise<boolean>>();
const cachedAppsScriptNameLookups = new Map<string, { resis: string[]; expiresAt: number }>();
const pendingAppsScriptNameLookups = new Map<string, Promise<string[]>>();

type ServiceAccountCredentials = {
  email: string;
  privateKey: string;
};

function getServiceAccountCredentials(): ServiceAccountCredentials | null {
  const email = process.env["GOOGLE_SERVICE_ACCOUNT_EMAIL"]?.trim();
  const privateKey = process.env["GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"]
    ?.replace(/\\n/g, "\n")
    .trim();

  if (!email && !privateKey) return null;
  if (!email || !privateKey) {
    throw new Error(
      "Google Sheets service account requires both GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.",
    );
  }
  return { email, privateKey };
}

function getAppsScriptConfig(): { url: string; token: string } | null {
  const url = process.env["GOOGLE_APPS_SCRIPT_URL"]?.trim();
  const token = process.env["GOOGLE_APPS_SCRIPT_TOKEN"]?.trim();

  if (!url && !token) return null;
  if (!url || !token) {
    throw new Error(
      "Google Apps Script tracking requires both GOOGLE_APPS_SCRIPT_URL and GOOGLE_APPS_SCRIPT_TOKEN.",
    );
  }
  return { url, token };
}

function normalizeResi(value: string): string {
  return value.trim().toUpperCase();
}

function normalizeHeader(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function encodeBase64Url(value: Uint8Array): string {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function findResiColumn(header: string[]): number {
  return header.findIndex((value) => {
    const normalized = normalizeHeader(value);
    return (
      normalized.includes("resi") ||
      normalized.includes("trackingnumber") ||
      normalized === "awb" ||
      normalized === "nomorawb" ||
      normalized === "barcode" ||
      normalized === "kodebarcode"
    );
  });
}

function extractResis(rows: string[][]): Set<string> {
  const resis = new Set<string>();
  let resiColumn = -1;
  for (const row of rows) {
    const headerColumn = findResiColumn(row);
    if (headerColumn >= 0) {
      resiColumn = headerColumn;
      continue;
    }
    if (resiColumn < 0) continue;

    const resi = normalizeResi(row[resiColumn] ?? "");
    if (resi) resis.add(resi);
  }
  if (resiColumn < 0) {
    throw new Error(
      "Google Sheets tracking tab needs a header such as Nomor Resi, No Resi, AWB, or Barcode.",
    );
  }
  return resis;
}

export function parseGoogleSheetsCsv(csv: string): Set<string> {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index]!;
    if (inQuotes) {
      if (char === '"' && csv[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"' && field.length === 0) {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && csv[index + 1] === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  if (rows[0]?.[0]?.startsWith("\uFEFF")) {
    rows[0][0] = rows[0][0].slice(1);
  }

  return extractResis(rows);
}

function parseGoogleSheetsValues(payload: unknown): Set<string> {
  if (!payload || typeof payload !== "object" || !("values" in payload)) {
    throw new Error("Google Sheets returned an invalid values response.");
  }
  const values = (payload as { values?: unknown }).values;
  if (!Array.isArray(values)) {
    throw new Error("Google Sheets returned an invalid values response.");
  }
  const rows = values.map((value) =>
    Array.isArray(value) ? value.map((cell) => String(cell ?? "")) : [],
  );
  return extractResis(rows);
}

async function getGoogleAccessToken(credentials: ServiceAccountCredentials): Promise<string> {
  if (cachedAccessToken && cachedAccessTokenExpiresAt > Date.now()) {
    return cachedAccessToken;
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const encoder = new TextEncoder();
  const unsignedAssertion = [
    encodeBase64Url(encoder.encode(JSON.stringify({ alg: "RS256", typ: "JWT" }))),
    encodeBase64Url(
      encoder.encode(
        JSON.stringify({
          iss: credentials.email,
          scope: GOOGLE_SHEETS_SCOPE,
          aud: "https://oauth2.googleapis.com/token",
          iat: issuedAt,
          exp: issuedAt + 3600,
        }),
      ),
    ),
  ].join(".");
  const encodedPrivateKey = credentials.privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");
  const privateKeyBytes = Uint8Array.from(atob(encodedPrivateKey), (char) => char.charCodeAt(0));
  const signingKey = await globalThis.crypto.subtle.importKey(
    "pkcs8",
    privateKeyBytes,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await globalThis.crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    signingKey,
    encoder.encode(unsignedAssertion),
  );
  const assertion = `${unsignedAssertion}.${encodeBase64Url(new Uint8Array(signature))}`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`Google service account authentication failed (${response.status}).`);
  }

  const payload = (await response.json()) as { access_token?: unknown; expires_in?: unknown };
  if (
    typeof payload.access_token !== "string" ||
    typeof payload.expires_in !== "number" ||
    !Number.isFinite(payload.expires_in)
  ) {
    throw new Error("Google service account returned an invalid access token.");
  }
  cachedAccessToken = payload.access_token;
  cachedAccessTokenExpiresAt = Date.now() + Math.max(payload.expires_in - 60, 0) * 1000;
  return cachedAccessToken;
}

async function fetchGoogleApiJson(url: URL, accessToken: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`Google Sheets API request failed (${response.status}).`);
  }
  return response.json();
}

async function readPrivateSheetResis(
  spreadsheetId: string,
  sheetGid: string,
  credentials: ServiceAccountCredentials,
): Promise<Set<string>> {
  const token = await getGoogleAccessToken(credentials);
  const spreadsheetUrl = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}`,
  );
  spreadsheetUrl.searchParams.set("fields", "sheets(properties(sheetId,title))");
  const spreadsheet = (await fetchGoogleApiJson(spreadsheetUrl, token)) as {
    sheets?: Array<{ properties?: { sheetId?: number; title?: string } }>;
  };
  const sheet = spreadsheet.sheets?.find(
    (item) => String(item.properties?.sheetId) === sheetGid && item.properties?.title,
  );
  if (!sheet?.properties?.title) {
    throw new Error(`Google Sheets tab ${sheetGid} was not found in the configured spreadsheet.`);
  }

  const range = `'${sheet.properties.title.replace(/'/g, "''")}'!A:AZ`;
  const valuesUrl = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`,
  );
  return parseGoogleSheetsValues(await fetchGoogleApiJson(valuesUrl, token));
}

async function readPublicSheetResis(spreadsheetId: string, sheetGid: string): Promise<Set<string>> {
  const url = new URL(
    `https://docs.google.com/spreadsheets/d/${encodeURIComponent(spreadsheetId)}/export`,
  );
  url.searchParams.set("format", "csv");
  url.searchParams.set("gid", sheetGid);
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) {
    throw new Error(
      `Google Sheet cannot be read (${response.status}). Share it with the configured service account or allow link viewing.`,
    );
  }
  const csv = await response.text();
  if (/^\s*<(?:!doctype|html)/i.test(csv)) {
    throw new Error(
      "Google Sheet returned a sign-in page. Share it with the configured service account or allow link viewing.",
    );
  }
  return parseGoogleSheetsCsv(csv);
}

async function readSheetResis(): Promise<Set<string>> {
  const spreadsheetId = process.env["GOOGLE_SHEETS_ID"]?.trim() || DEFAULT_SPREADSHEET_ID;
  const sheetGid = process.env["GOOGLE_SHEETS_GID"]?.trim() || DEFAULT_SHEET_GID;
  const credentials = getServiceAccountCredentials();
  return credentials
    ? readPrivateSheetResis(spreadsheetId, sheetGid, credentials)
    : readPublicSheetResis(spreadsheetId, sheetGid);
}

async function lookupAppsScript(
  resi: string,
  config: { url: string; token: string },
): Promise<boolean> {
  const response = await fetch(config.url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ resi, token: config.token }),
    signal: AbortSignal.timeout(APPS_SCRIPT_REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Google Apps Script tracking request failed (${response.status}).`);
  }

  const payload: unknown = await response.json();
  if (
    !payload ||
    typeof payload !== "object" ||
    !("ok" in payload) ||
    payload.ok !== true ||
    !("found" in payload) ||
    typeof payload.found !== "boolean"
  ) {
    throw new Error("Google Apps Script returned an invalid tracking response.");
  }
  return payload.found;
}

async function lookupAppsScriptName(
  name: string,
  config: { url: string; token: string },
): Promise<string[]> {
  const response = await fetch(config.url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ searchBy: "name", name, token: config.token }),
    signal: AbortSignal.timeout(APPS_SCRIPT_REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Google Apps Script tracking request failed (${response.status}).`);
  }

  const payload: unknown = await response.json();
  if (
    !payload ||
    typeof payload !== "object" ||
    !("ok" in payload) ||
    payload.ok !== true ||
    !("packages" in payload) ||
    !Array.isArray(payload.packages)
  ) {
    throw new Error("Google Apps Script returned an invalid name-search response.");
  }

  const resis: string[] = [];
  for (const item of payload.packages) {
    if (
      item &&
      typeof item === "object" &&
      "resi" in item &&
      typeof item.resi === "string" &&
      item.resi.trim()
    ) {
      resis.push(item.resi.trim());
    }
  }
  return resis;
}

async function getSheetResis(): Promise<Set<string>> {
  if (cachedResis && cachedResisExpiresAt > Date.now()) return cachedResis;
  if (pendingResisRequest) return pendingResisRequest;

  pendingResisRequest = readSheetResis()
    .then((resis) => {
      cachedResis = resis;
      cachedResisExpiresAt = Date.now() + SHEET_CACHE_TTL_MS;
      return resis;
    })
    .finally(() => {
      pendingResisRequest = null;
    });
  return pendingResisRequest;
}

export async function isResiInGoogleSheet(resi: string): Promise<boolean> {
  const appsScriptConfig = getAppsScriptConfig();
  if (appsScriptConfig) {
    const normalizedResi = normalizeResi(resi);
    const cachedLookup = cachedAppsScriptLookups.get(normalizedResi);
    if (cachedLookup && cachedLookup.expiresAt > Date.now()) return cachedLookup.found;

    const pendingLookup = pendingAppsScriptLookups.get(normalizedResi);
    if (pendingLookup) return pendingLookup;

    const lookup = lookupAppsScript(resi.trim(), appsScriptConfig)
      .then((found) => {
        cachedAppsScriptLookups.set(normalizedResi, {
          found,
          expiresAt: Date.now() + SHEET_CACHE_TTL_MS,
        });
        return found;
      })
      .finally(() => {
        pendingAppsScriptLookups.delete(normalizedResi);
      });
    pendingAppsScriptLookups.set(normalizedResi, lookup);
    return lookup;
  }
  return (await getSheetResis()).has(normalizeResi(resi));
}

export async function findResisByCustomerNameInGoogleSheet(name: string): Promise<string[]> {
  const config = getAppsScriptConfig();
  if (!config) return [];

  const normalizedName = name.trim().replace(/\s+/g, " ").toLocaleLowerCase();
  if (!normalizedName) return [];

  const cachedLookup = cachedAppsScriptNameLookups.get(normalizedName);
  if (cachedLookup && cachedLookup.expiresAt > Date.now()) return cachedLookup.resis;

  const pendingLookup = pendingAppsScriptNameLookups.get(normalizedName);
  if (pendingLookup) return pendingLookup;

  const lookup = lookupAppsScriptName(name.trim(), config)
    .then((resis) => {
      cachedAppsScriptNameLookups.set(normalizedName, {
        resis,
        expiresAt: Date.now() + SHEET_CACHE_TTL_MS,
      });
      return resis;
    })
    .finally(() => {
      pendingAppsScriptNameLookups.delete(normalizedName);
    });
  pendingAppsScriptNameLookups.set(normalizedName, lookup);
  return lookup;
}
