import React from 'react';
import {
  AlertCircle,
  Stethoscope,
  Target,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';

export default function RecoveryFunnel({ funnel = {}, selectedStage, onSelectStage }) {
  const total = funnel.failed || 100;

  const steps = [
    {
      id: 'failed',
      label: 'Payment Failed',
      count: funnel.failed || 100,
      icon: AlertCircle,
      color: 'rose',
      borderClass: 'border-rose-500/30 hover:border-rose-500/50',
      bgClass: 'bg-rose-500/10',
      textClass: 'text-rose-400',
      progressClass: 'bg-rose-500',
      desc: 'Failed checkout events'
    },
    {
      id: 'diagnosed',
      label: 'AI Diagnosed',
      count: funnel.diagnosed || 100,
      icon: Stethoscope,
      color: 'blue',
      borderClass: 'border-blue-500/30 hover:border-blue-500/50',
      bgClass: 'bg-blue-500/10',
      textClass: 'text-blue-400',
      progressClass: 'bg-blue-500',
      desc: 'Decline root cause categorized'
    },
    {
      id: 'actionable',
      label: 'Actionable',
      count: funnel.actionable || 80,
      icon: Target,
      color: 'cyan',
      borderClass: 'border-cyan-500/30 hover:border-cyan-500/50',
      bgClass: 'bg-cyan-500/10',
      textClass: 'text-cyan-400',
      progressClass: 'bg-cyan-500',
      desc: 'Non-holdout eligible cohort'
    },
    {
      id: 'executed',
      label: 'Action Executed',
      count: funnel.action_executed || 0,
      icon: Zap,
      color: 'violet',
      borderClass: 'border-violet-500/30 hover:border-violet-500/50',
      bgClass: 'bg-violet-500/10',
      textClass: 'text-violet-400',
      progressClass: 'bg-violet-500',
      desc: 'Bounded intervention dispatched'
    },
    {
      id: 'recovered',
      label: 'Recovered',
      count: funnel.recovered || 0,
      icon: CheckCircle2,
      color: 'emerald',
      borderClass: 'border-emerald-500/40 hover:border-emerald-500/60',
      bgClass: 'bg-emerald-500/15',
      textClass: 'text-emerald-400',
      progressClass: 'bg-emerald-500',
      desc: 'Settled funds captured'
    },
    {
      id: 'manual',
      label: 'Manual Review',
      count: funnel.manual_review || 0,
      icon: AlertTriangle,
      color: 'amber',
      borderClass: 'border-amber-500/30 hover:border-amber-500/50',
      bgClass: 'bg-amber-500/10',
      textClass: 'text-amber-400',
      progressClass: 'bg-amber-500',
      desc: 'Human-in-the-loop review'
    }
  ];

  return (
    <div className="glass-panel p-2.5 mb-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-xs font-bold text-white tracking-wide uppercase">
              Autonomous Recovery Pipeline Funnel
            </h3>
            <span className="pulse-live"></span>
          </div>
          <p className="text-[10px] text-slate-400">
            Stage-by-stage lifecycle progression from payment failure ingestion to settled revenue or human escalation
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono bg-slate-900 px-2 py-0.5 rounded-lg text-slate-300 border border-slate-700 font-medium">
            80 Active Cohort / 20 Isolated Holdout Control
          </span>
        </div>
      </div>

      {/* Connected Funnel Pipeline Steps with Equal Height */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 relative">
        {steps.map((step, idx) => {
          const pctOfTotal = total > 0 ? Math.round((step.count / total) * 100) : 0;
          const prevStep = idx > 0 && idx < 5 ? steps[idx - 1] : null;
          const stageConversion = prevStep && prevStep.count > 0
            ? Math.round((step.count / prevStep.count) * 100)
            : null;
          const Icon = step.icon;
          const isSelected = selectedStage === step.id;

          return (
            <div
              key={step.id}
              onClick={() => onSelectStage && onSelectStage(step.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between relative group min-h-[145px] ${
                step.borderClass
              } ${step.bgClass} ${
                isSelected ? 'ring-2 ring-emerald-500 shadow-md' : ''
              }`}
            >
              {/* Connector chevron on desktop */}
              {idx < steps.length - 1 && (
                <div className="hidden lg:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-4 h-4 rounded-full bg-slate-900 border border-slate-700 items-center justify-center text-slate-400 shadow-sm">
                  <ChevronRight className="w-3 h-3" />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`w-3.5 h-3.5 ${step.textClass}`} />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                      {step.label}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    {pctOfTotal}%
                  </span>
                </div>

                <div className="flex items-baseline justify-between mb-1">
                  <span className={`text-2xl font-extrabold font-mono ${step.textClass}`}>
                    {step.count}
                  </span>
                  {stageConversion !== null && (
                    <span className="text-[10px] font-mono font-semibold text-slate-400">
                      {stageConversion}% of prev
                    </span>
                  )}
                </div>

                <p className="text-[10px] text-slate-400 line-clamp-1 mb-2">
                  {step.desc}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-900/60 h-1.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${step.progressClass}`}
                  style={{ width: `${Math.min(pctOfTotal, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
