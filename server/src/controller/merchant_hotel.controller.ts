import { Request, Response } from 'express'
import pool from '../db'
import crypto from 'crypto'
import { RowDataPacket } from 'mysql2'

// =========================================
// 1. 数据库初始化 (Database Initialization)
// =========================================
export const initMerchantTables = async () => {
  try {
    // 1. hotel
    await pool.execute(`
            CREATE TABLE IF NOT EXISTS hotel (
                hotel_id varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
                user_id varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '逻辑外键: 关联users的商户id',
                name varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
                address varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
                city_name varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '城市代码/名称',
                latitude decimal(10, 6) NULL DEFAULT NULL COMMENT '经度',
                longitude decimal(10, 6) NULL DEFAULT NULL COMMENT '纬度',
                star_rating int NULL DEFAULT NULL COMMENT '星级',
                tags json NULL COMMENT '标签',
                description text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '简介',
                hotel_type int NULL DEFAULT NULL COMMENT '1 经济型、2 舒适型、3 高档型等',
                created_at datetime NULL DEFAULT NULL COMMENT '创建日期',
                status int NULL DEFAULT 1 COMMENT '状态 1=上线 0=下线',
                reviews int NULL DEFAULT 0 COMMENT '评论数',
                score decimal(2, 1) NULL DEFAULT 0.0 COMMENT '评分',
                open_time datetime NULL DEFAULT NULL COMMENT '开店时间',
                close_time datetime NULL DEFAULT NULL COMMENT '闭店时间',
                remark text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '备注',
                PRIMARY KEY (hotel_id) USING BTREE,
                INDEX idx_user_id(user_id ASC) USING BTREE
            ) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;
        `)

    // 2. hotel_media
    await pool.execute(`
            CREATE TABLE IF NOT EXISTS hotel_media (
                media_id varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
                hotel_id varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '逻辑外键: 关联hotel',
                media_type int NULL DEFAULT NULL COMMENT '1=图片 2=视频',
                url varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '文件地址',
                sort_order int NULL DEFAULT NULL COMMENT '排序',
                media_name varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '图片名称: 健身房、餐厅',
                PRIMARY KEY (media_id) USING BTREE,
                INDEX idx_hotel_id(hotel_id ASC) USING BTREE
            ) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;
        `)

    // 3. room
    await pool.execute(`
            CREATE TABLE IF NOT EXISTS room (
                room_id varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
                hotel_id varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '逻辑外键: 关联hotel',
                name varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
                room_type int NOT NULL COMMENT '类型 1 酒店房 2 时租房 3 民宿',
                has_breakfast tinyint(1) NOT NULL COMMENT '是否含早餐 (1=是, 0=否)',
                max_occupancy int NOT NULL COMMENT '最大入住人数',
                area int NOT NULL COMMENT '面积 (平方米)',
                ori_price decimal(10, 2) NOT NULL COMMENT '原价',
                floor json NOT NULL COMMENT '楼层',
                has_window int NOT NULL COMMENT '是否含窗',
                add_bed int NOT NULL COMMENT '是否可加床',
                has_wifi int NOT NULL COMMENT '是否有wifi',
                remark varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '备注',
                room_bed varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '所含床信息',
                PRIMARY KEY (room_id) USING BTREE,
                INDEX idx_hotel_id(hotel_id ASC) USING BTREE
            ) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;
        `)

    // 4. room_inventory
    await pool.execute(`
            CREATE TABLE IF NOT EXISTS room_inventory (
                inventory_id varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
                room_id varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '逻辑外键: 关联room',
                date date NULL DEFAULT NULL COMMENT '库存日期',
                stock int NULL DEFAULT NULL COMMENT '当天可售房间数',
                price decimal(10, 2) NULL DEFAULT NULL COMMENT '当天价格',
                PRIMARY KEY (inventory_id) USING BTREE,
                UNIQUE INDEX uk_room_date(room_id ASC, date ASC) USING BTREE
            ) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;
        `)

    // 5. room_media
    await pool.execute(`
            CREATE TABLE IF NOT EXISTS room_media (
                media_id varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
                room_id varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '逻辑外键: 关联room',
                url varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
                sort_order int NULL DEFAULT NULL,
                PRIMARY KEY (media_id) USING BTREE,
                INDEX idx_room_id(room_id ASC) USING BTREE
            ) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;
        `)
  } catch (err) {
    console.error('initMerchantTables error:', err)
  }
}

