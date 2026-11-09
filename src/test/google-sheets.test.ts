import { createVerify, generateKeyPairSync } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isResiInGoogleSheet, parseGoogleSheetsCsv } from "@/server/google-sheets";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Google Sheets tracking import", () => {
  it("extracts and normalizes resi values from CSV rows", () => {
    const csv = [
      "\uFEFFTanggal,Nomor Resi,Catatan",
      '2026-11-08," jaj-001 ","Paket, masuk gudang"',
      '2026-11-09,JAJ-002,"Paket ""fragile"""',
      "",
    ].join("\r\n");

    expect(parseGoogleSheetsCsv(csv)).toEqual(new Set(["JAJ-001", "JAJ-002"]));
  });

  it("supports multiline quoted CSV cells", () => {
    const csv = 'No. Resi,Keterangan\r\nJAJ-001,"Sedang dalam\nperjalanan"\r\n';

    expect(parseGoogleSheetsCsv(csv)).toEqual(new Set(["JAJ-001"]));
  });

  it("reports a useful error when the tab has no recognized resi header", () => {
    expect(() => parseGoogleSheetsCsv("Tanggal,Nama\n2026-11-08,Anya")).toThrow(
      "Google Sheets tracking tab needs a header such as Nomor Resi",
    );
  });

  it("authenticates to a private sheet with a read-only service account", async () => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
      publicKeyEncoding: { type: "spki", format: "pem" },
    });
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL", "tracking@example.iam.gserviceaccount.com");
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY", privateKey);
    vi.stubEnv("GOOGLE_SHEETS_ID", "test-sheet");
    vi.stubEnv("GOOGLE_SHEETS_GID", "42");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
        const url = new URL(input.toString());
        if (url.hostname === "oauth2.googleapis.com") {
          const body = new URLSearchParams(String(init?.body));
          const assertion = body.get("assertion")!;
          const [header, claims, signature] = assertion.split(".");
          const verifier = createVerify("RSA-SHA256");
          verifier.update(`${header}.${claims}`);
          expect(verifier.verify(publicKey, Buffer.from(signature!, "base64url"))).toBe(true);
          expect(JSON.parse(Buffer.from(claims!, "base64url").toString())).toMatchObject({
            iss: "tracking@example.iam.gserviceaccount.com",
            scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
          });
          return Response.json({ access_token: "mock-access-token", expires_in: 3600 });
        }
        expect(new Headers(init?.headers).get("authorization")).toBe("Bearer mock-access-token");
        if (url.pathname.includes("/values/")) {
          return Response.json({ values: [["Nomor Resi"], [" JAJ-001 "]] });
        }
        return Response.json({
          sheets: [{ properties: { sheetId: 42, title: "Tracking" } }],
        });
      }),
    );

    await expect(isResiInGoogleSheet("jaj-001")).resolves.toBe(true);
  });
});
