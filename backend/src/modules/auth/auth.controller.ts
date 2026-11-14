import { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { registerSchema } from './auth.schema.js';

export class AuthController {
    static async register(req: Request, res: Response) {
        const validatedData = registerSchema.parse(req.body);

        const fileBuffer = req.file?.buffer;

        const { result, accessToken, refreshToken } = await AuthService.register(
            validatedData,
            fileBuffer
        );

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Requires HTTPS in prod
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.status(201).json({
            status: 'success',
            message: 'Account created successfully',
            data: { result, accessToken },
        });
    }
}