// =========================================
// 2. 酒店基础信息 (Hotel & Media)
// =========================================

// -------------------------
// Types
// -------------------------

export interface MerchantAuthBody {
  user_id: string
}

export interface SaveHotelBody extends MerchantAuthBody {
  hotel_id?: string
  name: string
  address: string
  city_name: string
  latitude: number
  longitude: number
  star_rating: number
  tags: string | string[] // 可以是 JSON 字符串，或者数组前端传过来
  description: string
  hotel_type: number
  open_time: string
  close_time: string
  remark: string
}

export interface ManageHotelMediaBody extends MerchantAuthBody {
  action: 'add' | 'delete'
  hotel_id: string
  media_id?: string
  media_type?: number // 1 图片 2 视频
  url?: string
  sort_order?: number
  media_name?: string
}

// ===================== 获取商户酒店详情列表 =====================
export const getMerchantHotels = async (
  req: Request<Record<string, any>, any, MerchantAuthBody>,
  res: Response,
): Promise<void> => {
  const { user_id } = req.body || {}

  if (!user_id) {
    res.status(400).json({ message: '缺少商户 user_id' })
    return
  }

  try {
    // 1. 基本信息
    const [hotelRows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM hotel WHERE user_id = ? ORDER BY created_at DESC`,
      [user_id],
    )

    if (hotelRows.length === 0) {
      res.status(200).json({ message: '尚无酒店信息', data: [] })
      return
    }

    const hotels = []

    for (const h of hotelRows) {
      const hotelInfo = { ...h }
      // 处理 tags, 防止直接把字符串给前端前端不好用
      if (typeof hotelInfo.tags === 'string') {
        try {
          hotelInfo.tags = JSON.parse(hotelInfo.tags)
        } catch {
          // fall back
        }
      }

      // 2. 轮播图/宣传视频
      const [mediaRows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM hotel_media WHERE hotel_id = ? ORDER BY sort_order ASC, media_type ASC`,
        [hotelInfo.hotel_id],
      )

      hotelInfo.media = mediaRows
      hotels.push(hotelInfo)
    }

    res.status(200).json({
      message: '获取酒店信息成功',
      data: hotels,
    })
  } catch (err) {
    console.error('getMerchantHotels error:', err)
    res.status(500).json({ message: '获取酒店信息失败' })
  }
}

