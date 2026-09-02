import { prisma } from '../config/db';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { RegisterInput, LoginInput } from '../schemas/auth.schema';
import { AppError } from '../middleware/errorHandler';

export class AuthService {
  static async register(input: RegisterInput) {
    const normalizedEmail = input.email.trim().toLowerCase();

    // Check if email already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new AppError('Email address is already in use', 409, 'EMAIL_EXISTS');
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: input.name.trim(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const token = generateToken({ id: user.id, email: user.email });

    return { user, token };
  }

  static async login(input: LoginInput) {
    const normalizedEmail = input.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Rule A9: Obfuscate auth error, no distinction between wrong email vs wrong password
    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const isPasswordValid = await comparePassword(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const token = generateToken({ id: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    };
  }

  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    return user;
  }
}
