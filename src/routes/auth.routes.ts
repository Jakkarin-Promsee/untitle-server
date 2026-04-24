import { Router } from "express";
import {
  createTrainer,
  getMe,
  register,
  login,
} from "../controllers/auth.controller";
import { protect, restrictTo } from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.post("/admin/create-trainer", protect, restrictTo("admin"), createTrainer);

export default router;
