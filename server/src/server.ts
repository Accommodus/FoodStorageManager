import * as path from "node:path";
import * as url from "node:url";
import * as fs from "node:fs";
import dotenv from "dotenv";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPaths = [
  // When running from TS source
  path.resolve(__dirname, "../../.env"),
  // When running from the built output (dist/server/src -> ../../../../.env)
  path.resolve(__dirname, "../../../../.env"),
];

for (const candidate of envPaths) {
  if (fs.existsSync(candidate)) {
    dotenv.config({
      path: candidate,
      override: true,
    });
    break;
  }
}

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { ApiHandler, ServerHealth } from "./types.js";
import { getHealth } from "./health.js";
import { createItem, listItems, updateItem, deleteItem } from "./item.js";
import { createLocation, listLocations } from "./location.js";
import { upsertLot } from "./inventory.js";
import { recordTransaction } from "./transaction.js";
import { createAudit } from "./audit.js";
import {
  createUser,
  listUsers,
  updateUser,
  deleteUser,
  authenticateUser,
} from "./user.js";

const CLIENT_DIST = [
  // When running from TS source (server/src -> ../../client/dist)
  path.resolve(__dirname, "../../client/dist"),
  // When running the built output (dist/server/src -> ../../../../client/dist)
  path.resolve(__dirname, "../../../../client/dist"),
].find((candidate) => fs.existsSync(candidate));

function connectDB(uri: string): ServerHealth {
  try {
    mongoose.connect(uri);
    return { ok: true, value: mongoose.connection };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    return { ok: false, error };
  }
}

const app: express.Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port: string =
  process.env.S_PORT ??
  (() => {
    throw new Error("Missing Server Port");
  })();

const mongoUri: string =
  process.env.MONGODB_URI ??
  (() => {
    throw new Error("Missing MONGODB_URI");
  })();

let connection = connectDB(mongoUri);
let db = connection.ok ? connection.value : undefined;

const markDisconnected = (reason?: Error) => {
  connection = {
    ok: false,
    error:
      reason ??
      new Error("Lost connection to MongoDB. Falling back to health checks."),
  };
  db = undefined;
};

mongoose.connection.on("connected", () => {
  connection = { ok: true, value: mongoose.connection };
  db = mongoose.connection;
});

mongoose.connection.on("reconnected", () => {
  connection = { ok: true, value: mongoose.connection };
  db = mongoose.connection;
});

mongoose.connection.on("error", (err) => {
  const error = err instanceof Error ? err : new Error(String(err));
  markDisconnected(error);
});

mongoose.connection.on("disconnected", () => {
  markDisconnected();
});

app.get("/health", (req, res) => {
  getHealth(req, res, connection);
});

app.use((req, res, next) => {
  if (!connection.ok && req.path !== "/health") {
    return getHealth(req, res, connection);
  }
  next();
});

if (CLIENT_DIST) {
  app.use(express.static(CLIENT_DIST));
}

const withDatabase =
  (handler: ApiHandler) =>
  async (req: express.Request, res: express.Response) => {
    if (!db) {
      return getHealth(req, res, connection);
    }

    await handler(req, res, db);
  };

app.get("/items", withDatabase(listItems));
app.post("/items", withDatabase(createItem));
app.post("/item", withDatabase(createItem));
app.put("/items/:id", withDatabase(updateItem));
app.delete("/items/:id", withDatabase(deleteItem));
app.get("/locations", withDatabase(listLocations));
app.post("/locations", withDatabase(createLocation));
app.put("/inventory/lots", withDatabase(upsertLot));
app.post("/stock-transactions", withDatabase(recordTransaction));
app.post("/audits", withDatabase(createAudit));
app.get("/users", withDatabase(listUsers));
app.post("/users", withDatabase(createUser));
app.put("/users/:id", withDatabase(updateUser));
app.delete("/users/:id", withDatabase(deleteUser));
app.post("/auth/login", withDatabase(authenticateUser));

const getRegisteredRoutes = () => {
  type RouterLayer = {
    route?: { methods: Record<string, unknown>; path: string };
  };

  type ExpressWithRouter = express.Express & {
    router?: RouterLayer[] | { stack?: RouterLayer[] };
  };

  const expressApp = app as ExpressWithRouter;
  const routerContainer = expressApp.router as
    | { stack?: RouterLayer[] }
    | RouterLayer[]
    | undefined;

  const routerStack = Array.isArray(routerContainer)
    ? routerContainer
    : routerContainer?.stack;

  if (!routerStack) {
    return undefined;
  }

  return routerStack
    .filter((layer: RouterLayer) => Boolean(layer.route?.path))
    .map((layer: RouterLayer) => {
      const methods = Object.keys(layer.route!.methods)
        .map((method) => method.toUpperCase())
        .join(", ");
      return `${methods} ${layer.route!.path}`;
    });
};

const logRegisteredRoutes = () => {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const routes = getRegisteredRoutes();

  if (routes) {
    console.log("Registered routes:", routes);
  } else {
    console.log("Route logger: router not initialized yet.");
  }
};

app.get("/routes", (req, res) => {
  console.log("Received /routes request from", req.ip);
  const routes = getRegisteredRoutes();

  if (!routes) {
    return res.status(503).json({
      error: {
        message: "Routes not initialized yet. Try again shortly.",
      },
    });
  }

  res.json({ data: { routes } });
});

app.get("/", (req, res) => {
  if (!connection.ok) {
    return getHealth(req, res, connection);
  }

  if (CLIENT_DIST) {
    return res.sendFile(path.join(CLIENT_DIST, "index.html"));
  }

  res.status(200).send("server is running.");
});

// Fallback to SPA index for non-API routes when the client build exists.
if (CLIENT_DIST) {
  app.use((req, res, next) => {
    const isApiRoute = req.path.startsWith("/items") ||
      req.path.startsWith("/locations") ||
      req.path.startsWith("/inventory") ||
      req.path.startsWith("/stock-transactions") ||
      req.path.startsWith("/audits") ||
      req.path.startsWith("/users") ||
      req.path.startsWith("/auth") ||
      req.path.startsWith("/routes") ||
      req.path === "/health";

    if (isApiRoute) {
      return next();
    }

    return res.sendFile(path.join(CLIENT_DIST, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`Server is running on PORT: ${port}`);
  setImmediate(logRegisteredRoutes);
});
