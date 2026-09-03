import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Eye,
  Play,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

export default function TransactionTable({
  transactions = [],
  onSelectTransaction,
  onEvaluateTransaction,
  selectedTxnId
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFailure, setFilterFailure] = useState('');
  const [filterTier, setFilterTier] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterHoldout, setFilterHoldout] = useState('');
  const [quickFilter, setQuickFilter] = useState('ALL'); // 'ALL' | 'ACTION_REQUIRED' | 'HIGH_VALUE' | 'VIP' | 'HOLDOUT' | 'RECOVERED'
  const [copiedId, setCopiedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const handleCopy = (e, id) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      // Quick filter preset
      if (quickFilter === 'ACTION_REQUIRED') {
        if (t.status === 'RECOVERED' || t.is_holdout) return false;
      } else if (quickFilter === 'HIGH_VALUE') {
        if (t.amount_paise < 5000000) return false; // >= ₹50,000
      } else if (quickFilter === 'VIP') {
        if (t.customer_tier !== 'vip') return false;
      } else if (quickFilter === 'HOLDOUT') {
        if (!t.is_holdout) return false;
      } else if (quickFilter === 'RECOVERED') {
        if (t.status !== 'RECOVERED' && t.status !== 'SUCCESS') return false;
      }

      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchId = t.txn_id.toLowerCase().includes(term);
        const matchCust = t.customer_id.toLowerCase().includes(term);
        if (!matchId && !matchCust) return false;
      }

      // Dropdown filters
      if (filterFailure && t.failure_code !== filterFailure) return false;
      if (filterTier && t.customer_tier !== filterTier) return false;
      if (filterStatus && t.status.toUpperCase() !== filterStatus.toUpperCase()) return false;
      if (filterHoldout !== '') {
        const isH = filterHoldout === 'true';
        if (t.is_holdout !== isH) return false;
      }

      return true;
    });
  }, [transactions, searchTerm, filterFailure, filterTier, filterStatus, filterHoldout, quickFilter]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'RECOVERED':
      case 'SUCCESS':
        return (
          <span className="badge badge-recovered">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Recovered
          </span>
        );
      case 'MANUAL_REVIEW':
        return (
          <span className="badge badge-manual">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Manual Review
          </span>
        );
      case 'NO_ACTION':
        return (
          <span className="badge badge-holdout">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            No Action
          </span>
        );
      default:
        return (
          <span className="badge badge-failed">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            Failed
          </span>
        );
    }
  };

  const getTierBadge = (tier) => {
    switch (tier?.toLowerCase()) {
      case 'vip':
        return <span className="badge badge-vip font-mono">VIP</span>;
      case 'blocked':
        return <span className="badge badge-blocked font-mono">BLOCKED</span>;
      default:
        return <span className="badge badge-holdout font-mono">STANDARD</span>;
    }
  };

  return (
    <div className="glass-panel p-5 mb-6">
      {/* Header & Quick Filter Chips */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              Failed Transactions Ledger
            </h3>
            <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              {transactions.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time feed with autonomous diagnostic tags, policy outcomes, and full trace inspectors
          </p>
        </div>

        {/* Quick Filter Preset Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {[
            { id: 'ALL', label: 'All Transactions' },
            { id: 'ACTION_REQUIRED', label: '⚡ Actionable' },
            { id: 'HIGH_VALUE', label: '₹ High-Value (>₹50k)' },
            { id: 'VIP', label: '★ VIP Only' },
            { id: 'HOLDOUT', label: '⊘ Holdout Control' },
            { id: 'RECOVERED', label: '✓ Recovered' }
          ].map(chip => (
            <button
              key={chip.id}
              onClick={() => {
                setQuickFilter(chip.id);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                quickFilter === chip.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Custom Select Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 mb-4 p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
        <div className="relative md:col-span-2">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search TXN ID or Customer ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-950 border border-slate-700/90 text-xs rounded-lg pl-9 pr-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <select
          value={filterFailure}
          onChange={(e) => {
            setFilterFailure(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-slate-950 border border-slate-700/90 text-xs rounded-lg px-2.5 py-2 text-slate-300 focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Failure Reasons</option>
          <option value="network_error">Network Error</option>
          <option value="bank_timeout">Bank Timeout</option>
          <option value="insufficient_funds">Insufficient Funds</option>
          <option value="card_expired">Card Expired</option>
          <option value="3ds_dropoff">3DS Dropoff</option>
          <option value="mandate_failure">Mandate Failure</option>
        </select>

        <select
          value={filterTier}
          onChange={(e) => {
            setFilterTier(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-slate-950 border border-slate-700/90 text-xs rounded-lg px-2.5 py-2 text-slate-300 focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Customer Tiers</option>
          <option value="standard">Standard</option>
          <option value="vip">VIP Tier</option>
          <option value="blocked">Blocked / High-Risk</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-slate-950 border border-slate-700/90 text-xs rounded-lg px-2.5 py-2 text-slate-300 focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Statuses</option>
          <option value="FAILED">Failed</option>
          <option value="RECOVERED">Recovered</option>
          <option value="MANUAL_REVIEW">Manual Review</option>
          <option value="NO_ACTION">No Action</option>
        </select>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/90 text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800 select-none">
            <tr>
              <th className="py-3 px-3.5">Transaction</th>
              <th className="py-3 px-3">Customer</th>
              <th className="py-3 px-3">Amount</th>
              <th className="py-3 px-3">Failure Reason</th>
              <th className="py-3 px-3">Tier</th>
              <th className="py-3 px-3">Cohort</th>
              <th className="py-3 px-3">Authorized Action</th>
              <th className="py-3 px-3">Policy Gate</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {paginated.map((t) => {
              const isSelected = selectedTxnId === t.txn_id;
              const isCopied = copiedId === t.txn_id;
              const isHighTicket = t.amount_paise >= 5000000;

              return (
                <tr
                  key={t.txn_id}
                  onClick={() => onSelectTransaction(t.txn_id)}
                  className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                    isSelected ? 'bg-emerald-500/10 border-l-2 border-emerald-500' : ''
                  }`}
                >
                  {/* Transaction ID with Copy Button */}
                  <td className="py-3 px-3.5 font-mono text-slate-200">
                    <div className="flex items-center gap-1.5 group/id">
                      <span className="font-bold text-slate-100">{t.txn_id}</span>
                      <button
                        onClick={(e) => handleCopy(e, t.txn_id)}
                        className="opacity-0 group-hover/id:opacity-100 p-1 hover:text-emerald-400 transition-opacity text-slate-500"
                        title="Copy Txn ID"
                      >
                        {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </td>

                  {/* Customer ID */}
                  <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">
                    {t.customer_id}
                  </td>

                  {/* Amount */}
                  <td className="py-3 px-3 font-mono font-bold text-slate-100">
                    <div className="flex items-center gap-1">
                      <span>₹{(t.amount_paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      {isHighTicket && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-sans uppercase">
                          High
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Failure Reason */}
                  <td className="py-3 px-3">
                    <span className="font-mono text-[11px] text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {t.failure_code}
                    </span>
                  </td>

                  {/* Tier */}
                  <td className="py-3 px-3">{getTierBadge(t.customer_tier)}</td>

                  {/* Cohort Group */}
                  <td className="py-3 px-3">
                    {t.is_holdout ? (
                      <span className="badge badge-holdout">Holdout 20%</span>
                    ) : (
                      <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        Active AI
                      </span>
                    )}
                  </td>

                  {/* Action Taken */}
                  <td className="py-3 px-3 font-mono text-[11px] text-cyan-300">
                    {t.action_taken || <span className="text-slate-600">—</span>}
                  </td>

                  {/* Policy Gate Decision */}
                  <td className="py-3 px-3 font-mono text-[11px]">
                    {t.policy_decision === 'APPROVED' && (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> APPROVED
                      </span>
                    )}
                    {t.policy_decision === 'MANUAL_REVIEW' && (
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> MANUAL_REVIEW
                      </span>
                    )}
                    {t.policy_decision === 'NO_ACTION' && (
                      <span className="text-slate-500 font-medium">NO_ACTION</span>
                    )}
                    {!t.policy_decision && <span className="text-slate-600">—</span>}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-3">{getStatusBadge(t.status)}</td>

                  {/* Actions Column */}
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {!t.is_holdout && t.status !== 'RECOVERED' && (
                        <button
                          title="Evaluate with AI Agent"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEvaluateTransaction(t.txn_id);
                          }}
                          className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold transition-all flex items-center gap-1"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          <span>Run AI</span>
                        </button>
                      )}
                      <button
                        title="View Lifecycle Trace"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTransaction(t.txn_id);
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-medium transition-all flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Trace</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {paginated.length === 0 && (
              <tr>
                <td colSpan="10" className="py-12 text-center text-slate-500 text-xs font-medium">
                  No transactions match the selected filters or search terms.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination & Ledger Summary Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 mt-4 px-1">
        <div>
          Showing <span className="font-mono text-slate-200">{filtered.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> to{' '}
          <span className="font-mono text-slate-200">{Math.min(currentPage * pageSize, filtered.length)}</span> of{' '}
          <span className="font-mono text-slate-200">{filtered.length}</span> filtered transactions
        </div>

        {/* Page navigation controls */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <span className="px-3 py-1 text-xs font-mono text-slate-300 bg-slate-900 border border-slate-800 rounded-lg">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-all"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
