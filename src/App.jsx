import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { AgentActivitySection } from './components/AgentActivitySection'
import { fetchComplaints, createComplaintApi, updateComplaintStatusApi } from './api'

const STORAGE_KEY = 'campus-helpdesk-issues'

const initialIssues = [
  {
    id: 'HD-1048',
    title: 'Wi-Fi keeps disconnecting in the library',
    description: 'Connection drops every few minutes on the second floor.',
    category: 'IT & Wi-Fi',
    department: 'IT Services & Network Operations',
    location: 'Main Library · Floor 2',
    priority: 'High',
    status: 'In Progress',
    reporter: 'Veena Chen',
    createdAt: '2026-10-18T09:40:00.000Z',
  },
  {
    id: 'HD-1047',
    title: 'Projector not working in lecture hall B',
    description: 'The projector turns on, but there is no image from the lectern.',
    category: 'Classrooms',
    department: 'Classroom AV & Media Support',
    location: 'Science Building · Room 204',
    priority: 'Normal',
    status: 'Pending',
    reporter: 'Jordan Lee',
    createdAt: '2026-10-18T08:15:00.000Z',
  },
  {
    id: 'HD-1046',
    title: 'Water fountain needs attention',
    description: 'The fountain near the east entrance is leaking.',
    category: 'Facilities',
    department: 'Facilities & Campus Operations',
    location: 'Student Center · East Wing',
    priority: 'Low',
    status: 'Resolved',
    reporter: 'Avery Patel',
    createdAt: '2026-10-17T15:20:00.000Z',
  },
  {
    id: 'HD-1045',
    title: 'Can’t access my student portal',
    description: 'I get an error after entering my campus credentials.',
    category: 'Accounts',
    department: 'Student Information Systems & Identity Management',
    location: 'Online',
    priority: 'High',
    status: 'Pending',
    reporter: 'Sam Rivera',
    createdAt: '2026-10-17T11:05:00.000Z',
  },
]

const statusOptions = ['Pending', 'In Progress', 'Resolved']
const categories = ['IT & Wi-Fi', 'Classrooms', 'Facilities', 'Accounts', 'Other']
const priorities = ['Low', 'Normal', 'High']

function isIssue(issue) {
  return (
    issue !== null &&
    typeof issue === 'object' &&
    /^HD-\d+$/.test(issue.id) &&
    typeof issue.title === 'string' &&
    issue.title.trim().length > 0 &&
    issue.title.length <= 100 &&
    typeof issue.description === 'string' &&
    issue.description.trim().length > 0 &&
    issue.description.length <= 1000 &&
    categories.includes(issue.category) &&
    priorities.includes(issue.priority) &&
    statusOptions.includes(issue.status) &&
    typeof issue.location === 'string' &&
    typeof issue.reporter === 'string' &&
    Number.isFinite(Date.parse(issue.createdAt))
  )
}

function loadIssues() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return initialIssues

    const parsed = JSON.parse(stored)
    if (
      !Array.isArray(parsed) ||
      !parsed.every(isIssue) ||
      new Set(parsed.map((issue) => issue.id)).size !== parsed.length
    ) {
      throw new Error('Saved helpdesk issues contain invalid or duplicate issue records.')
    }
    return parsed
  } catch (error) {
    console.error('Unable to load saved helpdesk issues.', error)
    return initialIssues
  }
}

function Icon({ name, size = 20 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    ticket: <><path d="M4 7.5A2.5 2.5 0 0 0 4 12.5v4A1.5 1.5 0 0 0 5.5 18h13a1.5 1.5 0 0 0 1.5-1.5v-4a2.5 2.5 0 0 0 0-5v-2A1.5 1.5 0 0 0 18.5 4h-13A1.5 1.5 0 0 0 4 5.5z" /><path d="M14 4v2m0 4v2m0 4v2" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21z" /><path d="M4 5.5v13A2.5 2.5 0 0 1 6.5 16H20M8 7h8" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.6 9a2.5 2.5 0 1 1 4.2 1.8c-1.1 1-1.8 1.3-1.8 2.7m0 3h.01" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
    activity: <><path d="M3 12h4l3-8 4 16 3-8h4" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    chevron: <path d="m8 10 4 4 4-4" />,
    sparkle: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" /></>,
  }

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(date))
}

