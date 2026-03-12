# Microfast Distribution - Features & Documentation

## 📌 Project Overview
The **Microfast Inventory Management System** is a comprehensive internal business tool designed for **MICROFAST DISTRIBUTION COMPANY LIMITED** to manage products, clients, invoices, and orders. It features a robust administrator dashboard for full business oversight.

---

## 🚀 Core Features

### 1. Administrator Dashboard
- **Business Insights**: Real-time metrics on total revenue, pending orders, and active clients.
- **System Overview**: Visual representation of business health and recent activity logs.

### 2. Inventory & Product Management
- **Catalog Management**: Full CRUD (Create, Read, Update, Delete) operations for products.
- **Categorization**: Products are organized into specific groups: **Cleaners**, **Sealers**, and **Aerosols**.
- **Stock Tracking**: Real-time monitoring of inventory levels.
- **Pricing**: Manage product pricing and associated tax configurations.
- **Media**: Support for product images to enhance the catalog view.

### 3. Client Management
- **Customer Database**: Centralized repository for all client information (Name, Email, Phone, Address).
- **History Tracking**: View all invoices and orders associated with specific clients.
- **Admin Controls**: Create and modify client profiles.

### 4. Professional Invoicing System
- **Invoice Generation**: Intuitive form to create professional invoices for clients.
- **PDF Export**: Generate and download high-quality PDF versions of invoices for sharing/printing.
- **History & Tracking**: Categorized view of all generated invoices with status tracking.
- **Sequential Numbering**: Automatic generation of sequential invoice/order numbers for better bookkeeping.

### 5. Order Management
- **Order Lifecycle**: Track orders from "Pending" to "Completed".
- **Internal Ordering**: Admins can place orders directly on behalf of clients.



### 8. System Settings & Customization
- **Business Identity**: Configurable business name, email, and address.
- **Financial Prefrences**: Set default currency and global tax rates.
- **Invoice Customization**: Define custom invoice prefixes (e.g., `INV-2024-`).
- **Notification Center**: Granular control over email notifications for events like:
    - Invoice Creation
    - Payment Reception
    - Overdue Invoices
    - New Client Registrations
    - Low Stock Alerts
- **Account Security**: Secure password management for administrative users.

---

## 🛠 Technical Stack

### Frontend
- **Framework**: [React](https://reactjs.org/) (with [Vite](https://vitejs.dev/) for fast development).
- **Language**: [TypeScript](https://www.typescriptlang.org/) for type safety.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/) components.
- **Icons**: [Lucide React](https://lucide.dev/).
- **State Management**: [TanStack Query](https://tanstack.com/query/latest) (React Query) for server-state.
- **PDF Generation**: [jsPDF](https://github.com/parallax/jsPDF) and [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable).

### Backend
- **Runtime**: [Node.js](https://nodejs.org/).
- **Framework**: [Express.js](https://expressjs.com/).
- **Database**: [PostgreSQL](https://www.postgresql.org/) (Configured for [Supabase](https://supabase.com/)).
- **Authentication**: [JWT (JSON Web Tokens)](https://jwt.io/) for secure sessions and Bcrypt for password hashing.

---

## 📂 Project Structure

### Frontend (`/src`)
- `components/`: Reusable UI elements (Buttons, Inputs, Modals).
- `pages/`: Main application views (Dashboard, Inventory, Invoices, etc.).
- `hooks/`: Custom React hooks for data fetching and state logic.
- `lib/`: Utility functions and API clients.

### Backend (`/backend`)
- `controllers/`: Handles incoming requests and business logic.
- `models/`: Direct interaction with the database.
- `routes/`: Express route definitions.
- `middleware/`: Authentication and security guards.
- `database/`: SQL schema and migration scripts.

---

## ⚙️ Configuration & Deployment
- **Deployment**: Configured for deployment on **Render** (via `render.yaml`) and **Vercel**.
- **Environment Variables**: Managed via `.env` files for both frontend and backend (DB URLs, API keys, JWT secrets).
- **Taxes**: Support for configurable tax rates (GST, etc.) across the platform.

---
*Last Updated: March 4, 2026*
