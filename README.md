# VendorLink – Vendor / Supplier Portal
### CS5450 Mobile Programming — Group 7
**Dr. Sabah Mohammed | Department of Computer Science | Lakehead University**

---

## Overview

VendorLink is a full-featured **Vendor/Supplier Procurement Portal** built with **React Native 0.73.8 + Expo 51** using **TypeScript** and **local SQLite** (expo-sqlite) for on-device data storage. No internet or cloud account is needed to run the app.

### Two User Roles

| Role | Description |
|------|-------------|
| **Supplier** | Creates vendor accounts, manages products, reviews/accepts orders, generates invoices |
| **Vendor** | Browses products, places purchase orders, views order status and invoices |

---

## Core Features

### Supplier Portal
- **Dashboard** – live stats (vendors, products, orders, revenue)
- **Vendor Management** – create vendor accounts (username + password), view/delete vendors
- **Product Catalog** – add, edit, delete products (name, SKU, price, unit, stock, category)
- **Order Management** – view all incoming orders, accept or reject, generate auto invoice
- **Invoice Management** – view all invoices, mark as paid

### Vendor Portal
- **Dashboard** – live stats (orders, invoices, unpaid amounts)
- **Browse & Order** – search products, add to cart, set quantity, place orders with notes
- **My Orders** – track order status in real-time (pending → accepted → invoiced → rejected)
- **My Invoices** – view all invoices, see amounts, due dates, paid status

### Cross-Cutting
- Secure login (role-based routing)
- Full-text search on products and orders
- Responsive design for Android phones
- Local SQLite database (persists across app restarts)
- Status badges, filter tabs, dashboard stats
- Auto-generated invoice when supplier accepts an order

---

## Tech Stack

| Technology | Version |
|------------|---------|
| React Native | 0.73.8 |
| React | 18.2.0 |
| Expo | ~51.0.0 |
| expo-sqlite | ~14.0.6 |
| TypeScript | ^5.3.3 |
| React Navigation | v6 |
| @react-navigation/native-stack | ^6.9.26 |
| @react-navigation/bottom-tabs | ^6.5.20 |

---

## Project Structure

```
VendorSupplierPortal/
├── App.tsx                          ← Root entry point
├── app.json                         ← Expo config
├── package.json
├── tsconfig.json
├── babel.config.js
├── assets/
│   ├── icon.png
│   ├── splash.png
│   └── adaptive-icon.png
└── src/
    ├── types/
    │   └── index.ts                 ← All TypeScript interfaces
    ├── database/
    │   └── db.ts                    ← SQLite schema + all CRUD operations
    ├── context/
    │   └── AuthContext.tsx          ← Global auth state (login/logout)
    ├── components/
    │   ├── UI.tsx                   ← Shared components (Card, Button, Badge…)
    │   └── StyledInput.tsx          ← Reusable form input
    ├── navigation/
    │   └── AppNavigator.tsx         ← Root stack + supplier/vendor tab navigators
    └── screens/
        ├── auth/
        │   └── LoginScreen.tsx      ← Unified login for both roles
        ├── supplier/
        │   ├── SupplierDashboard.tsx
        │   ├── ManageVendors.tsx
        │   ├── CreateVendor.tsx
        │   ├── ManageProducts.tsx
        │   ├── CreateProduct.tsx
        │   ├── EditProduct.tsx
        │   ├── ManageOrders.tsx     ← Accept / Reject / Generate Invoice
        │   └── ManageInvoices.tsx   ← View + Mark Paid
        ├── vendor/
        │   ├── VendorDashboard.tsx
        │   ├── BrowseProducts.tsx   ← Cart + Place Order
        │   ├── VendorOrders.tsx
        │   ├── VendorOrderDetail.tsx
        │   ├── VendorInvoices.tsx
        │   └── VendorInvoiceDetail.tsx
        └── shared/
            ├── OrderDetail.tsx      ← Supplier order detail
            └── InvoiceDetail.tsx    ← Supplier invoice detail
```

