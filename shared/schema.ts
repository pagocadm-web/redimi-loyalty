import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Vendors (multi-tenant)
export const vendors = pgTable("vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // Will be hashed
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Branches (locations per vendor)
export const branches = pgTable("branches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Customers
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  whatsapp: text("whatsapp").notNull(),
  birthday: text("birthday"), // Stored as YYYY-MM-DD string
  balance: integer("balance").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Transactions
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  customerId: varchar("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 10 }).notNull(), // 'EARN' or 'REDEEM'
  amount: real("amount"), // Purchase amount (for EARN transactions)
  points: integer("points").notNull(),
  branchId: varchar("branch_id").references(() => branches.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Settings (per vendor)
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().unique().references(() => vendors.id, { onDelete: "cascade" }),
  rate: real("rate").default(0.05).notNull(), // Points per dollar (0.05 = 5%)
  activeBranchId: varchar("active_branch_id").references(() => branches.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Event logs (WhatsApp notifications, system events)
export const eventLogs = pgTable("event_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 20 }).notNull(), // 'WHATSAPP' or 'SYSTEM'
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Legacy users table (keeping for compatibility, but vendors is the new one)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Schemas for validation
export const insertVendorSchema = createInsertSchema(vendors).pick({
  username: true,
  password: true,
  email: true,
});

export const insertCustomerSchema = createInsertSchema(customers).pick({
  vendorId: true,
  name: true,
  whatsapp: true,
  birthday: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  vendorId: true,
  customerId: true,
  type: true,
  amount: true,
  points: true,
  branchId: true,
});

export const insertBranchSchema = createInsertSchema(branches).pick({
  vendorId: true,
  name: true,
});

export const insertSettingsSchema = createInsertSchema(settings).pick({
  vendorId: true,
  rate: true,
  activeBranchId: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Branch = typeof branches.$inferSelect;
export type InsertBranch = z.infer<typeof insertBranchSchema>;
export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type EventLog = typeof eventLogs.$inferSelect;
