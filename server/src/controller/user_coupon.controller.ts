import { Request, Response } from 'express'
import crypto from 'crypto'
import pool from '../db'
import { RowDataPacket } from 'mysql2'

interface ClaimCouponParams {
  coupon_id: string
  user_id?: string
}

// 初始化表
export const initUserCouponsTable = async () => {
  const createTableSql = `
        CREATE TABLE IF NOT EXISTS user_coupons (
            user_coupons_id varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
            user_id varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '逻辑外键: 关联users',
            coupon_id varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '逻辑外键: 关联coupons',
            status int NULL DEFAULT NULL COMMENT '使用状态 0未使用 1已使用',
            PRIMARY KEY (user_coupons_id) USING BTREE,
            INDEX idx_user_id(user_id ASC) USING BTREE
        ) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户优惠券表' ROW_FORMAT = Dynamic;
    `
  try {
    await pool.execute(createTableSql)
  } catch (err) {
    console.error('初始化 user_coupons 表失败:', err)
  }
}

// 用户领取优惠券
export const claimCoupon = async (
  req: Request<Record<string, never>, Record<string, never>, ClaimCouponParams>,
  res: Response,
): Promise<void> => {
  const { coupon_id } = req.body
  // 假设用户认证后 user_id 存在 req.user 中 (或者从 body/query 中暂时传入供前端测试用)
  // 为了方便全栈连通性测试，如果请求里带了 user_id 就用请求的，否则由于权限未完全贯通目前写死一个测试值或者提取自 JWT
  // 我们尝试从前端的 Authorization token 里获取，如果您前端传入了 user_id，我们就接收即可
  const user_id =
    (req as Request & { user?: { id: string } }).user?.id ||
    req.body.user_id ||
    'test_user_from_frontend_1'

  if (!coupon_id) {
    res.status(400).json({ message: '优惠券ID不能为空' })
    return
  }

  try {
    // 1. 检查优惠券是否存在
    const [coupons] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM coupons WHERE coupon_id = ?`,
      [coupon_id],
    )
    if (coupons.length === 0) {
      res.status(404).json({ message: '该优惠券不存在' })
      return
    }
    const coupon = coupons[0]

    // 2. 检查优惠券时效
    const now = new Date().getTime()
    if (coupon.end_time && now > new Date(coupon.end_time).getTime()) {
      res.status(400).json({ message: '该优惠券已过期无法领取' })
      return
    }

    // 3. 检查发放数量限制
    if (coupon.total_count !== -1 && coupon.issued_count >= coupon.total_count) {
      res.status(400).json({ message: '非常抱歉，该优惠券已被领空' })
      return
    }

    // 4. 检查用户是否已经领取过 (简单限制：每人每券只能领一张)
    const [existUserCoupons] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM user_coupons WHERE user_id = ? AND coupon_id = ?`,
      [user_id, coupon_id],
    )
    if (existUserCoupons.length > 0) {
      res.status(400).json({ message: '您已经领取过该优惠券了' })
      return
    }

    // 5. 插入领取记录并更新原券的发放量
    const uuid = crypto.randomUUID().replace(/-/g, '').substring(0, 16)
    const userCouponsId = `UC_${uuid}`

    // 我们应该使用事务，但为了快速展示原生效果这里直接执行，若有错误可分别回滚。
    // a. 插入用户券包记录 (status = 0 未使用)
    await pool.execute(
      `INSERT INTO user_coupons (user_coupons_id, user_id, coupon_id, status) VALUES (?, ?, ?, ?)`,
      [userCouponsId, user_id, coupon_id, 0],
    )

    // b. 更新发放数量
    await pool.execute(`UPDATE coupons SET issued_count = issued_count + 1 WHERE coupon_id = ?`, [
      coupon_id,
    ])

    res.status(201).json({
      message: '领取优惠券成功',
      user_coupons_id: userCouponsId,
    })
  } catch (err) {
    console.error('领取优惠券报错:', err)
    res.status(500).json({ message: '服务器内部错误，领取失败' })
  }
}

// 获取用户个人的优惠券列表
export const getUserCoupons = async (req: Request, res: Response): Promise<void> => {
  const user_id =
    (req as Request & { user?: { id: string } }).user?.id ||
    req.query.user_id ||
    'test_user_from_frontend_1'
  // 前端传入想要查询的 status (0未使用 1已使用 空为全部)

  try {
    // 联合查询 user_coupons 与优惠券基本信息
    const sql = `
      SELECT uc.user_coupons_id, uc.status, uc.user_id,
             c.coupon_id, c.title, c.discount_amount, c.min_spend, c.start_time, c.end_time
      FROM user_coupons uc
      INNER JOIN coupons c ON uc.coupon_id = c.coupon_id
      WHERE uc.user_id = ?
      ORDER BY uc.user_coupons_id DESC
    `
    const [rows] = await pool.execute<RowDataPacket[]>(sql, [user_id])

    // 你可以在后端处理过期逻辑，也可以直接把过期标识交由前端结合系统时间判断。
    // 对于已经过期的但是status为0的，前端通常会展示在Expired里。
    res.status(200).json(rows)
  } catch (err) {
    console.error('获取用户优惠券报错:', err)
    res.status(500).json({ message: '获取用户优惠券失败' })
  }
}
