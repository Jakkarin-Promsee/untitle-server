import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";
import { AuthRequest } from "../types";

const generateToken = (id: string) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET as string,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    } as any,
  );
};

// POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400).json({ message: "Email already in use" });
    return;
  }

  const user = await User.create({ name, email, password, role: "user" });
  const token = generateToken(user._id.toString());

  res.status(201).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password, portal } = req.body as {
    email: string;
    password: string;
    portal?: "user" | "trainer" | "admin";
  };
  const targetPortal = portal || "user";
  const allowedPortals = new Set(["user", "trainer", "admin"]);

  if (!allowedPortals.has(targetPortal)) {
    res.status(400).json({ message: "Invalid login portal" });
    return;
  }

  // 1. Check user exists
  const user = await User.findOne({ email });
  if (!user) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  // 2. Check status
  if (user.status !== "active") {
    res
      .status(403)
      .json({ message: "Your account has been suspended or blocked" });
    return;
  }

  // 3. Compare password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  // 4. Enforce portal-specific login
  if (targetPortal !== user.role) {
    res.status(403).json({
      message: `This account is not allowed to sign in from ${targetPortal} portal`,
    });
    return;
  }

  // 4. Generate token
  const token = generateToken(user._id.toString());

  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

// POST /api/auth/admin/create-trainer
export const createTrainer = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { name, email, password } = req.body as {
    name?: string;
    email?: string;
    password?: string;
  };

  if (!name || !email || !password) {
    res.status(400).json({ message: "name, email and password are required" });
    return;
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400).json({ message: "Email already in use" });
    return;
  }

  const trainer = await User.create({
    name,
    email,
    password,
    role: "trainer",
    status: "active",
  });

  res.status(201).json({
    message: "Trainer account created",
    user: {
      id: trainer._id,
      name: trainer.name,
      email: trainer.email,
      role: trainer.role,
      status: trainer.status,
    },
  });
};

// GET /api/auth/me
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const token = generateToken(req.user._id.toString());

  res.status(200).json({
    token,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      status: req.user.status,
    },
  });
};
