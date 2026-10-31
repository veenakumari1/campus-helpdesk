import { useState, useEffect } from 'react';
import { runAgentAnalysis, confirmAgentSubmission, fetchAgentActivity } from '../api';

const DEFAULT_AGENTS = [
  { id: 'manager', name: 'Manager / Orchestrator Agent', role: 'Workflow Coordinator', status: 'Ready', desc: 'Plans execution, delegates tasks, and synthesizes findings.' },
  { id: 'classification', name: 'Classification Agent', role: 'Category Specialist', status: 'Ready', desc: 'Classifies into Technical, Academic, Finance, or Administrative domains.' },
  { id: 'priority', name: 'Priority Agent', role: 'Urgency Specialist', status: 'Ready', desc: 'Evaluates deadlines, impact, and assigns Low, Medium, High, or Critical.' },
  { id: 'resolution', name: 'Resolution Agent', role: 'Policy & FAQ Specialist', status: 'Ready', desc: 'Retrieves verified troubleshooting steps from campus knowledge base.' },
  { id: 'routing', name: 'Routing Agent', role: 'Department Specialist', status: 'Ready', desc: 'Directs ticket to exact university department, support team, and SLA.' },
  { id: 'validation', name: 'Validation Agent', role: 'Quality & Safety Auditor', status: 'Ready', desc: 'Audits consistency, verifies policy grounding, and blocks injection.' },
];

