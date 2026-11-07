process.env.NITRO_HOST ||= process.env.HOST || "0.0.0.0";
process.env.NITRO_PORT ||= process.env.PORT || "3001";

await import("../.output/server/index.mjs");
