import { Request, Response } from 'express';
import pool from '../db';
import { RowDataPacket } from 'mysql2';

interface SearchRequestBody {
    keyword?: string;
    city_name?: string;
    check_in?: string; // YYYY-MM-DD
    check_out?: string; // YYYY-MM-DD
    min_price?: number;
    max_price?: number;
    star_rating?: number[]; // [4, 5]
    room_type?: number;
}

export const searchHotels = async (
    req: Request<{}, {}, SearchRequestBody>,
    res: Response
): Promise<void> => {
    const {
        keyword,
        city_name,
        check_in,
        check_out,
        min_price,
        max_price,
        star_rating,
        room_type
    } = req.body;

    try {
        // 1. 计算入住多少晚 (nights)
        let nights = 1;
        if (check_in && check_out) {
            const start = new Date(check_in);
            const end = new Date(check_out);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (nights === 0) nights = 1; // 至少1晚
        }

        // 2. 构建基础 SQL 和参数
        let sql = `
            SELECT 
                h.hotel_id, 
                h.name, 
                h.address, 
                h.city_name, 
                h.latitude, 
                h.longitude, 
                h.star_rating, 
                h.tags, 
                h.description, 
                h.hotel_type, 
                h.score, 
                h.reviews,
                h.remark,
                MIN(ri.price) as min_price
            FROM hotel h
            INNER JOIN room r ON h.hotel_id = r.hotel_id
            INNER JOIN room_inventory ri ON r.room_id = ri.room_id
            WHERE h.status = 1
        `;

        const params: any[] = [];

        // 3. 各种条件过滤
        if (room_type) {
            sql += ` AND r.room_type = ?`;
            params.push(room_type);
        }

        if (city_name) {
            sql += ` AND h.city_name LIKE ?`;
            params.push(`%${city_name}%`);
        }

        if (keyword) {
            // MySql 5.7+ 原生支持 JSON 函数。但为了稳妥和简单，如果是字符串类型的 JSON，直接用 LIKE 也能查出来，
            // 更好的方式是用 JSON_CONTAINS（如果 tags 是合法的 JSON 数组）。
            // 假设 tags 是形如 '["Jiefangbei", "Luxury"]' 格式的字符串
            sql += ` AND (h.name LIKE ? OR h.address LIKE ? OR h.tags LIKE ?)`;
            const kw = `%${keyword}%`;
            params.push(kw, kw, kw);
        }

        if (star_rating && star_rating.length > 0) {
            const placeholders = star_rating.map(() => '?').join(',');
            sql += ` AND h.star_rating IN (${placeholders})`;
            params.push(...star_rating);
        }

        // 日期过滤：仅关联用户选择日期区间的库存记录
        if (check_in && check_out) {
            sql += ` AND ri.date >= ? AND ri.date < ?`;
            params.push(check_in, check_out);
        }

        // 4. 分组并验证：该房型必须在所选日期区间内 "天天都有库存"，并且 "天天价格都在范围内"
        sql += ` GROUP BY h.hotel_id, r.room_id`;

        let havingConditions = [];

        if (check_in && check_out) {
            // Require inventory rows for ALL nights in the date range
            havingConditions.push(`COUNT(*) = ?`);
            params.push(nights);

            // Also require ALL those nights to have stock > 0
            let stockCondition = `SUM(CASE WHEN ri.stock > 0`;

            if (min_price !== undefined) {
                stockCondition += ` AND ri.price >= ?`;
                params.push(min_price);
            }
            if (max_price !== undefined) {
                stockCondition += ` AND ri.price <= ?`;
                params.push(max_price);
            }

            stockCondition += ` THEN 1 ELSE 0 END) = ?`;
            params.push(nights);

            havingConditions.push(stockCondition);
        } else {
            // 如果没有传日期，直接在这里简单过滤一下整体房价格
            if (min_price !== undefined) {
                havingConditions.push(`MIN(ri.price) >= ?`);
                params.push(min_price);
            }
            if (max_price !== undefined) {
                havingConditions.push(`MIN(ri.price) <= ?`);
                params.push(max_price);
            }
        }

        if (havingConditions.length > 0) {
            sql += ` HAVING ` + havingConditions.join(' AND ');
        }

        // 5. 将根据每一个合格可用房间(room_id)筛选出来的酒店(hotel_id)聚合：
        // 因为上面是 GROUP BY h.hotel_id, r.room_id，这意味着如果一个酒店有3个合格的房型，会返回3条一样的酒店数据（由于分组不同）。
        // 为保证前端列表中酒店不重复，我们可以外套一层查询，对酒店去重，找出真正的 min_price。

        const finalSql = `
            SELECT 
                hotel_id, name, address, city_name, latitude, longitude, 
                star_rating, tags, description, hotel_type, score, reviews, remark,
                MIN(min_price) as min_price,
                (SELECT url FROM hotel_media hm WHERE hm.hotel_id = available_rooms.hotel_id AND hm.media_type = 1 ORDER BY hm.sort_order ASC LIMIT 1) as image_url,
                (SELECT COUNT(*) FROM reviews rev WHERE rev.hotel_id = available_rooms.hotel_id) as real_reviews_count,
                (
                    SELECT r.ori_price 
                    FROM room r 
                    INNER JOIN room_inventory ri ON r.room_id = ri.room_id 
                    WHERE r.hotel_id = available_rooms.hotel_id 
                    ${check_in ? `AND ri.date = '${check_in}'` : ''} 
                    ORDER BY ri.price ASC LIMIT 1
                ) as original_price,
                (
                    SELECT ri.stock 
                    FROM room_inventory ri 
                    INNER JOIN room r ON r.room_id = ri.room_id 
                    WHERE r.hotel_id = available_rooms.hotel_id 
                    ${check_in ? `AND ri.date = '${check_in}'` : ''} 
                    ORDER BY ri.price ASC LIMIT 1
                ) as left_stock
            FROM (${sql}) AS available_rooms
            GROUP BY hotel_id
            ORDER BY score DESC
        `;

        const [rows] = await pool.execute<RowDataPacket[]>(finalSql, params);

        res.status(200).json({
            message: "查询成功",
            data: rows
        });

    } catch (err) {
        console.error("搜索酒店报错:", err);
        res.status(500).json({ message: "内部错误，酒店查询失败！" });
    }
};

