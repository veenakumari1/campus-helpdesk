import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { auditService } from './audit.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, '..', 'data', 'complaints.db.json');

const VALID_STATUSES = ['Pending', 'In Progress', 'Resolved'];
const VALID_CATEGORIES = ['IT & Wi-Fi', 'Classrooms', 'Facilities', 'Accounts', 'Other'];
const VALID_PRIORITIES = ['Low', 'Normal', 'High'];

class ComplaintsService {
  constructor() {
    this.complaints = [];
    this._load();
  }

  _load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.complaints = JSON.parse(raw);
      }
    } catch (err) {
      console.error('Failed to load complaints database:', err);
      this.complaints = [];
    }
  }

  _save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.complaints, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to save complaints database:', err);
      throw new Error('Database write error');
    }
  }

  getAllComplaints({ studentId = null, status = null, search = '' } = {}) {
    let result = [...this.complaints];

    if (studentId) {
      result = result.filter((c) => c.studentId === studentId || c.reporter === 'Veena Chen');
    }

    if (status && status !== 'All issues') {
      result = result.filter((c) => c.status === status);
    }

    if (search && search.trim().length > 0) {
      const q = search.trim().toLowerCase();
      result = result.filter((c) =>
        `${c.id} ${c.title} ${c.category} ${c.location} ${c.reporter} ${c.department || ''}`
          .toLowerCase()
          .includes(q)
      );
    }

    return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getComplaintById(id, studentId = null) {
    const found = this.complaints.find((c) => c.id === id);
    if (!found) return null;
    if (studentId && found.studentId && found.studentId !== studentId && found.reporter !== 'Veena Chen') {
      throw new Error('Unauthorized: You cannot access another student’s complaint.');
    }
    return found;
  }

  /**
   * Check for duplicate complaints submitted by the same student within the last 15 minutes.
   */
  _checkDuplicate(studentId, title, description) {
    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
    const cleanTitle = title.trim().toLowerCase();
    const cleanDesc = description.trim().toLowerCase();

    return this.complaints.find((c) => {
      const isStudent = c.studentId === studentId || c.reporter === 'Veena Chen';
      const isRecent = new Date(c.createdAt).getTime() > fifteenMinutesAgo;
      const titleMatch = c.title.trim().toLowerCase() === cleanTitle;
      const descMatch = c.description.trim().toLowerCase() === cleanDesc;
      return isStudent && isRecent && (titleMatch || descMatch);
    });
  }

  createComplaint({
    title,
    description,
    category = 'Other',
    priority = 'Normal',
    department = 'General Administration',
    location = 'Campus',
    reporter = 'Veena Chen',
    reporterEmail = 'v.chen@campus.edu',
    studentId = 'student-101'
  }) {
    if (!title || typeof title !== 'string' || title.trim().length === 0 || title.length > 100) {
      throw new Error('Title is required and must be under 100 characters.');
    }
    if (!description || typeof description !== 'string' || description.trim().length === 0 || description.length > 1000) {
      throw new Error('Description is required and must be under 1000 characters.');
    }

    const safeCategory = VALID_CATEGORIES.includes(category) ? category : 'Other';
    const safePriority = VALID_PRIORITIES.includes(priority) ? priority : 'Normal';

    // Duplicate prevention check
    const existing = this._checkDuplicate(studentId, title, description);
    if (existing) {
      auditService.log({
        type: 'DUPLICATE_PREVENTED',
        studentId,
        details: { existingId: existing.id, title },
        status: 'WARNING'
      });
      return {
        isDuplicate: true,
        complaint: existing,
        message: `A recent identical complaint (${existing.id}) is already active in the queue.`
      };
    }

    // Generate unique ID incrementing from highest HD-XXXX
    const nextNumber = Math.max(
      1048,
      ...this.complaints.map((c) => Number(c.id.replace('HD-', '')) || 0)
    ) + 1;
    const newId = `HD-${nextNumber}`;

    const newComplaint = {
      id: newId,
      studentId,
      title: title.trim(),
      description: description.trim(),
      category: safeCategory,
      priority: safePriority,
      department: department.trim(),
      location: (location || 'Campus').trim(),
      status: 'Pending',
      reporter,
      reporterEmail,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.complaints.unshift(newComplaint);
    this._save();

    auditService.log({
      type: 'COMPLAINT_CREATED',
      studentId,
      details: { id: newId, title, department, priority: safePriority },
      status: 'SUCCESS'
    });

    return {
      isDuplicate: false,
      complaint: newComplaint,
      message: 'Complaint successfully created and placed in support queue.'
    };
  }

  updateStatus(id, newStatus, studentId = null) {
    if (!VALID_STATUSES.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`);
    }

    const item = this.getComplaintById(id, studentId);
    if (!item) {
      throw new Error(`Complaint ${id} not found.`);
    }

    item.status = newStatus;
    item.updatedAt = new Date().toISOString();
    this._save();

    auditService.log({
      type: 'STATUS_UPDATED',
      studentId: studentId || item.studentId,
      details: { id, status: newStatus },
      status: 'INFO'
    });

    return item;
  }
}

export const complaintsService = new ComplaintsService();

