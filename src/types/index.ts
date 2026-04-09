import { Request } from "express";
import { IUser } from "../models/user.model";

// Extend Express Request to carry user after auth
export interface AuthRequest extends Request {
  user?: IUser;
}
