import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Users,
  Cpu,
  Table as TableIcon,
  LayoutGrid
} from 'lucide-react';

export default function GuardrailInspector({ metrics = {} }) {
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

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

  // Flatten all policies for the table view
  const allPolicies = policyDomains.flatMap(group => 
    group.policies.map(policy => ({
      ...policy,
      domain: group.domain,
      domainColor: group.color,
      DomainIcon: group.icon
    }))
  );

  return (
    <div className="glass-panel p-2.5 mb-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-1.5 mb-2">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Deterministic Guardrails & Policy Matrix Table
            </h3>
          </div>
          <p className="text-[11px] text-slate-400">
            Strict safety boundaries enforced by the Bounded Action Engine. Gemini has Advisory authority only.
          </p>
        </div>

        {/* Global Compliance Badge & View Toggle */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <span className="pulse-live"></span>
            <span className="text-[11px] font-bold tracking-tight">8 of 8 Guardrails Active</span>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-bold">
            0 Violations
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px] font-bold">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TableIcon className="w-3 h-3" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3 h-3" />
              <span>Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Proper Policy Matrix Table View */}
      {viewMode === 'table' ? (
        <div className="proper-table-container rounded-xl border border-slate-800 bg-slate-950/60 shadow-inner">
          <table className="proper-table">
            <thead>
              <tr>
                <th className="w-[180px]">Domain Scope</th>
                <th className="w-[200px]">Guardrail Policy</th>
                <th className="w-[260px]">Deterministic Limit / Rule Specification</th>
                <th className="w-[140px]">Classification</th>
                <th className="w-[130px]">State</th>
                <th className="w-[110px]">Violations</th>
                <th className="w-[300px]">Enforcement Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 font-medium">
              {allPolicies.map((p, idx) => {
                const Icon = p.DomainIcon;
                return (
                  <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                    {/* Domain Scope */}
                    <td className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="font-bold text-slate-200 text-xs">{p.domain}</span>
                      </div>
                    </td>

                    {/* Policy Name */}
                    <td className="font-bold text-white whitespace-nowrap text-sm">
                      {p.name}
                    </td>

                    {/* Limit / Specification */}
                    <td className="text-cyan-300 font-bold text-xs">
                      <div className="bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg inline-block">
                        {p.limit}
                      </div>
                    </td>

                    {/* Classification Tag */}
                    <td className="whitespace-nowrap">
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {p.tag}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="whitespace-nowrap">
                      <span className="badge badge-recovered text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        {p.status}
                      </span>
                    </td>

                    {/* Violations */}
                    <td className="whitespace-nowrap">
                      <span className="text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                        {p.violations} Violations
                      </span>
                    </td>

                    {/* Description */}
                    <td className="text-xs text-slate-300 leading-relaxed font-normal">
                      {p.description}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Domain Groups Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {policyDomains.map((domainGroup, dIdx) => {
            const Icon = domainGroup.icon;
            return (
              <div
                key={dIdx}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between"
              >
                <div className="flex items-center gap-2 mb-3.5 pb-2.5 border-b border-slate-800">
                  <Icon className="w-4 h-4 text-slate-400" />
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    {domainGroup.domain}
                  </h4>
                </div>

                <div className="space-y-3.5">
                  {domainGroup.policies.map((p, pIdx) => (
                    <div
                      key={pIdx}
                      className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 hover:border-slate-700 transition-all shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{p.name}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                            {p.tag}
                          </span>
                        </div>
                        <span className="badge badge-recovered text-[10px]">
                          {p.status}
                        </span>
                      </div>

                      <div className="text-[11px] text-cyan-400 font-bold mb-1">
                        {p.limit}
                      </div>

                      <p className="text-[11px] text-slate-400 leading-relaxed mb-2.5">
                        {p.description}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-[10px] text-slate-400">
                        <span>Violations: <strong className="text-emerald-400 font-extrabold">0</strong></span>
                        <span className="flex items-center gap-1 text-emerald-400 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Enforced at runtime
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
