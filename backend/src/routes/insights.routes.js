import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { getInsights } from "../controllers/insights.controller.js";

const router = express.Router();

router.get("/", authMiddleware, getInsights);

export default router;