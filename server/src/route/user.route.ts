import express from "express";
import { getUserProfile } from "../controller/user.controller";
import { verifyToken } from "../middleware/verifyToken";

const router = express.Router();

// 获取token中对应userid的个人信息
router.get("/profile", verifyToken, getUserProfile);

export default router;