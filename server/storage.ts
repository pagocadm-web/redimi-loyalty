import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";
import {
  type User,
  type InsertUser,
  type Vendor,
  type InsertVendor,
  type Customer,
  type InsertCustomer,
  type Transaction,
  type InsertTransaction,
  type Branch,
  type InsertBranch,
  type Settings,
  type InsertSettings,
  type EventLog,
  vendors,
  customers,
  transactions,
  branches,
  settings,
  eventLogs,
  users,
} from "@shared/schema";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

// Storage interface for all database operations
export interface IStorage {
  // Vendor operations
  getVendor(id: string): Promise<Vendor | undefined>;
  getVendorByUsername(username: string): Promise<Vendor | undefined>;
  getVendorByEmail(email: string): Promise<Vendor | undefined>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendorPassword(id: string, password: string): Promise<void>;

  // Customer operations
  getCustomers(vendorId: string): Promise<Customer[]>;
  getCustomer(id: string, vendorId: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomerBalance(id: string, vendorId: string, balance: number): Promise<void>;

  // Transaction operations
  getTransactions(vendorId: string, limit?: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;

  // Branch operations
  getBranches(vendorId: string): Promise<Branch[]>;
  createBranch(branch: InsertBranch): Promise<Branch>;

  // Settings operations
  getSettings(vendorId: string): Promise<Settings | undefined>;
  createSettings(settings: InsertSettings): Promise<Settings>;
  updateSettings(vendorId: string, updates: Partial<InsertSettings>): Promise<Settings>;

  // Event log operations
  getEventLogs(vendorId: string, limit?: number): Promise<EventLog[]>;
  createEventLog(vendorId: string, type: "WHATSAPP" | "SYSTEM", message: string): Promise<EventLog>;

  // Legacy user operations (for compatibility)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  // Vendor operations
  async getVendor(id: string): Promise<Vendor | undefined> {
    const result = await db.select().from(vendors).where(eq(vendors.id, id)).limit(1);
    return result[0];
  }

  async getVendorByUsername(username: string): Promise<Vendor | undefined> {
    const result = await db.select().from(vendors).where(eq(vendors.username, username)).limit(1);
    return result[0];
  }

  async getVendorByEmail(email: string): Promise<Vendor | undefined> {
    const result = await db.select().from(vendors).where(eq(vendors.email, email)).limit(1);
    return result[0];
  }

  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(vendor.password, 10);
    const result = await db
      .insert(vendors)
      .values({ ...vendor, password: hashedPassword })
      .returning();
    return result[0];
  }

  async updateVendorPassword(id: string, password: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db
      .update(vendors)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(vendors.id, id));
  }

  // Customer operations
  async getCustomers(vendorId: string): Promise<Customer[]> {
    return await db
      .select()
      .from(customers)
      .where(eq(customers.vendorId, vendorId))
      .orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: string, vendorId: string): Promise<Customer | undefined> {
    const result = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.vendorId, vendorId)))
      .limit(1);
    return result[0];
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const result = await db.insert(customers).values(customer).returning();
    return result[0];
  }

  async updateCustomerBalance(id: string, vendorId: string, balance: number): Promise<void> {
    await db
      .update(customers)
      .set({ balance, updatedAt: new Date() })
      .where(and(eq(customers.id, id), eq(customers.vendorId, vendorId)));
  }

  // Transaction operations
  async getTransactions(vendorId: string, limit = 100): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.vendorId, vendorId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const result = await db.insert(transactions).values(transaction).returning();
    return result[0];
  }

  // Branch operations
  async getBranches(vendorId: string): Promise<Branch[]> {
    return await db
      .select()
      .from(branches)
      .where(eq(branches.vendorId, vendorId))
      .orderBy(branches.createdAt);
  }

  async createBranch(branch: InsertBranch): Promise<Branch> {
    const result = await db.insert(branches).values(branch).returning();
    return result[0];
  }

  // Settings operations
  async getSettings(vendorId: string): Promise<Settings | undefined> {
    const result = await db
      .select()
      .from(settings)
      .where(eq(settings.vendorId, vendorId))
      .limit(1);
    return result[0];
  }

  async createSettings(settingsData: InsertSettings): Promise<Settings> {
    const result = await db.insert(settings).values(settingsData).returning();
    return result[0];
  }

  async updateSettings(vendorId: string, updates: Partial<InsertSettings>): Promise<Settings> {
    const result = await db
      .update(settings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(settings.vendorId, vendorId))
      .returning();
    return result[0];
  }

  // Event log operations
  async getEventLogs(vendorId: string, limit = 50): Promise<EventLog[]> {
    return await db
      .select()
      .from(eventLogs)
      .where(eq(eventLogs.vendorId, vendorId))
      .orderBy(desc(eventLogs.createdAt))
      .limit(limit);
  }

  async createEventLog(
    vendorId: string,
    type: "WHATSAPP" | "SYSTEM",
    message: string
  ): Promise<EventLog> {
    const result = await db
      .insert(eventLogs)
      .values({ vendorId, type, message })
      .returning();
    return result[0];
  }

  // Legacy user operations (for compatibility)
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const result = await db
      .insert(users)
      .values({ ...user, password: hashedPassword })
      .returning();
    return result[0];
  }
}

// Use database storage if DATABASE_URL is set, otherwise fall back to memory
export const storage = process.env.DATABASE_URL
  ? new DatabaseStorage()
  : new (class MemStorage implements IStorage {
      private users: Map<string, User> = new Map();

      async getVendor() { return undefined; }
      async getVendorByUsername() { return undefined; }
      async getVendorByEmail() { return undefined; }
      async createVendor() { throw new Error("Database not configured"); }
      async updateVendorPassword() { throw new Error("Database not configured"); }
      async getCustomers() { return []; }
      async getCustomer() { return undefined; }
      async createCustomer() { throw new Error("Database not configured"); }
      async updateCustomerBalance() { throw new Error("Database not configured"); }
      async getTransactions() { return []; }
      async createTransaction() { throw new Error("Database not configured"); }
      async getBranches() { return []; }
      async createBranch() { throw new Error("Database not configured"); }
      async getSettings() { return undefined; }
      async createSettings() { throw new Error("Database not configured"); }
      async updateSettings() { throw new Error("Database not configured"); }
      async getEventLogs() { return []; }
      async createEventLog() { throw new Error("Database not configured"); }
      async getUser(id: string) { return this.users.get(id); }
      async getUserByUsername(username: string) {
        return Array.from(this.users.values()).find((u) => u.username === username);
      }
      async createUser(user: InsertUser): Promise<User> {
        const id = randomUUID();
        const newUser: User = { ...user, id };
        this.users.set(id, newUser);
        return newUser;
      }
    })();
