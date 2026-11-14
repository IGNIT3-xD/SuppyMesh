import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from '../src/lib/prisma.js'

async function bootstrap() {
    try {
        // Connect to database
        await prisma.$connect();
        console.log('✅ Database connected successfully');

        const app = createApp();

        app.listen(env.PORT, () => {
            console.log(`🚀 SupplyMesh API running on http://localhost:${env.PORT}`);
        });
    } catch (error) {
        console.error('❌ Failed to connect to the database:', error);
        process.exit(1);
    }
}

bootstrap();