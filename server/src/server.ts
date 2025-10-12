import express from "express";
import cors from "cors";
import { getHealth } from "./health";
import { connectDB } from "./db";

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

let connection = connectDB();
app.use((req, res, next) => {
  if (!connection.ok && req.path !== "/health") {
    return res.redirect("/health");
  }
  next();
});
app.get("/health", (req, res) => {
  getHealth(req, res, connection);
});
app.get("/", (req, res) => {
  res.status(200).send("server is running.");
});

app.listen(port, () => {
  console.log(`Server is running on PORT: ${port}`);
});
