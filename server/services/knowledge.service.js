import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');

class KnowledgeService {
  constructor() {
    this.departments = [];
    this.faqs = [];
    this._load();
  }

  _load() {
    try {
      const deptPath = path.join(DATA_DIR, 'departments.json');
      const faqPath = path.join(DATA_DIR, 'faqs.json');
      if (fs.existsSync(deptPath)) {
        this.departments = JSON.parse(fs.readFileSync(deptPath, 'utf8'));
      }
      if (fs.existsSync(faqPath)) {
        this.faqs = JSON.parse(fs.readFileSync(faqPath, 'utf8'));
      }
    } catch (err) {
      console.error('Failed to load university knowledge base:', err);
    }
  }

  getAllDepartments() {
    return this.departments;
  }

  getDepartmentById(id) {
    return this.departments.find((d) => d.id === id);
  }

  getAllFaqs() {
    return this.faqs;
  }

  /**
   * Find most relevant verified FAQ and policy based on text tokens
   */
  findRelevantFaq(queryText) {
    const tokens = queryText.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
    let bestMatch = null;
    let highestScore = 0;

    for (const faq of this.faqs) {
      let score = 0;
      for (const kw of faq.keywords) {
        if (tokens.some((t) => t === kw || (kw.length > 4 && t.includes(kw)))) {
          score += 3;
        }
      }
      if (tokens.some((t) => faq.topic.toLowerCase().includes(t))) {
        score += 2;
      }
      if (score > highestScore) {
        highestScore = score;
        bestMatch = faq;
      }
    }

    return highestScore >= 3 ? bestMatch : null;
  }

  /**
   * Find target department matching query / category
   */
  findDepartment(queryText, category) {
    const text = (queryText || '').toLowerCase();
    const cat = (category || '').toLowerCase();

    // 1. Facilities
    if (
      cat.includes('facilities') ||
      text.includes('water') ||
      text.includes('faucet') ||
      text.includes('restroom') ||
      text.includes('fountain') ||
      text.includes('leak') ||
      text.includes('toilet') ||
      text.includes('hvac') ||
      text.includes('plumbing') ||
      text.includes('light') ||
      text.includes('heat') ||
      text.includes('pipe') ||
      text.includes('desk') ||
      text.includes('chair')
    ) {
      return this.getDepartmentById('facilities-ops');
    }

    // 2. Classroom AV
    if (
      cat.includes('classroom') ||
      text.includes('projector') ||
      text.includes('smartboard') ||
      text.includes('lectern') ||
      text.includes('hdmi') ||
      text.includes('microphone') ||
      (text.includes('screen') && !text.includes('login screen'))
    ) {
      return this.getDepartmentById('classroom-av');
    }

    // 3. Accounts & IAM
    if (
      cat.includes('account') ||
      text.includes('portal') ||
      text.includes('password') ||
      text.includes('login') ||
      text.includes('mfa') ||
      text.includes('duo') ||
      text.includes('credentials')
    ) {
      return this.getDepartmentById('sis-iam');
    }

    // 4. IT & Wi-Fi
    if (
      cat.includes('wi-fi') ||
      cat.includes('it') ||
      text.includes('wifi') ||
      text.includes('wi-fi') ||
      text.includes('internet') ||
      text.includes('network') ||
      text.includes('ethernet') ||
      text.includes('printing')
    ) {
      return this.getDepartmentById('it-services');
    }

    // 5. Finance
    if (
      cat.includes('finance') ||
      text.includes('tuition') ||
      text.includes('fee') ||
      text.includes('bursar') ||
      text.includes('bill') ||
      text.includes('financial aid') ||
      text.includes('hold')
    ) {
      return this.getDepartmentById('student-finance');
    }

    // 6. Academic
    if (
      cat.includes('academic') ||
      text.includes('course') ||
      text.includes('register') ||
      text.includes('advisor') ||
      text.includes('override') ||
      text.includes('grade') ||
      text.includes('audit')
    ) {
      return this.getDepartmentById('academic-affairs');
    }

    // Fallback by general category or first department
    const byCategory = this.departments.find(
      (d) => d.category.toLowerCase() === cat || d.name.toLowerCase().includes(cat)
    );
    return byCategory || this.departments[0];
  }
}

export const knowledgeService = new KnowledgeService();
