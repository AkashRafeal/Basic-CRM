import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Download,
  IndianRupee,
  Boxes,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Eye,
  Edit3,
  RefreshCw,
  Percent,
  Layers,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Product, ProductStats, ProductCategory, ProductStatus, BillingFrequency, CategoryItem } from '../types/product';
import { productApi } from '../api/productApi';
import { CreateProductModal } from '../components/products/CreateProductModal';
import { EditProductModal } from '../components/products/EditProductModal';
import { StockAdjustmentModal } from '../components/products/StockAdjustmentModal';
import { ProductDetailModal } from '../components/products/ProductDetailModal';
import { CreateCategoryModal } from '../components/products/CreateCategoryModal';
import { CategoryDirectoryModal } from '../components/products/CategoryDirectoryModal';
import { triggerRefreshBlink } from '../components/common/RefreshFeedbackOverlay';

export const ProductManagement: React.FC = () => {
  const { isAdmin, isManager } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | ''>('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | ''>('');
  const [billingFilter, setBillingFilter] = useState<BillingFrequency | ''>('');
  const [lowStockFilter, setLowStockFilter] = useState<boolean>(false);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState<boolean>(false);
  const [isCategoryDirectoryOpen, setIsCategoryDirectoryOpen] = useState<boolean>(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);
  const [selectedProductForStock, setSelectedProductForStock] = useState<Product | null>(null);

  const fetchCategories = async () => {
    try {
      const list = await productApi.getCategories();
      setCategories(list);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const fetchCatalogData = async () => {
    try {
      setLoading(true);
      const [prodRes, statsData] = await Promise.all([
        productApi.getProducts({
          search: search || undefined,
          category: categoryFilter || undefined,
          status: statusFilter || undefined,
          billingFrequency: billingFilter || undefined,
          lowStockOnly: lowStockFilter || undefined,
          size: 50,
        }),
        productApi.getProductStats(),
      ]);

      setProducts(prodRes?.data || []);
      setStats(statsData || null);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // If search is cleared or any filter changes, reload immediately
    // If typing, debounce slightly (250ms)
    const timer = setTimeout(() => {
      fetchCatalogData();
    }, search.trim() ? 250 : 0);

    return () => clearTimeout(timer);
  }, [search, categoryFilter, statusFilter, billingFilter, lowStockFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCatalogData();
  };

  const handleDeleteProduct = async (id: number, permanent = false) => {
    const confirmMsg = permanent
      ? 'Are you sure you want to PERMANENTLY delete this product? This action cannot be undone.'
      : 'Are you sure you want to archive this product? It will be marked Discontinued.';

    if (window.confirm(confirmMsg)) {
      try {
        await productApi.deleteProduct(id, permanent);
        fetchCatalogData();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to delete product.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header with Role Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-white tracking-tight">Products & Services Catalog</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  ₹ INR
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                Manage SaaS subscriptions, cloud infrastructure, service SLAs, hardware inventory, and ₹ pricing
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchCatalogData();
              fetchCategories();
              triggerRefreshBlink('Products refreshed');
            }}
            disabled={loading}
            title="Refresh Products"
            className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl font-semibold text-sm flex items-center gap-2 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Refresh</span>
          </button>

          {(isAdmin || isManager) && (
            <a
              href={productApi.exportCsvUrl()}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl font-semibold text-sm flex items-center gap-2 transition"
            >
              <Download className="w-4 h-4 text-slate-400" />
              Export CSV
            </a>
          )}

          <button
            onClick={() => setIsCategoryDirectoryOpen(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white rounded-xl font-bold text-sm flex items-center gap-2 transition shadow-sm"
          >
            <Layers className="w-4 h-4 text-indigo-400" />
            Categories Directory ({categories.length})
          </button>

          {(isAdmin || isManager) && (
            <button
              onClick={() => setIsCategoryOpen(true)}
              className="px-4 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-indigo-200 rounded-xl font-bold text-sm flex items-center gap-2 transition shadow-sm"
            >
              <Plus className="w-4 h-4 text-indigo-400" />
              Add Category
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition"
            >
              <Plus className="w-4 h-4" />
              Add Product / Service
            </button>
          )}
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Catalog Value</span>
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            ₹{(stats?.totalCatalogValue || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">Cumulative live catalog value</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Sellable Items</span>
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-400">{stats?.activeProducts || 0}</div>
          <p className="text-xs text-slate-400 mt-1 font-medium">Out of {stats?.totalProducts || 0} total products</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Low Stock Warnings</span>
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400">{stats?.lowStockAlerts || 0}</div>
          <p className="text-xs text-slate-400 mt-1 font-medium">Physical items below safety threshold</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Default Tax Rate</span>
            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-400">18% GST</div>
          <p className="text-xs text-slate-400 mt-1 font-medium">Standard Indian SaaS/Hardware GST</p>
        </div>
      </div>

      {/* Low Stock Urgent Notification Banner */}
      {stats && stats.lowStockAlerts > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-amber-500/5 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-200 flex items-center gap-2">
                Low Stock Warning ({stats.lowStockAlerts} {stats.lowStockAlerts === 1 ? 'Product' : 'Products'} Below Safety Threshold)
              </h4>
              <p className="text-xs text-amber-300/80 mt-0.5">
                Physical inventory items have reached or fallen below minimum safety levels. Reorder or stock adjustment needed.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setLowStockFilter((prev) => !prev)}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition shadow flex items-center gap-1.5 ${
                lowStockFilter
                  ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              {lowStockFilter ? 'Showing Low Stock' : 'View Low Stock Items'}
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl backdrop-blur-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search product by name, SKU, or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                title="Clear search and return to default catalog"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as ProductCategory | '')}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
              {categories.length > 0 ? (
                categories.map((c) => (
                  <option key={c.id} value={c.code || c.name}>
                    {c.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="SOFTWARE_SAAS">Software & SaaS</option>
                  <option value="CLOUD_INFRASTRUCTURE">Cloud Infrastructure</option>
                  <option value="CONSULTING_SERVICES">Consulting Services</option>
                  <option value="SUPPORT_MAINTENANCE">Support & Maintenance</option>
                  <option value="HARDWARE_EQUIPMENT">Hardware & Telephony</option>
                  <option value="ENTERPRISE_LICENSE">Enterprise License</option>
                </>
              )}
            </select>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ProductStatus | '')}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active & Sellable</option>
              <option value="DRAFT">Draft</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
              <option value="DISCONTINUED">Discontinued</option>
            </select>

            {/* Billing Cycle */}
            <select
              value={billingFilter}
              onChange={(e) => setBillingFilter(e.target.value as BillingFrequency | '')}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Billing Cycles</option>
              <option value="MONTHLY">Monthly</option>
              <option value="ANNUALLY">Annual</option>
              <option value="ONE_TIME">One-Time</option>
            </select>

            {/* Low Stock Toggle */}
            <button
              onClick={() => setLowStockFilter(!lowStockFilter)}
              className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                lowStockFilter
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" /> Low Stock
            </button>

            <button
              onClick={() => {
                setSearch('');
                setCategoryFilter('');
                setStatusFilter('');
                setBillingFilter('');
                setLowStockFilter(false);
                triggerRefreshBlink('Filters reset');
              }}
              className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition"
              title="Reset Filters"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
            <span>Loading product catalog...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Package className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-base font-semibold text-white">No products found</p>
            <p className="text-xs text-slate-500">Try adjusting your filters or add a new product item</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-4">Product / SKU</th>
                  <th className="px-4 py-4">Category</th>
                  <th className="px-4 py-4">Billing Cycle</th>
                  <th className="px-4 py-4 text-right">Unit Price (₹)</th>
                  {(isAdmin || isManager) && <th className="px-4 py-4 text-right">Margin %</th>}
                  <th className="px-4 py-4 text-center">Status</th>
                  <th className="px-4 py-4 text-center">Stock</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-5 py-4">
                      <div className="font-bold text-white text-sm hover:text-indigo-400 transition cursor-pointer" onClick={() => setSelectedProductForDetail(p)}>
                        {p.name}
                      </div>
                      <div className="text-xs text-indigo-400/90 font-mono mt-0.5">{p.sku}</div>
                    </td>

                    <td className="px-4 py-4 text-xs text-slate-300">
                      <span className="px-2 py-1 rounded-md bg-slate-950 border border-slate-800">
                        {p.categoryDisplayName}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-xs text-slate-400">
                      {p.billingFrequencyDisplayName}
                    </td>

                    <td className="px-4 py-4 text-right font-black text-emerald-400 text-sm">
                      ₹{p.unitPrice?.toLocaleString('en-IN')}
                    </td>

                    {(isAdmin || isManager) && (
                      <td className="px-4 py-4 text-right font-bold text-indigo-300 text-xs">
                        {p.marginPercent ? `${p.marginPercent}%` : 'N/A'}
                      </td>
                    )}

                    <td className="px-4 py-4 text-center">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                        p.status === 'ACTIVE'
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                          : p.status === 'OUT_OF_STOCK'
                          ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}>
                        {p.statusDisplayName}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center text-xs">
                      {p.isPhysical ? (
                        <span className={`font-bold ${p.isLowStock ? 'text-amber-400' : 'text-slate-300'}`}>
                          {p.stockQuantity || 0} units
                          {p.isLowStock && <span className="block text-[10px] text-amber-500 font-semibold">Low Stock</span>}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Digital SaaS</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedProductForDetail(p)}
                          className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition"
                          title="View Product Specifications"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {isAdmin && (
                          <button
                            onClick={() => setSelectedProductForEdit(p)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition"
                            title="Edit Product (Admin only)"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}

                        {isAdmin && p.isPhysical && (
                          <button
                            onClick={() => setSelectedProductForStock(p)}
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
                            title="Adjust Inventory Stock"
                          >
                            <Boxes className="w-4 h-4" />
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteProduct(p.id, true)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateProductModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          fetchCatalogData();
          fetchCategories();
        }}
        categories={categories}
      />

      <CreateCategoryModal
        isOpen={isCategoryOpen}
        onClose={() => setIsCategoryOpen(false)}
        onCategoryCreated={(newCat) => {
          setCategories((prev) => {
            if (prev.some((c) => c.id === newCat.id)) return prev;
            return [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name));
          });
          fetchCategories();
        }}
      />

      <CategoryDirectoryModal
        isOpen={isCategoryDirectoryOpen}
        categories={categories}
        onClose={() => setIsCategoryDirectoryOpen(false)}
        onOpenAddCategory={() => setIsCategoryOpen(true)}
        onCategoryDeleted={(deletedId) => {
          setCategories((prev) => prev.filter((c) => c.id !== deletedId));
          fetchCategories();
          fetchCatalogData();
        }}
      />

      <EditProductModal
        isOpen={!!selectedProductForEdit}
        product={selectedProductForEdit}
        categories={categories}
        onClose={() => setSelectedProductForEdit(null)}
        onSuccess={() => {
          fetchCatalogData();
          fetchCategories();
        }}
      />

      <StockAdjustmentModal
        isOpen={!!selectedProductForStock}
        product={selectedProductForStock}
        onClose={() => setSelectedProductForStock(null)}
        onSuccess={fetchCatalogData}
      />

      <ProductDetailModal
        isOpen={!!selectedProductForDetail}
        product={selectedProductForDetail}
        onClose={() => setSelectedProductForDetail(null)}
      />
    </div>
  );
};