// ===================== 保存商户酒店详情 =====================
export const saveMerchantHotel = async (
  req: Request<Record<string, any>, any, SaveHotelBody>,
  res: Response,
): Promise<void> => {
  const {
    user_id,
    hotel_id,
    name,
    address,
    city_name,
    latitude,
    longitude,
    star_rating,
    tags,
    description,
    hotel_type,
    open_time,
    close_time,
    remark,
  } = req.body || {}

  if (!user_id || !name) {
    res.status(400).json({ message: 'user_id 和 name 为必填项' })
    return
  }

  try {
    const tagsJson = typeof tags === 'object' ? JSON.stringify(tags) : tags || '[]'

    if (hotel_id) {
      // 检查权限
      const [existing] = await pool.execute<RowDataPacket[]>(
        `SELECT hotel_id FROM hotel WHERE user_id = ? AND hotel_id = ?`,
        [user_id, hotel_id],
      )

      if (existing.length === 0) {
        res.status(403).json({ message: '无权操作此酒店或酒店不存在' })
        return
      }

      // Update
      await pool.execute(
        `UPDATE hotel 
         SET name = ?, address = ?, city_name = ?, latitude = ?, longitude = ?,
             star_rating = ?, tags = ?, description = ?, hotel_type = ?, 
             open_time = ?, close_time = ?, remark = ?,
             status = 0, rejection_reason = NULL
         WHERE hotel_id = ?`,
        [
          name,
          address,
          city_name || null,
          latitude || null,
          longitude || null,
          star_rating || null,
          tagsJson,
          description || null,
          hotel_type || null,
          open_time || null,
          close_time || null,
          remark || null,
          hotel_id,
        ],
      )

      res.status(200).json({ message: '酒店信息更新成功，已重新提交审核', data: { hotel_id } })
    } else {
      // Insert
      const new_hotel_id = `H_${Date.now()}_${crypto.randomUUID().substring(0, 6)}`
      await pool.execute(
        `INSERT INTO hotel 
         (hotel_id, user_id, name, address, city_name, latitude, longitude, star_rating, tags, description, hotel_type, created_at, status, open_time, close_time, remark)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 0, ?, ?, ?)`,
        [
          new_hotel_id,
          user_id,
          name,
          address || null,
          city_name || null,
          latitude || null,
          longitude || null,
          star_rating || null,
          tagsJson,
          description || null,
          hotel_type || null,
          open_time || null,
          close_time || null,
          remark || null,
        ],
      )

      res.status(200).json({ message: '酒店信息创建成功', data: { hotel_id: new_hotel_id } })
    }
  } catch (err) {
    console.error('saveMerchantHotel error:', err)
    res.status(500).json({ message: '保存酒店信息失败' })
  }
}

