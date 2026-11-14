import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../../config/env.js';
import { RegisterInput } from './auth.schema.js';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/app-error.js';
import { uploadToCloudinary } from '../../utils/cloudinary.js';

export class AuthService {
    static async register(data: RegisterInput, fileBuffer?: Buffer) {
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) throw new AppError('Email is already registered', 409);

        // 1. Upload to Cloudinary if file exists
        let profilePicUrl: string | undefined;
        if (fileBuffer) {
            profilePicUrl = await uploadToCloudinary(fileBuffer);
        }

        // 2. Hash Password
        const passwordHash = await bcrypt.hash(data.password, 10);

        // 3. Transaction
        const result = await prisma.$transaction(async (tx) => {
            const organization = await tx.organization.create({
                data: { name: data.organizationName },
            });

            let ownerRole = await tx.role.findUnique({ where: { name: 'ORG_OWNER' } });
            if (!ownerRole) {
                ownerRole = await tx.role.create({ data: { name: 'ORG_OWNER' } });
            }

            return await tx.user.create({
                data: {
                    organizationId: organization.id,
                    email: data.email,
                    passwordHash,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    profilePic: profilePicUrl,
                    status: 'ACTIVE',
                    authProvider: 'CREDENTIAL',
                    roles: { create: { roleId: ownerRole.id } },
                },
                include: { roles: { include: { role: true } } },
                omit: { passwordHash: true }
            });
        });

        // 4. Generate Tokens
        const roles = result.roles.map((r) => r.role.name);

        const accessToken = jwt.sign(
            { userId: result.id, organizationId: result.organizationId, roles },
            env.JWT_ACCESS_SECRET,
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { userId: result.id },
            env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );

        // 5. Store Hashed Refresh Token in DB
        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await prisma.refreshToken.create({
            data: {
                userId: result.id,
                tokenHash,
                expiresAt,
            },
        });

        return { result, accessToken, refreshToken };
    }
}