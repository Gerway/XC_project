import express from 'express'
import { uploadMiddleware, uploadImage } from '../controller/upload.controller'

const router = express.Router()

// 使用 multer 中间件拦截名为 'file' 的表单字段
router.post('/', uploadMiddleware.single('file'), uploadImage)

export default router
