import { Document, model, Model, Schema } from 'mongoose';

// Define the User schema
const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  avatar: { type: String },
});

// Define the User interface
export interface User extends Document {
  name: string;
  email: string;
  avatar?: string;
}

// Create and export the User model
export const UserModel: Model<User> = model<User>('User', UserSchema);
