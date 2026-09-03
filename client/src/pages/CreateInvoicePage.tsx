import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { formatCurrency } from '../utils/format';
import {
  FileText,
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  AlertTriangle,
  Receipt,
  Check,
} from 'lucide-react';
import { AxiosError } from 'axios';

interface ProductOption {
  id: string;
  sku: string;
  name: string;
  unitPrice: number; // in cents
  quantityOnHand: number;
}

interface FormLineItem {
  productId: string;
  quantity: number;
}

export const CreateInvoicePage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Form Fields
  const [customerName, setCustomerName] = useState('');
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<FormLineItem[]>([{ productId: '', quantity: 1 }]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taxPercent, setTaxPercent] = useState<number>(11);

  // Fetch available products and server-configs
  useEffect(() => {
    // Fetch system health and env configs
    api
      .get<{ taxPercent?: number }>('/health')
      .then((res) => {
        if (res.data.taxPercent !== undefined) {
          setTaxPercent(res.data.taxPercent);
        }
      })
      .catch(() => {
      });

    api
      .get<{ data: ProductOption[] }>('/products', { params: { limit: 100 } })
      .then((res) => {
        setProducts(res.data.data);
        if (res.data.data.length > 0 && items[0].productId === '') {
          setItems([{ productId: res.data.data[0].id, quantity: 1 }]);
        }
      })
      .catch(() => {
        setError('Failed to load product catalog for line items.');
      })
      .finally(() => {
        setProductsLoading(false);
      });
  }, []);

  const handleAddItem = () => {
    const defaultProduct = products.length > 0 ? products[0].id : '';
    setItems([...items, { productId: defaultProduct, quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, productId: string) => {
    const newItems = [...items];
    newItems[index].productId = productId;
    setItems(newItems);
  };

  const handleQuantityChange = (index: number, quantityStr: string) => {
    const qty = parseInt(quantityStr, 10);
    const newItems = [...items];
    newItems[index].quantity = isNaN(qty) ? 0 : Math.max(0, qty);
    setItems(newItems);
  };

  // Live Totals Calculations (Minor units in cents, 11% Tax)
  const productMap = new Map(products.map((p) => [p.id, p]));

  let subtotal = 0;
  let hasStockExceeded = false;

  const calculatedLines = items.map((item) => {
    const prod = productMap.get(item.productId);
    const unitPrice = prod?.unitPrice || 0;
    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;

    const isExceeded = prod ? item.quantity > prod.quantityOnHand : false;
    if (isExceeded) hasStockExceeded = true;

    return {
      ...item,
      product: prod,
      unitPrice,
      lineTotal,
      isExceeded,
    };
  });

  const taxAmount = Math.round((subtotal * taxPercent) / 100);
  const grandTotal = subtotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation checks
    if (!customerName.trim()) {
      setError('Customer name is required.');
      return;
    }

    if (items.some((i) => !i.productId)) {
      setError('All invoice line items must have a product selected.');
      return;
    }

    if (items.some((i) => i.quantity <= 0)) {
      setError('Quantity for all invoice items must be greater than zero.');
      return;
    }

    if (hasStockExceeded) {
      setError('One or more line items request more stock than is currently available on hand.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post<{ data: { id: string } }>('/invoices', {
        customerName: customerName.trim(),
        issueDate,
        dueDate,
        notes: notes.trim() || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      });

      navigate(`/invoices/${res.data.data.id}`);
    } catch (err) {
      const axiosErr = err as AxiosError<{ error?: { message?: string } }>;
      setError(axiosErr.response?.data?.error?.message || 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Button */}
      <Link
        to="/invoices"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Invoices
      </Link>

      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Create New Invoice
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Build a draft invoice with live pricing, stock guards, and reactive totals.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {productsLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <p className="text-sm font-medium">Loading catalog products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Products Available</h3>
          <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto mb-4">
            You must have at least one product in your inventory before you can create an invoice.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition"
          >
            Go to Products Catalog
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Invoice Header Details Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100">
              Customer & Billing Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer / Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Acme Logistics Global Ltd"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Issue Date *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Due Date *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Invoice Notes / Payment Terms (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Net 14 days. Wire transfer instructions..."
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* Line Items Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Invoice Line Items
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                Prices and product names are snapshotted
              </span>
            </div>

            <div className="space-y-3">
              {calculatedLines.map((line, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border transition ${
                    line.isExceeded
                      ? 'border-rose-300 bg-rose-50/40'
                      : 'border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    {/* Product Selector */}
                    <div className="sm:col-span-6">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Product Item #{index + 1}
                      </label>
                      <select
                        value={line.productId}
                        onChange={(e) => handleProductChange(index, e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku}) — {formatCurrency(p.unitPrice)} [Stock:{' '}
                            {p.quantityOnHand}]
                          </option>
                        ))}
                      </select>
                      {line.product && (
                        <div className="flex items-center gap-2 mt-1 text-[11px]">
                          <span className="text-slate-500">
                            Available Stock:{' '}
                            <strong className="text-slate-800 font-semibold">
                              {line.product.quantityOnHand}
                            </strong>
                          </span>
                          {line.isExceeded && (
                            <span className="text-rose-600 font-semibold flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Exceeds stock!
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quantity Input */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={line.quantity || ''}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                      />
                    </div>

                    {/* Unit Price Display */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Unit Price
                      </label>
                      <div className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-sm font-medium text-slate-700">
                        {formatCurrency(line.unitPrice)}
                      </div>
                    </div>

                    {/* Line Total & Remove */}
                    <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2 pt-4 sm:pt-0">
                      <div className="text-right">
                        <div className="text-[11px] font-semibold text-slate-500">Line Total</div>
                        <div className="text-sm font-bold text-slate-900 font-mono">
                          {formatCurrency(line.lineTotal)}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={items.length <= 1}
                        onClick={() => handleRemoveItem(index)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg disabled:opacity-20 disabled:cursor-not-allowed transition"
                        title="Remove Line"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-dashed border-slate-300 hover:border-blue-500 hover:text-blue-600 text-slate-600 text-xs font-semibold transition"
            >
              <Plus className="w-4 h-4" />
              Add Another Line Item
            </button>
          </div>

          {/* Financial Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-sm font-bold uppercase tracking-wider text-slate-700">
              <Receipt className="w-4 h-4 text-blue-600" />
              Financial Summary
            </div>

            <div className="mt-4 max-w-xs ml-auto space-y-2 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900 font-mono">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span>Value Added Tax ({taxPercent}%)</span>
                <span className="font-semibold text-slate-900 font-mono">
                  {formatCurrency(taxAmount)}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-base font-bold text-slate-900">
                <span>Grand Total</span>
                <span className="text-blue-600 font-mono text-lg">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Link
                to="/invoices"
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-medium transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || hasStockExceeded}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Save as Draft Invoice
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
