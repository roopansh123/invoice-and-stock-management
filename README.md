## Billing & Inventory Management System

A full-stack **MERN + Electron** desktop application for managing billing, inventory, customers, suppliers, and business analytics.
This project was developed by **Roopansh Sethi** as a portfolio project to demonstrate full-stack development skills.

---

## 📦 Tech Stack

| Layer    | Technology                                          |
| -------- | --------------------------------------------------- |
| Frontend | React 18, React Router v6, Chart.js, react-to-print |
| Backend  | Node.js, Express.js                                 |
| Database | MongoDB (Mongoose ODM)                              |
| Desktop  | Electron 28                                         |
| Auth     | JWT + bcrypt                                        |
| Styling  | Custom CSS (dark theme, no external UI library)     |

---

## 🚀 Getting Started

### Prerequisites

* **Node.js** v18+
* **MongoDB** v6+ running locally
* **npm** v9+

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/roopansh123/invoice-and-stock-management.git

# 2. Navigate into the project
cd invoice-and-stock-management

# 3. Install dependencies
npm run install-all

# 4. Configure environment variables
# Edit server/.env and update:
# MONGO_URI — your MongoDB connection string
# JWT_SECRET — a secure random string

# 5. Start development environment
npm start
```

This will launch:

* 🟢 Express server on `http://localhost:5000`
* 🔵 React dev server on `http://localhost:3000`
* 🖥️ Electron desktop window

---

## 🏗️ Project Structure

```
invoice-and-stock-management/
├── electron/
│   ├── main.js
│   └── preload.js
├── server/
│   ├── index.js
│   ├── models/
│   ├── routes/
│   └── middleware/
├── client/
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── context/
│       └── styles/
└── package.json
```

---

## ✨ Features

### 🧾 Billing & Invoicing

* GST invoice generation (CGST / SGST / IGST)
* Automatic invoice numbering
* Discounts and round-off calculations
* Multiple payment methods
* Printable invoice layout

### 📦 Inventory Management

* Size-wise stock tracking
* Low stock alerts
* Category and brand management
* Cost price, selling price, and MRP tracking
* Profit margin calculations

### 👥 Customer Management

* Retail / Wholesale / Dealer customer types
* GSTIN support for B2B
* Purchase history
* Credit balance tracking

### 📊 Reports & Analytics

* Daily / Monthly / Yearly revenue reports
* Product category insights
* Payment method analytics
* Revenue trend charts

### 🔐 Authentication

* Role-based access (Admin / Manager / Cashier)
* JWT authentication
* Secure password hashing using bcrypt

---

## 🔧 API Endpoints

| Method   | Endpoint               | Description         |
| -------- | ---------------------- | ------------------- |
| POST     | /api/auth/login        | Login               |
| GET      | /api/dashboard         | Dashboard stats     |
| GET      | /api/dashboard/reports | Analytics           |
| GET/POST | /api/products          | Products CRUD       |
| GET/POST | /api/customers         | Customers CRUD      |
| GET/POST | /api/invoices          | Invoice operations  |
| GET/POST | /api/purchases         | Purchase orders     |
| GET/POST | /api/suppliers         | Supplier management |

---

## 🏭 Building for Production

```bash
cd client
npm run build
cd ..

npm run build
```

Desktop application will be generated in the **dist/** folder.

---

## 🔒 Security Notes

1. Change `JWT_SECRET` before production deployment.
2. Use a secure MongoDB instance (MongoDB Atlas recommended).
3. Do not commit `.env` files to version control.

---

## 👨‍💻 Author

**Roopansh Sethi**
Full Stack Developer (MERN Stack)

GitHub: https://github.com/roopansh123

---

*This project was created as a full-stack portfolio application demonstrating a complete billing and inventory management system.*
