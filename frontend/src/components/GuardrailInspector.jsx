import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Layers,
  Users,
  Cpu,
  Key,
  Database
} from 'lucide-react';

export default function GuardrailInspector({ metrics = {} }) {
  const [activeDomain, setActiveDomain] = useState('ALL');

  const policyDomains = [
    {
      domain: 'Financial Risk & Holdout',
      icon: Layers,
      color: 'emerald',
      policies: [
        {
          name: 'Holdout Protection (20%)',
          limit: 'Strictly untreated baseline (NO_ACTION)',
          status: 'ENFORCED',
          tag: 'Causal Lift Integrity',
          violations: 0,
          description: 'Isolates exactly 20% of transactions from any automated recovery actions to measure true statistical causal uplift.'
        },
        {
          name: 'High-Value Escalation Threshold',
          limit: 'Amount > ₹50,000 requires human sign-off',
          status: 'ENFORCED',
          tag: 'Capital Safety',
          violations: 0,
          description: 'Ensures high-ticket transactions cannot be re-charged without operator review, preventing major customer friction.'
        }
      ]
    },
    {
      domain: 'Customer Fatigue & Frequency Caps',
      icon: Users,
      color: 'cyan',
      policies: [
        {
          name: 'Customer 24h Retry Cap',
          limit: 'Max 3 retries / customer / 24 hours',
          status: 'ENFORCED',
          tag: 'Gateway & Bank Limit',
          violations: 0,
          description: 'Prevents card network spam, bank account lockouts, and excess payment gateway processing fees.'
        },
        {
          name: 'Customer 24h Nudge Cap',
          limit: 'Max 2 nudges / customer / 24 hours',
          status: 'ENFORCED',
          tag: 'Outreach Frequency',
          violations: 0,
          description: 'Limits customer outreach across SMS & WhatsApp to eliminate notification fatigue and brand damage.'
        }
      ]
    },
    {
      domain: 'Gateway & Fraud Defense',
      icon: Lock,
      color: 'violet',
      policies: [
        {
          name: 'Blocked Customer Defense',
          limit: 'Zero automated retries for blocked tier',
          status: 'ENFORCED',
          tag: 'Fraud Isolation',
          violations: 0,
          description: 'Immediately escalates blacklisted or high-risk users to Fraud & Risk management without pinging payment gateways.'
        },
        {
          name: 'Cryptographic Idempotency',
          limit: 'Key = txn_id + ":" + action_type',
          status: 'ENFORCED',
          tag: 'Double-Charge Shield',
          violations: 0,
          description: 'Guarantees that repeated webhook retries or rapid clicks can never execute duplicate debits or redundant messages.'
        }
      ]
    },
    {
      domain: 'Autonomous AI Boundaries',
      icon: Cpu,
      color: 'amber',
      policies: [
        {
          name: 'AI Confidence Floor',
          limit: 'Minimum 0.80 (80%) confidence threshold',
          status: 'ENFORCED',
          tag: 'Model Reliability',
          violations: 0,
          description: 'Any diagnosis below 80% model confidence is immediately escalated to human operators rather than executing automatically.'
        },
        {
          name: 'Pre-Execution Audit Enforcement',
          limit: 'Append-only record created before action dispatch',
          status: 'ENFORCED',
          tag: 'Immutable Ledger',
          violations: 0,
          description: 'An immutable PENDING_EXECUTION record is committed to audit log before calling payment gateway APIs.'
        }
      ]
    }
  ];

  return (
    <div className="glass-panel p-5 mb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              Deterministic Guardrails & Policy Matrix
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Strict safety boundaries enforced by the Bounded Action Engine. Gemini has Advisory authority only.
          </p>
        </div>

        {/* Global Compliance Badge */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <span className="pulse-live"></span>
            <span className="text-xs font-mono font-bold tracking-tight">8 of 8 Guardrails Active</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            0 Violations
          </div>
        </div>
      </div>

      {/* Domain Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {policyDomains.map((domainGroup, dIdx) => {
          const Icon = domainGroup.icon;
          return (
            <div
              key={dIdx}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between"
            >
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
                <Icon className="w-4 h-4 text-slate-300" />
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  {domainGroup.domain}
                </h4>
              </div>

              <div className="space-y-3">
                {domainGroup.policies.map((p, pIdx) => (
                  <div
                    key={pIdx}
                    className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-100">{p.name}</span>
                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {p.tag}
                        </span>
                      </div>
                      <span className="badge badge-recovered text-[10px]">
                        {p.status}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-cyan-300/90 mb-1">
                      {p.limit}
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
                      {p.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-[10px] font-mono text-slate-400">
                      <span>Violations: <strong className="text-emerald-400">0</strong></span>
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> Enforced at runtime
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
