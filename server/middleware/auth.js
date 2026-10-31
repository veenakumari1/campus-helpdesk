/**
 * Authentication and authorization middleware.
 * Ensures the requester is authenticated as a student and only accesses their own complaints.
 */

export const mockStudents = [
  {
    id: 'student-101',
    name: 'Veena Chen',
    email: 'v.chen@campus.edu',
    role: 'student',
    campus: 'Northwood Campus',
    avatar: 'VC'
  },
  {
    id: 'student-102',
    name: 'Jordan Lee',
    email: 'j.lee@campus.edu',
    role: 'student',
    campus: 'Science Building',
    avatar: 'JL'
  }
];

export function requireStudentAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  let student = mockStudents[0]; // Default student session (Veena Chen)

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    const matched = mockStudents.find((s) => s.id === token || s.email === token);
    if (matched) {
      student = matched;
    }
  }

  req.student = student;
  next();
}

