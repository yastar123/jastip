const TRACKING_SPREADSHEETS = [
  {
    id: "15PoD1RdeIh-zfXKm7SG8nzctLINGPYe5",
    sheetGids: [2035133146, 2145150763],
  },
  {
    id: "1MZSH2q_IF3_Ked6RQEUAzDGxFbwfA0JK6aGhtZXARCU",
    sheetGids: null,
  },
];
const SCRIPT_VERSION = "tracking-v8";
const LOOKUP_CACHE_SECONDS = 30;
const HEADER_SCAN_ROWS = 100;

function doPost(event) {
  try {
    if (!event || !event.postData || !event.postData.contents) {
      return jsonResponse({ ok: false, error: "Missing request body" });
    }

    const request = JSON.parse(event.postData.contents);
    const expectedToken = PropertiesService.getScriptProperties().getProperty("TRACKING_API_TOKEN");
    if (!expectedToken || request.token !== expectedToken) {
      return jsonResponse({ ok: false, error: "Unauthorized" });
    }

    const cache = CacheService.getScriptCache();
    const cacheKey = getLookupCacheKey(request);
    if (cacheKey) {
      const cachedResponse = cache.get(cacheKey);
      if (cachedResponse) return jsonResponse(JSON.parse(cachedResponse));
    }

    const sheets = getTrackingSheets();
    if (request.searchBy === "name") {
      const packages = new Map();
      let foundHeaders = false;

      for (const entry of sheets) {
        const result = searchByName(readTrackingRows(entry.sheet), request.name);
        if (result.foundHeaders) foundHeaders = true;
        for (const item of result.packages) {
          packages.set(normalizeResi(item.resi), item);
        }
      }

      if (!foundHeaders) {
        throw new Error("No recognized resi and customer-name headers found");
      }
      return cacheAndRespond(cache, cacheKey, {
        ok: true,
        packages: Array.from(packages.values()),
      });
    }

    const targetResi = normalizeResi(request.resi);
    if (!targetResi) return jsonResponse({ ok: true, found: false });

    let found = false;
    let foundResiHeader = false;
    for (const entry of sheets) {
      const result = searchByResi(readTrackingRows(entry.sheet), targetResi);
      if (result.foundHeader) foundResiHeader = true;
      if (result.found) {
        found = true;
        break;
      }
    }

    if (!foundResiHeader) {
      throw new Error("No recognized resi header found in configured tabs");
    }
    return cacheAndRespond(cache, cacheKey, { ok: true, found });
  } catch (error) {
    console.error("Tracking request failed:", error);
    return jsonResponse({ ok: false, error: "Tracking lookup failed" });
  }
}

function getLookupCacheKey(request) {
  let lookup;
  if (request.searchBy === "name") {
    const name = normalizeName(request.name);
    if (!name) return null;
    lookup = "name:" + name;
  } else {
    const resi = normalizeResi(request.resi);
    if (!resi) return null;
    lookup = "resi:" + resi;
  }

  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, lookup);
  return "tracking-v8:" + Utilities.base64EncodeWebSafe(digest).slice(0, 40);
}

function cacheAndRespond(cache, cacheKey, payload) {
  const serialized = JSON.stringify(payload);
  if (cacheKey && serialized.length < 90000) {
    cache.put(cacheKey, serialized, LOOKUP_CACHE_SECONDS);
  }
  return jsonResponse(payload);
}

function readTrackingRows(sheet) {
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  if (!lastRow || !lastColumn) return [];

  const scanRows = Math.min(lastRow, HEADER_SCAN_ROWS);
  const headerCandidates = sheet.getRange(1, 1, scanRows, lastColumn).getDisplayValues();
  let headerRow = -1;
  let resiColumn = -1;
  let nameColumn = -1;

  for (let index = 0; index < headerCandidates.length; index += 1) {
    const headers = headerCandidates[index].map(normalizeHeader);
    const candidateResiColumn = headers.findIndex(isResiHeader);
    const candidateNameColumn = headers.findIndex(isCustomerNameHeader);
    if (candidateResiColumn >= 0) {
      headerRow = index + 1;
      resiColumn = candidateResiColumn;
      nameColumn = candidateNameColumn;
      if (nameColumn >= 0) break;
    }
  }

  if (headerRow < 0) return [];

  const firstColumn = nameColumn >= 0 ? Math.min(resiColumn, nameColumn) : resiColumn;
  const lastColumnNeeded = nameColumn >= 0 ? Math.max(resiColumn, nameColumn) : resiColumn;
  return sheet
    .getRange(
      headerRow,
      firstColumn + 1,
      lastRow - headerRow + 1,
      lastColumnNeeded - firstColumn + 1,
    )
    .getDisplayValues();
}

