import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '../generated/prisma/client';
import { AppError } from './app-error';
import { env } from '../config/env';

export const globalErrorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // 1. Handle Zod Validation Errors (400 Bad Request)
    if (err instanceof ZodError) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors: err.issues.map((issue) => ({
                path: issue.path.join('.'),
                message: issue.message,
            })),
        });
    }

    // 2. Handle Prisma Database Errors
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
            return res.status(409).json({
                status: 'error',
                message: `A record with this ${err.meta?.target} already exists.`,
            });
        }
        if (err.code === 'P2025') {
            return res.status(404).json({
                status: 'error',
                message: 'Record not found.',
            });
        }
    }

    // 3. Handle Custom App Errors (e.g., Unauthorized, Forbidden)
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: 'error',
            message: err.message,
        });
    }

    // 4. Handle Generic / Unknown Errors (500 Internal Server Error)
    // Log the full stack trace for debugging, but do NOT send it to the client in production
    console.error('💥 UNHANDLED ERROR:', err);

    const message =
        env.NODE_ENV === 'production'
            ? 'An unexpected error occurred.'
            : err.message;

    return res.status(500).json({
        status: 'error',
        message,
        ...(env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
};