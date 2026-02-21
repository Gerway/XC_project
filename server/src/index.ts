import dotenv from "dotenv";
import path from 'path';
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import AuthRouter from "./route/auth.route"
import UserRouter from "./route/user.route";
import HotelRouter from "./route/hotel.route";
import CouponRouter from './route/coupon.route'

// 数据库连接测试函数
import { checkConnection } from './db'
import { initCouponsTable } from './controller/coupon.controller'

const app = express()

// 让接口可以接收到json格式数据
app.use(express.json())
app.use(cookieParser())

// 允许跨域，允许使用cookies
app.use(cors({ origin: true, credentials: true }))

app.use('/api/auth/', AuthRouter)
app.use('/api/user/', UserRouter);
app.use('/api/hotel/', HotelRouter);
app.use('/api/coupons', CouponRouter)

app.listen(8800, async () => {
  console.log('server is running!')
  // 检查数据库连上了没
  await checkConnection()
  // 初始化优惠券表
  await initCouponsTable()
})
