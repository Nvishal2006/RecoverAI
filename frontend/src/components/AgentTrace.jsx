import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Cpu,
  Copy,
  Check
} from 'lucide-react';

export default function AgentTrace({ trace, onClose }) {
  const [copiedKey, setCopiedKey] = useState(false);
  if (!trace) return null;

  const timeline = trace.timeline || [];
  const latestAudit = trace.audits && trace.audits.length > 0 ? trace.audits[trace.audits.length - 1] : null;

  const handleCopyIdempotency = () => {
    if (latestAudit?.idempotency_key) {
      navigator.clipboard.writeText(latestAudit.idempotency_key);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 1500);
    }
  };

  const getStepIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
      case 'PASSED':
      case 'SUCCESS':
      case 'APPROVED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'WARNING':
      case 'ESCALATED':
      case 'MANUAL_REVIEW':
      case 'FALLBACK':
        return <AlertCircle className="w-4 h-4 text-amber-400" />;
      case 'FAILED':
      case 'REJECTED':
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel-elevated w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-700/80 shadow-2xl">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-base font-extrabold text-white font-mono">
                {trace.txn_id}
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                ₹{(trace.amount_paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="badge badge-recovered text-[11px]">
                {trace.status}
              </span>
              {trace.is_holdout && (
                <span className="badge badge-holdout text-[11px]">
                  Holdout Control Group
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Autonomous Agent Lifecycle Trace & Authoritative Policy Proof
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Advisory vs Authoritative Separation Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Gemini Advisory Panel */}
            <div className="p-4 rounded-xl bg-violet-950/25 border border-violet-500/35 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-2 text-violet-300 font-bold text-xs uppercase tracking-wider">
                <Cpu className="w-4 h-4" />
                Gemini Advisory Recommendation
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Proposed Action:</span>
                  <span className="font-mono font-bold text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded">
                    {latestAudit?.ai_recommendation || 'None'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">AI Confidence:</span>
                  <span className="font-mono font-bold text-violet-300">
                    {latestAudit?.confidence ? `${(latestAudit.confidence * 100).toFixed(1)}%` : '—'}
                  </span>
                </div>
                <div className="text-slate-300 pt-2 border-t border-violet-500/20 font-medium">
                  <span className="text-slate-400 font-medium">Model Reasoning: </span>
                  <span className="text-[11px] leading-relaxed">
                    {latestAudit?.reasoning || 'Awaiting agent classification'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bounded Action Engine Panel */}
            <div className="p-4 rounded-xl bg-emerald-950/25 border border-emerald-500/35 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-2 text-emerald-300 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                Bounded Policy Engine (Final Authority)
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Policy Decision:</span>
                  <span className="font-mono font-bold text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded">
                    {latestAudit?.policy_decision || 'PENDING'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Authorized Dispatch:</span>
                  <span className="font-mono font-bold text-emerald-300">
                    {latestAudit?.action || 'NONE'}
                  </span>
                </div>
                <div className="text-slate-300 pt-2 border-t border-emerald-500/20 flex items-center justify-between font-medium">
                  <div className="truncate max-w-[280px]">
                    <span className="text-slate-400 font-medium">Idempotency Key: </span>
                    <span className="font-mono text-white text-[11px] font-bold">
                      {latestAudit?.idempotency_key || '—'}
                    </span>
                  </div>
                  {latestAudit?.idempotency_key && (
                    <button
                      onClick={handleCopyIdempotency}
                      className="text-slate-400 hover:text-white p-1 cursor-pointer"
                      title="Copy Idempotency Key"
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Chronological Execution Trace Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Agent Chronological Execution Trace Table
              </h4>
              <span className="text-xs text-slate-400 font-bold bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">
                {timeline.length} Execution Steps
              </span>
            </div>

            <div className="proper-table-container rounded-xl border border-slate-800 bg-slate-950/70 shadow-inner">
              <table className="proper-table">
                <thead>
                  <tr>
                    <th className="w-[80px]">Step</th>
                    <th className="w-[180px]">Lifecycle Phase</th>
                    <th className="w-[140px]">Status</th>
                    <th>Technical Diagnostic Details & Gateway Telemetry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-xs font-medium">
                  {timeline.map((step, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="font-bold text-slate-400 whitespace-nowrap">
                        #{idx + 1}
                      </td>
                      <td className="font-bold text-white whitespace-nowrap">
                        {step.title}
                      </td>
                      <td className="whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {getStepIcon(step.status)}
                          <span className="text-slate-300 font-bold">{step.status}</span>
                        </div>
                      </td>
                      <td className="text-slate-300 leading-relaxed font-normal py-3">
                        {step.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Verification Footer Table */}
          {latestAudit && (
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-4 font-semibold shadow-inner">
              <div>AUDIT ID: <strong className="text-cyan-400 font-bold">{latestAudit.audit_id}</strong></div>
              <div>EXECUTION ID: <strong className="text-white font-bold">{latestAudit.execution_id || 'PENDING'}</strong></div>
              <div>ENFORCED STATE: <strong className="text-emerald-400 font-bold">{latestAudit.status}</strong></div>
              <div>RECORDED AT: <strong className="text-slate-300 font-bold">{latestAudit.timestamp}</strong></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
