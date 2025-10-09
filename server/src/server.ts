import express from "express";
import cors from 'cors';
import mongoose from 'mongoose';

const app: express.Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const mongoUri: string = process.env.MONGODB_URI ?? (() => { throw new Error('Missing MONGODB_URI'); })();
const port: string = process.env.S_PORT ?? (() => { throw new Error('Missing Server Port'); })();

app.get('/health', async (_req: express.Request, res: express.Response) => {
    let health: string;

    try {
        await mongoose.connect(mongoUri);
        health = 'Connected to the database';
    } catch(e) {
        health = e instanceof Error ? e.message : String(e);
    }

    res.status(200).send(health);
});

app.listen(port, () => {
    console.log(`Server is running on PORT: ${port}`);
});