import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { api } from './api/client';
import { Layers, CheckCircle2, XCircle, ExternalLink, Activity, ShieldCheck, Box, FileText } from 'lucide-react';

interface HealthStatus {
  status: string;
  uptime: number;
  timestamp: string;
  version: string;
}

const DashboardShell: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<HealthStatus>('/health')
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-xs font-semibold uppercase tracking-wider mb-3">
              Phase 1 Milestone
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              StockFlow Workspace Initialized
            </h1>
            <p className="text-slate-600 mt-2 max-w-2xl leading-relaxed">
              Minimal Inventory & Invoicing platform running on Node.js (Express) + React (Vite) + TypeScript + Tailwind CSS. 
              Interactive prototype shell is online and ready for full vertical-slice development.
            </p>
          </div>

          {/* Backend Health Badge */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 min-w-[240px]">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Backend Health Status</div>
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
            className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Open Swagger UI <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
            <Box className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Product Inventory</h3>
          <p className="text-sm text-slate-600 mb-4">
            Maintain catalog items with non-negative stock counts and minor-unit currency.
          </p>
          <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            Phase 4 Implementation
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Invoicing Engine</h3>
          <p className="text-sm text-slate-600 mb-4">
            Issue invoices with automatic atomic stock decrement and cancel restoration.
          </p>
          <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            Phase 5 Implementation
          </span>
        </div>
      </div>

      {/* System Invariants Checklist */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          Guaranteed Business Invariants Configured
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></div>
            <span className="text-slate-700"><strong>Integer Minor Units:</strong> All currency stored in cents (zero floating-point math).</span>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></div>
            <span className="text-slate-700"><strong>Zero-Leak Multi-Tenancy:</strong> All database queries scoped to authenticated User ID.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></div>
            <span className="text-slate-700"><strong>Atomic Stock Guard:</strong> Invoices check stock on hand inside Prisma transactions.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></div>
            <span className="text-slate-700"><strong>Referential Integrity:</strong> Invoiced products cannot be silently deleted (HTTP 409).</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-50">
        {/* Navigation Bar */}
        <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                <Layers className="w-5 h-5" />
              </div>
              <Link to="/" className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                StockFlow
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Dev
                </span>
              </Link>
            </div>

            <nav className="flex items-center gap-4 text-sm font-medium text-slate-600">
              <Link to="/" className="hover:text-slate-900 transition-colors">
                Dashboard
              </Link>
              <a
                href="http://localhost:5000/api/docs"
                target="_blank"
                rel="noreferrer"
                className="hover:text-slate-900 transition-colors flex items-center gap-1"
              >
                Swagger API <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<DashboardShell />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          StockFlow System • Node.js + Express + React + SQLite • Built for THT-ETERNA
        </footer>
      </div>
    </BrowserRouter>
  );
};

export default App;
