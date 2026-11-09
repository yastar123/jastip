import { describe, expect, it, vi } from "vitest";
import {
  findPublicPackageByResi,
  findPublicPackagesByName,
  resolveServiceRoute,
} from "@/server/db";

const makeRow = (overrides: Record<string, unknown> = {}) => ({
  resi: "JAJ-001",
  customer_name: "Anya Putri",
  package_number: "PKT-001",
  package_date: "2026-11-07",
  last_updated: "2026-11-08",
  service_type: "Jastip Pesawat",
  route: "Jakarta → Manokwari",
  last_location: "Jakarta",
  real_weight: "0.5",
  volume_weight: "0.4",
  billable_weight: "0.5",
  total_shipping: "38500",
  all_picked_up: false,
  arrived_at_destination: true,
  ...overrides,
});

describe("public package tracking", () => {
  it("uses the matching CMS service route when a package has no route", () => {
    const services = [
      { name: "Jastip Hemat", route: "Surabaya → Manokwari" },
      { name: "Jastip Pesawat", route: "Jakarta → Manokwari" },
    ];

    expect(resolveServiceRoute("jastip hemat+", services)).toBe("Surabaya → Manokwari");
    expect(resolveServiceRoute("Jastip lain", services)).toBeNull();
    expect(resolveServiceRoute(null, services)).toBeNull();
  });

  it("returns full details for arrived exact-name matches but redacts packages in transit", async () => {
    const query = vi.fn(async (_text: string, _values: string[]) => ({
      rows: [
        makeRow(),
        makeRow({
          resi: "JAJ-002",
          package_number: "PKT-002",
          arrived_at_destination: false,
          last_location: "Surabaya",
        }),
      ],
    }));

    const result = await findPublicPackagesByName("Anya Putri", query);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("LOWER(BTRIM(customer_name)) = LOWER(BTRIM($1))"),
      ["Anya Putri"],
    );
    expect(query.mock.calls[0]?.[0]).not.toContain("ILIKE");
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      resi: "JAJ-001",
      status: "Bisa Diambil",
      lastLocation: "Manokwari",
      totalShipping: "38500",
      realWeight: "0.5",
      volumeWeight: "0.4",
      customerName: "Anya Putri",
    });
    expect(result[1]).toMatchObject({
      resi: "JAJ-002",
      status: "Dalam Perjalanan",
      lastLocation: "Surabaya",
      totalShipping: null,
      realWeight: null,
      customerName: null,
    });
  });

  it("returns full price, weight, name, and pickup state by resi only after arrival", async () => {
    const query = vi.fn(async (_text: string, _values: string[]) => ({ rows: [makeRow()] }));

    const result = await findPublicPackageByResi("JAJ-001", query);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("UPPER(BTRIM(resi_number)) = UPPER(BTRIM($1))"),
      ["JAJ-001"],
    );
    expect(result).toMatchObject({
      resi: "JAJ-001",
      customerName: "Anya Putri",
      serviceType: "Jastip Pesawat",
      realWeight: "0.5",
      volumeWeight: "0.4",
      totalShipping: "38500",
      arrivedAtDestination: true,
      pickedUp: false,
      status: "Bisa Diambil",
      lastLocation: "Manokwari",
    });
  });

  it("redacts name, price, and weight by resi while the package is in transit", async () => {
    const query = vi.fn(async (_text: string, _values: string[]) => ({
      rows: [
        makeRow({
          arrived_at_destination: false,
          last_location: "Surabaya",
        }),
      ],
    }));

    const result = await findPublicPackageByResi("JAJ-001", query);

    expect(result).toMatchObject({
      customerName: null,
      totalShipping: null,
      realWeight: null,
      volumeWeight: null,
      billableWeight: null,
      arrivedAtDestination: false,
      status: "Dalam Perjalanan",
      lastLocation: "Surabaya",
    });
  });

  it("treats a picked-up package as arrived even if verification status is stale", async () => {
    const query = vi.fn(async (_text: string, _values: string[]) => ({
      rows: [
        makeRow({
          all_picked_up: true,
          arrived_at_destination: false,
          last_location: "Jakarta",
        }),
      ],
    }));

    const result = await findPublicPackageByResi("JAJ-001", query);

    expect(query.mock.calls[0]?.[0]).toContain(
      "BOOL_AND(arrived_at_destination OR picked_up) AS arrived_at_destination",
    );
    expect(query.mock.calls[0]?.[0]).toContain(
      "'SUDAH_DIBAYAR', 'SUDAH_DI_BAYAR', 'LUNAS', 'PAID'",
    );
    expect(query.mock.calls[0]?.[0]).toContain(
      "IN ('SUDAH_DIVERIFIKASI', 'TIBA_DI_MANOKWARI') AS arrived_at_destination",
    );
    expect(query.mock.calls[0]?.[0]).toContain(
      "WHEN BOOL_AND(arrived_at_destination OR picked_up) AND COUNT(total_shipping) > 0",
    );
    expect(result).toMatchObject({
      customerName: "Anya Putri",
      totalShipping: "38500",
      realWeight: "0.5",
      arrivedAtDestination: true,
      pickedUp: true,
      status: "Sudah Diambil",
      lastLocation: "Manokwari",
    });
  });

  it("uses the Google Sheet as the in-transit source when a resi is not in tracking", async () => {
    const query = vi.fn(async (_text: string, _values: string[]) => ({ rows: [] }));
    const sheetLookup = vi.fn(async () => true);

    const result = await findPublicPackageByResi("JAJ-001", query, sheetLookup);

    expect(sheetLookup).toHaveBeenCalledWith("JAJ-001");
    expect(result).toMatchObject({
      resi: "JAJ-001",
      customerName: null,
      totalShipping: null,
      arrivedAtDestination: false,
      pickedUp: false,
      status: "Dalam Perjalanan",
      lastLocation: "Dalam Perjalanan ke Manokwari",
    });
  });

  it("uses verified tracking data before the Google Sheet", async () => {
    const query = vi.fn(async (_text: string, _values: string[]) => ({ rows: [makeRow()] }));
    const sheetLookup = vi.fn(async () => true);

    const result = await findPublicPackageByResi("JAJ-001", query, sheetLookup);

    expect(sheetLookup).not.toHaveBeenCalled();
    expect(result).toMatchObject({ status: "Bisa Diambil", arrivedAtDestination: true });
  });

  it("does not return an ambiguous resi shared by different customers", async () => {
    const query = vi.fn(async (_text: string, _values: string[]) => ({
      rows: [makeRow(), makeRow({ customer_name: "Customer Lain" })],
    }));

    await expect(findPublicPackageByResi("JAJ-001", query, async () => true)).resolves.toBeNull();
  });

  it("returns no package for an unmatched name or resi", async () => {
    const noRows = vi.fn(async (_text: string, _values: string[]) => ({ rows: [] }));

    await expect(findPublicPackagesByName("Nama Tidak Ada", noRows)).resolves.toEqual([]);
    await expect(findPublicPackageByResi("UNKNOWN", noRows, async () => false)).resolves.toBeNull();
  });
});
