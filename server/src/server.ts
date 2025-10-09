import express from "express";
import cors from 'cors';
import mongoose from 'mongoose';

const app: express.Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const mongoUri: string = process.env.MONGODB_URI ?? (() => { throw new Error('Missing MONGODB_URI'); })();
const port: string = process.env.S_PORT ?? (() => { throw new Error('Missing Server Port'); })();

(async () => {
    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to the database');
    } catch(error) {
        console.error(error);
    }
})();

app.get('/health', (_req: express.Request, res: express.Response) => {
    res.status(200).send('Server is running');
});

app.listen(port, () => {
    console.log(`Server is running on PORT: ${port}`);
});
