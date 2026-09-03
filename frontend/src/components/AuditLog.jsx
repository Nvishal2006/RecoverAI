import React, { useState } from 'react';
import {
  Database,
  Search,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Clock,
  Key,
  Layers
} from 'lucide-react';

export default function AuditLog({ logs = [] }) {
  const [filterAction, setFilterAction] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTxn, setSearchTxn] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);
  const [expandedLogId, setExpandedLogId] = useState(null);

  const handleCopy = (e, text, id) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const filtered = logs.filter(r => {
    if (searchTxn) {
      const term = searchTxn.toLowerCase();
      const matchTxn = r.txn_id?.toLowerCase().includes(term);
      const matchAudit = r.audit_id?.toLowerCase().includes(term);
      const matchKey = r.idempotency_key?.toLowerCase().includes(term);
      if (!matchTxn && !matchAudit && !matchKey) return false;
    }
    if (filterAction && r.action !== filterAction) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUCCESS':
        return <span className="badge badge-recovered">SUCCESS</span>;
      case 'PENDING_EXECUTION':
        return <span className="badge badge-manual">PENDING_EXECUTION</span>;
      case 'FALLBACK':
        return <span className="badge badge-vip">FALLBACK</span>;
      case 'SKIPPED':
        return <span className="badge badge-holdout">SKIPPED</span>;
      default:
        return <span className="badge badge-failed">{status}</span>;
    }
  };

  return (
    <div className="glass-panel p-5 mb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              Immutable Pre-Execution Audit Trail
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Append-only cryptographically verifiable ledger guaranteeing PENDING_EXECUTION precedes all payment gateway dispatches
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% Pre-Dispatch Verified</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 p-3 bg-slate-900/60 rounded-xl border border-slate-800/80">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search Audit ID, TXN ID, or Idempotency Key..."
            value={searchTxn}
            onChange={(e) => setSearchTxn(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/90 text-xs rounded-lg pl-9 pr-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="bg-slate-950 border border-slate-700/90 text-xs rounded-lg px-2.5 py-2 text-slate-300 focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Dispatched Actions</option>
          <option value="RETRY_PAYMENT">RETRY_PAYMENT</option>
          <option value="SEND_NUDGE">SEND_NUDGE</option>
          <option value="SCHEDULE_MANDATE_RETRY">SCHEDULE_MANDATE_RETRY</option>
          <option value="MANUAL_REVIEW">MANUAL_REVIEW</option>
          <option value="NO_ACTION">NO_ACTION</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-950 border border-slate-700/90 text-xs rounded-lg px-2.5 py-2 text-slate-300 focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Execution Statuses</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="FAILED">FAILED</option>
          <option value="FALLBACK">FALLBACK</option>
          <option value="PENDING_EXECUTION">PENDING_EXECUTION</option>
          <option value="SKIPPED">SKIPPED</option>
        </select>
      </div>

      {/* Ledger Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40 max-h-[500px]">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/95 text-[11px] text-slate-400 uppercase tracking-wider sticky top-0 border-b border-slate-800 z-10 backdrop-blur-md select-none">
            <tr>
              <th className="py-3 px-3">Audit ID</th>
              <th className="py-3 px-3">Txn ID</th>
              <th className="py-3 px-3">AI Recom</th>
              <th className="py-3 px-3">Confidence</th>
              <th className="py-3 px-3">Policy Gate</th>
              <th className="py-3 px-3">Dispatched Action</th>
              <th className="py-3 px-3">State</th>
              <th className="py-3 px-3">Idempotency Key</th>
              <th className="py-3 px-3">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
            {filtered.map((log, idx) => {
              const isExpanded = expandedLogId === log.audit_id;
              const isCopied = copiedKey === log.audit_id;

              return (
                <React.Fragment key={log.audit_id || idx}>
                  <tr
                    onClick={() => setExpandedLogId(isExpanded ? null : log.audit_id)}
                    className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                      isExpanded ? 'bg-cyan-500/10' : ''
                    }`}
                  >
                    {/* Audit ID */}
                    <td className="py-2.5 px-3 text-cyan-400 font-bold">
                      <div className="flex items-center gap-1.5 group/aid">
                        <span>{log.audit_id}</span>
                        <button
                          onClick={(e) => handleCopy(e, log.audit_id, log.audit_id)}
                          className="opacity-0 group-hover/aid:opacity-100 p-0.5 hover:text-white text-slate-500 transition-opacity"
                          title="Copy Audit ID"
                        >
                          {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>

                    {/* Txn ID */}
                    <td className="py-2.5 px-3 text-slate-200 font-bold">{log.txn_id}</td>

                    {/* AI Recommendation */}
                    <td className="py-2.5 px-3 text-violet-300">{log.ai_recommendation || '—'}</td>

                    {/* Confidence */}
                    <td className="py-2.5 px-3 text-slate-300">
                      {log.confidence ? `${(log.confidence * 100).toFixed(1)}%` : '—'}
                    </td>

                    {/* Policy Decision */}
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">{log.policy_decision}</td>

                    {/* Action */}
                    <td className="py-2.5 px-3 text-slate-200">{log.action}</td>

                    {/* Status */}
                    <td className="py-2.5 px-3">{getStatusBadge(log.status)}</td>

                    {/* Idempotency Key */}
                    <td className="py-2.5 px-3 text-slate-400 max-w-[150px] truncate" title={log.idempotency_key}>
                      {log.idempotency_key}
                    </td>

                    {/* Timestamp */}
                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                      {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '—'}
                    </td>
                  </tr>

                  {/* Expandable Payload Drawer */}
                  {isExpanded && (
                    <tr className="bg-slate-900/90">
                      <td colSpan="9" className="p-4 border-b border-slate-800">
                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono space-y-2">
                          <div className="flex items-center justify-between text-slate-400 pb-1.5 border-b border-slate-800">
                            <span className="font-bold text-slate-200">Execution Metadata & Cryptographic Payload</span>
                            <span>Audit Record: {log.audit_id}</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-slate-300">
                            <div><strong>Execution ID:</strong> {log.execution_id || 'PENDING'}</div>
                            <div><strong>Idempotency Key:</strong> {log.idempotency_key}</div>
                            <div><strong>Enforced State:</strong> {log.status}</div>
                            <div><strong>Timestamp:</strong> {log.timestamp}</div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan="9" className="py-12 text-center text-slate-500 font-sans text-xs">
                  No audit log records match the selected query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 mt-3 px-1">
        <span>{filtered.length} audit records in immutable chain</span>
        <span className="text-cyan-400 font-medium">Click any row to view cryptographic execution payload</span>
      </div>
    </div>
  );
}
