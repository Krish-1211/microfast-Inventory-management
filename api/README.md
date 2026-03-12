# Backend API

This is the backend for the Inventory and Invoice Management System, built with Node.js, Express, and PostgreSQL (Supabase).

## Setup

1.  **Install Dependencies**
    ```bash
    cd backend
    npm install
    ```

2.  **Database Setup (Supabase)**
    - Create a new project in Supabase.
    - Go to the SQL Editor in Supabase Dashboard.
    - Copy the content of `backend/database/schema.sql` and run it to create the tables.

3.  **Environment Variables**
    - Copy `.env.example` to `.env`.
    - Update `DATABASE_URL` with your Supabase connection string (Transaction mode, port 6543 or Session mode 5432).
    - Set a `JWT_SECRET`.

    ```bash
    cp .env.example .env
    ```

4.  **Run Server**
    ```bash
    npm run dev  # (You might need to add nodemon for dev or use node index.js)
    # or
    node index.js
    ```

## API Endpoints

### Auth
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user profile

### Clients
- `GET /clients` - Get all clients
- `POST /clients` - Create client (Admin)
- `PUT /clients/:id` - Update client (Admin)
- `DELETE /clients/:id` - Delete client (Admin)

### Products
- `GET /products` - Get all products
- `POST /products` - Create product (Admin)
- `PUT /products/:id` - Update product (Admin)
- `DELETE /products/:id` - Delete product (Admin)

### Invoices
- `GET /invoices` - Get all invoices (Admin)
- `POST /invoices` - Create invoice (Admin)
- `GET /invoices/:id` - Get invoice details
- `DELETE /invoices/:id` - Delete invoice (Admin)
- `GET /my-invoices` - Get logged-in client's invoices

### Dashboard
- `GET /dashboard/stats` - Get system statistics

## Folder Structure
- `config/` - Database connection
- `controllers/` - Request handlers
- `models/` - Database queries
- `routes/` - API routes
- `services/` - Business logic
- `middleware/` - Auth & Error handling
