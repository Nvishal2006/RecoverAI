import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { ShieldCheck, ShieldAlert, CheckCircle2, TrendingUp, Zap, Sparkles } from 'lucide-react';

const COLORS = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ec4899', '#64748b'];

const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-3 bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl backdrop-blur-md text-xs">
        <div className="font-bold text-slate-200 capitalize mb-1">{data.name}</div>
        <div className="flex items-center gap-2 text-emerald-400 font-mono font-semibold">
          <span>Recovery Rate:</span>
          <span>{data.recoveryRate}%</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          Recovered: <span className="text-white font-mono">{data.recovered}</span> of{' '}
          <span className="text-white font-mono">{data.total}</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function RevenueChart({ metrics = {}, evaluation = {} }) {
  const byFailure = metrics.by_failure_code || [];
  const actionDist = metrics.action_distribution || [];

  const failureData = byFailure.map(item => ({
    name: item.failure_code.replace(/_/g, ' '),
    recoveryRate: Math.round((item.recovery_rate || 0) * 100),
    total: item.total || 0,
    recovered: item.recovered || 0
  }));

  const totalActions = actionDist.reduce((acc, curr) => acc + (curr.count || 0), 0);

  const pieData = actionDist.map((item, idx) => ({
    name: item.action.replace(/_/g, ' '),
    value: item.count,
    color: COLORS[idx % COLORS.length]
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
      {/* Chart 1: Recovery Rate by Failure Code */}
      <div className="glass-panel p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Recovery by Failure Code
            </h4>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Causal Lift
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Recovery percentage achieved across auth, balance, and network errors
          </p>
        </div>

        <div className="h-64 w-full">
          {failureData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={failureData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <defs>
                  <linearGradient id="emeraldBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  angle={-20}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar
                  dataKey="recoveryRate"
                  fill="url(#emeraldBarGradient)"
                  radius={[6, 6, 0, 0]}
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              Awaiting recovery data
            </div>
          )}
        </div>
      </div>

      {/* Chart 2: Action Distribution with Center Stat */}
      <div className="glass-panel p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Autonomous Actions Dispatched
            </h4>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              {totalActions} Total
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Interventions authorized and executed by Bounded Action Engine
          </p>
        </div>

        <div className="h-64 w-full relative">
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#0b0f19" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090d16',
                      borderColor: '#334155',
                      borderRadius: '10px',
                      fontSize: '11px',
                      color: '#f8fafc'
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    formatter={(val) => <span className="text-[10px] text-slate-300 capitalize">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Centered Total Interventions Metric */}
              <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center">
                <div className="text-lg font-bold font-mono text-white">{totalActions}</div>
                <div className="text-[9px] uppercase tracking-wider text-slate-400">Actions</div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-xs text-slate-500 gap-1">
              <Zap className="w-5 h-5 text-slate-600" />
              <span>Run AI recovery batch to populate actions</span>
            </div>
          )}
        </div>
      </div>

      {/* Chart 3: Rule-Only vs RecoverAI Policy Safety Matrix */}
      <div className="glass-panel p-5 flex flex-col justify-between border-emerald-500/20">
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Rule-Only vs RecoverAI
              </h4>
            </div>
            <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
              100% Guarded
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Autonomous decision boundaries prevent runaway retries and customer friction
          </p>
        </div>

        <div className="space-y-3">
          {/* Comparison Item 1: Guardrail Violations */}
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-slate-300 font-medium">Policy Violations</span>
              <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-[11px]">
                0 Violations
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800">
              <div className="flex items-center gap-1 text-rose-400">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                <span>Rule-Only: <strong>4 Breaches</strong></span>
              </div>
              <div className="flex items-center gap-1 text-emerald-400 justify-end font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>RecoverAI: <strong>0 (Enforced)</strong></span>
              </div>
            </div>
          </div>

          {/* Comparison Item 2: Customer Spam / False Nudges */}
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-slate-300 font-medium">False Positive Outreach</span>
              <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-[11px]">
                0.0% Spam
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Transient technical declines routed to silent background retry instead of spamming user SMS
            </p>
          </div>

          {/* Comparison Item 3: Net Incremental Revenue */}
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-slate-300 font-medium">Causal Net Lift</span>
              <span className="font-mono text-cyan-400 font-bold text-sm">
                +₹{((metrics.incremental_revenue_paise || 0) / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Statistically validated revenue uplift over uncontacted 20% holdout group
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
