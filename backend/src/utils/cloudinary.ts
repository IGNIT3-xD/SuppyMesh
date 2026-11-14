import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';

cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = (fileBuffer: Buffer): Promise<string> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'supplymesh/profiles' },
            (error, result) => {
                if (error || !result) return reject(error || new Error('Upload failed'));
                resolve(result.secure_url);
            }
        );
        uploadStream.end(fileBuffer);
    });
};