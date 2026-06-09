import React from "react";
import { BankStatementData } from "../types";
import { 
  Building2, 
  User, 
  Hash, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  AlertTriangle,
  Coins
} from "lucide-react";
import { motion } from "motion/react";

interface StatementSummaryProps {
  data: BankStatementData;
}

export function StatementSummary({ data }: StatementSummaryProps) {
  const formatAmount = (amt: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: data.currency || "USD",
    }).format(amt);
  };

  // Reconcile calculation: Starting + Credits - Debits = Ending
  const expectedEnding = Number((data.startingBalance + data.totalCredits - data.totalDebits).toFixed(2));
  const actualEnding = Number(data.endingBalance.toFixed(2));
  const difference = Number((actualEnding - expectedEnding).toFixed(2));
  const isReconciled = Math.abs(difference) <= 0.05; // allow minimal padding for half-cent rounding

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="statement-summary-container">
      {/* CARD 1: Identity & Parameters */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        id="card-bank-meta"
        className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
              <Building2 size={20} />
            </div>
            <div>
              <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">Financial Institution</p>
              <h3 className="text-lg font-semibold text-slate-800">{data.bankName || "Unknown Bank"}</h3>
            </div>
          </div>

          <div className="space-y-3 pt-2 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-400">
                <User size={14} /> Owner
              </span>
              <span className="font-medium text-slate-700">{data.accountHolder || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-400">
                <Hash size={14} /> Account
              </span>
              <span className="font-mono text-slate-700">{data.accountNumber || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-400">
                <Calendar size={14} /> Period
              </span>
              <span className="text-xs text-slate-700 font-medium">{data.statementPeriod || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-400">
                <Coins size={14} /> Currency
              </span>
              <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                {data.currency || "USD"}
              </span>
            </div>
          </div>
        </div>

        {/* Audit Status indicator */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">Audit Status</span>
          {isReconciled ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50/60 px-3 py-1 rounded-full border border-emerald-100">
              <CheckCircle2 size={13} /> Reconciled
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50/60 px-3 py-1 rounded-full border border-amber-100">
              <AlertTriangle size={13} /> Diff: {formatAmount(difference)}
            </span>
          )}
        </div>
      </motion.div>

      {/* CARD 2: Flow Summary (Starting & Ending) */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        id="card-balance-summary"
        className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]"
      >
        <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-4">Balance Summary</span>
        <div className="grid grid-cols-2 gap-4 h-[calc(100%-1.5rem)]">
          <div className="bg-slate-50/60 border border-slate-100/50 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-xs text-slate-500 block">Starting Balance</span>
            <div>
              <p className="text-xl font-bold text-slate-700 tracking-tight">
                {formatAmount(data.startingBalance)}
              </p>
              <span className="text-[10px] text-slate-400 block mt-1">Period Open</span>
            </div>
          </div>

          <div className="bg-slate-50/60 border border-slate-100/50 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-xs text-slate-500 block">Ending Balance</span>
            <div>
              <p className="text-xl font-bold text-slate-800 tracking-tight">
                {formatAmount(data.endingBalance)}
              </p>
              <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                {isReconciled ? "Formula match 100%" : "Reconcile mismatch"}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* CARD 3: Credits & Debits totals */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        id="card-cashflow-totals"
        className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]"
      >
        <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-4">Statement Cashflow</span>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-emerald-50/30 rounded-xl border border-emerald-100/30">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-emerald-100/75 rounded-lg text-emerald-600">
                <ArrowDownLeft size={16} />
              </div>
              <div>
                <span className="text-xs text-slate-500">Total Credits (Deposits)</span>
                <p className="text-lg font-bold text-slate-800 tracking-tight">{formatAmount(data.totalCredits)}</p>
              </div>
            </div>
            <span className="text-xs text-slate-400 font-mono">Inflows</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-rose-50/30 rounded-xl border border-rose-100/30">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-rose-100/75 rounded-lg text-rose-600">
                <ArrowUpRight size={16} />
              </div>
              <div>
                <span className="text-xs text-slate-500">Total Debits (Withdrawals)</span>
                <p className="text-lg font-bold text-slate-800 tracking-tight">{formatAmount(data.totalDebits)}</p>
              </div>
            </div>
            <span className="text-xs text-slate-400 font-mono">Outflows</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
