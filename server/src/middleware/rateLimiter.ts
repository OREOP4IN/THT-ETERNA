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

/**
 * Limit each IP to 10 sign in attempts per window (max) for 1 hour (windowMs)
 * 
 * Skip in automated tests to prevent test rate-limiting (skip NODE_ENV === test)
 */
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 registration attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many registration attempts from this IP. Please try again later.',
    },
  },
  skip: () => process.env.NODE_ENV === 'test',
});
