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
const SCRIPT_VERSION = "tracking-v6";

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

    const sheets = getTrackingSheets();
    if (request.searchBy === "name") {
      const packages = new Map();
      let foundHeaders = false;

      for (const entry of sheets) {
        const result = searchByName(entry.sheet.getDataRange().getDisplayValues(), request.name);
        if (result.foundHeaders) foundHeaders = true;
        for (const item of result.packages) {
          packages.set(normalizeResi(item.resi), item);
        }
      }

      if (!foundHeaders) {
        throw new Error("No recognized resi and customer-name headers found");
      }
      return jsonResponse({ ok: true, packages: Array.from(packages.values()) });
    }

    const targetResi = normalizeResi(request.resi);
    if (!targetResi) return jsonResponse({ ok: true, found: false });

    let found = false;
    let foundResiHeader = false;
    for (const entry of sheets) {
      const result = searchByResi(entry.sheet.getDataRange().getDisplayValues(), targetResi);
      if (result.foundHeader) foundResiHeader = true;
      if (result.found) {
        found = true;
        break;
      }
    }

    if (!foundResiHeader) {
      throw new Error("No recognized resi header found in configured tabs");
    }
    return jsonResponse({ ok: true, found });
  } catch (error) {
    console.error("Tracking request failed:", error);
    return jsonResponse({ ok: false, error: "Tracking lookup failed" });
  }
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
    const rows = entry.sheet.getDataRange().getDisplayValues();
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
