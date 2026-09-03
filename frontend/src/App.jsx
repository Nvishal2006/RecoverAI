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
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Server,
  ArrowUpRight,
  Shield
} from 'lucide-react';

import MetricCards from './components/MetricCards';
import RecoveryFunnel from './components/RecoveryFunnel';
import RevenueChart from './components/RevenueChart';
import TransactionTable from './components/TransactionTable';
import AgentTrace from './components/AgentTrace';
import AuditLog from './components/AuditLog';
import ManualReview from './components/ManualReview';
import GuardrailInspector from './components/GuardrailInspector';

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
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'ledger' | 'guardrails' | 'manual' | 'audit'

  const [selectedTrace, setSelectedTrace] = useState(null);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'info') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 4500);
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
      showToast('Demo finished: 504 Gateway Timeout → Exponential Backoff → Fallback → Escalated to Manual Review', 'success');
    } catch (err) {
      showToast('Demo execution failed', 'error');
    } finally {
      setIsDemoRunning(false);
    }
  };

  const handleBatchProcess = async () => {
    setIsProcessingBatch(true);
    showToast('Executing Autonomous AI Revenue Recovery Batch across active cohort...', 'info');
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
    showToast('Regenerating 100 synthetic transactions (with 20 stratified holdouts)...', 'info');
    try {
      await triggerGenerateData();
      await loadAllData();
      showToast('Fresh dataset generated. Ready for autonomous recovery operations.', 'success');
    } catch (err) {
      showToast('Data generation failed', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEvaluateSingle = async (txnId) => {
    try {
      showToast(`Evaluating transaction ${txnId} with AI agent...`, 'info');
      await evaluateTransaction(txnId);
      await loadAllData();
      const trace = await fetchTransactionTrace(txnId);
      setSelectedTrace(trace);
      showToast(`Transaction ${txnId} diagnosed & action executed!`, 'success');
    } catch (err) {
      showToast(`Evaluation failed for ${txnId}`, 'error');
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
      showToast(`Transaction ${txnId} manually authorized & processed!`, 'success');
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
    <div className="min-h-screen pb-16 flex flex-col items-center">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl glass-panel-elevated border border-emerald-500/40 text-xs font-semibold text-white shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom duration-300">
          <span className="pulse-live"></span>
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="w-full border-b border-white/[0.08] bg-[#070a12]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Brand Lockup */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/25 ring-1 ring-white/20">
              <Cpu className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                  RecoverAI
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Autonomous Operations Console
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800 flex items-center gap-1">
                  <Server className="w-3 h-3 text-cyan-400" /> Razorpay Simulator Mode
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Bounded Autonomous Revenue Recovery with Advisory Gemini 1.5 & Deterministic Policy Guardrails
              </p>
            </div>
          </div>

          {/* Primary Operations Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleRunDemo}
              disabled={isDemoRunning}
              className="px-4 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/40 text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 disabled:opacity-50 hover:shadow-lg hover:shadow-violet-500/10"
              title="Inject 504 Timeout and observe backoff & fallback"
            >
              <Play className="w-3.5 h-3.5 fill-current text-violet-400" />
              <span>{isDemoRunning ? 'Executing Chaos Demo...' : 'RUN CHAOS DEMO'}</span>
            </button>

            <button
              onClick={handleBatchProcess}
              disabled={isProcessingBatch}
              className="shimmer-button px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-bold tracking-wide shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
              title="Run AI Recovery across all active failed transactions"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{isProcessingBatch ? 'Processing Batch...' : 'EXECUTE AI RECOVERY BATCH'}</span>
            </button>

            <button
              onClick={handleGenerateData}
              disabled={isGenerating}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50"
              title="Regenerate 100 synthetic transactions with 20 holdouts"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin text-cyan-400' : ''}`} />
              <span>REGENERATE DATA</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body with balanced enterprise width */}
      <main className="max-w-[1680px] w-full px-4 sm:px-6 lg:px-8 pt-6">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1.5 mb-6 border-b border-white/[0.08] pb-3 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Operations Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'ledger'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Transaction Ledger</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
              {transactions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('guardrails')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'guardrails'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Policy Guardrails</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
              8 Active
            </span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'manual'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Manual Review Queue</span>
            {manualQueue.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                {manualQueue.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Database className="w-4 h-4 text-cyan-400" />
            <span>Immutable Audit Trail</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
              {auditLogs.length}
            </span>
          </button>
        </div>

        {/* Top KPI Metrics Cards (Always visible across all tabs) */}
        <MetricCards metrics={metrics} />

        {/* Tab Views */}
        {activeTab === 'overview' && (
          <>
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
