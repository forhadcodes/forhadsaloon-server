import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  image?: string;
  role: "customer" | "admin";
  isBlocked: boolean;
  phone?: string;
  createdAt: Date;
}

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: { type: String, required: true, lowercase: true, trim: true },
    image: { type: String },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    isBlocked: { type: Boolean, default: false },
    phone: { type: String, sparse: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false, collection: "users", strict: false }
);

export const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);