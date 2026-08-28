export interface CategoryItem {
  id: number;
  name: string;
  code: string;
  description?: string;
  isSystemDefault?: boolean;
  createdAt?: string;
}

export type ProductCategory = string;

export type BillingFrequency =
  | 'ONE_TIME'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'ANNUALLY'
  | 'USAGE_BASED';

export type ProductStatus =
  | 'ACTIVE'
  | 'DRAFT'
  | 'DISCONTINUED'
  | 'OUT_OF_STOCK';

export interface Product {
  id: number;
  name: string;
  sku: string;
  category: ProductCategory;
  categoryDisplayName: string;
  description?: string;
  unitPrice: number; // in ₹ INR
  costPrice?: number; // Redacted for non-admin/non-manager
  marginAmount?: number;
  marginPercent?: number;
  taxRate: number; // e.g. 18% GST
  billingFrequency: BillingFrequency;
  billingFrequencyDisplayName: string;
  status: ProductStatus;
  statusDisplayName: string;
  stockQuantity?: number;
  lowStockThreshold?: number;
  isLowStock?: boolean;
  minQuantity: number;
  maxDiscountPercent: number;
  isPhysical: boolean;
  currencyCode: string;
  isArchived: boolean;
  createdByUserId?: number;
  createdByUserName?: string;
  createdByRole?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  draftProducts: number;
  discontinuedProducts: number;
  lowStockAlerts: number;
  totalCatalogValue: number; // in ₹ INR
  averageMarginPercent?: number;
  countByCategory: Record<string, number>;
  averagePriceByCategory: Record<string, number>;
}

export interface CreateProductDTO {
  name: string;
  sku: string;
  category: ProductCategory;
  description?: string;
  unitPrice: number;
  costPrice?: number;
  taxRate?: number;
  billingFrequency?: BillingFrequency;
  status?: ProductStatus;
  stockQuantity?: number;
  lowStockThreshold?: number;
  minQuantity?: number;
  maxDiscountPercent?: number;
  isPhysical?: boolean;
  currencyCode?: string;
}

export interface UpdateProductDTO {
  name?: string;
  sku?: string;
  category?: ProductCategory;
  description?: string;
  unitPrice?: number;
  costPrice?: number;
  taxRate?: number;
  billingFrequency?: BillingFrequency;
  status?: ProductStatus;
  stockQuantity?: number;
  lowStockThreshold?: number;
  minQuantity?: number;
  maxDiscountPercent?: number;
  isPhysical?: boolean;
}

export interface AdjustStockDTO {
  quantityChange: number;
  reason: string;
}
