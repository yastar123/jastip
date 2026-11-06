import express, { type Request as ExpRequest, type Response as ExpResponse } from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
import cors from "cors";
import dotenv from "dotenv";
import {
  getCMSData,
  saveCMSData,
  resetCMSDataToDefault,
  getDatabaseStatus,
  initDatabase,
  isTrackingDatabaseAvailable,
  findPublicPackage,
} from "./db";
import { type Shipment } from "../lib/tracking";

dotenv.config();

// Initialize database on boot
initDatabase().catch(console.error);

export const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Public package tracking only returns the fields customers are allowed to see.
app.post("/api/public/track", async (req: ExpRequest, res: ExpResponse) => {
  const { name, resi } = req.body || {};
  if (
    (name !== undefined && typeof name !== "string") ||
    typeof resi !== "string" ||
    !resi.trim() ||
    (typeof name === "string" && name.trim().length > 255) ||
    resi.trim().length > 64
  ) {
    return res.status(400).json({ success: false, error: "Nomor resi wajib diisi." });
  }

  try {
    const data = await findPublicPackage(
      typeof name === "string" ? name.trim() || undefined : undefined,
      resi.trim(),
    );
    if (!data) {
      return res.status(404).json({
        success: false,
        error: "Paket tidak ditemukan. Periksa nomor resi atau isi nama penerima jika diperlukan.",
      });
    }
    return res.json({ success: true, data });
  } catch (err: unknown) {
    console.error("Public package tracking failed:", err);
    return res.status(503).json({
      success: false,
      error: "Layanan pelacakan sementara tidak tersedia. Silakan coba lagi atau hubungi admin.",
    });
  }
});

type AuthSettings = { email: string; password: string; sessionSecret: string };

function getAuthSettings(): AuthSettings | null {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD?.trim();
  const sessionSecret = process.env.SESSION_SECRET;
  if (!email || !password || password.length < 24 || !sessionSecret || sessionSecret.length < 32) {
    return null;
  }
  return { email, password, sessionSecret };
}

