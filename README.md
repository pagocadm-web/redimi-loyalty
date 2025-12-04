# Pointy - Loyalty Points System

Pointy is a minimal, production-style web application for managing customer loyalty points. It allows vendors to register customers, add points based on purchases, and redeem rewards.

## Features

- **Vendor Dashboard**: Single-page view to manage everything.
- **Customer Management**: Add customers with Name, WhatsApp, and Birthday.
- **Points System**:
  - **Earn**: Add points based on purchase amount (1 Point per $1).
  - **Redeem**: Deduct points for rewards.
- **Simulated WhatsApp**: See "sent" messages in the System Logs panel.
- **QR Codes**: Generate QR codes for customer identification.
- **Transaction History**: Track all earning and redemption activities.

## Tech Stack

- **Frontend**: React, Tailwind CSS, Framer Motion, Shadcn UI.
- **State Management**: TanStack Query (React Query).
- **Mock Backend**: In-memory simulated API (`client/src/lib/mock-server.ts`).

## How to Run on Replit

1.  Open the Replit project.
2.  Click the **Run** button at the top.
3.  The application will build and start the development server on port 5000.
4.  Open the Webview tab to see the application.

## Usage Guide

1.  **Login**: Click "Login" on the initial screen (Demo credentials are pre-filled).
2.  **Add Customer**: Use the form on the left to add a new customer.
3.  **Select Customer**: Click on a customer in the list to select them.
4.  **Add Points**:
    - Select a customer.
    - Enter the purchase amount in the "Add Points" tab.
    - Click "Add Points".
    - Check the "WhatsApp Simulation Log" to see the notification.
5.  **Redeem Points**:
    - Switch to the "Redeem Reward" tab.
    - Enter points to redeem.
    - Click "Redeem".
6.  **QR Code**: Hover over a customer in the list and click the QR icon to view their code.

## Demo Data

The application starts with pre-loaded demo data:
- **Customers**: Maria Garcia, John Doe.
- **Transactions**: Initial history available.

To reset data, simply restart the generic Replit workflow.
