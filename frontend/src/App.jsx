import React, { useState, useEffect } from 'react';
import {
  Play,
  Zap,
  RefreshCw,
  ShieldCheck,
  Activity,
  Database,
  AlertTriangle,
  Cpu,
  Layers,
  Sparkles,
  Server
} from 'lucide-react';

import MetricCards from './components/MetricCards';
import RecoveryFunnel from './components/RecoveryFunnel';
import RevenueChart from './components/RevenueChart';
import TransactionTable from './components/TransactionTable';
import AgentTrace from './components/AgentTrace';
import AuditLog from './components/AuditLog';
import ManualReview from './components/ManualReview';
import GuardrailInspector from './components/GuardrailInspector';
import LiveAgentCenter from './components/LiveAgentCenter';

import {
  fetchMetrics,
  fetchTransactions,
  fetchAuditLogs,
  fetchManualReviewQueue,
  fetchTransactionTrace,
  evaluateTransaction,
  triggerBatchProcess,
  triggerDemoRun,
  triggerGenerateData,
  approveManualReview,
  rejectManualReview,
  fetchEvaluation
} from './api';

export default function App() {
  const [metrics, setMetrics] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [manualQueue, setManualQueue] = useState([]);
  const [evaluation, setEvaluation] = useState({});
  const [activeTab, setActiveTab] = useState('overview');

  const [selectedTrace, setSelectedTrace] = useState(null);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'info') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadAllData = async () => {
    try {
      const [m, txns, logs, queue, ev] = await Promise.all([
        fetchMetrics(),
        fetchTransactions(),
        fetchAuditLogs(),
        fetchManualReviewQueue(),
        fetchEvaluation()
      ]);
      setMetrics(m || {});
      setTransactions(txns || []);
      setAuditLogs(logs || []);
      setManualQueue(queue || []);
      setEvaluation(ev || {});
    } catch (err) {
      console.error('Failed loading data:', err);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleRunDemo = async () => {
    setIsDemoRunning(true);
    showToast('Executing Failure Injection Demo (504 Timeout Simulation)...', 'info');
    try {
      const res = await triggerDemoRun();
      await loadAllData();
      if (res.trace) {
        setSelectedTrace(res.trace);
      }
      showToast('Demo finished: 504 Timeout → Backoff → Fallback → Manual Review', 'success');
    } catch (err) {
      showToast('Demo execution failed', 'error');
    } finally {
      setIsDemoRunning(false);
    }
  };

  const handleBatchProcess = async () => {
    setIsProcessingBatch(true);
    showToast('Executing Autonomous AI Recovery Batch across active cohort...', 'info');
    try {
      const res = await triggerBatchProcess();
      await loadAllData();
      showToast(`Batch completed: ${res.processed_count} transactions actioned. Holdouts protected!`, 'success');
    } catch (err) {
      showToast('Batch execution failed', 'error');
    } finally {
      setIsProcessingBatch(false);
    }
  };

  const handleGenerateData = async () => {
    setIsGenerating(true);
    showToast('Regenerating 100 synthetic transactions...', 'info');
    try {
      await triggerGenerateData();
      await loadAllData();
      showToast('Fresh dataset generated. Ready for autonomous recovery.', 'success');
    } catch (err) {
      showToast('Data generation failed', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEvaluateSingle = async (txnId) => {
    try {
      showToast(`Evaluating transaction ${txnId} with AI agent...`, 'info');
      const res = await evaluateTransaction(txnId);
      await loadAllData();
      const trace = await fetchTransactionTrace(txnId);
      setSelectedTrace(trace);
      showToast(`Transaction ${txnId} evaluated!`, 'success');
      return res;
    } catch (err) {
      showToast(`Evaluation failed for ${txnId}`, 'error');
      throw err;
    }
  };

  const handleSelectTransaction = async (txnId) => {
    try {
      const trace = await fetchTransactionTrace(txnId);
      setSelectedTrace(trace);
    } catch (err) {
      showToast(`Failed loading trace for ${txnId}`, 'error');
    }
  };

  const handleManualApprove = async (txnId, action, notes) => {
    try {
      await approveManualReview(txnId, action, notes);
      await loadAllData();
      showToast(`Transaction ${txnId} manually approved!`, 'success');
    } catch (err) {
      showToast(`Approval failed for ${txnId}`, 'error');
    }
  };

  const handleManualReject = async (txnId, notes) => {
    try {
      await rejectManualReview(txnId, notes);
      await loadAllData();
      showToast(`Transaction ${txnId} rejected & closed.`, 'info');
    } catch (err) {
      showToast(`Rejection failed for ${txnId}`, 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#9cb8ff] text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 px-3 py-2 rounded-xl glass-panel-elevated border border-emerald-500/40 text-xs font-semibold shadow-2xl flex items-center gap-2">
          <span className="pulse-live"></span>
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Top Header - Compact Modern Navigation Header */}
      <header className="w-full border-b border-white/[0.1] bg-[#080c16]/95 backdrop-blur-2xl sticky top-0 z-40 shadow-md shadow-black/40">
        <div className="max-w-[1720px] mx-auto px-2 sm:px-3 py-1.5 flex flex-col xl:flex-row xl:items-center justify-between gap-2">
          
          {/* Brand & Title Lockup */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0">
              <Cpu className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-bold tracking-normal text-white">
                  RecoverAI
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/35 px-2 py-0.2 rounded-full shadow-sm">
                  Enterprise Console
                </span>
                <span className="text-[10px] text-slate-300 bg-slate-900/90 px-2 py-0.2 rounded-full border border-slate-800 flex items-center gap-1 font-bold">
                  <Server className="w-2.5 h-2.5 text-cyan-400" /> Razorpay Simulator
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 tracking-wide leading-tight">
                Bounded Autonomous Revenue Recovery • Advisory Gemini 1.5 • Deterministic Policy Guardrails
              </p>
            </div>
          </div>

          {/* Telemetry Heartbeat Status Center */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-800/90 text-xs shadow-inner">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="pulse-live"></span>
              <span>Gateway Connected</span>
            </div>
            <span className="text-slate-700 font-normal">|</span>
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>8 Guardrails Active</span>
            </div>
            <span className="text-slate-700 font-normal">|</span>
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>Gemini Advisory</span>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleRunDemo}
              disabled={isDemoRunning}
              className="px-2.5 py-1 rounded-lg bg-violet-600/15 hover:bg-violet-600/25 text-violet-300 border border-violet-500/35 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
              title="Inject 504 Timeout and observe backoff & fallback"
            >
              <Play className="w-3 h-3 fill-current text-violet-400" />
              <span>{isDemoRunning ? 'Running...' : 'Chaos Demo'}</span>
            </button>

            <button
              onClick={handleGenerateData}
              disabled={isGenerating}
              className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-700/80 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
              title="Regenerate 100 synthetic transactions with 20 holdouts"
            >
              <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin text-cyan-400' : ''}`} />
              <span>Regenerate</span>
            </button>

            <button
              onClick={handleBatchProcess}
              disabled={isProcessingBatch}
              className="shimmer-button px-3 py-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-bold tracking-wide shadow-md shadow-emerald-500/25 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              title="Run AI Recovery across all active failed transactions"
            >
              <Zap className="w-3 h-3 fill-current" />
              <span>{isProcessingBatch ? 'Executing...' : '⚡ Execute AI Recovery'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container with zero excessive padding */}
      <main className="w-full max-w-[1720px] px-2 sm:px-3 pt-2">
        
        {/* Navigation Bar */}
        <nav aria-label="Main Navigation" className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/90 rounded-xl p-1 px-2 mb-2 shadow-lg shadow-black/30 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-xs sm:text-sm font-bold cursor-pointer whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Operations Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('agent')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-xs sm:text-sm font-bold cursor-pointer whitespace-nowrap ${
                activeTab === 'agent'
                  ? 'bg-gradient-to-r from-emerald-500/25 to-teal-500/25 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>Live Agent Center</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </button>

            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-xs sm:text-sm font-bold cursor-pointer whitespace-nowrap ${
                activeTab === 'ledger'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Transaction Ledger</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                {transactions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('guardrails')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-xs sm:text-sm font-bold cursor-pointer whitespace-nowrap ${
                activeTab === 'guardrails'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Policy Guardrails</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                8 Active
              </span>
            </button>

            <button
              onClick={() => setActiveTab('manual')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-xs sm:text-sm font-bold cursor-pointer whitespace-nowrap ${
                activeTab === 'manual'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Manual Review Queue</span>
              {manualQueue.length > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  {manualQueue.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-xs sm:text-sm font-bold cursor-pointer whitespace-nowrap ${
                activeTab === 'audit'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <Database className="w-4 h-4 text-cyan-400" />
              <span>Immutable Audit Trail</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                {auditLogs.length}
              </span>
            </button>
          </div>

          {/* Navigation Context Info */}
          <div className="hidden xl:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Active View:</span>
            <span className="text-white font-bold capitalize">{activeTab.replace('_', ' ')}</span>
          </div>
        </nav>

        {/* Visual Content Separator */}
        <div className="mb-2">
          {/* Top KPI Metrics Cards */}
          <MetricCards metrics={metrics} />
        </div>

        {/* Tab Views */}
        {activeTab === 'overview' && (
          <>
            <LiveAgentCenter
              transactions={transactions}
              auditLogs={auditLogs}
              metrics={metrics}
              onEvaluateTransaction={handleEvaluateSingle}
              onViewTrace={handleSelectTransaction}
              isProcessingBatch={isProcessingBatch}
            />
            <RecoveryFunnel funnel={metrics.recovery_funnel} />
            <RevenueChart metrics={metrics} evaluation={evaluation} />
            <TransactionTable
              transactions={transactions}
              onSelectTransaction={handleSelectTransaction}
              onEvaluateTransaction={handleEvaluateSingle}
              selectedTxnId={selectedTrace?.txn_id}
            />
          </>
        )}

        {activeTab === 'agent' && (
          <>
            <LiveAgentCenter
              transactions={transactions}
              auditLogs={auditLogs}
              metrics={metrics}
              onEvaluateTransaction={handleEvaluateSingle}
              onViewTrace={handleSelectTransaction}
              isProcessingBatch={isProcessingBatch}
            />
            <TransactionTable
              transactions={transactions}
              onSelectTransaction={handleSelectTransaction}
              onEvaluateTransaction={handleEvaluateSingle}
              selectedTxnId={selectedTrace?.txn_id}
            />
          </>
        )}

        {activeTab === 'ledger' && (
          <TransactionTable
            transactions={transactions}
            onSelectTransaction={handleSelectTransaction}
            onEvaluateTransaction={handleEvaluateSingle}
            selectedTxnId={selectedTrace?.txn_id}
          />
        )}

        {activeTab === 'guardrails' && (
          <GuardrailInspector metrics={metrics} />
        )}

        {activeTab === 'manual' && (
          <ManualReview
            queue={manualQueue}
            onApprove={handleManualApprove}
            onReject={handleManualReject}
            onViewTrace={handleSelectTransaction}
          />
        )}

        {activeTab === 'audit' && (
          <AuditLog logs={auditLogs} />
        )}
      </main>

      {/* Agent Trace Modal */}
      {selectedTrace && (
        <AgentTrace
          trace={selectedTrace}
          onClose={() => setSelectedTrace(null)}
        />
      )}
    </div>
  );
}
