const BASE_URL = '/api';

export async function fetchHealth() {
  const res = await fetch(`${BASE_URL}/health`);
  return res.json();
}

export async function fetchMetrics() {
  const res = await fetch(`${BASE_URL}/metrics`);
  return res.json();
}

export async function fetchEvaluation() {
  const res = await fetch(`${BASE_URL}/evaluation`);
  return res.json();
}

export async function fetchTransactions(filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.failure_code) params.append('failure_code', filters.failure_code);
  if (filters.customer_tier) params.append('customer_tier', filters.customer_tier);
  if (filters.holdout !== undefined && filters.holdout !== '') params.append('holdout', filters.holdout);
  if (filters.action) params.append('action', filters.action);

  const url = `${BASE_URL}/transactions?${params.toString()}`;
  const res = await fetch(url);
  return res.json();
}

export async function fetchTransactionTrace(txnId) {
  const res = await fetch(`${BASE_URL}/transactions/${txnId}/trace`);
  return res.json();
}

export async function evaluateTransaction(txnId) {
  const res = await fetch(`${BASE_URL}/evaluate/${txnId}`, { method: 'POST' });
  return res.json();
}

export async function triggerBatchProcess() {
  const res = await fetch(`${BASE_URL}/batch-process`, { method: 'POST' });
  return res.json();
}

export async function triggerDemoRun() {
  const res = await fetch(`${BASE_URL}/demo/run`, { method: 'POST' });
  return res.json();
}

export async function triggerGenerateData() {
  const res = await fetch(`${BASE_URL}/generate-data`, { method: 'POST' });
  return res.json();
}

export async function fetchAuditLogs(filters = {}) {
  const params = new URLSearchParams();
  if (filters.txn_id) params.append('txn_id', filters.txn_id);
  if (filters.action) params.append('action', filters.action);
  if (filters.status) params.append('status', filters.status);
  if (filters.policy_decision) params.append('policy_decision', filters.policy_decision);

  const url = `${BASE_URL}/logs?${params.toString()}`;
  const res = await fetch(url);
  return res.json();
}

export async function fetchManualReviewQueue() {
  const res = await fetch(`${BASE_URL}/manual-review`);
  return res.json();
}

export async function approveManualReview(txnId, action, notes) {
  const res = await fetch(`${BASE_URL}/manual-review/${txnId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, notes })
  });
  return res.json();
}

export async function rejectManualReview(txnId, notes) {
  const res = await fetch(`${BASE_URL}/manual-review/${txnId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes })
  });
  return res.json();
}
