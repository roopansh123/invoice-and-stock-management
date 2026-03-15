# 🥾 RFI — Ram Footware Industries
## Billing & Inventory Management System

A full-stack **MERN + Electron** desktop application for managing billing, inventory, customers, suppliers, and business analytics.

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Chart.js, react-to-print |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose ODM) |
| Desktop | Electron 28 |
| Auth | JWT + bcrypt |
| Styling | Custom CSS (dark theme, no external UI lib) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+ (https://nodejs.org)
- **MongoDB** v6+ running locally (https://www.mongodb.com)
- **npm** v9+

### Installation

```bash
# 1. Clone / unzip the project
cd rfi-app

# 2. Install all dependencies (root + server + client)
npm run install-all

# 3. Configure environment
# Edit server/.env and update:
#   MONGO_URI — your MongoDB connection string
#   JWT_SECRET — change to a strong random string in production

# 4. Start in development mode
npm start
```

This will launch:
- 🟢 Express server on `http://localhost:5000`
- 🔵 React dev server on `http://localhost:3000`
- 🖥️ Electron desktop window

### First Time Setup

1. On the login screen, click **"Initialize Admin"** to create the default admin account
2. Login with: `admin@rfi.com` / `admin123`
3. **Change the password** immediately in settings

---

## 🏗️ Project Structure

```
rfi-app/
├── electron/
│   ├── main.js          ← Electron main process
│   └── preload.js       ← Context bridge (security)
├── server/
│   ├── index.js         ← Express app entry
│   ├── models/
│   │   ├── Product.js
│   │   ├── Customer.js
│   │   ├── Invoice.js
│   │   ├── SupplierPurchase.js
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── customers.js
│   │   ├── invoices.js
│   │   ├── purchases.js
│   │   ├── suppliers.js
│   │   └── dashboard.js
│   └── middleware/
│       └── auth.js
├── client/
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.js
│       │   ├── Inventory.js
│       │   ├── NewBill.js      ← POS / Billing
│       │   ├── Invoices.js
│       │   ├── InvoiceDetail.js
│       │   ├── Customers.js
│       │   ├── Purchases.js
│       │   ├── Suppliers.js
│       │   └── Reports.js
│       ├── components/
│       │   ├── Layout/Layout.js
│       │   └── Billing/InvoicePrint.js
│       ├── context/AuthContext.js
│       └── styles/global.css
└── package.json         ← Root (Electron)
```

---

## ✨ Features

### 🧾 Billing & Invoicing
- GST Invoice generation (CGST/SGST for intrastate, IGST for interstate)
- Non-GST invoices supported
- Auto-generated invoice numbers: `RFI/YYMM/0001`
- Discount support (% or flat per item)
- Round-off calculation
- Multiple payment methods (Cash, UPI, Card, Bank Transfer, Credit)
- Partial payment tracking
- Print-ready invoice layout (A4)

### 👟 Inventory Management
- Size-wise stock tracking (Indian + UK sizes)
- Low stock alerts with configurable thresholds
- Product categories: Formal, Casual, Sports, Sandals, Boots, Kids, Ladies
- Brand management
- HSN code & GST rate per product
- Cost price, selling price & MRP tracking
- Profit margin calculation

### 👥 Customer Management
- Customer types: Retail, Wholesale, Dealer
- GSTIN storage for B2B
- Purchase history tracking
- Outstanding balance management
- Credit limit configuration

### 📦 Purchase Orders
- Supplier management with payment terms
- Size-wise procurement
- Receive stock (auto updates inventory)
- Cost price management

### 📊 Reports & Analytics
- Daily/Monthly/Yearly revenue
- Revenue by product category
- Payment method breakdown
- Top-selling products
- 6-month revenue trend chart
- Date-range filtering

### 🔐 Authentication
- Role-based access: Admin, Manager, Cashier
- JWT authentication (7-day expiry)
- Secure password hashing (bcrypt)

---

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| GET | `/api/dashboard` | Dashboard stats |
| GET | `/api/dashboard/reports` | Analytics |
| GET/POST | `/api/products` | Products CRUD |
| PATCH | `/api/products/:id/stock` | Stock adjustment |
| GET/POST | `/api/customers` | Customers CRUD |
| GET/POST | `/api/invoices` | Invoices |
| PATCH | `/api/invoices/:id/payment` | Record payment |
| GET/POST | `/api/purchases` | Purchase orders |
| PATCH | `/api/purchases/:id/receive` | Receive stock |
| GET/POST | `/api/suppliers` | Suppliers CRUD |

---

## 🏭 Building for Production

```bash
# Build React app
cd client && npm run build && cd ..

# Package as desktop app
npm run build
# Output in ./dist/
```

---

## 🔒 Security Notes

1. Change `JWT_SECRET` in `.env` before production deployment
2. Change default admin password immediately after first login
3. Use MongoDB Atlas or secure self-hosted MongoDB in production
4. The `.env` file is included for development — **never commit it to git**

---

## 📝 GST Compliance

The system handles:
- **Intrastate sales**: CGST + SGST (split 50/50)
- **Interstate sales**: IGST (full rate)
- HSN code tracking (default: 6403 for footwear)
- GST rates: 0%, 5%, 12%, 18%, 28%
- Taxable amount calculation after discount

---

*Built for Ram Footware Industries | Version 1.0.0*
