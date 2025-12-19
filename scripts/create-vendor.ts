#!/usr/bin/env tsx
/**
 * Script to create the first vendor account
 * Usage: tsx scripts/create-vendor.ts <username> <email> <password>
 * Example: tsx scripts/create-vendor.ts admin admin@redimi.co admin123
 */

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../server/db";
import { vendors } from "../shared/schema";

async function createVendor() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error("Usage: tsx scripts/create-vendor.ts <username> <email> <password>");
    console.error("Example: tsx scripts/create-vendor.ts admin admin@redimi.co admin123");
    process.exit(1);
  }

  const [username, email, password] = args;

  // Check if vendor already exists
  const existing = await db
    .select()
    .from(vendors)
    .where(eq(vendors.username, username))
    .limit(1);

  if (existing.length > 0) {
    console.error(`Vendor with username "${username}" already exists!`);
    process.exit(1);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create vendor
  const result = await db
    .insert(vendors)
    .values({
      username,
      email,
      password: hashedPassword,
    })
    .returning();

  console.log("✅ Vendor created successfully!");
  console.log(`   Username: ${result[0].username}`);
  console.log(`   Email: ${result[0].email}`);
  console.log(`   ID: ${result[0].id}`);
  console.log("\nYou can now login with these credentials.");
  
  process.exit(0);
}

createVendor().catch((error) => {
  console.error("Error creating vendor:", error);
  process.exit(1);
});

