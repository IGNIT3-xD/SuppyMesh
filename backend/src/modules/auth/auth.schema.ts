import { z } from 'zod';

export const registerSchema = z.object({
    organizationName: z.string().min(2),
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    email: z.email(),
    password: z.string().min(8),
});

export type RegisterInput = z.infer<typeof registerSchema>;