/**
 * Deprecated: Use /api/auth/login instead
 * Kept for backward compatibility, redirects to new auth routes
 */

import express from "express";

const router = express.Router();

router.post("/", (req, res) => {
  res.status(301).json({
    message: "Moved to /api/auth/login",
    redirect: "/api/auth/login",
  });
});

export default router;
