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
            SELECT user_id, username, email, idcard, role, avatar, created_at, status, points
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