import React from 'react';
import {
  TrendingUp,
  AlertTriangle,
  IndianRupee,
  Layers,
  ShieldCheck,
  Zap,
  Activity,
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

  const roiMultiplier = costInr > 0 ? (recoveredInr / costInr).toFixed(1) : '∞';

  return (
    <div className="space-y-3 mb-4">
      {/* Tier 1: Financial Core KPI Hero Cards (4 columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Revenue at Risk */}
        <div className="glass-panel p-4 flex flex-col justify-between relative overflow-hidden group hover:border-rose-500/40 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                  <IndianRupee className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Revenue at Risk
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                {totalTxns} Failed
              </span>
            </div>
            <div className="my-1">
              <div className="text-2xl font-extrabold font-mono tracking-tight text-white">
                ₹{atRiskInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/[0.06] mt-2">
            <span>Failed checkout volume</span>
            <span className="text-rose-400 font-semibold font-mono">Gross Exposure</span>
          </div>
        </div>

        {/* Card 2: Revenue Recovered */}
        <div className="glass-panel p-4 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/50 transition-all border-emerald-500/30">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Revenue Recovered
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 fill-current" /> {aiRate}% Rate
              </span>
            </div>
            <div className="my-1">
              <div className="text-2xl font-extrabold font-mono tracking-tight text-emerald-400">
                ₹{recoveredInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/[0.06] mt-2">
            <span>Net Autonomous Intake</span>
            <span className="text-emerald-400 font-bold font-mono">
              +₹{incrementalInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Net Lift
            </span>
          </div>
        </div>

        {/* Card 3: Causal Net Lift */}
        <div className="glass-panel p-4 flex flex-col justify-between relative overflow-hidden group hover:border-violet-500/40 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Causal Net Lift
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">
                vs Holdout
              </span>
            </div>
            <div className="my-1">
              <div className="text-2xl font-extrabold font-mono tracking-tight text-violet-300">
                +{lift}%
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/[0.06] mt-2">
            <span>Statistically causal lift</span>
            <span className="text-slate-300 font-mono font-semibold">Holdout: {holdoutRate}%</span>
          </div>
        </div>

        {/* Card 4: Cost to Recover & ROI */}
        <div className="glass-panel p-4 flex flex-col justify-between relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Cost-to-Recover
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                {roiMultiplier}x ROI
              </span>
            </div>
            <div className="my-1">
              <div className="text-2xl font-extrabold font-mono tracking-tight text-white">
                ₹{costInr.toFixed(2)}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/[0.06] mt-2">
            <span>SMS & Gateway fees</span>
            <span className="text-cyan-400 font-semibold font-mono">High Efficiency</span>
          </div>
        </div>
      </div>

      {/* Tier 2: Operational Telemetry Bar (3 columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Recovery Progression Meter */}
        <div className="glass-panel p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-bold text-slate-300">
                AI Recovery vs Holdout Baseline
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400">{aiRate}%</span>
          </div>
          <div className="space-y-1">
            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(parseFloat(aiRate) || 0, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Holdout: {holdoutRate}%</span>
              <span className="text-emerald-400 font-bold">Active Cohort: {aiRate}%</span>
            </div>
          </div>
        </div>

        {/* Manual Review Queue */}
        <div className="glass-panel p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${
              manualCount > 0
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-300 leading-tight">Manual Review Queue</div>
              <div className="text-[10px] text-slate-400">Human-in-the-loop escalation tasks</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-extrabold font-mono text-amber-400 leading-tight">{manualCount}</div>
            <span className={`text-[9px] font-bold uppercase tracking-wider ${
              manualCount > 0 ? 'text-amber-400' : 'text-slate-500'
            }`}>
              {manualCount > 0 ? 'Action Required' : 'Queue Empty'}
            </span>
          </div>
        </div>

        {/* Deterministic Guardrail Integrity */}
        <div className="glass-panel p-3.5 flex items-center justify-between border-emerald-500/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white leading-tight">Guardrail Integrity</div>
              <div className="text-[10px] text-slate-400">8 Deterministic Policy Gates Active</div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-extrabold font-mono text-emerald-400">100% Pass</span>
            </div>
            <span className="text-[9px] font-mono text-emerald-400/80 uppercase font-bold">
              {violations} Violations
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
