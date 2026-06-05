/**
 * db.ts — Firestore-backed database with in-memory cache
 *
 * Architecture:
 *  - On init, all data is loaded from Firestore into an in-memory store.
 *  - Real-time onSnapshot listeners keep the in-memory store up to date
 *    whenever another device changes data in Firestore.
 *  - All read functions are synchronous (they read from memory).
 *  - All write functions update memory first, then persist to Firestore async.
 *  - Screens that use useFocusEffect will therefore always show fresh data
 *    when navigated to, because the in-memory store is kept live by listeners.
 */

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { firestoreDb } from '../config/firebase';
import {
  User,
  Product,
  Order,
  OrderItem,
  Invoice,
  OrderStatus,
  InvoiceStatus,
} from '../types';

// ─── In-memory cache ──────────────────────────────────────────────────────────
let store: {
  users: Record<string, User>;
  products: Record<string, Product>;
  orders: Record<string, Order>;
  invoices: Record<string, Invoice>;
} = { users: {}, products: {}, orders: {}, invoices: {} };

let initialized = false;

// ─── Firestore persistence helpers ───────────────────────────────────────────
async function saveDoc(col: string, id: string, data: object): Promise<void> {
  await setDoc(doc(firestoreDb, col, id), data);
}

async function removeDoc(col: string, id: string): Promise<void> {
  await deleteDoc(doc(firestoreDb, col, id));
}

// ─── Real-time listeners ──────────────────────────────────────────────────────
function attachListeners(): void {
  onSnapshot(collection(firestoreDb, 'users'), (snap) => {
    store.users = {};
    snap.forEach((d) => { store.users[d.id] = d.data() as User; });
  });

  onSnapshot(collection(firestoreDb, 'products'), (snap) => {
    store.products = {};
    snap.forEach((d) => { store.products[d.id] = d.data() as Product; });
  });

  onSnapshot(collection(firestoreDb, 'orders'), (snap) => {
    store.orders = {};
    snap.forEach((d) => { store.orders[d.id] = d.data() as Order; });
  });

  onSnapshot(collection(firestoreDb, 'invoices'), (snap) => {
    store.invoices = {};
    snap.forEach((d) => { store.invoices[d.id] = d.data() as Invoice; });
  });
}

// ─── Default account definitions ─────────────────────────────────────────────
const DEFAULT_SUPPLIER: User = {
  id:        'supplier-001',
  username:  'admin',
  password:  'admin123',
  role:      'supplier',
  name:      'Apex Supplies Inc.',
  email:     'admin@apexsupplies.com',
  phone:     '555-0100',
  company:   'Apex Supplies Inc.',
  createdAt: '2024-01-01T00:00:00.000Z',
};

const DEFAULT_VENDOR: User = {
  id:        'vendor-001',
  username:  'vendor1',
  password:  'vendor123',
  role:      'vendor',
  name:      'Green Valley Traders',
  email:     'vendor1@greenvalley.com',
  phone:     '555-0200',
  company:   'Green Valley Traders',
  createdAt: '2024-01-01T00:00:00.000Z',
  createdBy: 'supplier-001',
};

// Step 1 — always put defaults in memory so login works even if Firestore fails
function seedMemory(): void {
  if (!store.users['supplier-001']) store.users['supplier-001'] = DEFAULT_SUPPLIER;
  if (!store.users['vendor-001'])   store.users['vendor-001']   = DEFAULT_VENDOR;
}

