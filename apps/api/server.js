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
app.use(cors());
app.use(express.json());
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

// Import login route
import loginRoutes from './routes/login.js';
app.use('/api/login', loginRoutes);

// Authentication middleware
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