function StatCard({ icon, label, value, description, color }) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span className={`stat-icon ${color}-icon`}><Icon name={icon} /></span>
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-foot">{description}</div>
      <span className={`stat-decoration decoration-${color}`} />
    </article>
  )
}

function IssueRow({ issue, onStatusChange }) {
  const categoryKey = issue.category === 'IT & Wi-Fi' ? 'it' : issue.category.toLowerCase().split(' ')[0]
  const categoryIcon = {
    'IT & Wi-Fi': 'activity',
    Facilities: 'pin',
    Accounts: 'help',
  }[issue.category] || 'book'
  const statusClass = issue.status.toLowerCase().replace(' ', '-')
  const initials = (issue.reporter || 'You').split(' ').map((part) => part[0]).join('').slice(0, 2)

  return (
    <article className="issue-row">
      <div className={`issue-category-icon category-${categoryKey}`}>
        <Icon name={categoryIcon} size={19} />
      </div>
      <div className="issue-main">
        <div className="issue-title-line">
          <h3>{issue.title}</h3>
          <span className={`priority priority-${issue.priority.toLowerCase()}`}><span />{issue.priority}</span>
        </div>
        <div className="issue-meta">
          <span className="issue-id">{issue.id}</span><span className="meta-separator">·</span>
          <span>{issue.category}</span><span className="meta-separator">·</span>
          <span className="location"><Icon name="pin" size={13} />{issue.location}</span>
          {issue.department && (
            <>
              <span className="meta-separator">·</span>
              <span className="dept-tag">🏛️ {issue.department}</span>
            </>
          )}
        </div>
      </div>
      <div className="issue-reporter">
        <span className="reporter-avatar">{initials}</span><span>{issue.reporter}</span>
      </div>
      <div className="issue-date">{formatDate(issue.createdAt)}</div>
      <label className={`status-select status-${statusClass}`}>
        <span className="status-dot" />
        <select
          aria-label={`Status for ${issue.title}`}
          value={issue.status}
          onChange={(event) => onStatusChange(issue.id, event.target.value)}
        >
          {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <Icon name="chevron" size={14} />
      </label>
    </article>
  )
}

function App() {
  const [issues, setIssues] = useState(loadIssues)
  const [activeFilter, setActiveFilter] = useState('All issues')
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formError, setFormError] = useState('')
  const dialogRef = useRef(null)
  const [form, setForm] = useState({
    title: '',
    category: categories[0],
    priority: 'Normal',
    location: '',
    description: '',
  })

  // Synchronize complaints with Node.js backend
  useEffect(() => {
    async function syncBackendComplaints() {
      const serverComplaints = await fetchComplaints()
      if (serverComplaints && Array.isArray(serverComplaints) && serverComplaints.length > 0) {
        setIssues(serverComplaints)
      }
    }
    syncBackendComplaints()
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(issues))
    } catch (error) {
      console.error('Unable to save helpdesk issues.', error)
    }
  }, [issues])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!isFormOpen || !dialog) return

    dialog.showModal()
    return () => {
      if (dialog.open) dialog.close()
    }
  }, [isFormOpen])

  const counts = useMemo(
    () => ({
      total: issues.length,
      pending: issues.filter((issue) => issue.status === 'Pending').length,
      inProgress: issues.filter((issue) => issue.status === 'In Progress').length,
      resolved: issues.filter((issue) => issue.status === 'Resolved').length,
    }),
    [issues],
  )

  const visibleIssues = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return issues
      .filter((issue) => activeFilter === 'All issues' || issue.status === activeFilter)
      .filter((issue) =>
        `${issue.id} ${issue.title} ${issue.category} ${issue.location} ${issue.reporter} ${issue.department || ''}`
          .toLowerCase()
          .includes(query),
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [activeFilter, issues, searchTerm])

  async function handleSubmit(event) {
    event.preventDefault()
    const title = form.title.trim()
    const description = form.description.trim()
    if (!title || !description || title.length > 100 || description.length > 1000) {
      setFormError('Enter a title (up to 100 characters) and description (up to 1,000 characters).')
      return
    }
    if (!categories.includes(form.category) || !priorities.includes(form.priority)) {
      setFormError('Choose a valid issue category and priority.')
      return
    }

    try {
      const res = await createComplaintApi({
        title,
        description,
        category: form.category,
        priority: form.priority,
        location: form.location.trim() || 'Campus',
        department: 'General Support'
      })

      if (res && res.complaint) {
        setIssues((current) => [res.complaint, ...current.filter((c) => c.id !== res.complaint.id)])
      } else {
        throw new Error('Local fallback')
      }
    } catch {
      const nextNumber = Math.max(
        1048,
        ...issues.map((issue) => Number(issue.id.replace('HD-', '')) || 0),
      ) + 1
      const newIssue = {
        ...form,
        title,
        description,
        location: form.location.trim() || 'Campus',
        id: `HD-${nextNumber}`,
        status: 'Pending',
        reporter: 'Veena Chen',
        createdAt: new Date().toISOString(),
      }
      setIssues((current) => [newIssue, ...current])
    }

    setActiveFilter('All issues')
    setSearchTerm('')
    setForm({ title: '', category: categories[0], priority: 'Normal', location: '', description: '' })
    setFormError('')
    setIsFormOpen(false)
  }

  async function updateStatus(id, status) {
    if (!statusOptions.includes(status)) {
      console.error(`Cannot update issue ${id}: "${status}" is not a supported status.`)
      return
    }
    setIssues((current) => current.map((issue) => (issue.id === id ? { ...issue, status } : issue)))
    await updateComplaintStatusApi(id, status)
  }

  function handleComplaintCreatedFromAgent(newComplaint) {
    setIssues((current) => {
      const exists = current.some((c) => c.id === newComplaint.id)
      if (exists) return current
      return [newComplaint, ...current]
    })
    setActiveFilter('All issues')
  }

  function handlePreFillManualForm(suggested) {
    setForm({
      title: suggested.title || '',
      category: categories.includes(suggested.category) ? suggested.category : categories[0],
      priority: priorities.includes(suggested.priority) ? suggested.priority : 'Normal',
      location: suggested.location || '',
      description: suggested.description || '',
    })
    setIsFormOpen(true)
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#dashboard" aria-label="CampusCare home">
          <span className="brand-mark"><Icon name="sparkle" size={21} /></span>
          <span>campus<span className="brand-light">care</span></span>
        </a>

        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          <a className="nav-link active" href="#dashboard" title="Dashboard"><Icon name="grid" /> Dashboard</a>
          <button className="nav-link" type="button" title="All issues" onClick={() => setActiveFilter('All issues')}>
            <Icon name="ticket" /> All issues <span className="nav-count">{counts.total}</span>
          </button>
          <a className="nav-link" href="#agent-activity" title="AI Agent Triage Center">
            <Icon name="sparkle" /> AI Agent Triage
          </a>
          <a className="nav-link" href="#resources" title="Help center"><Icon name="book" /> Help center</a>
        </nav>

        <div className="sidebar-bottom">
          <div className="support-card">
            <div className="support-icon"><Icon name="help" size={19} /></div>
            <strong>Need a hand?</strong>
            <p>Our support team is here for you.</p>
            <a href="mailto:helpdesk@campus.edu">Contact support <Icon name="arrow" size={15} /></a>
          </div>
          <button className="profile-button" type="button" aria-label="Signed in as Veena Chen">
            <span className="avatar">VC</span>
            <span className="profile-copy"><strong>Veena Chen</strong><small>Student account</small></span>
            <Icon name="chevron" size={17} />
          </button>
        </div>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>Dashboard</strong></div>
          <div className="topbar-right">
            <span className="campus-label"><span className="online-dot" /> Northwood Campus</span>
            <span className="topbar-avatar">VC</span>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <p className="eyebrow">SATURDAY, OCTOBER 18, 2026</p>
              <h1>Good morning, Veena <span className="wave">✦</span></h1>
              <p className="welcome-copy">Here’s what’s happening with your campus support today.</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <a
                className="primary-button"
                href="#agent-activity"
                style={{ background: '#5b5ce2', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Icon name="sparkle" size={18} /> Ask AI Agent Fleet
              </a>
              <button className="secondary-button" type="button" onClick={() => setIsFormOpen(true)}>
                <Icon name="plus" size={18} /> Manual Form
              </button>
            </div>
          </section>

          <section className="stats-grid" aria-label="Issue statistics">
            <StatCard icon="ticket" label="Total issues" value={counts.total} description="Across your campus" color="violet" />
            <StatCard icon="clock" label="Pending" value={counts.pending} description="Waiting for a response" color="amber" />
            <StatCard icon="activity" label="In progress" value={counts.inProgress} description="Being worked on now" color="blue" />
            <StatCard icon="check" label="Resolved" value={counts.resolved} description="All taken care of" color="green" />
          </section>

          {/* AI Multi-Agent Activity & Triage Center */}
          <AgentActivitySection
            onComplaintCreated={handleComplaintCreatedFromAgent}
            onPreFillManualForm={handlePreFillManualForm}
          />

          <section className="issues-section" aria-labelledby="issues-heading">
            <div className="section-heading-row">
              <div>
                <p className="eyebrow">YOUR SUPPORT QUEUE</p>
                <h2 id="issues-heading">Recent issues <span className="heading-count">{counts.total}</span></h2>
              </div>
              <button className="text-button" type="button" onClick={() => setActiveFilter('All issues')}>
                View all issues <Icon name="arrow" size={16} />
              </button>
            </div>

            <div className="issue-toolbar">
              <div className="filter-tabs" role="group" aria-label="Filter issues by status">
                {['All issues', ...statusOptions].map((filter) => (
                  <button
                    type="button"
                    aria-pressed={activeFilter === filter}
                    className={`filter-tab ${activeFilter === filter ? 'selected' : ''}`}
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <label className="search-field">
                <Icon name="search" size={18} />
                <input
                  type="search"
                  aria-label="Search issues"
                  placeholder="Search issues..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
                <kbd>⌘ K</kbd>
              </label>
            </div>

            <div className="issue-list">
              {visibleIssues.length ? visibleIssues.map((issue) => (
                <IssueRow key={issue.id} issue={issue} onStatusChange={updateStatus} />
              )) : (
                <div className="empty-state">
                  <span className="empty-icon"><Icon name="search" size={23} /></span>
                  <strong>No issues found</strong>
                  <p>Try a different search or status filter.</p>
                  <button type="button" className="text-button" onClick={() => { setSearchTerm(''); setActiveFilter('All issues') }}>Clear filters</button>
                </div>
              )}
            </div>
            <div className="list-footer">Showing <strong>{visibleIssues.length}</strong> of <strong>{counts.total}</strong> issues <span>•</span> Updated just now</div>
          </section>

          <section className="help-banner" id="resources">
            <div className="banner-icon"><Icon name="sparkle" size={21} /></div>
            <div><strong>Not sure where to start?</strong><p>Browse quick answers and tips in the Campus Help Center.</p></div>
            <a href="mailto:helpdesk@campus.edu">Visit help center <Icon name="arrow" size={16} /></a>
          </section>
          <footer className="page-footer">CampusCare <span>·</span> Making campus life a little easier.</footer>
        </div>
      </main>

      {isFormOpen && (
        <dialog
          ref={dialogRef}
          className="modal-backdrop"
          aria-labelledby="form-heading"
          onCancel={() => { setIsFormOpen(false); setFormError('') }}
          onClick={(event) => { if (event.target === event.currentTarget) setIsFormOpen(false) }}
        >
          <section className="issue-modal">
            <div className="modal-heading">
              <div><p className="eyebrow">CAMPUS SUPPORT</p><h2 id="form-heading">Submit an issue</h2><p>Tell us what’s going on and we’ll get right on it.</p></div>
              <button className="icon-button" type="button" aria-label="Close form" onClick={() => { setIsFormOpen(false); setFormError('') }}><Icon name="close" /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <label className="form-label">Issue title <span>*</span><input autoFocus required maxLength={100} placeholder="e.g. Wi-Fi not working in the library" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
              <div className="form-grid">
                <label className="form-label">Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
                <label className="form-label">Priority<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>{priorities.map((priority) => <option key={priority}>{priority}</option>)}</select></label>
              </div>
              <label className="form-label">Location<input maxLength={100} placeholder="Building, room, or online" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></label>
              <label className="form-label">Description <span>*</span><textarea required rows={4} maxLength={1000} placeholder="Include any details that will help us resolve this..." value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
              {formError && <p className="form-error" role="alert">{formError}</p>}
              <div className="form-actions">
                <button className="secondary-button" type="button" onClick={() => { setIsFormOpen(false); setFormError('') }}>Cancel</button>
                <button className="primary-button" type="submit"><Icon name="plus" size={17} /> Submit issue</button>
              </div>
            </form>
          </section>
        </dialog>
      )}
    </div>
  )
}

export default App