function searchByResi(rows, requestedResi) {
  const targetResi = normalizeResi(requestedResi);
  let columns = { resi: -1, name: -1 };
  let foundHeader = false;

  for (const row of rows) {
    const updatedColumns = updateHeaderColumns(row, columns);
    const isResiHeaderRow = rowContainsResiHeader(row);
    columns = updatedColumns;

    if (isResiHeaderRow) {
      foundHeader = true;
      continue;
    }
    if (columns.resi < 0) continue;

    if (normalizeResi(row[columns.resi]) === targetResi) {
      return { found: true, foundHeader };
    }
  }

  return { found: false, foundHeader };
}

function searchByName(rows, requestedName) {
  const targetName = normalizeName(requestedName);
  const packages = new Map();
  let columns = { resi: -1, name: -1 };
  let foundHeaders = false;

  for (const row of rows) {
    const updatedColumns = updateHeaderColumns(row, columns);
    const isNameHeaderRow = rowContainsNameHeader(row);
    columns = updatedColumns;

    if (rowContainsResiHeader(row) && isNameHeaderRow) {
      foundHeaders = true;
      continue;
    }
    if (!targetName || columns.resi < 0 || columns.name < 0) continue;

    const resi = normalizeResi(row[columns.resi]);
    if (resi && normalizeName(row[columns.name]) === targetName) {
      packages.set(resi, { resi });
    }
  }

  return { packages: Array.from(packages.values()), foundHeaders };
}

function updateHeaderColumns(row, currentColumns) {
  const headers = row.map(normalizeHeader);
  const resiColumn = headers.findIndex(isResiHeader);
  const nameColumn = headers.findIndex(isCustomerNameHeader);
  return {
    resi: resiColumn >= 0 ? resiColumn : currentColumns.resi,
    name: nameColumn >= 0 ? nameColumn : currentColumns.name,
  };
}

function rowContainsResiHeader(row) {
  return row.map(normalizeHeader).some(isResiHeader);
}

function rowContainsNameHeader(row) {
  return row.map(normalizeHeader).some(isCustomerNameHeader);
}

function isResiHeader(header) {
  return (
    header.includes("resi") ||
    header.includes("trackingnumber") ||
    ["awb", "nomorawb", "barcode", "kodebarcode"].includes(header)
  );
}

function isCustomerNameHeader(header) {
  return (
    ["nama", "namakonsumen", "namapelanggan", "customername", "customer"].includes(header) ||
    header.startsWith("namakonsumen") ||
    header.startsWith("namapelanggan")
  );
}

function getTrackingSheets() {
  const entries = [];

  for (const config of TRACKING_SPREADSHEETS) {
    const spreadsheet = SpreadsheetApp.openById(config.id);
    const sheets = config.sheetGids
      ? config.sheetGids.map((gid) => {
          const sheet = spreadsheet.getSheetById(gid);
          if (!sheet) throw new Error("Tracking tab not found for GID " + gid);
          return sheet;
        })
      : spreadsheet.getSheets();

    for (const sheet of sheets) {
      entries.push({
        spreadsheetId: config.id,
        sheetName: sheet.getName(),
        sheetGid: sheet.getSheetId(),
        sheet,
      });
    }
  }

  return entries;
}

function normalizeResi(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function normalizeName(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function normalizeHeader(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function diagnoseTrackingSheets() {
  const results = getTrackingSheets().map((entry) => {
    const rows = readTrackingRows(entry.sheet);
    const nameSearch = searchByName(rows, "Tika Ayu Irnawati");
    return {
      spreadsheetId: entry.spreadsheetId,
      sheetName: entry.sheetName,
      sheetGid: entry.sheetGid,
      rowCount: rows.length,
      hasTrackingHeaders: nameSearch.foundHeaders,
      matchesForTika: nameSearch.packages.length,
      containsTargetResi: searchByResi(rows, "SPXID06145874236B").found,
    };
  });

  Logger.log(JSON.stringify({ scriptVersion: SCRIPT_VERSION, results }));
}

function diagnoseRecentRows() {
  const tests = [
    { resi: "id265561577290n", name: "DIAH LAB" },
    { resi: "cm92375374910", name: "NISA ARMAN" },
  ];
  const results = [];

  for (const entry of getTrackingSheets()) {
    const rows = readTrackingRows(entry.sheet);
    let columns = { resi: -1, name: -1 };

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      columns = updateHeaderColumns(row, columns);
      if (rowContainsResiHeader(row) || rowContainsNameHeader(row)) continue;
      if (columns.resi < 0 || columns.name < 0) continue;

      const rowResi = normalizeResi(row[columns.resi]);
      const rowName = normalizeName(row[columns.name]);

      for (const test of tests) {
        if (rowResi === normalizeResi(test.resi)) {
          results.push({
            sheetName: entry.sheetName,
            sheetGid: entry.sheetGid,
            row: index + 1,
            resiFound: true,
            nameMatches: rowName === normalizeName(test.name),
          });
        }
      }
    }
  }

  Logger.log(JSON.stringify({ scriptVersion: SCRIPT_VERSION, results }));
}
