import express from "express";
import { getUserProfile, addViewHistory, getViewHistory, toggleFavorite, checkFavorite, getFavorites } from "../controller/user.controller";
import { verifyToken } from "../middleware/verifyToken";

const router = express.Router();

// 获取token中对应userid的个人信息
router.get("/profile", verifyToken, getUserProfile);

// 浏览历史
router.post("/history/add", addViewHistory);
router.post("/history/list", getViewHistory);

// 收藏
router.post("/favorite/toggle", toggleFavorite);
router.post("/favorite/check", checkFavorite);
router.post("/favorite/list", getFavorites);

export default router;