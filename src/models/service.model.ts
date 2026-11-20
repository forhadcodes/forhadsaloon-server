import mongoose, { Document, Model, Schema } from "mongoose";
import { CATEGORIES } from "../config/constants.js";

export interface IService extends Document {
  serviceName: string;
  category: string;
  description: string;
  price: number;
  duration: number; // minutes
  image: string; // ImgBB https URL
  status: string;
  createdAt: Date;
}

export interface IServiceInput {
  serviceName: string;
  category: string;
  description: string;
  price: number;
  duration: number;
  image: string;
  status?: string;
}

const ServiceSchema = new Schema(
  {
    serviceName: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, required: true, enum: [...CATEGORIES] },
    description: { type: String, required: true, maxlength: 2000 },
    price: { type: Number, required: true, min: 0.01 },
    duration: { type: Number, required: true, min: 1 },
    image: { type: String, required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const Service: Model<IService> = mongoose.model<IService>("Service", ServiceSchema);