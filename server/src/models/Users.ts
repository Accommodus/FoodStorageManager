import mongoose, { Document, Schema, Model } from 'mongoose';

// Define an interface representing a document in MongoDB.
export interface IUser extends Document {
  email: string;
  name: string;
  passwordHash: string;
  roles: string[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Define the Mongoose schema corresponding to the document interface.
const UserSchema: Schema<IUser> = new Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    passwordHash: { type: String, required: true },
    roles: { type: [String], default: ['volunteer'] }, // Default is volunteer
    enabled: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export const UserModel: Model<IUser> = mongoose.model<IUser>('User', UserSchema);