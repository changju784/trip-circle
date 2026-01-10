import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import axios from "axios";
import { OAuth2Client } from "google-auth-library";
import User from "../schema/UserSchema.js";
import logger from "../config/logger.js";

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user with email and password
 */
router.post("/register", async (req, res) => {
    const { email, password, name } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        // Check if user already exists
        let user = await User.findOne({ email });

        if (user) {
            return res.status(409).json({ message: "Email already registered" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        user = new User({
            email,
            password: hashedPassword,
            username: name,
        });

        await user.save();

        // Create JWT token
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                username: user.username
            },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        logger.info(`User registered successfully: ${email}`);

        res.status(201).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                username: user.username,
                dateCreated: user.dateCreated,
            },
        });
    } catch (error) {
        if (error.code === 11000) {
            if (error.keyPattern?.username) {
                return res.status(409).json({ message: "Username already taken" });
            }
            if (error.keyPattern?.email) {
                return res.status(409).json({ message: "Email already registered" });
            }
        }
        logger.error("Registration error:", error);
        res.status(500).json({ message: "Server error during registration" });
    }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        // Find user by email
        const user = await User.findOne({ email });

        if (!user || !user.password) {
            logger.warn(`Failed login attempt for email: ${email}`);
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Compare provided password with hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            logger.warn(`Failed login attempt for email: ${email} - invalid password`);
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Create JWT token
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                username: user.username
            },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        logger.info(`User logged in successfully: ${email}`);

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                username: user.username,
                dateCreated: user.dateCreated,
            },
        });
    } catch (error) {
        logger.error("Login error:", error);
        res.status(500).json({ message: "Server error during login" });
    }
});

/**
 * GET /api/auth/google
 * Redirect to Google OAuth login
 */
router.get("/google", (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const googleClientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const redirectUri = `${process.env.BACKEND_URL || "http://localhost:5000"}/api/auth/google/callback`;

    if (!googleClientId) {
        return res.status(500).json({ message: "Google OAuth not configured" });
    }

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
        client_id: googleClientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid email profile",
        access_type: "offline",
    }).toString()}`;

    res.redirect(googleAuthUrl);
});

/**
 * GET /api/auth/google/callback
 * Handle Google OAuth callback
 */
router.get("/google/callback", async (req, res) => {
    const { code, error } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    if (error) {
        logger.warn(`Google OAuth error: ${error}`);
        return res.redirect(`${frontendUrl}/auth/login?error=${error}`);
    }

    if (!code) {
        return res.redirect(`${frontendUrl}/auth/login?error=no_code`);
    }

    try {
        const googleClientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
        const googleClientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
        const redirectUri = `${process.env.BACKEND_URL || "http://localhost:5000"}/api/auth/google/callback`;

        if (!googleClientId || !googleClientSecret) {
            throw new Error("Google OAuth credentials not configured");
        }

        // Exchange authorization code for tokens
        const tokenResponse = await axios.post("https://oauth2.googleapis.com/token", {
            code,
            client_id: googleClientId,
            client_secret: googleClientSecret,
            redirect_uri: redirectUri,
            grant_type: "authorization_code",
        });

        const { id_token } = tokenResponse.data;

        // Verify the Google ID token and get user info
        const client = new OAuth2Client(googleClientId);
        const ticket = await client.verifyIdToken({
            idToken: id_token,
            audience: googleClientId,
        });

        const payload = ticket.getPayload();
        const googleId = payload.sub;
        const email = payload.email;
        const name = payload.name || null;

        // Find or create user
        let user = await User.findOne({ email });

        // Block: email exists but NOT a Google account
        if (user && !user.googleId) {
            return res.redirect(
                `${frontendUrl}/auth/login?error=google_account_exists`
            );
        }

        console.log("Google OAuth payload:", user);

        if (!user) {
            // Create new user from Google profile
            user = new User({
                email,
                name: name || null,
                googleId,
                password: null, // OAuth users have no password
            });
            await user.save();
            logger.info(`New user created via Google OAuth: ${email}`);
        } else if (!user.googleId) {
            // Link Google account to existing email user
            user.googleId = googleId;
            await user.save();
            logger.info(`Google account linked to existing user: ${email}`);
        }

        // Create JWT token
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                username: user.username || null,
            },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        logger.info(`User logged in via Google: ${email}`);

        // Redirect to frontend with token
        res.redirect(`${frontendUrl}/trip-circle/auth/callback?token=${encodeURIComponent(token)}`);
    } catch (error) {
        logger.error("Google OAuth callback error:", error);
        res.redirect(`${frontendUrl}/auth/login?error=auth_failed`);
    }
});

export default router;
