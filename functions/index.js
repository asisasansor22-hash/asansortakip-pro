"use strict";

const { onRequest } = require("firebase-functions/v2/https");
const { optimizeRoute } = require("./routeOptimizer");

exports.optimizeRoute = onRequest(
  {
    region: "europe-west1",
    cors: true,
    timeoutSeconds: 60,
    memory: "512MiB"
  },
  async (req, res) => {
    res.set("Cache-Control", "no-store");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "method-not-allowed" });
      return;
    }

    try {
      const result = await optimizeRoute(req.body || {});
      res.status(200).json(result);
    } catch (error) {
      const status = error && error.statusCode ? error.statusCode : 500;
      res.status(status).json({
        error: error && error.code ? error.code : "route-optimization-failed",
        message: error && error.message ? error.message : "Rota optimize edilemedi."
      });
    }
  }
);
