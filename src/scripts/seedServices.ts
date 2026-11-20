import "dotenv/config";
import mongoose from "mongoose";

import { connectDB } from "../config/db.js";
import { Service } from "../models/index.js";

/**
 * Idempotent demo data for local development and the deployed assignment site.
 * Images are the salon photos shipped with the client in `public/images`, so
 * no ImgBB account is needed to see a populated Browse page.
 */
type DemoService = {
  serviceName: string;
  category: string;
  description: string;
  price: number;
  duration: number;
  image: string;
  status: "active" | "inactive";
};

const HAIR = "/images/banner-cuts.jpg";
const COLOR = "/images/banner-color.jpg";
const CARE = "/images/banner-care.jpg";

const demoServices: DemoService[] = [
  {
    serviceName: "Classic Haircut",
    category: "Haircut & Styling",
    description: "A precision cut tailored to your face shape and style, finished with a blow dry.",
    price: 45,
    duration: 30,
    image: HAIR,
    status: "active",
  },
  {
    serviceName: "Layered Cut & Styling",
    category: "Haircut & Styling",
    description: "Soft layers and a polished style that adds movement and volume to your hair.",
    price: 60,
    duration: 45,
    image: HAIR,
    status: "active",
  },
  {
    serviceName: "Blow Dry & Styling",
    category: "Haircut & Styling",
    description: "A salon-quality wash and blow dry to leave your hair smooth and styled.",
    price: 35,
    duration: 30,
    image: HAIR,
    status: "active",
  },
  {
    serviceName: "Balayage Highlights",
    category: "Hair Coloring",
    description: "Hand-painted highlights for a natural, sun-kissed look with soft regrowth.",
    price: 120,
    duration: 120,
    image: COLOR,
    status: "active",
  },
  {
    serviceName: "Root Touch-Up",
    category: "Hair Coloring",
    description: "Cover grey roots and refresh your colour for an even, flawless finish.",
    price: 65,
    duration: 60,
    image: COLOR,
    status: "active",
  },
  {
    serviceName: "Keratin Smoothing Treatment",
    category: "Hair Treatment",
    description: "Tame frizz and add lasting shine with our professional keratin treatment.",
    price: 150,
    duration: 90,
    image: CARE,
    status: "active",
  },
  {
    serviceName: "Deep Conditioning Mask",
    category: "Hair Treatment",
    description: "An intensive nourishing mask that restores moisture to dry, damaged hair.",
    price: 55,
    duration: 45,
    image: CARE,
    status: "inactive",
  },
  {
    serviceName: "Signature Facial",
    category: "Facial & Skincare",
    description: "A relaxing facial with deep cleansing, exfoliation and a hydrating mask.",
    price: 80,
    duration: 60,
    image: CARE,
    status: "active",
  },
  {
    serviceName: "Bridal Makeup",
    category: "Makeup",
    description: "Flawless, long-lasting makeup for your special day, with a trial session.",
    price: 140,
    duration: 90,
    image: COLOR,
    status: "active",
  },
  {
    serviceName: "Gel Manicure",
    category: "Manicure & Pedicure",
    description: "Shaped nails and a glossy gel polish that stays beautiful for weeks.",
    price: 45,
    duration: 45,
    image: CARE,
    status: "active",
  },
  {
    serviceName: "Spa Pedicure",
    category: "Manicure & Pedicure",
    description: "A soothing foot soak, scrub and massage with a flawless polish finish.",
    price: 55,
    duration: 50,
    image: CARE,
    status: "inactive",
  },
  {
    serviceName: "Aromatherapy Massage",
    category: "Spa & Massage",
    description: "A calming full-body massage with essential oils to relieve tension.",
    price: 100,
    duration: 60,
    image: CARE,
    status: "active",
  },
];

(async () => {
  await connectDB();

  let inserted = 0;
  for (const service of demoServices) {
    const result = await Service.updateOne(
      { serviceName: service.serviceName },
      {
        $setOnInsert: {
          ...service,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );
    inserted += result.upsertedCount ?? 0;
  }

  const total = await Service.countDocuments();
  console.log(`Demo services seeded: ${inserted} inserted, ${total} total.`);

  await mongoose.disconnect();
})().catch((error: unknown) => {
  console.error("Demo seed failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
