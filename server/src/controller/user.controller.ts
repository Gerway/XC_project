import { Request, Response } from 'express';
import pool from '../db';
import { RowDataPacket } from 'mysql2';

// 获取当前登录用户信息的接口
export const getUserProfile = async (
    req: Request,
    res: Response
): Promise<void> => {
    //  req.userId 在 verifyToken 解密并挂载的
    const userId = req.userId;

    try {
        // 查询数据库
        const sql = `
            SELECT user_id, username, email, idcard, role, avatar, created_at, status, points, phone
            FROM users 
            WHERE user_id = ?
        `;

        const [rows] = await pool.execute<RowDataPacket[]>(sql, [userId]);

        if (rows.length === 0) {
            res.status(404).json({ message: "用户不存在！" });
            return;
        }

        const user = rows[0];

        // 检查状态，如果用户已经被封禁，可以直接返回提示
        if (user.status !== 1) {
            res.status(403).json({ message: "您的账号已被封禁！" });
            return;
        }

        // 成功，将用户信息返回给前端
        res.status(200).json(user);

    } catch (err) {
        console.error("获取用户信息报错:", err);
        res.status(500).json({ message: "服务器内部错误，获取用户信息失败！" });
    }
};

// ===================== 浏览历史 =====================

// 添加浏览历史（进入酒店详情时调用）
export const addViewHistory = async (
    req: Request<{}, {}, { user_id: string; hotel_id: string }>,
    res: Response
): Promise<void> => {
    const { user_id, hotel_id } = req.body;

    if (!user_id || !hotel_id) {
        res.status(400).json({ message: '缺少必要参数' });
        return;
    }

    try {
        // 检查是否已存在该记录
        const [existing] = await pool.execute<RowDataPacket[]>(
            `SELECT history_id FROM view_history WHERE user_id = ? AND hotel_id = ?`,
            [user_id, hotel_id]
        );

        if (existing.length > 0) {
            // 已存在，更新浏览时间
            await pool.execute(
                `UPDATE view_history SET viewed_at = NOW() WHERE user_id = ? AND hotel_id = ?`,
                [user_id, hotel_id]
            );
        } else {
            // 不存在，插入新记录
            const history_id = `VH_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
            await pool.execute(
                `INSERT INTO view_history (history_id, user_id, hotel_id, viewed_at) VALUES (?, ?, ?, NOW())`,
                [history_id, user_id, hotel_id]
            );
        }

        res.status(200).json({ message: '浏览记录已更新' });
    } catch (err) {
        console.error('addViewHistory error:', err);
        res.status(500).json({ message: '记录浏览历史失败' });
    }
};

// 获取用户浏览历史列表
export const getViewHistory = async (
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
                vh.hotel_id,
                DATE_FORMAT(vh.viewed_at, '%Y-%m-%d %H:%i:%s') as viewed_at,
                h.name AS hotel_name,
                h.address AS hotel_address,
                h.score,
                h.reviews,
                h.tags,
                (SELECT MIN(ri.price) FROM room_inventory ri 
                 JOIN room r ON ri.room_id = r.room_id 
                 WHERE r.hotel_id = h.hotel_id) AS min_price,
                (SELECT hm.url FROM hotel_media hm WHERE hm.hotel_id = h.hotel_id ORDER BY hm.sort_order ASC LIMIT 1) AS image_url
             FROM view_history vh
             LEFT JOIN hotel h ON vh.hotel_id = h.hotel_id
             WHERE vh.user_id = ?
             ORDER BY vh.viewed_at DESC`,
            [user_id]
        );

        res.status(200).json({
            message: '查询成功',
            data: rows.map(r => ({
                hotel_id: r.hotel_id,
                hotel_name: r.hotel_name || '未知酒店',
                hotel_address: r.hotel_address || '',
                score: r.score,
                reviews_count: r.reviews || 0,
                tags: r.tags || '[]',
                min_price: Number(r.min_price) || 0,
                image_url: r.image_url || '',
                viewed_at: r.viewed_at
            }))
        });
    } catch (err) {
        console.error('getViewHistory error:', err);
        res.status(500).json({ message: '获取浏览历史失败' });
    }
};

