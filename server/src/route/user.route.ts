import express from 'express'
import {
  getUserProfile,
  getUserStats,
  getUserList,
  updateUserStatus,
  addViewHistory,
  getViewHistory,
  toggleFavorite,
  checkFavorite,
  getFavorites
} from '../controller/user.controller'
import { verifyToken } from '../middleware/verifyToken'

const router = express.Router()

// 获取token中对应userid的个人信息
router.get('/profile', verifyToken, getUserProfile)

// 管理员获取用户统计数据
router.get('/admin/stats', verifyToken, getUserStats)

// 管理员获取用户列表
router.get('/admin/list', verifyToken, getUserList)

// 管理员更新用户状态 (封禁/解封)
router.put('/admin/:id/status', verifyToken, updateUserStatus)

// 浏览历史
router.post("/history/add", addViewHistory);
router.post("/history/list", getViewHistory);

// 收藏
router.post("/favorite/toggle", toggleFavorite);
router.post("/favorite/check", checkFavorite);
router.post("/favorite/list", getFavorites);

export default router
