import dotenv from 'dotenv'
import path from 'path'
dotenv.config()
dotenv.config({ path: path.resolve(__dirname, '../.env') })

import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import AuthRouter from './route/auth.route'
import UserRouter from './route/user.route'
import HotelRouter from './route/hotel.route'
import CouponRouter from './route/coupon.route'
import UserCouponRouter from './route/user_coupon.route'
import MerchantRouter from './route/merchant.route'
import UploadRouter from './route/upload.route'
import OrderRouter from './route/order.route'
import RoomRouter from './route/room.route'

// 数据库连接测试函数
import { checkConnection } from './db'
import { initCouponsTable } from './controller/coupon.controller'
import { initUserCouponsTable } from './controller/user_coupon.controller'
import { initMerchantTables } from './controller/merchant_hotel.controller'

const app = express()

// 让接口可以接收到json格式数据
app.use(express.json())
app.use(cookieParser())

// 允许跨域，允许使用cookies
app.use(cors({ origin: true, credentials: true }))

app.use('/api/auth/', AuthRouter)
app.use('/api/user/', UserRouter)
app.use('/api/hotel/', HotelRouter)
app.use('/api/coupons', CouponRouter)
app.use('/api/user-coupons', UserCouponRouter)
app.use('/api/merchant/hotel', MerchantRouter)
app.use('/api/upload', UploadRouter)
app.use('/api/order', OrderRouter)
app.use('/api/room', RoomRouter)
// 配置静态文件服务，允许通过 /static 访问上传的图片等
app.use('/static', express.static(path.join(__dirname, '../static')))

app.listen(8800, async () => {
  console.log('server is running!')
  // 检查数据库连上了没
  await checkConnection()
  // 初始化优惠券表
  await initCouponsTable()
  // 初始化用户优惠券领取表
  await initUserCouponsTable()
  // 初始化商家端相关表
  await initMerchantTables()
})