// ===================== 收藏 =====================

// 切换收藏状态（收藏/取消收藏）
export const toggleFavorite = async (
    req: Request<{}, {}, { user_id: string; target_id: string; type: number }>,
    res: Response
): Promise<void> => {
    const { user_id, target_id, type } = req.body;

    if (!user_id || !target_id) {
        res.status(400).json({ message: '缺少必要参数' });
        return;
    }

    try {
        // 查询是否已收藏
        const [existing] = await pool.execute<RowDataPacket[]>(
            `SELECT favorites_id FROM favorites WHERE user_id = ? AND target_id = ? AND type = ?`,
            [user_id, target_id, type || 1]
        );

        if (existing.length > 0) {
            // 已收藏 → 取消收藏
            await pool.execute(
                `DELETE FROM favorites WHERE favorites_id = ?`,
                [existing[0].favorites_id]
            );
            res.status(200).json({ message: '已取消收藏', data: { is_favorite: false } });
        } else {
            // 未收藏 → 添加收藏
            const favorites_id = `FAV_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
            await pool.execute(
                `INSERT INTO favorites (favorites_id, user_id, target_id, type, created_at) VALUES (?, ?, ?, ?, NOW())`,
                [favorites_id, user_id, target_id, type || 1]
            );
            res.status(200).json({ message: '收藏成功', data: { is_favorite: true } });
        }
    } catch (err) {
        console.error('toggleFavorite error:', err);
        res.status(500).json({ message: '操作收藏失败' });
    }
};

// 检查某酒店是否已收藏
export const checkFavorite = async (
    req: Request<{}, {}, { user_id: string; target_id: string; type: number }>,
    res: Response
): Promise<void> => {
    const { user_id, target_id, type } = req.body;

    if (!user_id || !target_id) {
        res.status(400).json({ message: '缺少必要参数' });
        return;
    }

    try {
        const [rows] = await pool.execute<RowDataPacket[]>(
            `SELECT favorites_id FROM favorites WHERE user_id = ? AND target_id = ? AND type = ?`,
            [user_id, target_id, type || 1]
        );

        res.status(200).json({
            message: '查询成功',
            data: { is_favorite: rows.length > 0 }
        });
    } catch (err) {
        console.error('checkFavorite error:', err);
        res.status(500).json({ message: '查询收藏状态失败' });
    }
};

// 获取用户收藏列表
export const getFavorites = async (
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
                f.target_id AS hotel_id,
                DATE_FORMAT(f.created_at, '%Y-%m-%d %H:%i:%s') as created_at,
                h.name AS hotel_name,
                h.address AS hotel_address,
                h.score,
                h.reviews,
                h.tags,
                (SELECT MIN(ri.price) FROM room_inventory ri 
                 JOIN room r ON ri.room_id = r.room_id 
                 WHERE r.hotel_id = h.hotel_id) AS min_price,
                (SELECT hm.url FROM hotel_media hm WHERE hm.hotel_id = h.hotel_id ORDER BY hm.sort_order ASC LIMIT 1) AS image_url
             FROM favorites f
             LEFT JOIN hotel h ON f.target_id = h.hotel_id
             WHERE f.user_id = ? AND f.type = 1
             ORDER BY f.created_at DESC`,
            [user_id]
        );

        res.status(200).json({
            message: '查询成功',
            data: rows.map(r => ({
                hotel_id: r.hotel_id,
                hotel_name: r.hotel_name || '未知酒店',
                hotel_address: r.hotel_address || '',
                score: r.score,
                reviews_count: r.reviews || 0,
                tags: r.tags || '[]',
                min_price: Number(r.min_price) || 0,
                image_url: r.image_url || '',
                created_at: r.created_at
            }))
        });
    } catch (err) {
        console.error('getFavorites error:', err);
        res.status(500).json({ message: '获取收藏列表失败' });
    }
};