export type Role = 'ADMIN' | 'SALES' | 'PRODUCTION' | 'CUSTOMER';
export type QuoteStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
export type OrderStatus = 'PENDING' | 'IN_PRODUCTION' | 'READY_FOR_DISPATCH' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';
export type ProductionStage = 'PENDING' | 'PRINTING' | 'QUALITY_CHECK' | 'PACKING' | 'READY_TO_DISPATCH';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: Role;
  companyId?: string;
  company?: Company;
}

export interface Company {
  id: string;
  name: string;
  gstin?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  notes?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  _count?: { products: number };
}

export interface BulkPricing {
  id: string;
  minQuantity: number;
  maxQuantity: number;
  pricePerUnit: number;
  printType: string;
}

export interface ProductVariant {
  id: string;
  color: string;
  size: string;
  sku: string;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  hsnCode: string;
  gstRate: number;
  description: string;
  basePrice: number;
  images: string[];
  categoryId: string;
  category?: Category;
  bulkPricing?: BulkPricing[];
  variants?: ProductVariant[];
}

export interface QuoteItem {
  id: string;
  productId: string;
  product: Product;
  printType: string;
  color: string;
  size: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  customerId: string;
  customer: User;
  companyId?: string;
  company?: Company;
  status: QuoteStatus;
  subtotal: number;
  gstTotal: number;
  discount: number;
  totalAmount: number;
  notes?: string;
  validUntil: string;
  items: QuoteItem[];
  createdAt: string;
}

export interface ProductionJob {
  id: string;
  orderId: string;
  stage: ProductionStage;
  assignedToId?: string;
  assignedTo?: User;
  notes?: string;
  order?: Order;
}

export interface Order {
  id: string;
  orderNumber: string;
  quoteId?: string;
  customerId: string;
  customer: User;
  companyId?: string;
  company?: Company;
  status: OrderStatus;
  paymentStatus: string;
  subtotal: number;
  gstTotal: number;
  totalAmount: number;
  production?: ProductionJob;
  items: Array<{
    id: string;
    product: Product;
    printType: string;
    color: string;
    size: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  createdAt: string;
}
