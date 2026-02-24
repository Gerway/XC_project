import { Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import crypto from 'crypto'
import fs from 'fs'

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../static/uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// Multer 存储引擎配置
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名: 时间戳_随机串.后缀
    const ext = path.extname(file.originalname)
    const uniqueSuffix = Date.now() + '_' + crypto.randomBytes(4).toString('hex')
    cb(null, uniqueSuffix + ext)
  },
})

// 文件过滤(仅允许图片)
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error('Only image files are allowed!'))
  }
}

export const uploadMiddleware = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 限制图片最大为 10MB
  },
})

// 上传图片处理函数
export const uploadImage = (req: Request, res: Response): void => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' })
      return
    }

    // 构建完整的图片 URL
    // 此处写死 8800 端口（根据项目配置可改为环境变量或动态获取 host）
    const host = req.get('host') || 'localhost:8800'
    const protocol = req.protocol || 'http'
    const imageUrl = `${protocol}://${host}/static/uploads/${req.file.filename}`

    res.status(200).json({
      message: 'Upload successful',
      data: {
        url: imageUrl,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
    })
  } catch (error) {
    console.error('Upload Error: ', error)
    res.status(500).json({ message: 'Internal Server Error during upload' })
  }
}
