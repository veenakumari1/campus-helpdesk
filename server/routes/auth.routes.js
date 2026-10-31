import express from 'express';
import { requireStudentAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', requireStudentAuth, (req, res) => {
  res.json({
    success: true,
    student: req.student
  });
});

export default router;

