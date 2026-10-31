import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUDIT_FILE = path.join(__dirname, '..', 'data', 'audit.log.json');

class AuditService {
  constructor() {
    this.memoryLogs = [];
    this._load();
  }

  _load() {
    try {
      if (fs.existsSync(AUDIT_FILE)) {
        const raw = fs.readFileSync(AUDIT_FILE, 'utf8');
        this.memoryLogs = JSON.parse(raw);
      }
    } catch {
      this.memoryLogs = [];
    }
  }

  _persist() {
    try {
      fs.writeFileSync(AUDIT_FILE, JSON.stringify(this.memoryLogs.slice(0, 500), null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to write audit log:', err);
    }
  }

  log({ type, studentId, details, status = 'INFO' }) {
    const entry = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      type,
      studentId,
      status,
      details
    };
    this.memoryLogs.unshift(entry);
    this._persist();
    return entry;
  }

  getLogs({ studentId, limit = 50 } = {}) {
    if (studentId) {
      return this.memoryLogs.filter((l) => l.studentId === studentId).slice(0, limit);
    }
    return this.memoryLogs.slice(0, limit);
  }
}

export const auditService = new AuditService();
