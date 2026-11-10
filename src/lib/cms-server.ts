import { createServerFn } from "@tanstack/react-start";
import { type AppCMSData } from "./cms-types";

export const getPublicCMSData = createServerFn({ method: "GET" }).handler(
  async (): Promise<AppCMSData> => {
    const { getCMSData } = await import("@/server/db");
    const data = await getCMSData();
    return { ...data, shipments: [] };
  },
);
