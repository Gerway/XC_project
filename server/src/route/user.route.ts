import express from 'express'
import {
  getUserProfile,
  getUserStats,
  getUserList,
  updateUserStatus,
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

export default router
