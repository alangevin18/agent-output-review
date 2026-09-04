// Run with: npx tsx scripts/reset-db.ts

import mongoose from "mongoose";
import { readFileSync } from "fs";

// Read .env.local manually
const envContent = readFileSync(".env.local", "utf-8");
const mongoMatch = envContent.match(/MONGODB_URI=(.+)/);
const uri = mongoMatch?.[1]?.trim();

async function reset() {
  if (!uri) {
    console.error("MONGODB_URI not found in .env.local");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  // Drop all collections
  const collections = await mongoose.connection.db!.listCollections().toArray();
  for (const col of collections) {
    await mongoose.connection.db!.dropCollection(col.name);
    console.log(`Dropped: ${col.name}`);
  }

  console.log("\n✅ Database reset complete!");
  console.log("All reviews, comments, and activity cleared.");

  await mongoose.disconnect();
}

reset().catch(console.error);
