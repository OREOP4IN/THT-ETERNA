import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { formatCurrency } from '../utils/format';
import {
  ArrowLeft,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Printer,
  Send,
  CreditCard,
  Ban,
  RotateCcw,
} from 'lucide-react';
import { AxiosError } from 'axios';
import { Invoice } from './InvoicesPage';

export const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchInvoice = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ data: Invoice }>(`/invoices/${id}`);
      setInvoice(res.data.data);
    } catch (err) {
      const axiosErr = err as AxiosError<{ error?: { message?: string } }>;
      setError(axiosErr.response?.data?.error?.message || 'Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const handleIssue = async () => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to issue this invoice? This will automatically decrement stock from your inventory.')) {
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await api.post<{ data: Invoice }>(`/invoices/${id}/issue`);
      setInvoice(res.data.data);
    } catch (err) {
      const axiosErr = err as AxiosError<{ error?: { message?: string } }>;
      setActionError(axiosErr.response?.data?.error?.message || 'Failed to issue invoice');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!id) return;
    if (!window.confirm('Mark this invoice as fully paid? This is a terminal state.')) {
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await api.post<{ data: Invoice }>(`/invoices/${id}/pay`);
      setInvoice(res.data.data);
    } catch (err) {
      const axiosErr = err as AxiosError<{ error?: { message?: string } }>;
      setActionError(axiosErr.response?.data?.error?.message || 'Failed to mark invoice as paid');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    const confirmMsg =
      invoice?.status === 'ISSUED'
        ? 'Are you sure you want to cancel this invoice? Any deducted stock will be atomically restored to your inventory.'
        : 'Are you sure you want to cancel this draft invoice?';

    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    setActionError(null);
    try {
      const res = await api.post<{ data: Invoice }>(`/invoices/${id}/cancel`);
      setInvoice(res.data.data);
    } catch (err) {
      const axiosErr = err as AxiosError<{ error?: { message?: string } }>;
      setActionError(axiosErr.response?.data?.error?.message || 'Failed to cancel invoice');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            Draft (Editable)
          </span>
        );
      case 'ISSUED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Issued (Stock Deducted)
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Paid & Settled
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Cancelled (Voided)
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-medium">Loading invoice record...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-center">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
          <h2 className="text-base font-bold">Invoice Not Found</h2>
          <p className="text-sm mt-1">{error || 'The requested invoice could not be located.'}</p>
          <Link
            to="/invoices"
            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <Link
          to="/invoices"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Invoices
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            Print / PDF
          </button>

          {/* Action Buttons based on Status */}
          {invoice.status === 'DRAFT' && (
            <>
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5" />
                Cancel Draft
              </button>
              <button
                onClick={handleIssue}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Issue Invoice
              </button>
            </>
          )}

          {invoice.status === 'ISSUED' && (
            <>
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Cancel & Restore Stock
              </button>
              <button
                onClick={handleMarkPaid}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                Mark as Paid
              </button>
            </>
          )}
        </div>
      </div>

      {actionError && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Invoice Printable Sheet */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm print:border-none print:shadow-none print:p-0">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight font-mono">
                {invoice.invoiceNumber}
              </h1>
              {getStatusBadge(invoice.status)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Created on {new Date(invoice.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="text-right">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              StockFlow Invoicing
            </div>
            <div className="text-sm font-bold text-slate-800">Verified Tax Invoice</div>
          </div>
        </div>

        {/* Customer & Date Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-6 border-b border-slate-200 text-sm">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Billed To
            </div>
            <div className="font-bold text-base text-slate-900 flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-400" />
              {invoice.customerName}
            </div>
            {invoice.notes && (
              <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 max-w-sm">
                <span className="font-semibold text-slate-700">Notes: </span>
                {invoice.notes}
              </div>
            )}
          </div>

          <div className="sm:text-right space-y-1.5">
            <div>
              <span className="text-xs text-slate-500">Issue Date: </span>
              <span className="font-semibold text-slate-800">
                {new Date(invoice.issueDate).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500">Due Date: </span>
              <span className="font-semibold text-slate-800">
                {new Date(invoice.dueDate).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500">Tax Rate: </span>
              <span className="font-semibold text-slate-800">
                {(invoice.taxRate / 100).toFixed(2)}% VAT
              </span>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="py-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Itemized Bill
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-y border-slate-200 text-xs font-semibold text-slate-500 uppercase">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4 text-right">Snapshotted Unit Price</th>
                <th className="py-3 px-4 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items.map((item, index) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-400">{index + 1}</td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-900">{item.productName}</span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-700">
                    {item.quantity}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900">
                    {formatCurrency(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <div className="w-full sm:w-72 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold font-mono text-slate-900">
                {formatCurrency(invoice.subtotal)}
              </span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Tax ({(invoice.taxRate / 100).toFixed(0)}%)</span>
              <span className="font-semibold font-mono text-slate-900">
                {formatCurrency(invoice.taxAmount)}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-bold text-slate-900">
              <span>Total Amount</span>
              <span className="text-blue-600 font-mono text-xl">
                {formatCurrency(invoice.total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
