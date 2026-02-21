import { Request, Response } from 'express'
import crypto from 'crypto'
import pool from '../db'
import { RowDataPacket } from 'mysql2'

interface CouponCreateParams {
  title: string
  discount_amount: number
  min_spend: number
  start_time: string
  end_time: string
  total_count: number
}

// 确保表存在的初始化函数 (可选，容错处理)
export const initCouponsTable = async () => {
  const createTableSql = `
        CREATE TABLE IF NOT EXISTS coupons (
            coupon_id varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
            title varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
            discount_amount decimal(10, 2) NULL DEFAULT NULL COMMENT '优惠额度',
            min_spend decimal(10, 2) NULL DEFAULT NULL COMMENT '最低消费金额',
            start_time datetime NULL DEFAULT NULL,
            end_time datetime NULL DEFAULT NULL,
            total_count int NULL DEFAULT NULL COMMENT '发行量',
            issued_count int NULL DEFAULT 0 COMMENT '已发行量',
            created_at datetime NULL DEFAULT NULL COMMENT '发行日期',
            PRIMARY KEY (coupon_id) USING BTREE
        ) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '优惠券表' ROW_FORMAT = Dynamic;
    `
  try {
    await pool.execute(createTableSql)
  } catch (err) {
    console.error('初始化 coupons 表失败:', err)
  }
}

// 获取优惠券列表
export const getCouponsList = async (req: Request, res: Response): Promise<void> => {
  try {
    const sql = `SELECT * FROM coupons ORDER BY created_at DESC`
    const [rows] = await pool.execute<RowDataPacket[]>(sql)
    res.status(200).json(rows)
  } catch (err) {
    console.error('获取优惠券列表报错:', err)
    res.status(500).json({ message: '获取优惠券列表失败' })
  }
}

// 创建优惠券
export const createCoupon = async (
  req: Request<Record<string, never>, Record<string, never>, CouponCreateParams>,
  res: Response,
): Promise<void> => {
  const { title, discount_amount, min_spend, start_time, end_time, total_count } = req.body

  try {
    const uuid = crypto.randomUUID().replace(/-/g, '').substring(0, 8)
    const y = new Date().getFullYear()
    const m = String(new Date().getMonth() + 1).padStart(2, '0')
    const d = String(new Date().getDate()).padStart(2, '0')
    const couponId = `CP-${y}${m}${d}${uuid}`

    const createdAt = new Date()

    const sql = `
            INSERT INTO coupons 
            (coupon_id, title, discount_amount, min_spend, start_time, end_time, total_count, issued_count, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
    const values = [
      couponId,
      title,
      discount_amount,
      min_spend,
      start_time,
      end_time,
      total_count,
      0, // init issued_count to 0
      createdAt,
    ]

    await pool.execute(sql, values)

    res.status(201).json({
      message: '创建优惠券成功',
      coupon_id: couponId,
    })
  } catch (err) {
    console.error('创建优惠券报错:', err)
    res.status(500).json({ message: '创建优惠券失败' })
  }
}

// 删除优惠券
export const deleteCoupon = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params

  try {
    const sql = `DELETE FROM coupons WHERE coupon_id = ?`
    await pool.execute(sql, [id])

    res.status(200).json({
      message: '删除优惠券成功',
    })
  } catch (err) {
    console.error('删除优惠券报错:', err)
    res.status(500).json({ message: '删除优惠券失败' })
  }
}
