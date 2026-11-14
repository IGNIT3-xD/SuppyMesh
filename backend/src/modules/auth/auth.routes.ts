import { Router } from 'express';
import multer from 'multer';
import { AuthController } from './auth.controller.js';
import { asyncHandler } from '../../utils/async-handler.js';

const router = Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

router.post(
    '/register',
    upload.single('profilePic'),
    asyncHandler(AuthController.register)
);

export const authRoutes = router;