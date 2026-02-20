import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken'; // 引入 JWT
import { Request, Response } from 'express';
import crypto from 'crypto'; // Node.js 内置库，用于生成唯一ID
import pool from '../db';     // 引入我们刚才写的 mysql2 连接池
import { RowDataPacket } from 'mysql2';

/*
user表字段:
users {
  user_id string pk
  username string unique
  password string
  email string
  // 角色:用户 商户 管理
  role enum 
  // 身份证号
  idcard string
  avatar string
  created_at datetime
  // 状态 1 正常 2 封禁
  status int
}
*/
interface RegisterRequestBody {
    username: string;
    password: string;
    email: string; // 邮箱 (可选)
    role: '用户' | '商户' | '管理'; // 对应数据库的 ENUM
    idcard?: string
    avatar?: string
}



/*
    注册接口
*/
export const register = async (
    req: Request<{}, {}, RegisterRequestBody>,
    res: Response
): Promise<void> => {
    const { username, email, password, role, avatar } = req.body;

    try {
        // 1 生成全局唯一的 user_id (例如: USR_8f9a3b...)
        const uuid = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
        const userId = `USR_${uuid}`;

        // 2 HASH THE PASSWORD

        const hashedPassword = await bcrypt.hash(password, 10);
        console.log(hashedPassword);
        const createdAt = new Date(); // 当前时间
        // 3 准备 SQL 语句 (使用 ? 占位符防止 SQL 注入)
        const sql = `
            INSERT INTO users 
            (user_id, username, password, idcard, role, created_at, status, email)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        // 按照 ? 的顺序准备对应的值
        const values = [
            userId,
            username,
            hashedPassword,
            null, // idcard初始为null，因为未作实名认证
            role,
            createdAt,
            1, // status=1 表示状态正常
            email
        ];

        // 4 执行插入操作 (使用 execute 性能比 query 更好，因为它有预编译缓存)
        await pool.execute(sql, values);

        // 5 注册成功，开始签发 JWT Token
        const payload = {
            id: userId,
            role: role
        };
        // 签发 token，有效期 7 天
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET as string,
            { expiresIn: '7d' }
        );

        const userInfo = {
            user_id: userId,
            username: username,
            email: email,
            role: role,
            avatar: avatar || null
        };

        // 6. 响应前端
        res.status(201).json({
            message: "注册并登录成功",
            token: token,      // 返回 Token
            user: userInfo     // 返回给 Context 的用户数据
        });

    } catch (err: any) {
        console.error("注册报错:", err);

        // 7. 处理特定数据库错误：区分用户名重复 vs 邮箱重复
        if (err.code === 'ER_DUP_ENTRY') {
            // MySQL 的报错信息通常是：Duplicate entry 'xxx' for key 'users.uk_email' 
            // 或 Duplicate entry 'xxx' for key 'users.username'
            if (err.sqlMessage && err.sqlMessage.includes('email')) {
                res.status(409).json({ message: "该邮箱已被注册，请直接登录或找回密码！" });
            } else {
                res.status(409).json({ message: "用户名已被占用，请换一个！" });
            }
            return;
        }

        res.status(500).json({ message: "服务器内部错误，注册失败！" });
    }
};


interface LoginRequestBody {
    account: string; // 邮箱或用户名 (可选)
    password: string;
    role: '用户' | '商户' | '管理'; // 对应数据库的 ENUM
    remember: boolean; // remember=true，Token 有效期建议设为 7 天，否则 24 小时。
}
// 登录接口
export const login = async (
    req: Request<{}, {}, LoginRequestBody>,
    res: Response
): Promise<void> => {
    const { account, password, role, remember } = req.body;

    try {
        // 1. 检查用户是否存在及 status 是否正常
        // 使用 account 同时去匹配 username 或 email
        const sql = `
            SELECT * FROM users 
            WHERE (username = ? OR email = ?) AND role = ?
        `;
        // 使用 RowDataPacket[] 为查询结果提供类型推导
        const [rows] = await pool.execute<RowDataPacket[]>(sql, [account, account, role]);

        if (rows.length === 0) {
            res.status(401).json({ message: "账号不存在或角色不匹配！" });
            return;
        }

        const user = rows[0];
        // 检查账号状态 (假设 1 是正常，2 是封禁)
        if (user.status !== 1) {
            res.status(403).json({ message: "该账号已被封禁，请联系管理员！" });
            return;
        }

        // 2. 验证密码哈希是否匹配
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            res.status(401).json({ message: "密码错误！" });
            return;
        }

        // 3. GENERATE COOKIE TOKEN AND SEND TO THE USER
        // 计算有效期（毫秒数和 JWT 字符串）
        const age = remember ? 1000 * 60 * 60 * 24 * 7 : 1000 * 60 * 60 * 24; // 7天 vs 1天
        const expiresIn = remember ? '7d' : '1d';

        // 签发 JWT Token
        const token = jwt.sign(
            { id: user.user_id, role: user.role },
            process.env.JWT_SECRET as string,
            { expiresIn }
        );

        // 剔除密码等敏感信息，准备返回给前端的 userInfo
        const { password: _, idcard: __, ...userInfo } = user;

        // 设置 Cookie 并返回响应
        res.cookie('token', token, {
            httpOnly: true, // 防止 XSS 攻击，前端 JS 无法读取此 Cookie
            // secure: process.env.NODE_ENV === 'production', // 如果是 https 生产环境，建议开启
            maxAge: age,
        }).status(200).json({
            message: "登录成功",
            user: userInfo,
            expiresIn: age
        });

    } catch (err) {
        console.error("登录报错:", err);
        res.status(500).json({ message: "服务器内部错误，登录失败！" });
    }
};