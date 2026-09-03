import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-6 shadow-xs border border-slate-200">
        <FileQuestion className="w-8 h-8 text-slate-600" />
      </div>

      <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 mb-3">
        404 Error
      </div>

      <h1 className="text-3xl font-black text-slate-900 tracking-tight sm:text-4xl mb-3">
        Page Not Found
      </h1>

      <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed mb-8">
        The page you are looking for doesn't exist, has been removed, or the link you followed is invalid.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold shadow-xs transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs transition cursor-pointer"
        >
          <Home className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};
