import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';
import { prisma } from '../config/db';
import { AppError } from './errorHandler';

export interface AuthenticatedUser {
  id: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication token required', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError('Authentication token required', 401, 'UNAUTHORIZED');
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw new AppError('Invalid or expired authentication token', 401, 'UNAUTHORIZED');
    }

    // Verify user still exists in database
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new AppError('User account associated with this token no longer exists', 401, 'UNAUTHORIZED');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