---

## Database Schema (SQLite)

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | auto-generated |
| username | TEXT UNIQUE | login credential |
| password | TEXT | plain text (demo) |
| role | TEXT | `supplier` or `vendor` |
| name | TEXT | display name |
| email | TEXT | |
| phone | TEXT | optional |
| company | TEXT | optional |
| createdAt | TEXT | ISO date string |
| createdBy | TEXT | supplierId who created this vendor |

### `products`
| Column | Type |
|--------|------|
| id | TEXT PK |
| supplierId | TEXT FK |
| name, description, sku, category, unit | TEXT |
| price, stockQty | REAL |
| createdAt, updatedAt | TEXT |

### `orders` + `order_items`
Normalized order with line items. Status: `pending → accepted/rejected → invoiced → delivered`

### `invoices`
Auto-generated from accepted order. Status: `issued → paid / overdue`

---

## Installation & Setup

### Prerequisites
```
Node.js 18+
npm or yarn
Expo CLI:  npm install -g expo-cli
Android Studio (with emulator) OR physical Android device with Expo Go
```

### Steps

```bash
# 1. Unzip the package
unzip VendorSupplierPortal.zip
cd VendorSupplierPortal

# 2. Install dependencies
npm install

# 3. Start the development server
npx expo start

# 4a. Run on Android emulator
#     Press 'a' in the terminal after Metro starts

# 4b. Run on physical device
#     Install "Expo Go" from Play Store
#     Scan the QR code shown in terminal
```

> **No Firebase, no Supabase, no internet required.** All data is stored locally on the device using SQLite.

---

## Default Login Credentials

| Account | Username | Password | Role |
|---------|----------|----------|------|
| Apex Supplies Inc. | `admin` | `admin123` | Supplier |

The **supplier creates vendor accounts** from within the app (Vendors tab → New Vendor). Those credentials are displayed on the vendor card and can be used immediately to log in.

---

## Complete User Flow

```
1. SUPPLIER logs in with admin / admin123
2. SUPPLIER goes to Vendors → creates a vendor account (e.g. user: vendor1 / pass: pass123)
3. SUPPLIER goes to Products → adds products to the catalog
4. VENDOR logs in with vendor1 / pass123
5. VENDOR goes to Browse → adds products to cart → Places Order
6. SUPPLIER goes to Orders → sees pending order → clicks Accept
7. SUPPLIER clicks "Generate Invoice" → invoice auto-created
8. VENDOR goes to Invoices → sees the new invoice with amount and due date
9. SUPPLIER can mark invoice as Paid when payment is received
```

---

## Grading Criteria Coverage

| Criterion | Implementation |
|-----------|---------------|
| User Registration & Login | Role-based auth (Supplier + Vendor), credentials stored in SQLite |
| Personalized Dashboard | Separate supplier/vendor dashboards with live stats |
| Search Functionality | Product search by name/SKU/category; order search by number/vendor |
| Responsive Design | Flexible layouts, FlatList, ScrollView, KeyboardAvoidingView |
| Security Integration | Role-based navigation guard, input validation, session management |
| React Native / Expo | Full Expo 51 + React Native 0.73.8 implementation |
| Firebase/Supabase equiv. | expo-sqlite (local, on-device, persistent) |
| Android Emulator | Runs on Android emulator and physical device via Expo Go |

---

## GitHub Repository

> **[https://github.com/YOUR_USERNAME/vendor-supplier-portal](https://github.com/YOUR_USERNAME/vendor-supplier-portal)**
>
> _(Replace with your actual GitHub URL before submission)_

---

## Screenshots

_(Run the app and take screenshots of: Login, Supplier Dashboard, Create Vendor, Products, Orders, Accept Order, Invoice, Vendor Dashboard, Browse Products, Cart, My Orders, My Invoices)_

---

*Submitted for CS5450 Mobile Programming — Challenge 2 (Group 7)*
*Lakehead University, Thunder Bay, ON*