interface HotelDetailsBody {
    hotel_id: string;
    check_in?: string; // YYYY-MM-DD
    check_out?: string; // YYYY-MM-DD
}

export const getHotelDetails = async (
    req: Request<{}, {}, HotelDetailsBody>,
    res: Response
): Promise<void> => {
    const { hotel_id, check_in, check_out } = req.body;

    if (!hotel_id) {
        res.status(400).json({ message: "Hotel ID is required" });
        return;
    }

    try {
        // 1. Fetch Basic Hotel Info
        const [hotelRows] = await pool.execute<RowDataPacket[]>(
            `SELECT hotel_id, name, address, city_name, latitude, longitude, 
                    star_rating, tags, description, hotel_type, score, reviews, open_time 
             FROM hotel WHERE hotel_id = ?`,
            [hotel_id]
        );

        if (hotelRows.length === 0) {
            res.status(404).json({ message: "Hotel not found" });
            return;
        }

        const hotelInfo = hotelRows[0];
        const city_name = hotelInfo.city_name;
        const score = hotelInfo.score || 0;

        // 2. Fetch Ranking (City rank and Total rank)
        const [cityRankRows] = await pool.execute<RowDataPacket[]>(
            `SELECT COUNT(*) + 1 as ranking FROM hotel WHERE city_name = ? AND score > ? AND status = 1`,
            [city_name, score]
        );
        const cityRank = (cityRankRows as any)[0].ranking;

        const [totalRankRows] = await pool.execute<RowDataPacket[]>(
            `SELECT COUNT(*) + 1 as ranking FROM hotel WHERE score > ? AND status = 1`,
            [score]
        );
        const totalRank = (totalRankRows as any)[0].ranking;

        // 3. Fetch Hotel Media
        const [mediaRows] = await pool.execute<RowDataPacket[]>(
            `SELECT url, media_type, media_name FROM hotel_media WHERE hotel_id = ? ORDER BY sort_order ASC`,
            [hotel_id]
        );

        // 4. Fetch Rooms (simplified info)
        let roomSql = `
            SELECT 
                r.room_id, r.name, r.area, r.has_breakfast, r.has_window, r.room_bed, r.ori_price,
                ROUND(AVG(ri.price), 2) as avg_price,
                (SELECT url FROM room_media rm WHERE rm.room_id = r.room_id ORDER BY rm.sort_order ASC LIMIT 1) as image_url
            FROM room r
            INNER JOIN room_inventory ri ON r.room_id = ri.room_id
            WHERE r.hotel_id = ?
        `;
        const roomParams: any[] = [hotel_id];

        if (check_in && check_out) {
            roomSql += ` AND ri.date >= ? AND ri.date < ?`;
            roomParams.push(check_in, check_out);

            // Compute length of stay
            const start = new Date(check_in);
            const end = new Date(check_out);
            let nights = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            if (nights === 0) nights = 1;

            roomSql += ` GROUP BY r.room_id HAVING COUNT(*) = ? AND SUM(CASE WHEN ri.stock > 0 THEN 1 ELSE 0 END) = ?`;
            roomParams.push(nights, nights);
        } else {
            // Default to today or simple group by if no dates provided
            roomSql += ` GROUP BY r.room_id`;
        }

        const [roomRows] = await pool.execute<RowDataPacket[]>(roomSql, roomParams);

        // 5. Fetch Top 2 Reviews & Compute Keyword Frequencies
        const [allReviews] = await pool.execute<RowDataPacket[]>(
            `SELECT content, score, created_at, images FROM reviews WHERE hotel_id = ? ORDER BY created_at DESC`,
            [hotel_id]
        );

        const targetKeywords = ['干净', '卫生', '服务', '设施', '环境', '优美', '安静', '隔音', '宽敞', '性价比', '绝景', '绝佳', '便利', '位置', '方便', '舒适', '不错', '好评', '完美', '棒'];
        const keywordCounts: Record<string, number> = {};

        allReviews.forEach(row => {
            const content = row.content || "";
            targetKeywords.forEach(kw => {
                if (content.includes(kw)) {
                    keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
                }
            });
        });

        const sortedKeywords = Object.entries(keywordCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(entry => entry[0]);

        // Just surface the first two reviews for the snippet
        const topReviews = allReviews.slice(0, 2);

        res.status(200).json({
            message: "查询成功",
            data: {
                ...hotelInfo,
                tags: typeof hotelInfo.tags === 'string' ? JSON.parse(hotelInfo.tags) : hotelInfo.tags,
                ranking: {
                    city_rank: cityRank,
                    total_rank: totalRank
                },
                media: mediaRows,
                rooms: roomRows,
                reviews_count: allReviews.length,
                reviews: topReviews,
                review_keywords: sortedKeywords
            }
        });

    } catch (err) {
        console.error("查询酒店详情报错:", err);
        res.status(500).json({ message: "内部错误，酒店详情获取失败！" });
    }
};

interface RoomInventoryBody {
    room_id: string;
    check_in: string; // YYYY-MM-DD  (inclusive)
    check_out: string; // YYYY-MM-DD (exclusive - checkout day)
}

export const getRoomInventory = async (
    req: Request<{}, {}, RoomInventoryBody>,
    res: Response
): Promise<void> => {
    const { room_id, check_in, check_out } = req.body;

    if (!room_id || !check_in || !check_out) {
        res.status(400).json({ message: '缺少必要参数 room_id / check_in / check_out' });
        return;
    }

    try {
        const [rows] = await pool.execute<RowDataPacket[]>(
            `SELECT DATE_FORMAT(date, '%Y-%m-%d') as date_str, price, stock
             FROM room_inventory
             WHERE room_id = ? AND date >= ? AND date < ?
             ORDER BY date ASC`,
            [room_id, check_in, check_out]
        );

        const daily = rows.map(r => ({
            date: r.date_str,
            price: Number(r.price),
            stock: Number(r.stock)
        }));

        const min_stock = daily.length > 0
            ? Math.min(...daily.map(d => d.stock))
            : 0;

        res.status(200).json({ message: '查询成功', data: { daily, min_stock } });
    } catch (err) {
        console.error('getRoomInventory error:', err);
        res.status(500).json({ message: '内部错误，房型库存查询失败' });
    }
};

// ──────────────────────────────────────────────────────────────────
// Order Controllers
// ──────────────────────────────────────────────────────────────────

interface CreateOrderBody {
    user_id: string;
    hotel_id: string;
    room_id: string;
    check_in: string;
    check_out: string;
    nights: number;
    room_count: number;
    total_price: number;
    real_pay: number;
    can_cancel: number;
    special_request?: string;
    daily: DailyDetail[];
}

export const createOrder = async (
    req: Request<{}, {}, CreateOrderBody>,
    res: Response
): Promise<void> => {
    const { user_id, hotel_id, room_id, check_in, check_out, nights, room_count, total_price, real_pay, can_cancel, special_request, daily } = req.body;

    if (!user_id || !hotel_id || !room_id || !check_in || !check_out) {
        res.status(400).json({ message: '缺少必要参数' });
        return;
    }

    try {
        const order_id = `ORD_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        const idcards = JSON.stringify([]);

        await pool.execute(
            `INSERT INTO orders (order_id, user_id, hotel_id, room_id, check_in, check_out, nights, room_count, idcards, special_request, total_price, real_pay, status, created_at, canCancel)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), ?)`,
            [order_id, user_id, hotel_id, room_id,
                `${check_in} 14:00:00`, `${check_out} 12:00:00`,
                nights, room_count, idcards, special_request || '',
                total_price, real_pay, can_cancel]
        );

        if (daily && daily.length > 0) {
            for (let i = 0; i < daily.length; i++) {
                const d = daily[i];
                const cleanDate = d.date.split('T')[0];
                await pool.execute(
                    `INSERT INTO order_details (order_details_id, order_id, order_details_date, price, breakfast_count) VALUES (?, ?, ?, ?, ?)`,
                    [`OD_${order_id}_${i + 1}`, order_id, `${cleanDate} 00:00:00`, d.price, d.breakfast_count]
                );
            }
        }

        res.status(200).json({ message: '订单创建成功', data: { order_id } });
    } catch (err) {
        console.error('createOrder error:', err);
        res.status(500).json({ message: '创建订单失败' });
    }
};

interface DailyDetail {
    date: string;
    price: number;
    breakfast_count: number;
}

interface PayOrderBody {
    order_id: string;
    real_pay: number;
    total_price: number;
    room_count: number;
    special_request?: string;
    idcards: string;
    daily: DailyDetail[];
}

export const payOrder = async (
    req: Request<{}, {}, PayOrderBody>,
    res: Response
): Promise<void> => {
    const { order_id, real_pay, total_price, room_count, special_request, idcards, daily } = req.body;

    if (!order_id) {
        res.status(400).json({ message: '缺少 order_id' });
        return;
    }

    try {
        await pool.execute(
            `UPDATE orders SET status = 1, real_pay = ?, total_price = ?, room_count = ?, special_request = ?, idcards = ?, payed_at = NOW() WHERE order_id = ?`,
            [real_pay, total_price, room_count, special_request || '', idcards || '[]', order_id]
        );

        // 删除旧的明细，重新插入最新的
        await pool.execute(
            `DELETE FROM order_details WHERE order_id = ?`,
            [order_id]
        );

        if (daily && daily.length > 0) {
            for (let i = 0; i < daily.length; i++) {
                const d = daily[i];
                const cleanDate = d.date.split('T')[0];
                await pool.execute(
                    `INSERT INTO order_details (order_details_id, order_id, order_details_date, price, breakfast_count) VALUES (?, ?, ?, ?, ?)`,
                    [`OD_${order_id}_${i + 1}`, order_id, `${cleanDate} 00:00:00`, d.price, d.breakfast_count]
                );
            }
        }

        res.status(200).json({ message: '支付成功', data: { order_id } });
    } catch (err) {
        console.error('payOrder error:', err);
        res.status(500).json({ message: '支付处理失败' });
    }
};

interface UpdatePendingOrderBody {
    order_id: string;
    real_pay: number;
    total_price: number;
    room_count: number;
    special_request?: string;
    idcards: string;
    daily: DailyDetail[];
}

export const updatePendingOrder = async (
    req: Request<{}, {}, UpdatePendingOrderBody>,
    res: Response
): Promise<void> => {
    const { order_id, real_pay, total_price, room_count, special_request, idcards, daily } = req.body;

    if (!order_id) {
        res.status(400).json({ message: '缺少 order_id' });
        return;
    }

    try {
        await pool.execute(
            `UPDATE orders 
             SET real_pay = ?, total_price = ?, room_count = ?, special_request = ?, idcards = ? 
             WHERE order_id = ? AND status = 0`,
            [real_pay, total_price, room_count, special_request || '', idcards || '[]', order_id]
        );

        // 删除旧的明细，重新插入最新的
        await pool.execute(
            `DELETE FROM order_details WHERE order_id = ?`,
            [order_id]
        );

        if (daily && daily.length > 0) {
            for (let i = 0; i < daily.length; i++) {
                const d = daily[i];
                const cleanDate = d.date.split('T')[0];
                await pool.execute(
                    `INSERT INTO order_details (order_details_id, order_id, order_details_date, price, breakfast_count) VALUES (?, ?, ?, ?, ?)`,
                    [`OD_${order_id}_${i + 1}`, order_id, `${cleanDate} 00:00:00`, d.price, d.breakfast_count]
                );
            }
        }

        res.status(200).json({ message: '订单信息更新成功' });
    } catch (err) {
        console.error('updatePendingOrder error:', err);
        res.status(500).json({ message: '更新订单信息失败' });
    }
};

// ===================== 获取用户订单列表 =====================
export const getUserOrders = async (
    req: Request<{}, {}, { user_id: string }>,
    res: Response
): Promise<void> => {
    const { user_id } = req.body;

    if (!user_id) {
        res.status(400).json({ message: '缺少 user_id' });
        return;
    }

    try {
        const [rows] = await pool.execute<RowDataPacket[]>(
            `SELECT 
                o.order_id, o.hotel_id, o.room_id, 
                DATE_FORMAT(o.check_in, '%Y-%m-%d') as check_in, 
                DATE_FORMAT(o.check_out, '%Y-%m-%d') as check_out, 
                o.nights, o.room_count, o.total_price, o.real_pay, o.status, 
                o.created_at, o.canCancel,
                h.name AS hotel_name,
                r.name AS room_name,
                (SELECT hm.url FROM hotel_media hm WHERE hm.hotel_id = o.hotel_id ORDER BY hm.sort_order ASC LIMIT 1) AS hotel_image
             FROM orders o
             LEFT JOIN hotel h ON o.hotel_id = h.hotel_id
             LEFT JOIN room r ON o.room_id = r.room_id
             WHERE o.user_id = ?
             ORDER BY o.created_at DESC`,
            [user_id]
        );

        res.status(200).json({
            message: '查询成功',
            data: rows.map(row => ({
                order_id: row.order_id,
                hotel_id: row.hotel_id,
                hotel_name: row.hotel_name || '未知酒店',
                hotel_image: row.hotel_image || '',
                room_id: row.room_id,
                room_name: row.room_name || '未知房型',
                check_in: row.check_in,
                check_out: row.check_out,
                nights: row.nights,
                room_count: row.room_count || 1,
                total_price: Number(row.total_price) || 0,
                real_pay: Number(row.real_pay) || 0,
                status: row.status,
                created_at: row.created_at,
                canCancel: row.canCancel
            }))
        });
    } catch (err) {
        console.error('getUserOrders error:', err);
        res.status(500).json({ message: '获取订单列表失败' });
    }
};

// ===================== 删除订单 =====================
export const deleteOrder = async (
    req: Request<{}, {}, { order_id: string }>,
    res: Response
): Promise<void> => {
    const { order_id } = req.body;

    if (!order_id) {
        res.status(400).json({ message: '缺少 order_id' });
        return;
    }

    try {
        // 1. 先删除 order_details 中关联的明细
        await pool.execute(
            `DELETE FROM order_details WHERE order_id = ?`,
            [order_id]
        );

        // 2. 再删除 orders 中的订单本身
        await pool.execute(
            `DELETE FROM orders WHERE order_id = ?`,
            [order_id]
        );

        res.status(200).json({ message: '订单删除成功' });
    } catch (err) {
        console.error('deleteOrder error:', err);
        res.status(500).json({ message: '删除订单失败' });
    }
};

// ===================== 取消订单（状态改为4） =====================
export const cancelOrder = async (
    req: Request<{}, {}, { order_id: string }>,
    res: Response
): Promise<void> => {
    const { order_id } = req.body;

    if (!order_id) {
        res.status(400).json({ message: '缺少 order_id' });
        return;
    }

    try {
        await pool.execute(
            `UPDATE orders SET status = 4 WHERE order_id = ? AND status IN (0, 1, 2)`,
            [order_id]
        );

        res.status(200).json({ message: '订单已取消' });
    } catch (err) {
        console.error('cancelOrder error:', err);
        res.status(500).json({ message: '取消订单失败' });
    }
};

// ===================== 获取订单详情 =====================
export const getOrderDetail = async (
    req: Request<{}, {}, { order_id: string }>,
    res: Response
): Promise<void> => {
    const { order_id } = req.body;

    if (!order_id) {
        res.status(400).json({ message: '缺少 order_id' });
        return;
    }

    try {
        // 1. 主订单 + 酒店 + 房间 信息
        const [rows] = await pool.execute<RowDataPacket[]>(
            `SELECT 
                o.*,
                DATE_FORMAT(o.check_in, '%Y-%m-%d') as check_in_str,
                DATE_FORMAT(o.check_out, '%Y-%m-%d') as check_out_str,
                h.name AS hotel_name, h.address AS hotel_address,
                r.name AS room_name, r.area AS room_area, r.room_bed, r.has_window, r.has_breakfast,
                (SELECT hm.url FROM hotel_media hm WHERE hm.hotel_id = o.hotel_id ORDER BY hm.sort_order ASC LIMIT 1) AS hotel_image
             FROM orders o
             LEFT JOIN hotel h ON o.hotel_id = h.hotel_id
             LEFT JOIN room r ON o.room_id = r.room_id
             WHERE o.order_id = ?`,
            [order_id]
        );

        if (rows.length === 0) {
            res.status(404).json({ message: '订单不存在' });
            return;
        }

        const orderRow = rows[0];

        // 2. 订单明细
        const [detailRows] = await pool.execute<RowDataPacket[]>(
            `SELECT DATE_FORMAT(order_details_date, '%Y-%m-%d') as date_str, price, breakfast_count FROM order_details WHERE order_id = ? ORDER BY order_details_date ASC`,
            [order_id]
        );

        res.status(200).json({
            message: '查询成功',
            data: {
                order_id: orderRow.order_id,
                user_id: orderRow.user_id,
                hotel_id: orderRow.hotel_id,
                hotel_name: orderRow.hotel_name || '未知酒店',
                hotel_address: orderRow.hotel_address || '',
                hotel_image: orderRow.hotel_image || '',
                room_id: orderRow.room_id,
                room_name: orderRow.room_name || '未知房型',
                room_area: orderRow.room_area,
                room_bed: orderRow.room_bed,
                has_window: orderRow.has_window,
                has_breakfast: orderRow.has_breakfast,
                check_in: orderRow.check_in_str || orderRow.check_in,
                check_out: orderRow.check_out_str || orderRow.check_out,
                nights: orderRow.nights,
                room_count: orderRow.room_count || 1,
                idcards: orderRow.idcards,
                special_request: orderRow.special_request,
                total_price: Number(orderRow.total_price) || 0,
                real_pay: Number(orderRow.real_pay) || 0,
                status: orderRow.status,
                created_at: orderRow.created_at,
                payed_at: orderRow.payed_at,
                canCancel: orderRow.canCancel,
                details: detailRows.map(d => ({
                    date: d.date_str,
                    price: Number(d.price) || 0,
                    breakfast_count: d.breakfast_count || 0
                }))
            }
        });
    } catch (err) {
        console.error('getOrderDetail error:', err);
        res.status(500).json({ message: '获取订单详情失败' });
    }
};
