import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../schemas/auth.schema';
import { authenticate } from '../middleware/auth';
import { loginRateLimiter } from '../middleware/rateLimiter';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), AuthController.register);
authRouter.post('/login', loginRateLimiter, validate(loginSchema), AuthController.login);
authRouter.get('/me', authenticate, AuthController.getMe);
authRouter.post('/logout', authenticate, AuthController.logout);
