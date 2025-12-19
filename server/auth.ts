import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { storage } from "./storage";
import bcrypt from "bcryptjs";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      email: string;
    }
  }
}

// Configure Passport Local Strategy
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const vendor = await storage.getVendorByUsername(username);
      if (!vendor) {
        return done(null, false, { message: "Invalid username or password" });
      }

      const isValid = await bcrypt.compare(password, vendor.password);
      if (!isValid) {
        return done(null, false, { message: "Invalid username or password" });
      }

      return done(null, {
        id: vendor.id,
        username: vendor.username,
        email: vendor.email,
      });
    } catch (error) {
      return done(error);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const vendor = await storage.getVendor(id);
    if (!vendor) {
      return done(null, false);
    }
    done(null, {
      id: vendor.id,
      username: vendor.username,
      email: vendor.email,
    });
  } catch (error) {
    done(error);
  }
});

// Middleware to check if user is authenticated
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Middleware to get vendor ID from session
export function getVendorId(req: Request): string {
  if (!req.user?.id) {
    throw new Error("User not authenticated");
  }
  return req.user.id;
}

