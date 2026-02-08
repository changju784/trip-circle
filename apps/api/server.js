import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import morgan from 'morgan';

// Config and Middleware
import logger from './config/logger.js';
import authMiddleware from './middleware/auth.js';

// Route Imports
import authRoutes from './routes/auth.js';
import loginRoutes from './routes/login.js';
import tripRoutes from './routes/trips.js';
import userRoutes from './routes/users.js';
import postRoutes from './routes/posts.js';
import geoRoutes from './routes/geo.js';
import weatherRoutes from './routes/weather.js';

import swaggerUi from 'swagger-ui-express';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const swaggerDocument = require('./swagger/swagger-output.json');
const SWAGGER_OPTIONS = {
    customCssUrl: "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui.min.css",
    customJs: [
        "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui-bundle.js",
        "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui-standalone-preset.js"
    ],
    customSiteTitle: "TripCircle API Documentation"
};

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// --- 1. Database Connection ---
const connectDB = async () => {
    try {
        const connUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tripcircle';
        await mongoose.connect(connUri);
        logger.info('MongoDB connected successfully');
    } catch (error) {
        logger.error('MongoDB connection error:', error);
        process.exit(1);
    }
};
connectDB();

// --- 2. Global Middleware ---
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            "default-src": ["'self'"],
            "script-src": ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            "style-src": ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
            "img-src": ["'self'", "data:", "https://validator.swagger.io"],
            "connect-src": ["'self'", "*"]
        },
    },
}));
app.use(cors());
app.use(morgan('dev'));
app.use(mongoSanitize());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// --- 3. Public Routes ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, SWAGGER_OPTIONS));

app.get('/api', (req, res) => {
    res.json({
        message: 'Welcome to TripCircle API',
        documentation: '/api-docs'
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/login', loginRoutes);

// --- 4. Protected Routes (Auth Guard) ---
app.use(authMiddleware);

app.use('/api/trips', tripRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/geo', geoRoutes);
app.use('/api/weather', weatherRoutes);

// --- 5. Server Start ---
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});