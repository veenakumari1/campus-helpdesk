/**
 * Frontend API client communicating with the Node.js multi-agent backend.
 */

const API_BASE = '/api';

export async function fetchCurrentStudent() {
  try {
    const res = await fetch(`${API_BASE}/auth/me`);
    if (!res.ok) throw new Error('Failed to fetch student profile');
    return await res.json();
  } catch (err) {
    console.warn('Backend unavailable, using default student profile:', err.message);
    return {
      success: true,
      student: { id: 'student-101', name: 'Veena Chen', email: 'v.chen@campus.edu', campus: 'Northwood Campus', avatar: 'VC' }
    };
  }
}

export async function fetchComplaints({ status, search } = {}) {
  try {
    const params = new URLSearchParams();
    if (status && status !== 'All issues') params.set('status', status);
    if (search) params.set('search', search);

    const res = await fetch(`${API_BASE}/complaints?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch complaints from backend');
    const data = await res.json();
    return data.complaints;
  } catch (err) {
    console.warn('Backend fetch failed, falling back to local cache:', err.message);
    return null; // Signals caller to use localStorage
  }
}

export async function createComplaintApi(complaintData) {
  try {
    const res = await fetch(`${API_BASE}/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(complaintData)
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('API create complaint failed:', err);
    throw err;
  }
}

export async function updateComplaintStatusApi(id, status) {
  try {
    const res = await fetch(`${API_BASE}/complaints/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Status update failed');
    return await res.json();
  } catch (err) {
    console.warn('Backend status update failed, local state updated only:', err.message);
  }
}

export async function runAgentAnalysis(problem, location) {
  const res = await fetch(`${API_BASE}/agent/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ problem, location })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Multi-agent analysis failed');
  }
  return await res.json();
}

export async function confirmAgentSubmission(analysisId, confirmedComplaint) {
  const res = await fetch(`${API_BASE}/agent/confirm-submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analysisId, confirmedComplaint })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Complaint confirmation failed');
  }
  return data;
}

export async function fetchAgentActivity() {
  try {
    const res = await fetch(`${API_BASE}/agent/activity`);
    if (!res.ok) throw new Error('Failed to fetch agent activity');
    return await res.json();
  } catch {
    return null;
  }
}
