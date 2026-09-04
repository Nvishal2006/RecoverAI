import React, { useState } from 'react';
import {
  Database,
  Search,
  Copy,
  Check,
  ShieldCheck
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
    <div className="glass-panel p-2.5 mb-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-1.5 mb-2">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">
              Immutable Pre-Execution Audit Trail
            </h3>
          </div>
          <p className="text-[11px] text-slate-400">
            Append-only cryptographic ledger tracking intent before dispatch and gateway execution responses
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% Pre-Dispatch Verified</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-5 p-4 bg-slate-900/80 rounded-xl border border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search Audit ID, TXN ID, or Idempotency Key..."
            value={searchTxn}
            onChange={(e) => setSearchTxn(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-xs rounded-lg pl-10 pr-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
          />
        </div>

        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="bg-slate-950 border border-slate-700 text-xs rounded-lg px-3.5 py-2.5 text-slate-300 focus:outline-none focus:border-cyan-500 font-medium cursor-pointer"
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
          className="bg-slate-950 border border-slate-700 text-xs rounded-lg px-3.5 py-2.5 text-slate-300 focus:outline-none focus:border-cyan-500 font-medium cursor-pointer"
        >
          <option value="">All Execution Statuses</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="FAILED">FAILED</option>
          <option value="FALLBACK">FALLBACK</option>
          <option value="PENDING_EXECUTION">PENDING_EXECUTION</option>
          <option value="SKIPPED">SKIPPED</option>
        </select>
      </div>

      {/* Proper Ledger Table */}
      <div className="proper-table-container rounded-xl border border-slate-800 bg-slate-950/60 max-h-[540px] shadow-inner">
        <table className="proper-table">
          <thead>
            <tr>
              <th className="w-[140px]">Audit ID</th>
              <th className="w-[130px]">Txn ID</th>
              <th className="w-[160px]">AI Recommendation</th>
              <th className="w-[110px]">Confidence</th>
              <th className="w-[130px]">Policy Gate</th>
              <th className="w-[160px]">Dispatched Action</th>
              <th className="w-[130px]">State</th>
              <th className="w-[180px]">Idempotency Key</th>
              <th className="w-[120px]">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70 font-medium">
            {filtered.map((log, idx) => {
              const isExpanded = expandedLogId === log.audit_id;
              const isCopied = copiedKey === log.audit_id;

              return (
                <React.Fragment key={log.audit_id || idx}>
                  <tr
                    onClick={() => setExpandedLogId(isExpanded ? null : log.audit_id)}
                    className={`hover:bg-slate-800/50 cursor-pointer transition-colors ${
                      isExpanded ? 'bg-cyan-500/15 border-l-4 border-cyan-400' : ''
                    }`}
                  >
                    {/* Audit ID */}
                    <td className="text-cyan-400 font-bold whitespace-nowrap">
                      <div className="flex items-center gap-2 group/aid">
                        <span>{log.audit_id}</span>
                        <button
                          onClick={(e) => handleCopy(e, log.audit_id, log.audit_id)}
                          className="opacity-0 group-hover/aid:opacity-100 p-1 hover:text-white text-slate-500 transition-opacity cursor-pointer"
                          title="Copy Audit ID"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    {/* Txn ID */}
                    <td className="text-white font-bold whitespace-nowrap">{log.txn_id}</td>

                    {/* AI Recommendation */}
                    <td className="text-violet-300 font-semibold whitespace-nowrap">
                      {log.ai_recommendation || '—'}
                    </td>

                    {/* Confidence */}
                    <td className="text-slate-300 font-semibold whitespace-nowrap">
                      {log.confidence ? `${(log.confidence * 100).toFixed(1)}%` : '—'}
                    </td>

                    {/* Policy Decision */}
                    <td className="text-emerald-400 font-extrabold whitespace-nowrap">
                      {log.policy_decision}
                    </td>

                    {/* Action */}
                    <td className="text-white font-semibold whitespace-nowrap">{log.action}</td>

                    {/* Status */}
                    <td className="whitespace-nowrap">{getStatusBadge(log.status)}</td>

                    {/* Idempotency Key */}
                    <td className="text-slate-400 max-w-[180px] truncate font-medium" title={log.idempotency_key}>
                      {log.idempotency_key}
                    </td>

                    {/* Timestamp */}
                    <td className="text-slate-400 whitespace-nowrap font-medium">
                      {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '—'}
                    </td>
                  </tr>

                  {/* Expandable Payload Drawer */}
                  {isExpanded && (
                    <tr className="bg-slate-900/95">
                      <td colSpan="9" className="p-5 border-b border-slate-800">
                        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 shadow-md">
                          <div className="flex items-center justify-between text-slate-300 pb-2 border-b border-slate-800 font-bold">
                            <span className="text-white uppercase tracking-wider text-xs">Execution Metadata & Cryptographic Payload</span>
                            <span className="text-cyan-400 text-xs">Record: {log.audit_id}</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-slate-300 text-xs font-medium">
                            <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
                              <span className="text-slate-500 block text-[11px] mb-0.5">Execution ID</span>
                              <strong className="text-white font-bold">{log.execution_id || 'PENDING'}</strong>
                            </div>
                            <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
                              <span className="text-slate-500 block text-[11px] mb-0.5">Idempotency Key</span>
                              <strong className="text-cyan-300 font-bold truncate block" title={log.idempotency_key}>{log.idempotency_key}</strong>
                            </div>
                            <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
                              <span className="text-slate-500 block text-[11px] mb-0.5">Enforced State</span>
                              <strong className="text-emerald-400 font-bold">{log.status}</strong>
                            </div>
                            <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
                              <span className="text-slate-500 block text-[11px] mb-0.5">Timestamp</span>
                              <strong className="text-slate-200 font-bold">{log.timestamp}</strong>
                            </div>
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
                <td colSpan="9" className="py-16 text-center text-slate-400 text-sm font-semibold">
                  No audit log records match the selected query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 mt-4 p-3.5 bg-slate-900/60 rounded-xl border border-slate-800">
        <span className="font-semibold">{filtered.length} audit records in immutable chain</span>
        <span className="text-cyan-400 font-bold">Click any row to inspect cryptographic execution payload</span>
      </div>
    </div>
  );
}
