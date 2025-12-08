import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import morgan from 'morgan';
import logger from './config/logger.js';

dotenv.config();

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true })); // increase payload size limit to support temporary thumbnail uploads

app.use(cors());
app.use(helmet());
app.use(morgan('dev')); // HTTP request logging

// MongoDB Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tripcircle');
        logger.info('MongoDB connected successfully');
    } catch (error) {
        logger.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

connectDB();
app.use(mongoSanitize());

// Routes
app.get('/api', (req, res) => {
    res.json({ message: 'Welcome to TripCircle API' });
});

// Auth routes (public, no middleware required)
import authRoutes from './routes/auth.js';
app.use('/api/auth', authRoutes);

// Legacy login route (deprecated, redirects to /api/auth)
import loginRoutes from './routes/login.js';
app.use('/api/login', loginRoutes);

// Authentication middleware - protects all routes below this
import authMiddleware from './middleware/auth.js';
app.use(authMiddleware);

// Import protected routes
import tripRoutes from './routes/trips.js';
import userRoutes from './routes/users.js';
app.use('/api/trips', tripRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});