// Generate token
function createToken(email: string, sessionSecret: string): string {
  const payload = {
    email,
    exp: Date.now() + 8 * 60 * 60 * 1000,
    role: "admin",
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", sessionSecret).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
}

function verifyToken(token: string | null | undefined): boolean {
  const settings = getAuthSettings();
  if (!token || !settings) return false;
  try {
    const [encodedPayload, signature, extra] = token.split(".");
    if (!encodedPayload || !signature || extra) return false;
    const expected = createHmac("sha256", settings.sessionSecret).update(encodedPayload).digest();
    const received = Buffer.from(signature, "base64url");
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) return false;
    const parsed = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf-8"));
    return parsed.email === settings.email && parsed.role === "admin" && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

function isAdminAuthorization(authHeader: string | undefined | null): boolean {
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  return verifyToken(token);
}

function requireAdmin(req: ExpRequest, res: ExpResponse, next: express.NextFunction): void {
  if (!isAdminAuthorization(req.headers.authorization)) {
    res.status(401).json({ success: false, error: "Sesi admin tidak valid atau telah berakhir." });
    return;
  }
  next();
}

function isAdminRequest(request: Request): boolean {
  return isAdminAuthorization(request.headers.get("authorization"));
}

async function getHealthStatus() {
  const trackingDatabaseConnected = await isTrackingDatabaseAvailable();
  const adminAuthConfigured = getAuthSettings() !== null;
  const ready = trackingDatabaseConnected && adminAuthConfigured;
  return {
    status: ready ? "ok" : "degraded",
    ready,
    timestamp: new Date().toISOString(),
    database: getDatabaseStatus(),
    trackingDatabaseConnected,
    adminAuthConfigured,
  };
}

// Health and DB status
app.get("/api/health", async (_req: ExpRequest, res: ExpResponse) => {
  const health = await getHealthStatus();
  res.status(health.ready ? 200 : 503).json(health);
});

// Authentication endpoints
app.post("/api/auth/login", (req: ExpRequest, res: ExpResponse) => {
  const { email, password } = req.body || {};
  const settings = getAuthSettings();
  if (!settings) {
    return res.status(503).json({
      success: false,
      error:
        "Login admin belum dikonfigurasi. Periksa ADMIN_EMAIL, ADMIN_PASSWORD (minimal 24 karakter), dan SESSION_SECRET (minimal 32 karakter).",
    });
  }

  if (
    typeof email === "string" &&
    typeof password === "string" &&
    email.trim().toLowerCase() === settings.email &&
    password.trim() === settings.password
  ) {
    const token = createToken(settings.email, settings.sessionSecret);
    return res.json({
      success: true,
      token,
      user: {
        email: settings.email,
        name: "Admin Jastip Anggun Jaya",
        role: "admin",
      },
    });
  }

  return res.status(401).json({
    success: false,
    error: "Email atau kata sandi admin tidak sesuai.",
  });
});

app.get("/api/auth/me", (req: ExpRequest, res: ExpResponse) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const settings = getAuthSettings();

  if (settings && verifyToken(token)) {
    return res.json({
      authenticated: true,
      user: {
        email: settings.email,
        name: "Admin Jastip Anggun Jaya",
        role: "admin",
      },
    });
  }

  return res
    .status(401)
    .json({ authenticated: false, error: "Sesi tidak valid atau telah berakhir" });
});

app.post("/api/auth/logout", (_req: ExpRequest, res: ExpResponse) => {
  res.json({ success: true, message: "Logged out" });
});

// Get full CMS data
app.get("/api/cms", async (req: ExpRequest, res: ExpResponse) => {
  try {
    const data = await getCMSData();
    res.json({
      success: true,
      data: isAdminAuthorization(req.headers.authorization) ? data : { ...data, shipments: [] },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ success: false, error: message });
  }
});

// Update full CMS data
app.put("/api/cms", requireAdmin, async (req: ExpRequest, res: ExpResponse) => {
  try {
    const content = req.body;
    if (!content || typeof content !== "object") {
      return res.status(400).json({ success: false, error: "Invalid body" });
    }
    const saved = await saveCMSData(content);
    res.json({ success: true, data: saved });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ success: false, error: message });
  }
});

// Reset CMS to default
app.post("/api/cms/reset", requireAdmin, async (_req: ExpRequest, res: ExpResponse) => {
  try {
    const resetData = await resetCMSDataToDefault();
    res.json({ success: true, data: resetData });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ success: false, error: message });
  }
});

// Get shipments
app.get("/api/shipments", requireAdmin, async (_req: ExpRequest, res: ExpResponse) => {
  try {
    const data = await getCMSData();
    res.json({ success: true, data: data.shipments || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ success: false, error: message });
  }
});

// Add new shipment
app.post("/api/shipments", requireAdmin, async (req: ExpRequest, res: ExpResponse) => {
  try {
    const newShipment = req.body as Shipment;
    if (!newShipment.resi || !newShipment.name) {
      return res.status(400).json({ success: false, error: "Resi and name are required" });
    }

    const current = await getCMSData();
    const existingIndex = current.shipments.findIndex(
      (s) => s.resi.toUpperCase() === newShipment.resi.toUpperCase(),
    );

    let updatedShipments: Shipment[];
    if (existingIndex >= 0) {
      updatedShipments = [...current.shipments];
      updatedShipments[existingIndex] = newShipment;
    } else {
      updatedShipments = [newShipment, ...current.shipments];
    }

    const saved = await saveCMSData({ ...current, shipments: updatedShipments });
    res.json({ success: true, data: newShipment, all: saved.shipments });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ success: false, error: message });
  }
});

// Update single shipment
app.put("/api/shipments/:resi", requireAdmin, async (req: ExpRequest, res: ExpResponse) => {
  try {
    const resiParam = req.params.resi?.toUpperCase();
    const update = req.body as Partial<Shipment>;
    const current = await getCMSData();
    const index = current.shipments.findIndex((s) => s.resi.toUpperCase() === resiParam);

    if (index === -1) {
      return res.status(404).json({ success: false, error: "Shipment not found" });
    }

    const updatedShipment = { ...current.shipments[index], ...update } as Shipment;
    const updatedShipments = [...current.shipments];
    updatedShipments[index] = updatedShipment;

    await saveCMSData({ ...current, shipments: updatedShipments });
    res.json({ success: true, data: updatedShipment });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ success: false, error: message });
  }
});

