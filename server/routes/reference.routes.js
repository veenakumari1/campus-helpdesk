import express from 'express';
import { knowledgeService } from '../services/knowledge.service.js';

const router = express.Router();

router.get('/departments', (req, res) => {
  res.json({
    success: true,
    count: knowledgeService.getAllDepartments().length,
    departments: knowledgeService.getAllDepartments()
  });
});

router.get('/faqs', (req, res) => {
  res.json({
    success: true,
    count: knowledgeService.getAllFaqs().length,
    faqs: knowledgeService.getAllFaqs()
  });
});

export default router;