// ─── Init ─────────────────────────────────────────────────────────────────────
export async function initDatabase(): Promise<void> {
  if (initialized) return;
  initialized = true;

  // STEP 1 — put defaults in memory immediately so login works even offline
  seedMemory();

  try {
    // STEP 2 — load Firestore (15 s timeout so a bad network never hangs the app)
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Firebase connection timed out')), 15000)
    );

    const [usersSnap, productsSnap, ordersSnap, invoicesSnap] =
      await Promise.race([
        Promise.all([
          getDocs(collection(firestoreDb, 'users')),
          getDocs(collection(firestoreDb, 'products')),
          getDocs(collection(firestoreDb, 'orders')),
          getDocs(collection(firestoreDb, 'invoices')),
        ]),
        timeout,
      ]);

    // STEP 3 — merge Firestore data into memory (cloud is source of truth)
    usersSnap.forEach((d)    => { store.users[d.id]    = d.data() as User;    });
    productsSnap.forEach((d) => { store.products[d.id] = d.data() as Product; });
    ordersSnap.forEach((d)   => { store.orders[d.id]   = d.data() as Order;   });
    invoicesSnap.forEach((d) => { store.invoices[d.id] = d.data() as Invoice; });

    // STEP 4 — write defaults to Firestore only if they are MISSING FROM THE CLOUD.
    // We check the snapshot IDs (not store) because seedMemory() already put them
    // in store — checking store would always say "they exist" and skip the write.
    const cloudIds = new Set(usersSnap.docs.map((d) => d.id));
    const batch = writeBatch(firestoreDb);
    let needsWrite = false;

    if (!cloudIds.has('supplier-001')) {
      batch.set(doc(firestoreDb, 'users', 'supplier-001'), DEFAULT_SUPPLIER);
      needsWrite = true;
    }
    if (!cloudIds.has('vendor-001')) {
      batch.set(doc(firestoreDb, 'users', 'vendor-001'), DEFAULT_VENDOR);
      needsWrite = true;
    }
    if (needsWrite) {
      await batch.commit();
    }

    // STEP 5 — real-time listeners keep local cache in sync with other devices
    attachListeners();
  } catch (e) {
    console.warn('Firebase init error (app works with local defaults):', e);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  AUTH
// ─────────────────────────────────────────────────────────────────────────────
export async function loginUser(username: string, password: string): Promise<User | null> {
  return (
    Object.values(store.users).find(
      (u) => u.username === username && u.password === password
    ) ?? null
  );
}

export function getUserById(id: string): User | null {
  return store.users[id] ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
//  VENDORS
// ─────────────────────────────────────────────────────────────────────────────
export async function createVendor(
  vendor: Omit<User, 'id' | 'createdAt'>
): Promise<void> {
  const exists = Object.values(store.users).find(
    (u) => u.username === vendor.username
  );
  if (exists) throw new Error('Username already exists.');

  const id  = `vendor-${Date.now()}`;
  const now = new Date().toISOString();
  const newUser: User = { ...vendor, id, createdAt: now };
  store.users[id] = newUser;
  await saveDoc('users', id, newUser);
}

export function getAllVendors(supplierId: string): User[] {
  return Object.values(store.users)
    .filter((u) => u.role === 'vendor' && u.createdBy === supplierId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function deleteVendor(vendorId: string): Promise<void> {
  delete store.users[vendorId];
  await removeDoc('users', vendorId);
}

// ─────────────────────────────────────────────────────────────────────────────
//  PRODUCTS
// ─────────────────────────────────────────────────────────────────────────────
export async function createProduct(
  product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const skuExists = Object.values(store.products).find(
    (p) => p.sku === product.sku
  );
  if (skuExists) throw new Error('SKU already exists.');

  const id  = `prod-${Date.now()}`;
  const now = new Date().toISOString();
  const newProduct: Product = { ...product, id, createdAt: now, updatedAt: now };
  store.products[id] = newProduct;
  await saveDoc('products', id, newProduct);
}

export function getProductsBySupplierId(supplierId: string): Product[] {
  return Object.values(store.products)
    .filter((p) => p.supplierId === supplierId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getAllProducts(): Product[] {
  return Object.values(store.products).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

export async function updateProduct(product: Product): Promise<void> {
  const updated = { ...product, updatedAt: new Date().toISOString() };
  store.products[product.id] = updated;
  await saveDoc('products', product.id, updated);
}

export async function deleteProduct(id: string): Promise<void> {
  delete store.products[id];
  await removeDoc('products', id);
}

export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase();
  return Object.values(store.products).filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  ORDERS
// ─────────────────────────────────────────────────────────────────────────────
function generateOrderNumber(): string {
  return `ORD-${Date.now().toString().slice(-8)}`;
}

export async function createOrder(
  order: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>
): Promise<Order> {
  const id  = `order-${Date.now()}`;
  const now = new Date().toISOString();
  const newOrder: Order = {
    ...order,
    id,
    orderNumber: generateOrderNumber(),
    status:      'pending',
    createdAt:   now,
    updatedAt:   now,
  };
  store.orders[id] = newOrder;
  await saveDoc('orders', id, newOrder);
  return newOrder;
}

export function getOrderById(id: string): Order | null {
  return store.orders[id] ?? null;
}

export function getOrdersByVendor(vendorId: string): Order[] {
  return Object.values(store.orders)
    .filter((o) => o.vendorId === vendorId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getOrdersBySupplier(supplierId: string): Order[] {
  return Object.values(store.orders)
    .filter((o) => o.supplierId === supplierId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  if (!store.orders[orderId]) return;
  const updated = {
    ...store.orders[orderId],
    status,
    updatedAt: new Date().toISOString(),
  };
  store.orders[orderId] = updated;
  await saveDoc('orders', orderId, updated);
}

// ─────────────────────────────────────────────────────────────────────────────
//  INVOICES
// ─────────────────────────────────────────────────────────────────────────────
function generateInvoiceNumber(): string {
  return `INV-${Date.now().toString().slice(-8)}`;
}

export async function createInvoiceFromOrder(order: Order): Promise<Invoice> {
  const id     = `inv-${Date.now()}`;
  const now    = new Date().toISOString();
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const invoice: Invoice = {
    id,
    invoiceNumber: generateInvoiceNumber(),
    orderId:       order.id,
    orderNumber:   order.orderNumber,
    vendorId:      order.vendorId,
    vendorName:    order.vendorName,
    supplierId:    order.supplierId,
    supplierName:  order.supplierName,
    status:        'issued',
    subtotal:      order.subtotal,
    tax:           order.tax,
    totalAmount:   order.totalAmount,
    dueDate,
    issuedAt:      now,
  };

  const updatedOrder = {
    ...store.orders[order.id],
    status:    'invoiced' as OrderStatus,
    updatedAt: now,
  };

  store.invoices[id]      = invoice;
  store.orders[order.id]  = updatedOrder;

  // Write both documents together
  const batch = writeBatch(firestoreDb);
  batch.set(doc(firestoreDb, 'invoices', id), invoice);
  batch.set(doc(firestoreDb, 'orders', order.id), updatedOrder);
  await batch.commit();

  return invoice;
}

export function getInvoiceById(id: string): Invoice | null {
  return store.invoices[id] ?? null;
}

export function getInvoiceByOrderId(orderId: string): Invoice | null {
  return Object.values(store.invoices).find((i) => i.orderId === orderId) ?? null;
}

export function getInvoicesByVendor(vendorId: string): Invoice[] {
  return Object.values(store.invoices)
    .filter((i) => i.vendorId === vendorId)
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
}

export function getInvoicesBySupplier(supplierId: string): Invoice[] {
  return Object.values(store.invoices)
    .filter((i) => i.supplierId === supplierId)
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
}

export async function updateInvoiceStatus(
  invoiceId: string,
  status: InvoiceStatus
): Promise<void> {
  if (!store.invoices[invoiceId]) return;
  const updated = {
    ...store.invoices[invoiceId],
    status,
    paidAt: status === 'paid' ? new Date().toISOString() : undefined,
  };
  store.invoices[invoiceId] = updated;
  await saveDoc('invoices', invoiceId, updated);
}

// ─────────────────────────────────────────────────────────────────────────────
//  DASHBOARD STATS
// ─────────────────────────────────────────────────────────────────────────────
export function getSupplierStats(supplierId: string) {
  const vendors   = Object.values(store.users).filter(
    (u) => u.role === 'vendor' && u.createdBy === supplierId
  );
  const products  = Object.values(store.products).filter(
    (p) => p.supplierId === supplierId
  );
  const orders    = Object.values(store.orders).filter(
    (o) => o.supplierId === supplierId
  );
  const invoices  = Object.values(store.invoices).filter(
    (i) => i.supplierId === supplierId
  );
  return {
    totalVendors:  vendors.length,
    totalProducts: products.length,
    pendingOrders: orders.filter((o) => o.status === 'pending').length,
    totalOrders:   orders.length,
    totalInvoices: invoices.length,
    totalRevenue:  invoices
      .filter((i) => i.status === 'paid')
      .reduce((s, i) => s + i.totalAmount, 0),
  };
}

export function getVendorStats(vendorId: string) {
  const orders   = Object.values(store.orders).filter(
    (o) => o.vendorId === vendorId
  );
  const invoices = Object.values(store.invoices).filter(
    (i) => i.vendorId === vendorId
  );
  return {
    totalOrders:    orders.length,
    pendingOrders:  orders.filter((o) => o.status === 'pending').length,
    totalInvoices:  invoices.length,
    unpaidInvoices: invoices.filter((i) => i.status === 'issued').length,
    totalSpent:     invoices
      .filter((i) => i.status === 'paid')
      .reduce((s, i) => s + i.totalAmount, 0),
  };
}
