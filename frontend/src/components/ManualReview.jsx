import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Check,
  X,
  ShieldAlert,
  UserCheck,
  ArrowUpRight,
  ShieldCheck,
  Cpu,
  Table as TableIcon,
  LayoutList
} from 'lucide-react';

export default function ManualReview({
  queue = [],
  onApprove,
  onReject,
  onViewTrace
}) {
  const [selectedTxnId, setSelectedTxnId] = useState(null);
  const [selectedAction, setSelectedAction] = useState('RETRY_PAYMENT');
  const [operatorNotes, setOperatorNotes] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'split'

  useEffect(() => {
    if (queue.length > 0 && (!selectedTxnId || !queue.some(q => q.txn_id === selectedTxnId))) {
      setSelectedTxnId(queue[0].txn_id);
    }
  }, [queue, selectedTxnId]);

  const activeItem = queue.find(q => q.txn_id === selectedTxnId) || queue[0];

  const handleApprove = async (txnId = activeItem?.txn_id, action = selectedAction) => {
    if (!txnId) return;
    setProcessingId(txnId);
    try {
      await onApprove(
        txnId,
        action,
        operatorNotes || 'Operator manual sign-off via Operations Console'
      );
      setOperatorNotes('');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (txnId = activeItem?.txn_id) => {
    if (!txnId) return;
    setProcessingId(txnId);
    try {
      await onReject(
        txnId,
        operatorNotes || 'Operator rejected recovery via Operations Console'
      );
      setOperatorNotes('');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="glass-panel p-2.5 mb-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Human-in-the-Loop Manual Review Queue Table
            </h3>
          </div>
          <p className="text-[11px] text-slate-400">
            Operator triage for transactions exceeding deterministic risk limits, model confidence floors, or timeout fallbacks
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-2">
            <span className="pulse-amber"></span>
            {queue.length} Pending Review
          </span>

          {queue.length > 0 && (
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Queue Table</span>
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'split'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>Dossier Split</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {queue.length === 0 ? (
        /* Zero-State Illustration */
        <div className="py-16 text-center bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 shadow-sm">
            <UserCheck className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-white mb-1">
            Manual Review Queue is All Clear
          </h4>
          <p className="text-xs text-slate-400 max-w-md mb-4 leading-relaxed">
            All actionable transactions are either autonomously recovered or operating within deterministic safety limits.
          </p>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800 text-slate-300 text-xs border border-slate-700 font-semibold shadow-sm">
            <span className="pulse-live"></span>
            Listening for webhook escalations & timeout fallbacks
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* Proper Manual Review Queue Table */
        <div className="proper-table-container rounded-xl border border-slate-800 bg-slate-950/60 shadow-inner">
          <table className="proper-table">
            <thead>
              <tr>
                <th className="w-[150px]">Case ID</th>
                <th className="w-[150px]">Customer</th>
                <th className="w-[130px]">Amount</th>
                <th className="w-[140px]">Failure Reason</th>
                <th className="w-[280px]">Deterministic Escalation Trigger</th>
                <th className="w-[180px]">Authorized Action</th>
                <th className="w-[200px] text-right">Operator Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 font-medium">
              {queue.map((item) => {
                const isSelected = activeItem?.txn_id === item.txn_id;
                const isProcessing = processingId === item.txn_id;

                return (
                  <tr
                    key={item.txn_id}
                    onClick={() => setSelectedTxnId(item.txn_id)}
                    className={`hover:bg-slate-800/50 cursor-pointer transition-colors ${
                      isSelected ? 'bg-amber-500/15 border-l-4 border-amber-500' : ''
                    }`}
                  >
                    {/* Case ID */}
                    <td className="text-white font-bold whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span>{item.txn_id}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewTrace(item.txn_id);
                          }}
                          className="p-1 text-slate-400 hover:text-amber-400 cursor-pointer transition-colors"
                          title="View Trace"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="whitespace-nowrap">
                      <div className="text-white font-semibold text-xs">{item.customer_id}</div>
                      <span className="text-[10px] uppercase font-bold text-violet-400">{item.customer_tier}</span>
                    </td>

                    {/* Amount */}
                    <td className="font-bold text-amber-400 whitespace-nowrap text-sm">
                      ₹{(item.amount_paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Failure Reason */}
                    <td className="whitespace-nowrap">
                      <span className="text-xs text-slate-300 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 font-semibold">
                        {item.failure_code}
                      </span>
                    </td>

                    {/* Escalation Trigger */}
                    <td className="text-xs text-amber-300 leading-relaxed font-normal max-w-[280px]">
                      {item.reason}
                    </td>

                    {/* Action Select */}
                    <td className="whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <select
                        defaultValue="RETRY_PAYMENT"
                        onChange={(e) => {
                          if (isSelected) setSelectedAction(e.target.value);
                        }}
                        className="bg-slate-950 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500 font-medium cursor-pointer"
                      >
                        <option value="RETRY_PAYMENT">RETRY_PAYMENT</option>
                        <option value="SEND_NUDGE">SEND_NUDGE</option>
                        <option value="SCHEDULE_MANDATE_RETRY">SCHEDULE_MANDATE_RETRY</option>
                      </select>
                    </td>

                    {/* Quick Operator Actions */}
                    <td className="text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          disabled={isProcessing}
                          onClick={() => handleReject(item.txn_id)}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          title="Reject & Close"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                        <button
                          disabled={isProcessing}
                          onClick={() => handleApprove(item.txn_id, selectedAction)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-md disabled:opacity-50"
                          title="Approve & Dispatch"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Master-Detail Split-Pane */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[480px]">
          {/* Left Column: Master Queue List (5 cols) */}
          <div className="lg:col-span-5 space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 mb-2">
              Escalated Cases ({queue.length})
            </div>

            {queue.map((item) => {
              const isSelected = activeItem?.txn_id === item.txn_id;
              return (
                <div
                  key={item.txn_id}
                  onClick={() => setSelectedTxnId(item.txn_id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-sm'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-sm">
                      {item.txn_id}
                    </span>
                    <span className="font-extrabold text-sm text-amber-400">
                      ₹{(item.amount_paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-semibold">{item.customer_id}</span>
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-300 font-bold">
                      {item.failure_code}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 line-clamp-2 font-medium">
                    {item.reason}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Case Dossier & Operator Decision Box (7 cols) */}
          {activeItem && (
            <div className="lg:col-span-7 bg-slate-900/80 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between">
              <div>
                {/* Dossier Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl font-bold text-white">
                        {activeItem.txn_id}
                      </span>
                      <span className="badge badge-manual text-xs">
                        Awaiting Decision
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Customer: <strong className="text-white font-bold">{activeItem.customer_id}</strong> ({activeItem.customer_tier})
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewTrace(activeItem.txn_id)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      View Trace
                    </button>
                  </div>
                </div>

                {/* Escalation Context Alert */}
                <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                  <div className="font-bold flex items-center gap-2 mb-1.5 text-sm">
                    <ShieldAlert className="w-4 h-4" />
                    Deterministic Policy Escalation Trigger
                  </div>
                  <p className="leading-relaxed font-normal">
                    {activeItem.reason}
                  </p>
                </div>

                {/* Case Parameters Structured Table */}
                <div className="proper-table-container rounded-xl border border-slate-800 bg-slate-950/70 my-5">
                  <table className="proper-table">
                    <thead>
                      <tr>
                        <th className="py-2.5 px-4 text-xs font-bold text-slate-400">Parameter</th>
                        <th className="py-2.5 px-4 text-xs font-bold text-slate-400">Value</th>
                        <th className="py-2.5 px-4 text-xs font-bold text-slate-400">Risk Assessment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-xs">
                      <tr>
                        <td className="py-2.5 px-4 font-bold text-slate-300">Transaction Value</td>
                        <td className="py-2.5 px-4 font-bold text-amber-400 text-sm">
                          ₹{(activeItem.amount_paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-4 text-slate-400">
                          {activeItem.amount_paise >= 5000000 ? 'High-Value Escalation (>₹50,000)' : 'Standard Exposure'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-bold text-slate-300">Failure Reason</td>
                        <td className="py-2.5 px-4 font-bold text-white">
                          <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-xs">
                            {activeItem.failure_code}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-400">Transient / recoverable error</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-bold text-slate-300">Customer Tier</td>
                        <td className="py-2.5 px-4 font-bold text-violet-400 uppercase">
                          {activeItem.customer_tier}
                        </td>
                        <td className="py-2.5 px-4 text-slate-400">
                          {activeItem.customer_tier === 'vip' ? 'Priority Handling SLA' : 'Standard Rate-Limit'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* AI Advice vs Guardrail Authority Card */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800">
                    <div className="flex items-center gap-1.5 text-violet-400 font-bold">
                      <Cpu className="w-3.5 h-3.5" />
                      Gemini Advisory Recommendation
                    </div>
                    <span className="font-mono text-slate-400 text-[10px]">Advisory Only</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    Gemini classified this as an actionable decline. However, deterministic guardrail limits paused execution to obtain human operator sign-off.
                  </p>
                </div>
              </div>

              {/* Operator Decision Box */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div>
                  <label className="text-xs font-bold text-white uppercase tracking-wider mb-1 block">
                    Authorized Action to Dispatch
                  </label>
                  <select
                    value={selectedAction}
                    onChange={(e) => setSelectedAction(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-xs rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-medium cursor-pointer"
                  >
                    <option value="RETRY_PAYMENT">RETRY_PAYMENT (Dispatch Gateway Reprocess)</option>
                    <option value="SEND_NUDGE">SEND_NUDGE (Send Interactive Checkout Link)</option>
                    <option value="SCHEDULE_MANDATE_RETRY">SCHEDULE_MANDATE_RETRY (Queue Auto-Debit)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-white uppercase tracking-wider mb-1 block">
                    Audit Notes & Compliance Justification
                  </label>
                  <input
                    type="text"
                    placeholder="Enter operator rationale (e.g. verified funds with customer)..."
                    value={operatorNotes}
                    onChange={(e) => setOperatorNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-xs rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-medium"
                  />
                </div>

                {/* Approve & Reject Action Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    disabled={processingId === activeItem.txn_id}
                    onClick={handleReject}
                    className="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject & Close Case</span>
                  </button>

                  <button
                    disabled={processingId === activeItem.txn_id}
                    onClick={handleApprove}
                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve & Authorize Action</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
