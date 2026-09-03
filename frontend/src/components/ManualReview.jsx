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
  Clock,
  Send,
  RefreshCw,
  Info
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

  // Default to selecting the first transaction if available
  useEffect(() => {
    if (queue.length > 0 && (!selectedTxnId || !queue.some(q => q.txn_id === selectedTxnId))) {
      setSelectedTxnId(queue[0].txn_id);
    }
  }, [queue, selectedTxnId]);

  const activeItem = queue.find(q => q.txn_id === selectedTxnId) || queue[0];

  const handleApprove = async () => {
    if (!activeItem) return;
    setProcessingId(activeItem.txn_id);
    try {
      await onApprove(
        activeItem.txn_id,
        selectedAction,
        operatorNotes || 'Operator manual sign-off via Operations Console'
      );
      setOperatorNotes('');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!activeItem) return;
    setProcessingId(activeItem.txn_id);
    try {
      await onReject(
        activeItem.txn_id,
        operatorNotes || 'Operator rejected recovery via Operations Console'
      );
      setOperatorNotes('');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="glass-panel p-5 mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              Human-in-the-Loop Manual Review Queue
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Operator triage for transactions exceeding risk thresholds, model confidence floors, or timeout fallbacks
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
            <span className="pulse-amber"></span>
            {queue.length} Pending Review
          </span>
        </div>
      </div>

      {queue.length === 0 ? (
        /* Zero-State Illustration */
        <div className="py-16 text-center bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 shadow-lg shadow-emerald-500/10">
            <UserCheck className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-slate-200 mb-1">
            Manual Review Queue is All Clear
          </h4>
          <p className="text-xs text-slate-400 max-w-md mb-4 leading-relaxed">
            All actionable transactions are either autonomously recovered or operating within deterministic safety limits.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700">
            <span className="pulse-live"></span>
            Listening for webhook escalations & timeout fallbacks
          </div>
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
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/5'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-slate-100 text-sm">
                      {item.txn_id}
                    </span>
                    <span className="font-mono font-bold text-sm text-amber-400">
                      ₹{(item.amount_paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-mono">{item.customer_id}</span>
                    <span className="font-mono text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                      {item.failure_code}
                    </span>
                  </div>

                  <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 line-clamp-2">
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
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-bold text-white">
                        {activeItem.txn_id}
                      </span>
                      <span className="badge badge-manual text-xs">
                        Awaiting Human Decision
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Customer: <strong className="font-mono text-slate-200">{activeItem.customer_id}</strong> ({activeItem.customer_tier})
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onViewTrace(activeItem.txn_id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      View Trace
                    </button>
                  </div>
                </div>

                {/* Escalation Context Alert */}
                <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <ShieldAlert className="w-4 h-4" />
                    Deterministic Policy Escalation Trigger
                  </div>
                  <p className="leading-relaxed">
                    {activeItem.reason}
                  </p>
                </div>

                {/* Case Parameters Grid */}
                <div className="grid grid-cols-3 gap-3 my-4">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Transaction Value</div>
                    <div className="text-base font-bold font-mono text-white">
                      ₹{(activeItem.amount_paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Failure Reason</div>
                    <div className="text-xs font-bold font-mono text-slate-200 truncate">
                      {activeItem.failure_code}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Customer Tier</div>
                    <div className="text-xs font-bold font-mono text-violet-300 uppercase">
                      {activeItem.customer_tier}
                    </div>
                  </div>
                </div>

                {/* AI Advice vs Guardrail Authority Card */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-violet-300 font-semibold">
                      <Cpu className="w-3.5 h-3.5" />
                      Gemini Advisory Recommendation
                    </div>
                    <span className="font-mono text-slate-400">Advisory Only</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Gemini classified this as an actionable decline. However, deterministic guardrail limits paused execution to obtain operator sign-off.
                  </p>
                </div>
              </div>

              {/* Operator Decision Box */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 block">
                      Authorized Action to Dispatch
                    </label>
                    <select
                      value={selectedAction}
                      onChange={(e) => setSelectedAction(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-xs rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="RETRY_PAYMENT">RETRY_PAYMENT (Dispatch Gateway Reprocess)</option>
                      <option value="SEND_NUDGE">SEND_NUDGE (Send Interactive Checkout Link)</option>
                      <option value="SCHEDULE_MANDATE_RETRY">SCHEDULE_MANDATE_RETRY (Queue Auto-Debit)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 block">
                    Audit Notes & Justification
                  </label>
                  <input
                    type="text"
                    placeholder="Enter compliance rationale (e.g. VIP confirmed funds via account manager)..."
                    value={operatorNotes}
                    onChange={(e) => setOperatorNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-xs rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Approve & Reject Action Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    disabled={processingId === activeItem.txn_id}
                    onClick={handleReject}
                    className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject & Close Case</span>
                  </button>

                  <button
                    disabled={processingId === activeItem.txn_id}
                    onClick={handleApprove}
                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
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