// Delete single shipment
app.delete("/api/shipments/:resi", requireAdmin, async (req: ExpRequest, res: ExpResponse) => {
  try {
    const resiParam = req.params.resi?.toUpperCase();
    const current = await getCMSData();
    const filtered = current.shipments.filter((s) => s.resi.toUpperCase() !== resiParam);

    await saveCMSData({ ...current, shipments: filtered });
    res.json({ success: true, deleted: resiParam });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * Handle incoming Web Standard Request for TanStack Start / Nitro SSR server
 */
export async function handleFetchApi(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/")) {
    return null;
  }

  // Handle API routes directly with Web Request / Response
  try {
    if (url.pathname === "/api/public/track" && request.method === "POST") {
      const body = (await request.json()) as { name?: unknown; resi?: unknown };
      if (
        (body.name !== undefined && typeof body.name !== "string") ||
        typeof body.resi !== "string" ||
        !body.resi.trim() ||
        (typeof body.name === "string" && body.name.trim().length > 255) ||
        body.resi.trim().length > 64
      ) {
        return new Response(JSON.stringify({ success: false, error: "Nomor resi wajib diisi." }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }

      let data;
      try {
        data = await findPublicPackage(
          typeof body.name === "string" ? body.name.trim() || undefined : undefined,
          body.resi.trim(),
        );
      } catch (err: unknown) {
        console.error("Public package tracking failed:", err);
        return new Response(
          JSON.stringify({
            success: false,
            error:
              "Layanan pelacakan sementara tidak tersedia. Silakan coba lagi atau hubungi admin.",
          }),
          { status: 503, headers: { "content-type": "application/json" } },
        );
      }
      if (!data) {
        return new Response(
          JSON.stringify({
            success: false,
            error:
              "Paket tidak ditemukan. Periksa nomor resi atau isi nama penerima jika diperlukan.",
          }),
          { status: 404, headers: { "content-type": "application/json" } },
        );
      }

      return new Response(JSON.stringify({ success: true, data }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    if (url.pathname === "/api/health" && request.method === "GET") {
      const health = await getHealthStatus();
      return new Response(JSON.stringify(health), {
        status: health.ready ? 200 : 503,
        headers: { "content-type": "application/json" },
      });
    }

    // Auth endpoints in fetch handler
    if (url.pathname === "/api/auth/login" && request.method === "POST") {
      const { email, password } = (await request.json()) as { email?: string; password?: string };
      const settings = getAuthSettings();
      if (!settings) {
        return new Response(
          JSON.stringify({
            success: false,
            error:
              "Login admin belum dikonfigurasi. Periksa ADMIN_EMAIL, ADMIN_PASSWORD (minimal 24 karakter), dan SESSION_SECRET (minimal 32 karakter).",
          }),
          { status: 503, headers: { "content-type": "application/json" } },
        );
      }

      if (
        typeof email === "string" &&
        typeof password === "string" &&
        email.trim().toLowerCase() === settings.email &&
        password.trim() === settings.password
      ) {
        const token = createToken(settings.email, settings.sessionSecret);
        return new Response(
          JSON.stringify({
            success: true,
            token,
            user: {
              email: settings.email,
              name: "Admin Jastip Anggun Jaya",
              role: "admin",
            },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: "Email atau kata sandi admin tidak sesuai.",
        }),
        { status: 401, headers: { "content-type": "application/json" } },
      );
    }

    if (url.pathname === "/api/auth/me" && request.method === "GET") {
      const authHeader = request.headers.get("authorization");
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
      const settings = getAuthSettings();

      if (settings && verifyToken(token)) {
        return new Response(
          JSON.stringify({
            authenticated: true,
            user: {
              email: settings.email,
              name: "Admin Jastip Anggun Jaya",
              role: "admin",
            },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ authenticated: false, error: "Sesi tidak valid atau telah berakhir" }),
        { status: 401, headers: { "content-type": "application/json" } },
      );
    }

    if (url.pathname === "/api/auth/logout" && request.method === "POST") {
      return new Response(JSON.stringify({ success: true, message: "Logged out" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    if (url.pathname === "/api/cms") {
      if (request.method === "GET") {
        const data = await getCMSData();
        const visibleData = isAdminRequest(request) ? data : { ...data, shipments: [] };
        return new Response(JSON.stringify({ success: true, data: visibleData }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }

      if (request.method === "PUT") {
        if (!isAdminRequest(request)) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Sesi admin tidak valid atau telah berakhir.",
            }),
            { status: 401, headers: { "content-type": "application/json" } },
          );
        }
        const body = await request.json();
        const saved = await saveCMSData(body);
        return new Response(JSON.stringify({ success: true, data: saved }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
    }

    if (url.pathname === "/api/cms/reset" && request.method === "POST") {
      if (!isAdminRequest(request)) {
        return new Response(
          JSON.stringify({ success: false, error: "Sesi admin tidak valid atau telah berakhir." }),
          { status: 401, headers: { "content-type": "application/json" } },
        );
      }
      const resetData = await resetCMSDataToDefault();
      return new Response(JSON.stringify({ success: true, data: resetData }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    if (url.pathname === "/api/shipments") {
      if (request.method === "GET") {
        if (!isAdminRequest(request)) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Sesi admin tidak valid atau telah berakhir.",
            }),
            { status: 401, headers: { "content-type": "application/json" } },
          );
        }
        const data = await getCMSData();
        return new Response(JSON.stringify({ success: true, data: data.shipments || [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }

      if (request.method === "POST") {
        if (!isAdminRequest(request)) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Sesi admin tidak valid atau telah berakhir.",
            }),
            { status: 401, headers: { "content-type": "application/json" } },
          );
        }
        const newShipment = (await request.json()) as Shipment;
        const current = await getCMSData();
        const existingIndex = current.shipments.findIndex(
          (s) => s.resi.toUpperCase() === newShipment.resi.toUpperCase(),
        );

        let updatedShipments: Shipment[];
        if (existingIndex >= 0) {
          updatedShipments = [...current.shipments];
          updatedShipments[existingIndex] = newShipment;
        } else {
          updatedShipments = [newShipment, ...current.shipments];
        }

        const saved = await saveCMSData({ ...current, shipments: updatedShipments });
        return new Response(
          JSON.stringify({ success: true, data: newShipment, all: saved.shipments }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
    }

    const shipmentMatch = url.pathname.match(/^\/api\/shipments\/([^/]+)$/);
    if (shipmentMatch && shipmentMatch[1]) {
      if (!isAdminRequest(request)) {
        return new Response(
          JSON.stringify({ success: false, error: "Sesi admin tidak valid atau telah berakhir." }),
          { status: 401, headers: { "content-type": "application/json" } },
        );
      }
      const resiParam = decodeURIComponent(shipmentMatch[1]).toUpperCase();
      const current = await getCMSData();

      if (request.method === "PUT") {
        const update = (await request.json()) as Partial<Shipment>;
        const index = current.shipments.findIndex((s) => s.resi.toUpperCase() === resiParam);
        if (index === -1) {
          return new Response(JSON.stringify({ success: false, error: "Not found" }), {
            status: 404,
            headers: { "content-type": "application/json" },
          });
        }
        const updated = { ...current.shipments[index], ...update } as Shipment;
        const updatedList = [...current.shipments];
        updatedList[index] = updated;
        await saveCMSData({ ...current, shipments: updatedList });
        return new Response(JSON.stringify({ success: true, data: updated }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }

      if (request.method === "DELETE") {
        const filtered = current.shipments.filter((s) => s.resi.toUpperCase() !== resiParam);
        await saveCMSData({ ...current, shipments: filtered });
        return new Response(JSON.stringify({ success: true, deleted: resiParam }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Endpoint not found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
