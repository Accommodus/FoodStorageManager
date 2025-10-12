import express from "express";
import cors from "cors";
import { getHealth } from "./health";

const app: express.Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port: string = process.env.S_PORT ?? (() => { throw new Error('Missing Server Port'); })();
//const port: string = process.env.S_PORT ?? "3000";

app.get("/health", getHealth);
app.get("/", (req, res) => {
  res.status(200).send("server is running.");
});

app.listen(port, () => {
  console.log(`Server is running on PORT: ${port}`);
});
