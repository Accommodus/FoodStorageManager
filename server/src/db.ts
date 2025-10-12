import mongoose from 'mongoose';
import {MaybeError} from './types'

const mongoUri: string = process.env.MONGODB_URI ?? (() => { throw new Error('Missing MONGODB_URI'); })();
//const mongoUri: string = process.env.MONGODB_URI ?? "mongodb://db:27017/local"

export async function connectDB(uri: string = mongoUri): Promise<MaybeError> {
  try {
    await mongoose.connect(uri);
    return { ok: true };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    return { ok: false, error };
  }
}
