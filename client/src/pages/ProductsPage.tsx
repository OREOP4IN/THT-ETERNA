import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { formatCurrency, dollarsToCents, centsToDollars } from '../utils/format';
import {
  Box,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  AlertTriangle,
  RotateCcw,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
} from 'lucide-react';
import { AxiosError } from 'axios';

export interface StockMovement {
  id: string;
  productId: string;
  invoiceId?: string | null;
  quantityChange: number;
  reason: string;
  createdAt: string;
}

export interface Product {
  id: string;
  userId: string;
  sku: string;
  name: string;
  description?: string | null;
  unitPrice: number; // in cents
  quantityOnHand: number;
  stockMovements?: StockMovement[];
  createdAt: string;
  updatedAt: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [historyMovements, setHistoryMovements] = useState<StockMovement[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form Fields
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [stockInput, setStockInput] = useState('');

  const handleOpenHistory = async (product: Product) => {
    setHistoryProduct(product);
    setHistoryLoading(true);
    try {
      const res = await api.get<{ data: Product }>(`/products/${product.id}`);
      setHistoryMovements(res.data.data.stockMovements || []);
    } catch {
      setHistoryMovements([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchProducts = useCallback(async (pageToFetch = 1, searchQuery = search) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ data: Product[]; meta: PaginationMeta }>('/products', {
        params: {
          page: pageToFetch,
          limit: 10,
          search: searchQuery.trim() || undefined,
        },
      });
      setProducts(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      const axiosErr = err as AxiosError<{ error?: { message?: string } }>;
      setError(axiosErr.response?.data?.error?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [search]);

  // Search debounce thank you IG reels
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(1, search);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [fetchProducts, search]);

  const handleOpenCreate = () => {
    setSku('');
    setName('');
    setDescription('');
    setPriceInput('');
    setStockInput('0');
    setModalError(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setDescription(p.description || '');
    setPriceInput(centsToDollars(p.unitPrice));
    setStockInput(p.quantityOnHand.toString());
    setModalError(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const priceInCents = dollarsToCents(priceInput);
    const quantity = parseInt(stockInput, 10);

    if (isNaN(priceInCents) || priceInCents < 0) {
      setModalError('Unit price must be a valid non-negative amount.');
      return;
    }
    if (isNaN(quantity) || quantity < 0) {
      setModalError('Quantity on hand cannot be negative.');
      return;
    }

    setModalSubmitting(true);
    try {
      await api.post('/products', {
        sku: sku.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim() || undefined,
        unitPrice: priceInCents,
        quantityOnHand: quantity,
      });
      setIsCreateOpen(false);
      fetchProducts(meta.page);
    } catch (err) {
      const axiosErr = err as AxiosError<{ error?: { message?: string } }>;
      setModalError(axiosErr.response?.data?.error?.message || 'Failed to create product');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setModalError(null);

    const priceInCents = dollarsToCents(priceInput);
    const quantity = parseInt(stockInput, 10);

    if (isNaN(priceInCents) || priceInCents < 0) {
      setModalError('Unit price must be a valid non-negative amount.');
      return;
    }
    if (isNaN(quantity) || quantity < 0) {
      setModalError('Quantity on hand cannot be negative.');
      return;
    }

    setModalSubmitting(true);
    try {
      await api.put(`/products/${editingProduct.id}`, {
        name: name.trim(),
        description: description.trim() || undefined,
        unitPrice: priceInCents,
        quantityOnHand: quantity,
      });
      setEditingProduct(null);
      fetchProducts(meta.page);
    } catch (err) {
      const axiosErr = err as AxiosError<{ error?: { message?: string } }>;
      setModalError(axiosErr.response?.data?.error?.message || 'Failed to update product');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    setModalSubmitting(true);
    setModalError(null);
    try {
      await api.delete(`/products/${deletingProduct.id}`);
      setDeletingProduct(null);
      fetchProducts(meta.page);
    } catch (err) {
      const axiosErr = err as AxiosError<{ error?: { message?: string } }>;
      setModalError(axiosErr.response?.data?.error?.message || 'Failed to delete product');
    } finally {
      setModalSubmitting(false);
    }
  };

  const getStockBadge = (quantity: number) => {
    if (quantity === 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          Out of Stock (0)
        </span>
      );
    }
    if (quantity <= 10) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Low Stock ({quantity})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        In Stock ({quantity})
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Box className="w-6 h-6 text-emerald-600" />
            Product Catalog
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Maintain item SKUs, descriptions, unit prices, and quantities on hand.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-semibold text-slate-800">{products.length}</span> of{' '}
          <span className="font-semibold text-slate-800">{meta.total}</span> total items
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-rose-800 text-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchProducts(meta.page)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 hover:underline"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
            <p className="text-sm font-medium">Loading inventory records...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center">
            <PackageCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No products found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              {search
                ? `No products match "${search}". Try searching with a different keyword.`
                : 'Your catalog is currently empty. Click "Add Product" to create your first item.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500 tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">SKU</th>
                  <th className="py-3.5 px-6">Product Details</th>
                  <th className="py-3.5 px-6">Unit Price</th>
                  <th className="py-3.5 px-6">Stock on Hand</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6 font-mono text-xs font-semibold text-slate-800">
                      <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200">
                        {product.sku}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-900">{product.name}</div>
                      {product.description && (
                        <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {product.description}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-900">
                      {formatCurrency(product.unitPrice)}
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleOpenHistory(product)}
                        className="group focus:outline-none cursor-pointer"
                        title="Click to view stock audit ledger"
                      >
                        {getStockBadge(product.quantityOnHand)}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right space-x-1">
                      <button
                        onClick={() => handleOpenHistory(product)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                        title="View Stock Movement Ledger"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(product)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                        title="Edit Product"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setDeletingProduct(product);
                          setModalError(null);
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {meta.totalPages > 1 && (
          <div className="border-t border-slate-200 px-6 py-3.5 bg-slate-50 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Page <span className="font-semibold text-slate-800">{meta.page}</span> of{' '}
              <span className="font-semibold text-slate-800">{meta.totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={meta.page <= 1}
                onClick={() => fetchProducts(meta.page - 1)}
                className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <button
                disabled={meta.page >= meta.totalPages}
                onClick={() => fetchProducts(meta.page + 1)}
                className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Product Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Add New Product</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  SKU (Stock Keeping Unit)
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g. SKU-ITEM-01"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Industrial Barcode Scanner"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief details about the product..."
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Unit Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    placeholder="0.00"
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none font-mono"
                  />
                  <p className="text-[11px] text-slate-600 mt-1">Saved as integer cents</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={stockInput}
                    onChange={(e) => setStockInput(e.target.value)}
                    placeholder="0"
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none font-mono"
                  />
                  <p className="text-[11px] text-slate-600 mt-1">Quantity on hand</p>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition disabled:opacity-60 flex items-center gap-2"
                >
                  {modalSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Edit Product</h3>
                <span className="font-mono text-xs text-slate-600 font-semibold">{editingProduct.sku}</span>
              </div>
              <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Unit Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none font-mono"
                  />
                  <p className="text-[11px] text-slate-600 mt-1">Updates future invoices</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Stock on Hand
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={stockInput}
                    onChange={(e) => setStockInput(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none font-mono"
                  />
                  <p className="text-[11px] text-slate-600 mt-1">Audit log recorded</p>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition disabled:opacity-60 flex items-center gap-2"
                >
                  {modalSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Update Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Delete Product</h3>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Are you sure you want to delete{' '}
              <strong className="text-slate-900">{deletingProduct.name}</strong> (SKU:{' '}
              <span className="font-mono text-xs">{deletingProduct.sku}</span>)?
            </p>

            {modalError && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingProduct(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={modalSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold shadow-sm transition disabled:opacity-60 flex items-center gap-2"
              >
                {modalSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Movement Ledger Modal */}
      {historyProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Stock Movement Audit Ledger</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>{historyProduct.name}</span>
                      <span>•</span>
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{historyProduct.sku}</span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setHistoryProduct(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-100 bg-slate-50/60 -mx-6 px-6">
              <div>
                <div className="text-xs text-slate-500 font-medium">Current Quantity on Hand</div>
                <div className="text-xl font-bold text-slate-900 mt-0.5">{historyProduct.quantityOnHand} units</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Total Recorded Events</div>
                <div className="text-xl font-bold text-blue-600 mt-0.5">{historyMovements.length} transactions</div>
              </div>
            </div>

            {/* Content List */}
            <div className="overflow-y-auto flex-1 py-4">
              {historyLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mb-2" />
                  <span className="text-xs">Loading movement history...</span>
                </div>
              ) : historyMovements.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium">No recorded movements yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {historyMovements.map((movement) => {
                    const isPositive = movement.quantityChange > 0;
                    return (
                      <div key={movement.id} className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              isPositive
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-rose-50 text-rose-600'
                            }`}
                          >
                            {isPositive ? (
                              <ArrowDownLeft className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold uppercase tracking-wider text-slate-800">
                                {movement.reason.replace(/_/g, ' ')}
                              </span>
                              {movement.invoiceId && (
                                <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                  Invoice linked
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {new Date(movement.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        <div
                          className={`font-mono font-bold text-sm ${
                            isPositive ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isPositive ? `+${movement.quantityChange}` : movement.quantityChange} units
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setHistoryProduct(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition cursor-pointer"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
