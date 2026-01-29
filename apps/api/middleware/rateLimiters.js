import rateLimit from 'express-rate-limit';

export const weatherRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 50, // Limit each IP to 50 requests per windowMs
    message: {
        status: 'error',
        message: 'Too many weather requests from this IP, please try again after an hour.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});