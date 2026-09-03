import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProductsPage } from './pages/ProductsPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { CreateInvoicePage } from './pages/CreateInvoicePage';
import { InvoiceDetailPage } from './pages/InvoiceDetailPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { api } from './api/client';
import {
  Layers,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Activity,
  ShieldCheck,
  Box,
  FileText,
  LogOut,
  User as UserIcon,
} from 'lucide-react';

interface HealthStatus {
  status: string;
  uptime: number;
  timestamp: string;
  version: string;
}

const DashboardShell: React.FC = () => {
  const { user } = useAuth();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<HealthStatus>('/health')
      .then((res) => {
        setHealth(res.data);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || 'Unable to reach backend API');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-8 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Welcome back, {user?.name || 'Manager'}!
            </h1>
            <p className="text-slate-600 mt-2 max-w-2xl leading-relaxed">
              You are signed in to your private workspace ({user?.email}).
              Minimal Inventory & Invoicing platform running on Node.js (Express) + React (Vite) + TypeScript + Tailwind CSS.
            </p>
          </div>

          {/* Backend Health Badge */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 min-w-[240px]">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
              Backend Health Status
            </div>
            {loading ? (
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300 animate-pulse"></div>
                Checking API connection...
              </div>
            ) : health ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  API Online (Port 5000)
                </div>
                <div className="text-xs text-slate-500">
                  Uptime: {Math.floor(health.uptime)}s • v{health.version}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-rose-600 font-semibold text-sm">
                <XCircle className="w-4 h-4" />
                {error || 'API Offline'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Nav / Exploration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
            <Box className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Product Inventory</h3>
          <p className="text-sm text-slate-600 mb-4">
            Maintain catalog items with non-negative stock counts and minor-unit currency.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
          >
            Manage Products &rarr;
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Invoicing Engine</h3>
          <p className="text-sm text-slate-600 mb-4">
            Issue invoices with automatic atomic stock decrement and cancel restoration.
          </p>
          <Link
            to="/invoices"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Manage Invoices &rarr;
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Interactive API Docs</h3>
          <p className="text-sm text-slate-600 mb-4">
            Explore and test all REST endpoints directly in the Swagger OpenAPI UI.
          </p>
          <a
            href="http://localhost:5000/api/docs"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Open Swagger UI <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* System Invariants Checklist */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          Active Security & Isolation Invariants
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></div>
            <span className="text-slate-700">
              <strong>User Workspace Isolation (A7):</strong> All inventory and invoice queries are scoped strictly to{' '}
              <code className="px-1.5 py-0.5 rounded bg-slate-100 text-xs text-slate-800">
                {user?.id}
              </code>
              .
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></div>
            <span className="text-slate-700">
              <strong>Bcrypt Password Hashing (A4):</strong> Salt rounds = 12 with individual per-user salt.
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></div>
            <span className="text-slate-700">
              <strong>Opaque Error Obfuscation (A9):</strong> Invalid login returns generic message, preventing user enumeration.
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></div>
            <span className="text-slate-700">
              <strong>Server-Side Password Policy (A5):</strong> Minimum 8 characters enforced at API boundary via Zod.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const NavigationHeader: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 print:hidden">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
            <Layers className="w-5 h-5" />
          </div>
          <Link
            to="/"
            className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5"
          >
            StockFlow
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Dev
            </span>
          </Link>
        </div>

        <nav className="flex items-center gap-4 text-sm font-medium">
          {isAuthenticated ? (
            <>
              <Link to="/" className="text-slate-600 hover:text-slate-900 transition-colors">
                Dashboard
              </Link>
              <Link
                to="/products"
                className="text-slate-600 hover:text-slate-900 transition-colors"
              >
                Products
              </Link>
              <Link
                to="/invoices"
                className="text-slate-600 hover:text-slate-900 transition-colors"
              >
                Invoices
              </Link>
              <div className="h-4 w-px bg-slate-200 mx-1"></div>
              <div className="flex items-center gap-2 text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs font-semibold">{user?.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-slate-600 hover:text-rose-600 text-xs font-semibold transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition shadow-sm"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50">
          <NavigationHeader />

          <main className="flex-1">
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected Workspace Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardShell />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/products"
                element={
                  <ProtectedRoute>
                    <ProductsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invoices"
                element={
                  <ProtectedRoute>
                    <InvoicesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invoices/new"
                element={
                  <ProtectedRoute>
                    <CreateInvoicePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invoices/:id"
                element={
                  <ProtectedRoute>
                    <InvoiceDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* 404 Catch-All Route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>

          {/* Footer */}
          <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 print:hidden">
            StockFlow System • Node.js + Express + React + SQLite • Built for THT-ETERNA
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
