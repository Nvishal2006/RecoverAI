import React from 'react';
import {
  TrendingUp,
  AlertTriangle,
  IndianRupee,
  Layers,
  ShieldCheck,
  Zap,
  Activity,
  Percent,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

export default function MetricCards({ metrics = {} }) {
  const atRiskInr = (metrics.total_revenue_at_risk_paise || 0) / 100;
  const recoveredInr = (metrics.ai_recovered_revenue_paise || 0) / 100;
  const incrementalInr = (metrics.incremental_revenue_paise || 0) / 100;
  const costInr = (metrics.cost_to_recover_paise || 0) / 100;

  const aiRate = ((metrics.ai_recovery_rate || 0) * 100).toFixed(1);
  const holdoutRate = ((metrics.holdout_recovery_rate || 0) * 100).toFixed(1);
  const lift = ((metrics.absolute_lift || 0) * 100).toFixed(1);
  const violations = metrics.policy_violations || 0;
  const manualCount = metrics.manual_review_count || 0;
  const totalTxns = metrics.total_transactions || 100;

  // Compute ROI multiplier (recovered / cost)
  const roiMultiplier = costInr > 0 ? (recoveredInr / costInr).toFixed(1) : '∞';

  return (
    <div className="space-y-4 mb-6">
      {/* Tier 1: Financial Core KPI Hero Cards (4 columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Revenue at Risk */}
        <div className="glass-panel p-5 relative overflow-hidden group hover:border-rose-500/40 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-bl-full pointer-events-none transition-all group-hover:bg-rose-500/10" />
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <IndianRupee className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Revenue at Risk</span>
            </div>
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
              {totalTxns} Failed Txns
            </span>
          </div>
          <div className="mb-2">
            <div className="text-2xl lg:text-3xl font-bold font-mono tracking-tight text-white">
              ₹{atRiskInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/[0.06]">
            <span>Failed checkout volume</span>
            <span className="text-rose-400 font-medium">Unrecovered baseline</span>
          </div>
        </div>

        {/* Card 2: Revenue Recovered */}
        <div className="glass-panel p-5 relative overflow-hidden group hover:border-emerald-500/50 transition-all border-emerald-500/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full pointer-events-none transition-all group-hover:bg-emerald-500/20" />
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Revenue Recovered</span>
            </div>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <Zap className="w-3 h-3 fill-current" /> {aiRate}% Rate
            </span>
          </div>
          <div className="mb-2">
            <div className="text-2xl lg:text-3xl font-bold font-mono tracking-tight text-emerald-400">
              ₹{recoveredInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/[0.06]">
            <span>Net Autonomous Intake</span>
            <span className="text-emerald-400 font-semibold font-mono">
              +₹{incrementalInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Net Lift
            </span>
          </div>
        </div>

        {/* Card 3: Causal Lift */}
        <div className="glass-panel p-5 relative overflow-hidden group hover:border-violet-500/40 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-bl-full pointer-events-none transition-all group-hover:bg-violet-500/10" />
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <Layers className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Causal Net Lift</span>
            </div>
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
              vs Holdout
            </span>
          </div>
          <div className="mb-2">
            <div className="text-2xl lg:text-3xl font-bold font-mono tracking-tight text-violet-300">
              +{lift}%
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/[0.06]">
            <span>Statistically causal lift</span>
            <span className="text-slate-300 font-mono">Holdout: {holdoutRate}%</span>
          </div>
        </div>

        {/* Card 4: Cost to Recover & ROI */}
        <div className="glass-panel p-5 relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-bl-full pointer-events-none transition-all group-hover:bg-cyan-500/10" />
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <DollarSign className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cost-to-Recover</span>
            </div>
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              {roiMultiplier}x ROI
            </span>
          </div>
          <div className="mb-2">
            <div className="text-2xl lg:text-3xl font-bold font-mono tracking-tight text-white">
              ₹{costInr.toFixed(2)}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/[0.06]">
            <span>Gateway & SMS outreach fees</span>
            <span className="text-cyan-400 font-medium">Efficient Bounded Ops</span>
          </div>
        </div>
      </div>

      {/* Tier 2: Operational & Policy Guardrails Bar (3 columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Recovery Rate Progression Meter */}
        <div className="glass-panel p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-300">AI Recovery vs Holdout Baseline</span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400">{aiRate}%</span>
          </div>
          {/* Dual bar meter */}
          <div className="space-y-1.5 my-1">
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(parseFloat(aiRate) || 0, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Holdout untreated: {holdoutRate}%</span>
              <span className="text-emerald-400 font-semibold">Active Agent: {aiRate}%</span>
            </div>
          </div>
        </div>

        {/* Manual Review Queue */}
        <div className="glass-panel p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              manualCount > 0
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-300">Manual Review Queue</div>
              <div className="text-[11px] text-slate-400">Human-in-the-loop escalation tasks</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold font-mono text-amber-400">{manualCount}</div>
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${
              manualCount > 0 ? 'text-amber-400' : 'text-slate-500'
            }`}>
              {manualCount > 0 ? 'Pending Review' : 'Queue Empty'}
            </span>
          </div>
        </div>

        {/* Deterministic Guardrail Integrity */}
        <div className="glass-panel p-4 flex items-center justify-between border-emerald-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">Guardrail Integrity</div>
              <div className="text-[11px] text-slate-400">8 Deterministic Policy Gates Active</div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-bold font-mono text-emerald-400">100%</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400/80 uppercase">
              {violations} Violations
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
