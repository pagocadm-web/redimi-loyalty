import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { requireAuth, getVendorId } from "./auth";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { customers, transactions, settings, branches } from "@shared/schema";
import passport from "passport";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    res.json({
      success: true,
      user: {
        id: req.user?.id,
        username: req.user?.username,
        email: req.user?.email,
      },
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", requireAuth, (req, res) => {
    res.json({
      id: req.user?.id,
      username: req.user?.username,
      email: req.user?.email,
    });
  });

  // Customer routes
  app.get("/api/customers", requireAuth, async (req, res) => {
    try {
      const vendorId = getVendorId(req);
      const customersList = await storage.getCustomers(vendorId);
      res.json(customersList);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/customers", requireAuth, async (req, res) => {
    try {
      const vendorId = getVendorId(req);
      const { name, whatsapp, birthday } = req.body;

      if (!name || !whatsapp) {
        return res.status(400).json({ message: "Name and WhatsApp are required" });
      }

      const customer = await storage.createCustomer({
        vendorId,
        name,
        whatsapp,
        birthday: birthday || null,
      });

      res.json(customer);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Transaction routes
  app.get("/api/transactions", requireAuth, async (req, res) => {
    try {
      const vendorId = getVendorId(req);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const transactionsList = await storage.getTransactions(vendorId, limit);

      // Enrich with customer names
      const enriched = await Promise.all(
        transactionsList.map(async (t) => {
          const customer = await storage.getCustomer(t.customerId, vendorId);
          return {
            ...t,
            customerName: customer?.name || "Unknown",
          };
        })
      );

      res.json(enriched);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/transactions/earn", requireAuth, async (req, res) => {
    try {
      const vendorId = getVendorId(req);
      const { customerId, amount } = req.body;

      if (!customerId || !amount || amount <= 0) {
        return res.status(400).json({ message: "Valid customerId and amount required" });
      }

      const customer = await storage.getCustomer(customerId, vendorId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // Get vendor settings for rate
      const vendorSettings = await storage.getSettings(vendorId);
      const rate = vendorSettings?.rate || 0.05;
      const points = Math.floor(amount * rate);

      // Update customer balance
      const newBalance = customer.balance + points;
      await storage.updateCustomerBalance(customerId, vendorId, newBalance);

      // Create transaction
      const transaction = await storage.createTransaction({
        vendorId,
        customerId,
        type: "EARN",
        amount,
        points,
        branchId: vendorSettings?.activeBranchId || null,
      });

      // Create event log
      const message = `Hola ${customer.name}, sumaste ${points} puntos. Total actual: ${newBalance} puntos.`;
      await storage.createEventLog(vendorId, "WHATSAPP", message);

      res.json({
        ...transaction,
        customerName: customer.name,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/transactions/redeem", requireAuth, async (req, res) => {
    try {
      const vendorId = getVendorId(req);
      const { customerId, points } = req.body;

      if (!customerId || !points || points <= 0) {
        return res.status(400).json({ message: "Valid customerId and points required" });
      }

      const customer = await storage.getCustomer(customerId, vendorId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      if (customer.balance < points) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Update customer balance
      const newBalance = customer.balance - points;
      await storage.updateCustomerBalance(customerId, vendorId, newBalance);

      // Get vendor settings
      const vendorSettings = await storage.getSettings(vendorId);

      // Create transaction
      const transaction = await storage.createTransaction({
        vendorId,
        customerId,
        type: "REDEEM",
        points,
        amount: null,
        branchId: vendorSettings?.activeBranchId || null,
      });

      // Create event log
      const message = `Hola ${customer.name}, canjeaste ${points} puntos. Total actual: ${newBalance} puntos.`;
      await storage.createEventLog(vendorId, "WHATSAPP", message);

      res.json({
        ...transaction,
        customerName: customer.name,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Stats route
  app.get("/api/stats", requireAuth, async (req, res) => {
    try {
      const vendorId = getVendorId(req);
      const transactionsList = await storage.getTransactions(vendorId, 10000);
      const customersList = await storage.getCustomers(vendorId);

      const totalPointsIssued = transactionsList
        .filter((t) => t.type === "EARN")
        .reduce((acc, t) => acc + t.points, 0);

      const totalPointsRedeemed = transactionsList
        .filter((t) => t.type === "REDEEM")
        .reduce((acc, t) => acc + t.points, 0);

      res.json({
        totalCustomers: customersList.length,
        totalPointsIssued,
        totalPointsRedeemed,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Settings routes
  app.get("/api/settings", requireAuth, async (req, res) => {
    try {
      const vendorId = getVendorId(req);
      let vendorSettings = await storage.getSettings(vendorId);

      // If no settings exist, create default
      if (!vendorSettings) {
        // Get or create default branch
        const branchesList = await storage.getBranches(vendorId);
        let defaultBranch = branchesList[0];

        if (!defaultBranch) {
          defaultBranch = await storage.createBranch({
            vendorId,
            name: "Main Store",
          });
        }

        vendorSettings = await storage.createSettings({
          vendorId,
          rate: 0.05,
          activeBranchId: defaultBranch.id,
        });
      }

      // Get branches for response
      const branchesList = await storage.getBranches(vendorId);

      res.json({
        rate: vendorSettings.rate,
        franchise: branchesList.find((b) => b.id === vendorSettings.activeBranchId)?.name || "Main Store",
        branches: branchesList.map((b) => b.name),
        activeBranchId: vendorSettings.activeBranchId,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/settings", requireAuth, async (req, res) => {
    try {
      const vendorId = getVendorId(req);
      const { rate, franchise, password } = req.body;

      const updates: any = {};

      if (rate !== undefined) {
        updates.rate = parseFloat(rate);
      }

      if (franchise) {
        // Find branch by name
        const branchesList = await storage.getBranches(vendorId);
        const branch = branchesList.find((b) => b.name === franchise);
        if (branch) {
          updates.activeBranchId = branch.id;
        }
      }

      if (password) {
        await storage.updateVendorPassword(vendorId, password);
      }

      const updatedSettings = await storage.updateSettings(vendorId, updates);

      // Get branches for response
      const branchesList = await storage.getBranches(vendorId);

      res.json({
        rate: updatedSettings.rate,
        franchise: branchesList.find((b) => b.id === updatedSettings.activeBranchId)?.name || "Main Store",
        branches: branchesList.map((b) => b.name),
        activeBranchId: updatedSettings.activeBranchId,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/settings/branches", requireAuth, async (req, res) => {
    try {
      const vendorId = getVendorId(req);
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Branch name is required" });
      }

      const branch = await storage.createBranch({
        vendorId,
        name,
      });

      // Get updated branches list
      const branchesList = await storage.getBranches(vendorId);

      res.json({
        branches: branchesList.map((b) => b.name),
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Event logs route
  app.get("/api/events", requireAuth, async (req, res) => {
    try {
      const vendorId = getVendorId(req);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const events = await storage.getEventLogs(vendorId, limit);
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
