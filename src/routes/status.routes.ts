import { Router } from "express";
import {
  getAllStatus,
  getDatabaseStatus,
  getEnvStatus,
  getServerStatus,
} from "../controllers/status.controller";

const router = Router();

// GET /api/status/          → server uptime, memory, platform info
router.get("/", getServerStatus);

// GET /api/status/database  → MongoDB connection state
router.get("/database", getDatabaseStatus);

// GET /api/status/env       → required env var presence check
router.get("/env", getEnvStatus);

// GET /api/status/all       → aggregated check for all systems
router.get("/all", getAllStatus);

export default router;
