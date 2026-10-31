import { auditService } from '../services/audit.service.js';

export function errorHandler(err, req, res, _next) {
  console.error('[SERVER ERROR]', err);

  auditService.log({
    type: 'SERVER_EXCEPTION',
    studentId: req.student?.id || 'anonymous',
    details: { message: err.message, path: req.path },
    status: 'ERROR'
  });

  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected error occurred.'
  });
}
