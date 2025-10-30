import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { ServerHealth } from "./types";
import { getHealth } from "./health";
import { createItem } from "./item";

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

app.get("/health", (req, res) => {
  getHealth(req, res, connection);
});

if (connection.ok) {
  let db = connection.value;
  app.post("/item", (req, res) => {
    createItem(req, res, db);
  });
  app.get("/", (req, res) => {
    res.status(200).send("server is running.");
  });
} else {
  app.use((req, res, next) => {
    if (req.path !== "/health") {
      return res.redirect("/health");
    }
    next();
  });
}

app.listen(port, () => {
  console.log(`Server is running on PORT: ${port}`);
});
