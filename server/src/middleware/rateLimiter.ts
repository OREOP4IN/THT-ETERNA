import rateLimit from 'express-rate-limit';

/**
 * Rate limiting middleware for authentication endpoints.
 * Protects against brute-force attacks by capping failed/repeated login attempts.
 * Limit each IP to 10 login attempts per window (max) for 15 mins (windowMs)
 * 
 * Skip in automated tests to prevent test rate-limiting (skip NODE_ENV === test)
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many login attempts from this IP. Please try again in 15 minutes.',
    },
  },
  skip: () => process.env.NODE_ENV === 'test',
});
