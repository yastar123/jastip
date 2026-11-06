import express from "express";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

process.env.NITRO_HOST ||= "0.0.0.0";
process.env.NITRO_PORT ||= "3001";

const { o: serverModule } = await import("../.output/server/_ssr/ssr.mjs");
const server = serverModule.default;
const app = express();

app.use(async (req, res, next) => {
  try {
    const protocol = req.get("x-forwarded-proto")?.split(",")[0] || req.protocol;
    const requestUrl = new URL(req.originalUrl, `${protocol}://${req.get("host")}`);
    const hasBody = req.method !== "GET" && req.method !== "HEAD";
    const request = new Request(requestUrl, {
      method: req.method,
      headers: req.headers,
      ...(hasBody ? { body: Readable.toWeb(req), duplex: "half" } : {}),
    });
    const response = await server.fetch(request, undefined, undefined);

    res.status(response.status);
    response.headers.forEach((value, key) => {
      if (key !== "set-cookie") res.setHeader(key, value);
    });
    const cookies = response.headers.getSetCookie();
    if (cookies.length > 0) res.setHeader("set-cookie", cookies);

    if (!response.body) {
      res.end();
      return;
    }

    await pipeline(Readable.fromWeb(response.body), res);
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error("Express request failed:", error);
  if (res.headersSent) return;
  res.status(500).send("Internal Server Error");
});

app.listen(Number(process.env.NITRO_PORT), process.env.NITRO_HOST, () => {
  console.log(
    `Express server listening on http://${process.env.NITRO_HOST}:${process.env.NITRO_PORT}`,
  );
});
