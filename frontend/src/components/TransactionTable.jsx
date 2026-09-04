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
  AlertTriangle
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
  const [quickFilter, setQuickFilter] = useState('ALL');
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
      if (quickFilter === 'ACTION_REQUIRED') {
        if (t.status === 'RECOVERED' || t.is_holdout) return false;
      } else if (quickFilter === 'HIGH_VALUE') {
        if (t.amount_paise < 5000000) return false;
      } else if (quickFilter === 'VIP') {
        if (t.customer_tier !== 'vip') return false;
      } else if (quickFilter === 'HOLDOUT') {
        if (!t.is_holdout) return false;
      } else if (quickFilter === 'RECOVERED') {
        if (t.status !== 'RECOVERED' && t.status !== 'SUCCESS') return false;
      }

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchId = t.txn_id.toLowerCase().includes(term);
        const matchCust = t.customer_id.toLowerCase().includes(term);
        if (!matchId && !matchCust) return false;
      }

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
    <div className="glass-panel p-2.5 mb-2">
      {/* Header & Quick Filter Chips */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-1.5 mb-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Failed Transactions Ledger
            </h3>
            <span className="text-[10px] text-slate-300 bg-slate-900 px-2 py-0.2 rounded-full border border-slate-800 font-bold">
              {transactions.length} Total
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Real-time feed with autonomous diagnostic tags, deterministic policy outcomes, and trace inspectors
          </p>
        </div>

        {/* Quick Filter Preset Chips */}
        <div className="flex flex-wrap items-center gap-1 text-[11px]">
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
              className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                quickFilter === chip.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                  : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Custom Select Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-1.5 mb-2 p-1.5 bg-slate-900/80 rounded-lg border border-slate-800 text-xs">
        <div className="relative md:col-span-2">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search TXN ID or Customer ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-950 border border-slate-700 text-[11px] rounded-md pl-8 pr-2 py-1 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
          />
        </div>

        <select
          value={filterFailure}
          onChange={(e) => {
            setFilterFailure(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-slate-950 border border-slate-700 text-[11px] rounded-md px-2 py-1 text-slate-300 focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
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
          className="bg-slate-950 border border-slate-700 text-[11px] rounded-md px-2 py-1 text-slate-300 focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
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
          className="bg-slate-950 border border-slate-700 text-xs rounded-lg px-3.5 py-2.5 text-slate-300 focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="FAILED">Failed</option>
          <option value="RECOVERED">Recovered</option>
          <option value="MANUAL_REVIEW">Manual Review</option>
          <option value="NO_ACTION">No Action</option>
        </select>
      </div>

      {/* Proper Table Container */}
      <div className="proper-table-container rounded-xl border border-slate-800 bg-slate-950/60 shadow-inner">
        <table className="proper-table">
          <thead>
            <tr>
              <th className="w-[140px]">Transaction ID</th>
              <th className="w-[120px]">Customer</th>
              <th className="w-[130px]">Amount</th>
              <th className="w-[150px]">Failure Reason</th>
              <th className="w-[100px]">Tier</th>
              <th className="w-[120px]">Cohort</th>
              <th className="w-[160px]">Authorized Action</th>
              <th className="w-[150px]">Policy Gate</th>
              <th className="w-[120px]">Status</th>
              <th className="w-[150px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70 font-medium">
            {paginated.map((t) => {
              const isSelected = selectedTxnId === t.txn_id;
              const isCopied = copiedId === t.txn_id;
              const isHighTicket = t.amount_paise >= 5000000;

              return (
                <tr
                  key={t.txn_id}
                  onClick={() => onSelectTransaction(t.txn_id)}
                  className={`hover:bg-slate-800/50 cursor-pointer transition-colors ${
                    isSelected ? 'bg-emerald-500/15 border-l-4 border-emerald-500' : ''
                  }`}
                >
                  {/* Transaction ID with Copy Button */}
                  <td className="text-white font-bold whitespace-nowrap">
                    <div className="flex items-center gap-2 group/id">
                      <span>{t.txn_id}</span>
                      <button
                        onClick={(e) => handleCopy(e, t.txn_id)}
                        className="opacity-0 group-hover/id:opacity-100 p-1 hover:text-emerald-400 transition-opacity text-slate-500 cursor-pointer"
                        title="Copy Txn ID"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>

                  {/* Customer ID */}
                  <td className="text-slate-400 text-xs font-semibold whitespace-nowrap">
                    {t.customer_id}
                  </td>

                  {/* Amount */}
                  <td className="font-bold text-white whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span>₹{(t.amount_paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      {isHighTicket && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded uppercase font-bold">
                          High
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Failure Reason */}
                  <td className="whitespace-nowrap">
                    <span className="text-xs text-slate-300 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 font-semibold">
                      {t.failure_code}
                    </span>
                  </td>

                  {/* Tier */}
                  <td className="whitespace-nowrap">{getTierBadge(t.customer_tier)}</td>

                  {/* Cohort Group */}
                  <td className="whitespace-nowrap">
                    {t.is_holdout ? (
                      <span className="badge badge-holdout">Holdout 20%</span>
                    ) : (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        Active AI
                      </span>
                    )}
                  </td>

                  {/* Action Taken */}
                  <td className="text-xs text-cyan-300 font-bold whitespace-nowrap">
                    {t.action_taken || <span className="text-slate-600">—</span>}
                  </td>

                  {/* Policy Gate Decision */}
                  <td className="text-xs whitespace-nowrap">
                    {t.policy_decision === 'APPROVED' && (
                      <span className="text-emerald-400 font-extrabold flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" /> APPROVED
                      </span>
                    )}
                    {t.policy_decision === 'MANUAL_REVIEW' && (
                      <span className="text-amber-400 font-extrabold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> MANUAL_REVIEW
                      </span>
                    )}
                    {t.policy_decision === 'NO_ACTION' && (
                      <span className="text-slate-500 font-semibold">NO_ACTION</span>
                    )}
                    {!t.policy_decision && <span className="text-slate-600">—</span>}
                  </td>

                  {/* Status Badge */}
                  <td className="whitespace-nowrap">{getStatusBadge(t.status)}</td>

                  {/* Actions Column */}
                  <td className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      {!t.is_holdout && t.status !== 'RECOVERED' && (
                        <button
                          title="Evaluate with AI Agent"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEvaluateTransaction(t.txn_id);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Run AI</span>
                        </button>
                      )}
                      <button
                        title="View Lifecycle Trace"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTransaction(t.txn_id);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Trace</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {paginated.length === 0 && (
              <tr>
                <td colSpan="10" className="py-16 text-center text-slate-400 text-sm font-semibold">
                  No transactions match the selected filters or search query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 mt-5 p-4 bg-slate-900/60 rounded-xl border border-slate-800">
        <div>
          Showing <span className="text-white font-bold">{filtered.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> to{' '}
          <span className="text-white font-bold">{Math.min(currentPage * pageSize, filtered.length)}</span> of{' '}
          <span className="text-white font-bold">{filtered.length}</span> filtered transactions
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3.5 py-1.5 text-xs text-white bg-slate-950 border border-slate-700 rounded-lg font-bold">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
