import express, { type Request as ExpRequest, type Response as ExpResponse } from "express";
import cors from "cors";
import dotenv from "dotenv";
import {
  getCMSData,
  saveCMSData,
  resetCMSDataToDefault,
  getDatabaseStatus,
  initDatabase,
} from "./db";
import { type Shipment } from "../lib/tracking";

dotenv.config();

// Initialize database on boot
initDatabase().catch(console.error);

export const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Credentials helper
function getAdminCredentials() {
  const email = (process.env.ADMIN_EMAIL || "admin@jastipanggunjaya.com").trim().toLowerCase();
  const password = (process.env.ADMIN_PASSWORD || "adminanggunjaya2026").trim();
  return { email, password };
}

// Generate token
function createToken(email: string): string {
  const payload = {
    email,
    iat: Date.now(),
    role: "admin",
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

function verifyToken(token: string | null | undefined): boolean {
  if (!token) return false;
  try {
    const raw = Buffer.from(token, "base64").toString("utf-8");
    const parsed = JSON.parse(raw);
    const { email } = getAdminCredentials();
    return parsed.email === email && parsed.role === "admin";
  } catch {
    return false;
  }
}

// Health and DB status
app.get("/api/health", (_req: ExpRequest, res: ExpResponse) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    database: getDatabaseStatus(),
  });
});

// Authentication endpoints
app.post("/api/auth/login", (req: ExpRequest, res: ExpResponse) => {
  const { email, password } = req.body || {};
  const creds = getAdminCredentials();

  if (
    typeof email === "string" &&
    typeof password === "string" &&
    email.trim().toLowerCase() === creds.email &&
    password.trim() === creds.password
  ) {
    const token = createToken(creds.email);
    return res.json({
      success: true,
      token,
      user: {
        email: creds.email,
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

  if (verifyToken(token)) {
    const creds = getAdminCredentials();
    return res.json({
      authenticated: true,
      user: {
        email: creds.email,
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
app.get("/api/cms", async (_req: ExpRequest, res: ExpResponse) => {
  try {
    const data = await getCMSData();
    res.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ success: false, error: message });
  }
});

// Update full CMS data
app.put("/api/cms", async (req: ExpRequest, res: ExpResponse) => {
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
app.post("/api/cms/reset", async (_req: ExpRequest, res: ExpResponse) => {
  try {
    const resetData = await resetCMSDataToDefault();
    res.json({ success: true, data: resetData });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ success: false, error: message });
  }
});

// Get shipments
app.get("/api/shipments", async (_req: ExpRequest, res: ExpResponse) => {
  try {
    const data = await getCMSData();
    res.json({ success: true, data: data.shipments || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ success: false, error: message });
  }
});

// Add new shipment
app.post("/api/shipments", async (req: ExpRequest, res: ExpResponse) => {
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
app.put("/api/shipments/:resi", async (req: ExpRequest, res: ExpResponse) => {
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
app.delete("/api/shipments/:resi", async (req: ExpRequest, res: ExpResponse) => {
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
    if (url.pathname === "/api/health" && request.method === "GET") {
      return new Response(
        JSON.stringify({
          status: "ok",
          timestamp: new Date().toISOString(),
          database: getDatabaseStatus(),
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }

    // Auth endpoints in fetch handler
    if (url.pathname === "/api/auth/login" && request.method === "POST") {
      const { email, password } = (await request.json()) as { email?: string; password?: string };
      const creds = getAdminCredentials();

      if (
        typeof email === "string" &&
        typeof password === "string" &&
        email.trim().toLowerCase() === creds.email &&
        password.trim() === creds.password
      ) {
        const token = createToken(creds.email);
        return new Response(
          JSON.stringify({
            success: true,
            token,
            user: {
              email: creds.email,
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

      if (verifyToken(token)) {
        const creds = getAdminCredentials();
        return new Response(
          JSON.stringify({
            authenticated: true,
            user: {
              email: creds.email,
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
        return new Response(JSON.stringify({ success: true, data }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }

      if (request.method === "PUT") {
        const body = await request.json();
        const saved = await saveCMSData(body);
        return new Response(JSON.stringify({ success: true, data: saved }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
    }

    if (url.pathname === "/api/cms/reset" && request.method === "POST") {
      const resetData = await resetCMSDataToDefault();
      return new Response(JSON.stringify({ success: true, data: resetData }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    if (url.pathname === "/api/shipments") {
      if (request.method === "GET") {
        const data = await getCMSData();
        return new Response(JSON.stringify({ success: true, data: data.shipments || [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }

      if (request.method === "POST") {
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
