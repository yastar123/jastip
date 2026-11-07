import { describe, expect, it, vi } from "vitest";
import { findPublicPackage, resolveServiceRoute } from "@/server/db";

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

  it("matches the full name and resi and returns package details without financial fields", async () => {
    const query = vi.fn(async () => ({
      rows: [
        {
          resi: "JY2152364473",
          package_number: null,
          package_date: "2026-11-06",
          service_type: "Jastip Pesawat",
          route: "Jakarta → Manokwari",
          real_weight: "0.18",
          volume_weight: null,
          billable_weight: "0.18",
          additional_fee_description: null,
          all_picked_up: false,
          all_verified: false,
        },
      ],
    }));

    const result = await findPublicPackage("Desy Sinaga", "JY2152364473", query);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining(
        "AND ($2::text IS NULL OR LOWER(BTRIM(customer_name)) = LOWER(BTRIM($2)))",
      ),
      ["JY2152364473", "Desy Sinaga"],
    );
    expect(query.mock.calls[0]?.[0]).not.toContain("total_shipping");
    expect(query.mock.calls[0]?.[0]).not.toContain("package_data->>'additional_fee'");
    expect(result).toEqual({
      resi: "JY2152364473",
      packageNumber: null,
      packageDate: "2026-11-06",
      serviceType: "Jastip Pesawat",
      route: "Jakarta → Manokwari",
      realWeight: "0.18",
      volumeWeight: null,
      billableWeight: "0.18",
      additionalFeeDescription: null,
      status: "Paket dalam proses pengiriman",
    });
  });

  it("allows a resi-only lookup when it belongs to a single customer", async () => {
    const query = vi.fn(async () => ({
      rows: [
        {
          resi: "JAJ-003",
          package_number: null,
          package_date: null,
          service_type: null,
          route: null,
          real_weight: null,
          volume_weight: null,
          billable_weight: null,
          additional_fee_description: null,
          all_picked_up: false,
          all_verified: false,
        },
      ],
    }));

    await expect(findPublicPackage(undefined, "JAJ-003", query)).resolves.toMatchObject({
      resi: "JAJ-003",
      status: "Paket dalam proses pengiriman",
    });
    expect(query).toHaveBeenCalledWith(expect.any(String), ["JAJ-003", null]);
  });

  it("requires the optional name to distinguish a resi shared by multiple customers", async () => {
    const row = {
      resi: "JAJ-004",
      package_number: null,
      package_date: null,
      service_type: null,
      route: null,
      real_weight: null,
      volume_weight: null,
      billable_weight: null,
      additional_fee_description: null,
      all_picked_up: false,
      all_verified: false,
    };
    const query = vi.fn(async () => ({ rows: [row, row] }));

    await expect(findPublicPackage(undefined, "JAJ-004", query)).resolves.toBeNull();
    await expect(findPublicPackage("Customer", "JAJ-004", query)).resolves.toMatchObject({
      resi: "JAJ-004",
    });
  });

  it("maps verified and picked-up statuses without exposing invoice or customer data", async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce({
        rows: [
          {
            resi: "JAJ-001",
            package_number: null,
            package_date: null,
            service_type: null,
            route: null,
            real_weight: null,
            volume_weight: null,
            billable_weight: null,
            additional_fee_description: null,
            all_picked_up: false,
            all_verified: true,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            resi: "JAJ-002",
            package_number: null,
            package_date: null,
            service_type: null,
            route: null,
            real_weight: null,
            volume_weight: null,
            billable_weight: null,
            additional_fee_description: null,
            all_picked_up: true,
            all_verified: true,
          },
        ],
      });

    await expect(findPublicPackage("Customer", "JAJ-001", query)).resolves.toEqual({
      resi: "JAJ-001",
      packageNumber: null,
      packageDate: null,
      serviceType: null,
      route: null,
      realWeight: null,
      volumeWeight: null,
      billableWeight: null,
      additionalFeeDescription: null,
      status: "Paket tiba di gudang",
    });
    await expect(findPublicPackage("Customer", "JAJ-002", query)).resolves.toEqual({
      resi: "JAJ-002",
      packageNumber: null,
      packageDate: null,
      serviceType: null,
      route: null,
      realWeight: null,
      volumeWeight: null,
      billableWeight: null,
      additionalFeeDescription: null,
      status: "Paket sudah diambil",
    });
  });

  it("returns no result for an unmatched name and resi", async () => {
    const query = vi.fn(async () => ({ rows: [] }));

    await expect(findPublicPackage("Wrong Name", "UNKNOWN", query)).resolves.toBeNull();
  });
});
