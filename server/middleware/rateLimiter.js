const requestCounts = new Map();

export function rateLimiter(req, res, next) {
  const key = req.ip || req.student?.id || 'client';
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = parseInt(process.env.MAX_REQUESTS_PER_MINUTE, 10) || 60;

  let clientRecord = requestCounts.get(key);
  if (!clientRecord || now - clientRecord.startTime > windowMs) {
    clientRecord = { count: 1, startTime: now };
  } else {
    clientRecord.count++;
  }

  requestCounts.set(key, clientRecord);

  if (clientRecord.count > maxRequests) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please wait a moment before sending more requests.'
    });
  }

  next();
}