// ===================== 管理酒店图文素材 =====================
export const manageHotelMedia = async (
  req: Request<Record<string, any>, any, ManageHotelMediaBody>,
  res: Response,
): Promise<void> => {
  const { user_id, action, hotel_id, media_id, media_type, url, sort_order, media_name } =
    req.body || {}

  if (!user_id || !action || !hotel_id) {
    res.status(400).json({ message: 'user_id, action, hotel_id 必填' })
    return
  }

  try {
    // 必须先获取商户权限
    const [hotelRows] = await pool.execute<RowDataPacket[]>(
      `SELECT hotel_id FROM hotel WHERE user_id = ? AND hotel_id = ?`,
      [user_id, hotel_id],
    )

    if (hotelRows.length === 0) {
      res.status(403).json({ message: '无权操作此酒店或酒店资料不存在' })
      return
    }

    if (action === 'delete') {
      if (!media_id) {
        res.status(400).json({ message: '删除文件需提供 media_id' })
        return
      }

      await pool.execute(
        `DELETE FROM hotel_media WHERE media_id = ? AND hotel_id = ?`,
        [media_id, hotel_id], // 加上 hotel_id 防止串改
      )

      res.status(200).json({ message: '删除成功' })
    } else if (action === 'add') {
      if (!url || !media_type) {
        res.status(400).json({ message: '新增文件需提供 url 和 media_type' })
        return
      }

      const new_media_id = `HM_${Date.now()}_${crypto.randomUUID().substring(0, 6)}`

      await pool.execute(
        `INSERT INTO hotel_media (media_id, hotel_id, media_type, url, sort_order, media_name)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [new_media_id, hotel_id, media_type, url, sort_order || 0, media_name || ''],
      )

      res.status(200).json({ message: '添加成功', data: { media_id: new_media_id } })
    } else {
      res.status(400).json({ message: '无效的 action' })
    }
  } catch (err) {
    console.error('manageHotelMedia error:', err)
    res.status(500).json({ message: '管理素材失败' })
  }
}

// ===================== 删除商户酒店 =====================
export const deleteMerchantHotel = async (
  req: Request<Record<string, any>, any, { user_id: string; hotel_id: string }>,
  res: Response,
): Promise<void> => {
  const { user_id, hotel_id } = req.body

  if (!user_id || !hotel_id) {
    res.status(400).json({ message: 'user_id 和 hotel_id 为必填项' })
    return
  }

  try {
    // 检查权限
    const [existing] = await pool.execute<RowDataPacket[]>(
      `SELECT hotel_id FROM hotel WHERE user_id = ? AND hotel_id = ?`,
      [user_id, hotel_id],
    )

    if (existing.length === 0) {
      res.status(403).json({ message: '无权操作此酒店或酒店不存在' })
      return
    }

    // 删除酒店本身及关联库
    await pool.execute(`DELETE FROM hotel WHERE hotel_id = ?`, [hotel_id])
    await pool.execute(`DELETE FROM hotel_media WHERE hotel_id = ?`, [hotel_id])

    res.status(200).json({ message: '酒店删除成功' })
  } catch (err) {
    console.error('deleteMerchantHotel error:', err)
    res.status(500).json({ message: '删除酒店失败' })
  }
}

// ===================== 管理员：获取待审核酒店列表 =====================
export const getAuditList = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT h.*, u.username AS merchant_name
       FROM hotel h
       LEFT JOIN users u ON h.user_id = u.user_id
       WHERE h.status = 0
       ORDER BY h.created_at DESC`,
    )

    // 为每个酒店附加 media
    const hotels = []
    for (const h of rows) {
      const hotelInfo = { ...h }
      const [mediaRows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM hotel_media WHERE hotel_id = ? ORDER BY sort_order ASC`,
        [hotelInfo.hotel_id],
      )
      hotelInfo.media = mediaRows
      hotels.push(hotelInfo)
    }

    // 统计数据
    const [totalResult] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS cnt FROM hotel WHERE status = 0`,
    )
    const totalPending = totalResult[0]?.cnt || 0

    // 今日新增
    const [todayResult] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS cnt FROM hotel WHERE status = 0 AND DATE(created_at) = CURDATE()`,
    )
    const todayNew = todayResult[0]?.cnt || 0

    // 已审核总数
    const [reviewedResult] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS cnt FROM hotel WHERE status IN (1, 2)`,
    )
    const totalReviewed = reviewedResult[0]?.cnt || 0

    res.status(200).json({
      message: '获取待审核列表成功',
      data: hotels,
      stats: { totalPending, todayNew, totalReviewed },
    })
  } catch (err) {
    console.error('getAuditList error:', err)
    res.status(500).json({ message: '获取待审核列表失败' })
  }
}

// ===================== 管理员：审核酒店（通过/驳回） =====================
export const auditHotel = async (req: Request, res: Response): Promise<void> => {
  const { hotel_id, action, rejection_reason } = req.body as {
    hotel_id: string
    action: 'approve' | 'reject'
    rejection_reason?: string
  }

  if (!hotel_id || !action) {
    res.status(400).json({ message: 'hotel_id 和 action 为必填项' })
    return
  }

  if (action !== 'approve' && action !== 'reject') {
    res.status(400).json({ message: 'action 必须为 approve 或 reject' })
    return
  }

  try {
    const newStatus = action === 'approve' ? 1 : 2
    const reason = action === 'reject' ? rejection_reason || '未提供原因' : null

    await pool.execute(`UPDATE hotel SET status = ?, rejection_reason = ? WHERE hotel_id = ?`, [
      newStatus,
      reason,
      hotel_id,
    ])

    res.status(200).json({
      message: action === 'approve' ? '审核通过' : '已驳回',
      data: { hotel_id, status: newStatus },
    })
  } catch (err) {
    console.error('auditHotel error:', err)
    res.status(500).json({ message: '审核操作失败' })
  }
}

// =========================================
// 3. 房型管理 (Room & Media)
// =========================================

export interface SaveRoomBody extends MerchantAuthBody {
  room_id?: string // 有则是更新，无则是新建
  name: string
  room_type: number
  has_breakfast: number // 1 / 0
  max_occupancy: number
  area: number
  ori_price: number
  floor: unknown
  has_window: number // 1 / 0
  add_bed: number // 1 / 0
  has_wifi: number // 1 / 0
  remark: string
  room_bed: string
}

export interface DeleteRoomBody extends MerchantAuthBody {
  room_id: string
}

export interface ManageRoomMediaBody extends MerchantAuthBody {
  action: 'add' | 'delete'
  room_id: string
  media_id?: string
  url?: string
  sort_order?: number
}

// ===================== 获取房型列表 =====================
export const getRoomList = async (
  req: Request<Record<string, any>, any, MerchantAuthBody>,
  res: Response,
): Promise<void> => {
  const { user_id } = req.body

  if (!user_id) {
    res.status(400).json({ message: '缺少 user_id' })
    return
  }

  try {
    const [hotelRows] = await pool.execute<RowDataPacket[]>(
      `SELECT hotel_id FROM hotel WHERE user_id = ? LIMIT 1`,
      [user_id],
    )

    if (hotelRows.length === 0) {
      res.status(400).json({ message: '请先完善酒店基础信息' })
      return
    }

    const hotel_id = hotelRows[0].hotel_id

    const [rooms] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM room WHERE hotel_id = ? ORDER BY ori_price ASC`,
      [hotel_id],
    )

    // 获取对应的媒体信息
    for (const r of rooms) {
      const [media] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM room_media WHERE room_id = ? ORDER BY sort_order ASC`,
        [r.room_id],
      )
      r.media = media

      // parse floor from JSON string if needed
      if (typeof r.floor === 'string') {
        try {
          r.floor = JSON.parse(r.floor)
        } catch {}
      }
    }

    res.status(200).json({ message: '获取房型列表成功', data: rooms })
  } catch (err) {
    console.error('getRoomList error:', err)
    res.status(500).json({ message: '获取房型列表失败' })
  }
}

