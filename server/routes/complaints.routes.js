import express from 'express';
import { complaintsService } from '../services/complaints.service.js';
import { requireStudentAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/complaints
 * Retrieve student complaint history.
 */
router.get('/', requireStudentAuth, (req, res, next) => {
  try {
    const { status, search } = req.query;
    const complaints = complaintsService.getAllComplaints({
      studentId: req.student.id,
      status,
      search
    });

    res.json({
      success: true,
      count: complaints.length,
      complaints
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/complaints/:id
 * Check specific complaint status.
 */
router.get('/:id', requireStudentAuth, (req, res, next) => {
  try {
    const complaint = complaintsService.getComplaintById(req.params.id, req.student.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }
    res.json({ success: true, complaint });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/complaints
 * Create a new complaint record using the official complaint API.
 */
router.post('/', requireStudentAuth, (req, res, next) => {
  try {
    const { title, description, category, priority, department, location } = req.body;

    const result = complaintsService.createComplaint({
      title,
      description,
      category,
      priority,
      department,
      location,
      reporter: req.student.name,
      reporterEmail: req.student.email,
      studentId: req.student.id
    });

    if (result.isDuplicate) {
      return res.status(409).json({
        success: false,
        isDuplicate: true,
        message: result.message,
        complaint: result.complaint
      });
    }

    res.status(201).json({
      success: true,
      complaint: result.complaint,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/complaints/:id/status
 * Update complaint status (Pending, In Progress, Resolved).
 */
router.patch('/:id/status', requireStudentAuth, (req, res, next) => {
  try {
    const { status } = req.body;
    const updated = complaintsService.updateStatus(req.params.id, status, req.student.id);
    res.json({
      success: true,
      complaint: updated,
      message: `Status updated to ${status}`
    });
  } catch (err) {
    next(err);
  }
});

export default router;

