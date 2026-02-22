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
            // 必须连住 nights 晚且都有库存
            // SUM() 里判断：如果满足条件则算 1天，最后这些天的和必须等于 nights
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

            roomSql += ` GROUP BY r.room_id HAVING SUM(CASE WHEN ri.stock > 0 THEN 1 ELSE 0 END) = ?`;
            roomParams.push(nights);
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
