// ─── User Types ─────────────────────────────────────────────────────────────
export type UserRole = 'supplier' | 'vendor';

export interface User {
  id: string;
  username: string;
  password: string; // stored as plain text for local/demo; hash in production
  role: UserRole;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  createdAt: string;
  createdBy?: string; // supplier id who created this vendor
}

// ─── Product Types ────────────────────────────────────────────────────────────
export interface Product {
  id: string;
  supplierId: string;
  name: string;
  description: string;
  price: number;
  unit: string; // e.g. "kg", "pcs", "box"
  stockQty: number;
  category: string;
  sku: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Order Types ─────────────────────────────────────────────────────────────
export type OrderStatus = 'pending' | 'accepted' | 'rejected' | 'invoiced' | 'delivered';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  vendorId: string;
  vendorName: string;
  supplierId: string;
  supplierName: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Invoice Types ────────────────────────────────────────────────────────────
export type InvoiceStatus = 'issued' | 'paid' | 'overdue';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  vendorId: string;
  vendorName: string;
  supplierId: string;
  supplierName: string;
  status: InvoiceStatus;
  subtotal: number;
  tax: number;
  totalAmount: number;
  dueDate: string;
  issuedAt: string;
  paidAt?: string;
}

// ─── Navigation Types ─────────────────────────────────────────────────────────
export type RootStackParamList = {
  Login: undefined;
  SupplierTabs: undefined;
  VendorTabs: undefined;
  // Supplier screens
  SupplierDashboard: undefined;
  ManageVendors: undefined;
  CreateVendor: undefined;
  ManageProducts: undefined;
  CreateProduct: undefined;
  EditProduct: { product: Product };
  ManageOrders: undefined;
  OrderDetail: { orderId: string };
  ManageInvoices: undefined;
  InvoiceDetail: { invoiceId: string };
  // Vendor screens
  VendorDashboard: undefined;
  BrowseProducts: undefined;
  CreateOrder: undefined;
  VendorOrders: undefined;
  VendorOrderDetail: { orderId: string };
  VendorInvoices: undefined;
  VendorInvoiceDetail: { invoiceId: string };
};