export function AgentActivitySection({ onComplaintCreated, onPreFillManualForm }) {
  const [agents, setAgents] = useState(DEFAULT_AGENTS);
  const [problemText, setProblemText] = useState('');
  const [locationText, setLocationText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [history, setHistory] = useState([]);
  const [isSubmittingConfirm, setIsSubmittingConfirm] = useState(false);

  useEffect(() => {
    loadActivityFeed();
  }, []);

  async function loadActivityFeed() {
    const data = await fetchAgentActivity();
    if (data && data.agents) {
      setAgents(data.agents);
      if (data.activeWorkflow) {
        setActiveWorkflow(data.activeWorkflow);
      }
    }
  }

  async function handleAnalyze(e) {
    e.preventDefault();
    if (!problemText.trim()) return;

    setIsAnalyzing(true);
    setErrorMessage('');
    setSuccessMessage('');
    setActiveWorkflow(null);

    // Update real agent states to running
    setAgents((prev) =>
      prev.map((a) => ({
        ...a,
        status: a.id === 'manager' ? 'Planning' : 'Running'
      }))
    );

    try {
      const res = await runAgentAnalysis(problemText.trim(), locationText.trim());
      if (res && res.workflow) {
        setActiveWorkflow(res.workflow);
        setHistory((prev) => [res.workflow, ...prev.slice(0, 9)]);

        // Refresh agent status to reflect backend results
        await loadActivityFeed();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error running multi-agent analysis.');
      setAgents(DEFAULT_AGENTS);
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleConfirmSubmission() {
    if (!activeWorkflow || !activeWorkflow.suggestedComplaint) return;
    setIsSubmittingConfirm(true);
    setErrorMessage('');

    try {
      const res = await confirmAgentSubmission(activeWorkflow.analysisId, activeWorkflow.suggestedComplaint);
      if (res.success && res.complaint) {
        setSuccessMessage(`Complaint ${res.complaint.id} created successfully! Routed to ${res.complaint.department}.`);
        if (onComplaintCreated) {
          onComplaintCreated(res.complaint);
        }
        // Mark workflow confirmation as fulfilled
        setActiveWorkflow((prev) => ({
          ...prev,
          confirmedComplaintId: res.complaint.id,
          requiresStudentConfirmation: false
        }));
      }
    } catch (err) {
      setErrorMessage(err.message || 'Submission confirmation failed.');
    } finally {
      setIsSubmittingConfirm(false);
    }
  }

  function handleSelfResolved() {
    setSuccessMessage('Marked as Self-Resolved using verified university instructions. No ticket was submitted.');
    if (activeWorkflow) {
      setActiveWorkflow((prev) => ({
        ...prev,
        selfResolved: true,
        requiresStudentConfirmation: false
      }));
    }
  }

  function setQuickPrompt(prompt, loc = '') {
    setProblemText(prompt);
    setLocationText(loc);
  }

  return (
    <section className="agent-dashboard-section" id="agent-activity" aria-labelledby="agent-section-heading">
      <div className="agent-section-header">
        <div className="agent-badge-pill">
          <span className="agent-pulse-dot" />
          <span>MULTI-AGENT AI SYSTEM</span>
          <span className="agent-sub-pill">GOOGLE GEMINI POWERED</span>
        </div>
        <h2 id="agent-section-heading">AI Agent Activity & Triage Center</h2>
        <p className="agent-section-desc">
          Six collaborative AI agents coordinate in real time to understand your issue, determine urgency, verify campus policies, and recommend the exact department support team.
        </p>
      </div>

      {/* Real Agent Fleet Status Grid */}
      <div className="agent-fleet-grid" aria-label="Specialist agent statuses">
        {agents.map((agent) => {
          const statusClass = agent.status.toLowerCase().replace(/[^a-z]/g, '-');
          return (
            <div key={agent.id} className={`agent-fleet-card card-${statusClass}`}>
              <div className="agent-card-top">
                <span className={`agent-status-indicator status-${statusClass}`} />
                <span className="agent-name">{agent.name}</span>
                <span className={`agent-state-badge badge-${statusClass}`}>{agent.status}</span>
              </div>
              <div className="agent-role">{agent.role}</div>
              <p className="agent-desc">{agent.desc || agent.description}</p>
            </div>
          );
        })}
      </div>

      {/* Interactive Problem Analysis Console */}
      <div className="agent-console-box">
        <div className="agent-console-title">
          <strong>Describe Your Problem to the Agent Fleet</strong>
          <span className="agent-quota-note">Real Multi-Agent Orchestration · Free Tier Protected</span>
        </div>

        <form onSubmit={handleAnalyze} className="agent-input-form">
          <div className="agent-form-inputs">
            <textarea
              required
              rows={3}
              value={problemText}
              onChange={(e) => setProblemText(e.target.value)}
              placeholder="e.g. Wi-Fi keeps dropping every 5 minutes in Main Library 2nd floor, or Cannot login to my student portal before my quiz..."
              className="agent-textarea"
              disabled={isAnalyzing}
            />
            <div className="agent-inputs-row">
              <input
                type="text"
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                placeholder="Location (e.g. Main Library Floor 2, Online, Science Hall)"
                className="agent-location-input"
                disabled={isAnalyzing}
              />
              <button
                type="submit"
                disabled={isAnalyzing || !problemText.trim()}
                className="agent-analyze-btn"
              >
                {isAnalyzing ? (
                  <>
                    <span className="agent-spinner" />
                    <span>Orchestrating Agents...</span>
                  </>
                ) : (
                  <>
                    <span>✦ Run Multi-Agent Analysis</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Quick Sample Prompts */}
        <div className="agent-quick-prompts">
          <span className="quick-label">Try real scenarios:</span>
          <button
            type="button"
            className="quick-chip"
            onClick={() => setQuickPrompt('Wi-Fi keeps dropping in the library every 5 minutes during my study session.', 'Main Library · Floor 2')}
          >
            📶 Library Wi-Fi Drops
          </button>
          <button
            type="button"
            className="quick-chip"
            onClick={() => setQuickPrompt('The projector in Lecture Hall B turns on but shows no image from the lectern.', 'Science Building · Room 204')}
          >
            📽️ Lecture Hall Projector
          </button>
          <button
            type="button"
            className="quick-chip"
            onClick={() => setQuickPrompt('Cannot access my student portal account. It says account locked out after password attempts.', 'Online')}
          >
            🔐 Portal Account Lockout
          </button>
          <button
            type="button"
            className="quick-chip"
            onClick={() => setQuickPrompt('Water fountain near east entrance is leaking water onto the hallway floor.', 'Student Center · East Wing')}
          >
            💧 Water Fountain Leak
          </button>
          <button
            type="button"
            className="quick-chip"
            onClick={() => setQuickPrompt('Bursar placed a financial hold on my account and I need to register for classes.', 'Administration Hall')}
          >
            💳 Tuition & Registration Hold
          </button>
        </div>

        {errorMessage && (
          <div className="agent-alert error-alert" role="alert">
            <strong>Analysis Alert:</strong> {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="agent-alert success-alert" role="status">
            <strong>Confirmed:</strong> {successMessage}
          </div>
        )}
      </div>

      {/* Execution Results & Student Confirmation Gate */}
      {activeWorkflow && (
        <div className="agent-results-container">
          <div className="results-header-row">
            <div>
              <span className="results-id-tag">{activeWorkflow.analysisId}</span>
              <h3>Multi-Agent Diagnostic Synthesis</h3>
              <p className="results-exec-meta">
                Executed in <strong>{activeWorkflow.executionTimeMs}ms</strong> across 4 parallel stages. Mode:{' '}
                <span className="mode-badge">
                  {activeWorkflow.specialistOutputs.classification.mode === 'gemini_api'
                    ? 'Google Gemini API'
                    : 'Grounded Domain Rules'}
                </span>
              </p>
            </div>
            <div className="results-audit-pill">
              <span className={`audit-badge audit-${activeWorkflow.synthesis.safetyAudit.toLowerCase()}`}>
                Safety Audit: {activeWorkflow.synthesis.safetyAudit}
              </span>
            </div>
          </div>

          {/* Staged Execution Timeline */}
          {activeWorkflow.timeline && activeWorkflow.timeline.length > 0 && (
            <div className="agent-timeline-wrapper">
              <div className="timeline-title">Real-Time Agent Execution Sequence:</div>
              <div className="timeline-steps">
                {activeWorkflow.timeline.map((step, idx) => (
                  <div key={idx} className="timeline-step-item">
                    <div className="step-marker">{idx + 1}</div>
                    <div className="step-content">
                      <span className="step-agent">{step.agent}</span>
                      <span className="step-status">[{step.status}]</span>
                      <p className="step-details">{step.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Specialist Breakdown Grid */}
          <div className="findings-grid">
            {/* Category Card */}
            <div className="finding-card">
              <div className="finding-label">CLASSIFICATION AGENT</div>
              <div className="finding-val">
                <strong>{activeWorkflow.specialistOutputs.classification.result.primaryCategory}</strong>
                <span className="sub-val">({activeWorkflow.specialistOutputs.classification.result.subCategory})</span>
              </div>
              <div className="finding-meta">
                UI Category: <strong>{activeWorkflow.specialistOutputs.classification.result.uiCategory}</strong> · Confidence:{' '}
                {Math.round(activeWorkflow.specialistOutputs.classification.result.confidence * 100)}%
              </div>
            </div>

            {/* Priority Card */}
            <div className="finding-card">
              <div className="finding-label">PRIORITY AGENT</div>
              <div className="finding-val">
                <span className={`priority-tag p-${activeWorkflow.specialistOutputs.priority.result.priority.toLowerCase()}`}>
                  {activeWorkflow.specialistOutputs.priority.result.priority} Urgency
                </span>
              </div>
              <div className="finding-meta">{activeWorkflow.specialistOutputs.priority.result.reason}</div>
            </div>

            {/* Routing Card */}
            <div className="finding-card">
              <div className="finding-label">ROUTING AGENT</div>
              <div className="finding-val">
                <strong>{activeWorkflow.specialistOutputs.routing.result.departmentName}</strong>
              </div>
              <div className="finding-meta">
                Team: <strong>{activeWorkflow.specialistOutputs.routing.result.supportTeam}</strong> · SLA:{' '}
                {activeWorkflow.specialistOutputs.routing.result.estimatedSLA}
              </div>
            </div>

            {/* Validation Card */}
            <div className="finding-card">
              <div className="finding-label">VALIDATION AGENT</div>
              <div className="finding-val">
                <strong>{activeWorkflow.specialistOutputs.validation.result.isValid ? '✓ Verified Safe' : '⚠️ Review Flag'}</strong>
              </div>
              <div className="finding-meta">
                {activeWorkflow.specialistOutputs.validation.result.validationNotes}
              </div>
            </div>
          </div>

          {/* Verified Troubleshooting Steps */}
          {activeWorkflow.synthesis.troubleshooting && activeWorkflow.synthesis.troubleshooting.length > 0 && (
            <div className="troubleshooting-box">
              <div className="tb-header">
                <strong>Verified University Troubleshooting Steps</strong>
                <span className="tb-policy-ref">Citation: {activeWorkflow.synthesis.policyCitation}</span>
              </div>
              <p className="tb-sub">
                {activeWorkflow.synthesis.canSelfResolve
                  ? 'Official campus policy indicates this issue can often be self-resolved without technician dispatch:'
                  : 'Official campus policy indicates physical inspection is required. Follow temporary safety steps:'}
              </p>
              <ol className="tb-steps-list">
                {activeWorkflow.synthesis.troubleshooting.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
              {activeWorkflow.synthesis.warnings && (
                <div className="tb-warning">
                  ⚠️ <strong>Notice:</strong> {activeWorkflow.synthesis.warnings}
                </div>
              )}
            </div>
          )}

          {/* MANDATORY STUDENT CONFIRMATION GATE */}
          {activeWorkflow.requiresStudentConfirmation && !activeWorkflow.confirmedComplaintId && !activeWorkflow.selfResolved && (
            <div className="student-confirmation-gate">
              <div className="confirmation-header">
                <span className="gate-icon">🛡️</span>
                <div>
                  <strong>Student Confirmation Required Before Ticket Creation</strong>
                  <p>Agents cannot create database records without your explicit approval. Review the proposed complaint:</p>
                </div>
              </div>

              <div className="proposed-ticket-summary">
                <div className="ticket-field">
                  <span className="tf-label">Ticket Title:</span>
                  <span className="tf-val">{activeWorkflow.suggestedComplaint.title}</span>
                </div>
                <div className="ticket-field">
                  <span className="tf-label">Target Department:</span>
                  <span className="tf-val">{activeWorkflow.suggestedComplaint.department}</span>
                </div>
                <div className="ticket-field">
                  <span className="tf-label">Category / Priority:</span>
                  <span className="tf-val">
                    {activeWorkflow.suggestedComplaint.category} · Priority: {activeWorkflow.suggestedComplaint.priority}
                  </span>
                </div>
                <div className="ticket-field">
                  <span className="tf-label">Location:</span>
                  <span className="tf-val">{activeWorkflow.suggestedComplaint.location}</span>
                </div>
              </div>

              <div className="confirmation-actions">
                <button
                  type="button"
                  className="confirm-create-btn"
                  onClick={handleConfirmSubmission}
                  disabled={isSubmittingConfirm}
                >
                  {isSubmittingConfirm ? 'Submitting to Queue...' : '✓ Confirm & Create Complaint'}
                </button>
                <button
                  type="button"
                  className="self-resolved-btn"
                  onClick={handleSelfResolved}
                  disabled={isSubmittingConfirm}
                >
                  Problem Solved via Steps (No Ticket Needed)
                </button>
                <button
                  type="button"
                  className="edit-details-btn"
                  onClick={() => {
                    if (onPreFillManualForm) {
                      onPreFillManualForm(activeWorkflow.suggestedComplaint);
                    }
                  }}
                  disabled={isSubmittingConfirm}
                >
                  ✎ Customize Details First
                </button>
              </div>
            </div>
          )}

          {activeWorkflow.confirmedComplaintId && (
            <div className="confirmed-success-banner">
              🎉 <strong>Complaint {activeWorkflow.confirmedComplaintId} Created!</strong> It has been added to your live campus support queue below.
            </div>
          )}
        </div>
      )}

      {/* Workflow History Section */}
      {history.length > 0 && (
        <div className="workflow-history-box">
          <div className="history-header">
            <strong>Recent Agent Workflow History ({history.length})</strong>
          </div>
          <div className="history-list">
            {history.map((wf) => (
              <div key={wf.analysisId} className="history-item">
                <div className="hi-left">
                  <span className="hi-id">{wf.analysisId}</span>
                  <span className="hi-title">{wf.suggestedComplaint.title}</span>
                </div>
                <div className="hi-right">
                  <span className="hi-dept">{wf.synthesis.departmentRouting}</span>
                  <span className={`hi-badge p-${wf.specialistOutputs.priority.result.priority.toLowerCase()}`}>
                    {wf.specialistOutputs.priority.result.priority}
                  </span>
                  <span className="hi-time">{new Date(wf.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

