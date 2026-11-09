const SPREADSHEET_ID = "15PoD1RdeIh-zfXKm7SG8nzctLINGPYe5";
const SHEET_GID = 2035133146;

function doPost(event) {
  try {
    const request = JSON.parse(event.postData.contents);
    const expectedToken = PropertiesService.getScriptProperties().getProperty("TRACKING_API_TOKEN");
    if (!expectedToken || request.token !== expectedToken) {
      return jsonResponse({ ok: false, error: "Unauthorized" });
    }

    const resi = normalizeResi(request.resi);
    if (!resi) return jsonResponse({ ok: true, found: false });

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetById(SHEET_GID);
    if (!sheet) throw new Error("Tracking sheet tab not found");

    const rows = sheet.getDataRange().getDisplayValues();
    let resiColumn = -1;
    let foundHeader = false;

    for (const row of rows) {
      const headerColumn = row.findIndex((value) => {
        const header = normalizeHeader(value);
        return (
          header.includes("resi") ||
          header.includes("trackingnumber") ||
          ["awb", "nomorawb", "barcode", "kodebarcode"].includes(header)
        );
      });
      if (headerColumn >= 0) {
        resiColumn = headerColumn;
        foundHeader = true;
        continue;
      }

      if (resiColumn >= 0 && normalizeResi(row[resiColumn]) === resi) {
        return jsonResponse({ ok: true, found: true });
      }
    }

    if (!foundHeader) throw new Error("No recognized resi header found");
    return jsonResponse({ ok: true, found: false });
  } catch {
    return jsonResponse({ ok: false, error: "Tracking lookup failed" });
  }
}

function normalizeResi(value) {
  return String(value || "").trim().toUpperCase();
}

function normalizeHeader(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
