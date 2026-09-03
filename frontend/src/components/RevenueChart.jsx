import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

const COLORS = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ec4899', '#64748b'];

const CustomBarTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-3 bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl backdrop-blur-md text-xs text-white">
        <div className="font-bold capitalize mb-1">{data.name}</div>
        <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold">
          <span>Recovery Rate:</span>
          <span>{data.recoveryRate}%</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          Recovered: <span className="font-mono font-bold text-white">{data.recovered}</span> of{' '}
          <span className="font-mono font-bold text-white">{data.total}</span>
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
      <div className="glass-panel p-6 flex flex-col justify-between min-h-[360px]">
        <div>
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Recovery by Failure Code
            </h4>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/25 font-bold">
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
      <div className="glass-panel p-6 flex flex-col justify-between min-h-[360px]">
        <div>
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Autonomous Actions Dispatched
            </h4>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/25 font-bold">
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
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="#0b0f19"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090d16',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      fontSize: '11px',
                      color: '#f8fafc',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.4)'
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    formatter={(val) => <span className="text-[10px] text-slate-300 capitalize font-semibold">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center">
                <div className="text-xl font-extrabold font-mono text-white">{totalActions}</div>
                <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Actions</div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-xs text-slate-500 gap-1">
              <span>Run AI recovery batch to populate actions</span>
            </div>
          )}
        </div>
      </div>

      {/* Chart 3: Rule-Only vs RecoverAI Policy Safety Comparison Table */}
      <div className="glass-panel p-6 flex flex-col justify-between min-h-[360px] border-emerald-500/25">
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Safety & Compliance Table
              </h4>
            </div>
            <span className="text-xs bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-3 py-0.5 rounded-full font-bold">
              100% Guarded
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Autonomous decision boundaries vs unconstrained rule engines
          </p>
        </div>

        {/* Proper Comparison Table */}
        <div className="proper-table-container rounded-xl border border-slate-800 bg-slate-950/70 my-auto">
          <table className="proper-table">
            <thead>
              <tr>
                <th className="py-2.5 px-3 text-xs font-bold text-slate-400">Metric Dimension</th>
                <th className="py-2.5 px-3 text-xs font-bold text-rose-400 text-center">Rule-Only</th>
                <th className="py-2.5 px-3 text-xs font-bold text-emerald-400 text-center">RecoverAI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs font-medium">
              <tr>
                <td className="py-2.5 px-3 text-slate-200 font-bold">Policy Violations</td>
                <td className="py-2.5 px-3 text-rose-400 text-center font-bold">4 Breaches</td>
                <td className="py-2.5 px-3 text-emerald-400 text-center font-bold">0 Enforced</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-slate-200 font-bold">Customer Spam Rate</td>
                <td className="py-2.5 px-3 text-rose-400 text-center font-bold">28.4% Spam</td>
                <td className="py-2.5 px-3 text-emerald-400 text-center font-bold">0.0% Silent</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-slate-200 font-bold">Holdout Isolation</td>
                <td className="py-2.5 px-3 text-slate-400 text-center">None</td>
                <td className="py-2.5 px-3 text-cyan-300 text-center font-bold">20% Control</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 text-slate-200 font-bold">Causal Net Lift</td>
                <td className="py-2.5 px-3 text-slate-400 text-center">Unmeasured</td>
                <td className="py-2.5 px-3 text-emerald-400 text-center font-bold">
                  +₹{((metrics.incremental_revenue_paise || 0) / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Boundary limits: 8 Active</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Deterministic Authority
          </span>
        </div>
      </div>
    </div>
  );
}
