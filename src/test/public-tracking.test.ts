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

  it("returns all exact-name matches without exposing financial or full package details", async () => {
    const query = vi.fn(async () => ({
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
      status: "Siap Diambil",
      lastLocation: "Manokwari",
      totalShipping: null,
      realWeight: null,
      customerName: null,
    });
    expect(result[1]).toMatchObject({
      resi: "JAJ-002",
      status: "Dalam Perjalanan",
      lastLocation: "Surabaya",
      totalShipping: null,
      realWeight: null,
    });
  });

  it("returns full price, weight, name, and pickup state by resi only after arrival", async () => {
    const query = vi.fn(async () => ({ rows: [makeRow()] }));

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
      status: "Siap Diambil",
      lastLocation: "Manokwari",
    });
  });

  it("redacts name, price, and weight by resi while the package is in transit", async () => {
    const query = vi.fn(async () => ({
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

  it("marks arrived packages as picked up when pickup is complete", async () => {
    const query = vi.fn(async () => ({
      rows: [makeRow({ all_picked_up: true })],
    }));

    await expect(findPublicPackageByResi("JAJ-001", query)).resolves.toMatchObject({
      pickedUp: true,
      status: "Sudah Diambil",
    });
  });

  it("does not return an ambiguous resi shared by different customers", async () => {
    const query = vi.fn(async () => ({
      rows: [makeRow(), makeRow({ customer_name: "Customer Lain" })],
    }));

    await expect(findPublicPackageByResi("JAJ-001", query)).resolves.toBeNull();
  });

  it("returns no package for an unmatched name or resi", async () => {
    const noRows = vi.fn(async () => ({ rows: [] }));

    await expect(findPublicPackagesByName("Nama Tidak Ada", noRows)).resolves.toEqual([]);
    await expect(findPublicPackageByResi("UNKNOWN", noRows)).resolves.toBeNull();
  });
});
