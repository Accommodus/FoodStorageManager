import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { ApiHandler, ServerHealth } from "./types";
import { getHealth } from "./health";
import { createItem } from "./item";
import { createLocation } from "./location";
import { upsertLot } from "./inventory";
import { recordTransaction } from "./transaction";
import { createAudit } from "./audit";
import { createUser, listUsers } from "./user";

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

//const port: string = process.env.S_PORT ?? "3000";

const mongoUri: string =
  process.env.MONGODB_URI ??
  (() => {
    throw new Error("Missing MONGODB_URI");
  })();

//const mongoUri: string = process.env.MONGODB_URI ?? "mongodb://db:27017/local"

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

const withDatabase = (handler: ApiHandler) =>
  async (req: express.Request, res: express.Response) => {
    if (!db) {
      return getHealth(req, res, connection);
    }

    await handler(req, res, db);
  };

app.post("/items", withDatabase(createItem));
app.post("/item", withDatabase(createItem));
app.post("/locations", withDatabase(createLocation));
app.put("/inventory/lots", withDatabase(upsertLot));
app.post("/stock-transactions", withDatabase(recordTransaction));
app.post("/audits", withDatabase(createAudit));
app.get("/users", withDatabase(listUsers));
app.post("/users", withDatabase(createUser));

app.get("/", (req, res) => {
  if (!connection.ok) {
    return getHealth(req, res, connection);
  }
  res.status(200).send("server is running.");
});

app.listen(port, () => {
  console.log(`Server is running on PORT: ${port}`);
});