// ===================== 保存房型信息 =====================
export const saveRoom = async (
  req: Request<Record<string, any>, any, SaveRoomBody>,
  res: Response,
): Promise<void> => {
  const {
    user_id,
    room_id,
    name,
    room_type,
    has_breakfast,
    max_occupancy,
    area,
    ori_price,
    floor,
    has_window,
    add_bed,
    has_wifi,
    remark,
    room_bed,
  } = req.body

  if (!user_id || !name) {
    res.status(400).json({ message: '缺少必须字段' })
    return
  }

  try {
    const [hotelRows] = await pool.execute<RowDataPacket[]>(
      `SELECT hotel_id FROM hotel WHERE user_id = ? LIMIT 1`,
      [user_id],
    )

    if (hotelRows.length === 0) {
      res.status(400).json({ message: '请先完善酒店基础信息' })
      return
    }

    const hotel_id = hotelRows[0].hotel_id
    const floorJson = typeof floor === 'object' ? JSON.stringify(floor) : floor || '[]'

    if (room_id) {
      // 检查房型归属
      const [checkRows] = await pool.execute<RowDataPacket[]>(
        `SELECT * FROM room WHERE room_id = ? AND hotel_id = ?`,
        [room_id, hotel_id],
      )
      if (checkRows.length === 0) {
        res.status(403).json({ message: '无权操作此房型' })
        return
      }

      await pool.execute(
        `UPDATE room 
         SET name = ?, room_type = ?, has_breakfast = ?, max_occupancy = ?, 
             area = ?, ori_price = ?, floor = ?, has_window = ?,
             add_bed = ?, has_wifi = ?, remark = ?, room_bed = ?
         WHERE room_id = ?`,
        [
          name,
          room_type || 1,
          has_breakfast || 0,
          max_occupancy || 2,
          area || 20,
          ori_price || 0,
          floorJson,
          has_window || 0,
          add_bed || 0,
          has_wifi || 0,
          remark || '',
          room_bed || '',
          room_id,
        ],
      )
      res.status(200).json({ message: '房型更新成功', data: { room_id } })
    } else {
      const new_room_id = `R_${Date.now()}_${crypto.randomUUID().substring(0, 6)}`
      await pool.execute(
        `INSERT INTO room (room_id, hotel_id, name, room_type, has_breakfast, max_occupancy, area, ori_price, floor, has_window, add_bed, has_wifi, remark, room_bed)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          new_room_id,
          hotel_id,
          name,
          room_type || 1,
          has_breakfast || 0,
          max_occupancy || 2,
          area || 20,
          ori_price || 0,
          floorJson,
          has_window || 0,
          add_bed || 0,
          has_wifi || 0,
          remark || '',
          room_bed || '',
        ],
      )
      res.status(200).json({ message: '房型创建成功', data: { room_id: new_room_id } })
    }
  } catch (err) {
    console.error('saveRoom error:', err)
    res.status(500).json({ message: '保存房型失败' })
  }
}

// ===================== 删除房型 =====================
export const deleteRoom = async (
  req: Request<Record<string, any>, any, DeleteRoomBody>,
  res: Response,
): Promise<void> => {
  const { user_id, room_id } = req.body

  if (!user_id || !room_id) {
    res.status(400).json({ message: '缺少必须字段' })
    return
  }

  try {
    const [hotelRows] = await pool.execute<RowDataPacket[]>(
      `SELECT hotel_id FROM hotel WHERE user_id = ?`,
      [user_id],
    )
    if (hotelRows.length === 0) return

    const hotel_id = hotelRows[0].hotel_id

    // Check ownership
    const [roomRows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM room WHERE room_id = ? AND hotel_id = ?`,
      [room_id, hotel_id],
    )
    if (roomRows.length === 0) {
      res.status(403).json({ message: '无权操作或房型不存在' })
      return
    }

    // 简单硬删除。如果要软删除需要加状态字段。连带删除媒体和库存。
    await pool.execute(`DELETE FROM room_inventory WHERE room_id = ?`, [room_id])
    await pool.execute(`DELETE FROM room_media WHERE room_id = ?`, [room_id])
    await pool.execute(`DELETE FROM room WHERE room_id = ?`, [room_id])

    res.status(200).json({ message: '删除房型成功' })
  } catch (err) {
    console.error('deleteRoom error:', err)
    res.status(500).json({ message: '删除房型失败' })
  }
}

// ===================== 管理房型图文素材 =====================
export const manageRoomMedia = async (
  req: Request<Record<string, any>, any, ManageRoomMediaBody>,
  res: Response,
): Promise<void> => {
  const { user_id, action, room_id, media_id, url, sort_order } = req.body

  if (!user_id || !action || !room_id) {
    res.status(400).json({ message: '缺少关键参数' })
    return
  }

  try {
    const [hotelRows] = await pool.execute<RowDataPacket[]>(
      `SELECT hotel_id FROM hotel WHERE user_id = ?`,
      [user_id],
    )
    if (hotelRows.length === 0) return
    const hotel_id = hotelRows[0].hotel_id

    const [roomRows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM room WHERE room_id = ? AND hotel_id = ?`,
      [room_id, hotel_id],
    )
    if (roomRows.length === 0) {
      res.status(403).json({ message: '无权操作或房型不存在' })
      return
    }

    if (action === 'delete') {
      await pool.execute(`DELETE FROM room_media WHERE media_id = ? AND room_id = ?`, [
        media_id,
        room_id,
      ])
      res.status(200).json({ message: '删除成功' })
    } else if (action === 'add') {
      const new_media_id = `RM_${Date.now()}_${crypto.randomUUID().substring(0, 6)}`
      await pool.execute(
        `INSERT INTO room_media (media_id, room_id, url, sort_order) VALUES (?, ?, ?, ?)`,
        [new_media_id, room_id, url, sort_order || 0],
      )
      res.status(200).json({ message: '添加成功', data: { media_id: new_media_id } })
    }
  } catch (err) {
    console.error('manageRoomMedia error:', err)
    res.status(500).json({ message: '管理房型图片失败' })
  }
}

// =========================================
// 4. 房态与价格库存管理 (Room Inventory)
// =========================================

export interface GetInventoryBody extends MerchantAuthBody {
  room_id: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
}

export interface InventoryUpdateItem {
  date: string // YYYY-MM-DD
  stock: number
  price: number
}

export interface BatchUpdateInventoryBody extends MerchantAuthBody {
  room_id: string
  updates: InventoryUpdateItem[]
}

// ===================== 获取单月库存 =====================
export const getInventory = async (
  req: Request<Record<string, any>, any, GetInventoryBody>,
  res: Response,
): Promise<void> => {
  const { user_id, room_id, startDate, endDate } = req.body

  if (!user_id || !room_id || !startDate || !endDate) {
    res.status(400).json({ message: '缺少参数' })
    return
  }

  try {
    const [roomRows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM room WHERE room_id = ? AND hotel_id IN (SELECT hotel_id FROM hotel WHERE user_id = ?)`,
      [room_id, user_id],
    )
    if (roomRows.length === 0) {
      res.status(403).json({ message: '房间不属于该商户' })
      return
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT DATE_FORMAT(date, '%Y-%m-%d') as date, stock, price 
       FROM room_inventory 
       WHERE room_id = ? AND date >= ? AND date <= ?
       ORDER BY date ASC`,
      [room_id, startDate, endDate],
    )

    res.status(200).json({ message: '查询成功', data: rows })
  } catch (err) {
    console.error('getInventory error:', err)
    res.status(500).json({ message: '获取库存失败' })
  }
}

// ===================== 批量更新库存 =====================
export const batchUpdateInventory = async (
  req: Request<Record<string, any>, any, BatchUpdateInventoryBody>,
  res: Response,
): Promise<void> => {
  const { user_id, room_id, updates } = req.body

  if (!user_id || !room_id || !updates || !Array.isArray(updates)) {
    res.status(400).json({ message: '缺少必要参数或 updates 格式不正确' })
    return
  }

  try {
    const [hotelRows] = await pool.execute<RowDataPacket[]>(
      `SELECT hotel_id FROM hotel WHERE user_id = ?`,
      [user_id],
    )
    if (hotelRows.length === 0) return
    const hotel_id = hotelRows[0].hotel_id

    const [roomRows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM room WHERE room_id = ? AND hotel_id = ?`,
      [room_id, hotel_id],
    )
    if (roomRows.length === 0) {
      res.status(403).json({ message: '无权操作此房间库存' })
      return
    }

    for (const item of updates) {
      const { date, stock, price } = item
      const inv_id = `INV_${Date.now()}_${crypto.randomUUID().substring(0, 6)}`

      // UPSERT logic: ON DUPLICATE KEY UPDATE
      await pool.execute(
        `INSERT INTO room_inventory (inventory_id, room_id, date, stock, price)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE stock = VALUES(stock), price = VALUES(price)`,
        [inv_id, room_id, date, stock, price],
      )
    }

    res.status(200).json({ message: '库存及价格更新成功' })
  } catch (err) {
    console.error('batchUpdateInventory error:', err)
    res.status(500).json({ message: '更新库存失败' })
  }
}

// =========================================
// 5. 订单管理 (Merchant Orders)
// =========================================

export interface GetMerchantOrdersBody extends MerchantAuthBody {
  status?: number
  // can extend with pagination if needed
}

export interface UpdateOrderStatusBody extends MerchantAuthBody {
  order_id: string
  status: number // e.g. 1 确认 2 拒绝 etc
}

// ===================== 获取订单列表 =====================
export const getMerchantOrders = async (
  req: Request<Record<string, any>, any, GetMerchantOrdersBody>,
  res: Response,
): Promise<void> => {
  const { user_id, status } = req.body

  if (!user_id) {
    res.status(400).json({ message: '缺少 user_id' })
    return
  }

  try {
    const [hotelRows] = await pool.execute<RowDataPacket[]>(
      `SELECT hotel_id FROM hotel WHERE user_id = ?`,
      [user_id],
    )
    if (hotelRows.length === 0) {
      res.status(200).json({ message: '未找到酒店', data: [] })
      return
    }
    const hotel_id = hotelRows[0].hotel_id

    let query = `
      SELECT o.*, r.name as room_name, DATE_FORMAT(o.created_at, '%Y-%m-%d %H:%i:%s') as created_at_str,
             DATE_FORMAT(o.check_in, '%Y-%m-%d') as check_in_str, DATE_FORMAT(o.check_out, '%Y-%m-%d') as check_out_str
      FROM orders o
      LEFT JOIN room r ON o.room_id = r.room_id
      WHERE o.hotel_id = ?
    `
    const params: unknown[] = [hotel_id]

    if (status !== undefined) {
      query += ` AND o.status = ?`
      params.push(status)
    }

    query += ` ORDER BY o.created_at DESC`

    const [rows] = await pool.execute<RowDataPacket[]>(query, params)

    res.status(200).json({ message: '获取订单成功', data: rows })
  } catch (err) {
    console.error('getMerchantOrders error:', err)
    res.status(500).json({ message: '获取订单失败' })
  }
}

// ===================== 更新订单状态 =====================
export const updateOrderStatus = async (
  req: Request<{}, {}, UpdateOrderStatusBody>,
  res: Response,
): Promise<void> => {
  const { user_id, order_id, status } = req.body

  if (!user_id || !order_id || status === undefined) {
    res.status(400).json({ message: '缺少必填字段' })
    return
  }

  try {
    const [hotelRows] = await pool.execute<RowDataPacket[]>(
      `SELECT hotel_id FROM hotel WHERE user_id = ?`,
      [user_id],
    )
    if (hotelRows.length === 0) return
    const hotel_id = hotelRows[0].hotel_id

    const [orderRows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM orders WHERE order_id = ? AND hotel_id = ?`,
      [order_id, hotel_id],
    )
    if (orderRows.length === 0) {
      res.status(403).json({ message: '无权操作此订单或订单不存在' })
      return
    }

    await pool.execute(`UPDATE orders SET status = ? WHERE order_id = ?`, [status, order_id])

    res.status(200).json({ message: '订单状态更新成功' })
  } catch (err) {
    console.error('updateOrderStatus error:', err)
    res.status(500).json({ message: '更新订单状态失败' })
  }
}

// =========================================
// 6. 评价管理 (Merchant Reviews)
// =========================================

// ===================== 获取评论列表 =====================
export const getMerchantReviews = async (
  req: Request<{}, {}, MerchantAuthBody>,
  res: Response,
): Promise<void> => {
  const { user_id } = req.body

  if (!user_id) {
    res.status(400).json({ message: '缺少 user_id' })
    return
  }

  try {
    const [hotelRows] = await pool.execute<RowDataPacket[]>(
      `SELECT hotel_id FROM hotel WHERE user_id = ?`,
      [user_id],
    )
    if (hotelRows.length === 0) {
      res.status(200).json({ message: '未找到酒店', data: [] })
      return
    }
    const hotel_id = hotelRows[0].hotel_id

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT r.*, u.username, DATE_FORMAT(r.created_at, '%Y-%m-%d %H:%i:%s') as created_at_str
       FROM reviews r
       LEFT JOIN users u ON r.user_id = u.user_id
       WHERE r.hotel_id = ?
       ORDER BY r.created_at DESC`,
      [hotel_id],
    )

    res.status(200).json({ message: '获取评价成功', data: rows })
  } catch (err) {
    console.error('getMerchantReviews error:', err)
    res.status(500).json({ message: '获取评价失败' })
  }
}
