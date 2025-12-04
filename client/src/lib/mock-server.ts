import { z } from "zod";

// Types
export interface Customer {
  id: string;
  name: string;
  whatsapp: string;
  birthday?: string;
  createdAt: string;
  balance: number;
}

export interface Transaction {
  id: string;
  customerId: string;
  customerName: string;
  type: "EARN" | "REDEEM";
  amount?: number;
  points: number;
  createdAt: string;
}

export interface EventLog {
  id: string;
  type: "WHATSAPP" | "SYSTEM";
  message: string;
  createdAt: string;
}

// Mock Data Storage (In-Memory)
let customers: Customer[] = [
  {
    id: "1",
    name: "Maria Garcia",
    whatsapp: "+15550101",
    birthday: "1990-05-15",
    createdAt: new Date().toISOString(),
    balance: 150,
  },
  {
    id: "2",
    name: "John Doe",
    whatsapp: "+15550102",
    birthday: "1985-10-20",
    createdAt: new Date().toISOString(),
    balance: 50,
  },
];

let transactions: Transaction[] = [
  {
    id: "t1",
    customerId: "1",
    customerName: "Maria Garcia",
    type: "EARN",
    amount: 150,
    points: 150,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

let events: EventLog[] = [];

const POINTS_PER_UNIT = 1;

// Helper to simulate WhatsApp
const sendWhatsApp = (customer: Customer, message: string) => {
  const log = `[WHATSAPP] To ${customer.name} (${customer.whatsapp}): ${message}`;
  console.log(log);
  events.unshift({
    id: Math.random().toString(36).substr(2, 9),
    type: "WHATSAPP",
    message: message,
    createdAt: new Date().toISOString(),
  });
};

// API Functions
export const api = {
  getCustomers: async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return [...customers];
  },

  createCustomer: async (data: { name: string; whatsapp: string; birthday?: string }) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newCustomer: Customer = {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      createdAt: new Date().toISOString(),
      balance: 0,
    };
    customers.unshift(newCustomer);
    return newCustomer;
  },

  earnPoints: async (customerId: string, amount: number) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) throw new Error("Customer not found");

    const points = Math.floor(amount * POINTS_PER_UNIT);
    customer.balance += points;

    const transaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      customerId,
      customerName: customer.name,
      type: "EARN",
      amount,
      points,
      createdAt: new Date().toISOString(),
    };
    transactions.unshift(transaction);

    sendWhatsApp(customer, `Hola ${customer.name}, sumaste ${points} puntos en Pointy Store. Total actual: ${customer.balance} puntos.`);

    return transaction;
  },

  redeemPoints: async (customerId: string, points: number) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) throw new Error("Customer not found");

    if (customer.balance < points) {
      throw new Error("Insufficient balance");
    }

    customer.balance -= points;

    const transaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      customerId,
      customerName: customer.name,
      type: "REDEEM",
      points,
      createdAt: new Date().toISOString(),
    };
    transactions.unshift(transaction);

    sendWhatsApp(customer, `Hola ${customer.name}, canjeaste ${points} puntos en Pointy Store. Total actual: ${customer.balance} puntos.`);

    return transaction;
  },

  getTransactions: async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return [...transactions];
  },

  getEvents: async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return [...events];
  },

  getStats: async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const totalPointsIssued = transactions
      .filter((t) => t.type === "EARN")
      .reduce((acc, t) => acc + t.points, 0);
    const totalPointsRedeemed = transactions
      .filter((t) => t.type === "REDEEM")
      .reduce((acc, t) => acc + t.points, 0);
    
    return {
      totalCustomers: customers.length,
      totalPointsIssued,
      totalPointsRedeemed,
    };
  }
};
